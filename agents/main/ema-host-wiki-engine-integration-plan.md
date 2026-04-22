# Plan: EMA Host + Wiki Engine + OpenClaw/MCP/CLI Integration

**Generated**: 2026-04-06 UTC  
**Estimated Complexity**: High  
**Status**: Proposed architecture + phased implementation plan

## Overview

EMA should be re-centered around the **host machine** as the real runtime environment, with the **Wiki Engine as the semantic core of the Second Brain**. OpenClaw remains important, but as a **bridge/runtime/operator shell/backup surface**, not the canonical brain. MCP and CLI should both expose the host EMA and Wiki Engine cleanly so agents and humans can use the same substrate.

This plan assumes the following architectural decisions are now true:

- **Real EMA lives on the host machine**
- **Wiki Engine is the move** and becomes the core of the Second Brain
- **OpenClaw is backup + bridge + agent runtime surface**, currently mostly serving as:
  - agent runtime/orchestration surface
  - Discord bridge
  - fallback path for EMA-adjacent capabilities
- **`dispatch.db` is no longer primary at all**
- The desired first demoable end-state is:
  - **OpenClaw ↔ MCP ↔ host EMA ↔ Wiki Engine ↔ vault**, working as one coherent loop
- “**Babysitter**” refers specifically to the earlier working Discord/OpenClaw babysitter behavior that successfully managed other channels/sessions. That behavioral pattern should be restored, not replaced by a purely cosmetic dashboard.

## Target Architecture

### Canonical layers

1. **Source content layer**
   - Host vault markdown files
   - Host-side project docs, notes, session artifacts

2. **Semantic memory layer**
   - **Wiki Engine**
   - pages, backlinks, edges, versions, spaces, graph queries
   - this is the **canonical cognitive substrate**

3. **EMA host control plane**
   - task/proposal/session/context/outcome logic
   - context assembly from Wiki Engine first
   - host-native services and APIs

4. **Access surfaces**
   - **CLI** (`ema`) on host as primary human/operator interface
   - **MCP** as primary agent/tool interface
   - **OpenClaw** as messaging/runtime/operator shell/fallback integration surface
   - Discord bridge as current high-value operating surface

5. **Legacy/transitional execution layer**
   - old shell dispatch pieces
   - older agent-vm EMA artifacts
   - compatibility bridges only while migration is underway

### Architectural principle

EMA should no longer be thought of as:

> dispatch system with memory attached

It should be thought of as:

> host-native second brain with execution, orchestration, messaging, and agent runtimes attached

## Canonical Responsibilities

### Wiki Engine
- Canonical semantic memory substrate
- Graph of pages, links, concepts, projects, decisions, learnings
- Primary retrieval engine for context assembly
- Durable knowledge representation over vault/source docs

### Host EMA
- Owns task/proposal/session/context/outcome logic
- Assembles context from Wiki Engine + live host state
- Exposes operations through API/CLI/MCP
- Maintains authoritative runtime behavior for actual EMA features

### MCP
- First-class machine interface to EMA and Wiki Engine
- Should expose **all** major functions, in particular:
  - wiki search
  - page graph / backlinks / related pages
  - context assembly
  - task/proposal/session operations
  - host/system-aware actions where appropriate

### CLI
- Already exists and should remain a first-class interface
- Should be validated as a host-native control surface rather than treated as secondary
- Must align with real host EMA, not stale agent-vm assumptions

### OpenClaw
- Secondary to host EMA, but strategically useful
- Current role: mostly runtime/orchestration + Discord bridge
- Desired role: **backup + operator shell + bridge into real host EMA**
- Must not become the source of truth for memory or core state

## Deprecation / Keep / Transitional Map

### Keep
- Host EMA as canonical runtime
- Wiki Engine as canonical semantic memory layer
- `ema` CLI as primary human/operator surface
- MCP as primary agent/tool surface
- OpenClaw as backup/runtime/bridge
- Discord bridge behavior where it works as a real operating surface

### Transitional
- agent-vm EMA daemon and associated support services
- older bridge code that still provides useful access paths
- shell dispatch fragments that are still actively enabling flow
- compatibility wrappers around old APIs while CLI/MCP/host services stabilize

### Kill or aggressively demote
- `dispatch.db` as anything resembling source-of-truth state
- architecture that frames execution queue state as the center of the system
- duplicated memory stacks that compete with Wiki Engine as primary cognitive layer
- stale assumptions that real EMA is on the VM rather than the host

## Sprint 1: Establish Canonical Architecture
**Goal**: Make the architecture unambiguous in docs, naming, and mental model.

**Demo/Validation**:
- A single architecture memo exists that clearly states host EMA + Wiki Engine + OpenClaw/MCP/CLI roles
- Team can answer “what is canonical?” without contradiction
- `dispatch.db` is explicitly documented as non-primary

### Task 1.1: Write the canonical architecture memo
- **Location**: `~/Projects/ema/docs/` and/or host wiki docs; mirrored plan source in this workspace
- **Description**: Create/update a formal architecture memo establishing:
  - real EMA on host
  - Wiki Engine as semantic Second Brain core
  - OpenClaw as backup/runtime/bridge
  - MCP and CLI as first-class access paths
  - `dispatch.db` no longer primary
- **Dependencies**: None
- **Acceptance Criteria**:
  - Memo explicitly names canonical layers and responsibilities
  - Memo includes deprecation/transitional map
  - Memo includes Babysitter meaning and target behavior
- **Validation**:
  - Review document against current repo/docs contradictions

### Task 1.2: Update EMA docs to remove ambiguity
- **Location**: `~/Projects/ema/docs/ARCHITECTURE.md`, `EMA-FULL-CONTEXT.md`, `INTEGRATION_GUIDE.md`, related wiki notes
- **Description**: Update existing docs so they stop presenting agent-vm/dispatch.db/old daemon topology as canonical when it isn’t.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Host EMA is clearly primary
  - Wiki Engine is clearly primary memory substrate
  - `dispatch.db` is clearly non-primary
  - OpenClaw role is clearly subordinate/bridge-oriented
- **Validation**:
  - Grep docs for outdated “primary” claims and resolve them

### Task 1.3: Define the Babysitter restoration target
- **Location**: new spec doc under `~/Projects/ema/docs/` and linked wiki page
- **Description**: Write a focused spec for the *behavioral* Babysitter:
  - manages Discord channels/sessions
  - monitors channel/session state
  - nudges/reroutes/escalates
  - acts as visible operator/governor layer
  - not just a stream ticker
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Spec distinguishes old working babysitter behavior from current partial replacements
  - Includes operational inputs, outputs, and authority boundaries
- **Validation**:
  - Cross-check spec against remembered old OpenClaw-only setup behavior

## Sprint 2: Make Wiki Engine the Actual Second Brain Core
**Goal**: Ensure Wiki Engine is not just “important,” but operationally central.

**Demo/Validation**:
- Host EMA context assembly prefers Wiki Engine
- Wiki graph can answer project/decision/context queries that matter to execution
- Duplicate retrieval paths are classified as subordinate or deprecated

### Task 2.1: Inventory all memory/retrieval paths
- **Location**: host EMA docs + wiki docs
- **Description**: Catalog all active knowledge layers: vault files, wiki engine DB/API, second_brain_fts, QMD-like search, MCP retrieval wrappers, ad hoc indexes.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Every retrieval path classified as canonical / supporting / transitional / kill
- **Validation**:
  - Produce a comparison table with owner, consumers, and future status

### Task 2.2: Define Wiki Engine as primary retrieval contract
- **Location**: integration/API docs
- **Description**: Specify the retrieval contract host EMA should rely on from Wiki Engine:
  - search
  - backlinks
  - related pages
  - edges
  - versions
  - project space queries
  - context bundle assembly hooks
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Contract includes request/response shapes or at least clear semantics
- **Validation**:
  - Can map common EMA context questions onto the contract cleanly

### Task 2.3: Demote or fold duplicate FTS/index layers
- **Location**: implementation backlog + docs
- **Description**: Decide whether `second_brain_fts` is:
  - folded into Wiki Engine,
  - retained as a cache under Wiki Engine,
  - or retired.
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - There is one clearly primary retrieval path
  - Duplicate indexes are no longer competing for authority
- **Validation**:
  - Architecture review yields a single answer for “where does context come from first?”

## Sprint 3: Expose Host EMA Through MCP Cleanly
**Goal**: Make MCP the primary agent-facing contract into real host EMA + Wiki Engine.

**Demo/Validation**:
- An agent can use MCP to query wiki, assemble context, inspect sessions/tasks/proposals, and trigger real operations on host EMA

### Task 3.1: Define the first-class MCP tool surface
- **Location**: MCP server docs/spec
- **Description**: Define the MCP namespace/tool set for host EMA. Include all of:
  - wiki search
  - wiki page fetch/tree/related/backlinks/graph
  - context assembly
  - task operations
  - proposal operations
  - session operations
  - host EMA health/status
  - babysitter state/actions where appropriate
- **Dependencies**: Sprint 2
- **Acceptance Criteria**:
  - Tool taxonomy exists and is grouped by domain
- **Validation**:
  - Example agent workflows can be expressed using only those MCP tools

### Task 3.2: Point MCP at host EMA, not stale VM assumptions
- **Location**: MCP server implementation/config
- **Description**: Ensure MCP calls target real host EMA/Wiki Engine endpoints or local host-native logic.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - MCP no longer assumes VM EMA is canonical
- **Validation**:
  - End-to-end test from agent runtime to host EMA succeeds

### Task 3.3: Add context-assembly MCP tools
- **Location**: MCP server implementation
- **Description**: Provide a machine-callable context assembler that returns a bounded context package sourced from Wiki Engine first.
- **Dependencies**: Task 3.2
- **Acceptance Criteria**:
  - Tool can produce context for project/task/session inputs
  - Output is budget-aware and graph-informed
- **Validation**:
  - Test with one real EMA workflow and inspect relevance

## Sprint 4: Confirm and Tighten the Host CLI
**Goal**: Validate `ema` as the primary human/operator interface to host EMA.

**Demo/Validation**:
- `ema` commands clearly operate real host EMA/Wiki Engine-backed functions
- CLI help/docs match reality

### Task 4.1: Audit current CLI against real host behavior
- **Location**: `~/Projects/ema/cli/ema_cli/`
- **Description**: Map current CLI commands to:
  - real host-backed
  - mock-only
  - stale/legacy
  - missing-but-required
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Full command matrix exists
- **Validation**:
  - Running command samples confirms categories

### Task 4.2: Remove or quarantine stale command groups
- **Location**: CLI implementation/docs
- **Description**: Demote or remove command groups that imply old OpenClaw/dispatch-centric truth when they are no longer canonical.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - CLI stops misleading operators about what is real
- **Validation**:
  - `ema --help` reflects canonical architecture

### Task 4.3: Add wiki-engine-first CLI workflows
- **Location**: CLI commands/docs
- **Description**: Ensure the CLI has obvious commands for:
  - searching wiki knowledge
  - inspecting related pages/graph context
  - assembling task/session context
  - invoking host EMA operations with wiki-backed context
- **Dependencies**: Sprint 2, Sprint 3
- **Acceptance Criteria**:
  - At least one end-to-end wiki-backed flow is runnable via CLI
- **Validation**:
  - Demonstrate a context-rich task/session inspection from CLI

## Sprint 5: Embed Host EMA Functioning into OpenClaw
**Goal**: Make OpenClaw a useful bridge/operator shell into host EMA without making it the brain.

**Demo/Validation**:
- OpenClaw can answer EMA questions using host EMA/wiki data
- OpenClaw can invoke real EMA/MCP operations
- Discord/OpenClaw Babysitter behavior begins to reappear in useful form

### Task 5.1: Define OpenClaw’s bridge contract to host EMA
- **Location**: integration doc + OpenClaw-facing wrapper definitions
- **Description**: Decide exactly how OpenClaw reaches host EMA:
  - via MCP tools
  - via direct API wrappers
  - via CLI wrappers
  - or a combination with preference ordering
- **Dependencies**: Sprint 3, Sprint 4
- **Acceptance Criteria**:
  - One preferred path is chosen
  - Fallback order is documented
- **Validation**:
  - Manual request can be traced cleanly from OpenClaw to host EMA

### Task 5.2: Build/restore the practical Discord bridge behavior
- **Location**: OpenClaw integration layer + host EMA/Babysitter spec implementation
- **Description**: Recreate the useful old pattern where a babysitter-like component can:
  - observe Discord channels/sessions
  - keep track of what is happening where
  - redirect/nudge/escalate
  - coordinate surface behavior
- **Dependencies**: Task 1.3, Task 5.1
- **Acceptance Criteria**:
  - Behavior is operationally useful, not just visible telemetry
- **Validation**:
  - Live Discord test with multiple channels/sessions shows active management behavior

### Task 5.3: Add OpenClaw-facing EMA operator commands
- **Location**: OpenClaw skill/tool wrappers or integrations
- **Description**: Expose useful host EMA actions to OpenClaw, such as:
  - ask EMA/wiki
  - assemble context
  - inspect sessions
  - inspect tasks/proposals
  - trigger babysitter actions
- **Dependencies**: Task 5.1
- **Acceptance Criteria**:
  - OpenClaw becomes a usable operator shell for host EMA
- **Validation**:
  - Complete one workflow entirely from OpenClaw chat

## Sprint 6: Migrate Runtime Truth Away from Legacy Execution Structures
**Goal**: Ensure old execution-era artifacts no longer distort the architecture.

**Demo/Validation**:
- Legacy pieces can still run if needed, but are clearly non-canonical
- New work does not depend on `dispatch.db` being primary

### Task 6.1: Reclassify `dispatch.db` in docs and code comments
- **Location**: docs, scripts, comments
- **Description**: Mark `dispatch.db` as legacy/transitional/compat rather than primary operational truth.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - No primary-architecture doc presents `dispatch.db` as authoritative
- **Validation**:
  - Search docs/comments for outdated claims and fix them

### Task 6.2: Move new logic off dispatch-centric assumptions
- **Location**: host EMA planning backlog and implementation targets
- **Description**: Ensure new tasks/proposals/sessions/context work target host EMA + wiki contracts, not flat queue-era state assumptions.
- **Dependencies**: Sprint 3, Sprint 4
- **Acceptance Criteria**:
  - New features are designed around host EMA and Wiki Engine
- **Validation**:
  - Review new feature specs for dependencies on legacy queue truth

### Task 6.3: Keep only compatibility shims where they buy real value
- **Location**: wrappers/scripts
- **Description**: Preserve legacy components only where they still provide working utility; otherwise retire them.
- **Dependencies**: Task 6.2
- **Acceptance Criteria**:
  - Each retained legacy piece has an explicit justification
- **Validation**:
  - Compatibility matrix exists with retention reasons

## Sprint 7: First Full Demoable End-State
**Goal**: Achieve the desired “good” loop.

**Demo/Validation**:
- **OpenClaw ↔ MCP ↔ host EMA ↔ Wiki Engine ↔ vault** works as a coherent loop

### Task 7.1: Demo query path
- **Location**: integrated runtime
- **Description**: A request from OpenClaw can:
  - hit MCP
  - pull host EMA context
  - query Wiki Engine
  - return grounded output
- **Dependencies**: Sprints 2–5
- **Acceptance Criteria**:
  - Output is clearly sourced from real host EMA/wiki state
- **Validation**:
  - Live end-to-end test

### Task 7.2: Demo operator path
- **Location**: integrated runtime
- **Description**: From OpenClaw or CLI, inspect and manage real host EMA state using the new contracts.
- **Dependencies**: Sprints 3–5
- **Acceptance Criteria**:
  - Session/task/context inspection works from both CLI and agent/operator surface
- **Validation**:
  - Live end-to-end test

### Task 7.3: Demo Babysitter path
- **Location**: Discord/OpenClaw/host EMA integration
- **Description**: Show restored babysitter-like management behavior across Discord channels/sessions.
- **Dependencies**: Task 1.3, Task 5.2
- **Acceptance Criteria**:
  - Babysitter does meaningful coordination or governance work, not just reporting
- **Validation**:
  - Live multi-channel test

## Testing Strategy

- **Architecture consistency tests**
  - docs/state/contracts all agree on what is canonical
- **CLI tests**
  - verify commands hit real host EMA and expose wiki-backed workflows
- **MCP tests**
  - verify tool coverage and host targeting
- **Integration tests**
  - OpenClaw → MCP → host EMA → Wiki Engine
- **Operational tests**
  - Discord bridge + Babysitter behavior across channels/sessions
- **Regression tests**
  - ensure legacy components kept for compatibility do not silently become primary again

## Potential Risks & Gotchas

- **Reality drift in docs**: existing docs may keep reasserting old VM/dispatch-centric architecture
- **Dual-truth systems**: if host EMA and legacy VM systems both continue evolving, operators will get confused
- **CLI ambiguity**: current CLI has real and legacy/mock paths mixed together
- **MCP fragmentation**: if some tools hit host EMA and others still hit stale VM services, agent behavior will be inconsistent
- **Babysitter confusion**: current “babysitter” implementations may look similar on paper but not reproduce the old useful Discord-governor behavior
- **Wiki Engine underuse**: saying it is primary is easy; actually routing context assembly through it is the hard part
- **Legacy glue persistence**: compatibility shims can quietly become permanent architecture if not actively constrained

## Rollback Plan

- Keep transitional wrappers for legacy execution/bridge surfaces while migration proceeds
- Avoid destructive retirement of old services until host EMA + Wiki Engine + MCP + CLI path is proven end-to-end
- Preserve OpenClaw as backup bridge/runtime path even as host EMA becomes canonical
- Stage cutovers by interface:
  1. docs truth
  2. MCP truth
  3. CLI truth
  4. OpenClaw truth
  5. legacy retirement

## First 5 Implementation Moves

1. **Write/update the canonical architecture memo** establishing host EMA + Wiki Engine + OpenClaw/MCP/CLI roles
2. **Audit current CLI and MCP surfaces** against real host EMA topology
3. **Define the Wiki Engine retrieval/context contract** that host EMA should use first
4. **Write the Babysitter restoration spec** based on the old working Discord/OpenClaw behavior
5. **Build one end-to-end OpenClaw → MCP → host EMA → Wiki Engine demo path** before broader migration work
