package mcptransport

// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import (
	"archive/tar"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/moby/buildkit/client"
)

type Input struct {
	DockerFile    string `json:"docker_file" jsonschema:"raw Dockerfile contents for deployment"`
	BuildContents bytes.Buffer
}

type Output struct {
	Stdout        string `json:"standard_out" jsonschema:"container standard output"`
	Stderr        string `json:"standard_error" jsonschema:"container error output"`
	BuildLogs     string `json:"build_logs" jsonschema:"build output logs"`
	BuildFailed   bool   `json:"build_failed" jsonschema:"whether the build failed"`
	ContainerName string `json:"container_name" jsonschema:"container name"`
	ContainerID   string `json:"container_id" jsonschema:"container ID"`
	ImageName     string `json:"image_name" jsonschema:"image name"`
	ImageID       string `json:"image_id" jsonschema:"image ID"`
}

func DeployContainer(ctx context.Context, req *mcp.CallToolRequest, input Input) (*mcp.CallToolResult, Output, error) {
	ctx = context.Background()
	if strings.TrimSpace(input.DockerFile) == "" {
		return nil, Output{}, fmt.Errorf("docker_file is required")
	}

	var buildContext bytes.Buffer
	tarWriter := tar.NewWriter(&buildContext)
	if input.BuildContents.Len() > 0 {
		tarReader := tar.NewReader(bytes.NewReader(input.BuildContents.Bytes()))
		for {
			header, err := tarReader.Next()
			if err == io.EOF {
				break
			}
			if err != nil {
				log.Printf("DeployContainer: failed to read build context: %v", err)
				return nil, Output{BuildFailed: true}, fmt.Errorf("read build context: %w", err)
			}
			if header.Name == "Dockerfile" {
				continue
			}
			if err := tarWriter.WriteHeader(header); err != nil {
				log.Printf("DeployContainer: failed to write tar header %s: %v", header.Name, err)
				return nil, Output{BuildFailed: true}, fmt.Errorf("write tar header: %w", err)
			}
			if header.Typeflag == tar.TypeReg || header.Typeflag == tar.TypeRegA {
				if _, err := io.Copy(tarWriter, tarReader); err != nil {
					log.Printf("DeployContainer: failed to copy build context file %s: %v", header.Name, err)
					return nil, Output{BuildFailed: true}, fmt.Errorf("copy build context file: %w", err)
				}
			}
		}
	}
	dockerfileContents := []byte(input.DockerFile)
	if err := tarWriter.WriteHeader(&tar.Header{
		Name: "Dockerfile",
		Mode: 0o644,
		Size: int64(len(dockerfileContents)),
	}); err != nil {
		log.Printf("DeployContainer: failed to write Dockerfile header: %v", err)
		return nil, Output{BuildFailed: true}, fmt.Errorf("write Dockerfile header: %w", err)
	}
	if _, err := tarWriter.Write(dockerfileContents); err != nil {
		log.Printf("DeployContainer: failed to write Dockerfile contents: %v", err)
		return nil, Output{BuildFailed: true}, fmt.Errorf("write Dockerfile contents: %w", err)
	}
	if err := tarWriter.Close(); err != nil {
		log.Printf("DeployContainer: failed to close tar writer: %v", err)
		return nil, Output{BuildFailed: true}, fmt.Errorf("close tar writer: %w", err)
	}

	imageName := "mcp-image-" + uuid.NewString()
	imageRef, buildStdout, buildStderr, err := buildImageWithBuildkit(ctx, imageName, &buildContext)
	if err != nil {
		return nil, Output{
			Stdout:      buildStdout,
			Stderr:      buildStderr,
			BuildLogs:   buildStdout,
			BuildFailed: true,
		}, err
	}

	podName := "mcp-pod-" + uuid.NewString()
	podUID, err := createKubernetesPod(ctx, podName, imageRef, input.DockerFile)
	if err != nil {
		log.Printf("DeployContainer: failed to create pod: %v", err)
		return nil, Output{
			Stdout:      buildStdout,
			Stderr:      buildStderr,
			BuildLogs:   buildStdout,
			BuildFailed: true,
		}, err
	}

	return nil, Output{
		Stdout:        buildStdout,
		Stderr:        buildStderr,
		BuildLogs:     buildStdout,
		BuildFailed:   false,
		ContainerName: podName,
		ContainerID:   podUID,
		ImageName:     imageRef,
		ImageID:       imageRef,
	}, nil
}

func addDirectoryToTar(tw *tar.Writer, sourceDir, tarPrefix string) error {
	return filepath.WalkDir(sourceDir, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}
		if relPath == "." {
			relPath = ""
		}
		tarPath := filepath.ToSlash(filepath.Join(tarPrefix, relPath))
		if entry.IsDir() {
			if tarPath != "" && !strings.HasSuffix(tarPath, "/") {
				tarPath += "/"
			}
			if tarPath != "" {
				header := &tar.Header{
					Name:     tarPath,
					Typeflag: tar.TypeDir,
					Mode:     int64(info.Mode().Perm()),
				}
				return tw.WriteHeader(header)
			}
			return nil
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		header := &tar.Header{
			Name:    tarPath,
			Mode:    int64(info.Mode().Perm()),
			Size:    info.Size(),
			ModTime: info.ModTime(),
		}
		if err := tw.WriteHeader(header); err != nil {
			return err
		}
		_, err = io.Copy(tw, file)
		return err
	})
}

func buildImageWithBuildkit(ctx context.Context, imageName string, buildContext *bytes.Buffer) (string, string, string, error) {
	registry := strings.TrimSpace(os.Getenv("MCP_IMAGE_REGISTRY"))
	if registry == "" {
		return "", "", "", fmt.Errorf("MCP_IMAGE_REGISTRY is required to push images from the cluster")
	}
	buildkitAddr := strings.TrimSpace(os.Getenv("BUILDKIT_ADDR"))
	if buildkitAddr == "" {
		return "", "", "", fmt.Errorf("BUILDKIT_ADDR is required to connect to buildkitd")
	}
	tempDir, err := os.MkdirTemp("", "mcp-buildkit-")
	if err != nil {
		return "", "", "", fmt.Errorf("create build context dir: %w", err)
	}
	defer os.RemoveAll(tempDir)

	if err := extractTarToDir(bytes.NewReader(buildContext.Bytes()), tempDir); err != nil {
		return "", "", "", fmt.Errorf("extract build context: %w", err)
	}

	imageRef := fmt.Sprintf("%s/%s", strings.TrimSuffix(registry, "/"), imageName)

	var opts []client.ClientOpt
	if certPath := strings.TrimSpace(os.Getenv("BUILDKIT_TLS_CERT")); certPath != "" {
		keyPath := strings.TrimSpace(os.Getenv("BUILDKIT_TLS_KEY"))
		if keyPath == "" {
			return "", "", "", fmt.Errorf("BUILDKIT_TLS_KEY must be set when BUILDKIT_TLS_CERT is provided")
		}
		opts = append(opts, client.WithCredentials(certPath, keyPath))
	}
	if caPath := strings.TrimSpace(os.Getenv("BUILDKIT_TLS_CA")); caPath != "" {
		serverName := strings.TrimSpace(os.Getenv("BUILDKIT_TLS_SERVER_NAME"))
		opts = append(opts, client.WithServerConfig(serverName, caPath))
	}
	bkClient, err := client.New(ctx, buildkitAddr, opts...)
	if err != nil {
		return "", "", "", fmt.Errorf("connect to buildkit: %w", err)
	}
	defer bkClient.Close()

	statusCh := make(chan *client.SolveStatus)
	var buildLogs bytes.Buffer
	done := make(chan struct{})
	go func() {
		defer close(done)
		vertexNames := map[string]string{}
		for status := range statusCh {
			for _, vertex := range status.Vertexes {
				if vertex.Name != "" {
					vertexNames[vertex.Digest.String()] = vertex.Name
				}
			}
			for _, entry := range status.Logs {
				if len(entry.Data) == 0 {
					continue
				}
				vertexName := vertexNames[entry.Vertex.String()]
				if vertexName == "" {
					vertexName = entry.Vertex.String()
				}
				line := strings.TrimRight(string(entry.Data), "\n")
				if line == "" {
					continue
				}
				fmt.Fprintf(&buildLogs, "[%s][stream:%d] %s\n", vertexName, entry.Stream, line)
				log.Printf("buildkit: [%s][stream:%d] %s", vertexName, entry.Stream, line)
			}
		}
	}()
	closeStatusCh := func() {
		defer func() {
			if recover() != nil {
				// BuildKit may close the channel internally on error.
			}
		}()
		close(statusCh)
	}

	solveOpt := client.SolveOpt{
		Frontend: "dockerfile.v0",
		FrontendAttrs: map[string]string{
			"filename": "Dockerfile",
		},
		LocalDirs: map[string]string{
			"context":    tempDir,
			"dockerfile": tempDir,
		},
		Exports: []client.ExportEntry{
			{
				Type: client.ExporterImage,
				Attrs: map[string]string{
					"name": imageRef,
					"push": "true",
				},
			},
		},
	}
	if strings.EqualFold(strings.TrimSpace(os.Getenv("MCP_IMAGE_REGISTRY_INSECURE")), "true") {
		solveOpt.Exports[0].Attrs["registry.insecure"] = "true"
		solveOpt.Exports[0].Attrs["registry.plainhttp"] = "true"
	}
	if _, err := bkClient.Solve(ctx, nil, solveOpt, statusCh); err != nil {
		closeStatusCh()
		<-done
		return "", buildLogs.String(), "", fmt.Errorf("buildkit build failed: %w", err)
	}
	closeStatusCh()
	<-done

	return imageRef, buildLogs.String(), "", nil
}

func extractTarToDir(r io.Reader, dest string) error {
	tr := tar.NewReader(r)
	for {
		header, err := tr.Next()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
		cleanName := filepath.Clean(header.Name)
		if filepath.IsAbs(cleanName) || strings.HasPrefix(cleanName, "..") {
			return fmt.Errorf("invalid tar entry: %s", header.Name)
		}
		targetPath := filepath.Join(dest, cleanName)
		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(targetPath, os.FileMode(header.Mode)); err != nil {
				return err
			}
		case tar.TypeReg, tar.TypeRegA:
			if err := os.MkdirAll(filepath.Dir(targetPath), 0o755); err != nil {
				return err
			}
			file, err := os.OpenFile(targetPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, os.FileMode(header.Mode))
			if err != nil {
				return err
			}
			if _, err := io.Copy(file, tr); err != nil {
				file.Close()
				return err
			}
			if err := file.Close(); err != nil {
				return err
			}
		}
	}
}

func createKubernetesPod(ctx context.Context, podName, imageName, dockerfile string) (string, error) {
	namespace, err := resolveKubernetesNamespace()
	if err != nil {
		return "", err
	}

	config, err := rest.InClusterConfig()
	if err != nil {
		return "", fmt.Errorf("create in-cluster config: %w", err)
	}
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return "", fmt.Errorf("create kubernetes client: %w", err)
	}

	pod := &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      podName,
			Namespace: namespace,
			Annotations: map[string]string{
				"mcp.dockerfile": dockerfile,
			},
		},
		Spec: corev1.PodSpec{
			RestartPolicy: corev1.RestartPolicyNever,
			Containers: []corev1.Container{
				{
					Name:            "mcp",
					Image:           imageName,
					ImagePullPolicy: corev1.PullIfNotPresent,
				},
			},
		},
	}

	result, err := clientset.CoreV1().Pods(namespace).Create(ctx, pod, metav1.CreateOptions{})
	if err != nil {
		return "", fmt.Errorf("create pod: %w", err)
	}
	if result.UID == "" {
		return "", fmt.Errorf("pod created but UID missing in response")
	}
	return string(result.UID), nil
}

func resolveKubernetesNamespace() (string, error) {
	if namespace := strings.TrimSpace(os.Getenv("MCP_K8S_NAMESPACE")); namespace != "" {
		return namespace, nil
	}
	namespacePath := "/var/run/secrets/kubernetes.io/serviceaccount/namespace"
	if contents, err := os.ReadFile(namespacePath); err == nil {
		if namespace := strings.TrimSpace(string(contents)); namespace != "" {
			return namespace, nil
		}
	}
	return "default", nil
}

type ShutdownInput struct {
	ContainerID string `json:"container_id" jsonschema:"container ID or name to shut down"`
}

type ShutdownOutput struct {
	Message string `json:"message" jsonschema:"shutdown result message"`
}

func ShutdownContainer(ctx context.Context, req *mcp.CallToolRequest, input ShutdownInput) (*mcp.CallToolResult, ShutdownOutput, error) {
	ctx = context.Background()
	config, err := rest.InClusterConfig()
	if err != nil {
		panic(err)
	}
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err)
	}
	namespace, err := resolveKubernetesNamespace()
	if err != nil {
		panic(err)
	}
	if err := clientset.CoreV1().Pods(namespace).Delete(ctx, input.ContainerID, metav1.DeleteOptions{}); err != nil {
		panic(err)
	}

	return nil, ShutdownOutput{
		Message: "pod deleted",
	}, nil
}
