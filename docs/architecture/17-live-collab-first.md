# 17 — Live collaboration first

Status: priority reset, canonized 2026-04-24.

The product proof point is not "a second machine exists in a settings table."
The proof point is:

> Two people open the same EMA document and see each other's edits live.

That should become the top execution priority. The p2p machine network exists
to make that experience self-hosted, self-distributed, and durable across
trusted EMA machines.

## Priority Order

1. **Live document on one EMA daemon**
   - One collaborative Blueprint/Myro-style document.
   - Multiple browser sessions connected to the same local daemon.
   - Live text updates and presence.
   - All collaboration room authority lives in supervised BEAM processes.
   - This proves the user experience.

2. **Persist collaborative document updates**
   - Store document-update frames durably.
   - Rehydrate on daemon restart.
   - Keep structural Blueprint events canonical.
   - Keep high-frequency prose edits out of the coarse event log unless they
     are checkpointed or summarized.

3. **Trusted machine pairing**
   - Generate device key.
   - Store private key in OS secret storage.
   - Emit paired-device events.
   - Establish peer trust.

4. **Daemon-to-daemon update transport**
   - Carry the same document-update stream over the p2p transport.
   - Iroh remains the preferred product rail.
   - Iroh may be a transport sidecar, but it is not document authority.
   - SSH/dev rails are bootstrap only.

5. **Multi-machine live collaboration**
   - Browser A -> daemon A -> p2p stream -> daemon B -> browser B.
   - No central EMA server.
   - Google identity can prove the human, but never hosts the document or
     becomes replication authority.

## Authority Split

```txt
Google account / Authenticator
  proves the human

EMA membership
  grants org/project/document authority

Browser access session
  grants temporary UI access

EMA daemon
  owns the live collaboration room and durable local state on BEAM

EMA machine peer
  replicates document updates to other trusted machines
```

## App Target

The first surface should be a **Blueprint/Myro-style live document**:

- simple page/canvas/document body;
- multiple cursors or active-user pills;
- low-latency edits;
- clear "connected to daemon" and "not machine peer" labels in browser;
- document identity tied to `blueprint_doc:<id>` or `blueprint_sec:<id>`.

Do not build generic chat first. Do not build a settings-heavy peer manager
first. The user-facing target is live shared work.

## Implementation Wedge

The first implementation may be single-daemon:

```txt
browser session A
  -> daemon collab room
  -> browser session B
```

The second implementation makes the room p2p:

```txt
browser A -> daemon A -> trusted p2p stream -> daemon B -> browser B
```

The protocol boundary should be the same in both cases so the p2p transport can
replace the local fan-out path without rewriting the editor.

## Canonical Contract Names

The all-BEAM first slice uses these names across daemon, IPC, surface-core,
and docs:

| Contract surface | Canonical name | Notes |
| ---------------- | -------------- | ----- |
| IPC command | `collab.document.open` | Opens or attaches to a BEAM room and returns the current projection. |
| IPC command | `collab.document.replace` | Writes a whole-body replacement frame for v0. |
| Projection | `collab.document` | Live document text, revision, status, authority, and ephemeral presence. |
| Internal API | `ema_collab.frames_since` | Exports contract-shaped durable frames after a revision for a future peer stream. |
| Internal API | `ema_collab.apply_frame` | Idempotently applies an in-order frame received from a trusted peer. |
| Internal API | `ema_collab.peer_cursor` / `mark_peer_applied` | Tracks a peer device's last applied revision per document without enabling transport. |
| Event | `collab.document.checkpointed` | Optional canonical checkpoint metadata; no per-keystroke event spam. |

The first document target is:

```txt
{ kind: "blueprint_section", id: blueprint_sec:<ulid> }
```

Do not mint `collab.document.current`, `blueprint.collab.*`, or Yjs-shaped room
names. Room identity is the typed target id.

## BEAM Runtime Shape

```txt
ema_collab_sup
  ├── collab_room:blueprint_sec:<id>
  ├── collab_room:blueprint_sec:<id>
  └── collab_presence_gc
```

Each room process owns:

- current document text/update state;
- connected browser access sessions;
- ephemeral presence;
- append-only durable update frames;
- exportable frame backlogs keyed by `collab_frame:<ulid>`;
- idempotent frame ingestion with revision-gap rejection;
- per-peer document cursors that only advance;
- periodic snapshots;
- future peer stream fan-out.

## Non-Negotiables

- No central EMA-hosted collaboration server.
- No Node/Hocuspocus/Yjs process as document authority.
- No document truth in browser localStorage.
- No Google Drive / Google Docs as storage substrate.
- No phone or browser becomes a machine peer.
- Presence is ephemeral.
- Document updates are durable on trusted EMA machines and later replicated
  peer-to-peer.
