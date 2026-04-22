---
id: "42655ad2-a7a3-48ae-8c46-c59c9339448d"
title: ""
space: wiki
tags: []
source: manual
---

---
title: CLI Tools Cross-Pollination
tags: [research, cli, cross-pollination, critical]
source: session-2026-04-07
---

# CLI Tools — Top 10 Steals for EMA

Analyzed: cmd-ai, larksuite/cli, entire/cli, ccmanager, rulesync.

## Top Steals Ranked by Impact

### 1. Three-Layer CLI Architecture (larksuite)
- **Shortcuts** (`+prefix`): `ema proposals +approve-top` — curated, smart-defaulted
- **Domain commands**: `ema proposals approve <id>` — 1:1 REST mapping
- **Raw API**: `ema api POST /api/proposals/:id/approve --body '{...}'` — universal escape
Closes agent capability gaps without bloating surface.

### 2. `ema schema <endpoint>` Introspection (larksuite)
Returns params, request/response shapes, required actor scopes.
Machine-readable capability discovery for agents.
Use Phoenix.Router.routes/1 + open_api_spex.

### 3. Sidecar Checkpoint Branch (entire)
`ema/checkpoints/v1` git branch holds session metadata + transcripts.
Git-native, zero infra, cross-machine sync via push.
`ema rewind`, `ema resume <branch>`, `ema explain <session>`.

### 4. `ema doctor` (entire)
Elixir supervisor introspection + DB + Bridge + Claude CLI health.
Trivial for OTP — list registered processes, PubSub subscriber counts.

### 5. Project vs Local Settings Merge (entire + ccmanager)
- `ema/settings.json` (committed)
- `ema/settings.local.json` (gitignored)
- Field-level merge, local wins
- `ema status` shows both + effective config

### 6. PTY-Based Session State Detection (ccmanager)
Replace pgrep poll with PTY attachment. States: idle/busy/waiting.
Behaviour-based per-agent strategies:
```elixir
defmodule Ema.ClaudeSessions.StateDetector do
  @callback detect(pty_output :: binary()) :: :idle | :busy | :waiting
end
```

### 7. `ema sync` + `ema import` (rulesync)
EMA as source of truth for AI tool config files.
- `ema sync --targets claudecode,cursor --features rules,mcp,skills`
- `ema import --targets claudecode` (reads existing CLAUDE.md)
- Bidirectional. Generators per tool implement behaviour.

### 8. Dual-Audience Docs (larksuite)
Every README/wiki: explicit 'Human' and 'Agent' quick-start sections.
Agent section uses `--no-wait` forms.

### 9. Universal Flags (cmd-ai + larksuite)
- `--dry` on every mutation
- `--explain` for rationale
- `--format ndjson` for streaming/pipes
- `--actor <slug>` everywhere

### 10. Non-Blocking Auto-Summarization (entire)
Post-commit + post-phase-transition hooks run Claude via Bridge.
Failures log, never block. Maps to existing SystemBrain debounce.

## Bonus: ccmanager patterns
- Auto-approval via Haiku for low-risk proposals (interruptible, safe fallback)
- Worktree-aware sessions (composite key with worktree subpath)
- Status change hooks (PubSub events for desktop notifications)
- Teammate-mode auto-injection (wrap CLI flags transparently)

## Bonus: cmd-ai patterns
- `ema <free text>` bare form routes to brain dump + intent
- Local tool inventory injection (scan PATH, include in prompt)
- XDG-compliant paths with backward-compat migration
- `ema history` JSONL log of all Claude calls

## Implementation Notes (Elixir)
- Three-layer dispatcher: `Ema.CLI.Dispatcher` routes by prefix
- Schema introspection: `Phoenix.Router.routes/1` + open_api_spex
- PTY: erlexec or porcelain libs
- Checkpoint branches: `git hash-object -w` + ref updates, no working tree churn
- rulesync targets: `@behaviour Ema.Sync.Target` with generate/2 + import/1
