# Swarm Coordination Contract v1

- actor: hermes-a5
- created_at: 2026-04-21T04:43Z
- status: draft
- scope: minimal v1 contract for swarm coordination in EMA shared workspace
- related_dispatch: `workspace/shared/swarm/SWARM_META_BUILD_2026-04-21.md`

## Goal

Define the minimum coordination contract that lets multiple agents work together on the agent VM without drift.

This contract is intentionally local-first:
- readable by humans and agents
- backed by markdown files in `workspace/shared/`
- not treated as canonical truth
- easy to later project into EMA runtime PubSub / distributed coordination

## v1 principles

1. Shared workspace is the coordination surface, not the permanent source of truth.
2. Every active agent must have one discoverable actor record.
3. Assignments must be visible without scanning chat logs.
4. Handoffs must be explicit, file-based, and link the next owner.
5. Channels are named collaboration surfaces, even if v1 is only markdown + local sessions.
6. Live/distributed coordination can arrive later, but must preserve the same basic contract.

## Minimal v1 objects

### 1. Actor registry

Purpose: answer "who exists in this swarm right now, what are they responsible for, and where is their working record?"

Minimum representation:
- one actor file per agent in `workspace/shared/actors/<actor-id>.md`
- optional shared index later, but not required for v1 if actor files are consistently named

Required fields per actor record:
- `actor_id` — stable swarm-local id such as `hermes-a5`
- `harness` — Hermes / Claude Code / Codex / other runtime
- `role` — short responsibility label
- `status` — assigned | active | blocked | done
- `assignment` — current owned task
- `inputs` — key files the actor is expected to read
- `outputs` — expected artifact(s)
- `handoff_to` — next actor if already known, else blank
- `updated_at`

Minimal rule:
- the actor file is the registry entry and the working memo in one place
- do not create a second hidden registry database for v1

### 2. Assignments

Purpose: make task ownership legible and avoid duplicate work.

V1 assignment source:
- swarm dispatch file in `workspace/shared/swarm/`
- reflected into each actor file

Assignment contract:
- one primary assignment owner at a time
- an assignment may reference dependencies on other actors, but ownership is singular
- if ownership changes, update the actor file and create a handoff note

What belongs in assignments:
- task statement
- expected output path
- blocking dependencies
- completion signal

What does not belong in assignments:
- large implementation detail that should live in plans/docs
- durable product truth that should be promoted elsewhere

### 3. Handoffs

Purpose: transfer work without forcing the next agent to reconstruct context from raw session history.

V1 representation:
- `workspace/shared/handoffs/<actor-id>--handoff.md`

Required handoff sections:
- from
- to
- subject
- why handoff exists
- current state
- blockers / open questions
- files to read next
- exact next action requested
- timestamp

Handoff rules:
- create a handoff whenever another agent needs your output to proceed
- prefer short, explicit, actionable notes
- link to files instead of duplicating long content
- if no cross-agent dependency exists, no handoff file is required

### 4. Channels

Purpose: define where coordination happens, even before EMA has distributed messaging.

V1 channels are folder-backed coordination surfaces:
- `actors/` — per-actor identity + current state
- `handoffs/` — directed transfers between actors
- `plans/` — shared decomposition and design artifacts
- `tasks/` — shared task manifests / computed work views
- `sessions/` — active runtime breadcrumbs
- `swarm/` — dispatches, role maps, coordination contracts, synthesis docs

Channel contract in v1:
- channel name implies coordination purpose
- file placement is the routing mechanism
- readers should not need private chat access to understand shared state

Future mapping:
- these same channels can later map to PubSub topics, daemon views, or distributed mailboxes
- folder semantics should remain stable so local and distributed modes feel equivalent

## Local-first boundary

### What stays local in v1

Keep these as local shared-workspace artifacts on the agent VM:
- actor registry files
- dispatch docs
- assignment reflections
- handoff notes
- session breadcrumbs
- temporary coordination plans
- swarm synthesis drafts

Reason:
- simple
- inspectable
- git-friendly
- no daemon/runtime coupling required to get value now

### What is future distributed, not required for v1

Do not require these for initial swarm coordination:
- distributed actor discovery across multiple machines
- live presence heartbeats
- automatic task leasing / lock arbitration
- PubSub-driven handoff delivery
- replicated swarm state between hosts
- daemon-enforced coordination protocols
- canonical graph promotion automation

These are v2+ enhancements, not prerequisites.

## Relationship to canon and runtime

The contract should stay strict about authority:

Shared workspace is for:
- operational collaboration
- orientation
- temporary coordination state
- human-readable swarm activity

Canonical graph / docs are for:
- durable intent
- approved proposals
- execution history
- promoted architecture truth

Runtime/control plane is for:
- live supervised state
- clocks, sessions, workers
- future distributed routing / PubSub / watchers

Rule:
- if coordination data becomes durable truth, promote it out of the shared workspace
- if coordination data is only needed to keep agents aligned right now, keep it local

## Minimal workflow

1. Swarm dispatch defines agents and assignments in `swarm/`.
2. Each agent maintains its own `actors/<actor-id>.md` record.
3. Shared artifacts are written to their declared output paths.
4. If another actor depends on the work, create `handoffs/<actor-id>--handoff.md`.
5. If an artifact becomes durable architecture truth, promote it into docs/canon later.

## Suggested actor file shape

```md
# <actor-id>

- actor_id: <actor-id>
- harness: <runtime>
- role: <short role>
- status: assigned|active|blocked|done
- assignment: <current task>
- inputs:
  - <path>
- outputs:
  - <path>
- handoff_to: <actor-id or blank>
- updated_at: <timestamp>

## Notes

<working notes / conclusions / links>
```

## Suggested handoff file shape

```md
# <from-actor> handoff

- from: <actor-id>
- to: <actor-id>
- subject: <short topic>
- created_at: <timestamp>

## Current state

<what is done>

## Read next

- <path>
- <path>

## Next requested action

<one concrete next step>

## Blockers / caveats

<only what matters>
```

## Bottom line

The minimal swarm coordination contract for v1 is:
- actor files are the registry
- swarm dispatch files define assignments
- handoff files transfer dependency context
- folder paths act as channels
- all coordination stays local to the shared workspace unless and until EMA grows distributed runtime support

That is enough to support multi-agent collaboration now without prematurely inventing a distributed control plane.