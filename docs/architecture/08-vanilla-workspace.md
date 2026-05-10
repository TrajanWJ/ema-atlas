# 08 - Vanilla Workspace

The first implementation target is a vanilla EMA workspace.

This is deliberately smaller than the full EMA vision. It is the first room
that humans and agents can inhabit together before the complete
intent-to-canon workflow is implemented.

## Definition

A vanilla workspace is the smallest believable EMA project environment:

- two seeded organizations: `Trajan's Organization` (personal, current by default) with `Personal Workspace` as its default space, and `Founding-Fathers-EMA` (the EMA project org) with a same-name default space and the `EMA` project (`0.0.6` current build);
- one visible default space per org;
- one visible project under `Founding-Fathers-EMA` (`EMA 0.0.5`);
- a daemon-owned canonical event log;
- a shell that shows current org, space, project, and node state;
- Blueprint as the project-thinking surface;
- git-ema as the source and attachment surface;
- lane, handoff, proposal, dispatch, and execution event families present as
  contracts, even if some writers are stubbed;
- no hidden surface-owned truth.

The vanilla workspace does not need full autonomous workflow provisioning yet.
It must be ready for that workflow to land without changing the foundation.

## Non-Goal

This wave is not trying to complete:

- full `intent -> proposal -> plan -> spec -> execution -> canon`;
- real OAuth;
- multi-machine live collaboration;
- full Hermes dispatch;
- multi-peer failover;
- autonomous business campaign loops;
- complete soul creation tooling;
- debate presets;
- mission/campaign planning.

Those belong after the workspace shape can hold them.

## Required First Surfaces

### Topbar

The topbar must make scope obvious:

- current organization;
- current space;
- current project;
- current node or sync state;
- account/device menu.

The shell should not make the user guess what authority scope they are in.

### Blueprint

Blueprint proves project thinking can live inside EMA:

- render the current project's Blueprint document list;
- render a structural section tree;
- show section status where available;
- allow an attachment action on a section through git-ema;
- preserve a promotion path to proposals, even if promotion is a stub.

Blueprint owns no raw source files and no hidden workflow database. It renders
daemon-owned Blueprint structure and collaboration text when that layer lands.

### git-ema

git-ema proves source material can be attached without becoming hidden truth:

- show connectors;
- create demo attachments from fake Drive/GitHub/local entries;
- list current-project attachments;
- attach an existing attachment to a Blueprint section or other EMA object;
- preserve attachment records even if the external source becomes unreachable.

git-ema owns attachment and connector records through `ema_attachments`.
It does not own Blueprint structure, proposal state, or execution records.

### See Agent Work / Workspace Coordination Placeholder

The vanilla workspace should show that swarm work is first-class, even if its
controls are mocked:

- lane event family exists;
- handoff event family exists;
- proposal event family exists;
- See Agent Work renders missions, campaigns, swarms, lanes, handoffs,
  vCalendar, checkups, and agent role cards;
- See Agent Work exposes mocked start, pause, and stop controls;
- See Agent Work shows CLI equivalents for external agents;
- lanes can reference Blueprint sections, proposals, incidents, and
  attachments by id;
- handoffs can reference proposals, lane items, and incidents.

This keeps the agent-swarm doctrine alive without requiring the whole planner
surface in wave 1.

## Data Ownership

The vanilla workspace follows the six-plane data treatment:

- Canonical truth lives in `canonical.db` and daemon event logs.
- Collaboration prose lives in BEAM-owned document rooms mediated by the daemon.
- Runtime state is observable but not long-term canon.
- Surface projections are disposable.
- Imported source material lives through attachment records and external
  content pointers.
- Secrets and identity material stay outside ordinary workspace files.

No vApp should open its own permanent store for product truth.

## First Project Instance

The first local project instance should represent the EMA build itself:

```text
Organization: Founding-Fathers-EMA
Space: Founding-Fathers-EMA
Project: EMA 0.0.5
```

Suggested initial attachments:

- the central doctrine folder;
- the runtime repo;
- the atlas snapshot;
- selected donor/snapshot folders;
- key planning docs.

Suggested initial Blueprint sections:

- Executive Summary;
- Core Thesis;
- Problem EMA Solves;
- Design Principles;
- EMA Ontology;
- Canonical Workflow;
- Product Model;
- Core Product Surfaces;
- Open Questions.

The first project instance should treat imported files as evidence and source
material, not as canon by default.

## First Proof Workflow

The first proof is intentionally modest:

```text
open EMA project
-> view Blueprint section tree
-> attach a source document or codebase through git-ema
-> see attachment linked to a Blueprint section
-> emit canonical attachment and Blueprint mirror events
-> view the updated projection
```

This proves the architecture that matters most:

- shell scope is legible;
- Blueprint renders project structure;
- git-ema handles source material;
- the daemon owns the write path;
- surfaces receive projections;
- source material is linked, not silently promoted to canon.

## Event Families Needed

The current v0 catalog already contains the families needed for the vanilla
workspace:

- `org`
- `actor`
- `identity`
- `space`
- `project`
- `membership`
- `invite`
- `access_session`
- `device`
- `peer`
- `lease`
- `replication`
- `lane`
- `handoff`
- `proposal`
- `incident`
- `dispatch`
- `execution`
- `tool`
- `blueprint`
- `collab`
- `attachment`
- `connector`

Do not add `plan` or `spec` events until the proposal path is implemented
enough to need them. For now, keep `plan` and `spec` in doctrine as future
workflow stages.

## Implementation Order

1. Keep contract docs complete and internally consistent.
2. Implement daemon command/write path for org, space, project, Blueprint
   structure, attachment, and connector stubs.
3. Implement projections for topbar, Blueprint sections, project attachments,
   user connectors, and See Agent Work mock state.
4. Build the web shell against projections.
5. Add Tauri only after the web shell proves the contract.
6. Add See Agent Work with lanes, missions, campaigns, vCalendar, mocked
   controls, and CLI equivalents.
7. Add thin lane/handoff/proposal views after Blueprint and git-ema work.
8. Add the BEAM-owned `collab.document` live document loop after structural
   Blueprint writes are stable.
9. Add real Hermes dispatch after the workspace can show what was requested,
   linked, and approved.

## Acceptance Criteria

The vanilla workspace is ready when:

- the first workspace lands in `Founding-Fathers-EMA`,
  `Founding-Fathers-EMA`, and `EMA 0.0.5`;
- the topbar shows org, space, project, and node state;
- Blueprint renders a project section tree from a projection;
- git-ema can create a demo attachment and link it to a Blueprint section;
- See Agent Work renders swarm/vCalendar state with mocked controls and CLI
  equivalents;
- the event log records the link and mirror events;
- projections rebuild correctly from the canonical log;
- no surface writes canonical data directly;
- unfinished areas are honest stubs, not fake working systems.

## Design Rule

The first workspace should feel calm, legible, and inhabited.

It should not try to dazzle its way around missing authority. The magic of EMA
comes from humans and agents sharing durable context, not from pretending every
future automation exists on day one.
