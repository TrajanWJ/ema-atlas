# MACBOOK AGENT HANDOFF — EMA / HERMES REWRITE

**Purpose:** single-file passover brief for another agent joining cold on a different machine.  
**Source posture:** grounded in agent-vm-visible repos/docs/runtime residue and prior synthesis work.  
**Legend:** **Confirmed** / **Likely Inference** / **Open Assumption**

---

## 1. Project one-liner

**Confirmed + Likely Inference:** This is a long-running rewrite of a human+agent operating environment toward an **EMA-centered Elixir daemon control plane**, a **Hermes-backed execution/meta-harness layer**, a **shared human-agent workspace**, and a **future P2P organization/space collaboration model** spanning agents, humans, docs/wiki/canvas, and execution surfaces.

---

## 2. Canonical rule

**Confirmed:**

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

Interpretation:
- **EMA** = control plane, execution lineage, routing/policy, canonical operator truth
- **Hermes** = execution substrate, API server, tools, memory, skills, delegation, potential top-level harness router
- **Surfaces** = Discord/web/CLI/editor; they mirror/control but should not become the durable state container

If you remember only one thing, remember that.

---

## 3. The 4 lineages that matter

### 1) place.org / placeOS lineage
**Confirmed**
- earliest visible world-model: browser-native workspace / desktop-like environment / local-first place metaphor

**What it contributed**
- workspace-as-place
- coherent operator environment ambition
- strong user-facing continuity model

### 2) EMA daemon lineage
**Confirmed**
- Elixir/Phoenix daemon-centered control plane
- repo treats `daemon/` as canonical core

**What it contributed**
- authority boundary
- execution lineage
- system-of-record discipline
- daemon-first architecture

### 3) ClaudeForge / TypeScript operator-surface lineage
**Confirmed**
- Discord/web shell with provider abstraction, session manager, event streaming

**What it contributed**
- good operator UX
- session/category/channel shell
- provider abstraction
- normalized event patterns

### 4) EMA mesh / current p2p BEAM lineage
**Confirmed + Likely Inference**
- current strategic direction is p2p-first / peer-aware / organization-scale on BEAM-family foundations

**What it contributes**
- distributed topology
- peer dispatch
- multi-user/multi-space ambition
- rejection of single-surface or single-host hidden truth as the final model

---

## 4. What the project is actually trying to become

### Confirmed
The project is not just “a coding bot” or “a Discord bot.”

### Likely Inference
It is trying to become a **shared human-agent operating environment** where:
- humans and agents share workspace state
- execution is explicit, traceable, and routable
- docs/wiki/canvas collaboration is first-class
- organizations and spaces scope collaboration and execution
- multiple surfaces can control/observe the same underlying system
- execution can eventually be dispatched across peers and harnesses

### Open Assumption
The end state may resemble a distributed collaborative work OS more than a traditional chat app.

---

## 5. Primary workflow model

### Confirmed
Current docs imply:
1. user/operator asks for work through a surface
2. EMA records/reads project context and control-plane state
3. work executes through Hermes or another runtime path
4. events/results flow back to surfaces
5. outcomes report back into EMA

### Likely Inference
Target workflow likely becomes:
1. human enters an org/space/project/workstream context
2. shared workspace state is visible to both humans and agents
3. a proposal/intent/task/execution gets created or routed
4. EMA chooses policy/placement/lineage
5. Hermes dispatches the right runtime/harness
6. outputs update both collaboration state and control-plane lineage
7. other humans/agents continue from the same state without rehydrating everything from chat

---

## 6. Major subsystems

### Confirmed
1. **EMA daemon**
   - Elixir/Phoenix canonical core
   - control-plane APIs / host-truth / execution lineage

2. **Hermes runtime**
   - API server is live on agent-vm
   - supports sessions, tools, memory, skills, delegation, ACP
   - strongest current execution substrate candidate

3. **ClaudeForge surface**
   - Discord/web operator shell
   - useful surface architecture, not intended canonical truth layer

4. **Shared workspace**
   - repo-owned `workspace/shared/`
   - meant to stop state scattering across random folders

5. **OpenClaw historical protocol layer**
   - useful source of roles, handoffs, memory discipline, watchdog ideas
   - not intended final state authority

### Likely Inference
6. **Driver / harness registry**
   - needed above raw model providers

7. **Collaboration sync layer**
   - needed for docs/wiki/canvas state coherence

8. **Org / space / permission layer**
   - needed for scoped collaboration and execution rights

9. **P2P / peer networking layer**
   - needed for distributed execution/collab transport

---

## 7. Agent orchestration model

## What an “agent” is

### Confirmed
An agent is at least:
- a session-capable execution actor
- attached to some runtime/harness/provider path
- able to emit events and work on state through tools
- associated with role/personality/project context in some lineages

### Likely Inference
Practical definition:

> An agent is a durable or semi-durable execution participant with identity, continuity, context, and the ability to act on shared artifacts under control-plane governance.

## What a “human” is relative to agents

### Likely Inference
A human is:
- operator
- collaborator
- reviewer / authority-holder
- member of org/space
- participant in shared workspace state

This is not just “user prompts agent.” It is a co-working model.

## How multiple agents coordinate

### Confirmed
- Hermes supports delegated subagents
- OpenClaw lineage had named-role/handoff/watchdog patterns

### Likely Inference
Coordination should happen through:
- explicit control-plane records
- shared workspace artifacts
- normalized event streams
- durable handoffs
- clear continuation semantics

## Boundary model

### Confirmed
EMA’s contract explicitly warns that capability locality differs across:
- human shells
- agent turns
- daemon contexts
- surfaces
- machines

### Likely Inference
Correct orchestration model:
- EMA decides **what** should run and **where**
- Hermes decides **how** the selected harness executes it
- local / daemon / peer are explicit placements, not hidden implementation details

---

## 8. Shared workspace model

### Confirmed
The project explicitly wants a **shared human-agent workspace** and already created a repo-owned shared workspace root.

### Likely Inference
Shared workspace should include durable artifacts like:
- plans
- tasks
- handoffs
- notes
- session exports
- context bundles
- docs/wiki/canvas objects
- references to execution lineage

### Likely Inference
The workspace is meant to be:
- human-readable
- agent-readable
- durable across sessions
- repo-owned or architecture-owned, not random scratch
- linkable to control-plane records

### Open Assumption
A future split may be needed between:
- file-backed workspace artifacts
- live collaboration objects
- control-plane records that reference both

---

## 9. Data / sync model

### Likely Inference
There are at least 3 distinct state classes that must not be conflated:

### A. Control-plane state
- proposals
- executions
- dispatch updates
- incidents
- policy/routing data

### B. Runtime state
- session continuity
- provider/harness IDs
- tool progress
- transient process state

### C. Collaboration/workspace state
- docs
- wiki pages
- canvas objects
- plans / notes / tasks / handoffs
- org/space-scoped collaborative artifacts

### Important rule
Surfaces should reflect all three, but own none of them canonically.

### Open Assumption
If true synchronous collaboration is required, docs/wiki/canvas likely need CRDT-style or event-log/hybrid sync semantics.

---

## 10. Networking / P2P assumptions

### Confirmed
Current strategic direction is explicitly p2p-first / mesh-oriented.

### Likely Inference
Why P2P is considered necessary:
- tools/auth/resources differ by node
- organizations/spaces imply multi-user distributed reality
- execution locality matters
- peer dispatch is part of intended architecture
- a single hidden host runtime is too limiting

### Open Assumption
The final model may be hybrid:
- logically authoritative control-plane semantics
- physically distributed execution and collaboration transport

---

## 11. Collaboration model for docs/wiki/canvas

### Confirmed
The project theme explicitly includes:
- synchronous collaboration for canvas/docs/wiki between users
- spaces inside organizations

### Likely Inference
These objects are likely meant to be first-class workspace objects, not passive attachments.

Desired properties:
- real-time multi-user collaboration
- agent-readable / possibly agent-writable state
- durable identity and history
- attribution
- linkage to execution lineage and workspace context
- org/space-scoped access controls

### Open Assumption
The cleanest architecture may require explicit doc/wiki/canvas abstractions rather than treating everything as generic files.

---

## 12. Org / space / permission model

### Confirmed
The user explicitly wants organizations and spaces.

### Likely Inference
Minimum viable model probably includes:
- **Organization** = administrative/security boundary
- **Space** = scoped collaboration + execution context inside an org
- **Members** = humans and maybe service/agent identities
- **Permissions** = read/write/comment/execute/review/admin
- **Artifacts** = docs/wiki/canvas/tasks/executions/sessions scoped to org/space

### Open Assumption
Agent rights should likely be mediated by org/space policy rather than inheriting raw tool access from the underlying host blindly.

---

## 13. Why the old approach became insufficient

### Confirmed
Historical systems drifted between:
- repo truth
- runtime truth
- surface truth
- notes/session/vault truth

### Confirmed
OpenClaw and Discord-native approaches felt good operationally but risked turning surfaces into de facto state containers.

### Confirmed
ClaudeForge/TypeScript approaches captured valuable UX/provider patterns but are not the intended long-term foundation.

### Likely Inference
Old approaches became insufficient because they could not cleanly unify:
- authority
- execution
- collaboration state
- workspace continuity
- distributed topology

---

## 14. Why Elixir and why P2P

### Why Elixir
**Confirmed + Likely Inference**
- daemon-first architecture
- supervision and resilience
- concurrency for orchestration and sync
- strong fit for long-lived control-plane logic
- aligns with the shift from UI-led truth to daemon-led truth

### Why P2P
**Confirmed + Likely Inference**
- organizations/spaces imply distributed reality
- capability locality matters
- peer dispatch matters
- collaboration should not depend on one opaque central runtime node
- the rewrite wants a mesh-oriented future from the ground up

---

## 15. Non-negotiable product properties

### Confirmed / Likely Inference
1. surfaces do not own durable truth
2. EMA remains canonical for control-plane lineage
3. execution lineage stays explicit
4. capability locality is real and must be modeled
5. humans and agents share workspace state
6. useful intent from earlier eras must be preserved
7. organizations/spaces are first-class, not afterthoughts
8. collaboration objects matter, not just chat and tasks
9. execution should be dispatchable across harnesses and eventually peers

---

## 16. Biggest unresolved questions

1. What exact objects are canonical in v1?
   - executions, docs, canvases, wiki pages, tasks, spaces, workspace artifacts?

2. How should collaboration state relate to control-plane lineage?
   - same event model or adjacent subsystem?

3. What exactly is an agent identity?
   - runtime session, actor/member, role, service principal, composite?

4. What sync model is intended for docs/wiki/canvas?
   - centralized event log, CRDT, hybrid?

5. What should replicate peer-to-peer vs remain logically centralized?

6. How should org/space permissions map onto runtime/tool permissions?

7. How far should Hermes evolve from “execution runtime” into “harness router”? 

---

## 17. Risks / likely failure modes

1. **Surface-state relapse**
   - Discord/web starts becoming canonical again

2. **Identity conflation**
   - execution IDs, local session IDs, provider IDs, and workspace IDs get mixed together

3. **Split-brain between collaboration state and execution lineage**
   - docs/wiki/canvas diverge from task/execution truth

4. **Locality blindness**
   - system assumes every human/agent/node has the same capabilities

5. **Historical overfitting**
   - old OpenClaw/ClaudeForge structures are copied too literally

6. **Premature P2P distribution**
   - unclear local semantics are distributed before being pinned down

7. **Workspace incoherence**
   - important state keeps scattering across random folders, chats, and runtime residue

---

## 18. High-value concrete finding about current implementation lineage

**Confirmed:** The older ClaudeForge repo on agent-vm already had a working Hermes backend provider seam, while the current EMA copy had regressed and needed restoration.

That means there is already precedent for this architecture:
- frontend/surface stays ClaudeForge-like
- Hermes runs as backend provider/runtime
- session continuity flows via `X-Hermes-Session-Id`

This is evidence that the **surface-vs-execution split is not hypothetical**.

---

## 19. Immediate recommendation for a new agent

Read these first:
- `docs/AGENT-CONTRACT.md`
- `docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
- `docs/HERMES_HARNESS_DRIVER_REGISTRY.md`
- `workspace/shared/exports/HERMES_EMA_LINEAGE_META_HARNESS_AUDIT_2026-04-22.md`

Then help pin these models explicitly:
1. collaboration object model
2. org/space/member/agent model
3. harness/driver contract
4. shared workspace contract
5. local semantics that distributed/P2P behavior must preserve

---

## 20. Three likely architecture mistakes to avoid

1. **Letting surfaces become the real workspace/state container again**
2. **Treating providers, runtimes, and agents as the same abstraction**
3. **Building distributed sync/orchestration before local/shared-state semantics are crisp**

---

## 21. Three questions a new agent should ask next

1. What exact shared workspace objects are first-class in v1, and how do they connect to control-plane execution records?
2. What is the minimal org/space/member/agent permission model required before orchestration can be considered correct?
3. What coherence strategy is intended for live docs/wiki/canvas collaboration across humans, agents, and peers?

---

<!-- xref-footer -->
## See also (cross-references)

This doc is part of the EMA / Hermes lineage transfer pack. For the full
navigable view, start at:

- [`README.md`](README.md) — entry point
- [`SYSTEM_GRAPH.md`](SYSTEM_GRAPH.md) — lineage map and concept edges
- [`INDEX.md`](INDEX.md) — one-page lookup of every term, node, doc
- [`AGENT_TRAVERSAL.md`](AGENT_TRAVERSAL.md) — how to load context efficiently
- [`AGENT_BOOTSTRAP.md`](AGENT_BOOTSTRAP.md) — fresh-machine setup

Definitions of terms used here (EMA, Hermes, Surface, Workspace, Driver,
Provider, Org, Project, Space, vApp, Launchpad, HQ, OpenClaw, ClaudeForge,
place.org, ...) live in [`GLOSSARY.md`](GLOSSARY.md). Use those exact spellings.

Unresolved decisions referenced here are tracked in
[`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) (Q1–Q10). When you cite an
"open question" inline, link by Q-number so it stays addressable.

Concept edges (which branches/files participate in each topic) live under
[`graph/edges/`](graph/edges/):

| Topic | Edge file |
|---|---|
| authority / control plane | [`graph/edges/authority.md`](graph/edges/authority.md) |
| execution / harness | [`graph/edges/execution.md`](graph/edges/execution.md) |
| surfaces | [`graph/edges/surfaces.md`](graph/edges/surfaces.md) |
| shared workspace | [`graph/edges/workspace.md`](graph/edges/workspace.md) |
| collaboration objects | [`graph/edges/collab.md`](graph/edges/collab.md) |
| identity (org/space/project/agent) | [`graph/edges/identity.md`](graph/edges/identity.md) |
| orchestration | [`graph/edges/orchestration.md`](graph/edges/orchestration.md) |
| memory / vault | [`graph/edges/memory.md`](graph/edges/memory.md) |
| transport / p2p | [`graph/edges/transport.md`](graph/edges/transport.md) |
| ux-metaphor | [`graph/edges/ux-metaphor.md`](graph/edges/ux-metaphor.md) |
| recovery / fixtures | [`graph/edges/recovery.md`](graph/edges/recovery.md) |

Per-branch nodes live under [`graph/nodes/<branch>.qmd`](graph/nodes/) — load
the node first, then `git show origin/<branch>:<key_artifact>` for any path
in its `key_artifacts:` frontmatter.

> Canonical rule: **EMA owns truth. Hermes owns execution. Surfaces do not own state.**
<!-- /xref-footer -->
