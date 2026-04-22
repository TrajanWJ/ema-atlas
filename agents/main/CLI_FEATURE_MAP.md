# CLI Feature Map

**Status:** Active draft
**Purpose:** Define the canonical operator CLI surface over EMA, Wiki Engine, MCP, and surface bindings.

---

## 1. Core framing

The CLI is the operator surface over EMA truth.

- `context` = what is going on
- `intent` = what we are trying to do
- `project` = current durable state
- `session/task/proposal/execution` = runtime lineage
- `wiki` = durable semantic memory
- `mcp/surface/bootstrap` = integration and bring-up

The CLI should group commands by **authority/domain**, not implementation detail.

---

## 2. Product layers

### Layer A — Runtime authority
**EMA daemon** owns:
- sessions
- tasks
- proposals
- executions
- outcomes
- project state
- intents
- bounded context packages

### Layer B — Semantic memory
**Wiki Engine** owns:
- project pages
- architecture pages
- decision pages
- intent mirror pages
- migration/ops pages

### Layer C — Access/API layer
**MCP + CLI** exposes:
- read/write surfaces into EMA + Wiki
- shared context
- bootstrap flows
- operator workflows

### Layer D — Surfaces
**Claude, Codex, OpenClaw, ClaudeForge, future Bridge/Workbench UI** all consume the same truth.

---

## 3. Canonical CLI domains

## `ema context`
Purpose:
- shared bounded context access

Commands:
- `ema context project <project>`
- `ema context operator`
- `ema context session-evidence <project>`
- `ema context package <subject>`

Backs onto:
- `context.project_package`
- `context.operator_package`
- `context.session_evidence`

---

## `ema intent`
Purpose:
- live coordination state

Commands:
- `ema intent list --project <project>`
- `ema intent get <intent-id>`
- `ema intent snapshot --project <project>`
- `ema intent bootstrap --project <project>`
- `ema intent update <intent-id>`
- `ema intent next-actions --project <project>`

Backs onto:
- `intent.list`
- `intent.get_project`
- `intent.snapshot`
- `intent.bootstrap_project`
- `intent.update`
- `intent.propose_next_actions`

---

## `ema project`
Purpose:
- canonical project state

Commands:
- `ema project get <project>`
- `ema project bootstrap <project>`
- `ema project status <project>`
- `ema project blockers <project>`
- `ema project next <project>`

---

## `ema session`
Purpose:
- canonical normalized session registry

Commands:
- `ema session list`
- `ema session get <session-id>`
- `ema session import claude`
- `ema session import codex`
- `ema session bind <session-id> --project <project>`
- `ema session evidence <project>`

---

## `ema task`
Purpose:
- task ledger over proposals/executions

Commands:
- `ema task list`
- `ema task get <task-id>`
- `ema task claim <task-id>`
- `ema task note <task-id>`
- `ema task link-intent <task-id> <intent-id>`

---

## `ema proposal`
Purpose:
- proposal review and planning lineage

Commands:
- `ema proposal list`
- `ema proposal get <proposal-id>`
- `ema proposal create`
- `ema proposal run <proposal-id>`
- `ema proposal link-intent <proposal-id> <intent-id>`

---

## `ema execution`
Purpose:
- runtime execution tracking

Commands:
- `ema execution list`
- `ema execution get <execution-id>`
- `ema execution complete <execution-id>`
- `ema execution stream <execution-id>`
- `ema execution link-session <execution-id> <session-id>`

---

## `ema wiki`
Purpose:
- semantic memory sync / durable docs

Commands:
- `ema wiki sync-project <project>`
- `ema wiki write-page <path>`
- `ema wiki link-intent <intent-id> <page>`
- `ema wiki backfill-session <session-id>`
- `ema wiki status <project>`

---

## `ema mcp`
Purpose:
- MCP baseline and parity operations

Commands:
- `ema mcp baseline show`
- `ema mcp baseline generate`
- `ema mcp diff claude`
- `ema mcp diff codex`
- `ema mcp parity openclaw`
- `ema mcp audit`

---

## `ema surface`
Purpose:
- surface bindings and role visibility

Commands:
- `ema surface list`
- `ema surface bind`
- `ema surface status`
- `ema surface openclaw parity`
- `ema surface claudeforge status`

---

## `ema bootstrap`
Purpose:
- one-time or idempotent bring-up flows

Commands:
- `ema bootstrap intents`
- `ema bootstrap project <project>`
- `ema bootstrap wiki <project>`
- `ema bootstrap mcp`
- `ema bootstrap readiness`

---

## 4. Feature map by milestone

### Milestone 1 — Read-first recovery
Must-have:
- `ema context project`
- `ema context operator`
- `ema intent list`
- `ema intent snapshot`
- `ema project get`

### Milestone 2 — Live intent bootstrap
Must-have:
- `ema intent bootstrap`
- `ema intent update`
- `ema project bootstrap`
- `ema wiki sync-project`

### Milestone 3 — Session normalization
Must-have:
- `ema session import claude`
- `ema session import codex`
- `ema session bind`
- `ema context session-evidence`

### Milestone 4 — MCP/plugin normalization
Must-have:
- `ema mcp baseline show`
- `ema mcp baseline generate`
- `ema mcp diff claude`
- `ema mcp diff codex`
- `ema mcp parity openclaw`

### Milestone 5 — Wiki/intents semantic maturity
Must-have:
- `ema wiki backfill-session`
- `ema wiki link-intent`
- `ema wiki status`
- decision/ops/architecture page sync

---

## 5. Feature ownership map

### EMA owns
- project state
- intents
- sessions
- tasks/proposals/executions
- context packages
- surface bindings

### Wiki owns
- durable semantic pages
- architecture
- decisions
- mirrored intent/project summaries

### Claude/Codex own
- provider-native session logs
- provider resume identity

### OpenClaw owns
- operator UX
- chat surface
- messaging/tools/browser bridge

### ClaudeForge owns
- web/Discord session UX
- rendering/projection surface

---

## 6. Configless operator experience

The simulated TUI/CLI should reduce to a few powerful commands:
- `ema bootstrap readiness`
- `ema context operator`
- `ema project status ema`
- `ema intent snapshot --project ema`
- `ema wiki sync-project ema`
- `ema mcp audit`

---

## 7. Recommended first implemented CLI set

1. `ema project get <project>`
2. `ema intent list --project <project>`
3. `ema intent snapshot --project <project>`
4. `ema context project <project>`
5. `ema context operator`
6. `ema wiki sync-project <project>`
7. `ema bootstrap readiness`
8. `ema mcp diff claude`
9. `ema mcp diff codex`
10. `ema mcp parity openclaw`

---

## 8. Success condition

The CLI is in good shape when an operator can recover the same project state, intent state, context package, and MCP parity information from one coherent command surface without needing vault as the primary active memory source.
