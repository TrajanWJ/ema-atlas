# EMA Master Spec

> **Status:** Comprehensive implementation spec  
> **Scope:** EMA daemon, MCP/CLI/backend, host Claude/Codex sessions, dispatch engine, intents/proposals/executions, human mirror/wiki layers, GUI/TUI operator surfaces, Discord/OpenClaw/ClaudeForge integration  
> **Mode:** Build on the existing system. Tighten, unify, and complete. Do **not** redesign from scratch.

---

## 0. Executive Summary

EMA should become a **comprehensive agent workspace** for one human operator.

It is not just:
- a daemon,
- a Discord bot,
- a proposal engine,
- a vault search index,
- a host session watcher,
- or a CLI.

It is the system that binds all of those into one operational loop.

### The target system

EMA should provide:

- a **runtime control plane** for intents, proposals, executions, outcomes, sessions, and surfaces
- a **semantic mirror** in the human’s vault/wiki
- a **host-native agent session layer** for Claude and Codex
- a **shared MCP-backed capability surface** across agents/providers
- a **dispatch engine** that turns approved work into running executions
- a **human-facing GUI and TUI** that both reflect the same truth
- **surface bindings** to Discord/OpenClaw/ClaudeForge without splitting the brain

### The target loop

The first critical loop EMA must support is:

**intent → approved proposal → execution → outcome → intent update → optional follow-on intent**

That loop should be:
- provider-aware
- session-aware
- vault-aware
- surface-bindable
- MCP-backed
- inspectable in GUI and TUI

### Design stance

This spec intentionally prefers:
- one authoritative runtime model
- explicit truth boundaries
- additive integration
- gradual hardening
- fewer sources of truth

over:
- autonomy theater
- speculative ingestion
- duplicated state
- subsystem sprawl

---

## 1. Product Goal

EMA is the operator workspace for a human building with agents.

Its job is to:
- capture what matters
- decide what work exists
- choose how work runs
- maintain continuity across runs and surfaces
- preserve the human’s semantic model
- expose state clearly enough that both human and machine can act on it

### Primary user

- a single operator (Trajan)
- technical, iterative, systems-oriented
- uses Discord, shell, code agents, vault/wiki, and scripts as real tools
- wants leverage, continuity, and reduced setup friction

### Core promise

The same work should be visible and actionable from:
- the daemon/API
- the CLI/TUI
- the GUI
- bound threads/channels
- host session state
- the vault/wiki mirror

without each layer inventing a different truth.

---

## 2. System Boundaries

EMA includes:

### In scope
- backend daemon (`daemon/`)
- CLI/TUI (`cli/`)
- control-plane state
- intents/proposals/executions/outcomes
- host Claude and Codex sessions
- vault/wiki integration
- `.superman` execution scratchpads
- dispatch engine integration
- Discord/OpenClaw/ClaudeForge bindings
- MCP-backed capability normalization
- GUI/Tauri/React operator surfaces
- runbooks and workflow docs

### Out of scope for the first full build
- multi-user auth/permissions model
- public stable API guarantees
- enterprise collaboration features
- mobile-native productization
- generalized SaaS packaging
- deep autonomous intent generation from ambient chatter

### Constraint

This system must be built as an evolution of the current repo, not as a greenfield rewrite.

---

## 3. The Four Layers of EMA

EMA should be understood as four tightly connected layers.

### 3.1 Semantic Layer
Holds meaning.

Examples:
- project meaning
- intent meaning
- rationale
- constraints
- definitions
- decisions
- human-authored narratives

Primary store:
- vault / wiki

### 3.2 Runtime Layer
Holds current operational truth.

Examples:
- current intents
- proposal state
- execution state
- outcomes
- host session identity
- surface bindings
- dispatch state

Primary store:
- EMA control-plane data model / DB

### 3.3 Execution Layer
Holds active work and agent runtime.

Examples:
- Claude session
- Codex session
- dispatch task
- provider route
- execution worktree
- current prompt/run state

Primary mechanisms:
- daemon supervisors
- provider wrappers
- host-native session stores
- dispatch engine

### 3.4 Surface Layer
Holds visibility and control affordances.

Examples:
- GUI
- CLI/TUI
- Discord thread
- OpenClaw surface
- ClaudeForge surface

Rule:
- surfaces present and control work
- surfaces do **not** own canonical truth

---

## 4. Authority Model

This is the most important consistency rule in the whole system.

### Semantic truth
**vault / wiki**

Use for:
- what an intent means
- why a thing matters
- constraints and rationale
- durable notes and narrative structure
- human-facing understanding

### Runtime truth
**EMA control-plane state**

Use for:
- what state something is in now
- active intent/proposal/execution/outcome linkage
- host session bindings
- queue/dispatch state
- current focus and next action state

### Execution scratch truth
**`.superman/` folders**

Use for:
- accepted plans
- execution-local artifacts
- temporary context bundles
- reflections / work logs / derived assets

These are:
- derived
- useful
- important
- but not canonical global truth

### Direct rules
- vault does not silently become runtime state
- control-plane state does not silently overwrite semantic docs
- `.superman` never becomes the source of truth for the whole system
- surfaces do not become hidden state stores

---

## 5. Canonical Day 1 Runtime Model

There are multiple intent-related models in the repo today. Bootstrap needs one explicit runtime truth.

### Canonical bootstrap runtime intent model
Use:
- **`control_plane_intents`**

Treat as canonical Day 1 runtime intent record.

### Secondary/future semantic hierarchy model
Keep:
- **`intent_nodes`**

as the older/future map-level hierarchy model until intentionally unified.

### Why
Because bootstrap needs:
- one record type that the daemon can mutate safely
- one runtime truth for intent state
- one link target for proposals/executions

and not a semantic/runtime split hiding inside one name.

---

## 6. Intents Engine

The Intents Engine is the system that decides **what work exists**.

### Responsibilities
- maintain a bounded set of active intentions
- preserve identity and continuity of work
- connect semantic meaning to runtime work
- provide a parent/child or related-work structure when useful
- expose current focus and next-action state

### Day 1 behavior
The Intents Engine should be strict.

#### Day 1 intent creators
Only:
1. `intent/README.md` → root intent creation
2. execution completion delta → optional single child intent creation

#### Not allowed to create intents on Day 1
- draft proposals
- queued proposals
- redirected proposals
- reflexions
- Discord/session chatter
- logs
- workflow-patterns
- broad scanners
- vault-wide ingestion

### Required Day 1 fields
Minimum useful fields:
- `id`
- `project`
- `slug`
- `title`
- `kind`
- `status`
- `summary`

Useful but secondary:
- `priority`
- `current_focus`
- `next_actions`
- `linked_refs`
- `metadata`

### Level vs phase vs status
These are different axes.

#### level
- semantic abstraction depth
- belongs to the intent-map / semantic structure

#### phase
- process stage of a run or event
- belongs mostly to proposals/executions/events

#### status
- current state of an entity
- separate vocabularies for intent, proposal, execution

### Bootstrap safety rule
Intent meaning should not be rewritten automatically by execution artifacts.

Execution can update:
- status
- current focus
- next actions
- child intent creation eligibility

Execution should not silently redefine:
- the durable semantic meaning of the intent

---

## 7. Proposals Engine

The Proposals Engine is the system that decides **how a known intent might be executed**.

### Responsibilities
- generate candidate approaches
- refine and score them
- bind them to known intent context
- provide human/operator choice
- contribute lineage for execution and learning

### Day 1 proposal rules
- proposals do not create intents by existing
- draft/queued/redirected proposals never create intent nodes
- approved proposal binds to an existing intent
- proposal approval may trigger execution

### Day 1 minimal loop behavior
Proposal lifecycle:
1. proposal exists
2. proposal is reviewed/approved
3. approved proposal is bound to parent intent
4. execution is created from approved proposal
5. outcome updates parent intent
6. optional child intent only from explicit execution delta

### Proposal engine outputs
Should produce:
- proposal record
- binding to intent
- binding to execution when run
- lineage to outcome

### Proposal engine non-goal on Day 1
It should not:
- autonomously spray new intent nodes
- infer ontology from every idea fragment

---

## 8. Executions Engine

The Executions Engine is the system that turns approved work into running work.

### Responsibilities
- create execution records
- select provider/runtime path
- bind execution to host session and surface where needed
- track lifecycle state
- capture outcomes
- feed state back to intents/proposals/projects

### Required lifecycle
- created
- queued
- running
- completed / failed / timed_out / cancelled

### Required linkages
An execution should link to:
- project
- parent proposal
- parent intent
- provider
- host session id if applicable
- surface bindings if applicable

### Completion behavior
On completion, the execution should:
- persist outcome
- update linked proposal state
- update linked intent state
- optionally create one child intent from explicit delta

### Idempotency
Execution completion must be idempotent.
Repeated ingestion of the same completion should not:
- re-create outcomes
- spam child intents
- double-apply state transitions

---

## 9. Dispatch Engine

The Dispatch Engine is the system that decides **when and where approved work actually runs**.

### Responsibilities
- consume queued work
- choose worker/provider/adapter
- respect degradation and circuit breakers
- launch execution
- track execution progression
- recover from failure without corrupting state

### Required day-to-day behavior
- queue consumer remains alive
- open circuits are observable and diagnosable
- degraded lanes do not deadlock all work
- dispatch state flows into control-plane execution state

### Dispatch truth sources
Dispatch should read from:
- intent state
- proposal approval state
- provider health
- host session availability
- MCP capability availability
- operator directives

### Current known hardening areas
- degraded dispatch state needs recovery visibility
- researcher circuit-open condition needs classification/reset path
- queue consumer stability must be proven

---

## 10. Host Session Layer

Claude and Codex both already have real host-native durable session stores.

### Claude host session substrate
- `~/.claude/projects/.../*.jsonl`

### Codex host session substrate
- `~/.codex/sessions/YYYY/MM/DD/*.jsonl`
- plus auxiliary state/log SQLite files under `~/.codex/`

### EMA requirement
EMA must treat both as:
- durable session systems
- importable history sources
- resumable runtime anchors
- bindable entities in control-plane state

not merely as CLI commands.

### Host session canonical shape
Each imported host session should support:
- provider
- provider session id
- cwd / project key
- title / summary
- last activity
- messages
- events
- surface bindings
- runtime binding to active execution/session

### Current direction already implemented
EMA now has first-pass support for:
- host session discovery
- host session import
- host session persistence
- binding
- resume from imported host session

This should be considered foundational, not optional.

---

## 11. Provider Routing

EMA should route among execution providers consciously.

### Day 1 provider set
- Claude
- Codex

### Provider roles
Default policy should be explicit.

#### Claude
Prefer for:
- conversational iterative loops
- longer-form reasoning
- multi-turn high-context workspace interactions
- session continuity where transcript-style flow matters

#### Codex
Prefer for:
- direct code-heavy implementation work
- structured execution loops
- tool-rich codebase interrogation
- implementation-focused turn-taking

### Routing inputs
- intent kind
- proposal type
- current provider health
- current host session availability
- MCP capability availability
- operator override
- surface context

### Routing outputs
- provider
- model
- resume/create decision
- worktree/cwd
- session binding strategy

### Fallback behavior
Fallback should be explicit, not magical.

- degraded provider can fall back only if required capabilities are still available
- fallback should preserve lineage and state
- fallback should be observable to the operator

---

## 12. MCP as Shared Capability Contract

MCP should become the common capability layer across agents/providers where possible.

### Principle
EMA should route by **capability**, not only by provider identity.

### Minimum shared capability contract
All primary providers/agents should effectively support:
- filesystem read/write
- code search
- repository inspection / git
- docs lookup
- memory/context retrieval
- shell/command execution where appropriate and safe

### Requirement
Claude and Codex should both satisfy the minimum capability contract required by the execution path they are selected for.

### System behavior when missing
Missing MCP capabilities should:
- fail loudly
- be reflected in routing/health checks
- not silently degrade into partial broken runs

### Why this matters
Without this, each provider path becomes its own incompatible mini-platform.

---

## 13. Context Assembler

The Context Assembler is the bridge between meaning, runtime state, and execution scratch state.

### Day 1 pull order
The assembler should load in this order:

1. **Control-plane / intents DB**
   - current state
   - linkage
   - execution history pointers

2. **Vault / wiki**
   - semantic meaning
   - rationale
   - constraints
   - decisions
   - examples/research

3. **`.superman` scratchpad**
   - accepted plan
   - execution notes
   - recent reflections
   - local artifacts

### Rule
Scratchpad content must never overshadow semantic or runtime truth just because it is the easiest file to load.

---

## 14. Human Mirror Layer

EMA must preserve a **human-readable mirror** of important machine state.

### Human mirror goals
- let the human understand what the system believes
- keep semantic understanding durable outside the daemon
- allow manual audit and recovery
- provide continuity when automation is incomplete

### Mirror targets
- vault/wiki pages
- intent documents
- selected proposal summaries
- accepted plans
- execution summaries
- operator runbooks

### Mirror constraints
The mirror is not a dump of every runtime event.
It should contain:
- durable meaning
- decisions
- summaries
- accepted outcomes

not:
- every transient log line
- queue churn
- repeated tool chatter

---

## 15. `.superman` Layer

The `.superman` folder system is useful, but must stay in its lane.

### It should be used for
- plan staging
- accepted execution artifacts
- local working context
- reflection capture
- project-local machine-readable index

### It should not become
- the global state system
- the semantic authority
- the only machine-readable truth for the pipeline

### Day 1 requirement
The spec should treat `.superman/metadata.json` as a folder-local index/cache for Superman workflows.

---

## 16. GUI

The GUI should be the richest human-facing mirror and control surface.

### Responsibilities
- display project / intent / proposal / execution state
- show host session continuity
- show runtime provider/surface bindings
- expose dispatch and provider health
- show vault-linked meaning alongside runtime state
- provide approval/dispatch/resume controls

### Core GUI views
- Intent workspace
- Proposal queue and lineage
- Execution board
- Host session browser
- Surface binding view
- Dispatch/health dashboard
- Memory/wiki mirror view

### GUI constraint
It must render control-plane truth, not invent its own state store.

---

## 17. TUI / CLI

The CLI/TUI should be a first-class operator surface, not a mock sidecar forever.

### Responsibilities
- inspect runtime state
- trigger dispatch/resume/bind operations
- inspect host sessions
- browse execution lineage
- run diagnostics
- operate the bootstrap loop without GUI dependency

### Day 1 priorities
- host session list/show/messages/events/bind
- control-plane context/execution inspection
- provider health and routing diagnostics
- dispatch diagnostics and recovery
- bootstrap runbook commands

### Constraint
The CLI should target the real daemon API/control-plane, not remain split from reality.

---

## 18. Discord / OpenClaw / ClaudeForge Surfaces

These are surfaces and transport layers, not separate brains.

### Discord
Use for:
- thread-bound work visibility
- operator prompts and result return
- lightweight interaction around running work

### OpenClaw
Use for:
- operator chat bridge
- surface/routing integration
- session/surface interoperability

### ClaudeForge
Use for:
- Discord-facing Claude execution surface
- complementary session UX where useful

### Rule
All three should bind into the same EMA control-plane entities:
- intent
- proposal
- execution
- host session
- surface binding

No layer should become a shadow orchestration system.

### Practical requirement
Surface bindings should be explicit and persisted:
- Discord thread id ↔ execution id
- execution id ↔ host session id
- execution id ↔ provider session id
- external surface ids ↔ control-plane binding records

---

## 19. Discord Outbound Activation

EMA must be able to speak back into the bound thread/channel to close the loop.

### Required
- outbound Discord token/config present
- broadcast path verified
- thread-bound execution start/result/update emission verified

### Minimum behaviors
- execution started
- execution completed / failed
- child intent created if warranted
- routing/provider switch if meaningful

Without this, thread binding exists structurally but not operationally.

---

## 20. Outcomes and Learning

EMA should learn from completed work, but carefully.

### Day 1 allowed learning
- execution outcomes
- success/failure summaries
- proposal/execution linkage
- workflow-pattern stats

### Day 1 forbidden learning loops
Do not let these automatically create intents:
- raw logs
- reflexions
- Discord chat
- repeated outcome tracker churn
- proposal draft prose

### Reason
The system must first learn to close a loop without polluting itself.

---

## 21. Failure Modes to Design Against

### 21.1 Split truth
Different layers disagree about state.

Mitigation:
- explicit authority model
- persisted bindings
- one runtime canonical model

### 21.2 Proposal pollution
Speculative proposals become fake work.

Mitigation:
- approved-only gate
- execution-complete-only gate for child intent creation

### 21.3 Scratchpad drift
`.superman` artifacts are mistaken for truth.

Mitigation:
- assembler read order
- authority rules
- projection labeling

### 21.4 Provider asymmetry
Claude and Codex diverge into incompatible execution systems.

Mitigation:
- shared MCP contract
- provider routing policy
- host session parity work

### 21.5 Dispatch deadlock
Queue consumer or circuits stall work.

Mitigation:
- health visibility
- explicit failure classification
- restart/reset procedures
- execution propagation checks

### 21.6 Surface shadow brain
Discord/OpenClaw/ClaudeForge start owning state instead of reflecting it.

Mitigation:
- all surface state must bind to EMA control-plane entities

---

## 22. Migration / Convergence Guidance

This repo currently contains overlapping concepts and partially wired subsystems.

### Converge toward
- `control_plane_intents` as runtime truth
- vault/wiki as semantic truth
- host sessions as durable provider truth
- control-plane execution lineage as canonical operational chain
- surfaces as bindings/views

### Demote / isolate
- `intent_nodes` as primary runtime truth on Day 1
- `.superman/metadata.json` as pipeline-wide authority
- provider-specific ad hoc routing assumptions
- mock-only CLI as the primary operator story
- surface-local shadow state

### Migration stance
This should be additive first, then convergent.
Do not block forward progress on total model unification before the first working loop exists.

---

## 23. Phased Build Program

### Phase A — Bootstrap validity
Deliver:
- canonical runtime intent model
- authority split
- Day 1 ingestion rules
- proposal binding to parent intent
- execution completion updating parent intent
- single child intent creation rule
- bootstrap loop test

### Phase B — Engine recovery
Deliver:
- dispatch degraded-state diagnosis
- researcher circuit diagnosis
- queue consumer restoration
- control-plane execution propagation verification

### Phase C — Runtime/session reality
Deliver:
- host session import and persistence
- reliable Claude/Codex resume/status parity
- thread/execution/session bindings
- provider routing rules

### Phase D — Shared capability layer
Deliver:
- MCP capability audit
- required shared contract
- provider capability gap closure

### Phase E — Human-facing activation
Deliver:
- Discord outbound config and bound-thread delivery
- GUI/TUI control-plane parity
- runbooks and operator workflows

### Phase F — Proof
Deliver:
- one real controlled bootstrap scenario
- anti-pollution verification
- operator runbook for recurring use

---

## 24. Initial Comprehensive Backlog

The immediate backlog should prioritize:

1. **Loop validity**
   - canonical intent bootstrap
   - proposal/execution/intent linkage
   - child intent rule

2. **Dispatch recovery**
   - degraded queue + circuit diagnosis
   - restart/fix path

3. **Session/runtime hardening**
   - host session resume/status parity
   - thread binding reliability

4. **MCP normalization**
   - capability matrix
   - minimum contract

5. **Surface activation**
   - Discord outbound
   - GUI/TUI parity

The detailed task pack already exists in:
- `docs/EMA-DISPATCH-READY-TASK-PACK.md`

The broader queue exists in:
- `docs/EMA-BOOTSTRAP-WORKLOAD-BACKLOG.md`

---

## 25. Definition of Success

EMA is successful when it can do all of the following reliably:

### Runtime success
- import and bind Claude/Codex host sessions
- route execution through EMA, not around it
- preserve session/provider lineage

### Workflow success
- create a root intent from `intent/README.md`
- bind approved proposal to that intent
- dispatch execution
- complete execution
- update parent intent
- create at most one child intent only when explicitly warranted

### Surface success
- show the same work in GUI, CLI/TUI, and bound thread/channel
- return execution results to the bound thread
- reflect current provider/session binding visibly

### Knowledge success
- keep semantic meaning in vault/wiki
- keep runtime truth in control-plane state
- keep `.superman` useful without letting it take over

### Capability success
- all selected providers satisfy required MCP capabilities for their assigned work
- missing capability is visible and actionable

### Human success
- the operator can understand what EMA is doing
- the operator can intervene without breaking continuity
- the system grows more useful without becoming a self-polluting mess

---

## 26. Single Next Action

Implement the first fully valid bootstrap loop in code:

**`intent/README.md` → `control_plane_intents` root intent → approved proposal binding → execution completion → parent intent update → optional single child intent from explicit delta**

That loop is the gate to the rest of the system.
