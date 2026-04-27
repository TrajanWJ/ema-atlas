# EMA 0.0.3 Deliverables Program

Related docs:
- [EMA 0.0.3 Lineage Architecture Synthesis](/Users/tawj/Desktop/ema 0.0.3/ema-003-lineage-architecture-synthesis.md)
- [EMA 0.0.3 Gleam/BEAM Bounded Contexts](/Users/tawj/Desktop/ema 0.0.3/ema-003-gleam-beam-bounded-contexts.md)
- [EMA 0.0.3 Shared Agent Swarm Workspace](/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md)
- [EMA 0.0.3 Knowledge Graph Hub](/Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md)
- [EMA Atlas README](/Users/tawj/Desktop/ema 0.0.3/ema-atlas/README.md)

## 1. Working Stance

- The atlas repo is not only a transfer pack now.
- It is the current presentation layer for EMA-in-progress.
- Deliverables should keep pace with actual architecture work instead of trailing behind it.
- Each major EMA part should be presented through three tensions at once:
  - `operator` / command / truth boundary
  - `living workspace` / shared human-agent environment
  - `mesh future` / peer-aware distributed future

## 2. Program Goals

- Present the entire EMA project in one place without flattening its tensions.
- Make each part legible to different audiences:
  - builders
  - collaborators
  - future contributors
  - skeptical reviewers
- Keep deliverables close enough to implementation that they can pressure real decisions.
- Surface questions that should stay hard rather than prematurely acting settled.

## 3. Core Rule

> EMA owns truth. Hermes owns execution. Surfaces do not own state.

This rule should be visible in every major deliverable family.

## 4. Deliverable Families

### 4.1 Atlas Narrative

- Purpose: editorial explanation of each system part
- Primary format: Next.js route
- Pressure it should apply: forces each part to state doctrine, tradeoffs, and unresolved choices

### 4.2 Showroom / Demo

- Purpose: make EMA feel like a coherent product world instead of a bundle of documents
- Primary format: browser-native exhibit route, desktop route, staged walkthrough
- Pressure it should apply: surfaces emotional/product coherence questions

### 4.3 Brief / PDF

- Purpose: printable and relayable package for handoff, strategy review, and alignment
- Primary format: longform route or markdown designed for PDF export
- Pressure it should apply: removes visual theater and tests whether the thinking still holds

### 4.4 Slides / Presentation

- Purpose: communicate a part quickly to collaborators or external audiences
- Primary format: rhythm-based slide route
- Pressure it should apply: reveals whether the story has a clear arc

### 4.5 Canvas / Whiteboard

- Purpose: preserve ambiguity, relationships, and open design territory
- Primary format: board route, Miro-like map, graph-assisted canvas
- Pressure it should apply: shows what is still unresolved or structurally tangled

### 4.6 Implementation Track

- Purpose: tie deliverables back to real development and recovery work
- Primary format: source pack, bounded-context note, build lane, schema/event draft
- Pressure it should apply: prevents the atlas from floating away from the actual system

## 5. Part Program

### 5.1 Authority / Control Plane

- Operator take:
  - deliverable: doctrine brief on canonical truth objects and non-negotiable records
  - value: keeps EMA from collapsing into surface-owned state
  - hard question: which actions must never exist without an EMA-owned record?
- Living workspace take:
  - deliverable: workstream-centered walkthrough showing truth appearing inside threads, wiki nodes, and plans
  - value: tests whether authority can feel humane
  - hard question: how embedded can authority become before it becomes ambiguous?
- Mesh future take:
  - deliverable: peer authority lease diagram and arbitration story
  - value: forces early clarity on portable truth
  - hard question: which truth objects can move, and which must remain anchored?

### 5.2 Harness / Execution Fabric

- Operator take:
  - deliverable: execution lineage brief and normalized event model
  - value: sharpens EMA/Hermes boundary
  - hard question: what is the minimal canonical execution record EMA must persist?
- Living workspace take:
  - deliverable: run-aware chat/thread demo where workstreams and runs stay distinct but visible together
  - value: tests whether execution can feel integrated without becoming muddy
  - hard question: how do humans inspect runtime truth without reading raw telemetry?
- Mesh future take:
  - deliverable: peer placement and remote execution risk board
  - value: exposes secrets/provenance constraints before distribution becomes theater
  - hard question: what should never be runnable on a remote peer?

### 5.3 Shared Workspace

- Operator take:
  - deliverable: canonical shared-object vocabulary and promotion rules
  - value: defines what graduates from chat into durable workspace state
  - hard question: what exact object set belongs in v1?
- Living workspace take:
  - deliverable: place-like workspace mockup with threads, notes, files, plans, and handoffs in one room
  - value: makes shared human-agent habitation concrete
  - hard question: who composts or prunes the workspace over time?
- Mesh future take:
  - deliverable: convergence matrix for workspace artifacts
  - value: identifies which objects can replicate cleanly
  - hard question: which artifacts need arbitration rather than convergence?

### 5.4 Coordination / Agent Environment

- Operator take:
  - deliverable: planner/control-tower board with lane claims, handoffs, and drift audits
  - value: keeps swarm work recoverable
  - hard question: where is the line between accountability and over-management?
- Living workspace take:
  - deliverable: virtual calendar and self-paced environment demo with weekly phases, queue, checkups, and notes
  - value: shows agent environment as a real shared product surface
  - hard question: can a supportive environment still tell the truth about slippage?
- Mesh future take:
  - deliverable: distributed coordination model for responsibilities, cadence, and workload routing
  - value: opens the future of peer-aware agent labor allocation
  - hard question: when should EMA ask permission instead of silently re-optimizing?

### 5.5 Semantic Layer / Knowledge System

- Operator take:
  - deliverable: concept canon and promotion flow for wiki node -> blueprint -> commitment
  - value: keeps the knowledge system from becoming ornamental
  - hard question: what is the promotion path from note to decision?
- Living workspace take:
  - deliverable: inline-prompting wiki and blueprint concept demo
  - value: captures the Google Docs + Discord + Wikipedia + Obsidian direction
  - hard question: what makes a wiki node different from a thread or a task?
- Mesh future take:
  - deliverable: federated memory and permission map
  - value: tests long-range continuity and privacy assumptions
  - hard question: what must remain deliberately unremembered?

### 5.6 Shells / Surfaces

- Operator take:
  - deliverable: shell hierarchy explainer for HQ, Launchpad, Threads, Chat, and Desktop
  - value: prevents surface sprawl from becoming conceptual sprawl
  - hard question: which shell defines the user's mental model first?
- Living workspace take:
  - deliverable: place-inspired virtual desktop route with live windows and system presence
  - value: makes the world-like quality of EMA tangible
  - hard question: what part of the desktop metaphor is essential, and what part is costume?
- Mesh future take:
  - deliverable: adaptive surface matrix across browser, native shell, and peer-aware contexts
  - value: keeps the shell model honest about future variation
  - hard question: how much adaptation can happen before users lose their sense of home?

### 5.7 Identity / Org / Project / Space

- Operator take:
  - deliverable: authority and scope matrix for orgs, projects, spaces, datasets, and personal AI reach
  - value: keeps scope visible instead of magical
  - hard question: what cross-project access is acceptable by default?
- Living workspace take:
  - deliverable: journey demo for moving between personal HQ, project HQ, and space-level work
  - value: shows continuity without erasing boundaries
  - hard question: how should scope shifts feel in the interface?
- Mesh future take:
  - deliverable: federated capability and membership story
  - value: frames long-term trust and capability negotiation
  - hard question: what is the smallest trustworthy permission story for mesh EMA?

### 5.8 Mesh / Replication / Presence

- Operator take:
  - deliverable: first replication slice brief and object-eligibility matrix
  - value: narrows the future to something buildable
  - hard question: what is the smallest convincing mesh move?
- Living workspace take:
  - deliverable: co-presence story showing shared rooms, activity, and continuity
  - value: expresses the human side of distribution
  - hard question: should users see the mesh, or only feel it?
- Mesh future take:
  - deliverable: governance and authority commonwealth diagram
  - value: pushes the biggest future question into view
  - hard question: what governance model would make mesh EMA trustworthy?

## 6. Immediate Build Pressure

- Keep the atlas route set growing.
- Keep the local knowledge pack linked from the site.
- Keep implementation-facing documents visible beside product-facing routes.
- Do not let the site become a generic brochure.
- Do not let the docs become disconnected from the routes.

## 7. Recommended Near-Term Output Mix

- One new route family that feels like a deliverables showroom
- One route that behaves like a program map or roadmap with tension, not fake certainty
- One route that stages the shared workspace / planner / virtual calendar environment
- One route that acts like a semantic index of the knowledge system
- One implementation-facing pack translating the strongest ideas into concrete BEAM/Gleam build slices

## 8. Open Pressure Questions

- Which part should become the hero of the product story first: workspace, authority, or shell?
- Is the Virtual Desktop a primary mode or an iconic advanced mode?
- Should the semantic layer mostly describe the system, or increasingly become the system's editing surface?
- What is the smallest planner/calendar/checkup model that already feels uniquely EMA?
- How do we make deliverables feel alive without smuggling fake product decisions into them?
