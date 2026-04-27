# Virtual Desktop

A top-level surface (not a vApp proper) — the main interface metaphor
inherited from place.org. Accessible as a native desktop app or as a
website. The Virtual Desktop is the spatial metaphor that lets vApps,
Launchpad, and HQ coexist as windows in one inhabited place.

## What it owns

Nothing canonical. The Virtual Desktop is a **shell surface** — the
outermost frame. It owns window geometry and dock layout as per-user
workspace artifacts; everything inside any window is owned by some
other plane.

## What it renders

- Windows hosting vApps (Wiki, Chat, Threads, Agent vEnv, Blueprint,
  Code, Files, Images) and shells (Launchpad, HQ)
- A dock with launchable apps and presence indicators
- Other-user / other-agent presence (cursors, window outlines) when in
  a shared Space
- Wallpaper / scene as a per-Project / per-Space artifact (place.org
  DNA: the desktop is *somewhere*, not nowhere)
- A focus-mode toggle that hides chrome for deep work

## What humans can do

- Open / close / move / resize / tile vApp windows
- Save and restore a window layout per Project
- Invite another user / agent into the desktop as a co-presence
- Switch between Personal Desktop and Project Desktops
- Drop files / artifacts onto the desktop to spawn the right vApp

## What agents can do via CLI

- `ema desktop layout save --name --project`
- `ema desktop layout load <name>`
- `ema desktop window open --vapp --position --size`
- `ema desktop presence join --space --as <agent-id>`
- `ema desktop wallpaper set --project --asset` (place-as-place)

## Chronicle / review / memory links

- Layout changes are workspace artifacts, not control-plane events
  (low-stakes, high-frequency).
- Presence joins / leaves emit `SurfaceFocusEvent` so the Intelligence
  Layer scopes context correctly.
- Wallpaper / scene changes are versioned workspace artifacts (the
  place itself has a history).

## How it satisfies the canonical rule

The Virtual Desktop holds layout, geometry, and presence projection —
no domain truth. Layouts are workspace artifacts owned by the workspace
plane; presence is a collab-plane projection. The desktop renders both
and emits typed surface events through narrow channels.

## v0.0.3 question

**After v0.0.3.** The Virtual Desktop is the most expensive surface to
build well and the most easily reduced to costume. It needs at least
three real vApps to feel inhabited rather than ornamental. The smallest
provable slice is a single-window "desktop" that hosts Chat with a
wallpaper and a dock — basically a chrome around the v0.0.3 Chat ship.
Grow from there once Threads and Files are real.
