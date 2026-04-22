# Launchpad

A top-level surface (not a vApp proper) — the Windows-8 / Start-menu-style
launcher that frames vApps and surfaces useful at-a-glance info. Launchpad
is the first thing a user sees when they open EMA from the dock.

## What it owns

Nothing canonical. Launchpad is a **shell surface** — it composes
projections from the control plane (recent activity), the workspace
(pinned artifacts), and the collab plane (presence) into a single
launch-oriented view. It is the parent frame in which vApps render.

## What it renders

- Tile grid of installed vApps (Wiki, Chat, Threads, Agent vEnv,
  Blueprint, Code, Files, Images)
- "Useful info" tiles: today's calendar, queue depth, open-question
  count, current workstream
- Recent sessions and recent workspace artifacts
- Project / Space switcher
- Notification indicators per vApp (unread threads, queued reviews)

## What humans can do

- Launch any vApp into the Virtual Desktop
- Switch Project / Space
- Pin / unpin info tiles
- Drag a tile to start a quick action (e.g. drop a file onto Files)
- Promote Launchpad to the active surface (vs. Virtual Desktop)

## What agents can do via CLI

- `ema launchpad register-vapp --name --entrypoint`
- `ema launchpad tile add --kind --source` (custom info tile)
- `ema launchpad notify --vapp --count --reason`
- `ema launchpad activity --tail` (subscribe to activity stream)

## Chronicle / review / memory links

- Project / Space switches emit a control-plane `SurfaceFocusEvent` so
  the Intelligence Layer can scope `context_for/2` correctly.
- Recent-activity tiles read the chronicle event log directly.
- Notification badges resolve to typed memory links (thread id,
  workstream id, queue item id).

## How it satisfies the canonical rule

Launchpad renders typed projections only. Tile registrations live in a
per-user workspace artifact (`workspace://launchpad/layout.json`). No
Launchpad code calls `event_log.append/2`; it can only emit
`SurfaceFocusEvent` through a narrow typed channel.

## v0.0.3 question

**After v0.0.3 — but cheaply.** Launchpad's value is composition: it
needs at least two real vApps to be more than a static page. Ship Chat
in v0.0.3, then add a 3-tile Launchpad shell (Chat, Threads-stub,
Files-stub) immediately after. The smallest provable slice is a
single-row tile grid that launches Chat with a project switcher.
