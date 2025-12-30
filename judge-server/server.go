package main

import (
	"archive/tar"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"

	"github.com/a2aproject/a2a-go/a2a"
	"github.com/a2aproject/a2a-go/a2asrv"

	"main/judge-agent/app"
	"main/judge-agent/mcptransport"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/remoteagent"
	"google.golang.org/adk/cmd/launcher"
	"google.golang.org/adk/cmd/launcher/full"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/server/adka2a"
	"google.golang.org/adk/session"
)

type deployRequest struct {
	DockerFile    string `json:"docker_file"`
	Base64TarFile string `json:"base64TarFile,omitempty"`
}

type deployResponse struct {
	ContainerName string `json:"container_name"`
	ContainerID   string `json:"container_id"`
	ImageName     string `json:"image_name"`
	ImageID       string `json:"image_id"`
}

func startJudgeAgentServer() string {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatalf("Failed to bind to a port: %v", err)
	}

	baseURL := &url.URL{Scheme: "http", Host: listener.Addr().String()}

	log.Printf("Starting A2A server on %s", baseURL.String())

	go func() {
		ctx := context.Background()
		dockerAgent := app.NewDockerAgent(ctx)
		plannerAgent := app.NewPlannerAgent(ctx)
		orchestratorAgent := app.NewOrchestratorAgent(ctx, dockerAgent, plannerAgent)

		agentPath := "/invoke"
		orchestratorAgentCard := &a2a.AgentCard{
			Name:               orchestratorAgent.Name(),
			Skills:             adka2a.BuildAgentSkills(orchestratorAgent),
			PreferredTransport: a2a.TransportProtocolJSONRPC,
			URL:                baseURL.JoinPath(agentPath).String(),
			Capabilities:       a2a.AgentCapabilities{Streaming: true},
		}

		mux := http.NewServeMux()
		mux.Handle(a2asrv.WellKnownAgentCardPath, a2asrv.NewStaticAgentCardHandler(orchestratorAgentCard))

		orchestratorExecutor := adka2a.NewExecutor(adka2a.ExecutorConfig{
			RunnerConfig: runner.Config{
				AppName:        orchestratorAgent.Name(),
				Agent:          orchestratorAgent,
				SessionService: session.InMemoryService(),
			},
		})

		orchestratorRequestHandler := a2asrv.NewHandler(orchestratorExecutor)
		mux.Handle(agentPath, a2asrv.NewJSONRPCHandler(orchestratorRequestHandler))
		mux.HandleFunc("/deploy", func(w http.ResponseWriter, r *http.Request) {
			handleDeploy(w, r)
		})

		err := http.Serve(listener, mux)

		log.Printf("A2A server stopped: %v", err)
	}()

	return baseURL.String()
}

func handleDeploy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload deployRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}
	if payload.DockerFile == "" {
		http.Error(w, "docker_file is required", http.StatusBadRequest)
		return
	}

	var buildContents bytes.Buffer
	if payload.Base64TarFile != "" {
		decoded, err := base64.RawURLEncoding.DecodeString(payload.Base64TarFile)
		if err != nil {
			http.Error(w, "invalid base64TarFile", http.StatusBadRequest)
			return
		}
		if _, err := buildContents.Write(decoded); err != nil {
			http.Error(w, "failed to buffer build context", http.StatusInternalServerError)
			return
		}
		logBuildContext(buildContents.Bytes())
	}

	_, output, err := mcptransport.DeployContainer(
		r.Context(),
		nil,
		mcptransport.Input{
			DockerFile:    payload.DockerFile,
			BuildContents: buildContents,
		},
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(deployResponse{
		ContainerName: output.ContainerName,
		ContainerID:   output.ContainerID,
		ImageName:     output.ImageName,
		ImageID:       output.ImageID,
	}); err != nil {
		log.Printf("Failed to write deploy response: %v", err)
	}
}

func logBuildContext(tarBytes []byte) {
	tr := tar.NewReader(bytes.NewReader(tarBytes))
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Failed to read build context: %v", err)
			return
		}
		if header.Typeflag != tar.TypeReg && header.Typeflag != tar.TypeRegA {
			continue
		}
		content, err := io.ReadAll(tr)
		if err != nil {
			log.Printf("Failed to read build context file %s: %v", header.Name, err)
			continue
		}
		log.Printf("Build context file: %s\n%s", header.Name, string(content))
	}
}

func main() {
	ctx := context.Background()

	a2aServerAddress := startJudgeAgentServer()

	remoteAgent, err := remoteagent.NewA2A(remoteagent.A2AConfig{
		Name:            "A2A Judge Orchestrator",
		AgentCardSource: a2aServerAddress,
	})
	if err != nil {
		log.Fatalf("Failed to create a remote agent: %v", err)
	}

	config := &launcher.Config{
		AgentLoader: agent.NewSingleLoader(remoteAgent),
	}

	l := full.NewLauncher()
	if err = l.Execute(ctx, config, os.Args[1:]); err != nil {
		log.Fatalf("Run failed: %v\n\n%s", err, l.CommandLineSyntax())
	}

}
