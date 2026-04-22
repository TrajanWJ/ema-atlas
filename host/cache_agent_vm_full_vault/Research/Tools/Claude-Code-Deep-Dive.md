---
title: "Claude Code Deep Dive — Round 2"
type: research
created: 2026-03-24
confidence: 0.88
tags: [claude-code, hooks, agent-teams, channels, plugins, MCP, skills, programmatic, checkpointing]
sources: 12
source_tiers: "T1: 8 (official docs), T2: 2, T3: 2"
summary: "36 new patterns from deep dive into official Claude Code docs (code.claude.com). Focus: hook ecosystem completeness, agent teams, channels, plugins, checkpointing, Agent SDK programmatic usage."
---

# Claude Code Deep Dive: Research Report — Round 2

*Sources: 12 total (8 T1 primary/official docs, 2 T2 institutional, 2 T3 community)*
*Confidence: High | Date: 2026-03-24*
*Scope: Beyond awesome-claude-code. Focused on official docs, underdocumented features.*

## Summary

The official Claude Code docs at `code.claude.com` contain substantial features not covered in the first research pass. The biggest gaps: **agent teams** (experimental multi-session coordination), **channels** (push events into running sessions from Telegram/Discord), **plugin ecosystem** (distributable bundles with namespaced skills), **complete hook event catalog** (20 events vs the 3 documented in Round 1), **Agent SDK / headless mode** (full programmatic control), and **checkpointing with rewind** (built-in undo). These are all T1 sources — verified from official Anthropic documentation.

The anthropic-cookbook CLAUDE.md also revealed a real-world pattern: custom `/slash-commands` as CI/CD tools plus model alias discipline (never use dated IDs).

## Findings

### Category 1: The Complete Hook Event Catalog

The first pass documented PreToolUse, PostToolUse, PostToolUseFailure. The full event set has **20 hook events** (T1 — official docs):

| Event | What it enables |
|-------|----------------|
| `SessionStart` (matcher: `startup/resume/clear/compact`) | Inject context on session start, including re-injection after compaction |
| `UserPromptSubmit` | Pre-process/validate every user prompt |
| `PreToolUse` | Block tool calls — the one we already know |
| `PermissionRequest` | Auto-approve specific permission dialogs |
| `PostToolUse` | React after successful tool use |
| `PostToolUseFailure` | Capture errors for lessons database |
| `Notification` | Desktop alerts when Claude needs input |
| `SubagentStart` | React when a subagent is spawned |
| `SubagentStop` | Run cleanup when subagent finishes |
| `Stop` | Run on session stop |
| `StopFailure` (matcher: `rate_limit/auth/billing/etc`) | Handle API errors specifically |
| `TeammateIdle` | Fire when an agent teams teammate goes idle |
| `TaskCompleted` | React when a task is marked done |
| `InstructionsLoaded` | React when CLAUDE.md or rules files load |
| `ConfigChange` | Audit/block configuration changes |
| `WorktreeCreate` | Custom git worktree behavior |
| `WorktreeRemove` | Cleanup after worktree removal |
| `PreCompact` | Save state before compaction |
| `PostCompact` | Re-inject context after compaction |
| `Elicitation` / `ElicitationResult` | Control MCP elicitation dialogs |
| `SessionEnd` | Cleanup on session end |

**New patterns enabled by events not in Round 1:**

1. **SessionStart + `compact` matcher** → re-inject critical context automatically after compaction. Solves the #1 compaction complaint.
2. **PermissionRequest hook** → auto-approve `ExitPlanMode` dialog, or auto-approve specific safe operations. Eliminates interruptions.
3. **ConfigChange hook** → audit log of all settings changes, or block unauthorized modifications.
4. **UserPromptSubmit hook** → pre-validate prompts, inject metadata, or log all inputs.
5. **TaskCompleted hook** → trigger post-task actions (save to vault, send notification, etc.)

**Hook types** (not just shell commands):
- `type: "command"` — shell script (known)
- `type: "http"` — HTTP POST to webhook endpoint (NEW — useful for OpenClaw integration)
- `type: "prompt"` — Claude evaluates a condition and returns yes/no (NEW — for judgment-based hooks)
- `type: "agent"` — spawn a subagent to evaluate before proceeding (NEW — most powerful)

**MCP tool matching** — hooks can match MCP tools by name:
- `mcp__memory__.*` — all memory server operations
- `mcp__filesystem__write_file` — specific write operations
- `mcp__.*__write.*` — any write from any server

**Hook scope options** — where you put the hooks.json determines scope:
- `~/.claude/settings.json` — all projects
- `.claude/settings.json` — single project (committable)
- `.claude/settings.local.json` — project, not committed
- Plugin `hooks/hooks.json` — active with plugin
- Skill/agent frontmatter — active while component is active

### Category 2: Agent Teams (Experimental Multi-Session)

**Agent Teams** = multiple Claude Code instances working in parallel, coordinating via shared task list and direct inter-agent messaging. (T1 — official docs, marked experimental, v2.1.32+)

Different from subagents: teammates can message each other directly, not just report to the lead.

**Enable:**
```json
// settings.json
{
  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }
}
```

**Key patterns:**
- Lead creates team via natural language: *"Create a team with 3 teammates..."*
- Teammates self-claim tasks from shared task list
- File locking prevents race conditions on task claiming
- `Shift+Down` to cycle between teammates in-process mode
- `--teammate-mode in-process` vs `tmux` for split panes
- Plan approval workflow: require teammate to get lead approval before implementing
- `TeammateIdle` hook fires when a teammate is about to go idle (trigger next work)

**Cost warning:** Each teammate = separate context window. Token costs scale linearly with team size. Use Haiku for exploration roles.

**Best use cases:** parallel research, competing hypotheses debugging, cross-layer changes (frontend + backend + tests in parallel).

### Category 3: Channels — Push Events into Running Sessions

**Channels** = MCP servers that push events into your active Claude Code session. (T1 — official docs, research preview, v2.1.80+, requires claude.ai login)

Official supported channels: **Telegram** and **Discord**. Also: `fakechat` (localhost demo).

```bash
# Start Claude Code with Telegram channel active
claude --channels plugin:telegram@claude-plugins-official
```

This means Claude can respond to Telegram/Discord messages while you're away, in the context of an open session. Not a new API session — the same session you have running.

**Setup flow:**
1. Install plugin: `/plugin install telegram@claude-plugins-official`
2. Configure token: `/telegram:configure <token>`
3. Start with channels: `claude --channels plugin:telegram@claude-plugins-official`
4. Pair account with bot
5. Lock down: `/telegram:access policy allowlist`

**Applicability to our setup:** This is directly relevant — we're already running OpenClaw with Discord/Telegram. Claude Code sessions can be made to react to channel messages. Different from OpenClaw agents — this is Claude Code directly with a bot running while Claude works.

### Category 4: The Plugin System

**Plugins** = distributable bundles of skills, agents, hooks, MCP servers, and LSP servers. (T1 — official docs)

Plugin structure:
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json        # manifest (name, description, version)
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── agents/                # custom subagent definitions
├── hooks/
│   └── hooks.json
├── .mcp.json              # MCP server configs
├── .lsp.json              # Language Server Protocol configs
└── settings.json          # default settings when plugin active
```

Skills in plugins are **namespaced**: `/my-plugin:skill-name` (prevents conflicts).

**Plugin marketplace:** `/plugin install <name>@<marketplace>` and `/plugin marketplace add <repo>`.

**LSP plugins** — give Claude real-time code intelligence (go-to-definition, type errors after edits). Huge for typed languages. Official marketplace has pre-built plugins for TypeScript, Python, Rust. Create custom for unsupported languages via `.lsp.json`.

**Development workflow:** Use `--plugin-dir ./my-plugin` for local testing, then publish via marketplace. `/reload-plugins` picks up changes without restart.

### Category 5: Advanced Skills Features

**Bundled skills** (ship with Claude Code, not in first pass):

| Skill | What it does |
|-------|-------------|
| `/batch <instruction>` | Orchestrates large-scale parallel changes. Decomposes into 5-30 units, spawns one background agent per unit in isolated git worktrees, each opens a PR |
| `/claude-api` | Loads Claude API reference for your language. Auto-activates when code imports anthropic SDK |
| `/debug [description]` | Reads session debug log to troubleshoot Claude Code itself |
| `/loop [interval] <prompt>` | Runs a prompt repeatedly on interval (polling, babysitting deploys) |
| `/simplify [focus]` | Spawns 3 parallel review agents, aggregates findings, applies fixes |

**Skills vs Commands** — merged. Files in `.claude/commands/` still work. Skills add: supporting files directory, frontmatter, and auto-invocation based on description.

**Subagent execution** — skills can run in a subagent to isolate context:
```yaml
---
name: my-skill
description: ...
isolation: subagent  # runs in isolated context
---
```

**Auto-discovery from nested directories** — in monorepos, `packages/frontend/.claude/skills/` auto-discovered when editing frontend files.

**Supporting files in skill directory** — templates, examples, scripts. Reference from SKILL.md. Claude reads on-demand.

### Category 6: Checkpointing and Rewind

**Built-in checkpointing** (not in first pass — assumed this was third-party only) (T1 — official docs):

- Every user prompt = automatic checkpoint
- Persists across sessions for 30 days
- `Esc+Esc` or `/rewind` → scrollable list of prompts → select → choose action:
  - **Restore code and conversation** — full revert
  - **Restore conversation** — revert conversation, keep current code
  - **Restore code** — revert files, keep conversation
  - **Summarize from here** — compress from selected point forward (targeted `/compact`)

**"Summarize from here" is distinct from `/compact`:**
- `/compact` compresses entire conversation
- "Summarize from here" keeps early context intact, compresses only later messages
- Original messages preserved in transcript for reference

**Limitation:** Bash-modified files (rm, mv, cp) not tracked — only file edit tool changes are tracked.

**Fork sessions:** `claude --continue --fork-session` creates a branch off the current session, preserving the original. Different from rewind — this creates a parallel track.

### Category 7: Agent SDK / Programmatic Usage

**Agent SDK** replaces "headless mode" terminology. (T1 — official docs)

```bash
# Basic programmatic call
claude -p "Find and fix the bug in auth.py" --allowedTools "Read,Edit,Bash"

# JSON schema output
claude -p "Extract function names" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}}}'

# Streaming
claude -p "Explain recursion" --output-format stream-json --verbose --include-partial-messages
```

**`--bare` mode** (critical for CI/CD, newly documented):
- Skips auto-discovery of hooks, skills, plugins, MCP servers, auto memory, CLAUDE.md
- Reproducible: same result on every machine
- No OAuth/keychain reads — must use `ANTHROPIC_API_KEY`
- **Becoming the default for `-p` in a future release**

```bash
# CI-safe call with explicit context only
claude --bare -p "Run security audit" \
  --allowedTools "Read,Bash" \
  --append-system-prompt-file ./security-context.md
```

**`--agents` CLI flag** — define subagents as JSON for current session only (no file needed):
```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

**Output formats:** `text`, `json` (with session ID + metadata), `stream-json` (newline-delimited for real-time).

**API retry events** in stream-json: `system/api_retry` events tell you when Claude is retrying (with delay, attempt number, error type). Useful for CI pipelines.

### Category 8: Cost Management Patterns

**From official docs** (T1) — average costs documented for first time:
- Average: $6/developer/day
- 90th percentile: under $12/day
- Team average: ~$100-200/developer/month with Sonnet 4.6

**Context is the cost driver.** Every strategy is about keeping context small.

**MCP server overhead** — each connected MCP server adds tool definitions to context even when idle:
- Use `/context` to see what's consuming space
- Prefer CLI tools over MCP when available (`gh`, `aws`, `gcloud` more efficient than MCPs)
- Disable unused servers: `/mcp`
- Tool search auto-defers: `ENABLE_TOOL_SEARCH=auto:<N>` — when tools exceed N% of context, loads on-demand

**PreToolUse hook for output filtering** — intercept long outputs before they enter context:
```bash
# Filter test output to failures only
# This hook runs before Bash, filters stderr/stdout
# Input: test command about to run
# Output to Claude: only failures, not all 1000 lines
```

**Code intelligence plugins** reduce unnecessary file reads — LSP go-to-definition > grep + read multiple files.

**Custom compaction instructions** in CLAUDE.md:
```markdown
# Compact instructions
When compacting, focus on test output and code changes. Preserve all file paths mentioned.
```

**Model selection pattern:** Haiku for exploration subagents → Sonnet for main work → Opus for complex architectural decisions. Use `/model` to switch mid-session.

### Category 9: Real-World CLAUDE.md Patterns (from anthropic-cookbook)

Anthropic's own cookbook repo has a production CLAUDE.md. Key patterns not in Round 1:

1. **Model alias discipline** — never use dated model IDs (`claude-sonnet-4-6-20250514`). Always use undated aliases (`claude-sonnet-4-6`). Commit this rule explicitly.

2. **Custom slash commands as CI/CD tools** — their CLAUDE.md defines:
   - `/notebook-review` — review notebook quality
   - `/model-check` — validate Claude model references in all files
   - `/link-review` — check links in changed files
   These are available in Claude Code AND in CI (GitHub Actions with claude-code-action).

3. **Dependency management rule** — explicit "use `uv add`, never edit pyproject.toml directly." This level of specificity (name the exact command) matters more than general "follow best practices."

4. **Pre-commit hooks listed** — CLAUDE.md references that pre-commit hooks exist and should be run. Claude knows to use them.

5. **Project structure section** — explicitly maps directory names to purposes. Claude navigates without exploration cost.

### Category 10: Subagent Configuration Completeness

From official docs — subagent frontmatter fields not documented in Round 1:

```yaml
---
name: my-agent
description: When to use this agent
model: haiku        # specific model override
maxTurns: 10        # limit turns (cost control)
isolation: worktree # isolated git worktree (NEW)
background: true    # run in background (NEW)
effort: low|normal  # extended thinking level (NEW)
memory: user        # persistent memory at ~/.claude/agent-memory/
permissionMode: bypassPermissions  # override permission mode
hooks: {}           # agent-specific hooks
mcpServers: {}      # agent-specific MCP servers
skills: []          # skills this agent loads
---
```

Key new fields:
- **`isolation: worktree`** — each subagent gets its own git worktree (clean, no conflicts with other parallel agents)
- **`background: true`** — agent runs detached, doesn't occupy main terminal
- **`effort: low/normal`** — controls extended thinking (cost/quality tradeoff)
- **`maxTurns: N`** — rate-limiting / cost control for autonomous agents
- **`memory: user`** — persistent memory directory (`~/.claude/agent-memory/`) vs `none`

### Category 11: Desktop/Chrome Extension Features

From docs index (T1) — features not in first pass:

1. **Claude in Chrome extension** — connects to browser, can test web UI, debug with console logs, automate forms, extract data. UI changes verified by screenshot comparison without manual intervention.

2. **Claude Code Desktop app** — visual diff review, app previews, PR monitoring, parallel sessions with git isolation, "Dispatch sessions from your phone."

3. **GitLab CI/CD integration** — same pattern as GitHub Actions but for GitLab pipelines. `claude-code-gitlab-ci` action exists.

### Category 12: /compact with Custom Instructions

Not new but better documented than in Round 1:

```
/compact Focus on code samples and API usage
```

You can tell Claude *what to preserve* during compaction. The default compaction loses context unpredictably. Custom instructions ensure critical patterns survive.

Also: compaction can be triggered by matcher in PreCompact/PostCompact hooks with `manual` vs `auto` to distinguish user-initiated vs auto-triggered.

---

## Key Takeaways

1. **The hook ecosystem is vastly larger than Round 1 documented.** 20 events, 4 handler types, MCP tool matching, scope levels — implementing the full set enables true deterministic behavior control.

2. **Agent Teams is the "experimental feature worth watching."** Currently experimental but directionally: multiple Claude instances coordinating is the right model for complex work.

3. **Channels are directly applicable to our setup.** Claude Code can receive Telegram/Discord messages and act on them in an existing session. Complements OpenClaw's approach.

4. **`--bare` mode is the right default for CI/CD.** Reproducible, environment-independent, explicitly opted-in context only. Becomes default in future release.

5. **Built-in `/batch` skill is underutilized.** Spawns agents in git worktrees, each opens a PR. This is the right pattern for large-scale codebase changes.

6. **Checkpointing is built-in, not third-party.** "Summarize from here" as targeted compaction is a better tool than global /compact for most situations.

7. **MCP overhead is real.** Each idle MCP server consumes context. Discipline: disable unused servers, prefer CLI tools, use tool search deferral.

---

## Open Questions

- Are Channels in non-research-preview? (requires claude.ai login — API key users excluded)
- Does agent teams ship stable in 2026? Token cost at scale is prohibitive for large teams.
- Does `--bare` becoming default break existing scripted workflows that rely on CLAUDE.md loading?
- What's the MCP registry at `api.anthropic.com/mcp-registry`? Found in the MCP page source code — undocumented endpoint.

---

## Sources

1. [T1] [Hooks Reference](https://code.claude.com/docs/en/hooks) — complete event catalog, handler types, MCP matching
2. [T1] [Automate Workflows with Hooks](https://code.claude.com/docs/en/hooks-guide) — practical patterns, all use cases
3. [T1] [Create Custom Subagents](https://code.claude.com/docs/en/sub-agents) — full frontmatter fields, built-in subagents
4. [T1] [Orchestrate Teams of Claude Code Sessions](https://code.claude.com/docs/en/agent-teams) — agent teams experimental feature
5. [T1] [Push Events with Channels](https://code.claude.com/docs/en/channels) — Telegram/Discord integration
6. [T1] [Create Plugins](https://code.claude.com/docs/en/plugins) — plugin system, LSP servers
7. [T1] [Extend Claude with Skills](https://code.claude.com/docs/en/skills) — bundled skills, SKILL.md full spec
8. [T1] [Checkpointing](https://code.claude.com/docs/en/checkpointing) — built-in rewind, summarize from here
9. [T1] [Run Claude Code Programmatically](https://code.claude.com/docs/en/headless) — Agent SDK, --bare mode
10. [T1] [Best Practices](https://code.claude.com/docs/en/best-practices) — official patterns
11. [T1] [Manage Costs](https://code.claude.com/docs/en/costs) — cost figures, token reduction strategies
12. [T1] [anthropic-cookbook CLAUDE.md](https://raw.githubusercontent.com/anthropics/anthropic-cookbook/main/CLAUDE.md) — real-world Anthropic production CLAUDE.md
