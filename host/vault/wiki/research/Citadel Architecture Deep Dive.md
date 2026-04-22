---
title: Citadel Architecture Deep Dive
created: '2026-04-01'
updated: '2026-04-01'
type: research
status: active
confidence: 0.9
tags:
  - citadel
  - claude-code
  - harness
  - hooks
  - skills
  - fleet
  - campaign
summary: >-
  Deep architecture analysis of Citadel — the leading Claude Code harness
  plugin. Source code analysis of hooks, routing, fleet mode, and campaign
  persistence.
wiki_id: research/Citadel_Architecture_Deep_Dive
imported_from: vault/Research/Citadel Architecture Deep Dive.md
imported_at: '2026-04-04T00:23:57.006Z'
---

# Citadel Architecture Deep Dive

**Repo:** [github.com/SethGammon/Citadel](https://github.com/SethGammon/Citadel)
**Stars:** 432 (April 2026)
**License:** MIT
**Install:** `claude --plugin-dir /path/to/Citadel`

## What It Is

An agent orchestration *plugin* for Claude Code. Not a wrapper — it runs *inside* Claude Code's process via the plugin system. It adds routing, memory, safety hooks, parallel coordination, and 40 skills on top of Claude Code's existing capabilities.

**Key framing:** "CLAUDE.md tells Claude about your project. Citadel gives Claude the infrastructure to work autonomously."

## Architecture Overview

```
Claude Code Process
├── Citadel Plugin (loaded via --plugin-dir)
│   ├── hooks.json — 15+ lifecycle hook definitions
│   ├── hooks_src/ — JS hook implementations
│   ├── skills/ — 40 skill definitions (CLAUDE.md-like)
│   ├── scripts/ — utility scripts (coordination, tokens, etc.)
│   └── .planning/ — per-project state directory
│       ├── campaigns/ — campaign YAML+markdown
│       ├── coordination/ — multi-agent coordination
│       │   ├── instances/ — running agent instances
│       │   └── claims/ — file-level locking
│       ├── fleet/ — parallel agent state
│       │   ├── briefs/ — discovery briefs
│       │   └── outputs/ — agent outputs
│       ├── intake/ — new task intake queue
│       ├── telemetry/ — session costs, agent runs, hook timing
│       ├── postmortems/ — failure analysis
│       ├── research/ — research artifacts
│       ├── screenshots/ — UI captures
│       └── _templates/ — campaign/task templates
```

## Hook System (Source Code Analysis)

### init-project.js (SessionStart)
- Scaffolds `.planning/` directory tree on first run
- Copies templates from plugin to project (only if missing — preserves customizations)
- Syncs utility scripts to `.citadel/scripts/` (version-gated — checks plugin version vs installed)
- Sweeps stale coordination claims from crashed sessions
- Idempotent — safe to run repeatedly

### circuit-breaker.js (PostToolUse)
- Tracks consecutive tool failures per session
- **3 consecutive failures** → suggests different approach (soft trip)
- **5 trips in a session** → hard stop, forces human intervention
- Resets on successful tool execution
- State stored in memory (session-scoped, not persisted)

### cost-tracker.js (PostToolUse)
- Reads Claude Code's native session JSONL files for **real token counts**
- Computes actual cost from API pricing tables
- Tracks burn rate ($/min) over rolling window
- Alerts at configurable thresholds: $5, $15, $30, $50, $75, $100, $150, $200, $300, $500
- Supports per-campaign budget tracking (cumulative cost per campaign slug)
- Falls back to heuristic estimation if session JSONL unavailable

### governance.js (PreToolUse — Edit|Write|Bash|Agent)
- **Never blocks** — observe-only audit log
- Logs every Edit, Write, Bash, and Agent tool call
- Truncates target to 200 chars for compact logs
- Writes to `.planning/telemetry/audit.jsonl`
- Performance target: < 5ms overhead per call
- Skips noisy tools: Read, WebSearch, WebFetch

### quality-gate.js (Stop)
Cold-path verification lenses on recently-changed files (via `git diff --name-only HEAD`):

| Lens | Files | What It Checks |
|---|---|---|
| **performance** | .ts/.tsx/.js/.jsx/.css/.scss | `transition-all`, `confirm()`, `alert()`, magic intervals |
| **accessibility** | .ts/.tsx/.jsx | Missing `aria-label`, `role` on interactive elements |
| **adversarial** | .ts/.tsx/.js/.jsx/.py/.go | XSS vectors, `eval()`, `innerHTML`, unsafe patterns |
| **contractual** | .md (skill files) | Required skill file structure |
| **cross-reference** | .md | Docs match code signatures |
| **custom** | source files | User-defined regex rules via `harness.json` |

Lenses are configurable — can be disabled per-project in `harness.json`.

### session-end.js (SessionEnd)
- Logs session cost data to `.planning/telemetry/session-costs.jsonl`
- Two-layer cost: real tokens (from session JSONL) + estimation fallback
- Marks active campaign continuation state
- Increments trust counters for contextual appropriateness
- Cleans up expired dynamic directories
- Updates daemon state for scheduled tasks
- Queues doc sync entries for next session

### external-action-gate.js (PreToolUse — Bash)
- Consent system for external actions (git push, gh pr create, etc.)
- First-encounter choice: always-ask, session-allow, or auto-allow
- Protected branches can't be deleted
- Path traversal and secrets exfiltration blocked

## The /do Router (4-Tier Classification)

### Tier 1: Pattern Match (Regex)
```javascript
// Zero tokens, instant
if (/^fix\s+(the\s+)?typo/i.test(input)) return { skill: 'direct-edit' };
if (/^(run|execute)\s+tests?/i.test(input)) return { skill: 'marshal', mode: 'test' };
```

### Tier 2: Session State
```javascript
// Zero tokens, instant
const activeCampaign = readActiveCampaign();
if (activeCampaign && /continue|resume|pick up/i.test(input)) {
  return { skill: 'archon', campaign: activeCampaign.slug };
}
```

### Tier 3: Keyword Lookup
```javascript
// Zero tokens, instant
const SKILL_KEYWORDS = {
  'review': 'review',
  'test': 'test-gen',
  'refactor': 'refactor',
  'document': 'doc-gen',
  'debug': 'systematic-debugging',
  // ... 40+ skill keywords
};
```

### Tier 4: LLM Classification (~500 tokens)
```javascript
// Only when tiers 1-3 don't match
const classification = await classifyWithLLM(input, {
  schema: { complexity: 'trivial|single|multi|parallel', domain: '...', skills: [...] }
});
// Routes to: Marshal (single-step), Archon (multi-session), or Fleet (parallel)
```

## Fleet Mode (Parallel Agents)

### How It Works
1. **Decompose** — Break task into independent subtasks
2. **Spawn** — Each agent runs in an isolated `git worktree`
3. **Discover** — Agents write discovery briefs to `.planning/fleet/briefs/`
4. **Relay** — Between waves, discovery briefs are shared with next wave's agents
5. **Merge** — Results from all worktrees combined
6. **Cleanup** — Worktrees removed after successful merge

### Coordination via File System
```
.planning/coordination/
├── instances/
│   ├── agent-1.json    # { status: "running", task: "...", worktree: "..." }
│   ├── agent-2.json
│   └── agent-3.json
└── claims/
    ├── src-auth.lock    # Prevents two agents from editing same files
    └── src-api.lock
```

### Discovery Relay
```
Wave 1: Agent-1 → brief-1.md ("Found that auth uses JWT, session store is Redis")
         Agent-2 → brief-2.md ("API routes follow RESTful pattern, versioned at /v2")
         
Wave 2: Agent-3 reads brief-1.md + brief-2.md → builds on discoveries
         Agent-4 reads all briefs → integrates findings
```

## Campaign Persistence

### Campaign File Format (.planning/campaigns/my-campaign.md)
```yaml
---
slug: api-overhaul
status: active
started: 2026-03-28
phases:
  - name: analysis
    status: completed
    started: 2026-03-28
    completed: 2026-03-28
  - name: implementation
    status: in-progress
    started: 2026-03-29
decisions:
  - "Use Express middleware pattern for auth"
  - "Keep backward compat for v1 routes"
context_summary: |
  Overhauling the API layer from monolithic routes to modular middleware.
  Auth module is fragile — touching it broke things twice in analysis phase.
---

# API Overhaul Campaign

## Phase 1: Analysis (COMPLETED)
- Mapped all 47 routes
- Identified 12 with auth dependencies
- Found 3 circular import chains

## Phase 2: Implementation (IN PROGRESS)
- [ ] Extract auth middleware
- [x] Create route module pattern
- [ ] Migrate first 10 routes
```

### Session Continuation
When Claude's context gets compressed or a new session starts:
1. `init-project.js` runs, scaffolds state
2. `/do continue` or `/do resume` triggers
3. Router (Tier 2) detects active campaign
4. Loads campaign file, injects into context
5. Claude picks up exactly where it left off

## Telemetry

### session-costs.jsonl
```json
{"timestamp":"2026-04-01T04:00:00Z","session_id":"abc","campaign":"api-overhaul","agent_count":3,"duration_minutes":12,"real_input_tokens":45000,"real_output_tokens":12000,"real_cost_usd":0.18}
```

### agent-runs.jsonl
```json
{"timestamp":"...","event":"agent-start","agent_id":"fleet-1","task":"extract auth middleware","worktree":"/tmp/wt-fleet-1"}
{"timestamp":"...","event":"agent-complete","agent_id":"fleet-1","status":"success","files_changed":4}
```

## What EMA Should Steal

| Pattern | How to Implement in EMA |
|---|---|
| 4-tier routing | Elixir pattern matching (tier 1-3) + Claude call (tier 4) |
| Circuit breaker | GenServer state counter, reset on success |
| Campaign persistence | PostgreSQL campaigns table, not file-based |
| Fleet mode | Spawn multiple Claude Bridge processes, each with own worktree |
| Quality gates | Post-completion Elixir module that runs verification |
| Cost tracking | Parse `~/.claude/projects/*/sessions/*.jsonl` |
| Governance audit | Log to SQLite + broadcast via PubSub |
| Discovery relay | PubSub messages between Bridge processes |

## Cross-References
- [[Harness Engineering Discipline]] — the broader field
- [[Claude Code CLI Integration Reference]] — the underlying CLI APIs
- [[EMA Claude Bridge Design]] — EMA's implementation plan
- [[Claude Code Harness Ecosystem Analysis]] — competitive landscape
