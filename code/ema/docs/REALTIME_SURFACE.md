# EMA Realtime Surface

> **Status:** truth-from-code, April 2026  
> **Purpose:** distinguish implemented realtime surfaces from planned or mock-only ones.

---

## Bottom line

The current checked-out EMA daemon exposes a **narrow realtime surface**.

Implemented today:
- Phoenix socket mount at `/socket`
- babysitter realtime channels (`babysitter:*`)
- PubSub-backed updates driven by babysitter stream state
- a read/write babysitter HTTP surface for cadence tuning and activity ingestion
- autonomous chain scheduler endpoints under `/api/babysitter/chains`
- dry-run/apply stream-category rewrite endpoint under `/api/babysitter/rewrite-category`
- Hermes surface discovery for independent orchestrator awareness
- a lightweight session monitor HTTP surface

Not implemented in the current daemon tree:
- `tasks:*`
- `projects:*`
- `agents:lobby`
- `intent:live`
- `gaps:live`
- execution streaming channels

Some docs and the CLI mock harness describe broader APIs and live topics, but those should be treated as **planned** or **mock-only** until corresponding daemon code exists.

---

## Implemented realtime surface

### Socket mount

**File:** `daemon/lib/ema_web/endpoint.ex`

```elixir
socket "/socket", EmaWeb.UserSocket,
  websocket: true,
  longpoll: false
```

### Declared channels

**File:** `daemon/lib/ema_web/user_socket.ex`

Declared topic families:
- `babysitter:*` → `EmaWeb.BabysitterChannel`

No other topic families are currently registered in `UserSocket`.

### Concrete channel modules

**Directory:** `daemon/lib/ema_web/channels/`

Implemented modules:
- `EmaWeb.BabysitterChannel`

### Backing producers / state sources

Primary supporting modules:
- `daemon/lib/ema/babysitter/stream_ticker.ex`
- `daemon/lib/ema/babysitter/channel_policy.ex`
- `daemon/lib/ema/babysitter/stream_channels.ex`
- `daemon/lib/ema/babysitter/takeover_manager.ex`
- `daemon/lib/ema/sessions/monitor.ex`

### Babysitter stream model

The babysitter surface now distinguishes three separate concepts:

1. **Semantic lane** — what kind of stream it is (`operator_rollup`, `operations`, `attention`, etc.)
2. **Cadence bucket** — the default cadence envelope (`realtime`, `rapid`, `steady`, `default`)
3. **Emission tier** — the current delivery policy (`hot`, `medium`, `quiet`) chosen dynamically by `ChannelPolicy`

That means `hot/medium/quiet` should be read as **push behavior**, not as the top-level architecture.

### Event pattern

Current implemented pattern:
1. socket joins `babysitter:<stream>`
2. channel subscribes to `Ema.PubSub` on that topic
3. join returns an initial snapshot
4. `StreamTicker` emits updates
5. channel pushes `stream_updated`

Snapshots now expose:
- stream identity
- lane + lane metadata
- cadence bucket + cadence bounds
- effective interval
- promotion / suppression reasoning
- emission-policy debug state

This is the current canonical realtime pattern in the daemon.

---

## Implemented HTTP-adjacent observability surface

These are real daemon endpoints today:

### Babysitter API

**File:** `daemon/lib/ema_web/router.ex`

Implemented routes:
- `GET /api/babysitter`
- `GET /api/babysitter/:stream`
- `PUT /api/babysitter/:stream`
- `POST /api/babysitter/:stream/activity`
- `POST /api/babysitter/:stream/tick`
- `GET /api/babysitter/:stream/takeover`
- `POST /api/babysitter/:stream/takeover/activate`
- `POST /api/babysitter/:stream/takeover/release`

Current snapshot/debug payloads expose richer governor state without changing the route set.

### Session monitor API

Implemented routes:
- `GET /api/sessions/monitor`
- `POST /api/sessions/monitor/activity`

Purpose:
- expose the lightweight session activity monitor already present in daemon code
- give operators a real observability surface without pretending the broader roadmap is already live

Backing module:
- `daemon/lib/ema/sessions/monitor.ex`

---

## Planned / mock-only / not yet implemented

The following surfaces appear in docs or CLI mock harnesses, but are **not currently implemented in daemon realtime code**:

### Planned in docs, not present in current socket/channel layer
- `tasks:*`
- `projects:*`
- `agents:lobby`
- `intent:live`
- `gaps:live`
- execution/live streaming channels
- proposal pipeline live topics as Phoenix channels

### Mock-only today
The Python CLI harness under `cli/` exposes many endpoints and workflows that currently exceed the daemon’s implemented surface. Treat those as:
- contract sketches
- test harness behavior
- roadmap scaffolding

not as proof of daemon implementation.

---

## Rules for future planning

1. **A topic is only real if it is registered in `UserSocket` and backed by code.**
2. **A successful doc description is not proof of implementation.**
3. **Mock CLI endpoints do not count as daemon support.**
4. **Before planning a new live slice, verify:**
   - source producer exists
   - PubSub topic exists or will be added
   - channel module exists
   - `UserSocket` registers it
   - there is a verification path

---

## Recommended next slice

The next safe realtime expansion should follow the babysitter pattern exactly:
1. choose one real domain
2. add a backing producer / state source
3. expose a read-only HTTP snapshot first if helpful
4. add PubSub broadcasts
5. add one Phoenix channel family
6. verify end-to-end

Until then, this file is the canonical truth source for EMA realtime status.
