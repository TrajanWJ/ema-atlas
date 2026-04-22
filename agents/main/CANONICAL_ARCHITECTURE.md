# Canonical Architecture

**Status:** Draft canonical target
**Scope:** EMA, Wiki Engine, Claude, Codex, OpenClaw, ClaudeForge, MCP
**Purpose:** Define one shared source-of-truth model and reduce split-brain across runtime, memory, session, and surface layers.

---

## 1. Core thesis

EMA is the canonical host control plane.

Wiki Engine is the canonical semantic memory substrate.

Claude and Codex are host-native session providers whose durable session artifacts must be imported and normalized by EMA.

OpenClaw and ClaudeForge are operator/session surfaces bound to EMA state, not independent authorities.

Vault is deprecated as the primary operational memory substrate and becomes import/archive/mirror only.

---

## 2. Authority map

### 2.1 Canonical authorities

#### EMA
EMA owns:
- canonical task / proposal / execution / outcome authority
- canonical session registry
- canonical context assembly
- canonical surface bindings
- runtime/control truth

#### Wiki Engine
Wiki owns:
- durable project summaries
- architecture docs
- decisions
- semantic graph / linked knowledge
- long-lived memory

#### Intent layer
Intent owns:
- current focus
- objectives
- blockers
- next actions
- alignment between projects, sessions, executions, and wiki state

#### Claude / Codex native stores
Claude and Codex native stores are authoritative for:
- provider-native durable session history
- provider session identity
- event/transcript evidence

They are not authoritative for cross-surface orchestration truth.

### 2.2 Surfaces, not authorities

#### OpenClaw
OpenClaw is:
- operator shell
- messaging/runtime bridge
- Discord/chat workflow surface

OpenClaw is not:
- canonical session authority
- canonical memory authority
- canonical orchestration authority

#### ClaudeForge
ClaudeForge is:
- Discord/web session surface
- rendering/UX layer
- projection of normalized session/control-plane truth

ClaudeForge is not:
- canonical task/session authority

#### Discord
Discord is a communication surface only.

### 2.3 Transitional / legacy authorities

The following are still operationally relevant but transitional:
- dispatch shell loop
- `dispatch.db`
- provider-local mirrored state
- vault-derived session catalogs
- duplicate surface-local stores

### 2.4 Non-authorities

The following must not be treated as canonical truth:
- Discord threads
- OpenClaw local chat memory
- ClaudeForge local DB
- tmux presence
- ad hoc prompt blobs
- vault as primary operational memory

---

## 3. Current operational reality

Current reality includes overlapping systems:
- EMA daemon control-plane/surfaces runtime
- ClaudeForge session/task stack
- Wiki Engine semantic/context stack
- OpenClaw operator/runtime stack
- Claude/Codex provider-native session logs
- transitional dispatch/runtime artifacts

This overlap is transitional and should be normalized under EMA.

---

## 4. Session model

EMA is the canonical session registry.

Each canonical session record must include:
- `ema_session_id`
- `provider`
- `provider_session_id`
- `project_id`
- `workspace_key`
- `status`
- `created_at`
- `updated_at`
- `surface_bindings`
- `linked_task_ids`
- `linked_execution_ids`
- `linked_proposal_ids`
- normalized messages/events
- provenance/source metadata

### Rule
Claude and Codex must be treated as host-native session systems, not merely subprocess wrappers.

---

## 5. Context contract

EMA must assemble bounded context packages for all clients.

### Source precedence
1. live EMA host/runtime truth
2. durable Wiki decisions and semantic memory
3. EMA project/task/execution state
4. EMA-normalized session evidence
5. local chat/session context

### Rule
Clients must not assemble their own unbounded memory stacks as the primary cross-surface context path.

---

## 6. Intent model

Intent is the active-work coordination layer.

Intent records track:
- current focus
- objectives
- blockers
- next actions
- related projects
- related tasks/proposals/executions
- linked wiki pages
- linked session evidence

### Rule
Intent is not prompt residue or transient chat state. It is durable coordination state.

---

## 7. MCP model

MCP should be generated from EMA host contracts.

### Canonical MCP domains
- `context.*`
- `intent.*`
- `sessions.*`
- `tasks.*`
- `proposals.*`
- `executions.*`
- `wiki.*`
- `surfaces.*`

### Rule
Host API contract first. MCP projection second. Surface prompt UX last.

---

## 8. Vault position

Vault is deprecated as the primary operational memory substrate.

Vault remains useful as:
- import source
- archival mirror
- historical notes

New operational truth should be written to:
- EMA runtime/control state
- Wiki semantic memory
- Intent records

---

## 9. Migration order

1. Freeze canonical docs/contracts
2. Normalize auth/config authority
3. Make EMA the canonical session registry
4. Expose canonical context package endpoints
5. Bootstrap intent state in EMA
6. Sync durable summaries into Wiki
7. Rebind OpenClaw/ClaudeForge/Discord as surfaces over EMA
8. Demote vault and duplicate truth paths

---

## 10. Success condition

The architecture is working when Claude, Codex, and OpenClaw can all:
- recover the same EMA project state
- read the same active intents
- update the same intent/project truth via MCP
- and see Wiki reflect the durable summary

without vault being required as the primary source.
