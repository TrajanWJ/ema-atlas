---
title: Claude Agent SDK Migration
created: '2026-03-16'
updated: '2026-03-19'
type: knowledge
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: system-generated
tags:
  - agents
  - architecture
  - migration
  - sdk
summary: >-
  Anthropic ships an official **Claude Agent SDK** (`claude-agent-sdk` on PyPI,
  `github.com/anthropics/claude-agent-sdk-python`) that wraps the Claude C
wiki_id: system/architecture/Claude_Agent_SDK_Migration
imported_from: vault/Architecture/Claude Agent SDK Migration.md
imported_at: '2026-04-04T00:23:56.739Z'
---
# Claude Agent SDK Migration Design Doc

**Status:** Proposal  
**Author:** 🔬 Researcher (auto-generated)  
**Date:** 2026-03-16  
**Tags:** #architecture #agents #migration #sdk

---

## Executive Summary

Anthropic ships an official **Claude Agent SDK** (`claude-agent-sdk` on PyPI, `github.com/anthropics/claude-agent-sdk-python`) that wraps the Claude Code CLI in a Python async API. It gives us programmatic control over agent sessions — custom in-process MCP tools, hooks, streaming, multi-turn conversations, and session management — without leaving Python. This doc evaluates migrating from our current CLI-based spawning to the SDK.

**Bottom line:** The SDK is a strict superset of what `claude --print` gives us. Migration is incremental (the SDK wraps the same CLI binary). The biggest wins are custom MCP tools, hooks for safety/auditing, and multi-turn sessions. The biggest risk is introducing Python into a Node.js-native [[OpenClaw]] stack.

---

## 1. Current Architecture

### How agents spawn today

```
OpenClaw Gateway (Node.js)
  └─ sessions_spawn / exec tool
       └─ claude --print --permission-mode bypassPermissions 'task prompt'
            └─ Claude Code CLI process (Node.js)
                 ├─ Reads CLAUDE.md, .claude/settings.json
                 ├─ Full toolset: Read, Write, Edit, Bash, etc.
                 ├─ MCP servers: Serena, Engram, QMD, etc. (via config)
                 └─ Outputs JSON-lines to stdout → captured by OpenClaw
```

### Key characteristics

| Aspect | Current State |
|---|---|
| **Spawning** | `exec` tool runs `claude --print` as a background shell process |
| **Communication** | Stdout capture; no structured streaming |
| **Session model** | Fire-and-forget; each invocation is a new session |
| **MCP tools** | Configured in `.claude/settings.json` — external subprocess servers |
| **Permissions** | `bypassPermissions` — everything auto-approved |
| **Multi-turn** | Not supported; each spawn is one-shot |
| **Hooks** | None — no pre/post tool-use interception |
| **Error handling** | Exit code + stderr parsing |
| **Language** | Shell → Node.js CLI → no Python in the stack |

### What works well

- Simple to reason about: one shell command, one result
- No Python dependency in the stack
- Reliable for single-task fire-and-forget workloads
- [[OpenClaw]]'s `sessions_spawn` handles process lifecycle

### Pain points

- **No structured streaming** — can't react to individual tool calls or messages mid-execution
- **No multi-turn** — can't follow up on a running agent's output without spawning a new process
- **MCP tools are external processes** — each MCP server is a separate subprocess with IPC overhead
- **No hooks** — can't intercept dangerous operations or inject context mid-execution
- **Session isolation** — agents can't share context or fork from a parent session
- **Coarse error handling** — process exit codes, no typed errors

---

## 2. SDK Architecture

### What the Claude Agent SDK provides

The SDK (`pip install claude-agent-sdk`, Python 3.10+) bundles the Claude Code CLI and wraps it in an async Python interface. Under the hood, it still spawns the CLI — but manages the process, streams structured messages, and enables in-process MCP servers.

### Two modes of operation

| Mode | Use Case | Session | Multi-turn |
|---|---|---|---|
| `query()` | One-off tasks (our current pattern) | New each call | No |
| `ClaudeSDKClient` | Interactive / multi-turn conversations | Persistent | Yes |

### Key capabilities gained

#### a) Custom In-Process MCP Tools

```python
@tool("vault_search", "Search the knowledge vault", {"query": str, "limit": int})
async def vault_search(args):
    # Runs in-process — no subprocess, no IPC overhead
    results = await qmd_search(args["query"], limit=args["limit"])
    return {"content": [{"type": "text", "text": format_results(results)}]}

server = create_sdk_mcp_server(name="openclaw-tools", tools=[vault_search, ...])
```

- No subprocess management — tools run in the same Python process
- Direct access to Python libraries, databases, APIs
- Type-safe with `@tool` decorator

#### b) Hooks (Pre/Post Tool Use)

```python
hooks = {
    "PreToolUse": [
        HookMatcher(matcher="Bash", hooks=[block_dangerous_commands]),
        HookMatcher(matcher="Write|Edit", hooks=[audit_file_changes]),
    ],
    "PostToolUse": [
        HookMatcher(matcher="Bash", hooks=[log_command_output]),
    ],
    "Stop": [stop_handler],
    "SubagentStart": [track_subagent],
}
```

Available hooks: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `UserPromptSubmit`, `Stop`, `SubagentStart`, `SubagentStop`, `PreCompact`, `PermissionRequest`, `Notification`.

#### c) Multi-Turn Sessions

```python
async with ClaudeSDKClient(options=options) as client:
    await client.query("Analyze this codebase")
    async for msg in client.receive_response():
        process(msg)
    
    # Follow-up in the SAME session — Claude remembers everything
    await client.query("Now refactor the auth module based on your analysis")
    async for msg in client.receive_response():
        process(msg)
```

#### d) Structured Streaming

Every message is a typed Python object: `AssistantMessage`, `UserMessage`, `ResultMessage`, `ToolUseBlock`, `ToolResultBlock`, `TextBlock`. No more parsing stdout strings.

#### e) Session Management

```python
from claude_agent_sdk import list_sessions, get_session_messages

# List past sessions
sessions = list_sessions(directory="/path/to/project", limit=10)

# Retrieve messages from a past session
messages = get_session_messages(session_id="abc123")
```

#### f) Dynamic Permission Control

```python
# Start restrictive, loosen as trust builds
async with ClaudeSDKClient(options=ClaudeAgentOptions(permission_mode="default")) as client:
    # ... after validation ...
    client.set_permission_mode("acceptEdits")
```

#### g) Typed Error Handling

```python
from claude_agent_sdk import CLINotFoundError, ProcessError, CLIJSONDecodeError

try:
    async for msg in query(prompt="task"):
        pass
except ProcessError as e:
    log(f"Agent failed with exit code {e.exit_code}")
```

---

## 3. Comparison Matrix

| Capability | CLI (`claude --print`) | SDK (`claude-agent-sdk`) |
|---|---|---|
| One-shot tasks | ✅ | ✅ (`query()`) |
| Multi-turn conversations | ❌ | ✅ (`ClaudeSDKClient`) |
| Structured message streaming | ❌ (stdout text) | ✅ (typed Python objects) |
| Custom MCP tools (in-process) | ❌ | ✅ (`@tool` + `create_sdk_mcp_server`) |
| External MCP servers | ✅ (config-based) | ✅ (config-based + in-process) |
| Pre/Post tool-use hooks | ❌ | ✅ (Python callbacks) |
| Permission control | Static (`bypassPermissions`) | Dynamic (change mid-session) |
| Session listing/history | ❌ | ✅ (`list_sessions`, `get_session_messages`) |
| Error handling | Exit codes | Typed exceptions |
| Subagent tracking | ❌ | ✅ (`SubagentStart`/`SubagentStop` hooks) |
| Interrupt support | Kill process | ✅ (graceful interrupt) |
| Language | Shell/Node.js | Python 3.10+ (wraps same CLI) |
| Deployment complexity | None (CLI already installed) | `pip install` + Python runtime |

---

## 4. Migration Path (Incremental)

### Principle: No big-bang. Run both approaches side by side.

### Phase 0: Foundation (Week 1)

**Goal:** Install SDK, prove it works alongside existing CLI spawning.

- [ ] Install Python 3.12 + venv on agent-vm (already present: Python 3.12.3)
- [ ] `pip install claude-agent-sdk` in a dedicated venv at `~/sdk-venv/`
- [ ] Write a thin wrapper script `~/bin/sdk-agent.py` that accepts a task prompt and runs `query()` with `bypassPermissions`
- [ ] Verify it produces equivalent output to `claude --print`
- [ ] Point it at our existing Claude Code CLI: `ClaudeAgentOptions(cli_path="/usr/bin/claude")`

### Phase 1: SDK-Powered Spawning (Week 2-3)

**Goal:** Replace CLI spawning for specialist agents with SDK `query()`.

- [ ] Create `~/lib/agent_sdk_runner.py` — async wrapper that [[OpenClaw]]'s `exec` tool calls:
  ```bash
  python3 ~/lib/agent_sdk_runner.py --task "prompt" --cwd "/path" --system-prompt "..."
  ```
- [ ] Map current `sessions_spawn` patterns to SDK equivalents
- [ ] Add structured output parsing — extract `AssistantMessage` text blocks
- [ ] Keep CLI fallback: if SDK fails, fall back to `claude --print`
- [ ] Run both paths in parallel for 1 week, compare outputs

### Phase 2: Custom MCP Tools (Week 4-5)

**Goal:** Expose [[OpenClaw]]-specific tools as in-process MCP servers.

Priority tools to implement:

| Tool Name | Description | Current Equivalent |
|---|---|---|
| `vault_search` | Semantic search via `qmd search` | Agent runs `qmd search` via Bash |
| `agent_dispatch` | Spawn a sub-specialist from within an agent | Agent can't do this today |
| `discord_post` | Post to Discord channel | Agent can't do this today |
| `discord_read` | Read recent Discord messages | Agent can't do this today |
| `memory_read` | Read/search MEMORY.md and daily notes | Agent reads files via Read tool |
| `vault_write` | Write to vault with auto-commit | Agent uses Write + Bash(git) |

```python
@tool("vault_search", "Search knowledge vault semantically", {"query": str, "limit": int})
async def vault_search(args):
    result = subprocess.run(["qmd", "search", args["query"], "--limit", str(args["limit"])], 
                          capture_output=True, text=True)
    return {"content": [{"type": "text", "text": result.stdout}]}

@tool("agent_dispatch", "Spawn a specialist agent for a subtask", 
      {"agent_id": str, "task": str})
async def agent_dispatch(args):
    # Spawn another SDK query — agents spawning agents!
    result = await run_agent(args["agent_id"], args["task"])
    return {"content": [{"type": "text", "text": result}]}

@tool("discord_post", "Post a message to a Discord channel",
      {"channel": str, "message": str})
async def discord_post(args):
    # Call OpenClaw's message API
    await openclaw_api.send_message(channel=args["channel"], message=args["message"])
    return {"content": [{"type": "text", "text": f"Posted to {args['channel']}"}]}
```

### Phase 3: Hooks & Safety (Week 6)

**Goal:** Add safety hooks and audit logging.

```python
async def audit_bash_commands(input_data, tool_use_id, context):
    """Log all Bash commands to audit file."""
    command = input_data["tool_input"].get("command", "")
    log_audit(f"Agent {context.get('session_id')}: Bash: {command}")
    
    # Block known-dangerous patterns
    if any(p in command for p in ["rm -rf /", "systemctl restart openclaw"]):
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": f"Blocked dangerous command: {command}",
            }
        }
    return {}
```

- [ ] `PreToolUse` hook: audit all Bash commands, block `rm -rf`, `systemctl restart openclaw-gateway`
- [ ] `PostToolUse` hook: log all file writes to audit trail
- [ ] `Stop` hook: capture final session state, log to daily notes
- [ ] `SubagentStart`/`SubagentStop` hooks: track subagent lifecycle

### Phase 4: Multi-Turn Sessions (Week 7-8)

**Goal:** Enable persistent agent sessions for complex workflows.

- [ ] Replace fire-and-forget `query()` with `ClaudeSDKClient` for long-running agents
- [ ] Enable follow-up queries within the same session context
- [ ] Implement session forking for Orchestrator workflows
- [ ] Add session persistence — resume interrupted agent work

### Phase 5: Full Integration (Week 9+)

**Goal:** SDK is the default path. CLI is legacy fallback.

- [ ] Update `AGENTS.md` dispatch protocol to use SDK runner
- [ ] Update `coding-agent` SKILL.md to document SDK path
- [ ] Deprecate direct `claude --print` spawning (keep as fallback)
- [ ] Performance benchmarks: SDK vs CLI overhead comparison

---

## 5. Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  OpenClaw Gateway                    │
│                    (Node.js)                         │
│                                                      │
│  sessions_spawn / exec tool                          │
│         │                                            │
│         ▼                                            │
│  ┌─────────────────────────────────────┐             │
│  │    agent_sdk_runner.py              │             │
│  │    (Python 3.12 + claude-agent-sdk) │             │
│  │                                     │             │
│  │  ┌───────────────────────────┐      │             │
│  │  │   In-Process MCP Server   │      │             │
│  │  │                           │      │             │
│  │  │  • vault_search           │      │             │
│  │  │  • agent_dispatch         │      │             │
│  │  │  • discord_post           │      │             │
│  │  │  • discord_read           │      │             │
│  │  │  • memory_read            │      │             │
│  │  │  • vault_write            │      │             │
│  │  └───────────────────────────┘      │             │
│  │                                     │             │
│  │  ┌───────────────────────────┐      │             │
│  │  │         Hooks             │      │             │
│  │  │                           │      │             │
│  │  │  • PreToolUse (audit)     │      │             │
│  │  │  • PostToolUse (logging)  │      │             │
│  │  │  • Stop (cleanup)         │      │             │
│  │  │  • SubagentStart/Stop     │      │             │
│  │  └───────────────────────────┘      │             │
│  │                                     │             │
│  │  query() or ClaudeSDKClient         │             │
│  │         │                           │             │
│  │         ▼                           │             │
│  │  Claude Code CLI (bundled/system)   │             │
│  │         │                           │             │
│  │         ▼                           │             │
│  │  Claude API (Anthropic)             │             │
│  └─────────────────────────────────────┘             │
│                                                      │
│  + External MCP Servers (Serena, Engram, QMD, etc.)  │
└─────────────────────────────────────────────────────┘
```

---

## 6. Risk Assessment

### 🟢 Low Risk

| Risk | Mitigation |
|---|---|
| SDK wraps the same CLI binary | If SDK breaks, fall back to direct CLI. Same underlying process. |
| Python already on the VM | Python 3.12.3 is installed. Just need a venv + pip install. |
| `query()` is equivalent to `claude --print` | Drop-in replacement for Phase 1. Behavior should be identical. |

### 🟡 Medium Risk

| Risk | Mitigation |
|---|---|
| **Introducing Python into a Node.js stack** | Keep Python isolated in a venv. [[OpenClaw]] calls it via `exec` (shell boundary). No tight coupling. |
| **SDK version churn** | Pin version in requirements.txt. Test upgrades in staging. The SDK renamed from `claude-code-sdk` → `claude-agent-sdk` at 0.1.0, suggesting API is still evolving. |
| **Claude Max subscription compatibility** | SDK still uses the CLI underneath, which uses the same auth. Should work, but verify. |
| **Performance overhead** | Python process startup (~200ms) + SDK initialization. For background agents running minutes, negligible. For rapid-fire short tasks, could add up. |
| **`dontAsk` mode not available in Python** | Use `disallowed_tools` to explicitly block instead. Less elegant but functional. |

### 🔴 High Risk

| Risk | Mitigation |
|---|---|
| **Auth model uncertainty** | SDK bundles its own CLI. Need to verify it respects our existing Claude Code auth (Claude Max via OAuth). If it tries API keys instead, this is a blocker. Test in Phase 0. |
| **`bypassPermissions` inheritance to subagents** | Per SDK docs: "When using `bypassPermissions`, all subagents inherit this mode and it cannot be overridden." This matches our current behavior but is worth explicit awareness — a compromised prompt could cascade. |

---

## 7. What We Gain (Summary)

1. **Custom tools without subprocess overhead** — vault search, agent dispatch, Discord posting all run in-process
2. **Safety hooks** — audit every Bash command, block dangerous ops, log file changes
3. **Multi-turn sessions** — agents can have follow-up conversations without losing context
4. **Structured streaming** — react to individual tool calls, messages, and errors as typed Python objects
5. **Session management** — list, inspect, and resume past agent sessions
6. **Dynamic permissions** — start restrictive, loosen as trust builds
7. **Typed errors** — catch `ProcessError`, `CLINotFoundError` etc. instead of parsing exit codes
8. **Subagent lifecycle tracking** — hooks fire when subagents start/stop

## 8. What Breaks / Changes

1. **Python dependency** — new runtime in the stack (isolated via venv)
2. **Startup latency** — ~200ms Python process init (negligible for our use case)
3. **Skill references** — `coding-agent` SKILL.md needs updating
4. **Process management** — [[OpenClaw]]'s `exec` tool manages a Python process that manages the Claude CLI process (one extra layer)
5. **Debugging** — errors could originate in Python wrapper OR CLI. Need good logging at both layers.

---

## 9. Decision Points for Trajan

1. **Phase 0 go/no-go:** Install SDK, verify auth works with Claude Max. If auth fails → blocked.
2. **Custom tools priority:** Which tools to build first? `vault_search` and `agent_dispatch` are highest value.
3. **Hook strictness:** How aggressive should safety hooks be? Audit-only vs. active blocking?
4. **Multi-turn scope:** Which agents benefit from persistent sessions? (Orchestrator, Coder for iterative work)
5. **Timeline flexibility:** 9-week plan is aggressive. Could compress Phase 2+3 or defer Phase 4.

---

## 10. References

- [Claude Agent SDK — GitHub](https://github.com/anthropics/claude-agent-sdk-python)
- [Claude Agent SDK — PyPI](https://pypi.org/project/claude-agent-sdk/)
- [SDK Python Reference](https://platform.claude.com/docs/en/agent-sdk/python)
- [SDK Permissions Guide](https://platform.claude.com/docs/en/agent-sdk/permissions)
- [SDK Hooks Guide](https://platform.claude.com/docs/en/agent-sdk/hooks)
- [[Agent Team Orchestration]] — current multi-agent architecture
- [[Self-Critique and Auto-Evolution Design]] — evolution framework that could use hooks
