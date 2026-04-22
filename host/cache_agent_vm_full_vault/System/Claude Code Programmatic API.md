---
title: "Claude Code Programmatic API"
created: 2026-04-02
type: reference
tags: [claude-code, programmatic, cli, stream-json, headless, agent-os, oauth, max]
related: [ClaudeForge, EMA, agentic-dev-env-OS]
source: "Session 409fd385 — 2026-03-30"
---

# Claude Code Programmatic API

## The Key Insight

The **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) exists but requires **API keys** — it does NOT support OAuth/Max plan auth. Anthropic explicitly prohibits third parties from offering claude.ai login.

**BUT: Claude Code CLI works with Max subscription AND has full programmatic control.**

Use `claude --print` as your programmatic API. It's the actual recommended path for Max subscribers.

## Core Pattern

```bash
claude --print \
  --output-format stream-json \
  --input-format stream-json \
  --agents '{"reviewer": {"description": "Reviews code", "prompt": "You are a code reviewer"}}' \
  --mcp-config ./my-tools.json \
  --permission-mode bypassPermissions \
  --session-id <uuid> \
  "your prompt here"
```

## Key Flags

| Flag | Purpose |
|---|---|
| `--print` / `-p` | Non-interactive mode — returns output and exits |
| `--output-format stream-json` | Streaming JSON output, one event per line |
| `--input-format stream-json` | Accept streaming JSON on stdin |
| `--include-partial-messages` | Stream partial chunks as they arrive (requires `stream-json`) |
| `--output-format json` | Single JSON object (non-streaming) |
| `--session-id <uuid>` | Attach to or resume a named session |
| `--resume <id>` | Resume from a checkpoint |
| `--fork-session` | New session ID on resume (use with `--resume`) |
| `--agents <json>` | Define named sub-agents inline |
| `--mcp-config <path>` | Load MCP tools from JSON file |
| `--permission-mode bypassPermissions` | Auto-approve all tool calls |
| `--fallback-model <model>` | Auto-fallback when default is overloaded (requires `--print`) |

## Why This Matters

For anything built on the **Claude Max subscription** (ClaudeForge, EMA, agentic dev env OS):
- No API key cost — Max subscription covers it
- Full programmatic control via subprocess
- Streaming output for real-time UIs
- Multi-session, resumable, agent-aware

## File-Based Prompts Pattern

For complex prompts with special characters, avoid bash escaping hell:

```bash
# Write prompt to temp file
cat > /tmp/prompt.txt << 'EOF'
Your complex prompt here, no escaping needed
Even "quotes" and $variables work fine
EOF

# Pass to claude via stdin
claude --print --input-format text < /tmp/prompt.txt
```

Or with stream-json:
```bash
echo '{"type":"user","message":{"role":"user","content":"your prompt"}}' | \
  claude --print --input-format stream-json --output-format stream-json
```

## systemd-run for Isolated Subprocess

When spawning Claude Code from a service without polluting the parent session:

```bash
systemd-run --user --scope \
  --setenv=HOME=/home/trajan \
  claude --print --permission-mode bypassPermissions \
  "task here"
```

Keeps resource tracking clean and prevents process tree leakage.

## Output Format (stream-json)

Each line is a JSON event:
- `{"type": "text", "text": "..."}` — content chunk
- `{"type": "tool_use", "name": "...", "input": {...}}` — tool call
- `{"type": "tool_result", "content": "..."}` — tool result
- `{"type": "result", "result": "...", "session_id": "..."}` — final output

## Context

Discovered during [[agentic-dev-env-OS]] architecture session while evaluating ClaudeForge's backend and whether to use the Agent SDK vs CLI. ClaudeForge uses this pattern for its Claude Code provider.
