# Ship Checklist — EMA v0.0.3

Aggregated acceptance criteria from `research/build-steps/01-06-*.md`,
plus cross-cutting gates from `EMA_V0_0_3_PREP.md` "Verification gates",
plus the canonical-rule enforcement gates from `DESIGN_PRINCIPLES.md`.

> v0.0.3 is **shippable** when every box below can be checked. Each box
> traces back to a build-step file, a property test, or a principle.
> Nothing on this list is aspirational — these are mechanical gates.

## Foundational gates (apply to all subsystems)

- [ ] **G1 — Six opaque ID types** distinct, no implicit conversion.
      `ExecutionId · SessionId · ProviderSessionId · WorkspaceArtifactId
      · PeerId · MemberId` (per `02-project-transfer-brief.md` §11,
      `EMA_V0_0_3_PREP.md` gate #4, P4).
- [ ] **G2 — Every actor owns a typed `Subject(Msg)`.** No `Process`
      escape hatches in domain code (P5, `GLEAM_NOTES.md`).
- [ ] **G3 — No `dynamic` outside FFI boundaries.** Domain code is
      type-checked end-to-end (`research/GLEAM_BEAM_FIT.md`
      "Code-quality discipline" #2).
- [ ] **G4 — `placement` field on every `Dispatch`.**
      `Local | Daemon | Peer | HostAffinity`. Driver registry rejects
      unsupported placements (P8, `EMA_V0_0_3_PREP.md` gate #6).
- [ ] **G5 — `project_id` on every control-plane row.** No global
      event_log; per-project shards from day one (P10).
- [ ] **G6 — All actor types compile-time-checked.** `gleam build`
      passes with zero warnings.

## Step 1 — Control plane

(from `research/build-steps/01-control-plane-skeleton.md`)

- [ ] event_log_writer accepts `Append(envelope, reply_to)`, rejects
      invalid envelopes synchronously, persists in monotonic order
- [ ] store reads project-scoped windows of envelopes
- [ ] replay reconstructs in-memory projections from the log
- [ ] execution_supervisor owns ExecutionId lifecycle; no orphan
      executions
- [ ] incidents subtree records authority/event/policy chains
- [ ] proposal_events lands every Proposal as a control-plane row
- [ ] gleam_qcheck: append-then-read returns the same envelope (round-trip)
- [ ] gleam_qcheck: replay over N appends produces N projections
- [ ] gleam_qcheck: project_id filter never leaks cross-project rows

## Step 2 — Identity registry

(from `research/build-steps/02-identity-registry-skeleton.md`)

- [ ] Org/Space/Project/Member/Agent registries answer "does X exist"
      in O(1)
- [ ] policy module evaluates a typed `Rule` list against `Member ×
      Action × Scope`
- [ ] AgentMember variant exists (codes against Q1's "first-class"
      assumption — flag if Q1 resolves otherwise)
- [ ] N:M Project↔Space (codes against Q3's "N:M" assumption — flag
      if Q3 resolves otherwise)
- [ ] gleam_qcheck: every Project belongs to exactly one Org or one User
- [ ] gleam_qcheck: Member access set is monotone in Rule additions

## Step 3 — Driver registry

(from `research/build-steps/03-driver-registry-skeleton.md`)

- [ ] All 5 `DriverKind` variants typeable: `HermesNative | ClaudeCli
      | CodexCli | PeerRemote | SimulatedTui` (3 may return `Deferred`)
- [ ] `simulated-tui` driver implementable end-to-end with deterministic
      output
- [ ] `hermes-native` driver shells out to Hermes (or stub) and emits
      `DispatchUpdate` events into event_log
- [ ] `start: Subject(DriverEvent)` streaming signature stable across
      drivers
- [ ] Cancel terminates without leaking sessions (no orphan
      `ProviderSessionId`)
- [ ] gleam_qcheck: every Dispatch produces ≥1 DispatchUpdate before
      terminal state
- [ ] gleam_qcheck: cancel(execution_id) is idempotent

## Step 4 — Sessions + babysitter

(from `research/build-steps/04-sessions-and-babysitter.md`)

- [ ] sessions/registry tracks `(SessionId, MemberId, ExecutionId,
      ProviderSessionId)` quads
- [ ] sessions/supervisor restarts crashed session actors without
      losing the SessionId binding
- [ ] babysitter/chain_scheduler advances long-running execution chains
- [ ] babysitter/takeover_manager (the OpenClaw doctrine acceptance test):
      a stalled session can be taken over by a different actor and
      continue without identity churn
- [ ] babysitter/tick_router fans ticks per-Subject (no `:pg` yet —
      Q5 dependency)
- [ ] gleam_qcheck: takeover preserves SessionId across actor restart
- [ ] gleam_qcheck: tick rate stays bounded under N concurrent
      sessions

## Step 5 — Collab substrate (assumption-laden)

(from `research/build-steps/05-collab-substrate-skeleton.md` — codes
against per-object event-log under sqlight)

- [ ] object_registry maps `CollabObjectId → Subject(CollabMsg)`
- [ ] per-`CollabObjectId` event-log writer in its own sqlight handle
- [ ] `migration.replay_into(YjsTarget|RiakDtTarget|HybridTarget)` shape
      typeable (Q8 substrate swap is one module deep)
- [ ] no surface code calls `event_log.append` directly (P1 enforcement;
      build-time grep gate)
- [ ] gleam_qcheck: per-object op order matches insertion order
- [ ] gleam_qcheck: replay_into round-trips an N-op log

## Step 6 — Surfaces

(from `research/build-steps/06-surfaces-skeleton.md` — codes against
mist v6.0.3 + wisp v2.2.2)

- [ ] http/supervisor boots last in `rest_for_one`
- [ ] ws_hub before endpoint
- [ ] one read-only projection (`project_recent_view`) live
- [ ] one client-driven `Proposal` endpoint that goes through
      `command_bus` (no direct `event_log.append`)
- [ ] build-time grep gate: surface code never imports
      `ema/control_plane/event_log`
- [ ] gleam_qcheck: every accepted Proposal lands ≥1 row in event_log
      within bounded time

## Cross-cutting (verification gates from `EMA_V0_0_3_PREP.md`)

- [ ] OPEN_QUESTIONS Q1 → minimum answer landed
- [ ] OPEN_QUESTIONS Q3 → minimum answer landed
- [ ] OPEN_QUESTIONS Q5 → minimum answer landed (driver contract surface)
- [ ] OPEN_QUESTIONS Q5-sub → execution_id format & lifecycle pinned
- [ ] OPEN_QUESTIONS Q6 → ship as read-only or accept full bidirectional
- [ ] OPEN_QUESTIONS Q9 → explicitly deferred (single-node only in v0.0.3)
- [ ] `mix test` (or Gleam equivalent) green across all 6 step suites
- [ ] `gleam build` clean; no warnings
- [ ] `gleam format --check` clean
- [ ] doctrine notes from this transfer pack referenced in
      `code/ema/docs/doctrine/` (per
      `howto/extract-doctrine-from-a-legacy-branch.md`)

## Atlas-side ship gates (parallel to v0.0.3)

The atlas should be deploy-clean by v0.0.3 ship date.

- [ ] `npm run build` clean
- [ ] `./scripts/regen-all.sh` clean
- [ ] `./scripts/check-graph.sh` 0 warnings
- [ ] All routes in `content/api-spec.md` respond
- [ ] Every published deliverable in `content/artifacts/inventory.md`
      has a working route or download
- [ ] `vercel.ts` builds against the regen chain
- [ ] `.github/workflows/atlas-ci.yml` green on `main`

---

## How to use this checklist

1. Treat each item as **mechanical** — either it passes or it doesn't.
2. When you flip a box, prepend a `CHANGELOG.md` entry.
3. When an item depends on an open question that hasn't been resolved,
   leave it unchecked but cite the Q-number inline so the dependency
   stays visible.
4. When v0.0.3 ships, archive a snapshot of this file under
   `research/build-steps/SHIP_CHECKLIST-v0.0.3-snapshot-YYYY-MM-DD.md`,
   then start a fresh checklist for v0.0.4.

## Cross-references

- [`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md) — preparation spec + gates
- [`research/build-steps/`](research/build-steps/) — the 6 step files
- [`research/GLEAM_BEAM_FIT.md`](research/GLEAM_BEAM_FIT.md) — code-quality discipline
- [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) — P1-P10
- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) — what blocks the ship
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — current state
