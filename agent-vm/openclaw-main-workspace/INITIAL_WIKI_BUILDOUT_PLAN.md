# Initial Wiki Buildout Plan

**Goal:** Make Wiki the primary durable semantic memory layer for EMA/host CLI integration work.

---

## Canonical pages to create first

### Projects
- `projects/EMA`
- `projects/Host CLI Integration`
- `projects/MCP Baseline`
- `projects/Session Normalization`

### Architecture
- `architecture/Canonical Architecture`
- `architecture/Session Model`
- `architecture/Context Contract`
- `architecture/Intent Model`

### Operations / migration
- `operations/Vault Deprecation`
- `operations/OpenClaw Capability Parity`
- `operations/Codex Parity`

---

## Required page sections

Each canonical page should include:
- Summary
- Current truth
- Canonical target
- Transitional legacy notes
- Active blockers
- Next actions
- Linked intents
- Linked sessions/executions/wiki refs

---

## Write rules

1. Distill; do not transcript-dump.
2. Link to intent ids and project ids when available.
3. Prefer durable decisions and current blockers over narrative recap.
4. Keep page summaries short and operational.
5. Mark stale sections explicitly rather than silently rewriting history.

---

## First sync targets

If a live sync path is added, update these pages first:
- `projects/EMA`
- `projects/Host CLI Integration`
- `architecture/Canonical Architecture`

---

## Definition of sufficient buildout

Wiki buildout is sufficient for initial bootstrap when:
- current EMA status can be understood from wiki alone
- active blockers and next actions are visible
- intent links exist
- vault is no longer necessary for normal continuation
