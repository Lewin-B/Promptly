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

package mcptransport

import (
	"context"
	"log"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// Local configures an in-memory MCP server with the sample weather tool.
func Local(ctx context.Context) mcp.Transport {
	clientTransport, serverTransport := mcp.NewInMemoryTransports()

	server := mcp.NewServer(&mcp.Implementation{Name: "docker_server", Version: "v1.0.0"}, nil)
	mcp.AddTool(server, &mcp.Tool{Name: "deploy_container", Description: "Deploys lightweight container based off the given docker compose"}, DeployContainer)
	mcp.AddTool(server, &mcp.Tool{Name: "shutdown_container", Description: "Shuts down a container by ID or name"}, ShutdownContainer)
	mcp.AddTool(server, &mcp.Tool{Name: "list_local_paths", Description: "Lists entries in a local filesystem directory"}, ListLocalPaths)
	mcp.AddTool(server, &mcp.Tool{Name: "read_local_file", Description: "Reads a local file path with an optional byte limit"}, ReadLocalFile)
	_, err := server.Connect(ctx, serverTransport, nil)
	if err != nil {
		log.Fatal(err)
	}

	return clientTransport
}

// GitHub connects to the remote GitHub MCP server using a personal access token.
// func GitHub(ctx context.Context) mcp.Transport {
// 	ts := oauth2.StaticTokenSource(
// 		&oauth2.Token{AccessToken: os.Getenv("GITHUB_PAT")},
// 	)
// 	return &mcp.StreamableClientTransport{
// 		Endpoint:   "https://api.githubcopilot.com/mcp/",
// 		HTTPClient: oauth2.NewClient(ctx, ts),
// 	}
// }
