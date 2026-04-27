# Shells / Surfaces — Gleam mapping

## Part summary

Shells and surfaces are what humans see and touch: HQ, Launchpad,
Threads, Chat, Virtual Desktop, with vApps inside. Every prior era of
this lineage drifted because a surface (Discord, place.org,
ClaudeForge) became the de facto state container. The Gleam port
replaces `EmaWeb.Endpoint` (Phoenix) with a smaller `mist` / `wisp`
HTTP/WS server that preserves the `AGENT-CONTRACT.md` verb set and
keeps surfaces strictly downstream — they decode typed responses from
the daemon and write nothing of their own.

## Type sketch

```gleam
import gleam/option.{type Option}
import gleam/http/request.{type Request}
import gleam/http/response.{type Response}
import gleam/json.{type Json}

pub type SurfaceKind {
  Hq
  Launchpad
  Threads
  Chat
  VirtualDesktop
  CliSurface
  DiscordMirror
}

pub type ViewRequest {
  ContextFor(project: ProjectId, actor: Actor, depth: Int)
  LiveStream(project: ProjectId, since_seq: Int)
  HostTruth
}

pub type ViewResponse {
  ProjectContext(project: ProjectId, recent_events: List(Event),
                 lanes: List(Lane), open_handoffs: List(Handoff))
  EventBatch(events: List(Event), next_seq: Int)
  HostStatus(host: String, degraded: Bool, queue_depth: Int)
}

pub type SurfaceConn {
  WsConn(surface: SurfaceKind, project: ProjectId, actor: Actor)
}

pub type LayoutPrefs {
  LayoutPrefs(
    member: MemberId,
    surface: SurfaceKind,
    payload: String,         // opaque JSON; daemon-stored
  )
}
```

## Actor sketch

```gleam
pub type EndpointMsg {
  StartListener(port: Int, reply_to: Subject(Result(Nil, ListenError)))
  Stop
}

pub type WsHubMsg {
  Subscribe(conn: SurfaceConn, reply_to: Subject(WsEvent))
  Broadcast(project: ProjectId, event: Event)
  Unsubscribe(conn: SurfaceConn)
}

pub type WsEvent {
  WsEvent(seq: Int, body: ViewResponse)
}

pub type HostTruthWatcherMsg {
  Refresh
  CurrentSnapshot(reply_to: Subject(HostStatus))
}

pub type HostSessionSyncMsg {
  Tick
  ResolvedFor(host: String, sessions: List(SessionId))
}

pub type DiscordBridgeMsg {
  IncomingMessage(channel: String, body: String, by: Actor)
  PublishOut(thread: String, body: String)
}
```

- `ema/http/endpoint` — wraps `mist` (raw HTTP) or `wisp` (Plug-like).
  `Subject(EndpointMsg)`. Replaces `EmaWeb.Endpoint`.
- `ema/http/ws_hub` — `Subject(WsHubMsg)` fans events to subscribed
  surfaces. No direct Elixir analog (Phoenix Channels did this).
- `ema/surfaces/host_truth_watcher` — `Subject(HostTruthWatcherMsg)`.
  Maps to `Ema.Surfaces.HostTruthWatcher`.
- `ema/surfaces/host_session_sync` — `Subject(HostSessionSyncMsg)`.
  Maps to `Ema.Surfaces.HostSessionSync`.
- `ema/surfaces/discord_bridge` — `Subject(DiscordBridgeMsg)`. New;
  there is no Elixir Discord bridge today.
- `ema/surfaces/hermes_client` — already covered in
  `harness-execution`; lives here under `surfaces/supervisor`.

## Supervision tree fragment

```text
root_supervisor
├── surfaces/supervisor (one_for_one)
│   ├── hermes_client
│   ├── host_truth_watcher
│   ├── host_session_sync
│   └── discord_bridge          (NEW; only if Q6 says so)
└── http/supervisor (rest_for_one, BOOTS LAST)
    ├── http/ws_hub
    └── http/endpoint
```

The `http/supervisor` is the *last* child of `root_supervisor` (per
gate #3 of EMA_V0_0_3_PREP.md). `ws_hub` boots before `endpoint` so
that the first incoming WebSocket has somewhere to register.

## Where it leans on Erlang/Elixir interop

- HTTP server: `mist` (Hex package) is the Gleam-native option;
  underneath it speaks `:cowboy`. For Plug-like ergonomics, `wisp`
  wraps `mist`.
- WebSocket: `mist` exposes a websocket handler; for streaming we keep
  message size bounded and use `:erlang.iolist_to_binary/1` for
  framing.
- `:cowboy_req` is the underlying HTTP request record; we never touch
  it directly but type errors will mention it.
- For Discord bridge: FFI to `:gun` for HTTPS to Discord's REST API
  and `:gun_ws` for the gateway. No Gleam-native Discord library
  exists today.
- For native desktop / Tauri-style shells: the daemon stays
  HTTP/WS-only; the desktop side is out of scope for this BEAM doc.
- `:pg` to fan-out `Broadcast` to many `WsHubMsg` subscribers without
  per-subscriber Subjects.

## Tests this part needs at v0.0.3

- Verb-contract test (per gate #1 of EMA_V0_0_3_PREP.md): every verb
  in `AGENT-CONTRACT.md` (`/api/control-plane/*`) has a typed Gleam
  request/response and a smoke test that round-trips one example.
- "Surfaces hold no durable state" test: spin up `ws_hub`, subscribe a
  fake surface, kill the surface, restart it; replay reproduces the
  same view from `event_log` alone.
- Property test (`gleam_qcheck`): for any list of broadcast events,
  every subscribed connection receives them in `seq` order.
- Layout-prefs round-trip test: `LayoutPrefs` saved by HQ on member A
  is readable by HQ on member A's other device, and *not* by member B.
- Host-truth degraded-mode test: when `host_truth_watcher` reports
  `degraded: true`, every `ContextFor` response includes the warning
  field (encoded once, decoded by every surface).
- Endpoint-last test: assert the supervisor child list places
  `http/supervisor` after `surfaces/supervisor` (startup-order
  fixture).

## Open questions specific to Gleam mapping

- **Q7** — surface stack for Launchpad/HQ. Without it, the
  daemon-side `endpoint` cannot pick whether to serve static assets
  (web HQ) at all, only an API. Concrete pressure: `wisp` vs `mist`
  vs gleam_static is a forced pick on the day surfaces ship.
- **Q6** — Discord mirror direction decides whether
  `discord_bridge` is in the supervision tree at all, and whether it
  has a `PublishOut` actor, an `IncomingMessage` consumer, or both.
  Today the Gleam tree has no Discord code.
- **Q1** — `SurfaceConn.actor` cannot distinguish human from agent
  surfaces until Q1 lands; bridge code defaults to `HumanActor`.
- **Q2 / Q8** — if collab state moves to a CRDT substrate, the
  `ws_hub` has to relay CRDT updates *and* event-log events; today
  it relays only events. With no Gleam CRDT lib, the bridge becomes
  another FFI surface (Yjs sidecar via `:gun` to a node process, or
  pure-BEAM CRDT inside the daemon).
- **No Phoenix LiveDashboard** — observation tooling has to be built
  on `:observer` or a custom HQ widget; this is not an open question
  in `OPEN_QUESTIONS.md` but is a Gleam-side pressure flagged in
  EMA_V0_0_3_PREP.md.

## Read next

- `graph/edges/surfaces.md`, `graph/edges/ux-metaphor.md`
- `content/briefs/shells-surfaces.md`
- `codebase-ema/code/ema/daemon/lib/ema/surfaces/{hermes_client,host_truth_watcher,host_session_sync}.ex`
- `codebase-ema/code/ema/daemon/lib/ema_web/{endpoint.ex,channels/control_plane_channel.ex,controllers/control_plane_controller.ex}`
- `codebase-ema/code/ema/docs/AGENT-CONTRACT.md`
- `codebase-claudeforge/packages/server/src/providers/hermes-provider.ts`
- `OPEN_QUESTIONS.md` Q6, Q7
- `mist`: https://hexdocs.pm/mist/, `wisp`: https://hexdocs.pm/wisp/
