# EMA Host Session Implementation Map — Concrete File Ownership

Generated: 2026-04-06 UTC

## Goal

Map the proposed host-native Claude/Codex session model onto the **actual EMA codebase** so implementation can start without more architecture drift.

This document answers:
- which files should own host session discovery/import
- which files currently block first-class Codex parity
- where normalized session state should live
- which HTTP/CLI surfaces should expose it

---

## TL;DR

The codebase already has the right high-level seams:

- **surface discovery** → `daemon/lib/ema/surfaces/discovery.ex`
- **live Claude wrapper** → `daemon/lib/ema/surfaces/claude_session.ex`
- **live Codex wrapper** → `daemon/lib/ema/surfaces/codex_session.ex`
- **runtime session registry** → `daemon/lib/ema/sessions/registry.ex`
- **HTTP API** → `daemon/lib/ema_web/controllers/surfaces_controller.ex`
- **CLI surface** → `cli/ema_cli/commands/surfaces.py`
- **durable control-plane schemas** → `daemon/lib/ema/control_plane/schema.ex`

So the next move is **not** inventing a new subsystem. It is extending these seams with:

1. host session discovery/import
2. normalized provider event storage
3. surface bindings
4. provider-specific resume/discovery adapters

---

## What Exists Today

### 1. Discovery already knows surfaces exist
**File:** `daemon/lib/ema/surfaces/discovery.ex`

Current behavior:
- discovers `claude`, `codex`, `openclaw`, `gateway`, `ollama`
- checks CLI existence/auth/version
- returns status map

Gap:
- discovery stops at **tool availability**
- it does **not** discover host-native session artifacts in:
  - `~/.claude/projects`
  - `~/.codex/sessions`

Required evolution:
- extend discovery to include **session substrate discovery**, not just executable discovery
- report:
  - session roots present?
  - count of discoverable sessions
  - whether importable history exists
  - last-seen session timestamps

### 2. Claude session wrapper exists
**File:** `daemon/lib/ema/surfaces/claude_session.ex`

Current behavior:
- manages one live Claude session process
- uses Claude CLI port execution
- maintains `session_id`
- supports prompt sending and some resume semantics
- records execution events

Gap:
- it is still a **live-process wrapper**, not a host-history adapter
- it does not import from `~/.claude/projects`
- it does not expose normalized event stream from historical session JSONL

Required evolution:
- keep it as the **live Claude control adapter**
- do **not** make it responsible for filesystem discovery/import
- add optional hooks to bind live turns to imported host sessions

### 3. Codex session wrapper exists but is too thin
**File:** `daemon/lib/ema/surfaces/codex_session.ex`

Current behavior:
- runs `codex exec --json`
- buffers result
- provides status + timeout handling

Gap:
- no real provider-native session import
- no actual host-session discovery
- no event normalization from Codex JSONL
- resume semantics are weak / effectively absent
- much less capable than ClaudeSession

Required evolution:
- keep this only as the **live Codex control adapter**
- add a separate **Codex host session importer/normalizer**
- eventually let this adapter attach to provider-native session ids instead of acting like a one-shot executor

### 4. Runtime session registry exists
**File:** `daemon/lib/ema/sessions/registry.ex`

Current behavior:
- in-memory execution/session fact registry
- tracks live sessions
- stores operator actions
- handles restart/kill actions

Gap:
- registry is centered on **live runtime ownership**, not imported host history
- no concept of:
  - imported sessions
  - provider session bindings
  - Discord/OpenClaw/ClaudeForge surface bindings
  - normalized session events/messages

Required evolution:
- keep it as **runtime fact registry**
- augment to reference imported session identity and surface bindings
- do not turn it into the durable event store itself

### 5. Surfaces controller exists
**File:** `daemon/lib/ema_web/controllers/surfaces_controller.ex`

Current behavior:
- exposes discovered surfaces
- exposes active Claude sessions
- exposes host-truth
- can create Claude/Codex sessions
- can send prompt to Claude sessions

Gap:
- strongly biased toward live sessions
- `send_prompt` path is Claude-specific
- `list_active_sessions` only lists Claude sessions
- no host-session import endpoints
- no normalized session query API

Required evolution:
- expose provider-neutral session endpoints
- expose imported session listing and lookup
- expose normalized event/message streams
- expose surface bindings and provider-native metadata

### 6. CLI surface exists
**File:** `cli/ema_cli/commands/surfaces.py`

Current behavior:
- lists discovered surfaces
- shows host truth / peers / gateway

Gap:
- no host session commands
- no import/discover session commands
- no provider-neutral session browsing

Required evolution:
- add CLI entrypoints for:
  - `ema surfaces sessions`
  - `ema surfaces sessions import`
  - `ema surfaces sessions tail`
  - `ema surfaces sessions bind`

### 7. Durable schemas exist, but only for control-plane entities
**File:** `daemon/lib/ema/control_plane/schema.ex`

Current behavior:
- Proposal
- Execution
- Outcome
- Event

Gap:
- no schema for host-native session identity
- no schema for session events/messages
- no schema for surface bindings

Required evolution:
- add durable schemas for imported session identity + normalized provider events

---

## Recommended New Modules

These should be added under `daemon/lib/ema/surfaces/` and `daemon/lib/ema/control_plane/`.

### A. `daemon/lib/ema/surfaces/session_import.ex`
**Purpose:** provider-neutral import entrypoint

Responsibilities:
- dispatch import/discovery by provider
- discover host session roots
- schedule import scans
- expose provider-neutral results to controller/API

Suggested API:
- `discover_all/0`
- `discover_provider/1`
- `import_session/2`
- `import_recent/2`
- `list_imported_sessions/1`

### B. `daemon/lib/ema/surfaces/providers/claude_importer.ex`
**Purpose:** import Claude session history from `~/.claude/projects`

Responsibilities:
- scan project dirs
- decode project slug to real path
- parse Claude JSONL
- map transcript events → normalized EMA session events/messages
- extract provider session id, cwd, timestamps

### C. `daemon/lib/ema/surfaces/providers/codex_importer.ex`
**Purpose:** import Codex session history from `~/.codex/sessions`

Responsibilities:
- scan dated Codex session dirs
- parse `session_meta`, `turn_context`, `event_msg`, `response_item`
- map function_call/function_call_output pairs
- extract provider session id, cwd, timestamps, tool events
- expose token/rate-limit/reasoning telemetry where available

### D. `daemon/lib/ema/surfaces/session_normalizer.ex`
**Purpose:** normalize provider-native raw event formats into EMA event/message records

Responsibilities:
- provider-neutral event normalization contract
- normalize:
  - session lifecycle
  - user/assistant messages
  - tool invocations/results
  - token/cost telemetry
  - reasoning/summary metadata

### E. `daemon/lib/ema/surfaces/session_bindings.ex`
**Purpose:** maintain bindings between EMA sessions and surfaces

Responsibilities:
- bind provider session ↔ EMA session
- bind EMA session ↔ Discord thread/channel
- bind EMA session ↔ OpenClaw session key
- bind EMA session ↔ ClaudeForge session id
- bind EMA session ↔ execution/proposal/task ids

---

## Recommended Schema Additions

**Primary file:** `daemon/lib/ema/control_plane/schema.ex`

Add the following Ecto schemas.

### 1. `HostSession`
Suggested table: `control_plane_host_sessions`

Fields:
- `id` (EMA session id)
- `provider`
- `provider_session_id`
- `provider_project_key`
- `cwd`
- `title`
- `status`
- `source` (`imported` | `live` | `imported_live_bound`)
- `started_at`
- `last_activity_at`
- `metadata`

### 2. `HostSessionEvent`
Suggested table: `control_plane_host_session_events`

Fields:
- `id`
- `host_session_id`
- `provider`
- `provider_event_kind`
- `event_kind`
- `sequence`
- `occurred_at`
- `payload`
- `raw_ref`
- `metadata`

### 3. `HostSessionMessage`
Suggested table: `control_plane_host_session_messages`

Fields:
- `id`
- `host_session_id`
- `role`
- `content`
- `occurred_at`
- `provider_event_id`
- `metadata`

### 4. `SurfaceBinding`
Suggested table: `control_plane_surface_bindings`

Fields:
- `id`
- `host_session_id`
- `surface_type`
- `surface_id`
- `binding_kind`
- `metadata`
- timestamps

Examples:
- Discord thread binding
- OpenClaw session key binding
- ClaudeForge session binding
- execution/proposal binding

---

## Exact File-by-File Change Plan

### File: `daemon/lib/ema/surfaces/discovery.ex`
**Change:** extend surface discovery with host session substrate facts

Add under `details` for Claude:
- `session_store_root`
- `session_store_present`
- `discoverable_sessions`
- `last_session_at`

Add under `details` for Codex:
- `session_store_root`
- `session_store_present`
- `discoverable_sessions`
- `last_session_at`
- `structured_event_logs: true`

Do **not** do full import here.
Only surface capability/availability summary.

### File: `daemon/lib/ema/surfaces/claude_session.ex`
**Change:** keep as live execution adapter, add binding hooks

Add:
- optional `host_session_id`
- optional binding to imported provider session record
- events should reference normalized host session identity when available

Do **not** burden this file with filesystem scanning logic.

### File: `daemon/lib/ema/surfaces/codex_session.ex`
**Change:** split live execution from import concerns

Short-term:
- keep live wrapper
- add explicit note in module/docs that it is live-control only

Medium-term:
- accept a provider-native session binding / imported session reference
- add true resume support via Codex-native semantics

### File: `daemon/lib/ema/sessions/registry.ex`
**Change:** add imported-session awareness

Suggested additions to session fact map:
- `provider_session_id`
- `host_session_id`
- `surface_bindings`
- `source`

This allows runtime actions to operate on sessions that are:
- started live in EMA
- imported from host history
- or both

### File: `daemon/lib/ema_web/controllers/surfaces_controller.ex`
**Change:** add provider-neutral host session endpoints

Suggested new endpoints:
- `GET /api/surfaces/sessions`
- `GET /api/surfaces/sessions/:id`
- `POST /api/surfaces/sessions/import`
- `GET /api/surfaces/sessions/:id/events`
- `GET /api/surfaces/sessions/:id/messages`
- `POST /api/surfaces/sessions/:id/bind`

Also fix existing asymmetry:
- `list_active_sessions` should include Codex as well as Claude
- prompt routing should be provider-neutral or explicitly provider-scoped

### File: `cli/ema_cli/commands/surfaces.py`
**Change:** expose host session functionality to operators

Suggested commands:
- `ema surfaces sessions list`
- `ema surfaces sessions import --provider claude`
- `ema surfaces sessions import --provider codex`
- `ema surfaces sessions show <id>`
- `ema surfaces sessions tail <id>`
- `ema surfaces sessions bind <id> --discord-thread ...`

### File: `daemon/lib/ema/control_plane/schema.ex`
**Change:** add durable host session schemas listed above

This is the cleanest place because the control plane is already the durable audit/persistence seam.

---

## Strongest Existing Reuse Opportunities

### Best place to hang normalized session truth
**Use:** `daemon/lib/ema/control_plane/schema.ex`

Why:
- already intended as durable persistence path
- already close to audit/event storage
- host sessions are operational truth that should be queryable and recoverable

### Best place for provider-neutral orchestration
**Use:** new `Ema.Surfaces.SessionImport`

Why:
- `Ema.Surfaces` already owns surface concerns
- importing host session stores is a surface concern first, not a UI concern

### Best place for live-vs-import merge
**Use:** `daemon/lib/ema/sessions/registry.ex`

Why:
- already maintains runtime session facts
- can fuse imported host session identity with active live processes

### Best place for operator exposure
**Use:** `EmaWeb.SurfacesController` + `ema_cli.commands.surfaces`

Why:
- already the operator-facing surface contract
- avoids creating another API namespace for basically the same concept

---

## Concrete First Patch Sequence

### Patch 1 — low-risk visibility
1. extend `surfaces/discovery.ex` to report Claude/Codex session-store facts
2. extend `surfaces_controller.ex` to include those details
3. extend `cli/ema_cli/commands/surfaces.py` to display them

Outcome:
- operators can see host session substrate health immediately
- no persistence refactor required yet

### Patch 2 — durable model
1. add `HostSession`, `HostSessionEvent`, `HostSessionMessage`, `SurfaceBinding` to `control_plane/schema.ex`
2. add matching persistence support in control-plane store/persistence layer

Outcome:
- durable landing zone for imported host-native sessions

### Patch 3 — Claude importer
1. add `surfaces/session_import.ex`
2. add Claude importer module
3. import from `~/.claude/projects`
4. expose list/query API

Outcome:
- Claude becomes truly first-class in EMA, backed by host truth

### Patch 4 — Codex importer
1. add Codex importer module
2. normalize Codex JSONL events
3. expose imported Codex sessions through same API

Outcome:
- Codex becomes real, not just a wrapped exec surface

### Patch 5 — live/imported merge
1. augment `sessions/registry.ex`
2. bind live Claude/Codex sessions to imported provider-native identities
3. add surface bindings

Outcome:
- Discord/OpenClaw/ClaudeForge can all talk about the same session identity

---

## What Not To Do

Do **not**:
- keep stuffing host session truth into ad hoc tmux/process wrappers
- make `surfaces_controller.ex` itself parse provider JSONL
- let ClaudeForge’s local DB become the canonical source of session truth
- model Codex parity as merely “add provider enum support”

That would recreate the same split-brain problem in a different shape.

---

## Bottom Line

If implementation starts tomorrow, the concrete owners are:

- **surface availability + session store presence** → `surfaces/discovery.ex`
- **live provider control** → `claude_session.ex`, `codex_session.ex`
- **runtime live/imported session fact merging** → `sessions/registry.ex`
- **durable normalized host session truth** → `control_plane/schema.ex` (+ persistence layer)
- **operator API** → `surfaces_controller.ex`
- **operator CLI** → `cli/ema_cli/commands/surfaces.py`
- **new host session import/normalization seam** → new modules under `daemon/lib/ema/surfaces/`

That is the shortest path from “analysis” to “real EMA integration.”
