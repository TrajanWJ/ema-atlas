# Overarching Proposal Vision — EMA as a Double-Sided Workspace

Generated from the user's recent prompts plus VM-visible context on disk.

## Actual user verbatim constructed intent

> "oaky so EMA is a double sided workspace, one for humans through gui, one through agentws though skills / daemon interaction, the agent side workspace needs to have a self dictated virtual calendar supporting self paced dayts and self paced weeks with plans and phases on the calendar, scheduling / time blocking and making meetings/events on the calendar to do things / check up on things / orchestratte, as well as it needs everything for an agent swarm to operate and share context, and everything that karpathy and his wiki and obsidian is talking about, this means it needs project management system on teh agent aside as well with the virtual calendar, with tasks, to dos, breaking things down and decomposing architectures etc.

> this is what will host what we found, and what I was getting at with my last messag,e review it and construct a more overacrching proposal vision, and also before you output your ouput/response/inference, I want you to put the \"actual user verbatim constructed intent\" and I want you to freeform what IU amtrying to do basedf on context on disk and my recent proimpts"

## Freeform: what the user is trying to do

The user is not trying to build yet another app with chat bolted on.

The user is trying to build a **real operating environment for humans and agents sharing one evolving body of work**.

Across place.org, EMA, OpenClaw, ClaudeForge, and the current p2p/BEAM direction, the same deeper ambition keeps resurfacing:

- a workspace that is both **cognitive** and **operational**
- a system where plans, projects, tasks, sessions, memory, calendar time, and live orchestration all inhabit one environment
- a system where the human has a rich GUI-facing workspace, but agents also have their own first-class workspace instead of being stateless background tools
- a system where agent work is not just prompt/response, but structured through time, commitments, decomposition, phases, check-ins, and coordination
- a system where knowledge compounds like a wiki / Obsidian / Karpathy-style long-lived markdown intelligence layer instead of being rediscovered from scratch every session
- a system where an agent swarm can share context, coordinate, decompose work, and operate over a common project-management substrate
- a system that is local-first, eventually p2p, and built on a runtime that can actually carry durable state and orchestration cleanly

The older systems each captured one face of that:
- **place.org** captured the world/model/UX and personal-workspace feel
- **EMA Elixir** captured control-plane, orchestration, session, and execution truth
- **ClaudeForge / TS era** captured surface mirroring, session routing, and more operator-facing workflow affordances
- the new direction is trying to fuse all of that without the architecture drift and stack mismatch

So the real goal is something like:

**EMA should become a dual-interface organizational operating system where humans and agents both inhabit the same project reality, the same timeline, the same knowledge substrate, and the same orchestration fabric — but through interfaces designed for their different modes of cognition and action.**

## Core proposal vision

## 1. EMA is a double-sided workspace

EMA should be explicitly designed as two tightly-coupled workspaces over one shared runtime truth.

### Human side
The human side is GUI-first.

It should support:
- calendar views
- project and task boards
- plans, phases, and milestones
- proposals and decisions
- contextual knowledge browsing
- live orchestration visibility
- manual overrides and approvals
- meetings/events/check-ins as operational objects

### Agent side
The agent side is daemon/skills/runtime-first.

It should support:
- structured context access
- self-paced day/week planning
- task decomposition
- execution queues
- skill-mediated workflows
- internal scheduling / time blocking
- shared project context across agents
- architecture decomposition
- session continuity
- memory / wiki / project-state access

The key idea:
**agents should not merely receive tasks; they should inhabit a workspace with time, plans, commitments, and organizational state.**

## 2. Shared truth, different interfaces

The human GUI and the agent workspace should not be separate apps that try to sync conceptually.
They should be two views over the same underlying state model.

Shared underlying objects should include:
- projects
- tasks
- plans
- phases
- calendar blocks
- meetings/check-ins/events
- proposals
- decisions
- execution records
- agent sessions
- knowledge/wiki nodes
- context bundles

The GUI sees those as visually navigable management objects.
The agent sees those as machine-legible working context and orchestration affordances.

## 3. Calendar is not cosmetic — it is agent-operational time

The user's message makes this explicit: the agent side needs its own virtual calendar.

That means the calendar is not just a human reminder surface.
It should be part of the agent operating model.

### Required calendar semantics
The agent-side calendar should support:
- self-paced days
- self-paced weeks
- plans and phases mapped into time
- time blocking
- meetings/events/check-ups
- orchestration windows
- review windows
- follow-up / revisit loops

### Why this matters
Without time structure, agents only react.
With time structure, agents can:
- maintain pacing
- reserve work windows
- schedule reviews
- create follow-up obligations
- reason about urgency vs sequence vs dependency
- perform self-directed orchestration with explicit temporal scaffolding

## 4. Project management is part of the agent workspace, not external to it

The project-management system should not be a separate human-only layer.

It needs to be native to the agent side too.
That means agents should be able to work with:
- projects
- tasks
- to-dos
- decomposition trees
- architecture breakdowns
- plans and phases
- dependencies
- execution state
- review and completion criteria

An agent should be able to move fluidly between:
- understanding project intent
- decomposing architecture
- turning plans into tasks
- placing tasks into temporal structure
- executing and checking back in

## 5. The knowledge layer should follow the Karpathy / wiki / Obsidian pattern

The user explicitly referenced Karpathy, wiki, and Obsidian.
That implies a long-lived knowledge substrate rather than ephemeral context stuffing.

The system should maintain:
- interlinked markdown knowledge
- raw sources + curated synthesis
- durable notes
- project and decision memory
- context bundles for agent execution
- human-readable and agent-usable structure

This knowledge layer should support both:
- human reflection / browsing / writing
- agent retrieval / synthesis / continuity

So EMA should not just *use* a wiki.
It should treat the wiki/knowledge layer as one of its foundational cognitive substrates.

## 6. Agent swarm support must be first-class

The user's message also makes it clear that the agent side needs everything for an agent swarm to operate and share context.

That implies:
- multiple agents with distinct roles/capabilities
- shared context bundles
- project-scoped working sets
- handoffs
- task assignment
- coordination state
- shared calendar and scheduling semantics
- shared but permissioned memory/knowledge access

In the p2p future, this grows into a distributed organizational mesh.
But even locally, the internal model should already assume multi-agent coordination.

## 7. What this system is, at the highest level

EMA should be framed as:

### A human-agent organizational OS
Not just a task app.
Not just a daemon.
Not just a Discord bot.
Not just a knowledge base.
Not just a swarm framework.

It is the system that fuses:
- workspace
- calendar
- project management
- execution orchestration
- knowledge compounding
- agent coordination
- human oversight

into one coherent environment.

### A canonical spine wrapped by time and computation
The cleaner earlier framing treated semantic, temporal, and operational concerns as co-equal siblings. That reads well, but it is structurally wrong for EMA.

The corrected shape is:
- **canonical spine**: `Intent -> Proposal -> Approval -> Execution -> Canon Update`
- **semantic substrate**: notes, wiki, intent meaning, decisions, citations, canon
- **temporal wrapping**: scheduling, pacing, phases, windows, check-ins as fields and related entities on the spine
- **computed operational views**: tasks, todos, boards, agendas, dependency graphs, and calendars as queries over canonical entities

That keeps time real without creating a second source of truth, and keeps operational affordances as computed views instead of duplicate records.

## 8. Proposed guiding statement

EMA is a **double-sided organizational workspace** where humans and agents share one operational reality.

- The **human side** provides a rich GUI for planning, reviewing, supervising, and navigating projects, time, and knowledge.
- The **agent side** provides a first-class working environment through daemon/skills/session interaction, with access to plans, project state, virtual calendar time, task systems, shared context, and organizational memory.
- A persistent wiki/Obsidian-style knowledge layer compounds understanding over time.
- A project-management and calendar layer gives both humans and agents temporal structure and operational commitments.
- A swarm/runtime layer lets multiple agents coordinate, share context, and execute work across shared organizational state.
- The long-term architecture should be local-first and p2p-capable, explicitly BEAM-native: OTP supervision, distributed Erlang, :pg, Phoenix.PubSub, hot code loading, and Gleam as the JS bridge when a GUI lands.

## 9. Design principles implied by the user's intent

1. **Agents get a workspace, not just prompts.**
2. **Time matters.** Calendar and pacing are first-class runtime objects.
3. **Knowledge compounds.** Wiki/Obsidian-style persistent context is core.
4. **Plans must decompose.** Architecture → phases → tasks → calendar blocks → execution.
5. **Human and agent views differ, but truth is shared.**
6. **Swarm support is native, not an afterthought.**
7. **The system should host the recovered context lineage.** The context recovery effort is feeding the substrate, not separate from it.

## 10. What this means for the collection work

The collection effort is not just archaeology.
It is seeding the future agent workspace.

What we are collecting now should be organized so it can later become:
- initial wiki / knowledge substrate
- initial project and architecture context
- initial lineage of decisions and failures
- initial concept map for the p2p BEAM rebuild

So the context-sync workspace is effectively the first embryo of the future agent-side organizational memory.
