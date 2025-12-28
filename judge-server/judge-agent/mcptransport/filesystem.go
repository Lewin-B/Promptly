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
	"archive/tar"
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

const defaultReadMaxBytes = 1_048_576

type ListPathsInput struct {
	Path string `json:"path" jsonschema:"path to list; defaults to current directory when empty"`
}

type PathEntry struct {
	Name  string `json:"name" jsonschema:"entry name"`
	Path  string `json:"path" jsonschema:"full path to entry"`
	IsDir bool   `json:"is_dir" jsonschema:"true when entry is a directory"`
	Size  int64  `json:"size" jsonschema:"file size in bytes; 0 for directories"`
}

type ListPathsOutput struct {
	BasePath string      `json:"base_path" jsonschema:"resolved base path that was listed"`
	Entries  []PathEntry `json:"entries" jsonschema:"entries in the directory"`
}

func ListLocalPaths(ctx context.Context, req *mcp.CallToolRequest, input ListPathsInput) (*mcp.CallToolResult, ListPathsOutput, error) {
	base := input.Path
	if base == "" {
		base = "."
	}
	base = filepath.Clean(base)
	info, err := os.Stat(base)
	if err != nil {
		return nil, ListPathsOutput{}, fmt.Errorf("stat %q: %w", base, err)
	}
	if !info.IsDir() {
		return nil, ListPathsOutput{}, fmt.Errorf("path %q is not a directory", base)
	}

	entries, err := os.ReadDir(base)
	if err != nil {
		return nil, ListPathsOutput{}, fmt.Errorf("read dir %q: %w", base, err)
	}

	output := ListPathsOutput{
		BasePath: base,
		Entries:  make([]PathEntry, 0, len(entries)),
	}
	for _, entry := range entries {
		entryPath := filepath.Join(base, entry.Name())
		info, err := entry.Info()
		if err != nil {
			return nil, ListPathsOutput{}, fmt.Errorf("stat %q: %w", entryPath, err)
		}
		size := info.Size()
		if info.IsDir() {
			size = 0
		}
		output.Entries = append(output.Entries, PathEntry{
			Name:  entry.Name(),
			Path:  entryPath,
			IsDir: info.IsDir(),
			Size:  size,
		})
	}

	return nil, output, nil
}

type ReadFileInput struct {
	Path     string `json:"path" jsonschema:"path to the file to read"`
	MaxBytes int    `json:"max_bytes,omitempty" jsonschema:"max bytes to read; defaults to 1048576"`
}

type ReadFileOutput struct {
	Path      string `json:"path" jsonschema:"resolved path that was read"`
	Content   string `json:"content" jsonschema:"file contents (may be truncated)"`
	Size      int64  `json:"size" jsonschema:"file size in bytes"`
	Truncated bool   `json:"truncated" jsonschema:"true when content was truncated by max_bytes"`
}

func ReadLocalFile(ctx context.Context, req *mcp.CallToolRequest, input ReadFileInput) (*mcp.CallToolResult, ReadFileOutput, error) {
	path := filepath.Clean(input.Path)
	if path == "" || path == "." {
		return nil, ReadFileOutput{}, fmt.Errorf("path is required")
	}
	maxBytes := input.MaxBytes
	if maxBytes <= 0 {
		maxBytes = defaultReadMaxBytes
	}

	info, err := os.Stat(path)
	if err != nil {
		return nil, ReadFileOutput{}, fmt.Errorf("stat %q: %w", path, err)
	}
	if info.IsDir() {
		return nil, ReadFileOutput{}, fmt.Errorf("path %q is a directory", path)
	}

	file, err := os.Open(path)
	if err != nil {
		return nil, ReadFileOutput{}, fmt.Errorf("open %q: %w", path, err)
	}
	defer file.Close()

	reader := io.LimitReader(file, int64(maxBytes))
	data, err := io.ReadAll(reader)
	if err != nil {
		return nil, ReadFileOutput{}, fmt.Errorf("read %q: %w", path, err)
	}

	return nil, ReadFileOutput{
		Path:      path,
		Content:   string(data),
		Size:      info.Size(),
		Truncated: info.Size() > int64(maxBytes),
	}, nil
}

type ReadTarInput struct {
	Base64TarFile string
}

type ReadTarOutput struct {
	FileSystem map[string]string
}

func ReadTarArchive(ctx context.Context, req *mcp.CallToolRequest, input ReadTarInput) (*mcp.CallToolResult, ReadTarOutput, error) {
	decodedTarBytes, err := base64.StdEncoding.DecodeString(input.Base64TarFile)

	bytesReader := bytes.NewReader(decodedTarBytes)

	tr := tar.NewReader(bytesReader)

	var files map[string]string

	for {
		header, err := tr.Next()
		if err == io.EOF {
			break // End of archive
		}
		if err != nil {
			panic(err)
		}

		fmt.Printf("File: %s (Size: %d bytes)\n", header.Name, header.Size)

		// 4. Read the content of the current file
		// The tar.Reader itself acts as an io.Reader for the current file entry
		content, err := io.ReadAll(tr)
		if err != nil {
			panic(err)
		}

		fmt.Println("File Content: ", content)
		files[string(header.Name)] = string(content)

	}

	if err != nil {
		panic(err)
	}

	return nil, ReadTarOutput{
		FileSystem: files,
	}, nil

}
