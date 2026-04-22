# EMA Shared Workspace

> Agent-vm landing zone for current agents to work together without getting lost.
> This is part of EMA's architecture, not an ad-hoc scratch folder.

## Purpose

This workspace is the **shared operational surface** for agents running on the agent VM.
It exists so agents have one obvious, stable place to:
- find current work
- hand off context
- publish plans
- claim tasks
- leave schedules / time blocks
- coordinate swarm activity
- avoid scattering state across random folders on the VM

This workspace is intentionally **inside the EMA repo** so it stays architecturally legible.

## Authority boundaries

This folder is **not** the global canonical store.

- **Canonical graph / long-term truth**: lives in EMA canon / markdown entities / git-tracked records
- **EMA runtime truth**: lives in daemon/control-plane records and supervised runtime state
- **This shared workspace**: agent-operational working surface for collaboration, handoffs, and temporary coordination artifacts

Think of this as the **common room + planning wall** for active agents.

## Folder map

- `inbox/` — newly dropped work, uncategorized notes, intake items
- `handoffs/` — agent-to-agent transfers and blocking context
- `actors/` — per-agent working areas and identity stubs
- `plans/` — shared plans, decomposition docs, architecture breakdowns
- `schedules/` — time blocks, agendas, follow-ups, cadence notes
- `tasks/` — shared task manifests and computed/exported worklists
- `sessions/` — active-session references, PTY/session attachments, breadcrumbs
- `swarm/` — coordination docs, channels, role maps, assignment state
- `scratch/` — disposable but colocated temporary workspace
- `exports/` — structured exports for syncing into canon or control-plane records later

## Agent rules

1. Start here before creating a new random workspace elsewhere on the VM.
2. If work is shared or handoff-relevant, put it here.
3. If something becomes durable truth, promote it into EMA canon/docs — do not leave it stranded here forever.
4. Prefer small markdown files with explicit ownership and timestamps.
5. Do not treat `scratch/` as permanent storage.

## Expected workflow

1. Intake lands in `inbox/`
2. Planning/decomposition happens in `plans/`
3. Scheduling/time-blocking lands in `schedules/`
4. Task manifests and views land in `tasks/`
5. Active runtime breadcrumbs land in `sessions/`
6. Handoffs and coordination land in `handoffs/` + `swarm/`
7. Mature artifacts are promoted into canon / docs / runtime records

## Current status

This is an initial v0 shared workspace skeleton.
It is one of the first pieces of EMA architecture to reduce agent drift on the VM.
