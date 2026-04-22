# OpenClaw ↔ EMA Decisions — 2026-04-13

Status: working decisions after repo/docs review plus OpenClaw live host inspection.

## Decision 1 — EMA is a daemon-first system

EMA should be treated as a daemon-centered control plane, not a loose collection of surfaces.

Implications:
- `daemon/` is the canonical runtime.
- CLI, OpenClaw integration, wiki surfaces, and other UIs are clients/adapters around the daemon.
- Docs should describe EMA from daemon outward, not surface inward.

## Decision 2 — OpenClaw is an execution/runtime substrate, not EMA's source of truth

OpenClaw should be used as a runtime fabric for messaging, tools, sessioned agent execution, and operator interaction.
EMA should remain the system of record for:
- proposals
- executions
- lineage
- intent
- operator/control-plane state

Implications:
- durable work state should land in EMA
- live tool/runtime behavior can happen in OpenClaw
- OpenClaw-facing integrations should prefer `ema openclaw ...` wrappers

## Decision 3 — Canonical bridge is wrapper-first

The canonical integration lane from OpenClaw into EMA is the EMA CLI wrapper:
- `ema openclaw status`
- `ema openclaw context`
- `ema openclaw host-truth`
- `ema openclaw propose`
- `ema openclaw run`
- `ema openclaw dispatch-update`
- `ema openclaw complete`

Implications:
- avoid ad-hoc raw endpoint use from agent runtimes when wrapper coverage exists
- keep compatibility logic in one place
- let wrapper absorb daemon API churn

## Decision 4 — Local execution authority, federated coordination

EMA should support decentralized sync and multi-user/account behavior without synchronizing unrestricted execution authority.

Implications:
- sync artifacts and lineage, not raw host authority
- remote peers may propose or inform, but local nodes re-check policy before acting
- approvals/capabilities remain locally enforceable

## Decision 5 — User accounts must decompose into principal, device, and capability

EMA should not model accounts as a single centralized login abstraction.
Instead, split into:
- principal identity
- paired devices
- capability grants
- domain/project membership
- artifact ownership / authorship / approval rights

Implications:
- better fit for decentralization
- clearer permission model for sync and governance
- easier local trust and device revocation

## Decision 6 — Sessions are runtime objects; executions/proposals are control-plane objects

EMA should distinguish between:
- sessions: runtime continuity, streams, context, in-progress work
- proposals/executions: durable orchestration and lineage objects

Implications:
- do not use raw session logs as the durable system of record
- distill session outcomes into tracked execution/proposal state
- OpenClaw session events should summarize back into EMA execution lineage

## Decision 7 — Routing must stay split across two layers

Keep a hard distinction between:
1. interaction routing — which runtime/agent/session receives the work
2. execution routing — which provider/model/tool/backend performs the work

Implications:
- OpenClaw is strong at interaction/runtime routing
- EMA is strong at execution/provider/control-plane routing
- combining the layers into one router will create ambiguity and brittle policies

## Decision 8 — Typed effects over informal side effects

EMA should increasingly treat meaningful external actions as typed effect records/tool-like operations rather than opaque subprocess behavior.

Implications:
- better auditability
- better replay and debugging
- more reliable lineage and approvals
- easier policy evaluation before execution

## Decision 9 — Docs should reflect canonical runtime reality

EMA docs should consistently say:
- daemon is canonical
- optional surfaces are non-canonical unless explicitly needed
- if docs and runtime disagree, trust live process/socket inspection
- if route behavior and code disagree, suspect stale daemon state first

Implications:
- reduce operator confusion
- reduce surface-led architectural drift
- keep bootstrap path sane

## Decision 10 — Host sync is an operational step, not architectural truth

Host docs and local docs should be kept aligned, but the architectural source of truth should remain in versioned repo docs.

Implications:
- sync-to-host is important, but should not become the only place reality lives
- operational mirrors should be generated or pushed from repo truth when possible
- failed host sync should block confidence, not documentation improvements

## Decision 11 — Capabilities are lane-local

A capability working in one environment does not imply it exists in another.
Distinguish between:
- human/operator shell lane
- agent runtime lane
- coding-agent dispatch lane
- daemon-native lane

Implications:
- access checks must be environment-scoped
- docs should avoid saying a capability simply "works" without naming the lane
- integration design should prefer daemon-native contracts over assuming SSH parity

## Decision 12 — SSH is an operator/debug lane, not the primary integration contract

SSH may be excellent for direct operator work, inspection, and recovery.
It should not be the architectural requirement for ordinary EMA ↔ OpenClaw integration when daemon-native surfaces exist.

Implications:
- prefer control-plane and host-truth endpoints for routine integration
- keep SSH for bootstrap, debugging, and exceptional maintenance
- avoid coupling orchestration logic to shell-specific access assumptions

## Immediate next actions

1. Verify live daemon health and bound ports through the best available lane.
2. Reconcile repo docs with host-truth outputs.
3. Push/sync updated docs to the host-side docs location.
4. Add a short canonical architecture index pointing operators to the daemon-first model.
5. Reduce ambiguity between operator lane, agent lane, and daemon-native lane in docs and tooling.
