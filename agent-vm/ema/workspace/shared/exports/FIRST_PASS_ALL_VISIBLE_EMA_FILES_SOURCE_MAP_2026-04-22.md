# First-pass all-visible EMA files source map

**Generated:** 2026-04-22T01:56:45+00:00  
**Machine:** `agent-vm`  
**Purpose:** give Alfred a grounded, drift-resistant map of the EMA-relevant files and roots that are actually visible on this machine before any new implementation session starts.

## Boundary

This source map is based on **agent-vm-visible files only**.

It does **not** claim:
- full host-machine completeness
- full Discord history recovery
- that every listed root is equally canonical

Use it to keep these truth layers separate:
- current architecture repo truth
- legacy/spec artifact bundles
- runtime residue/history stores
- knowledge mirrors and session-note mirrors

---

## Recommended reading order

1. `/home/trajan/Projects/ema/README.md`
2. `/home/trajan/Projects/ema/docs/EMA-MASTER-SPEC.md`
3. `/home/trajan/Projects/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
4. `/home/trajan/Projects/ema/workspace/shared/START_HERE.md`
5. `/home/trajan/workspaces/ema-context-sync/indexes/REFERENCE_INVENTORY.md`
6. `/home/trajan/workspaces/ema-context-sync/indexes/DRIFT_AUDIT.md`
7. `/home/trajan/Projects/ema/workspace/shared/exports/HERMES_EMA_LINEAGE_META_HARNESS_AUDIT_2026-04-22.md`
8. `/home/trajan/Desktop/EMA-v1.1/00-INDEX.md`
9. `/home/trajan/archive/openclaw/vm--openclaw-to-ema-migration.md`
10. `/home/trajan/.openclaw/openclaw.json`

---

## Root 1 — EMA repo

- **Path:** `/home/trajan/Projects/ema`
- **Role:** primary current EMA repo and architecture-owned workspace root visible on this machine
- **Quick counts:**
  - total visible filesystem entries: `27341`
  - markdown files: `643`
  - code files (`.ex/.exs/.py/.ts/.tsx/.sql`): `3852`
  - data files (`.json/.jsonl/.db/.sqlite`): `759`

### Read first inside this root
- `/home/trajan/Projects/ema/README.md`
- `/home/trajan/Projects/ema/docs/EMA-MASTER-SPEC.md`
- `/home/trajan/Projects/ema/docs/EMA-FULL-CONTEXT.md`
- `/home/trajan/Projects/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
- `/home/trajan/Projects/ema/docs/STREAM_OF_THOUGHT_OPERATOR_RUNBOOK.md`
- `/home/trajan/Projects/ema/daemon/lib/ema/application.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema_web/router.ex`
- `/home/trajan/Projects/ema/daemon/priv/control_plane_state.json`
- `/home/trajan/Projects/ema/workspace/shared/START_HERE.md`

### Important subroots
- `daemon/` — current daemon/control-plane/runtime code
- `cli/` — EMA CLI and command surface
- `docs/` — specs, contracts, architecture plans, runbooks
- `workspace/shared/` — architecture-owned operational collaboration surface
- `recovered/` — previous recovery/import work
- `claudeforge/` — embedded TS/operator-surface lineage snapshot

### Anti-drift note
This is the strongest current architecture root on disk, but it still contains multiple historical layers inside it. Do not assume every doc here reflects live runtime truth.

---

## Root 2 — EMA context sync workspace

- **Path:** `/home/trajan/workspaces/ema-context-sync`
- **Role:** dedicated recovery/drift-elimination workspace already created on this machine

### Anchor files
- `/home/trajan/workspaces/ema-context-sync/indexes/REFERENCE_INVENTORY.md`
- `/home/trajan/workspaces/ema-context-sync/indexes/DRIFT_AUDIT.md`
- `/home/trajan/workspaces/ema-context-sync/exports/ema_git_history_extract.md`
- `/home/trajan/workspaces/ema-context-sync/exports/claudeforge_git_history_extract.md`
- `/home/trajan/workspaces/ema-context-sync/notes/05-overarching-proposal-vision.md`
- `/home/trajan/workspaces/ema-context-sync/notes/06-capability-map-beam-native.md`

### Anti-drift note
This root already contains the most useful first-pass lineage recovery. Alfred should consume it before doing new “fresh” reconstruction work.

---

## Root 3 — EMA shared workspace exports

- **Path:** `/home/trajan/Projects/ema/workspace/shared/exports`
- **Role:** focused subsystem/context exports already produced in EMA-owned space

### Anchor files
- `/home/trajan/Projects/ema/workspace/shared/exports/STREAM_OF_THOUGHT_CONTEXT_RECON_2026-04-21.md`
- `/home/trajan/Projects/ema/workspace/shared/exports/HERMES_EMA_LINEAGE_META_HARNESS_AUDIT_2026-04-22.md`
- `/home/trajan/Projects/ema/workspace/shared/exports/ALFRED_FIRST_PROMPT_PREVENT_DRIFT_2026-04-22.md`
- `/home/trajan/Projects/ema/workspace/shared/exports/TASK_1495918781271244991_CONTEXT_AND_EMA_RECOVERY_BRIEF_2026-04-22.md`

### Anti-drift note
These are synthesized, high-value, and recent. They are not canonical source code, but they are the cleanest operator-facing recovery artifacts available now.

---

## Root 4 — EMA-v1.1 legacy design/spec bundle

- **Path:** `/home/trajan/Desktop/EMA-v1.1`
- **Role:** legacy EMA artifact/spec/design bundle with track docs and rendered diagrams
- **Quick counts:**
  - total visible filesystem entries: `94`
  - markdown files: `51`
  - code files: `1`
  - data files: `6`

### Read first inside this root
- `/home/trajan/Desktop/EMA-v1.1/00-INDEX.md`
- `/home/trajan/Desktop/EMA-v1.1/TRACKS-CHRONICLE-BACKFILL.md`
- `/home/trajan/Desktop/EMA-v1.1/Track-C-Agent-Work/README.md`
- `/home/trajan/Desktop/EMA-v1.1/Track-E-Knowledge/README.md`
- `/home/trajan/Desktop/EMA-v1.1/Track-F-UI-Representations/00-INDEX.md`
- `/home/trajan/Desktop/EMA-v1.1/Track-F-UI-Representations-v2/00-INDEX.md`

### Important subroots
- `Track-C-Agent-Work/`
- `Track-E-Knowledge/`
- `Track-F-UI-Representations/`
- `Track-F-UI-Representations-v2/`

### Anti-drift note
This root is high-value for intent and design lineage, but it is **not** the same as current repo/runtime truth.

---

## Root 5 — OpenClaw archive

- **Path:** `/home/trajan/archive/openclaw`
- **Role:** archived OpenClaw code/docs/runtime lineage and migration context
- **Quick counts:**
  - total visible filesystem entries: `7239`
  - markdown files: `39`
  - code files: `2849`
  - data files: `168`

### Read first inside this root
- `/home/trajan/archive/openclaw/vm--openclaw-to-ema-migration.md`
- `/home/trajan/archive/openclaw/control-ui/openclaw-control-ui-source/ARCHITECTURE.md`
- `/home/trajan/archive/openclaw/logs/openclaw-observer.log`

### Important subroots
- `control-ui/openclaw-control-ui-source/`
- `mcp-server/`
- `skills/`
- `logs/`
- `bin/`

### Anti-drift note
Useful for protocol, routing, continuity, and operator-surface patterns. Do **not** import archive assumptions as active truth without explicit reconciliation.

---

## Root 6 — OpenClaw runtime residue

- **Path:** `/home/trajan/.openclaw`
- **Role:** live/leftover runtime residue, sessions, config, task history, and auth/device state
- **Quick counts:**
  - total visible filesystem entries: `102875`
  - markdown files: `6622`
  - code files: `21355`
  - data files: `3603`

### Read first inside this root
- `/home/trajan/.openclaw/openclaw.json`
- `/home/trajan/.openclaw/agents/main/sessions/sessions.json`
- `/home/trajan/.openclaw/tasks/runs.sqlite`
- `/home/trajan/.openclaw/logs/config-health.json`
- `/home/trajan/.openclaw/logs/config-audit.jsonl`

### Important subroots
- `agents/main/sessions/`
- `tasks/`
- `cron/`
- `logs/`
- `identity/`
- `devices/`

### Anti-drift note
This root is extremely rich, but also dangerous: it mixes useful historical residue with auth state, device trust, and transient runtime debris. Read selectively.

---

## Root 7 — vault

- **Path:** `/home/trajan/vault`
- **Role:** knowledge store containing EMA/place.org/architecture notes and session memory
- **Quick counts:**
  - total visible filesystem entries: `5973`
  - markdown files: `3125`
  - data files: `69`

### Read first inside this root
- `/home/trajan/vault/Projects/place.org.md`
- `/home/trajan/vault/Architecture/EMA P2P Organization Mesh.md`
- `/home/trajan/vault/Claude-Code-Memory/project_ema_surfaces_architecture.md`
- `/home/trajan/vault/Research/ema-systems-research-2026-04-04.md`

### Anti-drift note
Vault is crucial for intent recovery, but it over-represents historical and speculative thinking. Pair it with repo/runtime evidence.

---

## Root 8 — wiki

- **Path:** `/home/trajan/wiki`
- **Role:** wiki mirror with project/system notes, summaries, and codebase pages
- **Quick counts:**
  - total visible filesystem entries: `3773`
  - markdown files: `1609`
  - code files: `364`
  - data files: `237`

### Read first inside this root
- `/home/trajan/wiki/spaces/default/codebases/EMA.md`
- `/home/trajan/wiki/spaces/default/codebases/ClaudeForge.md`
- `/home/trajan/wiki/spaces/default/projects/place.org.md`
- `/home/trajan/wiki/spaces/default/system/Discord-Channel-Directory.md`

### Anti-drift note
Wiki is one of the best places to recover narrative context and categorized references, but it is still a mirror/knowledge layer, not a live runtime.

---

## Root 9 — host-vault mirror

- **Path:** `/home/trajan/staging/host-vault`
- **Role:** host-vault mirror visible from `agent-vm`
- **Quick counts:**
  - total visible filesystem entries: `540`
  - markdown files: `494`

### Read first inside this root
- `/home/trajan/staging/host-vault/Session Log/2026-03-20 - place.org v0.1 through v0.5 Build Session.md`
- `/home/trajan/staging/host-vault/Trajan's Projects/place.org.md`

### Anti-drift note
This is mirrored host context, not the host itself. Use it as evidence of prior documentation, not proof of current host runtime state.

---

## Practical first-pass source map summary

If Alfred starts a recovery-first session, the simplest high-signal stack is:

### Canonical-ish current layer
- `/home/trajan/Projects/ema`

### Recovery/lineage layer
- `/home/trajan/workspaces/ema-context-sync`
- `/home/trajan/Projects/ema/workspace/shared/exports`

### Legacy intent/design layer
- `/home/trajan/Desktop/EMA-v1.1`

### Legacy runtime residue layer
- `/home/trajan/archive/openclaw`
- `/home/trajan/.openclaw`

### Knowledge mirror layer
- `/home/trajan/vault`
- `/home/trajan/wiki`
- `/home/trajan/staging/host-vault`

---

## Anti-drift usage rule

When reading from this map, always label each finding as one of:
- **live verified runtime truth**
- **repo/code truth**
- **legacy artifact/reference**
- **knowledge mirror / historical note**

That single habit will prevent most of the drift that keeps reappearing.