---
title: Claude Agent SDK vs CLI Path — Decision Matrix
created: '2026-04-01'
updated: '2026-04-01'
type: research
status: active
confidence: 0.95
tags:
  - claude-code
  - agent-sdk
  - cli
  - max-plan
  - api-key
  - decision
summary: >-
  The two paths for programmatic Claude Code integration — when to use the Agent
  SDK (API key) vs the CLI subprocess (Max plan). Decision matrix for EMA.
wiki_id: research/Claude_Agent_SDK_vs_CLI_Path
imported_from: vault/Research/Claude Agent SDK vs CLI Path.md
imported_at: '2026-04-04T00:23:57.006Z'
---

# Claude Agent SDK vs CLI Path

## The Two Paths

Anthropic provides two ways to use Claude Code programmatically:

### Path 1: Claude Agent SDK (API Key)
```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Fix the bug in auth.py",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"])
):
    print(message)
```

**Packages:**
- TypeScript: `@anthropic-ai/claude-agent-sdk`
- Python: `claude-agent-sdk`

**Auth:** API key (`ANTHROPIC_API_KEY`) or cloud provider (Bedrock/Vertex/Azure)

**Hooks:** Callback functions in Python/TypeScript
```python
hooks={"PostToolUse": [HookMatcher(matcher="Edit|Write", hooks=[log_file_change])]}
```

**Pros:**
- Native language integration (Python/TS)
- Hooks as callbacks — type-safe, debuggable
- Same tools and agent loop as Claude Code
- Works in any environment (no CLI install needed)
- Structured output schemas

**Cons:**
- **API key only — Anthropic explicitly prohibits third-party OAuth/claude.ai login**
- Pay per token (no Max plan flat rate)
- Must manage API key security
- No session persistence across process restarts (session ID only in-memory)

### Path 2: Claude Code CLI as Subprocess (Max Plan)
```bash
claude --print \
  --output-format stream-json \
  --permission-mode bypassPermissions \
  --session-id <uuid> \
  --plugin-dir /path/to/citadel \
  -p "Fix the bug in auth.py"
```

**Auth:** Existing OAuth tokens in `~/.claude/` (Max plan subscription)

**Hooks:** File-based via `.claude/hooks.json` or plugin directory
```json
{"hooks": {"PreToolUse": [{"matcher": "Bash", "command": "node hook.js"}]}}
```

**Pros:**
- **Uses Max plan — flat rate, no per-token cost**
- Session persistence on disk (`~/.claude/projects/*/sessions/`)
- Plugin ecosystem (Citadel, etc.)
- Works with existing Claude Code installation
- Resume interrupted sessions with `--resume`
- Fork sessions for exploration with `--fork-session`

**Cons:**
- Subprocess management complexity (Port in Elixir, child_process in Node)
- JSONL parsing required for stream-json
- Hooks are external processes (JS files), not callbacks
- Must parse stdout for events
- Claude CLI must be installed on the machine

## Decision Matrix

| Factor | SDK (API Key) | CLI (Max Plan) | Winner for EMA |
|---|---|---|---|
| **Cost model** | Per token | Flat rate | **CLI** ✅ |
| **Auth** | API key | OAuth (existing) | **CLI** ✅ |
| **Hooks** | Native callbacks | External JS files | SDK |
| **Language integration** | Native Python/TS | Subprocess management | SDK |
| **Session persistence** | In-memory only | Disk-based JSONL | **CLI** ✅ |
| **Plugin ecosystem** | None | Citadel, etc. | **CLI** ✅ |
| **Session resume** | Not supported | `--resume` flag | **CLI** ✅ |
| **Complexity** | Lower | Higher | SDK |
| **Availability** | Any environment | Needs CLI installed | SDK |

## Verdict for EMA

**CLI path wins decisively.** Trajan is on Max plan — flat rate means unlimited agent runs without cost anxiety. The CLI path also gives session persistence, the Citadel plugin ecosystem, and resume/fork capabilities that the SDK can't match.

The Bridge (Elixir GenServer managing Claude CLI Port) handles the subprocess complexity that's the CLI path's main downside. OTP supervision + Port management is exactly what Elixir is built for.

## Hybrid Option (Future)

If EMA ever needs to run on machines without Claude Code installed (e.g., cloud deployment), add SDK support as a fallback:

```elixir
defmodule Ema.Claude.Bridge do
  def run(prompt, opts) do
    case detect_backend() do
      :cli -> run_via_port(prompt, opts)      # Max plan, local
      :sdk -> run_via_sdk(prompt, opts)        # API key, cloud
    end
  end
end
```

## Anthropic's Position (Explicit)

From the Agent SDK docs:
> "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK."

This means EMA **cannot** use the SDK with Trajan's Max plan OAuth tokens. The CLI subprocess path is the only legitimate way to leverage Max plan programmatically.

## Cross-References
- [[Claude Code CLI Integration Reference]] — full CLI API
- [[EMA Claude Bridge Design]] — the implementation plan
- [[Harness Engineering Discipline]] — the broader context
