# Section A: Best Prompt To Ask Me

I need a **self-contained, high-signal transfer dossier** for another expert technical agent joining my long-running rewrite effort cold.

Please write it as if the receiving agent has **never seen prior conversations** and needs to become productive quickly.

Ground it in what you already know from prior work on this project, especially around:
- EMA as control plane / lineage authority
- Hermes as execution substrate / meta-harness candidate
- the shared human-agent workspace
- the Elixir backend daemon rewrite
- the P2P / organization / spaces rewrite
- synchronous collaboration for canvas/docs/wiki
- OpenClaw and ClaudeForge as historical lineages, not final architecture

Output requirements:
1. Distinguish **Confirmed**, **Inferred**, and **Speculative** throughout.
2. Prioritize **durable context** over brainstorming.
3. Be concrete about:
   - architecture
   - authority boundaries
   - terminology
   - user/workflow model
   - major subsystems
   - orchestration model
   - sync/data model
   - org/space/permission model
   - networking assumptions
   - unresolved decisions
   - risks / failure modes
4. Explain the **architectural evolution over time**, including:
   - original intent
   - what broke down
   - why the Elixir daemon rewrite happened
   - why the P2P rewrite is necessary
   - what must be preserved
   - what should be redesigned from first principles
5. Include a focused subsection just on:
   - what an agent is
   - what a human is relative to agents
   - how humans and agents share workspace state
   - how multiple agents coordinate
   - how state stays coherent across local / daemon / network boundaries
6. End with:
   - "Three likely architecture mistakes to avoid"
   - "Three questions a new agent should ask next"
   - "Recommended next steps for a new agent joining the project"

Write the dossier in a form I can paste directly to another agent.

---

# Section B: Answer To That Prompt

# EMA / Hermes Rewrite Transfer Dossier

## 1. Project one-liner

**Confirmed / Inferred:** This project is a long-running rewrite of a human+agent operating environment toward an **EMA-centered control plane** with a **Hermes-backed execution substrate**, an **Elixir daemon core**, a **shared human-agent workspace**, and a **future P2P organization/space collaboration model** spanning agents, users, documents, canvases, wiki-like knowledge, and execution surfaces.

---

## 2. Canonical framing

### Confirmed
- **EMA** is treated as the **system of record** / **control plane** / **execution-lineage authority**.
- **Hermes** is the strongest current candidate for the **execution substrate** and possibly the **top-level meta-harness** through which other runtimes are dispatched.
- **ClaudeForge** is an important **operator surface / Discord+web shell** lineage, but not the desired canonical truth layer.
- **OpenClaw** is an important **historical orchestration and operator-pattern lineage**, but not the intended future source of truth.
- The current long-term direction is **p2p-first on a Gleam/BEAM/Erlang/Elixir base**.

### Inferred
- The product ambition is broader than “AI coding bot” or “personal assistant.” It is closer to a **shared operating environment for humans and agents**, with control-plane lineage, collaborative knowledge, execution harnessing, and organization/space semantics.
- The rewrite is trying to unify four things that previously drifted apart:
  1. control-plane truth
  2. execution runtimes
  3. collaboration/workspace state
  4. user-facing surfaces

### Speculative
- The eventual product may function like a **distributed collaborative executive/work OS** where people and agents operate inside organizations/spaces with durable state, synchronous collaboration, and policy-governed orchestration.

---

## 3. Primary terminology

### Confirmed
- **EMA** = control plane, lineage, canonical operator truth.
- **Hermes** = execution substrate / agent runtime / API server / tool-calling engine / skills+memory system.
- **ClaudeForge** = Discord/web operator surface with provider abstraction and session/category/channel model.
- **OpenClaw** = prior multi-agent / Discord-native orchestration environment and protocol source.
- **Surface** = Discord/web/CLI/editor-facing interface; should not own durable truth.
- **Session** = a bound conversation/execution context for an agent runtime.
- **providerSessionId** = backend continuity token (must stay distinct from local UI session ID).
- **workspace/shared/** = repo-owned shared human/agent workspace on agent-vm.
- **proposal / execution / dispatch-update / complete** = control-plane lineage language inside EMA.

### Inferred
- **Agent** = not merely an LLM call, but a session-capable execution participant with runtime context, tools, and potentially role semantics.
- **Human** = an operator/participant who shares workspace state with agents, not merely a chat prompt source.
- **Space** = likely the collaboration scope inside an organization where humans, agents, docs, canvases, and knowledge live together.

---

## 4. The four major lineages you should know

### 4.1 place.org / placeOS lineage
**Confirmed**
- Earlier visible world-model: browser-native desktop/personal workspace / local-first environment.

**What it contributed**
- workspace/desktop metaphor
- environment-as-place
- user-facing coherence ambition
- local-first instincts

### 4.2 EMA daemon lineage
**Confirmed**
- Elixir/Phoenix daemon-centered control-plane system.

**What it contributed**
- authority boundary
- execution lineage
- system-of-record discipline
- daemon-first architecture

### 4.3 ClaudeForge / TypeScript operator-surface lineage
**Confirmed**
- Discord+web shell that turns machine directories into categories and sessions into channels.

**What it contributed**
- provider abstraction
- normalized runtime events
- surface mirroring across Discord/web/terminal
- operator affordances

### 4.4 EMA mesh / P2P BEAM lineage
**Confirmed / Inferred**
- Current strategic direction: organization-scale, peer-aware, P2P-capable execution and collaboration.

**What it contributes**
- distributed topology
- peer dispatch
- multi-user/multi-device/multi-space architecture
- rejection of single-host hidden truth as the final model

---

## 5. Core vision

### Confirmed
The project wants a system where:
- EMA remains canonical for control-plane state and lineage.
- execution can be delegated to Hermes and, eventually, other harnesses.
- humans and agents work in a shared workspace rather than scattering state across chat silos and machine-local residues.
- surfaces mirror and control the system rather than becoming the system.

### Inferred
The deeper vision is a **human-agent collaborative environment** where:
- execution is durable, traceable, and routable
- workspace state is shared across humans and agents
- documents/wiki/canvas are live collaborative objects, not just attachments
- organizations and spaces are first-class scopes for presence, permission, and collaboration
- local/daemon/network boundaries are explicit but unified by coherent sync contracts

### Speculative
The final product may converge toward a **distributed collaborative knowledge + orchestration operating system** rather than a simple agent shell or chat interface.

---

## 6. Primary user/workflow model

### Confirmed
Current docs and repo shape imply:
- operator asks for work through a surface
- EMA records/reads project context and execution lineage
- runtime executes via Hermes or another driver/provider
- outputs/events are reflected back to surfaces
- outcomes are reported back into EMA

### Inferred
Primary workflow model likely becomes:
1. human enters an org/space/project context
2. shared workspace state is visible to both humans and agents
3. a task/proposal/intent is created or routed
4. EMA determines canonical execution record and target
5. Hermes (or another harness driver) executes the work
6. events/results update both collaboration state and execution lineage
7. other humans/agents can continue or collaborate from the same shared state

### Speculative
A stronger future workflow could include:
- synchronous co-editing on docs/canvas/wiki while agents operate in the same space
- multi-agent orchestration with role specialization
- peer/device-aware dispatch based on locality, auth, or load

---

## 7. System architecture as currently understood

### Confirmed
Best current reading:
- **EMA** = control-plane authority
- **Hermes** = execution substrate / API server / delegation engine / skills+memory runtime
- **ClaudeForge** = surface shell over providers/runtimes
- **OpenClaw** = historical protocol/role/orchestration lineage

### Confirmed architecture rule
**EMA owns truth, Hermes owns execution, surfaces do not own state.**

### Inferred target architecture
```text
Humans / Agents
   ↕
Surfaces (Discord / web / CLI / editor)
   ↕
Shared workspace + collaboration state
   ↕
EMA control plane
  - proposals
  - executions
  - routing policy
  - peer topology
  - org/space lineage
   ↕
Hermes driver/harness layer
  - hermes-native
  - claude-cli
  - codex-cli
  - peer-remote
  - simulated-tui
   ↕
Execution runtimes / peers / tools / models
```

### Speculative but plausible missing layer
A durable **collaboration state service** may need to sit alongside the control plane if canvas/docs/wiki sync is not cleanly represented as the same data model as execution lineage.

---

## 8. Major subsystems

### Confirmed
1. **EMA daemon**
   - Elixir/Phoenix canonical core
   - control-plane endpoints
   - host-truth and surface endpoints
   - session/peer/discovery-related code is present in repo lineage

2. **Hermes runtime**
   - API server
   - tool execution
   - memory + skills
   - session continuity
   - delegation/subagents
   - ACP/editor support

3. **ClaudeForge surface**
   - project/session/category/channel shell
   - bot/web UI
   - provider abstraction
   - session manager and event bus

4. **Shared workspace**
   - repo-owned workspace under `workspace/shared/`
   - meant to stop context scattering across random VM folders

5. **Historical OpenClaw protocol layer**
   - role semantics
   - multi-agent patterns
   - handoff/watchdog/memory tiering lessons

### Inferred future subsystems
6. **Driver registry / harness layer**
   - formal runtime-target abstraction above raw providers

7. **Collaboration sync layer**
   - docs/wiki/canvas shared state and conflict resolution

8. **Org/space model**
   - permissions, membership, scoped state, agent presence

9. **P2P/peer networking layer**
   - remote execution placement
   - peer discovery and state transport

---

## 9. Data and sync model

### Confirmed
The system already emphasizes:
- explicit execution lineage
- session identity separation
- canonical HTTP/control-plane surfaces
- shared workspace artifacts in repo-owned paths

### Inferred
The project likely needs at least **three classes of state**:

1. **Control-plane state**
- proposals
- executions
- dispatch status
- incidents
- operator state
- routing metadata

2. **Execution/runtime state**
- live session continuity
- provider/harness IDs
- tool activity
- transient process state

3. **Collaboration/workspace state**
- docs/wiki/canvas content
- shared notes/context
- human+agent-visible artifacts
- org/space scoped collaboration objects

### Important inferred rule
These must not be conflated:
- collaboration state is not identical to runtime state
- runtime state is not identical to control-plane truth
- surfaces should reflect all three, but own none of them canonically

### Speculative likely requirement
Canvas/docs/wiki state will probably need CRDT/event-log style sync semantics if the system truly wants synchronous collaboration across users, agents, devices, and peers.

---

## 10. Agent orchestration model

### What an “agent” is in this system

#### Confirmed
An agent is at least:
- a session-capable runtime participant
- able to execute through a harness/provider
- associated with tools, prompts/personality, or role semantics
- able to emit events into surfaces and/or control-plane lineage

#### Inferred
A richer definition is:
- an execution actor with identity, continuity, permissions/context, and potentially a role within a shared workspace or org/space

### What a “human” is relative to agents

#### Confirmed / Inferred
A human is not just a chat initiator. The system appears to treat humans as:
- operators
- collaborators
- authority holders / reviewers / members of spaces
- participants sharing workspace state with agents

### How agents and humans share workspace state

#### Confirmed
- repo-owned shared workspace exists specifically to stop context scattering
- project wants a human-agent shared workspace model

#### Inferred
The desired model is:
- both humans and agents can read/write shared artifacts
- workspace state is durable beyond any one chat session
- workspace artifacts should be consumable by the control plane and by execution runtimes

### How multiple agents coordinate

#### Confirmed
- Hermes has delegation/subagent support
- OpenClaw lineage contributed multi-agent role patterns
- project wants orchestration across boundaries

#### Inferred
Coordination should happen through:
- explicit task/intent/execution contracts
- shared workspace artifacts
- event streams / dispatch updates
- clear lineage ownership in EMA

#### Speculative
Long-term coordination may need:
- named roles per space/org
- conflict rules
- watchdog/reconciliation logic
- collaborative locking or merge semantics for shared objects

### How orchestration should work across local / daemon / network boundaries

#### Confirmed
- capability locality matters
- EMA agent contract explicitly warns not to assume uniform capabilities across human shell / agent turn / daemon / surfaces

#### Inferred
Correct orchestration model:
- EMA decides what should run and where
- Hermes driver layer decides how target runtime executes
- local vs daemon vs peer are explicit placements, not hidden side effects

---

## 11. Networking / P2P assumptions

### Confirmed
Current strategic direction is explicitly P2P-first / mesh-oriented.

### Inferred reasons P2P is considered necessary
- single-host assumptions are limiting
- organization/spaces collaboration implies multi-user / multi-device / multi-node reality
- execution locality/auth/tool availability differ by machine
- peer dispatch is already part of the conceptual architecture

### Speculative implementation assumptions
The future network layer likely needs:
- peer identity
- capability advertisement
- secure replication or sync channels
- execution relay / remote streaming
- resilience to partial connectivity
- space-scoped replication rather than global broadcast

---

## 12. Collaboration model for canvas/docs/wiki

### Confirmed
User explicitly wants:
- synchronous canvas/docs/wiki collaboration between users
- spaces inside organizations

### Inferred
This means documents are not peripheral. They are likely part of the primary workspace model.

### Likely desired collaboration behavior
- humans can co-edit docs/canvas/wiki in real time
- agents can read/update/comment/synthesize against the same state
- collaboration history is durable and attributable
- execution results can materialize into shared docs/wiki/canvas without leaving the canonical system

### Speculative but important design implication
If docs/wiki/canvas become primary objects, they likely need:
- first-class IDs and ownership
- version/event history
- presence/awareness metadata
- merge/conflict semantics
- org/space scoped access control
- references from execution records and workspace state

---

## 13. Org / space / permission model

### Confirmed
The project theme explicitly includes:
- spaces inside organizations
- multiple users
- collaboration across users and agents

### Inferred
The minimum model probably needs:
- **Organization** = administrative/security boundary
- **Space** = collaboration/work execution context within an organization
- **Members** = humans and possibly service/agent identities
- **Permissions** = read/write/execute/admin/review style scoped capabilities
- **Artifacts** = docs/wiki/canvas/tasks/executions scoped to org/space

### Speculative but likely important
Agent permissions should probably not be ad-hoc global tool access. They should be mediated by:
- org policy
- space policy
- runtime locality
- approval/review requirements

---

## 14. Why the older approach became insufficient

### Confirmed
Older layers produced drift between:
- repo truth
- surface behavior
- runtime residue
- docs/notes/session memory

### Confirmed / Inferred
Problems that surfaced:
- Discord-native or surface-native systems felt good operationally but risked becoming shadow state containers
- TypeScript/frontend-heavy approaches captured useful UX and provider abstractions but were not the intended durable long-term systems foundation
- OpenClaw carried valuable multi-agent patterns but also restart/config/auth drift and operational fragility
- execution/runtime identity and surface identity were too easy to conflate
- shared context scattered across repos, vault/wiki mirrors, and runtime folders

### Inferred
The old approach became insufficient because it could not cleanly unify:
- authority
- execution
- collaboration
- distributed topology

in one reality-aligned architecture.

---

## 15. Why Elixir is strategically appropriate

### Confirmed / Inferred
Elixir is a strong strategic fit because the system needs:
- long-running daemon behavior
- concurrency and supervision
- evented/orchestration control-plane workflows
- resilient multi-process coordination
- future distributed/peer-aware architecture
- strong server-side canonicality rather than UI-led truth

### Inferred
It is especially well-suited if the project wants:
- control-plane reliability
- background orchestration
- process supervision for agents and sync services
- eventual distributed systems evolution on BEAM

### Speculative
If collaboration and orchestration both become core, BEAM may become the real substrate tying together sync, control-plane logic, presence, and peer routing.

---

## 16. Why P2P is strategically appropriate

### Confirmed / Inferred
P2P is strategically appropriate because the project wants:
- spaces inside organizations
- distributed execution
- peer dispatch
- local capability awareness
- collaboration that is not single-server brittle

### Inferred
P2P is not just about distribution for its own sake. It solves:
- machine locality for tools/auth/resources
- multi-device presence
- organizational/shared environments
- avoidance of one central opaque runtime node for everything

### Speculative
The system may eventually use hybrid authority:
- logically authoritative control-plane state
- physically distributed execution and collaboration transport

---

## 17. Non-negotiable product properties

### Confirmed / Inferred
1. **Surfaces do not own durable truth.**
2. **Execution lineage must be explicit.**
3. **Humans and agents share workspace state, not just chat history.**
4. **Capability locality must be explicit.**
5. **Useful historical intent must be preserved even when the prior stack is discarded.**
6. **The long-term architecture should support organizations, spaces, and collaborative objects, not just single-user chats.**
7. **Execution should be dispatchable across harnesses and eventually peers.**

---

## 18. Biggest unresolved questions

### Confirmed / Inferred
1. **What is the canonical data model for shared collaboration objects?**
   - especially canvas/docs/wiki vs workspace files vs control-plane records

2. **How should authority be split between control-plane state and collaborative content state?**
   - same store/event log or adjacent subsystems?

3. **What exact primitive defines an agent identity?**
   - session, actor, member, role, service identity, or all of the above?

4. **How should org/space permissions map onto runtime permissions?**
   - especially for tools, execution rights, and peer dispatch

5. **How much of Hermes should remain “provider runtime” versus become “harness router”?**

6. **What sync strategy will be used for multi-user live collaboration?**
   - event log, CRDT, authoritative merge service, or hybrid

7. **What should be replicated peer-to-peer and what should remain logically centralized?**

---

## 19. Risks and likely failure modes

### Confirmed / Inferred
1. **Surface-state relapse**
   - Discord/web starts silently becoming the real system again

2. **Identity conflation**
   - UI session IDs, provider session IDs, execution IDs, and collaboration object IDs get mixed together

3. **Control-plane / collaboration-model split-brain**
   - docs/wiki/canvas state diverges from execution lineage and task state

4. **Locality blindness**
   - architecture assumes every node/user/agent has the same tools/auth/resources

5. **Over-fitting to historical runtime residue**
   - importing OpenClaw/legacy structure too literally instead of extracting the useful doctrine

6. **P2P overreach before canonical local semantics exist**
   - distributing a bad model just spreads confusion faster

7. **Workspace incoherence**
   - agents continue scattering state across ad-hoc paths instead of repo-owned/shared structures

---

## 20. What must be preserved from the old vision

### Confirmed / Inferred
- strong operator ergonomics
- workspace-as-place metaphor
- agent collaboration as a first-class behavior
- session continuity
- multi-surface access
- knowledge/workspace integration rather than isolated chat logs
- organizational ambition beyond one-off agents

---

## 21. What should be intentionally redesigned from first principles

### Confirmed / Inferred
- authority model
- collaboration state model
- identity model across control plane / runtime / surfaces
- driver/harness abstraction above providers
- org/space/permission semantics
- peer/network placement model
- canonical workspace contracts for humans and agents

---

## 22. Three likely architecture mistakes to avoid

1. **Letting Discord/web/category/channel topology become canonical state again**
2. **Treating model providers and execution harnesses as the same abstraction**
3. **Building P2P sync before the local single-node semantics for workspace, lineage, and collaboration are crisp**

---

## 23. Three questions a new agent should ask next

1. **What exact state objects are canonical in v1: executions, tasks, docs, canvases, wiki pages, sessions, spaces?**
2. **What is the minimal org/space/member/agent permission model that the rewrite must support from day one?**
3. **What collaboration sync strategy is intended for docs/wiki/canvas: centralized event log, CRDT, or hybrid?**

---

## 24. Recommended next steps for a new agent joining the project

### Immediate
1. Read the current grounding docs:
   - `docs/AGENT-CONTRACT.md`
   - `docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
   - `docs/HERMES_HARNESS_DRIVER_REGISTRY.md`
   - `workspace/shared/exports/HERMES_EMA_LINEAGE_META_HARNESS_AUDIT_2026-04-22.md`

2. Internalize the core rule:
   - **EMA owns truth, Hermes owns execution, surfaces do not own state.**

3. Treat place.org / OpenClaw / ClaudeForge as lineages to extract intent from, not as the final architecture.

### Next design work
4. Define the **shared collaboration state model** explicitly.
5. Define the **org/space/member/agent** model explicitly.
6. Define the **driver/harness contract** between EMA and Hermes explicitly.
7. Define the **human-agent shared workspace contract** explicitly.

### Guardrail
8. Do not start broad implementation from vibes. First pin the authority, identity, and collaboration models tightly enough that the rewrite does not reproduce historical drift.
