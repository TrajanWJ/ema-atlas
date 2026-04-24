# 05 — Writer topology

## One rule

The BEAM daemon owns every write to canonical SQLite. No surface, no
sidecar, no helper ever opens the canonical database for writing.

## Daemon lifecycle

The daemon runs as a **user-level system service**, not as a Tauri
sidecar:

- macOS: `launchd` user agent (`~/Library/LaunchAgents/ema.daemon.plist`).
- Linux: `systemd --user` unit.
- Windows: Service or Scheduled Task running at logon.

This gives us:

- one daemon instance per user session regardless of how many surfaces are
  open (desktop + browser tab);
- clean crash recovery independent of any UI process;
- the same integration shape on all platforms.

Tauri does **not** embed or spawn the daemon. On first launch, if the
service is not installed, the desktop app prompts to install it (one-time
elevated-ish permission — user approves the launchd agent).

## Surfaces = clients

Tauri desktop and the browser app both:

1. connect to `ws://127.0.0.1:<ema-port>` ;
2. authenticate the connection (device key ceremony — later wave);
3. receive projections + event stream;
4. send commands; never mutate local state in a way that persists to
   canonical truth.

## Read path

Surfaces read from **projections** that the daemon maintains. A projection
is a small materialized view kept in-memory (and periodically checkpointed
to a non-canonical sqlite for warm-restart). Examples:

- `topbar.projection` — current user's orgs, spaces in the selected org,
  projects in the selected space.
- `git_ema.project_attachments` — attachments linked to the current
  project.
- `blueprint.sections` — current project's structural blueprint tree.

Each projection has one owning actor under its bounded context. The
projection actor subscribes to relevant event kinds on the bus and
streams deltas to IPC subscribers.

## Write path

Surfaces emit **commands** (not events) over IPC. The IPC worker validates
the command, routes it to the owning context's writer actor, which:

1. validates (authz, invariants);
2. produces one or more events;
3. appends to the bus;
4. returns success + the new event ids to the caller.

Projections fan out automatically after the append.

## SQLite layout

- `canonical.db` — event log + compacted object tables. Written only by
  writer actors under each context supervisor. WAL mode, single writer.
- `projections.db` — disposable warm-start cache for projections. May be
  deleted; daemon will rebuild from the canonical log.
- `blobs/` — local blob store for `attachment.source = "local"` (not
  populated this wave).

## Why not just a Tauri sidecar

Tauri sidecars:
- are tied to one desktop process lifetime;
- don't serve the browser app, so we'd end up with two daemons or a
  split-brain;
- have DIY lifecycle management (restart, log rotation, crash handling)
  that OS service managers solve for us.

A system-service daemon is more install friction once, then zero.
