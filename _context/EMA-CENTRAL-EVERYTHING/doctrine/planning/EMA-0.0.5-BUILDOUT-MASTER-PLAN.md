# EMA 0.0.5 Buildout Master Plan

Status: active build plan
Date: 2026-04-24
Primary implementation root: `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24`

This is the unified plan for beginning the 0.0.5 build. It combines the
current blueprint, the atlas lineage, the language lock, the vanilla workspace
target, the git-ema work, and the shared agent swarm doctrine into one
reference document.

## 1. North Star

EMA is the Executive Management Assistant: a shared human-agent executive
workspace where project management, executive management, source material,
coordination, context, and execution all live in one legible environment.

The first 0.0.5 build should be ambitious in shape and honest in function.
It should show the whole product skeleton without pretending every automation
already works.

The first milestone is not a finished autonomous business machine. The first
milestone is a beautiful, durable, scoped workspace that can hold that machine.

## 2. Locked Decisions

- First organization: `Founding-Fathers-EMA`.
- Every organization defaults to one space with the same name as the
  organization.
- Default spaces are renamable.
- Organizations can contain as many spaces as policy allows.
- Topology is `Organization -> Space -> Project`.
- Actors are first-class from day one.
- Humans, agents, personal AI, devices, and system services all resolve through
  actor identity where they act in the workspace.
- Approval gates exist from day one, even if some are mocked.
- `git-ema` owns artifacts, attachments, connectors, source refs, codebase
  records, and linked evidence.
- The shared workspace is broader than git-ema. It includes lanes, handoffs,
  inbox, missions, campaigns, vCalendar, swarm state, notes, plans, specs,
  proposal queues, and agent work views.
- Soul should be inspired by Hermes, OpenClaw, tool-calling, harness layers,
  role files, and agent operating envelopes.
- Agents matter, but the immediate build should focus on the workspace and
  swarm environment where agents will operate.
- `See Agent Work` is the first dedicated swarm-work app.

## 3. First Project Instance

Seed the first project instance like this:

```text
Organization: Founding-Fathers-EMA
Default Space: Founding-Fathers-EMA
Project: EMA 0.0.5
```

Later projects can include client/business workspaces such as a wholesaling
real estate venture, but the first project should be EMA building itself.

The first project should attach:

- central doctrine;
- runtime repo;
- atlas snapshot;
- selected donor/snapshot material;
- git-ema source records;
- current blueprint documents;
- swarm and planning docs.

The first workspace should render these as attached sources and project
knowledge, not automatically promote them to canon.

## 4. Product Pillars

### 4.1 Daemon Canon

The daemon owns canonical truth:

- orgs;
- spaces;
- projects;
- actors;
- memberships;
- devices;
- invites;
- Blueprint structure;
- git-ema records;
- lanes;
- handoffs;
- proposals;
- dispatches;
- executions;
- events;
- projections.

Surfaces never write canon directly.

### 4.2 Blueprint

Blueprint is the project-thinking and design-doc surface.

It should hold:

- master EMA design doc sections;
- question-based construction;
- project thesis;
- ontology;
- workflows;
- proposal extraction points;
- links to git-ema artifacts;
- comments and discussion later.

Wave 1 needs structure and attachment integration more than rich prose
collaboration.

### 4.3 git-ema

git-ema owns the canonical identity of source material:

- artifacts;
- attachments;
- connectors;
- source refs;
- codebases;
- linked evidence;
- imported docs;
- local blobs later.

It should feel like Google Drive, GitHub, local files, and project artifacts
became native to EMA without becoming a hidden second truth system.

### 4.4 Shared Workspace

The shared workspace is the durable operating layer for humans and agents.

It contains:

- inbox;
- lanes;
- handoffs;
- missions;
- campaigns;
- proposal queue;
- plans;
- specs;
- vCalendar;
- checkups;
- agent notes;
- swarm state;
- work logs;
- source bundles.

git-ema is one major vApp inside this world, but it does not own the whole
shared workspace.

### 4.5 See Agent Work

`See Agent Work` is the dedicated swarm environment app.

It should show:

- active agents;
- missions;
- campaigns;
- lanes;
- handoffs;
- queues;
- checkups;
- weekly phases;
- virtual calendar;
- swarms;
- stalled work;
- review needs;
- mocked start/stop controls;
- CLI command equivalents;
- agent-facing docs.

The first version does not need to execute anything. It should be beautiful,
legible, and useful as a control room for work that still happens through
Codex, Claude CLI, or other external agent runners.

## 5. Core App Set

### Shell

The shell owns navigation, not truth.

Required surfaces:

- topbar with org, space, project, node state, account/device;
- left rail with Blueprint, git-ema, See Agent Work, HQ, settings, activity;
- main area with structured page shell;
- optional virtual desktop center later.

### Blueprint

Project design, intent, structured docs, and proposal seeds.

### git-ema

Artifacts, attachments, connectors, source refs, codebase links, and evidence.

### See Agent Work

Swarm/vCalendar/mission/campaign/lane control surface with mocked controls.

### HQ

Operational summary across the current project and eventually personal scope.

### Wiki

Semantic knowledge surface. Doctrine should eventually render here.

### Chat

Focused dialogue and dispatch view. Chat is not the canonical execution
object.

### Threads / Server

Shared continuity and channelized discussion. Later bridge target.

## 6. Object Model to Support

Wave 1 should name these even if not fully implemented:

- `organization`
- `space`
- `project`
- `user`
- `actor`
- `agent`
- `personal_ai`
- `device`
- `membership`
- `invite`
- `blueprint_document`
- `blueprint_section`
- `attachment`
- `artifact`
- `source_ref`
- `codebase`
- `connector`
- `lane`
- `handoff`
- `mission`
- `campaign`
- `swarm`
- `vcalendar`
- `calendar_block`
- `weekly_phase`
- `checkup`
- `queue_item`
- `proposal`
- `plan`
- `spec`
- `dispatch`
- `execution`
- `tool_event`
- `incident`
- `approval`
- `soul_profile`

Not all of these need event families in wave 1. The plan/spec/mission/campaign
families can stay doctrine-level until the first proposal path proves itself.

## 7. Swarm and vCalendar Model

The swarm environment should make agent work visible before it makes agent work
automatic.

### Swarm

A `swarm` is a named group of actors working toward a project or campaign.

First fields:

- `swarm_id`;
- `project_id`;
- `space_id`;
- `name`;
- `purpose`;
- `actors`;
- `active_missions`;
- `status`.

### Mission

A `mission` is a goal-oriented work package. It can contain lanes, proposals,
artifacts, checkups, and execution references.

### Campaign

A `campaign` is a longer initiative made of missions.

### Lane

A `lane` is the first concrete coordination unit. It should remain the most
implementation-ready object.

### vCalendar

The virtual calendar is not just a date picker. It is the time model for agent
and swarm work:

- agent days;
- agent weeks;
- weekly phases;
- checkups;
- flexible focus blocks;
- review windows;
- campaign milestones;
- mission cadence;
- self-paced scheduling.

It should support real time where needed, but also self-paced progress cycles.

## 8. See Agent Work App

### Purpose

`See Agent Work` is the place a human goes to understand and steer the swarm.
It is a visibility, planning, and control app before it is an automation app.

### First Screen

The first screen should show:

- project swarm pulse;
- active missions;
- lane board;
- vCalendar strip;
- agents and roles;
- upcoming checkups;
- blocked/stalled work;
- start/stop controls with mocked state;
- CLI command equivalents.

### Controls

Controls can be mocked but should be product-real:

- start swarm;
- pause swarm;
- stop swarm;
- create mission;
- open lane;
- assign actor;
- request handoff;
- schedule checkup;
- add calendar block;
- export CLI command;
- copy agent instruction.

### CLI Equivalent

Every important UI action should have a CLI-shaped command, even if the
command is documentation-only at first:

```text
ema swarm start --project "EMA 0.0.5" --swarm "buildout"
ema swarm pause --swarm "buildout"
ema mission create --project "EMA 0.0.5" --title "Build vanilla workspace"
ema lane open --mission "Build vanilla workspace" --title "Topbar projection"
ema handoff request --from lane:<id> --to actor:<id> --needed "Review event shape"
ema vcalendar block add --actor actor:<id> --kind focus --label "Blueprint work"
ema checkup schedule --lane lane:<id> --cadence daily
ema agent prompt --actor actor:<id> --mission mission:<id>
```

The CLI docs should help external Codex/Claude sessions operate in the same
workspace language before the daemon can actually enforce everything.

The agent usage doc should define the behavioral contract for those external
sessions:

```text
runtime/EMA-0.0.5--4-24/docs/agents/see-agent-work-agent-usage.md
```

## 9. Soul Model

Soul is the operating identity of an agent. It should take inspiration from:

- Hermes session and harness discipline;
- OpenClaw role files and handoff envelopes;
- tool-calling capability manifests;
- driver/provider boundaries;
- agent memory and context packs;
- debate presets and stakeholder simulation.

First shape:

- identity;
- role;
- purpose;
- values;
- decision standards;
- communication style;
- capabilities;
- tool grants;
- forbidden actions;
- review expectations;
- debate posture;
- context sources;
- handoff protocol;
- stop conditions.

Do not build a full soul-builder UI first. Build the shape, docs, and sample
profiles so the rest of the workspace can reason about agents cleanly.

## 10. Build Waves

### Wave 0 - Doctrine and Contract Lock

Already started.

Finish:

- language lock;
- vanilla workspace architecture;
- this master plan;
- orchestrator prompts;
- event catalog review;
- vApp docs for Blueprint, git-ema, and See Agent Work.

### Wave 1 - Workspace Skeleton

Goal: the app can create and show the first EMA project instance.

Build:

- daemon skeleton;
- typed ID helpers;
- event envelope validation;
- command writer pattern;
- seed data for `Founding-Fathers-EMA`;
- default same-name space;
- `EMA 0.0.5` project;
- topbar projection;
- basic web shell.

### Wave 2 - Blueprint + git-ema

Goal: project thinking can link source material.

Build:

- Blueprint section tree projection;
- default Blueprint document;
- git-ema connector stubs;
- attachment list;
- source/codebase records;
- attach-to-object dialog;
- attach source to Blueprint section;
- event log and projection rebuild.

### Wave 3 - See Agent Work

Goal: swarm work becomes visible and steerable.

Build:

- See Agent Work page;
- mission/campaign/lane mock data;
- vCalendar mock data;
- swarm cards;
- agent role cards;
- start/stop/pause mocked controls;
- CLI equivalent panel;
- agent docs panel;
- lane/handoff/proposal thin projections where possible.

### Wave 4 - Actor and Soul Foundations

Goal: humans and agents become first-class actors in the same workspace.

Build:

- actor records;
- agent records;
- first soul profile schema;
- sample Codex and Claude actor profiles;
- role assignment surface;
- scoped visibility notes;
- handoff envelope docs.

### Wave 5 - Proposal Path

Goal: preserved intent can become reviewed action.

Build:

- proposal queue;
- Blueprint section to proposal flow;
- human approval gate;
- plan/spec docs as generated artifacts;
- proposal links to lanes, attachments, and missions;
- review states.

### Wave 6 - Runtime and Harness Stubs

Goal: execution becomes legible without pretending it is fully autonomous.

Build:

- dispatch stubs;
- execution events;
- tool event display;
- run/dispatch chronicle;
- scope grant UI;
- mocked start/stop wired to events;
- no real dangerous tool execution without explicit later approval.

### Wave 7 - Collaboration and Sync

Goal: multiplayer and peer awareness land after canon is stable.

Build:

- Yjs/Hocuspocus for Blueprint prose;
- comments and suggestions;
- device pairing;
- lease UI;
- replica current/stale/provisional states;
- sync health in topbar and settings.

## 11. First Implementation Target

The first end-to-end target is:

```text
create Founding-Fathers-EMA org
-> auto-create Founding-Fathers-EMA default space
-> create EMA 0.0.5 project
-> create default Blueprint document
-> create git-ema codebase/source record
-> attach source record to Blueprint section
-> display topbar, Blueprint, git-ema, See Agent Work, and event trail
```

This proves:

- topology;
- daemon write path;
- projections;
- source attachment;
- Blueprint integration;
- See Agent Work visibility;
- event lineage;
- app-shell coherence.

## 12. Design Standard

The workspace should feel serious, alive, and operational.

Avoid:

- generic admin dashboards;
- empty startup polish;
- pretending mocked controls are real execution;
- one-note UI;
- fake agent autonomy;
- hiding source/canon boundaries.

Prefer:

- dense but legible work surfaces;
- visible state;
- clear command equivalents;
- beautiful operating-room energy;
- honest mocks;
- real object names;
- agent-facing docs beside human controls.

## 13. Agent Operating Rule

Until EMA can run its own agents, external agents operate through this plan.

Every Codex or Claude session should:

1. read this file;
2. read the language lock;
3. read the vanilla workspace doc;
4. read the See Agent Work agent usage doc;
5. check the current runtime docs;
6. choose a bounded lane;
7. avoid touching another active worker's lane;
8. report what changed and what remains open.

## 14. Immediate Next Steps

1. Keep the `See Agent Work` vApp doc current.
2. Keep the `See Agent Work` CLI/agent usage doc current.
3. Keep the `See Agent Work` runtime architecture note current.
4. Implement seed contract for `Founding-Fathers-EMA` org and same-name default
   space.
5. Expand event contracts only where the first UI needs them.
6. Build web shell skeleton.
7. Keep `git-ema` implementation isolated from shared workspace ownership.
8. Start real coding only after a worker has claimed a bounded lane.
