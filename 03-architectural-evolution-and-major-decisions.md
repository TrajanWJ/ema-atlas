# Architectural Evolution and Major Decisions Over Time

**Audience:** technical agent joining the rewrite  
**Legend:** **Confirmed** / **Inferred** / **Speculative**

---

## 1. Original intent

### Confirmed
The earliest visible lineages were trying to build a highly integrated environment where computing, workspace, and agent behavior felt like one coherent place rather than disconnected tools.

### Confirmed
The `place.org` / early workspace lineage was trying to create a **browser-native desktop/personal workspace / local-first environment**.

### Inferred
From there, the deeper intent appears to have been:
- unify knowledge, tasks, sessions, and execution
- make the environment itself feel agent-aware
- treat agents as first-class collaborators rather than bolt-on chatbots
- give the operator a strong sense of place, continuity, and control

### Speculative
Even very early on, the product ambition may already have been closer to a “shared operating environment” than a simple app or assistant.

---

## 2. What changed over time

### Confirmed
The project evolved across multiple lineages rather than one straight implementation path:
1. **place.org / workspace OS lineage**
2. **EMA daemon / Elixir control-plane lineage**
3. **ClaudeForge / TypeScript operator-surface lineage**
4. **current EMA mesh / p2p BEAM lineage**

### Confirmed
The TypeScript/ClaudeForge era proved useful ideas around:
- operator-facing surfaces
- provider abstractions
- session/event normalization
- Discord/web mirroring

### Confirmed
The OpenClaw era proved useful ideas around:
- named roles
- multi-agent coordination
- memory discipline
- handoffs and watchdog patterns
- Discord-native operator feel

### Inferred
What changed strategically is that the project stopped treating these as “the system” and started treating them as **partial lineages containing useful intent**.

### Inferred
The center of gravity moved toward:
- daemon-centered authority
- explicit execution lineage
- shared workspace coherence
- distributed/peer-aware architecture

---

## 3. Why the old approach became insufficient

### Confirmed
Old approaches created drift between:
- repo truth
- runtime truth
- surface truth
- notes/session/vault truth

### Confirmed
OpenClaw and Discord-native systems produced valuable operator patterns but also config/runtime/auth drift and a tendency for the surface to become the de facto state container.

### Confirmed
TypeScript/ClaudeForge-like surfaces were useful, but the repo itself already describes them as **adjacent operator surface / experimental UI**, not canonical EMA core.

### Inferred
The older approaches became insufficient because they could not cleanly unify these concerns under one coherent authority model:
- execution lineage
- runtime orchestration
- shared workspace state
- collaboration objects
- multi-user / multi-node topology

### Inferred
Specific breakdowns likely included:
- surface-led truth instead of system-led truth
- identity conflation between UI sessions and backend/runtime continuity
- scattered context across repos, runtime dirs, Discord channels, vault/wiki mirrors, and logs
- insufficiently explicit capability locality across machines/users/agents
- no stable abstraction above providers for runtime harness selection

### Speculative
The earlier architecture may have been good enough for single-operator or chat-centric workflows, but not for the larger ambition of shared organizations/spaces with synchronous collaboration and distributed execution.

---

## 4. Why Elixir is strategically appropriate

### Confirmed
EMA is already anchored in an Elixir/Phoenix daemon lineage.

### Confirmed
The repo treats `daemon/` as the canonical EMA runtime and says that if you want one thing running, run the daemon.

### Inferred
Elixir is strategically appropriate because the project needs:
- a durable daemon core
- supervision and resilience
- evented control-plane logic
- concurrency for orchestration, sessions, and sync
- a runtime that naturally supports long-lived processes and actor-like components

### Inferred
Elixir also makes sense because the project is no longer just a UI shell or bot frontend. It is trying to be:
- control plane
- coordination engine
- sync boundary
- execution lineage authority

### Speculative
If collaboration, orchestration, and peer routing all become central, BEAM may be more than just a good backend choice—it may become the natural substrate for the entire system’s semantics.

---

## 5. Why P2P is strategically appropriate

### Confirmed
Project direction explicitly says the system is being reconstructed as **p2p-first** on a BEAM-family base.

### Confirmed
EMA mesh / peer / distributed organization docs exist in the visible lineage.

### Inferred
P2P is strategically appropriate because the project wants:
- organizations and spaces
- multi-user collaboration
- agent execution across different nodes with different capabilities
- peer dispatch
- less dependence on one opaque central runtime host

### Inferred
P2P matters especially because capabilities are local:
- tools differ by machine
- auth differs by machine
- device context differs by machine
- execution placement should be policy-aware

### Speculative
The final system may use a hybrid model where control-plane semantics are authoritative, but execution and collaboration transport are distributed peer-to-peer.

---

## 6. Non-negotiable product properties

### Confirmed
1. **Surfaces do not own state.**
2. **EMA remains the system of record.**
3. **Execution lineage must be explicit.**
4. **Capability locality must be respected.**

### Inferred
5. **Humans and agents must share workspace state**, not merely exchange prompts.
6. **Historical intent must be preserved** even when old stacks are abandoned.
7. **Organizations/spaces must be first-class**, not bolted on later.
8. **Docs/wiki/canvas collaboration is core product behavior**, not peripheral content storage.
9. **Execution should be dispatchable across harnesses and eventually peers.**

### Speculative
10. **Presence and co-activity** across humans and agents may become just as important as task execution itself.

---

## 7. Design principles for the rewrite

### Confirmed
- Prefer present-tense verified reality over stale aspiration.
- Treat the project as a lineage across eras, not a pile of unrelated repos.
- Preserve useful intent from prior “wrong-stack” eras.

### Confirmed / Inferred
Core design principles that now follow:

1. **Authority before surface**
   - control-plane truth must be explicit and independent of Discord/web/UI affordances

2. **Execution is a substrate, not the authority**
   - Hermes or any runtime should execute under EMA lineage rather than becoming a shadow state machine

3. **Workspace state must be shared and durable**
   - humans and agents need a common place to operate from

4. **Identity layers must stay separate**
   - execution IDs, provider session IDs, UI session IDs, collaboration object IDs, and peer identities must not collapse into each other

5. **Harnesses are not just providers**
   - model providers and runtime harnesses must be treated as different abstractions

6. **Local semantics before distributed semantics**
   - do not spread ambiguity across peers

7. **Extract doctrine, not residue**
   - OpenClaw/ClaudeForge/place.org should contribute principles and useful mechanisms, not accidental baggage

### Speculative
8. **Collaboration objects may need to be first-class actors in the architecture**, not passive files stored somewhere behind the scenes.

---

## 8. Critical tradeoffs to keep in mind

### Confirmed / Inferred

#### A. Surface quality vs architectural authority
- **Benefit of strong surfaces:** operator adoption, usability, legibility
- **Risk:** surface starts silently owning truth again

#### B. Fast reuse of legacy structures vs clean redesign
- **Benefit of reuse:** faster progress, preserved know-how
- **Risk:** historical drift patterns get reimported

#### C. Single-node clarity vs early distributed ambition
- **Benefit of local-first semantics:** cleaner authority model
- **Risk of delaying P2P too long:** architecture may ossify around single-host assumptions

#### D. Flexible agent behavior vs explicit governance
- **Benefit of flexibility:** rapid iteration and creative execution
- **Risk:** unclear permissions, hard-to-trace behavior, tool misuse, inconsistent authority boundaries

#### E. Unified state model vs separated subsystems
- **Benefit of one model:** conceptual simplicity
- **Risk:** collaboration state, execution state, and control-plane state have different semantics and may need adjacent but distinct treatment

#### F. Runtime diversity vs integration burden
- **Benefit:** best harness for each task/context
- **Risk:** event normalization, identity continuity, and policy enforcement become harder

### Speculative
The deepest tradeoff may be this:
- whether the system should behave more like a **distributed collaborative workspace with orchestration inside it**
- or like an **execution control plane with collaboration layered on top**

That choice likely affects almost every major abstraction downstream.
