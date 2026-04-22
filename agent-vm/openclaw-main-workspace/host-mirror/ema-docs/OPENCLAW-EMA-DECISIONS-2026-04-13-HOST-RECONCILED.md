# OpenClaw ↔ EMA Decisions — 2026-04-13 (Host-Reconciled)

Status: reconciled against live host repo reality on `host-machine`.

## What changed in understanding

Earlier analysis assumed the older EMA daemon tree was still the active runtime.
Live host inspection shows the active EMA system is now a **TypeScript-first Electron monorepo** with:

- `apps/electron` — desktop host
- `apps/renderer` — renderer/UI
- `services` — local HTTP + WebSocket compatibility backend on `:4488`
- `workers` — background watchers and job runtime
- `cli` — TypeScript CLI
- `shared` — contracts/schemas/types

The old Elixir/Phoenix/Tauri daemon is now archived under `IGNORE_OLD_TAURI_BUILD/`.

That changes the cross-pollination framing significantly.

## Decision 1 — EMA is still daemon-like, but the daemon is now the local TS services runtime

EMA should still be reasoned about as a daemon-centered system in the architectural sense:
- long-lived local runtime
- canonical backend/state transitions
- local operator surfaces and runtime fabrics attached to it

But the current active implementation is **not** the old Elixir daemon as the mainline runtime.
It is the TypeScript `services` backend plus `workers`, launched under the Electron host.

Implications:
- say "daemon" as an architectural role, not as shorthand for the old `daemon/` codebase
- do not describe `IGNORE_OLD_TAURI_BUILD/daemon` as the active runtime
- route current implementation work toward `services`, `workers`, `shared`, and Electron integration

## Decision 2 — The active EMA backend contract is the TS services layer on :4488

The machine-local backend authority now lives in the TypeScript services layer.
That is the contract OpenClaw and other runtimes should integrate against when they need live EMA backend truth.

Implications:
- prefer current `/api/*` surfaces backed by `services`
- prefer `docs/backend/*`, `docs/OPERATING-REALITY.md`, and `docs/GROUND-TRUTH.md` over stale daemon-era docs
- treat the archived Elixir runtime as reference/parity material only

## Decision 3 — OpenClaw remains runtime fabric; EMA remains orchestration truth

Even after the architecture shift, the clean split still holds:
- OpenClaw is strongest as messaging/tool/session/runtime fabric
- EMA is strongest as orchestration/control-plane/knowledge fabric

Implications:
- OpenClaw should execute, relay, route, and interact
- EMA should absorb intent, proposals, executions, memory, runtime metadata, and operator truth
- the bridge should stay narrow and explicit

## Decision 4 — Integrate against the new source-of-truth hierarchy, not old lore

EMA now explicitly defines a source-of-truth hierarchy.
Cross-system integrations should respect it.

Current rule of thumb:
1. `ema-genesis/` and active filesystem intent/GAC sources for semantic truth
2. active TS runtime code in `services/core/*`
3. SQLite operational state in `~/.local/share/ema/ema.db`
4. generated artifacts/results
5. vault/wiki and legacy docs

Implications:
- OpenClaw/EMA integration should not treat random docs or archive paths as authoritative
- machine-readable integration should prefer the active backend contract and operational data model

## Decision 5 — Runtime fabric is a first-class EMA subsystem

EMA now has an explicit `runtime-fabric` subsystem that owns local coding-agent control, tmux-backed session management, tool detection, session capture, and input relay.

Implications:
- this is the natural seam between EMA and external coding runtimes
- avoid reviving older ambiguous concepts like separate bridge/session shells if `runtime-fabric` already owns the problem
- future OpenClaw integration should respect `runtime-fabric` as the local session/runtime authority inside EMA

## Decision 6 — Interaction routing and execution routing stay split

This still stands after host reconciliation:
- interaction routing: which chat/agent/runtime/session receives work
- execution routing: which backend/model/tool/session substrate performs work

Implications:
- OpenClaw is excellent at interaction routing and session dispatch across surfaces
- EMA is well-positioned to own execution routing policy, intent alignment, and durable recording
- do not collapse both responsibilities into one opaque router

## Decision 7 — Accounts and sync must terminate at local policy boundaries

EMA's move toward richer runtime fabrics, local services, and decentralized ambitions makes this more important, not less.

Implications:
- sync artifacts, lineage, and selected runtime metadata
- do not sync unrestricted host authority
- accounts should decompose into principal/device/capability/domain concepts
- local node policy must re-check before action

## Decision 8 — Docs are now part of system integrity, not commentary

The host repo contains explicit current-state docs like:
- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`
- `docs/backend/SOURCE-OF-TRUTH.md`
- `docs/backend/RUNTIME-FABRIC.md`

These are not optional notes; they are part of keeping the architecture legible.

Implications:
- doc reconciliation is an operational workstream
- stale daemon-era descriptions should be clearly archived or corrected
- agent/system prompts should reference current-state docs first

## Decision 9 — "EMA should be a daemon" remains true if interpreted structurally

The right interpretation is:
- EMA needs a durable local control/runtime process with stable contracts and state ownership
- that role is currently served by the TS services/workers runtime, not the old Elixir tree

Implications:
- keep the daemon principle
- avoid attaching that principle to the archived implementation specifically

## Decision 10 — Host-machine reconciliation should drive doc sync

Because EMA has changed substantially, local notes must be reconciled against host truth before being promoted.

Implications:
- inspect host reality first
- update versioned docs second
- mirror/sync to host operational docs third
- record decisions after reconciliation, not before

## Recommended next work

1. Reconcile any remaining docs that still imply the archived Elixir daemon is active.
2. Add a short integration contract note for OpenClaw against the current TS services/runtime-fabric architecture.
3. Clarify how `cli` should relate to live services versus canon-only reads.
4. Define the future boundary between EMA `runtime-fabric` and OpenClaw runtime/session orchestration.
