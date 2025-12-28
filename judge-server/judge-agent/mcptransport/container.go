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
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/moby/moby/api/pkg/stdcopy"
	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type Input struct {
	DockerFile    string `json:"docker_file" jsonschema:"raw Dockerfile contents for deployment"`
	BuildContents bytes.Buffer
}

type Output struct {
	Stdout        string `json:"standard_out" jsonschema:"container standard output"`
	Stderr        string `json:"standard_error" jsonschema:"container error output"`
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
	apiClient, err := client.New(client.FromEnv)
	if err != nil {
		panic(err)
	}
	defer apiClient.Close()

	fmt.Println("Beginning Check")
	buildContext := input.BuildContents
	tarWriter := tar.NewWriter(&buildContext)
	dockerfileContents := []byte(input.DockerFile)
	if err := tarWriter.WriteHeader(&tar.Header{
		Name: "Dockerfile",
		Mode: 0o644,
		Size: int64(len(dockerfileContents)),
	}); err != nil {
		panic(err)
	}
	if _, err := tarWriter.Write(dockerfileContents); err != nil {
		panic(err)
	}
	if err := addDirectoryToTar(tarWriter, "./react-project", "react-project"); err != nil {
		panic(err)
	}
	if err := tarWriter.Close(); err != nil {
		panic(err)
	}

	imageName := "mcp-image-" + uuid.NewString()
	buildResp, err := apiClient.ImageBuild(ctx, &buildContext, client.ImageBuildOptions{
		Tags:       []string{imageName},
		Dockerfile: "Dockerfile",
		Remove:     true,
	})
	if err != nil {
		panic(err)
	}
	if err := readDockerBuildOutput(buildResp.Body); err != nil {
		buildResp.Body.Close()
		panic(err)
	}
	buildResp.Body.Close()

	imageInspect, err := apiClient.ImageInspect(ctx, imageName)
	if err != nil {
		panic(err)
	}

	fmt.Println("Just checking to see If I can see this")
	containerName := "mcp-container-" + uuid.NewString()
	resp, err := apiClient.ContainerCreate(ctx, client.ContainerCreateOptions{
		Config: &container.Config{
			Image: imageName,
			Labels: map[string]string{
				"mcp.dockerfile": input.DockerFile,
			},
		},
		Name: containerName,
	})
	if err != nil {
		panic(err)
	}

	if _, err := apiClient.ContainerStart(ctx, resp.ID, client.ContainerStartOptions{}); err != nil {
		panic(err)
	}

	// 5. Capture Logs
	out, err := apiClient.ContainerLogs(ctx, resp.ID, client.ContainerLogsOptions{ShowStdout: true, ShowStderr: true})
	if err != nil {
		panic(err)
	}

	var stdoutBuf, stderrBuf bytes.Buffer
	_, err = stdcopy.StdCopy(&stdoutBuf, &stderrBuf, out)
	if err != nil {
		panic(err)
	}

	return nil, Output{
		// Stdout:        stdoutBuf.String(),
		// Stderr:        stderrBuf.String(),
		ContainerName: containerName,
		ContainerID:   resp.ID,
		ImageName:     imageName,
		ImageID:       imageInspect.ID,
	}, nil
}

type dockerBuildMessage struct {
	Stream      string `json:"stream"`
	Error       string `json:"error"`
	ErrorDetail *struct {
		Message string `json:"message"`
	} `json:"errorDetail"`
}

func readDockerBuildOutput(r io.Reader) error {
	decoder := json.NewDecoder(r)
	for {
		var msg dockerBuildMessage
		if err := decoder.Decode(&msg); err != nil {
			if err == io.EOF {
				return nil
			}
			return fmt.Errorf("failed to decode docker build output: %w", err)
		}
		if msg.ErrorDetail != nil && msg.ErrorDetail.Message != "" {
			return fmt.Errorf("docker build failed: %s", msg.ErrorDetail.Message)
		}
		if msg.Error != "" {
			return fmt.Errorf("docker build failed: %s", msg.Error)
		}
	}
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

type ShutdownInput struct {
	ContainerID string `json:"container_id" jsonschema:"container ID or name to shut down"`
}

type ShutdownOutput struct {
	Message string `json:"message" jsonschema:"shutdown result message"`
}

func ShutdownContainer(ctx context.Context, req *mcp.CallToolRequest, input ShutdownInput) (*mcp.CallToolResult, ShutdownOutput, error) {
	ctx = context.Background()
	apiClient, err := client.New(client.FromEnv)
	if err != nil {
		panic(err)
	}
	defer apiClient.Close()

	if _, err := apiClient.ContainerStop(ctx, input.ContainerID, client.ContainerStopOptions{}); err != nil {
		panic(err)
	}

	return nil, ShutdownOutput{
		Message: "container shut down",
	}, nil
}
