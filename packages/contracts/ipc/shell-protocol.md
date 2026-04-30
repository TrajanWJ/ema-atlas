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
`v`, `type`, `in_reply_to`, `ok`, then success data (`events`, `projection`,
or another command-specific field) or `error` on failure. Clients MAY rely on
field order to short-circuit parsing.

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
  "ok": true,
  "projection": { "name": "<projection-name>", "data": { ... } }
}
```
or
```
{ "v": 0, "type": "command_result",
  "in_reply_to": "msg-...",
  "ok": true,
  "data": { "name": "<projection-name>", "value": { ... } }
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
| `project.create`              | `{ org_id, space_id, name }`                                 |
| `collab.document.open`        | `{ target: CollabDocumentTarget }` → `command_result.projection` |
| `collab.document.replace`     | `{ target: CollabDocumentTarget, revision, text }`           |
| `identity.google_upsert`      | `{ user_id, google_sub, email, display_name, email_verified }` |
| `identity.authenticator_enable` | `{ user_id, secret_ref }`                                  |
| `device.register`             | `{ org_id, device_id, user_id, name, pubkey, bootstrap: "genesis" \| "paired" }` |
| `device.local_register`       | `{ org_id, user_id, name, bootstrap?: "genesis" \| "paired" }` |
| `peer.trust_establish`        | `{ org_id, peer_device, peer_pubkey, local_pubkey, ceremony_kind, ceremony_id, lineage_proof? \| device_id? }` |
| `replication.collab.frames_since` | `{ org_id, peer_device, document_id, after_revision }` → `command_result.data` |
| `replication.collab.apply_frame` | `{ org_id, peer_device, document_id, frame_id, revision, text, created_at }` → `command_result.data` |
| `membership.role_grant`       | `{ org_id, user_id, role }`                                  |
| `invite.create`               | `{ org_id, target_kind, target_value, role, expires_at }`    |
| `invite.accept`               | `{ org_id, invite_id, accepted_by, accepted_device, role }`  |
| `invite.revoke`               | `{ org_id, invite_id, reason? }`                             |
| `invite.expire`               | `{ org_id, invite_id }`                                      |
| `access_session.challenge`    | `{ org_id, access_point, scopes, expires_at }`               |
| `access_session.approve`      | `{ org_id, challenge_id, user_id, approved_by_device, scopes, expires_at }` |
| `access_session.revoke`       | `{ org_id, session_id, reason? }`                            |
| `access_session.expire`       | `{ org_id, session_id }`                                     |
| `connector.connect`           | `{ provider: "google_drive" \| "github" }`                   |
| `connector.disconnect`        | `{ connector_id }`                                           |
| `connector.import_resource`   | `{ connector_id, picker_item_id }`                           |
| `attachment.rename`           | `{ attachment_id, name }`                                    |
| `attachment.delete`           | `{ attachment_id }`                                          |
| `attachment.link`             | `{ attachment_id, object_kind, object_id }`                  |
| `attachment.unlink`           | `{ attachment_id, object_kind, object_id }`                  |
| `connector.list_picker_items` | `{ connector_id }` → `command_result.picker_items`           |
| `companion.discover`          | `{}` → `command_result.data: CompanionStatusProjection`      |
| `companion.window.open`       | `{ window_id, app_id, url, bounds, transparent }`            |
| `companion.window.close`      | `{ window_id }`                                              |
| `companion.window.focus`      | `{ window_id }`                                              |
| `companion.window.reattach_ack` | `{ window_id }`                                            |

`collab.document.open` is a **room open/query**: it starts or attaches to the
BEAM room and immediately pushes the current `collab.document` projection over
the same connection. It does not append a canonical event.

`collab.document.replace` writes a whole-body replacement frame to the BEAM
collab store. The daemon may emit `collab.document.checkpointed` when the
replace advances the durable checkpoint; no per-keystroke document updates are
canonical events.

`connector.list_picker_items` is a **query** that returns inline data on
`command_result` rather than emitting events (read path, not write path).

`companion.*` commands are the daemon-brokered form of the place-companion
protocol. Browser surfaces may use the direct localhost companion bridge during
recovery, but the durable EMA shape is daemon-owned discovery + window events:
the daemon validates localhost/origin policy, tracks native window state, and
emits `companion.status` / `companion.windows` projections.

The current 0.0.5 broker slice tracks requested native-window state in daemon
memory and marks opened windows as `pending_native_attach`. It accepts `bounds`
for projection parity, but it does not yet prove that a native companion process
opened the window; browser surfaces must keep the direct companion and
`window.open()` fallbacks until `companion.status.available` is true.

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
| `collab.document`                     | BEAM collab projection replacements after document open   |
| `companion.status`                    | daemon-brokered companion availability snapshots          |
| `companion.windows`                   | daemon-tracked companion window snapshots                 |

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
| `access_session.current`        | `AccessSessionProjection`     |
| `device.registry`               | `DeviceRegistryProjection`    |
| `peer.trust`                    | `PeerTrustProjection`         |
| `invite.registry`               | `InviteRegistryProjection`    |
| `project.filesystem_status`     | `ProjectFilesystemProjection` |
| `space.installed_vapps`         | `SpaceInstalledVAppsProjection` |
| `lane.registry`                 | `LaneRegistryProjection`      |
| `queue.registry`                | `QueueRegistryProjection`     |
| `campaign.registry`             | `CampaignRegistryProjection`  |
| `mission.registry`              | `MissionRegistryProjection`   |
| `handoff.registry`              | `HandoffRegistryProjection`   |
| `problem.graph`                 | `ProblemGraphProjection`      |
| `agent.reports`                 | `AgentReportsProjection`      |
| `git_ema.user_connectors`       | `UserConnectorsProjection`    |
| `git_ema.user_attachments`      | `UserAttachmentsProjection`   |
| `git_ema.project_attachments`   | `ProjectAttachmentsProjection`|
| `chronicle.activity`            | `ChronicleActivityProjection` |
| `blueprint.sections`            | `BlueprintSectionsProjection` |
| `collab.document`               | `CollabDocumentProjection`    |
| `see_agent_work.project_pulse`  | `SeeAgentWorkProjection`      |
| `companion.status`             | `CompanionStatusProjection`   |
| `companion.windows`            | `CompanionWindowsProjection`  |

```
TopbarProjection {
  user:             { id: user:<ulid>, display_name: string }
  orgs:             [ { id: org:<ulid>, name: string } ]
  current_org?:     { id: org:<ulid>, name: string }
  spaces:           [ { id: space:<ulid>, org_id: org:<ulid>, name: string } ]
  current_space?:   { id: space:<ulid>, org_id: org:<ulid>, name: string }
  projects:         [ { id: project:<ulid>, space_id: space:<ulid>, name: string } ]
  current_project?: { id: project:<ulid>, space_id: space:<ulid>, name: string }
  memberships:      [ { user_id: user:<ulid>, role: string, status: string } ]
  node_state:       "home_current" | "replica_current" | "replica_provisional" | "replica_stale"
}

AccessSessionProjection {
  challenges: [
    {
      challenge_id: access_challenge:<ulid>
      org_id: org:<ulid>
      access_point: string
      user_code: string
      scopes: string[]
      status: "open" | "approved" | "expired" | "revoked"
      expires_at: ISO-8601 UTC
    }
  ]
  sessions: [
    {
      session_id: access_session:<ulid>
      challenge_id: access_challenge:<ulid>
      org_id: org:<ulid>
      user_id: user:<ulid>
      approved_by_device: device:<ulid>
      scopes: string[]
      status: "active" | "revoked" | "expired"
      expires_at: ISO-8601 UTC
    }
  ]
}

DeviceRegistryProjection {
  devices: [
    {
      device_id: device:<ulid>
      org_id: org:<ulid>
      user_id: user:<ulid>
      name: string
      pubkey: string
      bootstrap: "genesis" | "paired"
      status: "trusted" | "revoked"
      updated_at: ISO-8601 UTC
    }
  ]
  machine_peer_ready: false
  transport: "disabled"
}

CompanionStatusProjection {
  available: boolean
  transport: "direct-websocket" | "daemon-brokered" | "unavailable"
  protocol_version?: string
  version?: string
  port?: number
  tracked_window_count?: number
  focused_window_id?: string
  last_error?: string
}

CompanionWindowsProjection {
  focused_window_id?: string
  windows: [
    {
      window_id: string
      app_id: string
      url: string
      bounds?: { x: number, y: number, width: number, height: number }
      transparent: boolean
      state?: "opening" | "open" | "closed" | "error"
      lifecycle?: "pending_native_attach" | "reattached"
      error?: string
    }
  ]
}

PeerTrustProjection {
  peers: [
    {
      org_id: org:<ulid>
      peer_device: device:<ulid>
      peer_pubkey: string
      local_pubkey: string
      ceremony_kind: "qr_ble_hybrid" | "recovery_packet" | "genesis"
      ceremony_id: string
      status: "trusted" | "revoked"
      established_at: ISO-8601 UTC
    }
  ]
  replication_enabled: false
  transport: "disabled"
}

InviteRegistryProjection {
  invites: [
    {
      invite_id: invite:<ulid>
      org_id: org:<ulid>
      target_kind: string
      target_value: string
      role: "owner" | "admin" | "member" | "guest"
      status: "open" | "accepted" | "revoked" | "expired"
      expires_at: ISO-8601 UTC
      updated_at: ISO-8601 UTC
    }
  ]
}

ProjectFilesystemProjection {
  projects: [
    {
      project_id: project:<ulid>
      space_id: space:<ulid>
      org_id: org:<ulid>
      name: string
      local_path: string
      status: "pending" | "materialized" | "materialization_failed"
      reason: string
    }
  ]
}

ChronicleActivityProjection {
  source: "daemon_events"
  host_id: string
  events: [
    {
      id: string
      txid: number
      kind: string
      source: string
      session_id: string
      actor: string
      org_id: string
      space_id?: string
      project_id?: string
      ts: ISO-8601 UTC
      label: string
    }
  ]
  sessions: [
    {
      id: string
      actor: string
      org_id: string
      space_id?: string
      project_id?: string
      started_at: ISO-8601 UTC
      last_event_at: ISO-8601 UTC
      event_count: number
      latest_kind: string
    }
  ]
  sources: [
    {
      source: string
      event_count: number
      latest_at: ISO-8601 UTC
    }
  ]
}

SpaceInstalledVAppsProjection {
  org_id: org:<ulid>
  space_id: space:<ulid>
  source: string
  apps: [
    {
      installation_id: string
      vapp_id: string
      slug: string
      label: string
      status: "live" | "projection" | "staged"
      project_name: string
      enabled: bool
      sort_order: int
      config: object
    }
  ]
}

LaneRegistryProjection {
  source: "daemon_events"
  lanes: [
    {
      id: lane:<ulid>
      lane_id: lane:<ulid>
      title: string
      name: string
      status: "idea" | "ready" | "active" | "review" | "blocked" | "done"
      project_id?: project:<ulid>
      mission_id?: mission:<ulid>
      scope?: string
      claim_scope?: string
      done_when?: string
      depends_on?: string
      opened_by?: actor:<ulid> | user:<ulid> | system:<component>
      actor_id?: actor:<ulid>
      goal?: string
      next?: string
      blocker?: string
      blocked_reason?: string
      opened_at?: ISO-8601 UTC
      updated_at?: ISO-8601 UTC
    }
  ]
}

QueueRegistryProjection {
  source: "daemon_events"
  queue_items: [
    {
      id: queue_item:<ulid>
      queue_item_id: queue_item:<ulid>
      title: string
      why: string
      status: "ready" | "blocked" | "closed"
      project_id?: project:<ulid>
      mission_id?: mission:<ulid>
      lane_id?: lane:<ulid>
      done_when?: string
      depends_on?: string
      blocked_by?: string
      source?: string
      added_by?: actor:<ulid> | user:<ulid> | system:<component>
      blocked_reason?: string
      result?: string
      added_at?: ISO-8601 UTC
      updated_at?: ISO-8601 UTC
    }
  ]
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

CollabDocumentTarget =
  | { kind: "blueprint_section", id: blueprint_sec:<ulid> }

CollabDocumentProjection {
  target:       CollabDocumentTarget
  title?:       string
  text:         string
  revision:     int
  status:       "opening" | "live" | "saving" | "offline"
  authority:    "beam"
  updated_at?:  ISO-8601 UTC
  presence: [
    {
      session_id: access_session:<ulid>
      user_id?: user:<ulid>
      display_name?: string
      color?: string
      cursor?: int
      selection_start?: int
      selection_end?: int
      last_seen_at: ISO-8601 UTC
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
