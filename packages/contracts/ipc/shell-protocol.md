# Shell protocol — daemon ↔ surface (v0)

Transport: WebSocket on `ws://127.0.0.1:<ema-port>`.

Framing: one JSON object per WS text message.

## Message shape

Every message has:

```
{
  "v": 0,                 // protocol version
  "id": "msg-<ulid>",     // unique per message
  "type": "command" | "command_result" | "event" | "subscribe" | "unsubscribe" | "projection" | "hello" | "bye",
  ...
}
```

## Handshake

Client → server:
```
{ "v": 0, "id": "msg-...", "type": "hello",
  "surface": "web" | "desktop",
  "device_id": "device:<ulid>" | null   // null until paired
}
```

Server → client:
```
{ "v": 0, "id": "msg-...", "type": "hello",
  "daemon_version": "0.0.5-dev",
  "accepted_device_id": "device:<ulid>" | null,
  "note": string | null
}
```

Auth (device key ceremony) is a later wave; for 0.0.5-wave-1 the daemon
accepts any hello and assigns a dev device id on the fly.

## Commands (surface → daemon)

```
{ "v": 0, "id": "msg-...", "type": "command",
  "op": "<op-name>",
  "args": { ... }
}
```

Server responds with one message. Fields MUST appear in this exact order:
`v`, `type`, `in_reply_to`, `ok`, then either `events` (on success) or
`error` (on failure). Clients MAY rely on field order to short-circuit
parsing.

```
{ "v": 0, "type": "command_result",
  "in_reply_to": "msg-...",
  "ok": true,
  "events": [ "event:<ulid>", ... ]      // ids of events appended, in order
}
```
or
```
{ "v": 0, "type": "command_result",
  "in_reply_to": "msg-...",
  "ok": false,
  "error": { "class": "<error-class>", "message": "..." }
}
```

`<error-class>` is one of the enumerated classes in the **Error classes**
section below. Unknown classes MUST NOT be emitted; servers that need a
new class MUST add it here first.

### v0 commands

| op                            | args                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| `org.create`                  | `{ name }`                                                   |
| `space.create`                | `{ org_id, name }`                                           |
| `project.create`              | `{ space_id, name }`                                         |
| `connector.connect`           | `{ provider: "google_drive" \| "github" }`                   |
| `connector.disconnect`        | `{ connector_id }`                                           |
| `connector.import_resource`   | `{ connector_id, picker_item_id }`                           |
| `attachment.rename`           | `{ attachment_id, name }`                                    |
| `attachment.delete`           | `{ attachment_id }`                                          |
| `attachment.link`             | `{ attachment_id, object_kind, object_id }`                  |
| `attachment.unlink`           | `{ attachment_id, object_kind, object_id }`                  |
| `connector.list_picker_items` | `{ connector_id }` → `command_result.picker_items`           |

The last one is a **query** that returns inline data on `command_result`
rather than emitting events (read path, not write path).

## Events (daemon → surface)

Pushed after successful appends to clients subscribed to the relevant
channel.

```
{ "v": 0, "type": "event",
  "channel": "<channel-name>",
  "event": { ...full canonical event envelope... }
}
```

## Subscribe / unsubscribe

```
{ "v": 0, "id": "msg-...", "type": "subscribe",
  "channel": "<channel-name>" }
```

### v0 channels

| Channel                              | What streams                                              |
| ------------------------------------ | --------------------------------------------------------- |
| `user.<user_id>.orgs`                | org + membership events visible to this user              |
| `org.<org_id>.spaces`                | space events within this org                              |
| `space.<space_id>.projects`          | project events within this space                          |
| `project.<project_id>.all`           | every event scoped to this project                        |
| `project.<project_id>.attachments`   | attachment + link events for this project                 |
| `user.<user_id>.connectors`          | connector events for this user                            |

## Projections (daemon → surface)

Initial snapshots sent on subscribe, and periodic replacements when the
daemon recomputes:

```
{ "v": 0, "type": "projection",
  "name": "<projection-name>",
  "data": { ... }
}
```

### v0 projections

| Name                            | Shape (see below)             |
| ------------------------------- | ----------------------------- |
| `topbar`                        | `TopbarProjection`            |
| `git_ema.user_connectors`       | `UserConnectorsProjection`    |
| `git_ema.user_attachments`      | `UserAttachmentsProjection`   |
| `git_ema.project_attachments`   | `ProjectAttachmentsProjection`|
| `blueprint.sections`            | `BlueprintSectionsProjection` |
| `see_agent_work.project_pulse`  | `SeeAgentWorkProjection`      |

```
TopbarProjection {
  user:             { id: user:<ulid>, display_name: string }
  orgs:             [ { id: org:<ulid>, name: string } ]
  current_org?:     { id: org:<ulid>, name: string }
  spaces:           [ { id: space:<ulid>, org_id: org:<ulid>, name: string } ]
  current_space?:   { id: space:<ulid>, org_id: org:<ulid>, name: string }
  projects:         [ { id: project:<ulid>, space_id: space:<ulid>, name: string } ]
  current_project?: { id: project:<ulid>, space_id: space:<ulid>, name: string }
  node_state:       "home" | "replica_current" | "replica_provisional" | "replica_stale"
}

UserConnectorsProjection {
  connectors: [ Connector ]        // see types/connector.md
}

UserAttachmentsProjection {
  attachments: [ Attachment ]      // see types/attachment.md, all attachments visible to user
}

ProjectAttachmentsProjection {
  project_id:  project:<ulid>
  attachments: [ Attachment & { source_unreachable: bool } ]
}

BlueprintSectionsProjection {
  documents: [
    {
      id: blueprint_doc:<ulid>
      title: string
      sections: Section[]          // Section has id, title, children[], attachments[]
    }
  ]
}

SeeAgentWorkProjection {
  project_id: project:<ulid>
  swarms: Swarm[]
  campaigns: Campaign[]
  missions: Mission[]
  lanes: Lane[]
  handoffs: Handoff[]
  vcalendar: {
    weekly_phase: string
    blocks: CalendarBlock[]
    checkups_due: Checkup[]
  }
  actors: ActorRole[]
  recent_events: EventSummary[]
  cli_suggestions: string[]
  mocked: bool
}
```

Each projection name maps 1:1 to a TypeScript interface in
`packages/surface-core/src/projections/`. If the two drift, the
contract file is canonical.

## Error classes

Enumerated. Every `command_result.error.class` value MUST be one of:

| Class          | Meaning                                                      |
| -------------- | ------------------------------------------------------------ |
| `unknown_op`   | `op` does not exist in this protocol version                 |
| `invalid_args` | `args` failed schema validation                              |
| `not_found`    | referenced entity does not exist                             |
| `forbidden`    | caller lacks authority for this op in this scope             |
| `conflict`     | op would violate an invariant (dup id, stale version, etc.)  |
| `auth`         | hello/device-key ceremony rejected                           |
| `validation`   | value-level check failed beyond schema (e.g. bad ULID)       |
| `unavailable`  | daemon is degraded (not-home, read-only, upstream unreachable) |
| `internal`     | unhandled server-side error (bug)                            |

Adding a new class is a protocol change: update this table, bump nothing
under `v: 0`. Removing or renaming a class is a breaking change and
requires `v: 1`.

## Keepalive

Both sides send a heartbeat every 10s during quiet periods:

```
{ "v": 0, "type": "ping", "id": "msg-..." }
{ "v": 0, "type": "pong", "in_reply_to": "msg-..." }
```

A side that doesn't see a `pong` within 15s after its `ping` treats the
connection as dead and closes.

## Reconnect

Clients reconnect with exponential backoff (1s, 2s, 4s, 8s; cap 15s).
On reconnect:

1. Send a fresh `hello`.
2. Re-issue **subscribe** for every channel the client was subscribed
   to before the drop.
3. The daemon replies to each subscribe with a fresh projection
   snapshot (not a delta replay). Clients discard any in-flight
   unacknowledged command on a dropped connection and expect the caller
   to retry explicitly.

**Projection snapshot semantics.** The first `projection` message after
a `subscribe` reflects the daemon's current computed state as of the
latest committed event at the moment of reply. Intermediate deltas (any
events appended while the client was disconnected) are **not** replayed.
Surfaces derive all state from the snapshot plus any `event` messages
delivered *after* the snapshot on the same channel.

There is no "resume from txid" semantic in v0. Surfaces are projection
consumers, not log followers.

## Backpressure

If a subscriber can't keep up (per-subscription send buffer exceeds
**N = 500** pending messages, counting both events and projections),
the daemon drops the subscription with:

```
{ "v": 0, "type": "subscription_dropped",
  "channel": "<channel>",
  "reason": "backpressure" }
```

The client should re-subscribe; the resulting fresh snapshot is
equivalent to having received every delta.

If backpressure trips between receiving a `subscribe` and sending the
first `projection`, the daemon MUST send `subscription_dropped` for that
channel **without** a preceding `projection`. Clients MUST treat
`subscription_dropped` as cancelling any implicit expectation of an
inbound projection on that channel.

`N` is not tunable in v0. A future wave may expose it per-surface.

## Query vs mutation commands

Most commands mutate: the daemon's `command_result` carries
`event_ids[]` with the ids of appended events.

A few commands are pure queries (no side effect) and return inline data
on `command_result` under a command-specific key. Wave-1 queries:

- `connector.list_picker_items` → `picker_items[]`

Query commands MUST NOT appear in the event log. They bypass the bus
and return synchronously.

## Versioning

- `v: 0` is the only accepted version until a breaking change.
- New commands / channels / projections can be added under `v: 0`
  (additive).
- Breaking changes bump to `v: 1` and this file is re-published as
  `shell-protocol.v1.md`.
