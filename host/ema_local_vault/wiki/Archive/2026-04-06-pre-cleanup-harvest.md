# Pre-Cleanup Database Harvest — 2026-04-06

## Real Tasks (23)

- **P1** [nil] Sprint 2: ExecutionsApp frontend (channel + store + app component)
  From execution-first-ema-os plan. Build Phoenix channel for executions:lobby, Zustand store with REST+WS sync, and ExecutionsApp React component showing timeline with status groups. Intent is 50%% comp
- **P1** [nil] Verify Intent Engine bootstrap + populate existing data
  Intent Engine schema + context + populator are built per wiki. Need to run bootstrap (mix ema.intents.bootstrap or Populator.populate/0), verify tree output, confirm SystemBrain writes intents.md state
- **P2** [nil] Fix 7 dead WebSocket channel topics
  Frontend stores join channels with no matching backend def join handlers. Silent failure — REST loads but no real-time sync. Audit stores/ vs backend channels and add missing handlers.
- **P2** [nil] Normalize how daemon resolves the data directory path
  Data directory path resolved 4 different ways across codebase (compile_env, get_env, env var, hardcoded). Consolidate to single source of truth.
- **P2** [nil] Sprint 3: Self-referential proof test
  From execution-first-ema-os plan. The final sprint: this intent creates an execution of itself that appears completed in HQ. Proves the execution loop end-to-end with the intent folder system.
- **P2** [nil] Build Intelligence.Router for event classification
  Phase 2 item. GenServer that classifies incoming events (brain dump, proposal, task, session) and routes them to appropriate handlers. Central nervous system for the intelligence layer.
- **P2** [nil] Build ContextInjector for AI enrichment
  Phase 2 item. Enriches AI prompts with goals, tasks, and knowledge-base context before Claude invocations. Keys: :project, :goals, :tasks, :energy, :proposals. Event-driven fetching from domain modules
- **P2** [nil] Triage and merge 7 worktree feature branches
  Seven branches built in worktrees not yet on main: Superman.Context, Proposal API normalization, BridgeDispatch, SeedPreflight, Claude.Failure taxonomy, BrainDump-to-Proposal loop, OpenClaw Sync. Each 
- **P2** [nil] Fix MCP create_task tool param mapping
  The ema_create_task MCP tool fails with title cant be blank even when title is provided. The Claude Code MCP wrapper schema maps notes/priority as strings but backend expects description + integer prio
- **P2** [nil] Tune StructuralDetector keyword sensitivity
  StructuralDetector catches common English words like the-three-letter-word-for-everything and data-folder-name as structural keywords. Too aggressive for normal task creation — blocks legitimate tasks.
- **P2** [nil] Build 3 missing harvester modules
  Three harvester modules declared in @valid_harvesters not yet built. For file-watcher data, usage metrics, and brain dump history. Git + Session harvesters exist as reference implementations.
- **P2** [nil] Audit Bridge.run/2 silent Runner fback
  Bridge is opt-in but many modules invoke Bridge.run/2 which returns Runner.run/2 results without warning. Routing, cost tracking, governance logging silently bypassed. Need explicit logging on fback pa
- **P2** [nil] Workspace proof: implement context loader
  First task created with actor_id stamping. Assigned to coder agent workspace.
- **P2** [todo] Harden HQ project context contract
  Salvaged from stale HQ context adapter branches (2966ab9, 4ab98e3). Define a stable /api/projects/:id/context contract, add normalization tests in app/src/stores/project-store.ts, and UI smoke tests in
- **P3** [nil] Build outcome linker (proposal to result feedback loop)
  Phase 2 item. Track the chain: proposal created -> execution dispatched -> result artifact written -> outcome scored. Feed outcome signals back into seed strategy and evolution system.
- **P3** [nil] Build auto-approve rules for safe proposals
  Phase 2 item. Low-risk proposals (high confidence, narrow scope, known-safe patterns) skip human review and proceed directly to execution. Configurable rules per project.
- **P3** [nil] Build domain agents (Strategist, Coach, Archivist)
  Phase 2 item. Three persona agents with distinct system prompts, tool permissions, and context windows. Strategist for architecture decisions, Coach for habits/goals, Archivist for knowledge curation.
- **P3** [nil] Build CampaignManager for persistent session clusters
  Phase 2 item. Named groups of agent sessions that share context and pursue a multi-step objective. Tracks progress, manages handoffs between sessions, maintains shared memory.
- **P3** [nil] Fix Tauri daemon auto-start race condition
  Phase 4 item. Tauri desktop app sometimes starts before daemon is ready, causing connection failures on first load. Need health check polling or startup sequencing.
- **P3** [todo] Audit actor/container model completeness
  Salvaged from historical actor/container verification work. Current main already has actor schemas, controller routes, and migrations. Audit schema/API/migration coherence, verify migration ordering an
- **P3** [todo] Surface proposal outcomes in HQ or proposal detail
  Salvaged from historical proposal-outcome branch 7463264. Backend outcome endpoint already exists on main: GET /api/proposals/:id/outcome. Add frontend consumer and render effectiveness, outcome_signal
- **P4** [nil] Design Pattern Crystallizer (Phase 3)
  Phase 3 roadmap. Detect recurring workflows from execution history, harden into reusable artifacts (pipe templates, seed strategies, context bundles). Depends on Workflow Observatory + harvesters.
- **P4** [nil] Design Autonomous Reasoning loop (Phase 3)
  Phase 3 roadmap. Self-improvement loop: observe outcomes, identify friction, generate improvement proposals, execute approved changes. Threat model + health dashboard + autonomy slider (Assist/Auto/Ful

## Active Intents (25)

- L0 [task] Autonomous Execution Engine
- L0 [task] Unified Life OS
- L0 [task] OpenClaw + EMA Integration
- L0 [goal] EMA Life OS
- L1 [task] Campaign Management
- L1 [task] Dispatch Board
- L1 [task] Execution Loop
- L1 [task] Knowledge Management
- L1 [task] Vector Embedding Pipeline
- L1 [task] Project Context API
- L1 [task] Prompt Intelligence
- L1 [task] MCP Bridge
- L1 [task] Claude Session Import
- L1 [goal] Agent Collaboration
- L1 [goal] Ship Core Loop
- L2 [task] Agent Assignment UI
- L2 [task] Execution Status Display
- L2 [task] Vault Note Indexing
- L2 [task] Semantic Search API
- L2 [task] Build EMA Intent Engine
- L2 [task] Actor Workspace
- L2 [task] EMA OS
- L3 [task] Second Brain
- L3 [task] Execution Engine
- L3 [feature] Intent Wiki Schematic

## Planned Intents (54)

- L0 [task] Semantic Intelligence Layer (Superman)
- L1 [task] Personal Finance
- L1 [task] Intent Clustering
- L1 [task] Vault Sync
- L2 [task] Async Dispatch Contract
- L2 [task] DB Entity Indexing
- L2 [task] Context Assembly
- L2 [task] HQ Live Data
- L2 [task] Token Budget Management
- L3 [task] Vault Convergence
- L3 [task] Wikipedia Frontend
- L3 [task] CLI + Agent Ingestion
- L3 [task] LaunchpadHQ Sprint 2
- L4 [task] EMA metaproject bootstrap completed 2026-04-06. Loaded 15 tasks from: .superman/intents/execution-first-ema-os (50% done
- L4 [goal] Phase 3: Superman local implementation: Replace SupermanClient HTTP calls with local ETS + vault + intent implementations.
- L4 [task] trigger state sync
- L4 [goal] Design expanded agent MCP work surface: Design the two-mode MCP surface: agent workspace + user intention layer, with accelerated planning, vault/graph/superman consolidation
- L4 [goal] Compile and verify: Compile with warnings-as-errors, run tests, verify everything works
- L4 [task] Test Projector Output
- L4 [goal] Phase 5: Sync Python CLI (bin/ema): Backport 17 new command groups to Python CLI
- L4 [task] Test Projector
- L4 [goal] Update wiki MCP docs: Update MCP-Tools-Reference.md with workspace tools
- L4 [task] ProSlync is now an active priority project — revenue opportunity for the Wilson Premier family (Craig Wilson). New mobil
- L4 [goal] User reviews spec: Get user approval on written spec before planning
- L4 [goal] Spec self-review: Review spec for placeholders, contradictions, ambiguity
- L4 [goal] Propose approaches: Present 2-3 approaches with trade-offs
- L4 [goal] Transition to implementation planning: Invoke writing-plans skill
- L4 [goal] Present design: Present full design section by section for approval
- L4 [goal] Offer visual companion: Offer browser-based visual companion for design mockups
- L5 [task] Execution-First EMA OS with Intent Folders and Runtime Executions
- L5 [task] Bootstrapped system start: original docs are directionally useful but operationally stale in several seams
- L5 [task] Phase 2: Agent tool dispatch — 1→60+ tools: Create ToolDispatch module, wire into AgentWorker.
- L5 [fix] Phase 0: Close bootstrap loop — CLI + bug fix: Add `ema proposal create` CLI command. Fix duplicate actor_id filter in executions.ex.
- L5 [task] Phase 1: PubSub wiring — 5→10 topics: Add PubSub broadcasts to project_controller, pipes/executor. Extend VisibilityHub subscriptions.
- L5 [task] Phase 5: Self-healing bootstrap: Create BootstrapWatcher GenServer with retry + periodic rescan.
- L5 [task] Phase 6: Execution mode prompts + reflexion loop: Add mode_system_prompt/1, prepend in dispatcher, wire ReflectionLoop → ReflexionStore.
- L5 [task] Phase 4: SystemBrain wiki — 4→9 state files: Add 5 missing state file writers (executions, agents, goals, habits, responsibilities).
- L5 [question] Explore current MCP tool surface and agent capabilities: Understand what MCP tools exist today, how agents interact with EMA, and what's missing for the expanded work surface
- L5 [task] Add cycle metrics to Actors context: Add get_cycle_metrics/3 and record_cycle_completion/3 to actors.ex
- L5 [task] Wire workspace tools into MCP server: Add WorkspaceTools to server.ex tool listing and routing
- L5 [task] Create orient.ex — context assembly module: Build the Orient module that assembles operator and workspace briefings from EMA's live state
- L5 [task] Create workspace_tools.ex — 12 MCP tools: Build the WorkspaceTools module with all 12 tools: orient, phase cadence, workspace state, intelligence, codebase
- L5 [task] Enhance vault tools + add workspace resource: Enhance ema_vault_graph and ema_vault_read in domain_tools.ex, add workspace briefing resource
- L5 [task] Phase 4: Orchestrator + ingest commands: Create 2 command modules + update cli.ex specs/dispatch
- L5 [task] Phase 3: Operations commands (vm, onboarding, prompt, decision, clipboard): Create 5 command modules + update cli.ex specs/dispatch
- L5 [task] Phase 2: Intelligence commands (temporal, intelligence, pipeline, obsidian, security): Create 5 command modules + update cli.ex specs/dispatch
- L5 [task] Phase 6: Harden existing HTTP-only commands with Direct transport: Add Direct transport branches to 10 existing command modules
- L5 [task] Compile and verify: mix compile, mix test, mix escript.build — zero warnings
- L5 [task] Phase 1: Life OS commands (contact, finance, invoice, routine, meeting): Create 5 command modules + update cli.ex specs/dispatch
- L5 [fix] Fix CLI MCP server hardcoded tool list: Add 13 workspace tools to mcp_serve.ex static list and dispatch
- L5 [fix] Fix MCP HTTP controller to include workspace tools: Add WorkspaceTools.list() and routing to mcp_controller.ex
- L5 [question] Explore project context: Understand current codebase, EMA context, git history
- L5 [question] Ask clarifying questions: Understand priorities, constraints, and vision for the upgrade
- L5 [task] Write design doc: Save spec to docs/superpowers/specs/

## Complete Intents (8)

- L1 Proposal Pipeline
- L1 Daily Rhythm
- L1 Project Workspace
- L2 Brain Dump Ingestion
- L2 AI Proposal Generation
- L2 Quality Gate Review
- L2 Proposal Approval Flow
- L3 Unified Intent Schema

## Stale Executions (5) — wiped

- [running] research: Bootstrapped system start: original docs are directionally useful but operational
- [running] research: EMA metaproject bootstrap completed 2026-04-06. Loaded 15 tasks from: .superman/i
- [running] research: trigger state sync
- [created] research: Test dispatch
- [running] research: ProSlync is now an active priority project — revenue opportunity for the Wilson P

## Brain Dumps (4)

- Bootstrapped system start: original docs are directionally useful but operationally stale in several seams. Canonical startup should trust daemon/lib runtime code first, then current docs and updated w
- EMA metaproject bootstrap completed 2026-04-06. Loaded 15 tasks from: .superman/intents/execution-first-ema-os (50% done, phase 2), IMPLEMENTATION_ROADMAP.md (Phase 1 complete, Phase 2 in progress), PA
- trigger state sync
- ProSlync is now an active priority project — revenue opportunity for the Wilson Premier family (Craig Wilson). New mobile app being built at ~/Desktop/proslync-app using Expo + React Native (replacing 

## Proposals — 81 total (34 queued, 47 killed) — all wiped