# EMA Research Running Log

Updated: 2026-04-13 UTC

## EMA current architecture signals

- Active runtime is a TypeScript-first Electron monorepo.
- Active surfaces:
  - `apps/electron`
  - `apps/renderer`
  - `services`
  - `workers`
  - `cli`
  - `shared`
- Default local service port remains `4488`.
- Root scripts show Electron depends on external runtime coming up first:
  - renderer dev
  - services dev
  - workers dev
  - electron start after `wait-on tcp:1420 tcp:4488`
- Old Elixir/Phoenix/Tauri stack is explicitly archived under `IGNORE_OLD_TAURI_BUILD/`.

## EMA conceptual spine from docs

- Three truth domains:
  - semantic (`intents`, links, events)
  - operational (`executions`, tasks, goals, proposals, sessions)
  - knowledge (wiki/canon/docs)
- Preferred user-facing progression:
  - `intent -> proposal -> execution -> result`
- Context assembler is framed as a control-plane context compiler, not prompt stuffing.
- Product surfaces map emphasizes:
  - HQ
  - Projects
  - Intents
  - Proposals
  - Executions
  - Chronicle
  - Review
  - Canon
  - Research / Feeds
  - Memory / Context Graph
  - Search / Recall / Trace
- Missing first-class domains called out directly in docs:
  - Review
  - Chronicle durability
  - unified search/index
  - canon service
  - graph service
  - hq read model / unified workspace snapshot

## Relevance hot terms for external inspiration

- execution identity
- event ledger / replay
- durable execution
- proposal approval lifecycle
- context assembler
- memory / context graph
- human ops
- chronicle
- review domain
- local-first Electron operator shell
- multi-agent orchestration
- approval UX
- session indexing
- graph-backed architecture IDEs

## High-signal external projects to track

### Tier 1 — directly relevant now
- `generalaction/emdash`
  - TypeScript
  - updated 2026-04-12
  - open-source agentic development environment
  - strong relevance: parallel agent execution, remote/SSH-ish workflows, worktree-oriented orchestration
- `dbos-inc/dbos-transact-ts`
  - TypeScript
  - updated 2026-04-08
  - durable TypeScript workflows
  - strong relevance: event spine, replayability, durable steps without abandoning TS stack
- `jayminwest/overstory`
  - TypeScript
  - updated 2026-03-28
  - multi-agent orchestration for coding agents
  - strong relevance: orchestration topology, tmux supervision, adapter-driven runtime model
- `ComposioHQ/agent-orchestrator`
  - TypeScript
  - updated 2026-04-13
  - parallel coding-agent orchestrator
  - strong relevance: task planning, worktree/agent fleet, review + CI handling, plugin-slot architecture
- `ysz7/Arcforge`
  - TypeScript
  - updated 2026-03-23
  - architecture design IDE for backend logic
  - strong relevance: graph-first architecture editing, safe refactor modeling, relationship visibility
- `Dicklesworthstone/coding_agent_session_search`
  - Rust
  - updated 2026-04-12
  - unified local coding-agent session search/index
  - strong relevance: cross-provider session indexing as first-class subsystem

### Tier 2 — useful primitives
- `restatedev/restate`
  - durable execution / journal-per-invocation mental model
- `inngest/inngest`
  - step function + event workflow ergonomics
- `gotohuman/gotohuman-mcp-server`
  - human approval / field-level review seam
- `open-webui/open-webui`
  - approval UX and broad local operator UX patterns
- `continuedev/continue`
  - source-controlled AI checks / enforcement mentality
- `All-Hands-AI/OpenHands`
  - productization patterns for agent workbench UX
- `charmbracelet/crush`
  - current agent UX / terminal ergonomics patterns

## Standout builders / orgs to watch

- `generalaction`
- `dbos-inc`
- `restatedev`
- `ComposioHQ`
- `jayminwest`
- `Dicklesworthstone`
- `ysz7`
- `charmbracelet`
- `continuedev`

## Current strongest thesis

EMA is converging on:
- Electron as operator shell
- TS services/workers as runtime
- canon/docs/wiki as knowledge plane
- intents/proposals/executions as operational plane
- context assembler + graph + chronicle/review as differentiating moat

The biggest missing links remain:
- unified execution identity
- durable event spine / replay contract
- first-class Chronicle
- first-class Review
- graph / search / canon convergence
- cleaner approval + operator intervention model

## 2026-04-13 — User-rated high-signal pollination set

### Strong user signal
- **AGOR** is currently the strongest hit by a wide margin.
- **MCP Agent Mail** is a strong pollinator.
- **claude-view** is a strong pollinator, especially for operator visibility / mission-control surfaces.
- **SapienX AgentOS** is explicitly recognized as deeply flawed but rich in applicable ideas/concepts; strong signal-over-clout example.
- **Tela** remains a maybe / think-more candidate, not yet promoted into the top bucket.

### Important process lesson
Previous cross-pollination rounds underfit EMA because they targeted generic AI workflow infra instead of EMA's actual shape as:
- executive management assistant
- human↔agent work platform
- host-reality / SSH / sudo-aware runtime bridge
- live work / state / chat / machine sync
- operator cockpit + continuity + delegation system

### Current best inspiration cluster
#### Top tier
- Agor
- Overstory
- OpenASE
- coding_agent_session_search
- MCP Agent Mail
- claude-view
- ntfy
- sshx
- AgentOS

#### Evaluate further
- Tela
- OxideTerm
- Moltis
- wish
- ttyd
- Dockge
- Nezha
- Memos

### EMA-wide implication
Cross-pollination should not be limited to the main control-plane surfaces. It should become a continuous input stream for:
- vApps
- feeds
- blueprint vApp
- intentions vApp
- smaller productivity vApps
- utility/micro-productivity surfaces

### Strategy shift
Need a persistent, high-quality inspiration / pollination process that favors:
- innovative implementation details
- weird but useful operator surfaces
- tiny productivity wins as well as large control-plane ideas
- signal over popularity/clout
- direct applicability to concrete EMA vApps and subsystems

### Likely next artifact types
- per-vApp cross-pollination map
- running inspiration registry with user ratings
- steal/adapt/ignore matrix by subsystem
- concept harvests from promising but flawed repos
