# Step 6 — Surfaces skeleton (mist + wisp HTTP/WS, typed projections only)

> **Goal:** stand up the minimal HTTP/WS surface layer that satisfies
> P1 (`DESIGN_PRINCIPLES.md` — "Surfaces (mist/wisp/lustre routes)
> consume typed projections, never call `event_log.append/2`") by
> wiring `mist` + `wisp` as the daemon's outward face, exposing one
> read-only typed projection of Step 1's `event_log`, and one
> client-driven `Proposal` endpoint that funnels every write through
> Step 1's `command_bus`. No surface holds durable state; every write
> is a typed `Command`; reads are pure folds over the log via Step 1's
> `replay`/`store`.
>
> **Depends on:** Step 1 (control-plane skeleton — surfaces read
> `event_log` via `store`/`replay` and write via `command_bus`),
> Step 2 (identity registry — every connection carries an `Actor`
> resolved through `ema_identity/registry`), and Step 5
> (collab substrate — the `Proposal` endpoint may target a
> `CollabObjectId`; surfaces never call `ema_collab` directly,
> they go through `command_bus`).
>
> **Open questions held open:**
> - **Q6** (Discord mirror direction). Coded assumption: no Discord
>   bridge in Step 6. The `surfaces/discord_bridge` actor named in
>   `research/parts/shells-surfaces.md` "Actor sketch" is not in this
>   step's tree.
> - **Q7** (surface stack for Launchpad/HQ). Coded assumption per
>   `research/GLEAM_BEAM_FIT.md` §"HTTP / web servers": `mist` v6.0.3
>   for raw HTTP/1.1 + WebSocket, `wisp` v2.2.2 on top for
>   Plug-like middleware/handler ergonomics. Quoting that section
>   directly: "EMA fit: candidate for the HTTP listener that
>   reproduces the `AGENT-CONTRACT.md` verb set" (mist) and "the
>   natural shape for `/api/control-plane/*` routes — each verb is a
>   typed handler returning a typed response, middleware handles auth
>   and request logging" (wisp). No Lustre server-component decision
>   is made here; the endpoint is JSON over HTTP/WS only. If Q7 picks
>   a separate Next.js HQ, this step does not change.
> - **Q1** (agent-as-Member). Coded assumption: `SurfaceConn.actor`
>   accepts `AgentActor(_)` from Step 2 if the inbound credential
>   resolves to one. Per `research/parts/shells-surfaces.md` §"Open
>   questions specific to Gleam mapping" Q1, "bridge code defaults to
>   `HumanActor`" until Q1 lands; Step 6 honors that default in the
>   auth middleware.
> - **Q2 / Q8** (collab substrate). Coded assumption per
>   `research/parts/shells-surfaces.md` Q2/Q8 note: "today [`ws_hub`]
>   relays only events." Step 6's `ws_hub` is event-log-only; collab
>   updates from Step 5 are exposed only as a *projection* of
>   `CollabOp` events, not as a Yjs/CRDT relay.
> - **Q10** (permission gating). Coded assumption: the auth
>   middleware resolves `Actor` from a request header
>   (`X-EMA-Member`); per-command policy gating is left to Step 1's
>   `command_bus` (which itself stubs allow-all per Step 1's
>   open-question note on Q10).

## What this step produces

Concrete Gleam modules under `apps/ema/src/ema_http/` and
`apps/ema/src/ema_surfaces/`:

HTTP / WS:
- `endpoint.gleam` — `mist` listener boot; routes via `wisp`.
- `router.gleam` — typed `wisp` handler table for `/api/control-plane/*`.
- `auth_middleware.gleam` — resolves `Actor` from request headers via
  `ema_identity/registry`.
- `ws_hub.gleam` — `Subject(WsHubMsg)` fan-out; subscribes to Step 1's
  `event_log` recent-events stream and broadcasts to attached
  WebSocket clients in `seq` order.
- `ws_handler.gleam` — `mist` WebSocket callback; registers/unregisters
  with `ws_hub`.
- `codecs.gleam` — `gleam_json` encoders/decoders for every typed
  request/response (no `Dynamic` past this seam, per
  `research/GLEAM_BEAM_FIT.md` "Code-quality discipline" #2).

Surfaces (read-only projection + one write endpoint):
- `project_recent_view.gleam` — pure projection: folds Step 1's
  `event_log` events for a given `ProjectId` into a typed
  `ProjectRecentView` (recent events + current lanes + open
  handoffs). Read-only; no actor state.
- `proposal_endpoint.gleam` — handler that decodes a client
  `Proposal`, constructs a typed `Command`, calls
  `command_bus.route`, returns the typed result.
- `supervisor.gleam` — `rest_for_one` for `ws_hub` then `endpoint`
  (per `research/parts/shells-surfaces.md` "ws_hub boots before
  endpoint so that the first incoming WebSocket has somewhere to
  register").

Plus tests under `apps/ema/test/ema_http/` and `apps/ema/test/ema_surfaces/`:

- `endpoint_smoke_test.gleam`
- `router_verb_contract_test.gleam`
- `ws_hub_fanout_test.gleam`
- `surfaces_hold_no_state_test.gleam`
- `proposal_endpoint_test.gleam`
- `project_recent_view_test.gleam`
- `codecs_round_trip_test.gleam`

## Type sketches

```gleam
import gleam/option.{type Option}
import gleam/erlang/process.{type Subject}
import gleam/otp/actor
import gleam/http/request.{type Request}
import gleam/http/response.{type Response}
import gleam/json.{type Json}
import ema_control_plane/ids.{type ProjectId, type ExecutionId}
import ema_control_plane/event.{type Actor, type Event, type Command}

pub type SurfaceKind {
  Hq
  Launchpad
  Threads
  Chat
  CliSurface
}

pub type SurfaceConn {
  WsConn(
    surface: SurfaceKind,
    project: ProjectId,
    actor: Actor,
    sink: Subject(WsEvent),
  )
}

pub type ProjectRecentView {
  ProjectRecentView(
    project: ProjectId,
    recent_events: List(Event),
    head_seq: Int,
  )
}

pub type Proposal {
  StartExecutionProposal(
    project: ProjectId,
    execution: ExecutionId,
  )
  HandoffProposal(
    execution: ExecutionId,
    to: Actor,
    note: Option(String),
  )
}

pub type ProposalResult {
  ProposalAccepted(seq: Int)
  ProposalRejected(reason: String)
}

pub type WsEvent { WsEvent(seq: Int, body: Event) }

pub type WsHubMsg {
  Subscribe(conn: SurfaceConn)
  Unsubscribe(conn: SurfaceConn)
  Broadcast(project: ProjectId, event: Event)
}

pub type EndpointMsg {
  StartListener(
    port: Int,
    reply_to: Subject(Result(Nil, ListenError)),
  )
  Stop
}

pub type ListenError {
  PortInUse(port: Int)
  BindFailed(reason: String)
}

pub type AuthError {
  MissingMemberHeader
  UnknownMember(String)
}

pub fn start_endpoint(port: Int)
  -> Result(Subject(EndpointMsg), actor.StartError)

pub fn start_ws_hub()
  -> Result(Subject(WsHubMsg), actor.StartError)

// pure: no actor, no state
pub fn project_recent_view(
  project: ProjectId,
  limit: Int,
) -> ProjectRecentView

// pure: builds the Command, then calls command_bus.route
pub fn handle_proposal(
  req: Request(BitArray),
  by: Actor,
) -> Response(Json)
```

## Module layout

```
apps/ema/src/
├── ema_http/
│   ├── endpoint.gleam              -- cf. lineage-original-elixir-ema/code/daemon/lib/ema_web/endpoint.ex
│   │                                  (Phoenix endpoint; replaced by mist+wisp per
│   │                                   EMA_V0_0_3_PREP.md "What changes" #5)
│   ├── router.gleam                -- cf. lineage-original-elixir-ema/code/daemon/lib/ema_web/router.ex
│   ├── auth_middleware.gleam       -- (no Elixir 1:1; folds plug-style auth into wisp middleware)
│   ├── ws_hub.gleam                -- (no Elixir 1:1; Phoenix Channels did this)
│   ├── ws_handler.gleam            -- cf. lineage-original-elixir-ema/code/daemon/lib/ema_web/channels/control_plane_channel.ex
│   ├── codecs.gleam                -- cf. lineage-original-elixir-ema/code/daemon/lib/ema_web/controllers/control_plane_controller.ex
│   │                                  (encoder/decoder pairs per AGENT-CONTRACT verb)
│   └── supervisor.gleam            -- cf. lineage-original-elixir-ema/code/daemon/lib/ema_web/endpoint.ex
│                                       (rest_for_one over ws_hub → endpoint)
└── ema_surfaces/
    ├── project_recent_view.gleam   -- (no Elixir analog; the typed projection)
    └── proposal_endpoint.gleam     -- cf. lineage-original-elixir-ema/code/daemon/lib/ema_web/controllers/control_plane_controller.ex
                                        (the "POST /api/control-plane/command" handler shape)
```

The Elixir originals were verified via
`git show origin/lineage-original-elixir-ema:code/daemon/lib/ema/application.ex`,
which boots `EmaWeb.Endpoint` *last* (`Ema.Surfaces.HostSessionSync` →
`Ema.SecondBrain.Indexer` → `EmaWeb.Endpoint`). Step 6 preserves that
discipline: `ema_http/supervisor` is the **last** child of
`root_supervisor`, per `EMA_V0_0_3_PREP.md` gate #3 and
`research/parts/shells-surfaces.md` §"Supervision tree fragment"
("`http/supervisor` is the *last* child of `root_supervisor`").

## Supervision tree fragment

```text
root_supervisor (one_for_one)
├── ema_control_plane/supervisor (rest_for_one)   -- Step 1
├── ema_identity/supervisor (rest_for_one)        -- Step 2
├── ema_drivers/supervisor (one_for_one)          -- Step 3
├── ema_sessions/supervisor (rest_for_one)        -- Step 4
├── ema_execution/execution_supervisor            -- Step 4
├── ema_babysitter/supervisor (one_for_one)       -- Step 4
├── ema_collab/supervisor (rest_for_one)          -- Step 5
└── ema_http/supervisor (rest_for_one, BOOTS LAST)
    ├── ws_hub                  -- Subject(WsHubMsg); subscribes to event_log
    └── endpoint                -- mist listener + wisp router
```

`rest_for_one` matters: a crashed `ws_hub` restarts `endpoint` so
no incoming WebSocket attaches to a hub that is mid-restart. The
ordering (`ws_hub` before `endpoint`) is the same discipline as
`research/parts/shells-surfaces.md` §"Supervision tree fragment".

## Acceptance criteria (testable)

1. `endpoint.start_listener(port: 0)` returns `Ok(_)` and binds to a
   free port; `Stop` releases it within 1s. `StartListener(port:
   already_taken)` returns `Error(PortInUse(_))`.
2. `GET /api/control-plane/projects/:id/recent` returns a JSON
   payload that round-trips through `codecs.decode_project_recent_view`
   into the same `ProjectRecentView` value `project_recent_view/2`
   would compute by folding Step 1's `event_log`.
3. **Surfaces hold no durable state.** Spin up `ws_hub`, subscribe a
   fake `SurfaceConn`, kill the surface process, restart it, replay
   from Step 1's `event_log`. The replayed view equals the live one.
   (The test from `research/parts/shells-surfaces.md` §"Tests this
   part needs at v0.0.3" #2.)
4. **Verb-contract test.** Every endpoint listed in
   `AGENT-CONTRACT.md` (`/api/control-plane/projects/:id/recent`,
   `POST /api/control-plane/command`, `GET /api/control-plane/host`,
   `GET /api/control-plane/live`) has a typed Gleam handler and a
   smoke test that round-trips one example payload through
   `codecs.gleam`. (Gate #1 of `EMA_V0_0_3_PREP.md`.)
5. `POST /api/control-plane/command` with a valid
   `StartExecutionProposal` body reaches Step 1's `command_bus`
   exactly once and returns `ProposalAccepted(seq)` with `seq`
   matching the appended event's `seq`.
6. `POST /api/control-plane/command` with a `Proposal` whose
   `placement` would be `Peer(_)` returns
   `ProposalRejected("Q9-pending")` (carries Step 1's
   `Deferred(_)` through the surface untransformed).
7. `WS /api/control-plane/live?project=:id`: subscribe two clients,
   trigger three appends on Step 1's `event_log` for `:id`, assert
   each client receives exactly three `WsEvent`s in `seq` order.
8. `auth_middleware` rejects a request with no `X-EMA-Member` header
   as `Error(MissingMemberHeader)` → `401`; with an unknown member
   as `Error(UnknownMember(_))` → `403`. With a known
   `MemberId`, `Request` is annotated with the resolved `Actor` for
   the downstream handler.
9. The surface code contains **zero** calls to
   `event_log.append/2` (verified by a build-time grep gate). Every
   write goes through `command_bus.route`. (P1 enforcement.)
10. `codecs.gleam` contains no `dynamic.Dynamic` types in its public
    API. The only `Dynamic` use is in the FFI-adjacent body parser
    (`codebase wisp` request body → typed value), per
    `research/GLEAM_BEAM_FIT.md` "Code-quality discipline" #2.

## Property tests (gleam_qcheck)

1. **Codec round-trip.** For any generated `ProjectRecentView`,
   `codecs.decode(codecs.encode(v)) == Ok(v)`. Same for `Proposal`,
   `ProposalResult`, `WsEvent`. No drop, no shape drift across the
   JSON seam.
2. **Fan-out preserves order at every subscriber.** For any list of
   `Broadcast` calls and any subscriber set, every subscribed
   `SurfaceConn` receives the broadcast `WsEvent`s with
   `seq` values monotonically non-decreasing — matches
   `research/parts/shells-surfaces.md` §"Tests this part needs"
   property test #1 ("for any list of broadcast events, every
   subscribed connection receives them in `seq` order").
3. **Proposal handler totality.** For every generated `Proposal`,
   `handle_proposal` returns exactly one of `{ProposalAccepted(_),
   ProposalRejected(_)}` and does not crash. Maps to Step 1's
   `command_bus.route` totality, lifted through the HTTP seam.

## What gets stubbed (and why)

- **Lustre server components for HQ/Launchpad** — Q7 deferred per
  `research/GLEAM_BEAM_FIT.md` §"Surfaces" option #1 vs #2. Stub: no
  HTML rendering; the endpoint serves JSON only. The `mist` v6.0.3
  static-asset support named in
  `research/GLEAM_BEAM_FIT.md` §"HTTP / web servers" is wired but
  serves nothing yet.
- **Discord bridge** — Q6 deferred per
  `research/parts/shells-surfaces.md` §"Open questions specific to
  Gleam mapping" Q6. Stub: `surfaces/discord_bridge` is not in the
  tree.
- **`host_truth_watcher` and `host_session_sync`** — named in
  `research/parts/shells-surfaces.md` "Actor sketch" but they
  observe runtime state (queue depth, host degraded mode). Step 6
  ships only the *projection* surface (`HostStatus` is typeable in
  `codecs.gleam` but always returns `degraded: false, queue_depth:
  0`); the live watchers land in a later step that depends on Step
  4's babysitter being instrumented.
- **CRDT relay over WebSocket** — Q2/Q8 deferred. Stub: `ws_hub`
  relays Step 1's `Event` only. If Step 5 grows a Yjs substrate
  later, a *second* WebSocket route (`/api/collab/:object/sync`)
  lands then; Step 6 does not pre-judge.
- **Layout prefs storage** — `LayoutPrefs` in
  `research/parts/shells-surfaces.md` is typeable but no
  `PUT /api/surfaces/layout` endpoint ships. Stub: deferred until
  HQ exists.
- **`:gun`-based streaming for hermes-native** — already covered in
  Step 3; Step 6 does not re-expose it. The HTTP listener here is
  *inbound* only.
- **`X-Hermes-Session-Id` typed binding** — Step 4's stub note
  applies. Surface still passes the header as `String`; the typed
  `SessionId` binding waits.
- **TLS / ALPN** — `mist` supports it but Step 6 ships HTTP/1.1
  cleartext only; TLS is a deployment-time concern handled by a
  reverse proxy until the daemon ships standalone.

## Cross-references

- Brief: `content/briefs/shells-surfaces.md`
- Part mapping: `research/parts/shells-surfaces.md` (every section
  cited above)
- Edge: `graph/edges/surfaces.md`, `graph/edges/ux-metaphor.md`
- Glossary: "Surface", "HQ", "Launchpad", "Threads"
- Howto: `howto/gleam-fit-review.md` (run when Q7 lands a Lustre
  decision).
- Prep doc: `EMA_V0_0_3_PREP.md` "What changes" #5 ("Phoenix
  endpoint replaced by a smaller Gleam HTTP/WS server that preserves
  the `AGENT-CONTRACT.md` verb set"), gates #1 and #3.
- Capability survey: `research/GLEAM_BEAM_FIT.md` §"HTTP / web
  servers" (the `mist` v6.0.3 + `wisp` v2.2.2 picks),
  §"Surfaces" option list, §"Code-quality discipline" #2 (no
  `dynamic` in domain code).
- Design principles: P1 (authority before surface), P4 (identity
  layers stay separate — `SurfaceConn.actor` is typed, not a string),
  P9 (collab adjacent — surfaces do not directly call `ema_collab`).
- Surface seam (unchanged):
  `codebase-claudeforge/packages/server/src/providers/hermes-provider.ts`
  (the `X-Hermes-Session-Id` contract).
- Elixir originals (verified via
  `git show origin/lineage-original-elixir-ema:code/daemon/lib/ema/application.ex`):
  `lineage-original-elixir-ema/code/daemon/lib/ema_web/{endpoint,router}.ex`,
  `lineage-original-elixir-ema/code/daemon/lib/ema_web/channels/control_plane_channel.ex`,
  `lineage-original-elixir-ema/code/daemon/lib/ema_web/controllers/control_plane_controller.ex`,
  and the AGENT-CONTRACT.md verb set at
  `lineage-original-elixir-ema/code/daemon/docs/AGENT-CONTRACT.md`.
- `mist` docs: https://hexdocs.pm/mist/
- `wisp` docs: https://hexdocs.pm/wisp/
- `OPEN_QUESTIONS.md` Q1, Q2, Q6, Q7, Q8, Q10.
