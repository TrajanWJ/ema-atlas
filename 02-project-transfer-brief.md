# High-Signal Project Transfer Brief

**Audience:** another expert technical agent joining the rewrite cold  
**Boundary:** VM-visible truth plus evidence-backed synthesis from EMA/Hermes/OpenClaw/ClaudeForge context  
**Legend:** **Confirmed** / **Likely Inference** / **Open Assumption**

---

## 1. Project one-liner

**Confirmed + Likely Inference:** A rewrite of a human+agent operating system toward an **EMA-centered Elixir daemon control plane**, a **Hermes-backed execution/meta-harness layer**, a **shared human-agent workspace**, and a **future P2P organization/space collaboration model** spanning agents, users, docs/wiki/canvas, and execution surfaces.

---

## 2. Core vision

### Confirmed
- EMA is intended to be the **system of record**.
- Hermes is intended to be the **execution substrate**, and is a serious candidate for the **top-level meta-harness**.
- Discord/web/CLI/editor surfaces should **mirror and control** the system, not become the canonical state container.
- The project direction is **p2p-first on a BEAM-family base**.

### Likely Inference
The real vision is not “a better coding bot.” It is a **shared human-agent environment** where:
- humans and agents inhabit the same workspace state
- collaboration objects are first-class
- execution is routable and lineage-tracked
- organizations/spaces scope people, agents, work, and permissions
- multiple surfaces can observe/control the same underlying system

### Open Assumption
The end state may resemble a distributed collaborative work OS with agent execution, knowledge/workspace state, and multi-user collaboration all treated as one coherent product surface.

---

## 3. Primary user/workflow model

### Confirmed
Current architecture docs imply this pattern:
1. a human/operator requests work through a surface
2. EMA provides/records context, control-plane state, and execution lineage
3. a runtime executes through Hermes or another harness path
4. outputs/events are reflected to surfaces
5. outcomes are reported back into EMA

### Likely Inference
Primary future workflow likely becomes:
1. user enters an org/space/project/workstream context
2. humans and agents share access to the same workspace artifacts
3. a proposal/intent/task/execution record is created or routed
4. EMA chooses placement/policy/lineage
5. Hermes dispatches the correct harness driver
6. execution results update both the shared workspace and the control plane
7. other humans/agents continue from the same state without reconstructing context ad hoc

### Open Assumption
Live collaboration on docs/canvas/wiki may become as central as chat or execution, not merely supportive.

---

## 4. System architecture as currently understood

### Confirmed
Best current rule:

**EMA owns truth. Hermes owns execution. Surfaces do not own state.**

### Confirmed components
- **EMA daemon** — Elixir/Phoenix control-plane core
- **Hermes** — execution runtime, API server, tools, memory, skills, delegation, ACP
- **ClaudeForge** — Discord/web operator surface with provider abstraction and session/event shell
- **OpenClaw** — historical multi-agent/operator-pattern lineage
- **workspace/shared/** — repo-owned shared workspace on agent-vm

### Likely Inference
Target architecture shape:

```text
Humans + Agents
    ↕
Surfaces (Discord / web / CLI / editor)
    ↕
Shared workspace + collaboration objects
    ↕
EMA control plane
  - proposals
  - executions
  - routing policy
  - incidents
  - org/space lineage
    ↕
Hermes driver / harness layer
  - hermes-native
  - claude-cli
  - codex-cli
  - peer-remote
  - simulated-tui
    ↕
Execution runtimes / peers / tools / models
```

### Open Assumption
A distinct collaboration-state subsystem may be required if docs/wiki/canvas cannot be cleanly represented as only control-plane records.

---

## 5. Major subsystems

### 5.1 EMA daemon
**Confirmed**
- Elixir/Phoenix canonical runtime/control-plane repo area
- intended source of truth for status, context, execution lineage, and operator state

### 5.2 Hermes runtime
**Confirmed**
- live API server exists
- supports sessions, tools, memory, skills, delegation, ACP/editor mode
- can serve as backend execution substrate

### 5.3 ClaudeForge surface
**Confirmed**
- Discord + web operator shell
- session manager, provider abstraction, normalized events
- useful as surface shell, not canonical state authority

### 5.4 Shared workspace
**Confirmed**
- repo-owned `workspace/shared/` exists specifically to stop context scattering
- intended as human+agent shared landing zone on agent-vm

### 5.5 Historical OpenClaw protocol layer
**Confirmed**
- contains high-value lessons on roles, memory discipline, handoffs, watchdogs, and orchestration
- should be mined for doctrine, not resurrected as final architecture

### 5.6 Driver / harness registry
**Likely Inference**
- needed to let Hermes dispatch not just providers, but harnesses/runtimes

### 5.7 Collaboration sync layer
**Likely Inference**
- needed for synchronous docs/wiki/canvas collaboration between multiple users and agents

### 5.8 Org / space / permission layer
**Likely Inference**
- needed to scope collaboration state, execution rights, and membership

### 5.9 P2P / peer networking layer
**Likely Inference**
- needed for peer dispatch, multi-device/org topology, and capability-local execution

---

## 6. Data and sync model

### Confirmed
The system already values:
- explicit execution lineage
- session continuity
- canonical read/write surfaces in EMA
- repo-owned shared workspace artifacts

### Likely Inference
Three major state classes must be separated:

#### A. Control-plane state
- proposals
- executions
- dispatch updates
- incidents
- policy/routing metadata
- operator summaries

#### B. Runtime/execution state
- live session continuity
- provider/harness IDs
- tool progress
- process state
- streaming output

#### C. Collaboration/workspace state
- docs/wiki/canvas objects
- shared notes/context
- plans/handoffs/tasks/workspace artifacts
- org/space-scoped collaborative content

### Open Assumption
To support synchronous collaboration, the system may need CRDT-like or event-log-based sync for collaboration objects, or at least a hybrid authoritative merge model.

---

## 7. Agent orchestration model

### What an “agent” is in this system

#### Confirmed
An agent is at least:
- a session-capable execution actor
- attached to a runtime/harness/provider path
- capable of tool use and event emission
- part of execution lineage and/or workspace operations

#### Likely Inference
A fuller model is:
- an actor with identity, role semantics, continuity, permissions/context, and participation in shared workspace state

### What a “human” is in relation to agents

#### Likely Inference
A human is:
- an operator / collaborator / member of orgs and spaces
- a reviewer / authority holder / participant in execution governance
- not just an input source, but a co-occupant of shared state with agents

### How agents and humans share workspace state

#### Confirmed
The project explicitly wants a shared human-agent workspace and already has a repo-owned shared workspace root.

#### Likely Inference
Shared workspace state should be:
- durable
- readable/writable by both humans and agents
- addressable from control-plane lineage
- not trapped inside transient chat history or runtime residue

### How multiple agents coordinate

#### Confirmed
- Hermes supports delegation/subagents
- OpenClaw lineage includes role/handoff/watchdog patterns

#### Likely Inference
Coordination should happen through:
- explicit task/proposal/execution contracts
- shared workspace artifacts
- event streams and dispatch updates
- clear authority in EMA

### How orchestration works across local / daemon / network boundaries

#### Confirmed
EMA agent contract emphasizes **capability locality** and warns against assuming identical access across shells, agents, daemons, and surfaces.

#### Likely Inference
Correct boundary model:
- EMA decides *what* should run and *where*
- Hermes decides *how* the chosen harness executes it
- local / daemon / peer are explicit placements
- sync back to shared state and control-plane lineage must be deliberate

---

## 8. Networking / P2P assumptions

### Confirmed
Project direction explicitly favors a P2P/mesh rewrite.

### Likely Inference
Why P2P matters here:
- execution capabilities vary by node/device
- users/agents collaborate across more than one machine
- organizations/spaces imply multi-user distributed state
- peer dispatch is part of the intended long-term architecture
- a single-host hidden truth layer is too limiting

### Open Assumption
Actual networking may end up hybrid:
- logically authoritative control-plane semantics
- physically distributed collaboration and execution transport

---

## 9. Collaboration model for canvas/docs/wiki

### Confirmed
User wants:
- synchronous canvas/docs/wiki collaboration between users
- spaces inside organizations

### Likely Inference
These are not just attachments or notes. They are likely first-class shared workspace objects that both humans and agents should inhabit.

### Desired properties
**Likely Inference**
- real-time multi-user editing
- agent-readable and agent-writable state
- durable object identity
- version/history and attribution
- execution outputs can land directly into shared collaboration objects
- collaboration state stays coherent across surfaces and peers

### Open Assumption
A clean model may require explicit document/canvas/wiki abstractions rather than treating everything as generic files or chat transcripts.

---

## 10. Org / space / permission model

### Confirmed
The theme explicitly includes organizations and spaces.

### Likely Inference
Minimum viable structure:
- **Organization** = top-level administrative/security boundary
- **Space** = scoped work/collaboration environment within an organization
- **Members** = humans and maybe service/agent identities
- **Permissions** = read/write/comment/execute/review/admin style controls
- **Artifacts** = tasks/docs/wiki/canvas/executions/sessions scoped to org/space

### Open Assumption
Agent permissions will likely need to be mediated through org/space policy instead of inheriting full raw runtime capabilities blindly.

---

## 11. Key technical constraints

### Confirmed
- Must distinguish current VM-visible truth from host-only or historical docs.
- Must avoid surface-owned truth.
- Must preserve explicit execution lineage.
- Must respect capability locality.
- Must preserve useful intent from older lineages even while redesigning foundations.

### Likely Inference
- Shared workspace semantics must be explicit before heavy implementation.
- Collaboration state and execution state must not be conflated.
- Session identity layers must remain separate.
- P2P should not be layered on top of ambiguous single-node semantics.
- Harness/driver abstraction is necessary above raw providers.

### Open Assumption
If synchronous collaboration becomes core, conflict resolution / event history / presence become product-critical, not optional implementation details.

---

## 12. Biggest unresolved questions

### Confirmed + Likely Inference
1. What exact object model is canonical in v1?
   - executions? docs? canvases? wiki pages? workspace artifacts? tasks? spaces?

2. What is the exact relationship between:
   - control-plane lineage
   - collaboration objects
   - runtime session state?

3. What is an agent identity, concretely?
   - runtime session, actor/member, named role, service principal, or some composite?

4. What collaboration sync model is intended for docs/wiki/canvas?
   - centralized event log, CRDT, hybrid?

5. What should replicate peer-to-peer versus remain logically centralized?

6. How should org/space permissions map onto runtime/tool permissions?

7. How far should Hermes evolve from “provider runtime” to “harness router”? 

---

## 13. Risks or likely failure modes

### Confirmed + Likely Inference
1. **Surface-state relapse**
   - Discord/web becomes canonical by accident.

2. **Identity conflation**
   - execution IDs, local session IDs, provider session IDs, and collaboration object IDs blur together.

3. **Split-brain between collaboration state and control-plane state**
   - docs/wiki/canvas drift away from execution lineage and task state.

4. **Locality blindness**
   - architecture assumes every agent/human/node has the same tools/auth/resources.

5. **Historical overfitting**
   - importing OpenClaw/legacy layout too literally instead of preserving only its good doctrines.

6. **Premature P2P distribution**
   - distributing an underdefined model multiplies confusion.

7. **Workspace incoherence**
   - state keeps scattering across random folders, chat surfaces, or runtime residue.

---

## 14. Recommended next steps for a new agent joining the project

### First read these
1. `docs/AGENT-CONTRACT.md`
2. `docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
3. `docs/HERMES_HARNESS_DRIVER_REGISTRY.md`
4. `workspace/shared/exports/HERMES_EMA_LINEAGE_META_HARNESS_AUDIT_2026-04-22.md`

### Internalize this rule
**EMA owns truth. Hermes owns execution. Surfaces do not own state.**

### Then help pin these models explicitly
1. the canonical collaboration object model
2. the org/space/member/agent model
3. the driver/harness contract
4. the shared human-agent workspace contract
5. the single-node sync semantics that P2P must preserve

### Avoid this trap
Do not jump into broad implementation before authority, identity, and collaboration-state semantics are tight enough to prevent recreating historical drift.

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
