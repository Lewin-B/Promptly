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

package app

import (
	"context"
	"fmt"
	"os"

	"google.golang.org/genai"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/cmd/launcher"
	"google.golang.org/adk/cmd/launcher/full"
	"google.golang.org/adk/model/gemini"
	"google.golang.org/adk/tool"
	"google.golang.org/adk/tool/mcptoolset"

	"main/judge-agent/mcptransport"
)

// Run wires up the agent, toolsets, and launcher, then executes the CLI.
func Run(ctx context.Context, args []string) error {
	model, err := gemini.NewModel(ctx, "gemini-2.5-flash", &genai.ClientConfig{
		APIKey: os.Getenv("GOOGLE_API_KEY"),
	})
	if err != nil {
		return fmt.Errorf("failed to create model: %w", err)
	}

	transport := mcptransport.Local(ctx)

	mcpToolSet, err := mcptoolset.New(mcptoolset.Config{
		Transport: transport,
	})
	if err != nil {
		return fmt.Errorf("failed to create MCP tool set: %w", err)
	}

	a, err := llmagent.New(llmagent.Config{
		Name:        "helper_agent",
		Model:       model,
		Description: "Helper agent.",
		Instruction: "You are a helpful assistant that helps users with various tasks.",
		Toolsets: []tool.Toolset{
			mcpToolSet,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create agent: %w", err)
	}

	config := &launcher.Config{
		AgentLoader: agent.NewSingleLoader(a),
	}
	l := full.NewLauncher()
	if err = l.Execute(ctx, config, args); err != nil {
		return fmt.Errorf("run failed: %w\n\n%s", err, l.CommandLineSyntax())
	}

	return nil
}

func NewDockerAgent(ctx context.Context) agent.Agent {
	model, err := gemini.NewModel(ctx, "gemini-2.5-flash", &genai.ClientConfig{
		APIKey: os.Getenv("GOOGLE_API_KEY"),
	})
	if err != nil {
		panic(fmt.Errorf("failed to create model: %w", err))
	}

	transport := mcptransport.Local(ctx)

	mcpToolSet, err := mcptoolset.New(mcptoolset.Config{
		Transport: transport,
	})
	if err != nil {
		panic(fmt.Errorf("failed to create MCP tool set: %w", err))
	}

	a, err := llmagent.New(llmagent.Config{
		Name:        "docker_agent",
		Model:       model,
		Description: "Deploys containers using a Dockerfile and a tar archive payload.",
		Instruction: `You are a Docker container deploying agent your job is to receive a dockerfile
					  and a tar archive of contents that you will use the dockerfile to deploy the contents
					  of the tar archive into a container`,
		Toolsets: []tool.Toolset{
			mcpToolSet,
		},
	})
	if err != nil {
		panic(fmt.Errorf("failed to create agent: %w", err))
	}

	return a
}

func NewPlannerAgent(ctx context.Context) agent.Agent {
	model, err := gemini.NewModel(ctx, "gemini-2.5-flash", &genai.ClientConfig{
		APIKey: os.Getenv("GOOGLE_API_KEY"),
	})
	if err != nil {
		panic(fmt.Errorf("failed to create model: %w", err))
	}

	transport := mcptransport.Local(ctx)

	mcpToolSet, err := mcptoolset.New(mcptoolset.Config{
		Transport: transport,
	})
	if err != nil {
		panic(fmt.Errorf("failed to create MCP tool set: %w", err))
	}

	a, err := llmagent.New(llmagent.Config{
		Name:        "planner_agent",
		Model:       model,
		Description: "Generates Dockerfiles for a provided directory or project contents.",
		Instruction: `You are a Planning agent your job is to receive the contents 
					  of a directory and create a dockerfile to deploy a container
					  that runs these contents`,
		Toolsets: []tool.Toolset{
			mcpToolSet,
		},
	})
	if err != nil {
		panic(fmt.Errorf("failed to create agent: %w", err))
	}

	return a
}

func NewOrchestratorAgent(ctx context.Context, subAgents ...agent.Agent) agent.Agent {
	model, err := gemini.NewModel(ctx, "gemini-2.5-flash", &genai.ClientConfig{
		APIKey: os.Getenv("GOOGLE_API_KEY"),
	})
	if err != nil {
		panic(fmt.Errorf("failed to create model: %w", err))
	}

	a, err := llmagent.New(llmagent.Config{
		Name:        "judge_orchestrator",
		Model:       model,
		Description: "Routes requests to docker_agent or planner_agent based on user intent.",
		Instruction: `You are the orchestrator. Delegate requests to sub-agents.
- Use docker_agent when the user provides a Dockerfile and/or a tar archive to deploy or run.
- Use planner_agent when the user provides directory contents and needs a Dockerfile created.
- If unclear, ask a brief clarification question.`,
		SubAgents: subAgents,
	})
	if err != nil {
		panic(fmt.Errorf("failed to create orchestrator agent: %w", err))
	}

	return a
}

func NewAnalyzerAgent(ctx context.Context) agent.Agent {
	model, err := gemini.NewModel(ctx, "gemini-2.5-flash", &genai.ClientConfig{
		APIKey: os.Getenv("GOOGLE_API_KEY"),
	})
	if err != nil {
		panic(fmt.Errorf("failed to create model: %w", err))
	}

	transport := mcptransport.Local(ctx)

	mcpToolSet, err := mcptoolset.New(mcptoolset.Config{
		Transport: transport,
	})
	if err != nil {
		panic(fmt.Errorf("failed to create MCP tool set: %w", err))
	}

	a, err := llmagent.New((llmagent.Config{
		Name:        "submission_analyzer",
		Model:       model,
		Description: "Analyzes submission quality, functionality, and buildability.",
		Instruction: `You are an analyzer. You receive the build logs, the project files as strings, the problem description, and the chat history for the submission.
					  Grade the submission on:
					  - CodeQuality (0-100): clarity, structure, and maintainability.
					  - Functionality (0-100): how well the code satisfies the requirements.
					  - ProductionAbility (0-100): likelihood the project builds and runs in BuildKit.
					  - ChatHistory (0-100): quality and usefulness of the chat guidance toward the solution.
					  Also include a short rationale for each score and an overall verdict.
					  Output only raw JSON in the form:
					  {"codeQuality":{"score":0,"rationale":""},"functionality":{"score":0,"rationale":""},"productionAbility":{"score":0,"rationale":""},"chatHistory":{"score":0,"rationale":""},"overallVerdict":""}
					  Do not wrap the JSON in markdown, code fences, or extra commentary.`,
		Toolsets: []tool.Toolset{
			mcpToolSet,
		},
	}))

	if err != nil {
		panic(fmt.Errorf("Failed to create agent: ", err))
	}

	return a
}
