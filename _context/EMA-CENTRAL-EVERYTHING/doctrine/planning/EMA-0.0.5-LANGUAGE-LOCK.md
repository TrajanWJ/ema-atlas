# EMA 0.0.5 Language Lock

Status: active doctrine guardrail
Date: 2026-04-24
Scope: EMA 0.0.5 planning, runtime docs, Blueprint, and git-ema

This document locks the shared language for the first real EMA workspace.
It keeps the ambition of the current blueprint while preventing old atlas
terms, new implementation terms, and live bootstrap work from drifting into
three competing products.

## 1. Name and Meaning

EMA means **Executive Management Assistant**.

`EM` means executive management. `PM` means project management. EMA contains
both. It is not only a planner and not only an agent runner; it is a shared
human-agent executive workspace where management, planning, context,
execution, and review all speak the same language.

The first users are the founding operators building EMA itself. The first
business validation path is a client-shaped workspace, beginning with Adil's
real estate wholesaling work as a practical proving ground.

## 2. Product Identity

EMA is a shared human-agent workspace with an agent control plane inside it.

That order matters. The workspace is the human and agent environment. The
control plane is what makes work durable, attributable, permissioned, and
executable.

EMA should feel like:

- a place where humans and agents can inhabit the same project state;
- a project and executive management substrate;
- a launch surface for agent teams, campaigns, missions, and proposals;
- a durable memory and canon system;
- a multi-surface product with one underlying ontology.

EMA should not collapse into:

- a chat app;
- a generic agent framework;
- a docs site;
- a file browser;
- a pretty UI that secretly owns truth;
- an execution runtime without durable canon.

## 3. Canonical Rule

The canonical rule remains:

> EMA owns truth. Hermes/runtime owns execution. Surfaces render and request.

Current 0.0.5 implementation language:

- the daemon owns canonical truth;
- the runtime/Hermes path owns live execution;
- surfaces and vApps send commands, receive projections, and never become
  hidden authorities.

This rule applies equally to Blueprint, git-ema, HQ, Launchpad, Wiki, Chat,
and any future agent workspace surface.

## 4. Locked Topology

The active topology is:

```text
Organization -> Space -> Project
```

Definitions:

- `Organization` is the outer trust, membership, device, invite, and policy
  boundary.
- `Space` is the shared working environment inside an organization.
- `Project` is the scoped effort inside a space. It owns Blueprint documents,
  lanes, proposals, attachments, and runs.

Older material that says `Organization -> Project -> Space` is lineage, not
the 0.0.5 winner. Reuse its object ideas carefully, but translate containment
into the locked topology.

Every organization defaults to one space with the same name as the
organization. That default space is renamable, and organizations can contain
as many spaces as policy allows.

The first seeded organization is `Founding-Fathers-EMA`, with a default
`Founding-Fathers-EMA` space and an `EMA 0.0.5` project.

## 5. Intent and Canon

`Intent` is preserved human or agent input before it becomes accepted product
truth.

Intent can come from:

- chat;
- wiki edits;
- Blueprint sections;
- uploaded notes;
- agent suggestions;
- debate outputs;
- imported prompts;
- business context;
- client context.

`Canon` is accepted truth inside EMA. Canon is durable, attributable,
auditable, and owned by the daemon.

The long-term workflow is:

```text
intent -> proposal -> plan -> spec -> execution -> canon
```

For the vanilla workspace, do not overbuild this whole machine yet. The first
workspace only needs to preserve intent, expose Blueprint structure, attach
source material, and support proposal-shaped promotion points. Full plan/spec
provisioning can come after the workspace is real.

Important spelling: use `canon`, not `cannon`.

## 6. The Three First Cores

The first EMA workspace has three centers.

### 6.1 Daemon Canon

The daemon is the canonical writer. It owns orgs, spaces, projects, actors,
memberships, invites, proposals, lanes, handoffs, Blueprint structure,
attachments, dispatch records, executions, and audit events.

This is the center that keeps the product from becoming a pile of surfaces.

### 6.2 Blueprint

Blueprint is the first deep project-thinking vApp.

It holds the structured design and intent layer for a project:

- master design documents;
- question-based construction;
- section trees;
- comments;
- proposal extraction points;
- references to attached source material.

Blueprint is not "one giant doc owns the project." Blueprint is a structured
project-thinking surface over daemon-owned truth and collaboration text.

### 6.3 git-ema / Shared Workspace

`git-ema` is the first artifact, source, attachment, and codebase-facing vApp.

Its initial runtime meaning is artifacts, attachments, connectors, source refs,
codebase records, local files, Google Drive, GitHub, git URLs, and linked
evidence.

Its broader product pressure is the shared workspace: codebases, plans,
handoffs, inbox items, source packs, datasets, and work artifacts that humans
and agents both need. This pressure should be kept, but git-ema should not
silently absorb all workspace truth. It should become the shared gateway for
source material and attachments while the daemon owns the canonical records.

## 7. Doctrine, Wiki, Blueprint, and Docs

`doctrine/` is the current filesystem home for human-authored EMA doctrine.

In the product, doctrine should eventually be rendered through Wiki and
Blueprint. Until then:

- doctrine files are source material;
- Blueprint is the structured project view over selected doctrine;
- Wiki is the semantic knowledge view over selected doctrine;
- canon is the daemon-owned accepted truth;
- imported material is evidence until promoted or linked.

This gives the best of both worlds: readable files now, product-native
knowledge later.

## 8. Agents and Souls

An `agent` is an actor that can reason, propose, collaborate, and execute
through scoped runtime grants.

A `soul` is the structured operating identity of an agent. It is not merely a
system prompt. It can include:

- values;
- role;
- decision standards;
- communication style;
- methods;
- constraints;
- beliefs or teachings supplied by a user;
- examples of good and bad judgment;
- history of accepted decisions;
- preferred debate posture;
- boundaries on what the agent may do.

Souls are powerful because they let humans create specialized perspectives and
agent teams. They are risky because they can smuggle bias, overconfidence, or
bad incentives into execution. EMA should make souls easy to create, easy to
inspect, and hard to confuse with canon.

## 9. Lanes, Alleys, Missions, and Campaigns

`Lane` is the first implementation-grade coordination unit. It is a scoped
line of work with an owner, status, items, and handoffs.

`Handoff` is an explicit transfer contract between actors, lanes, or scopes.

`Alley`, `mission`, `campaign`, and `bolero` are promising higher-order
planning words, but they are not locked runtime objects yet. Treat them as
product vocabulary until they are mapped cleanly onto daemon-owned objects.

Suggested future mapping:

- mission: a goal-oriented bundle of lanes and proposals;
- campaign: a longer business or operational initiative;
- alley: a grouped set of related lanes under an orchestrator;
- bolero: unresolved, keep as raw intent until defined.

## 10. Debate and Stress Testing

Debate is not a gimmick. It is one of EMA's major reasoning surfaces.

The product should support agent presets that simulate stakeholders, opposing
views, investor pressure, operator pressure, compliance concerns, customer
concerns, and adversarial review.

Debate output should produce:

- preserved intent;
- reasoning reports;
- open questions;
- proposed next actions;
- candidate proposals;
- confidence and dissent summaries.

Debate should not directly mutate canon. It should feed the proposal path.

## 11. Temporal System

EMA should preserve the agent virtual environment idea:

- agent days;
- agent weeks;
- weekly phases;
- queues;
- checkups;
- self-paced schedules;
- meetings;
- review windows;
- cadence policies.

For 0.0.5, this belongs in the coordination/workspace language first. Do not
force the whole temporal system into wave 1. Keep the object vocabulary alive
so it can be added cleanly after the vanilla workspace exists.

The first dedicated app for this is `See Agent Work`: a swarm, mission,
campaign, lane, handoff, and vCalendar control surface with mocked start/stop
controls and CLI equivalents.

## 12. Vanilla Workspace

The first goal is not a fully provisioned autonomous workflow engine.

The first goal is a successful vanilla workspace:

- current organization, space, and project are visible;
- Blueprint can render project structure;
- git-ema can attach source material to project objects;
- daemon events can describe the work;
- surfaces remain projections;
- agents and humans can share references without losing lineage;
- the workspace is ready for proposal, plan, spec, execution, and canon flows
  to be implemented later.

This is the first stable room. The automation comes after the room exists.

## 13. Language to Prefer

Prefer:

- shared human-agent workspace;
- executive workspace;
- durable canon;
- preserved intent;
- daemon-owned truth;
- command and projection;
- scoped execution;
- agent soul;
- proposal path;
- source attachment;
- vanilla workspace.

Avoid:

- chat as the system;
- UI as the source of truth;
- workflow engine as the first milestone;
- "fully autonomous" before permissions and canon are legible;
- importing old topology language without translation;
- treating raw uploaded material as canon.

## 14. Current Implementation Alignment

The current runtime docs already align with this language in these places:

- `docs/architecture/01-topology.md` locks `Organization -> Space -> Project`.
- `docs/architecture/02-daemon-supervision.md` makes the daemon the writer.
- `docs/architecture/03-event-catalog-v0.md` names the event contract.
- `docs/architecture/06-blueprint-boundaries.md` splits Blueprint structure
  from collaborative prose.
- `docs/architecture/07-git-ema.md` makes attachments and external sources
  product-native.
- `packages/contracts/events/catalog.v0.md` names the first event families.

The doctrine work should now reinforce that runtime direction instead of
reopening the topology.
