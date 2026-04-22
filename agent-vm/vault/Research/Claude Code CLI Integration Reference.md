---
title: "Claude Code CLI Integration Reference"
created: 2026-04-01
updated: 2026-04-01
type: reference
status: active
confidence: 0.95
tags: [claude-code, cli, stream-json, hooks, mcp, integration, api]
summary: "Complete technical reference for programmatically interfacing with Claude Code CLI — flags, stream-json format, hook events, session management, and MCP configuration."
---

# Claude Code CLI Integration Reference

## CLI Invocation for Programmatic Use

```bash
claude --print \
  --output-format stream-json \
  --input-format stream-json \
  --permission-mode bypassPermissions \
  --session-id <uuid> \
  --model <model-name> \
  --plugin-dir /path/to/plugin \
  --mcp-config /path/to/mcp-tools.json \
  --agents '{"agent-name": {"model": "...", "tools": [...]}}' \
  -p "Your prompt here"
```

### Key Flags

| Flag | Purpose | Notes |
|---|---|---|
| `--print` / `-p` | Non-interactive mode | Required for programmatic use |
| `--output-format stream-json` | JSONL streaming output | Each line is a JSON event |
| `--input-format stream-json` | Accept JSON input on stdin | For bidirectional communication |
| `--permission-mode bypassPermissions` | Skip all permission prompts | Required for headless operation |
| `--session-id <uuid>` | Attach to specific session | For multi-turn conversations |
| `--resume` | Resume a paused session | Works with `defer` hook decision |
| `--continue` | Continue most recent session | Shorthand for `--resume` with last session |
| `--fork-session <id>` | Fork from existing session | Creates branch point for exploration |
| `--model <name>` | Specify model | opus, sonnet, haiku |
| `--plugin-dir <path>` | Load plugin directory | For Citadel or custom plugins |
| `--mcp-config <path>` | MCP server configuration | JSON file defining MCP tool servers |
| `--agents <json>` | Define sub-agents | Named agents with model/tool constraints |
| `--allowed-tools <list>` | Restrict available tools | Comma-separated tool names |
| `--max-budget <n>` | Maximum cost limit | In USD, for API key mode |

### Environment Variables

| Variable | Purpose |
|---|---|
| `CLAUDE_CODE_NO_FLICKER=1` | Flicker-free alt-screen rendering |
| `MCP_CONNECTION_NONBLOCKING=true` | Skip MCP connection wait in `-p` mode |
| `CLAUDE_CODE_USE_BEDROCK=1` | Use AWS Bedrock backend |
| `CLAUDE_CODE_USE_VERTEX=1` | Use Google Vertex AI backend |
| `CLAUDE_CODE_USE_FOUNDRY=1` | Use Azure AI Foundry backend |

## Stream-JSON Event Format

Each line of output is a JSON object. Key event types:

### System Events
```json
{"type":"system","subtype":"init","session_id":"abc-123","tools":["Bash","Read","Write","Edit","Glob","Grep"]}
```

### Assistant Text
```json
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"I'll analyze the code..."}]}}
```

### Tool Use (Start)
```json
{"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_01abc","name":"Read","input":{}}}
```

### Tool Use (Input Streaming)
```json
{"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\"file_pa"}}
{"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"th\": \"src/main.ts\"}"}}
```

### Tool Use (End)
```json
{"type":"content_block_stop","index":1}
```

### Tool Result
```json
{"type":"tool_result","tool_use_id":"toolu_01abc","content":"file contents here..."}
```

### Result (Session Complete)
```json
{"type":"result","subtype":"success","session_id":"abc-123","total_cost_usd":0.05,"total_input_tokens":12500,"total_output_tokens":3200}
```

### API Retry
```json
{"type":"system","subtype":"api_retry","delay_seconds":30,"error":"rate_limited"}
```

## Hook Events (hooks.json or Plugin)

### File-Based Hooks (`.claude/hooks.json`)
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Edit|Write",
        "command": "node /path/to/my-hook.js"
      }
    ],
    "PostToolUse": [...],
    "Stop": [...],
    "SessionStart": [...],
    "SessionEnd": [...],
    "UserPromptSubmit": [...],
    "PermissionDenied": [...],
    "TaskCreated": [...]
  }
}
```

### Hook Input (via stdin)
```json
{
  "session_id": "abc-123",
  "tool_name": "Bash",
  "tool_input": {"command": "git push origin main"},
  "project_dir": "/home/user/project"
}
```

### Hook Output (via stdout)
```json
{"decision": "allow"}
{"decision": "deny", "reason": "Pushing to main is blocked"}
{"decision": "defer"}
{"retry": true}
```

### Hook Decision Types
| Decision | Effect | New in |
|---|---|---|
| `allow` | Tool proceeds normally | — |
| `deny` | Tool blocked, reason shown to model | — |
| `defer` | Session pauses, can resume with `--resume` | v2.1.89 |
| `{retry: true}` | On PermissionDenied, model retries | v2.1.89 |

### Hook Event Lifecycle
```
SessionStart → (user prompt) → UserPromptSubmit
  → PreToolUse → [tool executes] → PostToolUse
  → PreToolUse → [tool executes] → PostToolUse
  → ... (agent loop continues)
  → Stop → SessionEnd

If auto-mode denies: → PermissionDenied
If sub-task created: → TaskCreated
```

## MCP Configuration

### mcp-config.json Format
```json
{
  "mcpServers": {
    "ema-tools": {
      "command": "node",
      "args": ["/path/to/ema-mcp-server.js"],
      "env": {
        "EMA_DAEMON_URL": "http://localhost:4488"
      }
    },
    "vault-search": {
      "command": "/usr/local/bin/qmd",
      "args": ["mcp-serve"]
    }
  }
}
```

### MCP Tools Exposed to Claude
When configured, Claude can call your MCP tools like any built-in tool:
```json
{"type":"content_block_start","content_block":{"type":"tool_use","name":"mcp__ema-tools__vault_search","input":{}}}
```

## Session Management

### Session Files Location
```
~/.claude/projects/<project-path-hash>/sessions/<session-id>.jsonl
```

### Session JSONL Format (for cost tracking)
Each line is a message exchange:
```json
{"type":"request","timestamp":"...","input_tokens":1500,"output_tokens":800}
{"type":"response","timestamp":"...","model":"claude-opus-4","cost_usd":0.023}
```

### Multi-Turn Pattern
```bash
# Start session
SESSION_ID=$(uuidgen)
echo '{"prompt":"analyze this project"}' | claude --print --output-format stream-json --session-id $SESSION_ID -p -

# Continue same session
echo '{"prompt":"now refine the approach"}' | claude --print --output-format stream-json --session-id $SESSION_ID --resume -p -

# Fork for exploration
claude --print --fork-session $SESSION_ID -p "what if we tried a different approach"
```

## Plugin Directory Structure

### Citadel Plugin Layout
```
Citadel/
├── package.json           # Plugin metadata
├── hooks.json             # Hook definitions
├── hooks_src/             # Hook implementations
│   ├── circuit-breaker.js
│   ├── cost-tracker.js
│   ├── governance.js
│   ├── init-project.js
│   ├── quality-gate.js
│   └── session-end.js
├── skills/                # Skill definitions
│   ├── architect/
│   ├── autopilot/
│   ├── fleet/
│   ├── review/
│   └── ...
├── scripts/               # Utility scripts
│   ├── coordination.js
│   ├── session-tokens.js
│   └── ...
└── .planning/             # Per-project state (scaffolded at init)
    ├── campaigns/
    ├── coordination/
    ├── fleet/
    ├── telemetry/
    └── _templates/
```

## Auth Paths

### Max Plan (OAuth — CLI path)
Claude Code uses existing `~/.claude/` OAuth tokens. No configuration needed.
**Cannot** be used via the SDK. Anthropic explicitly prohibits third-party OAuth use.

### API Key (SDK path)
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```
Works with both CLI and SDK. Pay per token.

### Cloud Providers
- **Bedrock:** `CLAUDE_CODE_USE_BEDROCK=1` + AWS credentials
- **Vertex:** `CLAUDE_CODE_USE_VERTEX=1` + GCP credentials  
- **Azure:** `CLAUDE_CODE_USE_FOUNDRY=1` + Azure credentials

## Cross-References
- [[Harness Engineering Discipline]] — the conceptual framework
- [[EMA Claude Bridge Design]] — how EMA implements this
- [[Claude Code Harness Ecosystem Analysis]] — landscape of tools using these APIs
