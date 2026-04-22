# Stream of Thought / Babysitter / Orchestrator Context Recon

**Generated:** 2026-04-21T23:47:27+00:00  
**Machine:** `agent-vm`  
**Working dir during recon:** `/home/trajan/Desktop/hermes-discord-bot`

## Boundary statement

This pass is grounded in what is visible on `agent-vm` right now.

Visible roots confirmed on disk:
- `/home/trajan/Projects/ema`
- `/home/trajan/Projects/ema/workspace/shared`
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord`
- `/home/trajan/archive/openclaw`
- `/home/trajan/.openclaw`
- `/home/trajan/vault`
- `/home/trajan/wiki`
- `/home/trajan/staging/host-vault`

Live runtime caveat:
- `curl http://127.0.0.1:4488/api/babysitter/chains` failed during this recon
- `curl http://127.0.0.1:4488/api/babysitter` failed during this recon
- no active EMA daemon/process was visible from the quick local checks

So the findings below are **code-and-doc truth on disk**, not verified live daemon truth.

---

## High-confidence lineage

### 1. Older stream layer already existed before the new chain scheduler
`Ema.Stream.Manager` is an older cadence-controlled stream-of-consciousness layer with a 5-minute base tick and named channel cadences:
- `#system-heartbeat`
- `#pipeline-flow`
- `#agent-thoughts`
- `#intent-stream`
- `#memory-writes`
- `#intelligence-layer`
- `#babysitter-digest`

It already routes session thought activity into babysitter-facing flow:
- `record_thought/3` records `source: "agent_thought"`
- it preserves `session_id`
- it explicitly maps those signals into `babysitter-live`

This means the "stream of thought" idea is not greenfield; it already has an older stream manager lineage.

### 2. Babysitter became the adaptive surface governor
Current EMA babysitter modules on disk:
- `daemon/lib/ema/babysitter/stream_channels.ex`
- `daemon/lib/ema/babysitter/stream_ticker.ex`
- `daemon/lib/ema/babysitter/tick_router.ex`
- `daemon/lib/ema/babysitter/channel_policy.ex`
- `daemon/lib/ema/babysitter/takeover_manager.ex`
- `daemon/lib/ema/babysitter/chain_scheduler.ex`
- `daemon/lib/ema/babysitter/command_router.ex`

These separate:
- **lane semantics**
- **cadence buckets**
- **emission policy**
- **tick routing / dedupe / coalescing**
- **takeover / suppression**
- **autonomous chain scheduling**

This is the clearest foundation for the system you described.

### 3. A newer independent-first stream-of-thought layer is already partially designed and coded
The repo contains all of these:
- `docs/stream-of-thought-channel-system-plan.md`
- `docs/STREAM_OF_THOUGHT_CONTROL_SPEC.md`
- `docs/STREAM_OF_THOUGHT_OPERATOR_RUNBOOK.md`
- `daemon/lib/ema/babysitter/chain_scheduler.ex`
- babysitter controller/router endpoints for chain start/stop/pause/resume/hint

So the machine already holds both:
- the **design intent** for multi-range concurrent thought chains
- and a **first implementation pass** of that orchestrator contract

---

## What the code says now

### Semantic lanes and stream surfaces
`Ema.Babysitter.StreamChannels` defines stream/lane separation.

Known visible streams:
- `babysitter-live`
- `babysitter-ops`
- `babysitter-alerts`

Lane registry includes:
- `operator_rollup`
- `operations`
- `attention`
- `monitoring`

Important invariant repeated in docs and code:
- `#babysitter-live` is the operator rollup / control surface
- it is **not** supposed to be a raw chatter dump

### Cadence buckets now visible on disk
`StreamChannels` now includes the range structure much closer to your ask:
- `ultrafast` → `5s-30s`
- `fast` → `30s-5m`
- `medium` → `5m-30m`
- `slow` → `30m-90m`
- `trend` → `90m-6h`
- `archive` → `6h+`

Important detail: there are also older babysitter buckets still present for the three canonical babysitter streams:
- `realtime`
- `rapid`
- `steady`

So there is a **dual-era vocabulary** on disk:
- older babysitter-native buckets
- newer stream-of-thought chain buckets

That needs explicit reconciliation so the surface vocabulary does not drift.

### Adaptive cadence behavior
`Ema.Babysitter.StreamTicker` computes next interval from:
- rolling weighted activity
- idleness
- token pressure
- stream metadata from `StreamChannels`
- manual overrides

Behavior is explicitly pressure-aware:
- high activity tightens cadence
- low activity quiets it
- token pressure stretches it

This already matches the spirit of variable tick rates.

### Per-chain self-scheduling exists now
`Ema.Babysitter.ChainScheduler` adds first-class chain state with fields like:
- `id`
- `profile`
- `stream`
- `lane`
- `cadence_bucket`
- `status`
- `requested_next_tick_at`
- `next_tick_at`
- `related_chain_ids`
- `priority`
- `visibility_mode`
- `last_summary`
- `last_control_command`

It also supports:
- `start_chain`
- `stop_chain`
- `pause_chain`
- `resume_chain`
- `set_tick_hint`
- `snapshot`
- `list_chains`

Most important for your ask:
- each chain can set `requested_next_tick_at`
- the scheduler clamps delays into the chain's cadence bucket bounds
- fairness penalties are applied when many chains run at once
- related-chain penalties are applied when linked chains are simultaneously active
- Hermes-backed chains stretch slightly when Hermes is unavailable

That is already a concrete answer to "each prior chain sets the time till next, multiple channels in different ranges running at the same time and aware of each other."

### Cross-chain awareness exists, but lightly
Current cross-chain awareness in `ChainScheduler` is real but still thin:
- `related_chain_ids`
- active chain count fairness penalty
- related active chain penalty
- scheduler snapshot passed into each chain tick
- Hermes/local summary generation includes active chain count and related chain awareness text

What is **not** yet present as deep policy:
- no richer dependency graph
- no explicit anti-collision planning between semantic lanes
- no per-lane global budget arbitration
- no durable chain state persistence shown in this module
- no broader EMA peer/machine graph feeding chain scheduling decisions yet

So the substrate is there, but the awareness model is still first-pass.

---

## Control and interface surfaces already on disk

### HTTP endpoints
`EmaWeb.Router` / `EmaWeb.BabysitterController` expose:
- `GET /api/babysitter`
- `GET /api/babysitter/:stream`
- `PUT /api/babysitter/:stream`
- `POST /api/babysitter/:stream/activity`
- `POST /api/babysitter/:stream/tick`
- `GET /api/babysitter/chains`
- `GET /api/babysitter/chains/:id`
- `POST /api/babysitter/chains/:id/start`
- `POST /api/babysitter/chains/:id/stop`
- `POST /api/babysitter/chains/:id/pause`
- `POST /api/babysitter/chains/:id/resume`
- `POST /api/babysitter/chains/:id/hint`
- `POST /api/babysitter/command`
- `POST /api/babysitter/rewrite-category`
- takeover endpoints under `/api/babysitter/:stream/takeover/*`

### Operator command layer
`Ema.Babysitter.CommandRouter` accepts:
- `START <chain>`
- `STOP <chain>`
- `PAUSE <chain>`
- `RESUME <chain>`
- `STATUS`
- `LIST CHAINS`
- `HINT <chain> <ms>`

### PubSub / socket layer
`BabysitterChannel` and `UserSocket` wire babysitter updates into websocket topics.
The stream ticker broadcasts updates to:
- `babysitter:<stream>`
- `babysitter:all`

This matters because the architecture is already surface-agnostic enough to mirror to Discord/web/other consumers.

---

## Hermes / legacy interface context

### EMA ↔ Hermes split is already documented
`docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md` is consistent with the current direction:
- EMA owns truth/control-plane lineage
- Hermes owns execution substrate
- surfaces do not own state
- provider/session/peer dispatch should normalize into one engine contract

### Chain scheduler already uses Hermes as substrate, not surface owner
`Ema.Surfaces.HermesClient` is a lightweight API client that:
- checks Hermes `/models`
- calls Hermes `/chat/completions`
- asks Hermes for concise chain summaries plus optional next tick hint
- falls back cleanly to local summaries if Hermes is unavailable

This is exactly the right shape for the independent-first version.

### Legacy OpenClaw config shows interface drift risk
`~/.openclaw/openclaw.json` still points parts of the model layer at `http://localhost:4488/v1`, while recon also showed repeated OpenClaw config validation failures in old orchestrator logs around:
- invalid `channels.*.streaming`
- obsolete `channels.discord.voice.tts.providers`

This matters because any future stream-of-thought surface that still depends on legacy OpenClaw config semantics will inherit drift and false failures.

Recommendation: treat OpenClaw-era channel config as historical context, not as the canonical control contract for the new chain system.

---

## Drift and tension points

### 1. Old stream manager vs new babysitter chain scheduler
There are now two overlapping ways of thinking about stream cadence:
- old `Ema.Stream.Manager` fixed multi-channel cadence logic
- newer `Babysitter + ChainScheduler` adaptive lane/bucket/chain logic

Recommendation:
- keep `Stream.Manager` as a producer/source layer
- make `Babysitter + ChainScheduler` the canonical orchestrator/governor layer
- do not let both independently own operator-facing cadence policy

### 2. Bucket vocabulary drift
Current code/docs contain both:
- `realtime/rapid/steady`
- `ultrafast/fast/medium/slow/trend/archive`

Recommendation:
- use long-range bucket vocabulary for **chain scheduling**
- reserve older labels only as compatibility mapping for existing babysitter stream defaults
- write one explicit compatibility table and use it everywhere

### 3. Live runtime not verified
The daemon was not reachable during this recon, so we do not yet know whether the chain endpoints are:
- actually booting
- exercised by tests
- wired to Discord bridge behavior end-to-end

Recommendation:
- next pass should be a live runtime verification, not more theory

### 4. Cross-chain awareness is present but shallow
Current awareness is enough for first-pass fairness and linked-chain damping, but not enough for full EMA-wide orchestration.

Recommendation:
- next design step should define a real chain-coordination policy layer:
  - lane budgets
  - suppression/escalation rules
  - parent/child chain semantics
  - dependency graph / handoff semantics
  - peer/machine/model awareness inputs

---

## Best current architecture direction

If the goal is a real EMA-aligned multi-channel stream-of-thought system, the cleanest path visible from this machine is:

1. **Keep EMA canonical.**
   Use EMA docs/control-plane/session lineage as truth.

2. **Use `Babysitter + ChainScheduler` as the stream-of-thought orchestrator core.**
   It already has bounded cadence buckets, per-chain next-tick hints, concurrency, and operator controls.

3. **Treat `Stream.Manager` as upstream signal production, not the final orchestrator.**
   It should feed thought/intent/pipeline/memory signals into the babysitter layer.

4. **Use Hermes only as execution substrate.**
   Hermes should summarize, propose next wake hints, and execute deeper reasoning, but should not become the owner of the visible Discord stream surface.

5. **Preserve `#babysitter-live` as operator rollup, not raw self-talk.**
   Raw internal thought lanes can exist, but operator-visible output should stay concise, synthesized, and controllable.

6. **Bridge to multi-machine EMA later.**
   The current code already follows the right staging idea: independent-first now, broader EMA peer/machine/model awareness later.

---

## Practical next steps

1. Start the EMA daemon and verify these endpoints live:
   - `/api/babysitter`
   - `/api/babysitter/chains`
   - `/api/babysitter/command`

2. Reconcile bucket vocabulary in docs and code:
   - `realtime/rapid/steady`
   - `ultrafast/fast/medium/slow/trend/archive`

3. Decide canonical ownership:
   - what remains in `Ema.Stream.Manager`
   - what moves fully under `ChainScheduler`

4. Add explicit chain coordination policy:
   - per-lane budgets
   - related-chain suppression rules
   - escalation rules into alerts/operator rollup
   - parent/child chain semantics

5. Verify Discord bridge behavior end-to-end:
   - START/STOP acknowledgements
   - chain tick messages
   - category rewrite dry-run
   - no raw chatter flood into `#babysitter-live`

6. Only after runtime verification, design the broader EMA-aware inputs:
   - machine/peer topology
   - model availability
   - execution queue state
   - surface health

---

## Bottom line

The machine already contains a substantial answer to the design you asked for.

The strongest reality-aligned interpretation is:
- the old EMA stream layer provided the first stream-of-consciousness surfaces
- the babysitter layer evolved into an adaptive governor
- the newer chain scheduler/control spec is the emerging stream-of-thought orchestrator
- Hermes is already being positioned correctly as execution substrate
- the missing piece is not invention, but **runtime verification and drift cleanup**

In other words: this should be treated as **reconstruction and tightening of an already-emergent architecture**, not a blank-sheet design.