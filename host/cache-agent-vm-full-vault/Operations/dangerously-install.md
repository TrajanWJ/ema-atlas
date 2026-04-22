---
title: "dangerously — Docker Sandbox for Claude Code"
created: 2026-03-19
type: operations
tags: [docker, sandbox, claude-code, security]
---

# dangerously — Docker Sandbox for Claude Code

## What It Does
Wraps Claude Code with `--dangerously-skip-permissions` inside an isolated Docker container. The dangerous flag is safe because Docker provides the containment.

## Install Status
Installed: 2026-03-19, version: 0.1.5
Package: `dangerously` (npm)
Binary: `~/.npm-global/bin/dangerously`
Note: Requires `~/.npm-global/bin` on PATH (should already be set via npmrc/profile).

## Usage
```
dangerously run "your task description"
```

Equivalent to running Claude Code with full auto-approve but sandboxed in Docker so it can't escape to host filesystem or network.

## How It Works
- Builds a Docker image (`claude-sandbox:latest`) from a bundled Dockerfile based on `node:20`
- Installs `@anthropic-ai/claude-code` globally inside the container
- Creates a non-root `claude` user in the container
- Runs the task in `/workspace` inside the container
- Container requires a TTY (won't work in non-interactive shells)

## When to Use
- Untrusted code generation tasks
- Testing agent behaviors that might be destructive
- Running agent loops that need full autonomy without risk

## Notes
- Requires Docker to be running
- Container is ephemeral — destroyed after task completes
- Mount volumes explicitly if you need persistent output
- First run pulls `node:20` image and builds the sandbox (~30s)
- Subsequent runs use cached Docker layers
- Author field in package.json is "your name" — this is a community/early-stage tool
