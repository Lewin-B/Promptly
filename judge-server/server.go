package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"

	"github.com/a2aproject/a2a-go/a2a"
	"github.com/a2aproject/a2a-go/a2asrv"

	"main/judge-agent/app"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/remoteagent"
	"google.golang.org/adk/cmd/launcher"
	"google.golang.org/adk/cmd/launcher/full"
	"google.golang.org/adk/runner"
	"google.golang.org/adk/server/adka2a"
	"google.golang.org/adk/session"
)

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

		err := http.Serve(listener, mux)

		log.Printf("A2A server stopped: %v", err)
	}()

	return baseURL.String()
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
