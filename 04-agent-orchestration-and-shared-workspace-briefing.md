# Agent-Orchestration and Shared-Workspace Briefing

**Audience:** technical agent helping design implementation strategy  
**Legend:** **Confirmed** / **Likely Inference** / **Open Assumption**

---

## 1. What an “agent” is in this system

### Confirmed
An agent is not merely an LLM call. In the visible architecture lineages, an agent is at least:
- a session-capable execution actor
- tied to a runtime/harness/provider path
- capable of emitting structured or semi-structured events
- potentially associated with a role, personality, or project context
- able to act on workspace state and/or tasks through tools

### Likely Inference
A useful practical definition is:

> An agent is a durable or semi-durable execution participant with identity, continuity, context, and access to work on shared artifacts under control-plane governance.

### Open Assumption
In the eventual rewrite, agent identity may need to become a first-class member type within org/space models rather than staying an implementation detail of runtimes.

---

## 2. What a “human” is in relation to agents

### Confirmed / Likely Inference
A human is not just a message author. The architecture implies a human is:
- an operator
- a collaborator
- a reviewer/authority holder
- a participant in shared workspace state
- a member of an org/space with scoped permissions

### Likely Inference
The intended human-agent relationship is not “user commands bot.” It is closer to:
- co-occupants of a workspace
- participants with different authority/capability profiles
- collaborators on the same tasks, documents, plans, and execution lineage

### Open Assumption
A future presence model may treat humans and agents as parallel actor classes with different permissions, latency, and review semantics.

---

## 3. How agents and humans share workspace state

### Confirmed
- The project explicitly wants a **shared human-agent workspace**.
- A repo-owned shared workspace exists at `workspace/shared/` to stop state scattering.
- The architecture direction rejects chat surfaces as the main durable state container.

### Likely Inference
Shared workspace state should include things like:
- plans
- handoffs
- tasks
- notes
- context exports
- documents/wiki/canvas objects
- references into execution lineage

### Likely Inference
Humans and agents should share state through durable artifacts, not only by re-explaining context in chat.

### Practical implication
A workspace artifact should ideally be:
- addressable
- attributable
- durable
- visible to both humans and agents
- linkable to control-plane records
- safe to continue from across sessions/surfaces

### Open Assumption
There may need to be a split between:
- file-backed shared workspace artifacts
- live collaboration objects (canvas/docs/wiki)
- control-plane records referencing both

---

## 4. How multiple agents coordinate

### Confirmed
- Hermes already supports delegated subagents.
- OpenClaw lineage contains explicit role/handoff/watchdog patterns.
- Current project direction values orchestrated multi-agent work, not just one interactive session.

### Likely Inference
Multiple agents should coordinate through a combination of:
1. **control-plane intent/execution records**
2. **shared workspace artifacts**
3. **normalized event streams**
4. **clear continuation/handoff semantics**

### Likely Inference
Good coordination probably means:
- one canonical task/execution identity
- explicit role or target assignment
- durable handoff artifacts
- status transitions visible to both humans and agents
- the ability to resume/continue without reconstructing everything from chat logs

### Open Assumption
The system may eventually need explicit orchestration primitives like:
- role assignment
- dependency graph / work queue
- watcher / babysitter / reconciler processes
- collaborative locking or merge rules on shared objects

---

## 5. How orchestration is expected to work across local / daemon / network boundaries

### Confirmed
EMA’s agent contract explicitly emphasizes **capability locality** and warns that human shells, agent turns, daemon contexts, and surfaces may all have different access to:
- SSH
- local files
- auth material
- provider credentials
- host tools

### Confirmed
The project wants orchestration to be grounded in EMA’s canonical state rather than ad-hoc runtime-local assumptions.

### Likely Inference
The intended boundary model is:
- **Human/surface layer** initiates or supervises work
- **EMA** owns canonical dispatch/execution lineage and target selection
- **Hermes** (or another runtime driver) performs execution
- **local / daemon / peer** are explicit placements chosen based on policy and capability locality

### Likely Inference
Correct orchestration requires explicit transport of:
- task identity
- context references
- continuation IDs
- outputs/status
- review/approval requirements

### Open Assumption
The long-term design likely wants a formal driver registry so orchestration can choose between:
- `hermes-native`
- `claude-cli`
- `codex-cli`
- `peer-remote`
- `simulated-tui`

without pretending these are just interchangeable “providers.”

---

## 6. How collaboration state should stay coherent across users and agents

### Confirmed
The project theme explicitly includes synchronous collaboration on canvas/docs/wiki between users.

### Likely Inference
Coherence requires at least these guarantees:
1. a shared object identity model
2. durable version/history semantics
3. attribution of changes
4. explicit linkage between collaboration objects and execution lineage
5. consistent access/permission boundaries by org/space

### Likely Inference
State coherence will break if the architecture treats:
- live docs/wiki/canvas edits
- workspace files
- execution/task records

as unrelated silos.

### Likely Inference
A robust model likely needs:
- object references across layers
- event or change logs
- merge/conflict semantics
- presence/awareness semantics if true synchronous editing is desired

### Open Assumption
A CRDT or hybrid event-log-based sync model may be necessary, but that is not yet confirmed from visible implementation.

---

## 7. What abstractions or primitives seem central

### Confirmed / Likely Inference
The following primitives look central:

#### A. **Execution lineage primitives**
- proposal
- execution
- dispatch-update
- complete/fail
- session binding

These anchor orchestration and accountability.

#### B. **Workspace primitives**
- plan
- task
- handoff
- session artifact
- shared export / note / context bundle

These anchor human-agent continuity.

#### C. **Identity primitives**
- execution ID
- local session ID
- provider session ID
- workspace artifact ID
- org/space/member identity

These must remain distinct.

#### D. **Placement primitives**
- local
- daemon
- peer
- host affinity
- capability locality

These anchor distributed orchestration decisions.

#### E. **Collaboration object primitives**
- document
- wiki page
- canvas object
- shared note / workspace artifact

These anchor synchronous multi-user + multi-agent work.

#### F. **Harness/driver primitives**
- hermes-native
- claude-cli
- codex-cli
- peer-remote
- simulated-tui

These anchor execution routing above raw model providers.

### Open Assumption
If the project goes fully toward organizations/spaces, “actor membership in a space” may become a primary abstraction alongside execution and collaboration objects.

---

## 8. What failure cases matter most

### Confirmed / Likely Inference

#### 1. Surface-owned truth relapse
Discord/web/other surfaces become the actual system again.

#### 2. Identity conflation
- local session IDs
- provider session IDs
- execution IDs
- workspace object IDs
- peer identities

start getting mixed together.

#### 3. Split-brain between collaboration and control-plane state
Docs/wiki/canvas evolve independently of task/execution reality.

#### 4. Capability-locality bugs
Orchestration assumes tools/auth/resources exist everywhere.

#### 5. Context scattering
Agents continue storing important state in arbitrary folders, chat logs, or runtime residues instead of shared workspace/canonical systems.

#### 6. Multi-agent overwrite/conflict
Two agents edit or reason from the same workspace object with no merge, lock, or sequencing rule.

#### 7. P2P before semantic clarity
The system distributes ambiguous single-node behavior across peers and makes reconciliation much harder.

#### 8. Historical overfitting
Legacy OpenClaw/ClaudeForge structures get copied directly instead of abstracted into better primitives.

---

## 9. Design reading for another agent

### Confirmed
When helping with implementation strategy, assume these rules unless explicitly superseded:
- EMA owns truth
- Hermes owns execution
- surfaces do not own durable state
- capability locality is real
- the shared workspace is part of the architecture, not a convenience folder

### Likely Inference
The “right” strategy work is not just adding more agent features. It is defining the interfaces between:
- control-plane records
- collaboration objects
- shared workspace artifacts
- execution harnesses
- org/space/member permissions

### Open Assumption
The hardest real design problem may be not orchestration alone, but **coherent shared state across humans, agents, and peers**.

---

## 10. Three likely architecture mistakes to avoid

1. **Treating chat/session surfaces as if they are the workspace**
2. **Treating providers, runtimes, and agents as if they are the same abstraction**
3. **Adding distributed orchestration before pinning local/shared-state semantics and identity boundaries**

---

## 11. Three questions a new agent should ask next

1. **What exact artifacts are first-class shared workspace objects in v1, and how do they relate to control-plane execution records?**
2. **What is the minimal org/space/member/agent permission model that must exist before orchestration can be considered correct?**
3. **What coherence strategy is intended for live docs/wiki/canvas collaboration across humans, agents, and peers?**
