# EMA — Executive Management Assistant

**Master Design Document**
Version: 0.0.5
Status: canonical doctrine
Date: 2026-04-24
Founding operators: Adil, Trajan
Implementation root: `/Users/tawj/Desktop/EMA-CENTRAL-EVERYTHING/runtime/EMA-0.0.5--4-24/`
Primary doctrine companions:
- `doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md`
- `doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md`
- `data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md`
- `doctrine/research/EMA-0.0.5-FULL-DONOR-INVENTORY.md`
- `doctrine/research/ema-003-lineage-architecture-synthesis.md`
- `doctrine/research/ema-003-shared-agent-swarm-workspace.md`

---

## 1. Executive Summary

EMA is the **Executive Management Assistant**: a shared human-agent executive
workspace where project management, executive management, source material,
coordination, context, and durable execution all live inside one legible
environment.

`EM` means executive management. `PM` means project management. EMA contains
both. It is not a chat app. It is not a generic agent framework. It is not a
planner. It is not a prompt library. It is the room humans and agents walk
into together — with memory, authority, structure, and the capacity to act.

The 0.0.5 thesis is simple and non-negotiable: **agents need environments,
not just prompts.** The most capable model in the world, operating through a
chat box against a blank scratchpad, will underperform a modest model
operating inside a shared workspace that preserves intent, carries context,
routes proposals through review, attributes every action, and keeps a
permanent record of what actually happened. Collaboration was humanity's
upgrade. It is about to be the agents' upgrade. EMA is where that upgrade
lives.

### What EMA is, stated plainly

A shared human-agent environment with **durable truth**, **explicit
execution**, **coherent workspace objects**, **first-class collaboration**,
**scoped identity**, and **multiple surfaces that all speak the same
underlying language**. One ontology. Many rooms. Every agent and human in
the system reasons and acts against the same canonical record.

### Why this matters now

LLMs have solved one-shot reasoning. They have not solved *continuous
operational legibility*. The current agentic stack is transient: chats
without memory, tools without lineage, automation without record-keeping,
proposals without review paths, execution without audit. A human who tries
to run a business through this stack finds themselves doing the executive
management by hand anyway — chasing threads across services, re-explaining
context, re-approving decisions, reconstructing what an agent "did"
yesterday from timestamps and screenshots.

EMA collapses that overhead. When a human inside EMA says "scrape these
leads, score them, draft outreach for the top twenty, and hand me the
queue," the intent is captured, the proposal is structured, the plan is
reviewed, the specification is locked, the execution is dispatched, and the
result is filed back as canon. The human did one act of executive judgment.
Everything between "intent" and "canon" was done by the workspace.

### First proving ground

EMA's first demo client is Adil's wholesaling real estate business. EMA
becomes the control panel for employees, business operations, outreach,
leadflow, scraping, and executive assistance — a single place from which
the company is run and from which agents do most of the repetitive
cognitive labor. The second proving ground is the founding team itself:
EMA will build EMA using EMA.

### What "winning" looks like for 0.0.5

- A workspace that boots into a real organization, space, and project.
- A daemon that owns canonical truth. Surfaces render projections and
  never become hidden authorities.
- Agents that operate against the same shared environment as humans, with
  the same object vocabulary, lineage, and review rules.
- A first app — `See Agent Work` — dense enough to feel like a mission
  control room, honest enough to label every mocked control.
- A design-system posture that is calm, bioluminescent, glass-layered,
  and unmistakably not a SaaS admin panel.

### Without EMA

Without EMA, you have no consistent logic and system and framework for the
AI to operate within. You have bright agents and dim environments. You
have momentum but no memory. You have action but no canon. EMA is the
force multiplier. Without it, we are unprepared for the leap agents are
about to take.

---

## 2. Core Thesis

> IDEs need to get bigger. — Andrej Karpathy

Karpathy's observation — that the integrated development environment is
becoming the container for an entirely new class of work, and that it must
expand in scope to match — generalizes beyond coding. The next generation
of knowledge work will be performed inside environments. The environment
will be the product. The model is the engine; the environment is the car,
the road, the traffic system, the license, and the fuel station.

**EMA's core thesis, in one sentence:**

> Agents perform at the level of the environment they inhabit; a
> shared human-agent workspace with durable truth, explicit execution,
> coherent collaboration objects, and scoped identity is the environment
> that makes real agentic work possible, auditable, and compounding over
> time.

The thesis breaks into five commitments:

1. **Durable truth before clever automation.** An agent that forgets what
   it did yesterday is not an employee — it is a very fast intern. EMA's
   daemon owns a canonical, append-only record of every event. Truth is
   not what the UI displays; truth is what the daemon has written.
2. **Explicit execution, not ambient action.** Every real action passes
   through a visible path: intent → proposal → plan → spec → execution →
   canon. No silent side effects. No untraceable tool calls.
3. **Coherent workspace objects.** Lanes, handoffs, missions, campaigns,
   proposals, plans, specs, souls, checkups, calendar blocks — all of
   them are first-class objects with IDs, lineage, and shared vocabulary.
   A thread about a lane refers to the same lane the HQ card shows.
4. **First-class collaboration.** Multiple humans plus multiple agents is
   the force multiplier, not one human plus one agent. The workspace is
   designed for teams, not for solo pilots.
5. **Scoped identity.** Humans, agents, personal AIs, devices, and
   services all resolve through the same actor primitive, with explicit
   scopes and explicit grants. No global root. No ambient authority.

**Environments beat prompts.** That is the entire bet.

---

## 3. Problem EMA Solves

The current agentic-human stack is **transient, dispersed, and
contextless**. A knowledge worker operating with modern AI tools has:

- brilliant one-shot reasoning in a chat box,
- no durable memory across sessions,
- no explicit proposal path for agent-suggested actions,
- no audit trail for anything the agent did,
- no shared object vocabulary with the agent,
- no way for two or more agents to collaborate inside the same
  project state,
- no way to bring a new agent into an ongoing effort without
  re-explaining six months of context by hand.

### Notion, Miro, Linear, and friends

These products are **planners**. They help humans organize. They do not
give agents a place to work. An agent that writes into Notion is
writing into an opaque external tool; the next agent will not know what
the first agent decided or why. The notion pages are not projections of a
canonical event log. The links between a Miro card and a Linear ticket
and a Slack thread are whatever a human typed in the description field.
The tools are for humans. The agents are tourists.

### Chat-first agent frameworks

These products are **conversation layers**. They let an agent answer
questions and, with effort, call tools. They do not give the agent a
sense of place, a sense of responsibility, a team to coordinate with, a
review path for its proposals, a durable identity across sessions, or a
workspace of shared objects. Chat is excellent as a focused dialogue
surface. Chat is a disaster as the system.

### Automation platforms (Zapier, n8n, Make)

These products are **pipeline runners**. They dispatch actions in
response to triggers. They do not have a concept of project, proposal,
review, handoff, or canon. They do not know that two tasks belong to the
same mission. They do not know who approved what. They do not care.

### What a human running a business actually experiences today

- Re-explaining context to every new agent session.
- Agents forgetting decisions made yesterday.
- Silent tool calls that produce mystery outcomes.
- No way to pause an agent swarm mid-flight and resume.
- Proposals evaporating into chat scrollback.
- Executive management done by the human, again, in every session,
  because the environment has no memory of the last one.

### EMA's counter-proposal

EMA is a **shared human-agent workspace** — a real environment, not a
chat layer and not a planner. It has:

- **Canon**: a daemon-owned, event-sourced, auditable record of every
  decision, action, and outcome.
- **Intent**: everything a human or agent says, types, or proposes is
  preserved as structured intent *before* it becomes truth.
- **Objects**: organizations, spaces, projects, actors, lanes, handoffs,
  missions, campaigns, proposals, plans, specs, executions, calendar
  blocks, checkups, souls — all first-class, all with IDs, all with
  lineage.
- **Surfaces**: a virtual desktop, a launchpad, an HQ dashboard, a
  blueprint builder, a chat surface, a threads/server surface, an agent
  virtual environment — *all of them render the same underlying canon*.
- **Review paths**: agents propose, humans (and other agents) approve;
  nothing risky executes without the right signatures.
- **Teams**: multiple humans plus multiple agents operating inside the
  same shared objects, aware of each other's work, handing off
  explicitly.

EMA is the environment that makes agents **useful** instead of
**impressive**.

---

## 4. Design Principles

The principles below are non-negotiable. They are the fence against the
most common failure modes in agentic systems, and they are the reason
EMA exists at all.

### 4.1 Gleam / BEAM / Elixir substrate first

The runtime is built on the BEAM virtual machine, initially in Gleam.
The BEAM's lineage — actor concurrency, OTP supervision, let-it-crash
fault tolerance, hot code loading, distributed-by-default — is the
closest existing substrate to the model EMA needs: many independent
agents plus many independent humans plus many independent services, all
running, all failing independently, all observable, all recoverable.

Elixir/Phoenix was the original EMA substrate (`lineage-original-elixir-
ema`). The current rewrite is in Gleam on BEAM; the doctrine carries
forward verbatim. No Node-per-process architectures. No monolithic
process trees. Supervision is first-class. Sessions are ephemeral.
Control plane is durable. Surfaces are clients.

### 4.2 Intent vs Canon — the separation that makes the rest work

**Intent** is preserved human or agent input before it becomes accepted
product truth. Intent comes from chat, wiki edits, blueprint sections,
uploaded notes, agent suggestions, debate outputs, imported prompts,
business context, and client context.

**Canon** is accepted truth inside EMA. Canon is durable, attributable,
auditable, and owned by the daemon. Canon is what future agents reason
against. Canon is what the audit log shows.

The workflow that connects them is:

```text
intent -> proposal -> plan -> spec -> execution -> canon
```

Every pixel of EMA is designed to honor this separation. A UI element
that writes directly to SQLite bypassing the daemon is a violation. A
thread message that is treated as canon is a violation. A soul file that
claims it is an agreement is a violation. **Canon is narrow and
guarded. Intent is broad and preserved.**

### 4.3 Agents need environments, not just prompts

This is the most important sentence in this document. Write it on the
wall.

A prompt is ephemeral. A prompt cannot tell another agent what was
decided last Tuesday. A prompt cannot survive a session reset. A prompt
cannot collaborate. A prompt cannot be audited. A prompt cannot handle a
team of ten agents working on a campaign for six months.

An **environment** has:
- persistent objects with shared IDs,
- a canonical record of what happened,
- a vocabulary both humans and agents speak,
- explicit scopes of authority,
- explicit proposal and review paths,
- explicit handoffs and checkups,
- legible peripheral visibility (what are my peers doing? where does my
  lane fit?),
- a time model (agent days, agent weeks, self-paced cadence),
- a soul system (who am I? what are my values? how do I decide?),
- a way to bring new participants in without starting over.

EMA is environment-first. Prompts are a local detail.

### 4.4 Daemon owns truth. Surfaces render projections.

The canonical rule:

> EMA owns truth. Hermes/runtime owns execution. Surfaces render and
> request.

In 0.0.5 implementation language:
- the daemon owns canonical truth,
- the Hermes/runtime path owns live execution,
- surfaces and vApps send commands, receive projections, and never
  become hidden authorities.

This rule applies to every surface without exception. Blueprint,
git-ema, HQ, Launchpad, Wiki, Chat, Agent vEnv, and any future surface
that ships — they all read from the daemon, write through the daemon,
and hold no durable state of their own (with the narrow exception of
disposable client-side layout).

A surface that secretly owns state is a surface that will eventually
lie. We do not ship those.

### 4.5 Honest mocks, always

Every UI element that looks like it mutates canon but does not carries a
visible tag: `mocked`, `draft`, `local only`, or `pending daemon
writer`. Every mocked control has a CLI equivalent documented so that
external agent sessions can operate on the same workspace language
before the daemon enforces it end-to-end.

This is how we avoid the slop trap: a UI that performs authority it
does not have. An invented "active agents: 7" number on a dashboard is
a lie. A Start Swarm button that plays an animation but writes no event
is a lie. EMA does not lie, even when it is mocked. Especially when it
is mocked.

### 4.6 Peripheral view, not just focal view

Agents at the forefront of their mind should always be aware of their
peers. Like a knowledge worker at a standing desk in an open office —
not staring at their peers, but peripherally aware of the room. An
agent working on lane L should know at a glance: which other lanes are
active, who owns them, what mission they belong to, what campaign the
mission belongs to, what weekly phase the campaign is in. That
situational context is what lets an agent decide when to raise a
handoff versus when to push through.

The "Ready Player One" framing is literal here. The environment is
rendered around the agent. The work they are focused on is at the
center. The rest of the world is visible at the edge. Agents that
operate without peripheral view produce brilliant, context-blind,
coordination-destroying output. Agents that operate inside EMA's
peripheral view are part of a team.

### 4.7 Preserve user voice and intent through the whole pipeline

When a user says "I want to wholesale real estate and I want agents to
handle outreach," that sentence is the root of a long, structured work
chain. The user's *voice* — their phrasing, their emphasis, their
implicit standards — should be visible at every step of the chain:
preserved as intent, carried into the proposal, echoed in the plan,
cited in the spec, referenced during the execution, and attached to the
canon record. Agents should be able to trace any current decision back
to the human sentence that spawned it.

This is not romance. It is a guard against the subtle drift where a
user says "make this feel like a family business" and three steps later
an agent produces corporate-SaaS copy because the original voice was
paraphrased to death.

### 4.8 No generic SaaS posture

EMA is not an admin panel. It is a workspace for serious work. The
design posture is calm-technology: time-of-day color breathing, glass
tiers, bioluminescent teal/slate-blue/amber accents (not neon), spring
easing, five-minute-idle screensavers, Apple system fonts, cursor
following, ambient motion. The product should feel *inhabited*. See
`doctrine/design/place-org-ux-manifesto.md` when it lands; until then
the posture is enforced by donor-rip markers in
`apps/web/src/app/styles.css` and the `ema-design-system` skill.

### 4.9 Collaboration is the force multiplier

One human plus one AI is a party trick. Many humans plus many AIs
inside a shared workspace, with durable canon, explicit missions, real
handoffs, and a calendar — that is a company, a research lab, a
creative studio, an investment team. That is the product. The other
thing is a demo.

---

## 5. EMA Ontology

This is the full glossary of EMA's first-class objects. Every term in
this list has a stable ID prefix, a canonical write path, and a place
in the event catalog. Terms marked *(product vocabulary)* are named now
but not yet locked as runtime objects; they earn lockdown when the
first proposal path proves itself end-to-end.

### 5.1 Identity and membership

- **Organization** — the outer trust, membership, device, invite, and
  policy boundary. The first seeded organization is
  `Founding-Fathers-EMA`. Created via shared p2p spaces with at least
  one "always-on" host peer. ID prefix `org:`.
- **Space** — the shared working environment inside an organization.
  Every organization defaults to one space with the same name as the
  organization; default spaces are renamable. An organization can
  contain as many spaces as policy allows. ID prefix `space:`.
- **Project** — the scoped effort inside a space. Owns Blueprint
  documents, lanes, proposals, attachments, runs, and project-scoped
  collaboration state. The first seeded project is `EMA 0.0.5`. ID
  prefix `project:`.
- **Actor** — the shared principal abstraction over humans, agents,
  personal AIs, devices, and service identities. Every action in the
  system resolves to an actor. ID prefix `actor:`.
- **User** — the human-identity shape of actor. A user has credentials,
  preferences, and personal state. ID prefix `user:`.
- **Agent** — an actor that can reason, propose, collaborate, and
  execute through scoped runtime grants. Agents run on the BEAM actor
  model alongside humans. ID prefix `agent:`.
- **Personal AI** — an actor bound to a single human principal,
  readable across projects that principal belongs to. Writes require
  explicit project/space/lane target. Not a global memory bucket;
  access is query federation. ID prefix `pai:`.
- **Device** — a physical or virtual machine that participates in the
  workspace. Devices hold keys and replication state. ID prefix
  `device:`.
- **Membership** — binds an actor to an org/space/project scope with a
  role and policy. ID prefix `mem:`.
- **Invite** — pending membership issued to a not-yet-joined actor. ID
  prefix `inv:`.

### 5.2 Knowledge and collaboration

- **Blueprint Document** — a structured project-thinking artifact. A
  project's master design doc, question-based construction,
  architecture sketches, and proposal extraction points live here.
  Blueprint is not "one giant doc that owns the project." It is a
  structured surface over daemon-owned truth and collaboration text.
  ID prefix `bpd:`.
- **Blueprint Section** — a node inside a Blueprint Document. Comments,
  suggestions, and proposal extraction points attach to sections. ID
  prefix `bps:`.
- **Wiki Node** — a first-class semantic knowledge object with inline
  comments, inline prompting, edit history, references, graph edges,
  and agent provenance. Wiki is the semantic knowledge view over
  selected doctrine and imported material. ID prefix `wiki:`.
- **Dataset** — a project-owned data collection. May be project-wide or
  attached to spaces; referenced by wiki, chat, agents, and blueprint.
  ID prefix `dataset:`.
- **Attachment** — an artifact attached to a Blueprint section,
  project, wiki node, or mission. ID prefix `att:`.
- **Artifact** — any durable binary or file object (code, document,
  image, recording). ID prefix `art:`.
- **Source Ref** — a reference to an external source (github URL,
  google drive file, local path). ID prefix `src:`.
- **Connector** — a configured integration (github, google drive, slack,
  notion). ID prefix `conn:`.
- **Codebase** — a project-linked code repository record. ID prefix
  `code:`.
- **Comment** — a comment on any first-class object. ID prefix `cmt:`.
- **Note** — a lightweight, actor-local or project-scoped note. ID
  prefix `note:`.

### 5.3 Communication

- **Thread** — a shared communication object; replaces Discord-style
  categories/channels/threads as the canonical communication substrate.
  Ordered event log. ID prefix `thr:`.
- **Message** — a single entry in a thread. ID prefix `msg:`.
- **Chat** — a focused dialogue view over a workstream or thread. Chat
  is not a separate durable object; it is a specialized view. Chat is
  never the canonical execution record.
- **Workstream** — the continuity object that binds thread history,
  lanes, runs, artifacts, and UI focus into one coherent strand. ID
  prefix `ws:`.

### 5.4 Coordination — the swarm/calendar layer

- **Lane** — the unit of bounded swarm work. A lane has an owner,
  status, items, handoffs, and a place in a mission. Lanes are the
  first implementation-grade coordination unit. ID prefix `lane:`.
- **Lane Claim** — an explicit claim of ownership on a lane; prevents
  invisible collisions between agents. ID prefix `claim:`.
- **Alley** *(product vocabulary)* — a grouped set of related lanes
  under one orchestrator. Lockdown pending.
- **Bolero** *(product vocabulary)* — multiple alleys operating in
  concert. Lockdown pending.
- **Mission** — a goal-oriented bundle of lanes and proposals; contains
  artifacts, checkups, and execution references. ID prefix `miss:`.
- **Campaign** — a longer business or operational initiative made of
  missions. ID prefix `camp:`.
- **Swarm** — a named group of actors working toward a project or
  campaign. ID prefix `swarm:`.
- **Handoff** — an explicit transfer contract between actors, lanes, or
  scopes. Cross-lane and cross-plane coordination becomes explicit
  objects, not chat paragraphs. ID prefix `ho:`.
- **Queue Item** — a lighter-weight backlog candidate: incoming asks,
  reminders, candidate actions. Promotable into a lane. ID prefix
  `qi:`.
- **Responsibility** — a durable commitment that survives across many
  lanes (e.g., "review outreach quality weekly"). ID prefix `resp:`.

### 5.5 Intent → canon pipeline

- **Intent** — preserved human or agent input before it becomes canon.
  Captured from every user entrypoint. Stored in its own knowledge
  plane inside the wiki. No ID prefix — intent is a property of an
  event body, not a first-class ID holder.
- **Proposal** — a structured candidate for promotion: "here is
  something I suggest we do." Has a scope, an author, a rationale, a
  review state, and promotion links. ID prefix `prop:`.
- **Plan** — an accepted proposal decomposed into steps, resources,
  and dependencies. ID prefix `plan:`.
- **Spec** — a locked specification of exactly what will be executed:
  inputs, outputs, invariants, acceptance criteria. ID prefix `spec:`.
- **Dispatch** — the act of sending a spec into the runtime/harness for
  execution. ID prefix `dsp:`.
- **Execution** — the canonical record of a launched run under EMA
  authority. Begins when the dispatch is accepted; ends with an
  outcome. ID prefix `exec:`.
- **Tool Event** — a single observable event within an execution
  (function call, response, error). ID prefix `tool:`.
- **Outcome** — the final state of an execution: success, failure,
  canceled, timed out, promoted, rejected. ID prefix `out:`.
- **Canon** — the accepted truth record that results from a successful
  execution. Canon is what future agents and humans reason against.

### 5.6 Soul and capability

- **Soul Profile** — the structured operating identity of an agent (or
  a configured human persona). Not a system prompt. Includes values,
  decision standards, communication style, capabilities, tool grants,
  forbidden actions, debate posture, context sources, handoff
  protocol, stop conditions. ID prefix `soul:`.
- **Capability** — a named grant (read project, write blueprint,
  dispatch execution, send email). ID prefix `cap:`.
- **Tool Grant** — an explicit allowance for an actor to use a tool
  within a scope. ID prefix `grant:`.

### 5.7 Temporal

- **vCalendar** — the virtual calendar system. Not a date picker: the
  time model for agent and swarm work. Contains calendar blocks,
  weekly phases, cadence policies, checkups.
- **Calendar Block** — a scheduled interval assigned to an actor,
  lane, or task. Supports real wall-clock scheduling and flexible
  self-paced reservation. ID prefix `cb:`.
- **Weekly Phase** — a named chunk of a week with a focus theme and a
  phase goal (e.g., "Monday research, Tuesday build, Wednesday
  review"). ID prefix `wp:`.
- **Cadence Policy** — a pattern defining how often a class of work
  should be checked up on. ID prefix `cad:`.
- **Checkup** — a scheduled review point on a lane, task, or
  responsibility. Bridges planner state and execution state. ID
  prefix `chk:`.

### 5.8 Runtime

- **Session Binding** — maps execution / workstream / surface /
  provider / Hermes sessions together without conflating them. ID
  prefix `sb:`.
- **Harness** — the adapter boundary between EMA and runtime drivers.
  EMA uses Hermes as its first-class harness.
- **Driver** — a concrete runtime implementation (Claude, Codex, local
  model). ID prefix `drv:`.
- **Provider** — a model provider (Anthropic, OpenAI, local). ID
  prefix `prov:`.
- **Incident** — an abnormal runtime event that requires attention or
  review. ID prefix `inc:`.
- **Approval** — a human-or-agent signature authorizing a transition
  (often a proposal → plan or a plan → spec step). ID prefix `appr:`.

### 5.9 System

- **Event** — a single row in the daemon's append-only canonical log.
  Every canonical write lands here. No ID prefix; events are addressed
  by `(txid, seq)`.
- **Projection** — a derived, subscribable view over events. Topbar,
  HQ lane status, chronicle strip, agent roster — all projections.
  Projections are disposable; they are rebuilt from events on demand.
- **Peer** — a remote device that participates in the workspace and
  may hold a replica of canonical state. Not a co-equal authority by
  default. ID prefix `peer:`.

Every object above has an owning bounded context in the daemon; see
`runtime/EMA-0.0.5--4-24/docs/architecture/05-writer-topology.md` and
`packages/contracts/events/catalog.v0.md` for the current implementation
map.

---

## 6. Canonical Workflow

The canonical workflow is the path every non-trivial action takes from
a raw human or agent utterance to a durable fact in the organization's
record.

```text
intent -> proposal -> plan -> spec -> execution -> canon
```

Each stage has a clear role, a clear set of actors who can create and
approve transitions, and a clear rule about what can change and what
must remain preserved. This is the most important workflow in the
product. If it is legible, EMA is legible. If it is opaque, no amount
of UX polish will save us.

### 6.1 Intent

**What it is.** Raw input from a human or agent: a sentence in chat, a
paragraph in a Blueprint section, a voice note, an uploaded document, a
proposal from a debate, a nudge from a personal AI.

**Who creates it.** Anyone. Every participant in the workspace
generates intent constantly.

**Who accepts it.** No one — intent is preserved, not accepted. It
enters the record the moment it is expressed and becomes available to
future proposal authors.

**What can change.** Intent can be edited by its author (with lineage
preserved) and clarified through debate or dialogue, but its original
form is never overwritten.

**What must remain preserved.** The original phrasing, the author, the
surface it came from, and the context it was captured in. Voice drift
starts here; we refuse to paraphrase the user into blandness.

**Storage plane.** The intent knowledge plane inside the wiki.
Structurally adjacent to but distinct from canon.

### 6.2 Proposal

**What it is.** A structured candidate for promotion. "Given the
following intents, I suggest we do X for reasons Y, with scope Z." A
proposal has an author, a scope, a rationale, linked intents, linked
sources, and a review state (`draft`, `ready`, `reviewing`,
`approved`, `rejected`, `withdrawn`).

**Who creates it.** Humans and agents. Agents often propose; humans
often approve.

**Who approves it.** Depends on the scope. A Blueprint-section-local
proposal may need only the section owner; a campaign-level proposal
may need multiple human + agent signatures; a tool-grant proposal
always needs a human.

**What can change.** The rationale, the scope, the linked sources,
and the review state transitions.

**What must remain preserved.** The author identity, the originating
intent links, the review history (who reviewed, when, what they said),
and the rejection reasoning if rejected.

### 6.3 Plan

**What it is.** An approved proposal decomposed into a sequence of
steps, resources, dependencies, and expected artifacts. Plans are
often produced by agent debate; they are always reviewed before
becoming specs.

**Who creates it.** Typically agents, prompted by an approved
proposal.

**Who approves it.** A human operator, usually with agent review
input.

**What can change.** Step order, step decomposition, resource
allocation, timing estimates.

**What must remain preserved.** The originating proposal link, the
set of invariants the plan must satisfy, and the plan author identity.

### 6.4 Spec

**What it is.** The locked specification of exactly what will execute.
Inputs, outputs, invariants, acceptance criteria, failure modes, stop
conditions. The spec is the contract between intent and machine
reality.

**Who creates it.** Agents, with human sign-off.

**Who approves it.** A human operator for any spec that touches real
external systems (sending messages, moving money, writing public
files). Agent-only sign-off is permitted for internal, reversible
specs.

**What can change.** Almost nothing, once locked. If a spec needs to
change mid-flight, the execution is canceled and a new spec (with
clear lineage back to the old one) is drafted.

**What must remain preserved.** Every field. Spec-level changes
invalidate execution.

### 6.5 Execution

**What it is.** The canonical record of a dispatched run. Begins with
a dispatch event, progresses through tool events, and ends with an
outcome.

**Who creates it.** The daemon, on accepting a dispatch command.

**Who approves it.** No one mid-flight — approval happened at the
spec stage. Incidents may trigger a pause/resume approval loop; that
loop is itself a spec.

**What can change.** Nothing mid-flight except via incident response
or cancellation. Tool events append; they do not overwrite.

**What must remain preserved.** The spec link, the actor-of-record
(which agent ran it), every tool event, every response, every
timestamp, every cost, every error.

### 6.6 Canon

**What it is.** The accepted truth that results from a successful
execution. Canon is the durable record that the organization
remembers.

**Who creates it.** The daemon, at successful outcome.

**Who approves it.** No further approval; successful outcome is the
promotion.

**What can change.** Canon is append-only. Bad canon is corrected by
new canon (a correction event), not by overwriting.

**What must remain preserved.** Forever. This is the memory of the
organization.

### 6.7 Why the whole pipeline matters

A system that lets an agent skip from intent straight to execution
produces fast, unreviewable, untraceable action. A system that
requires only intent → canon with no proposal, plan, or spec between
them is not an executive management product — it is an agentic
spreadsheet. EMA's pipeline is what turns agent capability into
organizational competence.

The pipeline is also the **bad-canon recovery mechanism**: when
something lands in canon that should not have, the record of every
stage — proposal authors, plan reviewers, spec approvers — makes
accountability legible and correction targeted.

---

## 7. Product Model

EMA is four things stacked:

1. **A shared workspace** (the environment humans and agents inhabit).
2. **A control plane** (the daemon that owns truth and authority).
3. **A harness** (the boundary to runtime execution, primarily Hermes).
4. **A multi-app shell** (the surfaces through which the above is
   rendered and operated).

EMA is **not an operating system**. It does not own the user's files,
processes, or desktop. It sits alongside them. EMA runs on the user's
machine (via Tauri) or in a browser; it speaks to a locally-running
daemon; the daemon speaks to Hermes and whatever providers are
configured.

### 7.1 The shared workspace

The shared workspace is the durable operating layer for humans and
agents. It contains everything in §5 (Ontology): organizations, spaces,
projects, actors, Blueprint, git-ema, lanes, handoffs, missions,
campaigns, vCalendar, checkups, proposals, plans, specs, executions,
canon, souls.

It is accessed through many surfaces. It lives in one place — the
daemon's canonical store — and is rendered as many views.

### 7.2 The control plane

The control plane is the daemon. It is the **only canonical writer**.
Every write to organizational truth goes through the daemon's bus
actor, through an event envelope validation, and lands in the canonical
SQLite `events` table as an ordered, append-only record.

Control-plane doctrine descends from `lineage-original-elixir-ema`:
ordered supervision tree (config → repo → pubsub → registries →
workspace → sessions → control plane → babysitter → surfaces →
endpoint last), explicit state machines (never implicit promotion),
bounded PubSub projections, one-for-one supervisor isolation. The Gleam
daemon carries the shape forward verbatim; see
`runtime/EMA-0.0.5--4-24/docs/architecture/02-daemon-supervision.md`.

### 7.3 The harness

The harness is the boundary to live execution. EMA's first-class
harness is Hermes: a runtime that owns driver registries, provider
adapters, session continuity, tool invocation, and normalized
event streams.

The boundary is strict:
- EMA creates the execution record first.
- EMA dispatches an `EngineRunRequest` to Hermes.
- Hermes returns a handle and streams normalized events.
- EMA persists the run ledger and binds the run into workstream and
  thread context.
- Hermes is never the only place where a run "exists."

This discipline is what keeps execution legible without collapsing
execution into canon. See
`doctrine/research/ema-003-lineage-architecture-synthesis.md §5`.

### 7.4 The multi-app shell

Surfaces are clients of the control plane. They render. They request.
They never write canon directly. The shell is where the workspace
becomes *inhabited*.

The shell metaphor is the **Virtual Desktop**: wallpaper, windowed
vApps, launchpad-style dock, topbar, presence layer. The inspiration
is direct from `codebase-place-org` (see
`doctrine/research/EMA-0.0.5-SURFACE-DONOR-MATRIX.md §1`). A desktop is
*somewhere*, not nowhere.

Surfaces are enumerated in §8.

### 7.5 What EMA is not

- Not a chat app. (Chat is one surface inside EMA.)
- Not an IDE. (Karpathy's thesis is an analogy, not a product spec.)
- Not an operating system. (EMA runs on the OS; it is not the OS.)
- Not a generic agent framework. (Hermes is the generic layer; EMA is
  the environment layer on top.)
- Not a SaaS dashboard. (The posture is calm-technology, not
  admin-panel.)
- Not a note-taking app. (Notes exist, but the center of gravity is
  work, not notes.)
- Not a replacement for code editors, design tools, or spreadsheets.
  (EMA links to and orchestrates those; it does not rebuild them.)

EMA is the **environment** that holds the rest of the work together.

---

## 8. Core Product Surfaces

Every surface below renders projections of the same underlying canon.
They differ in what they emphasize, how they compose data, and the
workflows they specialize in. None of them own durable state (with the
narrow allowance for disposable layout preferences).

### 8.1 Wiki

**What it does.** Presents the semantic knowledge layer: project
doctrine, research, imported material, cross-linked notes, the intent
knowledge plane. Supports inline comments, inline prompting, edit
history, references, graph navigation, and agent provenance.

**Who uses it.** Humans and agents. Agents read the wiki to prime
context; humans read it to get oriented; both write into it as intent
or as Blueprint/proposal source material.

**What it renders.** Wiki nodes, dataset previews, attachment
references, intent entries, cross-links to lanes and missions, edit
history, agent-generated summaries.

**What it does not own.** Canonical decisions. The wiki is the
semantic view over source material and accepted doctrine; it does not
independently decide what is true.

**Relationship to truth.** Reads canon. Writes intent. Promotes to
proposal only via explicit author action.

### 8.2 Chat

**What it does.** Focused dialogue with one agent, one human, or a
small group. A place to think out loud, iterate quickly, and make
short-range proposals.

**Who uses it.** Humans and agents, usually one-on-one or small
group.

**What it renders.** Messages in a thread, agent replies, tool call
previews, inline proposal previews, quick intent capture.

**What it does not own.** The canonical execution record. A chat
session is not a run. The run is a separate, daemon-owned object
that the chat may reference.

**Relationship to truth.** Reads canon and thread history. Writes
intent and messages. Promotes through proposal path.

### 8.3 Threads / Server

**What it does.** Shared continuity and channelized discussion. The
canonical communication substrate for a project or space — where
many-to-many discussion happens, where missions update the team,
where async coordination lives.

**Who uses it.** Everyone.

**What it renders.** Threads, messages, handoff objects, queue items
created from thread messages, references to lanes/missions/proposals.

**What it does not own.** Any execution state. Threads are
conversation; executions happen through the daemon.

**Relationship to truth.** Threads are an ordered event log; messages
are canonical communication events. Lane assignments, handoff
creation, and queue promotion from a thread all route through the
daemon.

### 8.4 Agent vEnv (Agent Virtual Environment)

**What it does.** The agent's-eye view of the workspace: a dashboard
rendered *for* an agent, not for a human. Presents lane focus,
peripheral peers, upcoming checkups, current spec, active tool grants,
active memory context, and the agent's own soul profile.

**Who uses it.** Agents, primarily. Humans open it to see what an
agent is seeing.

**What it renders.** Agent roster, soul profile inspector, peripheral
lane view, focus pane, queue of incoming handoffs, recent tool events,
agent day/week layout.

**What it does not own.** The agent's decisions. vEnv surfaces the
context; it does not replace the agent's reasoning.

**Relationship to truth.** All reads. Writes are proposals, messages,
and handoff requests.

### 8.5 Blueprint Builder

**What it does.** The project-thinking and design-doc surface.
Question-based construction of structured design documents, the master
EMA design doc for each project, proposal extraction points, links to
git-ema artifacts, comments, and discussion.

**Who uses it.** Humans (founders, operators, reviewers) and agents
(summarizers, proposal drafters, reviewers).

**What it renders.** Blueprint documents, section trees, attachment
slots, proposal seeds, debate transcripts attached to sections.

**What it does not own.** Canonical project decisions. Blueprint is
structure over truth, not truth itself. A Blueprint section that
proposes a direction is a proposal until promoted.

**Relationship to truth.** Reads canon. Writes intent. Hosts proposal
extraction points that promote through the proposal path.

### 8.6 Launchpad

**What it does.** Startup launcher for vApps. Command surface. Context
switcher. Cmd/Ctrl-K palette for CLI-equivalent actions.

**Who uses it.** Humans and agents.

**What it renders.** vApp tiles, recent projects, recent lanes,
command history, CLI-parity actions.

**What it does not own.** Any durable state.

**Relationship to truth.** Dispatches commands (which go through the
daemon). Never mutates anything locally.

### 8.7 HQ (Headquarters)

**What it does.** The customizable central dashboard. Operational home
surface at project and personal scope.

**Who uses it.** Humans primarily; agents read it to understand
project state.

**What it renders.** Swarm pulse, active missions, lane status (with
sparklines once telemetry lands), due checkups, weekly phase focus,
queue pressure, recent handoffs, pinned proposals, sync health, node
state.

**What it does not own.** The underlying data. HQ is a projection
composition; every panel reads from a subscribable daemon projection
and shows a visible `pending daemon writer` label for anything not
yet backed.

**Relationship to truth.** Reads projections. Writes nothing
directly; every action button dispatches a command via the IPC client.

### 8.8 See Agent Work

**What it does.** The first dedicated swarm environment app. A
mission control room for the humans and agents collaborating on a
project: active agents, missions, campaigns, lanes, handoffs, queues,
checkups, weekly phases, virtual calendar, swarms, stalled work,
review needs, mocked start/stop controls, CLI command equivalents,
agent-facing docs.

**Who uses it.** Humans steering the swarm; agents reading their
context.

**What it renders.** Eight regions:
top swarm pulse; mission rail; lane board (idea / ready / active /
review / blocked / done columns); vCalendar strip; agent roster;
command panel; agent instruction panel; chronicle strip (bounded
event buffer, `CHRONICLE_MAX = 200`).

**What it does not own.** Execution. The controls are mocked in wave
1, each labeled `pending daemon writer`, with a visible CLI
equivalent. The first job is visibility. Control follows.

**Relationship to truth.** Reads projections. The command panel
dispatches commands when the corresponding writer lands.

### 8.9 Virtual Desktop

**What it does.** The spatial shell that wraps everything above.
Wallpaper, windowed vApps, launchpad-style dock, topbar, presence
layer. The main interface for native (Tauri) and web, sharing the
same underlying app model.

**Who uses it.** Humans at their machines.

**What it renders.** The five shell layers: wallpaper, windows, dock,
topbar, presence. Every vApp opens as a window. Presence is where
cursor indicators, collaboration hints, and ambient companion state
render.

**What it does not own.** Any workspace truth. The only local state
is disposable layout (`apps/web/src/shell/layout-artifact.ts` is the
permitted carve-out).

**Relationship to truth.** Pure presentation. Every action dispatches
through the IPC client to the daemon.

---

## 9. Agent Model

An agent in EMA is an **actor that can reason, propose, collaborate,
and execute through scoped runtime grants.** Agents are first-class
participants in the workspace — not bots, not tools, not scripts.

### 9.1 What an agent is made of

Every agent is the composition of:

- **Identity** — a stable actor ID, a handle, a display name, a chosen
  creature/vibe/avatar (per OpenClaw `IDENTITY.md` lineage, identity
  is editable, not assigned — agents own and mutate their own
  self-description).
- **Soul** — the structured operating identity (see §10 Soul Model).
- **Memberships** — which orgs, spaces, and projects the agent
  participates in.
- **Capabilities** — what the agent is allowed to do (read this
  blueprint, dispatch this class of execution, use this tool).
- **Tool grants** — explicit allowances at specific scopes.
- **Context sources** — which wiki nodes, doctrine files, and
  memory partitions the agent pulls context from.
- **Runtime binding** — which driver (Claude, Codex, local model) the
  agent currently executes through.

### 9.2 How agents operate

Agents run on the BEAM actor model alongside humans. Each agent is a
supervised process with its own mailbox. Commands come in; events,
proposals, messages, and handoffs go out.

The runtime path for an agent action:

1. Agent receives a task (from a lane assignment, a handoff, a
   checkup, or a direct message).
2. Agent reads context (lane, peers, soul, relevant wiki, recent
   canon).
3. Agent reasons and produces an output — often a proposal, sometimes
   a direct message, occasionally a dispatch request.
4. If the output requires execution, the dispatch passes through the
   canonical workflow (§6).
5. Execution happens in Hermes.
6. Outcome returns to the agent via the event bus.
7. Agent updates its soul if significant (per OpenClaw doctrine, soul
   is continuity across resets).

### 9.3 Agent types

- **Project agents** — scoped to one project. Most work happens here.
- **Personal AI** — scoped to a human principal, reads across the
  principal's projects, writes only with explicit target.
- **Orchestrators** — agents whose job is coordination (alley leads,
  mission runners, bolero conductors in product vocabulary).
- **Specialists** — agents with narrow, deep capability (a scraping
  agent, a legal-review agent, an outreach-drafting agent).
- **Simulated stakeholders** — agents configured via soul presets to
  simulate investor pressure, operator pressure, compliance concerns,
  customer concerns, adversarial review. Used in debate (§14).

### 9.4 What agents can and cannot do by default

Can (without further grant):
- read anything in their project scope,
- draft proposals,
- send messages in threads they have membership in,
- request handoffs,
- update their own soul,
- schedule checkups on their own lanes,
- debate with other agents.

Cannot (without explicit grant):
- execute external tools (email, payment, API calls to third parties),
- write canon directly,
- cross project boundaries,
- modify another agent's soul,
- override a pending approval.

### 9.5 Agent days, agent weeks

Agents operate on a **self-paced virtual calendar**. They have days
and weeks, focus blocks, review windows, and weekly phases. This is
not an anthropomorphic affectation — it is a coordination primitive.
A human supervising a swarm needs to know: is this agent over-scheduled
this week? Are three agents all trying to focus on the same lane?
Which checkups are due?

The temporal system is detailed in §12.

### 9.6 Agents in the peripheral view

Every agent renders into the shared See Agent Work board. Peers can
see each other's lanes, missions, and load. This is the
"Ready Player One" environment: the agent is at the forefront of its
own mind, with peripheral visibility into the rest of the workspace.
An agent can notice that another agent's lane is stalled and propose
a handoff. An agent can see that its mission is the fourth of five in
a campaign and pace itself accordingly.

Agents without peripheral view produce coordination-destroying output.
Agents with peripheral view produce teammate-grade output.

---

## 10. Soul Model

Soul is **the most important under-built concept in agentic AI today**.
It is the concept EMA is betting hardest on. This section is therefore
longer than the others. Read it twice.

### 10.1 What a soul is not

A soul is not a system prompt. A soul is not a persona description. A
soul is not a character sheet. A soul is not a collection of
hardcoded rules. A soul is not a "you are a helpful assistant"
preamble.

### 10.1 What a soul is

A soul is the **structured operating identity** of an agent: a
first-class, durable, inspectable, editable object that encodes:

- **Values** — what the agent holds as important (honesty, efficiency,
  kindness, boldness, conservatism, long-term thinking).
- **Role** — the function the agent serves (strategist, builder,
  scraper, reviewer, debater, executive assistant).
- **Decision standards** — the bar this agent holds itself to before
  acting (e.g., "never send outreach without reviewing the prospect's
  recent activity").
- **Communication style** — how this agent writes and speaks (terse,
  warm, formal, playful, Socratic, direct).
- **Methods** — the recurring approaches this agent takes to
  problems (e.g., "always write the smallest reversible change first").
- **Constraints** — the lines this agent does not cross.
- **Beliefs or teachings supplied by a user** — and this is the deep
  power of the system.
- **Examples of good and bad judgment** — annotated past decisions.
- **History of accepted decisions** — what the agent has decided
  before, indexed for recall.
- **Preferred debate posture** — how this agent argues (adversarial,
  collaborative, questioning, synthesizing).
- **Boundaries on what the agent may do** — policy-level constraints
  that override runtime grants.

### 10.2 The Andrew Tate demonstration

Consider a concrete example that makes the depth concrete.

Andrew Tate has a well-known public set of beliefs. Whatever one thinks
of them, they are articulated, they are consistent, and they are
extensively documented. An EMA user could, in principle, construct a
soul that draws from Tate's publicly-available writing and video
transcripts — a soul that reasons in his voice, applies his decision
standards, weighs options the way he weighs them, argues the way he
argues.

This is not a novelty. It is a demonstration vector for the depth of
the soul model. The point is:

- **A soul can encode a specific, coherent, identifiable intelligence.**
- **Souls can be extraordinarily specialized.** A "Warren Buffett
  capital allocator" soul, an "Edward Deming systems thinker" soul, a
  "Rick Rubin creative producer" soul, a "Bret Victor explorable
  explanations" soul — each rigorously grounded in that person's
  public corpus, each deployable as a perspective in debate or as a
  lens on a proposal.
- **Souls can be composed.** A company building a product might run
  debates between a Buffett-soul, a Deming-soul, and a Rubin-soul to
  stress-test a decision. Each soul would argue in its own voice,
  with its own standards, and produce a reasoning report the humans
  can review.
- **Souls can be invented from scratch.** The founder of a company
  can encode her own philosophy, her own decision standards, her own
  "how we do things here" — and that soul becomes the operating
  intelligence of the company's agents.

The Tate example makes three things obvious:

1. Souls are as deep as the content you feed them. A souls document
   with ten lines produces a ten-line agent. A souls document with a
   lifetime of curated belief, example, and judgment produces a
   lifetime-of-belief agent.
2. Souls are a **specialization vector unlike any other**. A specialized
   agent is not a fine-tuned model — it is a model plus a
   carefully-constructed soul.
3. Souls are **values-bearing**, which means they must be bounded safely.
   A powerful tool, wielded carelessly, is a powerful weapon.

### 10.3 How users provide a soul

The primary mechanism is a structured document. Users write (or dictate,
or generate from a template) a soul profile with labeled sections:

```
# Soul: <name>
Version: <semver>
Author: <user>

## Role
## Purpose
## Values
## Decision standards
## Communication style
## Methods
## Beliefs and teachings
## Examples of good judgment
## Examples of bad judgment
## Debate posture
## Context sources
## Forbidden actions
## Review expectations
## Stop conditions
```

Supporting mechanisms:

- **Source ingestion.** Upload a corpus (books, posts, transcripts);
  the daemon ingests it and links it as context sources.
- **Calibration dialogue.** The user has a structured conversation with
  the soul-in-progress — the soul answers hypotheticals, the user
  corrects, the calibration runs are preserved as training examples.
- **Accepted-decisions bootstrap.** The user points at prior decisions
  they made in their life or business and annotates why; those become
  the examples of good judgment.
- **Template library.** Starter souls (advisor, builder, reviewer,
  skeptic, synthesizer, operator) that users can fork and specialize.

### 10.4 How souls shape behavior

At runtime, when an agent is invoked with a soul:

- **Context injection.** The soul's role, values, decision standards,
  communication style, and debate posture are placed at the forefront
  of the agent's working context.
- **Rule enforcement.** Forbidden actions become hard runtime filters
  — an agent with a soul that forbids sending public messages cannot
  send public messages, no matter the prompt.
- **Style shaping.** Communication style guides output formatting,
  tone, and length.
- **Example-guided reasoning.** Relevant examples of good and bad
  judgment are surfaced to the agent when it faces a decision similar
  to a past one.
- **Review binding.** Review expectations determine who signs off on
  what.
- **Stop conditions.** Stop conditions are evaluated on every step —
  if "the user seems frustrated" is a stop condition, detection
  triggers pause.

### 10.5 What makes souls powerful

- **Specialized perspectives at zero marginal cost.** Once a soul is
  built, every project that benefits from that perspective can invoke
  it. A Deming-soul can review every production issue across every
  project.
- **Team composition as design choice.** The founders of a company
  can design the intellectual posture of the company by choosing its
  soul roster. A capital-allocator soul plus a customer-obsessed
  soul plus a systems-thinker soul plus an adversarial-reviewer soul
  forms a coherent board of directors at the AI level.
- **Voice preservation.** A founder can encode her voice once and have
  every agent operate in that voice forever. No more drift into
  corporate-SaaS copy by the third agent down the chain.
- **Debate and stress testing.** Souls debate each other for complex
  decisions (§14). Each soul argues from its own standards; the
  synthesis is stronger than any single perspective.
- **Onboarding.** A new human joining a company can read the souls
  and immediately understand how agents think. The souls *are* the
  company's operating philosophy, legibly.

### 10.6 How souls are bounded safely

Souls are values-bearing, which means they are dangerous if unconstrained.
EMA's safety model for souls:

- **Souls are never authority.** A soul that says "move $10k" does
  not move $10k. A spec signed by a human does.
- **Forbidden actions are checked at runtime.** A soul's forbidden
  actions override any prompt-level instruction.
- **Stop conditions are first-class.** A soul must declare when it
  stops — no infinite loops, no "keep going until satisfied."
- **Review expectations are binding.** A soul with review expectations
  that say "always have a human review public messages" cannot send
  public messages without a human reviewer on record.
- **Souls are inspectable.** Every human on the project can open a
  soul profile and read it; no hidden priors.
- **Souls are attributable.** Every decision an agent makes is linked
  to the soul version in force at the time.
- **Souls are versioned.** A soul edit creates a new version; past
  decisions are attributed to the version that was active.
- **Souls cannot be modified by other agents.** Only the owning actor
  (the founder, the user, the operator) can edit a soul, and edits
  themselves are proposals under the canonical workflow.
- **Third-party-modeled souls are labeled.** A Tate-modeled soul is
  labeled as such; an Elon-modeled soul is labeled as such; a
  founder-modeled soul is labeled as such. No unlabeled mimics.

### 10.7 How souls evolve

Souls are not static. They are designed to grow with the work:

- **Accepted-decisions feed.** Every decision the agent makes that
  the owner annotates as good or bad flows back into the soul as an
  example.
- **Debate outcomes.** Souls that lose a debate and accept the loss
  can encode the correction.
- **User feedback loops.** The owner can say "I didn't like how you
  handled this"; that feedback becomes a new standard.
- **Corpus expansion.** New material added to the soul's context
  sources reshapes subsequent reasoning.
- **Version history.** Every soul change is preserved; reverting is
  one click.

A soul that has lived inside a company for a year is a different,
more capable artifact than the soul that started there. The moat is
the accumulated experience.

### 10.8 Souls as the real moat

This is where EMA's long-term defensibility lives.

Karpathy talks about the living wiki as the real moat of an AI-first
company: a shared document that accumulates knowledge, that compounds
over time, that no competitor can replicate because no competitor
lived through the experience the knowledge encodes.

EMA's souls are the same idea at the operating-agent layer. A
founder who has spent a year building and refining a dozen souls has
an irreplaceable asset. The souls know how the founder thinks. The
souls know how the company decides. The souls know what has worked
and what has not. The souls **compound**.

Every other component of agentic AI commoditizes quickly. Models
commoditize. Prompts commoditize. Tool integrations commoditize. What
does not commoditize is the specific, lived, curated intelligence
encoded in a soul roster. That is EMA's bet.

---

## 11. Memory and Context Model

Agents and humans in EMA operate against a layered memory model. Each
layer has a role, a storage strategy, and a rule for when it is pulled
into an active context.

### 11.1 The layers

**Raw memory.** Every event the daemon has ever written. The canonical
log. Durable, append-only, replayable. Agents do not read this
directly — it is the substrate, not the interface.

**Shared workspace.** The coordination plane: lanes, handoffs,
missions, campaigns, queue items, checkups, calendar blocks, weekly
phases. This is the "what are we doing" layer that every participant
sees.

**Semantic / Wiki.** The knowledge graph: wiki nodes, datasets,
imported material, project doctrine, indexed source material. Queryable
by topic, by entity, by relevance. The "what do we know" layer.

**Canon.** Accepted truth records. Every outcome that has been
promoted. The "what actually happened" layer.

**Task-local.** The ephemeral working context of a specific lane or
execution: the current spec, the current tool call history, the
current tool response buffer. Disposable once the execution completes.

**Cross-project (Personal AI layer).** A human principal's personal
AI can read across projects the principal belongs to. This is
federated query, not a unified memory bucket — the personal AI asks
each project for relevant context, the project's canon responds, and
the answers are composed.

**Forefront-of-mind.** The narrow, focused context an agent actively
reasons against at a given moment. Composed from the other layers at
retrieval time. See §11.3 below.

### 11.2 Drowning vs surfacing

The failure mode is **drowning**: dumping everything into context and
expecting the model to find the signal. Drowning produces confused,
biased, cost-inefficient agents.

The opposite failure mode is **starving**: giving the agent too little,
so it hallucinates or asks repetitive questions.

EMA's retrieval pipeline (see `codebase-superman` donor, flagged for
future Wiki vApp integration) is staged: decompose the task, pull
parallel candidates, expand the knowledge graph, rerank on multiple
signals (relevance, recency, authority, lineage proximity), assemble
within a context budget, and surface a named retrieval manifest the
agent can cite.

### 11.3 Forefront-of-mind construction

For a given agent action, the forefront-of-mind is assembled from:

1. **Soul** — values, role, decision standards, communication style,
   examples (always).
2. **Current task spec** — what am I actually doing right now.
3. **Peripheral lanes** — what are my peers doing (compact summary).
4. **Relevant canon** — past accepted decisions that match this task.
5. **Relevant wiki nodes** — domain knowledge for this task.
6. **Relevant intent** — the original user sentences that spawned
   this work chain.
7. **Tool grants** — what am I allowed to do.

This assembly is explicit, logged, and inspectable. A human can open
a running execution and see exactly what the agent has in mind.

### 11.4 Why this matters

Without the memory model, agents either drown in garbage context or
operate blind. Either way, the organization's knowledge does not
compound. With the memory model, every execution adds to canon, every
canon addition is searchable, every future agent is smarter.

Karpathy's living wiki becomes real here. The org's memory is not
scattered across chat logs. It is in the daemon, indexed, queryable,
cited. The moat grows by the day.

---

## 12. Temporal System

Agents and swarms need a time model richer than a clock. EMA's
temporal system preserves the **agent virtual environment** idea from
the 0.0.3 lineage and extends it into a first-class coordination
primitive.

### 12.1 vCalendar

The virtual calendar is **not a date picker**. It is the time model
for agent and swarm work. It contains:

- **Agent days** and **agent weeks** — a self-paced progress cadence
  distinct from real wall-clock time.
- **Weekly phases** — named chunks with focus themes (e.g., "Monday:
  research", "Tuesday: build", "Wednesday: review", "Thursday:
  polish", "Friday: integrate").
- **Meetings** and **checkups** — synchronous review points on lanes,
  tasks, or responsibilities.
- **Focus blocks** — scheduled intervals of deep work, with energy
  bands for matching work to state.
- **Queues** — backlog candidates awaiting promotion into lanes.
- **Cadence policies** — how often a class of work should be checked
  up on.
- **Real-world time** — where real deadlines, meetings with humans, or
  external commitments apply.

### 12.2 Self-paced vs wall-clock

An agent working on a six-week campaign does not need a wall-clock
Gantt chart. It needs a sense of pace: "I'm in week 2 of 6, this
mission is on track, I have two checkups remaining this week."

A human joining an external meeting does need wall-clock timing. EMA
supports both — calendar blocks have a `flex_mode` field.

### 12.3 Weekly phases

Weekly phases are the most load-bearing temporal primitive for
swarms. A swarm running in "Monday-research / Tuesday-build" mode has
a natural coordination rhythm: research lanes expect to close Monday,
build lanes pick up Tuesday. The peripheral view surfaces the phase
so agents pace themselves accordingly.

### 12.4 Checkups

Checkups are the bridge between planner state and execution state. A
checkup asks: is this lane still on track? Is this responsibility
being honored? Does this spec need to evolve? Checkups are owned by
humans or by designated orchestrator agents; they produce structured
results (`on_track`, `adjust`, `escalate`, `terminate`).

### 12.5 Queue pressure

Every queue has a visible pressure indicator. Queue pressure is what
tells a human "we have too much incoming for our current swarm
capacity" or "we are starved for work this week." HQ surfaces queue
pressure; weekly phases respond by reallocating.

### 12.6 Real-world time boundaries

EMA respects real deadlines where they apply. A proposal to "launch
the outreach campaign by April 30" carries a real-world date. The
vCalendar propagates that date across the derived lanes.

### 12.7 Temporal scope boundary for 0.0.5

Wave 1 ships the vocabulary (lane, mission, campaign, weekly phase,
checkup, calendar block) and a mocked vCalendar strip in See Agent
Work. Full temporal enforcement (auto-scheduling, cadence detection,
phase-shift events) lands after the proposal path is real (Wave 5+).

---

## 13. Project / Org / Space Structure

EMA's topology is **locked**. See
`doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md §4`.

```text
Organization -> Space -> Project
```

### 13.1 Definitions

- **Organization** is the outer trust, membership, device, invite, and
  policy boundary. It is the "company" or "team" level. First seeded
  organization: `Founding-Fathers-EMA`.
- **Space** is the shared working environment inside an organization.
  Every organization defaults to one space with the same name as the
  organization; that default space is renamable. Organizations can
  contain as many spaces as policy allows. Spaces are the primary
  collaboration and replication boundary.
- **Project** is the scoped effort inside a space. A project owns
  Blueprint documents, lanes, proposals, attachments, and runs. First
  seeded project: `EMA 0.0.5`.

Every organization auto-creates one same-name default space on
creation. This is a locked invariant of the writer topology; see
`runtime/EMA-0.0.5--4-24/docs/architecture/05-writer-topology.md`.

### 13.2 Scoping

- **Global scope**: identity roots, device identities, peer
  identities, shared provider catalogs, user preferences.
- **Org scope**: membership policy, shared integrations,
  trust/compliance settings, org dashboards.
- **Space scope**: collaboration visibility, presence, replication
  policy, default thread/wiki/file segmentation.
- **Project scope**: apps, files, datasets, workstreams, threads,
  wiki, execution records.

### 13.3 Membership

Every actor (human, agent, personal AI, device, service) joins an
organization through an invite or a founding seed. Membership is
scoped: an actor can be a member of an org without being a member of
every space, and can be a member of a space without being on every
project.

### 13.4 Personal AI and cross-project access

A human's personal AI can *read* across the projects that human
belongs to, but writes require an explicit project/space/lane target.
This is query federation, not one merged global memory bucket. A
personal AI asking "what did I decide about outreach last week" gets
a federated answer composed from each project's canon, not a search
against a single blob.

### 13.5 Hard vs soft boundaries

**Hard boundaries** (enforced by the daemon):
- org membership,
- space visibility,
- project write access,
- tool grants,
- forbidden actions declared in a soul.

**Soft boundaries** (conventions, not enforcement):
- lane focus vs peripheral view,
- personal AI cross-project read posture,
- agent day/week pacing.

Hard boundaries are the safety fence. Soft boundaries are the
coordination grammar.

### 13.6 Why this topology

An older lineage swapped the inner two layers; that ordering is
quarantined as history, not winner. The current topology was chosen
because:

- **Spaces map to how humans actually collaborate.** A company has a
  "main workspace" and special-purpose workspaces (investor room,
  client-X room, research room). Spaces are those rooms.
- **Projects nest inside rooms, not inside companies.** A project is
  "what we're building", not "who we are."
- **Replication and presence align on spaces.** The sync model
  becomes cleaner when the replication boundary matches the
  collaboration boundary.
- **Multiple projects per room is the common case.** A space
  containing three related projects is natural; a project containing
  three related spaces is awkward.

---

## 14. Debate, Simulation, and Stress Testing

**Debate is not a gimmick. It is one of EMA's major reasoning
surfaces.**

### 14.1 Why debate exists

Hard decisions benefit from structured argument. A human executive
asking "should we launch the campaign now?" rarely has one right
answer; she has a complex multivariable problem with tradeoffs. A
single agent answering with confidence produces a biased answer that
looks authoritative.

Structured debate among multiple agents — each with a different soul,
each with a different posture — surfaces the tradeoffs, reveals the
assumptions, and produces a synthesis that a single agent cannot.

### 14.2 The debate format

A typical debate:

1. **Frame.** A human or orchestrator agent frames the question. The
   frame is preserved verbatim as intent.
2. **Participant selection.** 3–5 agents with contrasting souls are
   selected (e.g., a capital-allocator soul, a customer-obsessed
   soul, a systems-thinker soul, an adversarial-reviewer soul).
3. **Opening arguments.** Each participant produces an opening
   position. Positions are structured: claim, reasoning, evidence,
   confidence.
4. **Cross-examination.** Participants challenge each other's
   reasoning and evidence. Each challenge and response is preserved.
5. **Refinement.** Participants may update positions in response to
   challenges.
6. **Synthesis.** A synthesizer agent (or a human) produces a
   reasoning report: consensus points, open disagreements, confidence
   distribution, recommended next action.
7. **Judgment.** The final judgment is made by the human plus, for
   reinforcement, multiple reviewing agents. The judgment is recorded
   with reasoning.

### 14.3 Simulated stakeholders

Souls can simulate:
- **Investors** (capital discipline, timeline pressure),
- **Operators** (feasibility, resource cost),
- **Compliance** (legal, regulatory, policy),
- **Customers** (user experience, value delivery),
- **Adversarial reviewers** (red team, edge cases),
- **Domain experts** (specialized technical review).

A debate that consults all of these before launching a campaign
surfaces failure modes the human would miss alone.

### 14.4 Stress testing

Stress testing is a specialized debate form: one or more agents with
adversarial souls actively try to break a proposal. "What happens if
the third-party API rate-limits us?" "What if the lead list has
duplicates?" "What if outreach templates get flagged as spam?" The
output is a structured list of risks and mitigations.

### 14.5 Debate output structure

Every debate produces:

- **Preserved intent** (the original framing).
- **Reasoning reports** (per participant and consolidated).
- **Open questions** (disagreements the debate could not resolve).
- **Proposed next actions** (concrete follow-ups).
- **Candidate proposals** (promotable into the canonical workflow).
- **Confidence distribution** (how confident the participants are in
  each position).
- **Dissent summaries** (what the losing side argued, preserved).

### 14.6 Debate does not directly mutate canon

Debate feeds the proposal path. It does not write canon itself. A
debate that concludes "we should launch the campaign" produces a
proposal, not a launch. The proposal runs through the canonical
workflow like any other.

This discipline is what prevents debate from becoming a
rationalization engine: the debate surfaces the reasoning; the human
still signs the spec.

### 14.7 Where debate lives in the product

Debate is a first-class feature of the Agent vEnv and accessible from
any surface where a decision is being made: a Blueprint section, a
proposal draft, a mission kickoff, a checkup outcome. A "Run debate"
button triggers the structured format and produces the reasoning
report as a preserved, linkable artifact.

---

## 15. Harness / Control Plane / Runtime

This is the architectural spine of EMA. The distinctions below are
load-bearing and are drawn from the atlas lineage (see
`doctrine/research/ema-003-lineage-architecture-synthesis.md §5` and
`doctrine/research/EMA-0.0.5-FULL-DONOR-INVENTORY.md "Crown jewel"`).

### 15.1 The names

- **EMA** — the product. The shared human-agent workspace. The
  environment. Owns truth.
- **Daemon (EMA daemon)** — the process that runs EMA's canonical
  control plane. Currently Gleam/BEAM; historically Elixir/Phoenix.
  Owns the canonical SQLite. Only canonical writer.
- **Control plane** — the doctrinal layer inside the daemon: event
  log, store, replay, execution supervisor, incidents, proposal
  events, persistence, schema, supervisor.
- **Hermes** — EMA's first-class runtime/harness. Owns live session
  execution, tool invocation, runtime integration, continuation,
  normalized runtime events.
- **Harness** — the adapter boundary between EMA and runtime drivers
  (Hermes is one harness; in principle other harnesses could exist).
- **Driver** — a concrete runtime binding (Claude via Anthropic API,
  Codex via its CLI, a local model).
- **Provider** — a model provider (Anthropic, OpenAI, a local
  Ollama).
- **Runtime** — the combined harness + driver + provider path that
  actually executes a spec.
- **Surfaces** — the clients of the control plane: web app, desktop
  (Tauri) wrapper, CLI, any future surface.

### 15.2 Who owns what

| Concern | Owner |
|---|---|
| Organizations, spaces, projects, actors, memberships | Daemon (canonical) |
| Proposals, plans, specs, executions, outcomes, canon | Daemon (canonical) |
| Blueprint structure, lane structure, handoff records | Daemon (canonical) |
| Live session state, tool calls, model responses | Runtime (Hermes) |
| Process health, worker supervision, recovery | Daemon supervisors |
| Collaborative text (blueprint prose, comments) | Collaboration substrate (Yjs/Hocuspocus, mediated by daemon) |
| Rendering, input, local window layout | Surfaces |
| Device keys, provider secrets, signing material | Native secure storage |

See `data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md` for the
full six-plane breakdown.

### 15.3 The execution path

1. A human or agent produces intent.
2. Intent is promoted into a proposal (canonical write via daemon).
3. Proposal is approved; a plan is drafted (canonical write).
4. Plan is approved; a spec is locked (canonical write).
5. Spec is dispatched: daemon creates an execution record and emits
   `EngineRunRequest` to Hermes.
6. Hermes picks up the request, binds it to a session, invokes the
   driver, streams normalized events back to the daemon.
7. Daemon persists the event stream as tool events linked to the
   execution record.
8. Execution completes; the outcome lands as canonical canon.

**Critical:** Hermes is never the only place where a run exists. If
Hermes crashes, the execution record is still in the daemon, the
dispatch can be reissued, and the event history up to the crash is
preserved.

### 15.4 Donor-grounded control plane patterns

From `lineage-original-elixir-ema` (carry forward verbatim):

- Ordered supervision tree: infra before surface.
- Explicit takeover state machine (`idle → armed → active →
  cooldown`), not implicit promotion.
- Event log as bounded PubSub projection (`@max_events 200`).
- One-for-one isolation per concern.

From `codebase-ema`:
- Control plane / babysitter / sessions / workspace-shared separation.
- `hermes_client` as the typed EMA-truth / Hermes-execution seam.
- Second-brain indexer for memory as first-class durable asset.

From `codebase-place-companion`:
- Localhost-only, origin-checked transport (ports 27182–27189 with
  allowlist).
- Tray-resident background process posture.
- Broadcast channel for IPC fan-out.
- Self-healing autostart against OS-level adversarial state.

### 15.5 Why the split matters

Collapsing execution into canon produces systems that cannot recover
from runtime failure. Collapsing canon into execution produces
systems that lose history the moment a session ends.

EMA's split — daemon owns canon, Hermes owns execution, surfaces own
rendering — is what makes the system auditable, recoverable, and
legible at scale.

---

## 16. Governance and Trust

Agents with tool grants and souls with values are powerful. Power
without governance is a liability. EMA's governance model makes the
trust boundaries explicit and legible.

### 16.1 Approval gates

Approval gates exist from day one, even if some are mocked in wave 1.
Every non-trivial transition requires a signature:

- Proposal → plan: author + reviewer.
- Plan → spec: human operator for external-effect specs; agent-only
  allowed for internal-reversible specs.
- Spec → dispatch: only specs that passed the prior gate can
  dispatch.
- Execution → canon: successful outcome promotes automatically;
  failed outcome requires an incident-review approval to promote
  partial results.

Every approval records:
- the approving actor,
- the approved artifact (versioned),
- the timestamp,
- the approver's attached reasoning (optional but encouraged).

### 16.2 Autonomy boundaries

Agents operate within **explicit autonomy envelopes**:

- **Read autonomy** — agents can read anything in their project
  scope by default.
- **Propose autonomy** — agents can draft proposals freely.
- **Execute autonomy** — agents cannot execute external-effect
  actions without a human-signed spec.
- **Cross-scope autonomy** — agents cannot cross project boundaries
  without an explicit grant.
- **Soul-modification autonomy** — agents cannot modify their own
  soul without owner approval; agents cannot modify other souls at
  all.

The envelope is owned by the soul and the org's membership policy.
Increasing autonomy is a proposal; decreasing it is immediate
(kill-switch posture).

### 16.3 Bad-canon correction

Canon is append-only. When bad canon lands (an agent takes an action
that should not have happened), correction is:

1. An incident event is emitted.
2. An approval-gated correction proposal is drafted, citing the bad
   canon.
3. The correction proposal describes the compensating action (undo,
   refund, retraction, etc.).
4. On approval, a correction canon event lands, linking back to the
   bad canon and the reasoning.
5. The bad canon is never deleted — it is annotated as corrected.

This is how EMA stays legible even when it errs.

### 16.4 Authority logging

Every canonical write records:
- the acting actor,
- the approving actors,
- the source intent chain,
- the soul version in force (if applicable),
- the tool grants used,
- the device the action was initiated from.

A full audit of "who did what and with what authority" is always one
query away.

### 16.5 Role escalation and de-escalation

Role changes (granting admin, revoking access) are proposals. They
pass through the canonical workflow like any other change. An urgent
revocation (kill-switch) is an immediate, unilateral action available
to org admins — but it is still logged and reversible.

### 16.6 Trust zones

EMA inherits the **Zone 0 / Zone 1 / Zone 2** trust framing from
`codebase-execudeck`:

- **Zone 0** — surfaces. Render and orchestrate; no mutation rights.
- **Zone 1** — daemon. Validates, persists, projects. Authority layer.
- **Zone 2** — runtime (Hermes). Executes under spec-bound dispatch.

Crossing zones requires passing through the canonical workflow.
Surfaces cannot reach Zone 1 without a command frame. Daemon cannot
reach Zone 2 without a dispatched spec. Runtime cannot reach Zone 1
without emitting through the event bus.

---

## 17. MVP Definition

The MVP for EMA 0.0.5 is deliberately **ambitious in shape and honest
in function**: the whole product skeleton visible, without pretending
every automation already works.

### 17.1 Must-include (v1)

**Canonical truth path.**
- Daemon boots on `Founding-Fathers-EMA` organization seed.
- Default same-name space is created automatically on org creation.
- `EMA 0.0.5` project is seeded inside that space.
- Full org / space / project / settings / invite interfaces from day
  one.
- `org.created`, `space.created`, `project.created` are real
  canonical writer events with replay-deterministic projections.

**Spawn-able autonomous agents.**
- Agents can be spawned via plain-English commands into the CLI or
  See Agent Work command panel.
- Each agent is assigned a project, a lane, a soul, and a scoped
  tool grant.
- Teams of agents can work on overlapping lanes within a project.

**Intuitive tools.**
- Topbar with org / space / project selectors reading from the
  `topbar.projection` daemon actor.
- See Agent Work first screen (8 regions) with honest-mock labels on
  every pre-writer panel.
- Blueprint document render with section tree.
- git-ema attachment list with connector stubs.
- HQ with pulse grid, surface switchboard, lane status.

**Solid base context + memory recall.**
- Every event the daemon writes lands in canonical SQLite.
- Projections subscribable over the WS IPC client.
- Raw memory queryable through the agent vEnv memory inspector.

**P2P peer remote-prompt.**
- Device pairing for at least two peers (Adil's machine + Trajan's
  mini-PC).
- Remote-prompt authority honored (peer daemons speak the same
  protocol).
- One always-on host peer (Trajan's mini-PC) hosting multiple users.

**Shared desktop with peers.**
- The Virtual Desktop surface can be seen (read-only is acceptable
  for v1) by other peers in the same space.
- Presence indicators for who's in the workspace.

**Daemon running 24/7.**
- Launchd/systemd autostart on the always-on host peer.
- First-launch Tauri affordance: "EMA daemon not running — start
  it?" with a labeled Start button.
- Tray/menubar presence reflecting daemon state.

**Continuous iteration.**
- Agents propose new ideas from captured intent; proposals land in
  the queue for review; the proposal path is at minimum documented
  and partly mocked.

### 17.2 Explicit excludes (v1)

- Full automation of the intent → canon pipeline (wave 5+).
- Real tool execution against external systems (wave 6; v1 stops at
  dispatch record, does not actually send emails, move money, or
  make API calls).
- Multiplayer Yjs/Hocuspocus collaborative text (wave 7).
- Full soul builder UI (wave 4; v1 ships the shape and sample
  profiles as files).
- Every vApp in the 35-entry catalog (v1 ships the 4–5 most
  load-bearing: Blueprint, git-ema, See Agent Work, HQ, Launchpad).
- Debate as a fully wired runtime feature (wave 5+; v1 ships the
  documented format and a mocked runner).

### 17.3 First-proof workflow

The end-to-end demonstration of v1 is:

```text
1. Launch EMA on Adil's machine. Daemon starts. Workspace boots.
2. Topbar shows "Founding-Fathers-EMA / Founding-Fathers-EMA / EMA
   0.0.5". All three rendered from the topbar daemon projection.
3. Open See Agent Work. Eight regions render. Each honest-mock label
   visible where the writer is not yet real.
4. Open Blueprint. EMA 0.0.5 master design document (this document)
   renders as a section tree, with attached source material from
   git-ema.
5. Open git-ema. Attachment list renders. Connector stubs show
   github, drive, local paths.
6. Issue `ema swarm start --project "EMA 0.0.5" --swarm "buildout"`
   via the command panel. Command result returns. Event lands in
   canon.
7. Open HQ. Lane status panel shows the new swarm.
8. Peer device (Trajan's mini-PC) pairs. The same workspace becomes
   visible on both machines.
9. Remote-prompt from Adil's machine: "Let the buildout swarm plan
   its first week." Agent spawns on the mini-PC, drafts a proposal,
   returns it to the queue.
10. Human reviews the proposal, approves it. The proposal becomes a
    plan (mocked at v1; the shape is real).
```

When that workflow runs end-to-end, v1 is done.

### 17.4 Client-onboarding target after v1

After v1 is stable, the first external client is Adil's wholesaling
real estate business. The workspace is cloned to an
`Adil-Wholesaling-REI` organization; the project is `Wholesaling
Q2`; the agents are specialized (scraper, qualifier, outreach-drafter,
reviewer); the souls are built with Adil directly; the first real
campaign runs.

This is the second-order proving ground: does EMA's architecture
survive contact with a real, messy, operating business?

---

## 18. Risks and Failure Modes

Brutal honesty below. Every line is a real risk, not a strawman. The
goal is to name them so the team can mitigate them.

### 18.1 Conceptual risks

- **Ontology bloat.** Naming 30+ first-class objects in §5 risks an
  over-complex product where every concept requires its own writer,
  its own catalog entry, its own UI. Mitigation: most objects stay
  doctrine-level in v1; event families expand only when the first
  proposal path proves itself.
- **Soul-as-savior.** Betting the long-term moat on souls is
  correct but fragile if souls turn out to be shallow in practice.
  Mitigation: ship multiple soul shapes, measure depth of specialized
  output against a baseline, iterate on the soul spec.
- **Canon vs intent confusion.** Users who don't internalize the
  distinction will be frustrated when their "I said this!" does not
  become truth. Mitigation: explicit, visible labeling of every
  intent entry; clear promotion affordances; onboarding walkthrough.

### 18.2 Product risks

- **Feature sprawl.** 35 vApps is the long-term vision; shipping
  even 8 is a lot. Mitigation: `EMA-0.0.5-LANGUAGE-LOCK.md §12`
  locks the "vanilla workspace" definition; wave 1 ships the
  shell + 4–5 vApps.
- **Surface-as-truth drift.** A team member in a hurry writes a
  feature that mutates local state. It ships. Six weeks later the
  authority story has holes. Mitigation: RIP provenance markers,
  honest-mock labels, code-review discipline, automated
  contract-check.
- **Mock-to-real drift.** Mocked controls accumulate; no one ever
  replaces them. Mitigation: every mock has a `TODO(event-family:
  …)` marker; contract-check surfaces unclaimed mocks.

### 18.3 Technical risks

- **Day-one architecture mistake.** If the topology is wrong, the
  event shape is wrong, or the control plane is wrong, every
  subsequent addition gets harder, and at some point the foundation
  has to be rebuilt. Mitigation: the topology is locked, the event
  catalog is versioned, and the donor-grounded control plane shape
  is carried forward verbatim.
- **Sync complexity.** Once two peers are running, consistency
  bugs will happen. Mitigation: the sync model (§15) is space-scoped
  canonical authority + replicas, not fully egalitarian mesh; one
  trusted daemon holds the active write lease per shard.
- **Runtime fragility.** Hermes crashes, providers rate-limit, tools
  misbehave. Mitigation: one-for-one supervisor isolation,
  incident records, explicit stop conditions, no silent failures.
- **Performance at scale.** An event log accumulates; projections
  rebuild; queries slow. Mitigation: bounded projection caches
  (`@max_events 200`), deliberate replication, index strategy in the
  wiki/knowledge layer.

### 18.4 Trust risks

- **Souls weaponized.** A soul built on adversarial content could
  output harmful material. Mitigation: forbidden actions,
  stop conditions, review expectations, soul inspectability,
  soul versioning, third-party-modeled-soul labeling.
- **Personal AI over-reach.** A personal AI reads across projects; a
  bug or misuse turns that into a leak. Mitigation: writes require
  explicit targets; reads are federated queries (not unified
  buckets); policy enforcement is hard-boundary at the daemon.
- **Authority spoofing.** An actor impersonates another. Mitigation:
  device keys, signing material in native secure storage, explicit
  authority logging on every write.

### 18.5 Organizational risks

- **Founder bandwidth.** Two people (Adil, Trajan) cannot manually
  orchestrate every lane. Mitigation: EMA itself; the build-using-
  EMA loop is the internal dogfood discipline.
- **Knowledge silos.** One founder knows the surface; the other
  knows the runtime. Mitigation: the master design doc (this
  document); cross-lane orchestrator prompts; shared STATUS.md
  ledger.
- **Demo-to-production gap.** A v1 demo is not a business-running
  system. Mitigation: the Adil wholesaling deployment as the real-
  world proving ground.

### 18.6 Over-complexity risks

- **Too many concepts, not enough working code.** A pretty design
  doc is not a product. Mitigation: the wave plan; wave 1 ships a
  runnable skeleton; subsequent waves add only when earlier waves
  prove themselves.
- **Premature abstraction.** Building mission / campaign / alley /
  bolero runtime machinery before a single lane actually runs end-
  to-end. Mitigation: the language lock marks alley/bolero as
  product vocabulary, not locked runtime objects; lockdown happens
  when proven.

### 18.7 Context and memory quality risks

- **Context drowning.** Feeding agents everything produces biased,
  confused output. Mitigation: staged retrieval pipeline (§11),
  bounded context budgets, named retrieval manifests.
- **Intent paraphrasing.** User voice is lost as it moves through
  proposal → plan → spec. Mitigation: original intent is always
  linked and surfaceable; agents are instructed to cite original
  phrasing in reasoning reports.
- **Canon forgetting.** The org's memory is only as good as its
  indexing. Mitigation: second-brain indexer (from `codebase-ema`),
  wiki graph, dataset indexing, replay on demand.

---

## 19. Validation Plan

### 19.1 First internal validation: EMA builds EMA

The founding team (Adil, Trajan) uses EMA to coordinate the
continuing build of EMA. Every lane, mission, and campaign in the
buildout is a workspace object. Every proposal flows through the
canonical workflow. Every handoff is explicit. Every checkup is
scheduled.

This is the most brutal test of the product because the users are the
builders, and a missing feature hurts them directly.

Validation succeeds when:
- the team stops using out-of-product coordination tools for the
  EMA buildout,
- the STATUS.md ledger migrates into EMA lanes and handoffs,
- new external agent sessions (Codex, Claude CLI) can operate
  inside EMA by reading the workspace rather than by reading
  doctrine files.

### 19.2 First external validation: Adil's wholesaling real estate

Adil's existing wholesaling real estate business is the first client.
The business has:
- outreach at volume (cold calls, texts, email),
- a lead list (scraped and bought),
- qualification and follow-up logic,
- contracts and deal flow,
- operator and assistant labor that could be compressed.

EMA's deployment:
- `Adil-Wholesaling-REI` organization,
- default same-name space,
- initial project: `Wholesaling Q2`,
- agents: scraper, qualifier, outreach-drafter, reply-analyzer,
  appointment-scheduler, follow-up-cadence-runner, compliance-
  reviewer,
- souls: Adil-operator, Adil-adversarial-reviewer, Tate-modeled-
  closer (for A/B against), compliance-reviewer,
- first campaign: a specific city, a specific price band, a specific
  outreach cadence.

Validation succeeds when:
- human operator hours per closed deal drop measurably,
- deal flow does not degrade,
- compliance is not compromised,
- Adil reports qualitatively that EMA feels like "the control panel
  for the business, not a tool bolted on."

### 19.3 Measurable signals

- **Latency from intent to canon** — how long does a typical action
  take to move through the pipeline? (Target: minutes for simple
  actions, hours for multi-approval actions.)
- **Proposal acceptance rate** — how many agent-drafted proposals
  survive review? (Target: steady-state above 60% after soul
  calibration.)
- **Incident rate per execution** — how often does runtime
  misbehave? (Target: under 5% after the first month.)
- **Multi-agent coordination success** — how often do two agents in
  the same mission produce non-conflicting output? (Target: above
  90% with explicit handoffs.)
- **Operator self-report** — Adil + Trajan qualitative sense of
  "does EMA make this easier?" (Target: unambiguous yes by end of
  Q2.)

### 19.4 Long-term validation

- **Soul depth** — a year in, can a Buffett-modeled soul produce
  capital-allocation reasoning that would pass a rigorous human
  reviewer? Can an Adil-modeled soul produce outreach a prospect
  cannot distinguish from Adil's own?
- **Canon density** — does the org's canon support new agents
  onboarding by reading the record, without a human re-briefing?
- **Moat test** — can the system be replicated by a competitor without
  the specific soul roster, the specific canon, and the specific
  operational lineage? (Target: no.)

---

## 20. Open Questions

Grouped by urgency.

### 20.1 Must answer before v1 ships

1. **Exact IPC frame shape.** The command / command_result / event
   frame types are partially locked in
   `packages/contracts/ipc/shell-protocol.md`. Field-order discipline
   matters; one drift there breaks every surface.
2. **Soul file format.** Markdown-based with labeled sections is the
   current direction, but the machine-readable schema (YAML
   front-matter vs JSON body vs structured tree) is not finalized.
3. **Seed determinism.** First-boot seed events must be
   deterministic across restarts; idempotency rules must be
   crisp.
4. **Peer pairing UX.** The first-time pairing experience between
   Adil's machine and Trajan's mini-PC has to be simple enough that
   a non-technical user could do it.
5. **Daemon install flow.** Launchd/systemd autostart has to work
   on a fresh machine without manual surgery.

### 20.2 Can defer until after v1

1. **Full Yjs/Hocuspocus integration for collaborative text.** Wave
   7. Until then, Blueprint prose is single-writer.
2. **Wiki retrieval pipeline.** Staged retrieval from
   `codebase-superman` is queued for a later Wiki vApp wave.
3. **Debate runner.** Documented format in v1; full automated runner
   in wave 5+.
4. **Soul calibration dialogue.** Structured calibration conversation
   UI in wave 4+.
5. **Full vCalendar auto-scheduling.** Wave 5+.
6. **Third-party-modeled-soul legal posture.** Public-figure-modeled
   souls are powerful but raise legal questions; defer until
   product-market fit is proven.

### 20.3 Long-term strategic

1. **Is `Space` always contained by one `Project`, or can spaces
   span projects later?** Current topology is strict containment.
   Future cross-project spaces remain open.
2. **How much autonomous write authority should a personal AI ever
   have outside the active project context?** Currently: reads
   federated, writes explicit-target. Whether that ever relaxes is
   an open policy question.
3. **Is `Chat` a distinct durable object family or a specialized
   view over thread/workstream/session bindings?** Currently: a
   view. Whether chat deserves first-class durability is open.
4. **What exact sync substrate should power wiki/canvas: CRDT,
   op-log, or mixed?** Currently mixed. Convergence on one
   substrate is an open engineering call.
5. **Plugin contract for foreign apps.** Embed-only, adapter-backed,
   or full object-sync — open.
6. **Discord bridging.** Ingest-only, bidirectional mirror, or
   selective bridge — open. (Current posture: do not begin with
   Discord as a primary state container.)
7. **How far does autonomous canon ever go?** v1 requires human
   signature for external-effect specs. Whether certain classes of
   low-risk specs can eventually auto-sign is open.
8. **Commercial model.** EMA itself as a product vs EMA as
   infrastructure under specific client deployments vs both — open.
9. **Cross-organizational collaboration.** Two orgs sharing a
   project (joint venture) is not yet modeled.
10. **Cold-start bootstrap.** A brand-new user opening EMA for the
    first time: what's the first 90 seconds? Onboarding is open.

---

## 21. Closing Frame

EMA is the executive management workspace for humans and agents
working together.

Without EMA, you have no consistent logic and system and framework for
the AI to operate within. You have bright agents and dim environments.
You have action without memory. You have productivity without compound
interest. You have a pile of clever tools and no place for them to
meet.

The leap humanity made, that let a handful of hominids domesticate a
planet, was not intelligence — it was **collaboration**. The leap
agents are about to make is the same one. The question is whether the
environments we build for them are good enough to let them make it.

EMA is that environment.

- **Durable truth.**
- **Explicit execution.**
- **Coherent workspace objects.**
- **First-class collaboration.**
- **Scoped identity.**
- **Multiple surfaces that all speak the same underlying language.**
- **Souls that compound over time.**
- **A canon that remembers.**
- **A workspace that is inhabited, not used.**

Without it, we are unprepared.

With it, we can begin.

---

*End of master design doc.*

*This document is Slice B of the Canon Writers orchestrator. Slice C
is the next doctrine layer: the Project Overview Document, the
Technical Document, and the Styling / UX Mentality Document. Those
documents refine this one; this document governs them.*

*Canonical companions:*
- *`doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md`*
- *`doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md`*
- *`data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md`*
- *`doctrine/research/EMA-0.0.5-FULL-DONOR-INVENTORY.md`*
- *`doctrine/research/EMA-0.0.5-SURFACE-DONOR-MATRIX.md`*
- *`doctrine/research/ema-003-lineage-architecture-synthesis.md`*
- *`doctrine/research/ema-003-shared-agent-swarm-workspace.md`*

*Implementation substrate:*
- *`runtime/EMA-0.0.5--4-24/docs/architecture/*`*
- *`runtime/EMA-0.0.5--4-24/packages/contracts/events/catalog.v0.md`*
- *`runtime/EMA-0.0.5--4-24/apps/daemon/src/`*

*Doctrine may update. Code that contradicts doctrine loses.*
