---
title: "Decisions"
created: 2026-03-16
updated: 2026-03-20
type: personal
status: active
confidence: 0.80
confidence_updated: 2026-03-20
source: personal
summary: "Decision log tracking Trajan's architectural and operational choices with rationale"
tags: [openclaw, ops, prompts, research, security, skills]
---
# Trajan's Decisions

> Decision log. Right Hand reads this to understand context behind choices.

## 2026-04-05 — Intent-Engine-First Stream Lanes
- **Decision:** Clean up stream-of-consciousness channels so progress and proposal signals propagate from the intent engine instead of ambient chatter
- **Channel rule:** `#intent-stream` carries intent-engine state, `#pipeline-flow` carries intent-derived progress and proposal movement, `#agent-thoughts` is only for intent-grounded uncertainty with operator value
- **Anti-pattern banned:** freeform journaling / raw chain-of-thought in semantic stream lanes
- **Context:** "more clean up around stream of consciousness channels, it should propagate progress and proposals accordingly and get everything from intent engine"

## 2026-03-16 — System Rebrand
- **Decision:** Kill "System" branding entirely
- **New model:** Orchestrator (silent infra) + Right Hand (default voice)
- **Agent consolidation:** 16 → 7 agents (merge overlapping specialists)
- **Right Hand name:** "Trajan's Right Hand Man" — casual, trusted partner vibe
- **[[Self-learning]]:** Right Hand reads vault, rewrites own prompts based on preference patterns
- **Context:** System theming felt too formal/corporate. Right Hand should be default in all channels, not the orchestrator.

## 2026-03-16 — Agent Consolidation
- **Decision:** Consolidate agents from 20 → 8
- **Kept:** main, researcher, coder, ops, security, vault-keeper, browser-automation, [[universal-orchestrator]]
- **Archived:** 12 agents to `_archived/` (claude-code, coding-delegation, concierge, config-change, cron-automation, default, discord-setup, interviewer, research-tool, security-audit, troubleshooting, [[vault-management]])
- **Context:** Too many overlapping specialists. Lean roster with sub-agent spawning for specialization on demand.

## 2026-03-16 — Claude Code Bot v2
- **Decision:** Deploy separate [[Claude Code Bot]] (ID: 1482938994022158430) as standalone Discord bot
- **Capabilities:** claude --print with bypassPermissions, streaming live progress, channel context injection
- **Dispatch:** @mention by Trajan or dispatched by Right Hand
- **Context:** Need a dedicated coding partner that can run independently alongside Right Hand.

## 2026-03-16 — VM-Host Bridge Design
- **Decision:** Bidirectional SSH bridge between agent VM and host machine (FerrissesWheel at 192.168.122.1)
- **Architecture:** ~/shared/ on both machines, bidirectional rsync every 60s via systemd timer
- **Subfolders:** inbox-host/, inbox-vm/, reports/, tasks/ — files prefixed with origin (host-- or vm--)
- **Context:** Bridge [[EMA]] on VM with Claude Code CLI on host for unified agent ecosystem.

## 2026-03-16 — Overnight Autonomous Work Mode
- **Decision:** When Trajan sleeps, system runs continuous research→dispatch→deliver cycle
- **Scope:** Research (GitHub, Reddit, forums), project analysis, vault buildout, gap identification, community sourcing, tool implementation
- **Deliverables:** Proposals, documents, implementations, and new channels ready on Trajan's "desk" by morning
- **Exec approval:** Full permanent auto-approve for all safe actions — "full exec approval for everything always from now on"
- **Context:** Trajan wants to wake up to visible, tangible progress across all channels — not status reports but actual work done

## 2026-03-16 — Research Feed Channels
- **Decision:** Create and maintain agent-feed and vault-feed channels plus github-interesting and reddit-interesting
- **Quality bar:** Key takeaways, not raw links. Favorite/save the most important finds. Sophistication over volume.
- **Auto-dispatch:** When research finds something implementable, dispatch agents to build it — don't just report
- **Context:** Research feeds are a core value driver but need iteration to reach quality Trajan expects

## 2026-03-16 — Discord Restructure
- **Decision:** Restructure Discord into Trajan's Office (desk as forum, concierge channel) → Command Center → Active Conversations → Archive
- **Desk:** Forum format — agents post pressing items as forum posts
- **Active Conversations:** Working channels that auto-promote from forum activity
- **Archive:** Bottom category for completed/stale work
- **Context:** Forums as working state, vault as persistent truth. Two views of same work.

## 2026-03-16 — Host Machine as Knowledge Source
- **Decision:** Use SSH bridge to host machine (FerrissesWheel) not just for file sync but for learning from Trajan's personal files, setups, desktop, documents
- **Scope:** Project management, idea creation, system exploration — not just code
- **Caution:** BE CAREFUL — it's a personal production machine, not a sandbox
- **Context:** "There's a lot to learn from all my files there" — host machine context feeds agent intelligence

## 2026-03-16 — Agent Roster Expansion Philosophy
- **Decision:** Expand subagent and delegation system with more skills and personalities
- **Direction:** Multiple perspectives and roles collaborating — breadth over depth in [[agent roster]]
- **Implementation:** Specialized skills and roles can be created on demand, not just pre-defined agents
- **Context:** "I want more skills, more personalities to load in and collaborate towards a better project"

## 2026-03-16 — Phase 3 Scope Cut
- **Decision:** Phase 3 items mostly deprioritized — "Phase 3 is silly"
- **Keep:** CI/CD pipeline and VM browser UI only
- **Cut:** Everything else in Phase 3
- **Context:** Focus on what's immediately useful. Don't over-plan infrastructure that isn't needed yet.

## 2026-03-16 — Vercel Deployment for Dashboard
- **Decision:** Deploy working version of dashboard/system UI to Vercel for external viewing and sharing
- **Context:** Wants the current state of the system viewable and shareable outside the VM

## 2026-03-16 — Forum Tasks as Project Tracking
- **Decision:** Discord forum tasks channel must show actual tasks from system buildout / project-based development
- **Requirement:** Tasks dispatched to agents must appear as visible forum posts — empty forums = system failure
- **Context:** "can we get it so tasks actually show up in the forum tasks in system buildout like project based development was designed"

## 2026-03-16 — Dashboard Design Process
- **Decision:** Dashboard UI must go through multi-concept deliberation before building
- **Process:** 3 concepts (each with different design theory) → Devil's Advocate critique → product design critic review → synthesized MVP
- **Aesthetic:** Apple glass / Codex-style — consumer-grade, Jony Ive / Dieter Rams quality bar
- **Agents used:** Prompt Engineer for concepts, Devil's Advocate for critique, Product Design Critic for UX review
- **Context:** "make an ui psychologist and deliberate 3 separate approaches and design theories"

## 2026-03-16 — Claude Agent SDK Migration Research
- **Decision:** Research upgrading agent spawning from CLI-based (`claude --print --permission-mode bypassPermissions`) to Claude Agent SDK (Python)
- **Deliverable:** Comprehensive design doc at vault/Architecture/
- **Context:** Current CLI approach has limitations for lifecycle management, streaming, and cross-agent coordination

## 2026-03-16 — Google Workspace Integration
- **Decision:** Integrate email, calendar, and drive from host machine via SSH bridge
- **Method:** Use Claude Code on host with full sudo access to discover and link accounts
- **Scope:** All email addresses, calendar events, drive files — broad discovery
- **Context:** "Can you get info from host machine and link all the email addresses you find... Same with calendar and drive etc."

## 2026-03-17 — Channel-Bound Agent Sprint
- **Decision:** Bind all 12 agents to specific Discord channels for async sprint work
- **Evolution:** Earlier preference was "no hard-coded agent-to-channel bindings" — now testing dedicated assignments for structured sprint execution
- **Context:** Sprint mode where each agent owns a channel and produces work independently. Tested and confirmed live on 2026-03-17.

## 2026-03-17 — Agent Channel Category (Always-On)
- **Decision:** Create a dedicated Discord channel category where agents are always working continuously on Trajan's priorities
- **Design question:** How to format this category so it's clear, useful, and shows live progress
- **Context:** "What do you think is the best way to format a new agent channel category which will always have agents working continuously on my priorities"

## 2026-03-17 — Agent-Triggered Crons for 24/7 Continuity
- **Decision:** Exploring agent-triggered crons + managed subagents that continue work sequentially as a mechanism for true 24/7 operation
- **Architecture:** Agents trigger crons → crons spawn subagents → subagents hand off to next round — no human nudge needed

## 2026-04-04 — EMA Babysitter Surface Governor Model
- **Decision:** EMA Babysitter should be the visible-surface governor, not just another feed
- **Architecture:** semantic lanes define meaning; cadence buckets define speed; adaptive tick policy stays bounded within bucket ranges
- **Buckets:** hot 5s–30s, warm 30s–120s, medium 5m–30m, slow 30m–3h, archive 3h+
- **Channel rule:** `#babysitter-live` is operator rollup only; health/intent/flow/thought/synthesis should route to their semantic lanes
- **Context:** preserve the best of old EMA stream docs plus newer adaptive babysitter code instead of flattening everything into one ticker
- **Context:** "What about agent triggered crons and managed subagents to continue work sequentially as a way for 24/7" — this addresses the recurring problem of work stopping when sessions end or gateway restarts

## 2026-03-17 — Gmail Direct Integration
- **Decision:** Connect Gmail directly to the agent system
- **Evolution:** Extends earlier Google Workspace Integration decision (2026-03-16) with specific focus on email
- **Context:** "can we connect you to my Gmail" — email as a first-class integration surface

## 2026-03-17 — Discord /nuke Command
- **Decision:** Add a /nuke slash command to [[Claude Code Bot]] that purges all messages in the channel it's sent in
- **Context:** Quick channel cleanup utility for resetting channels during development/iteration

## 2026-03-18 — OntoCLAM Integration
- **Decision:** Integrate OntoCLAM into the agent system
- **Context:** "Get ontoclam integrated into system" — expanding the tool/knowledge infrastructure

## 2026-03-18 — HyPerspell & Foundry Plugin Integration → CANCELLED
- **Original Decision:** Install HyPerspell and Foundry plugins, integrate fully into the system
- **Cancelled:** 2026-03-18. Agents dispatched but killed mid-flight, no artifacts produced. Trajan decided to drop both — focus on system advancements instead of plugin chasing.

## 2026-03-18 — Mirror System Architecture Steal
- **Decision:** Analyze a mirror project's Obsidian graph, rebuild its best features in our system, then compare and migrate all useful assets
- **Process:** "dispatch multiple agents and layers of testing and design process to go get all important assets of the mirror system"
- **Security:** Build from scratch — do NOT clone or run external repo code. Steal concepts, not code.
- **Context:** Competitive intelligence approach to system improvement

## 2026-03-18 — Auto Delegator Layer Project
- **Decision:** Build an auto-delegator layer as a dedicated project with its own active Discord channel
- **Architecture:** Manages agent communication, cooperation, and collaboration through sequential, parallel, async/sync channels via vault and Discord
- **Key concept:** "Bureaucracy management" — automated coordination layer that ensures productive multi-agent work without manual oversight
- **Phases:** Phase 1 (desk-watcher hook + CLI) complete → Phase 2 (smart routing, dependency detection, dispatch orchestration)
- **Context:** "an [[auto delegator layer]] which manages and ensures productive agent communication cooperation and collaboration"

## 2026-03-18 — Ingestor Layer Architecture
- **Decision:** Build an ingestor layer on top of researcher agent to automate what Trajan does manually
- **Scope:** Automates the full loop: discover interesting content → extract value → dispatch implementation — without Trajan in the loop
- **Context:** "on top of the researcher we need an ingestor layer" — Trajan noticed he was manually doing research→extract→dispatch and wants it fully automated

## 2026-03-18 — Future Frontend Layer Vision
- **Decision:** Create a custom web UI ("future-frontend-layer") to eventually replace Discord + Obsidian as the primary system interface
- **Tracked in vault:** As a vision document for long-term system design consideration
- **Tech:** Next.js 15 app, Phase 0 built and running at localhost:3000
- **Context:** "I want to create a new vision we keep track of in the vault and think about in system design, 'future-frontend-layer' which at its core serves as a replacement for this discord + markdown/vault/obsidian viewer"

## 2026-03-18 — Research-Ingest-Implement (RII) Loop
- **Decision:** The core autonomous operational pattern is a continuous Research → Ingest → Implement loop
- **Architecture:** Research (web/GitHub/Reddit/arXiv) → Ingest (extract value, key takeaways) → Implement (dispatch agents, build features, post proposals to desk)
- **Loop:** Must run continuously with hooks to prevent it from going dry — "force it with hooks to not go dry"
- **Context:** "The research, ingest, implement work loop... I still want this researched and relevant sources + implement proposals I want on my desk as a new post in desk forum in discord, in a continuous loop"

## 2026-03-18 — Loose Threads Audit
- **Decision:** Analyze all projects, instructions, and inputs over the past 5 days for uncompleted work, usage patterns, and optimizations
- **Scope:** Identify loose threads that need redispatching, revision, execution, and finalization
- **Context:** "lots of loose threads that need to be redispatched, revised, actually executed and finalized and the systems to achieve what I'm talking about implemented"

## 2026-03-18 — Don't Install, Reimplement External Tools
- **Decision:** When finding useful external tools/skills (e.g., from ClawHub), study them but reimplement the best ideas rather than installing them as dependencies
- **Context:** "Take good ideas from clawhub and task resume, don't install those, reimplement them" — keeps the system self-contained and avoids dependency risk

## 2026-03-18 — Dispatch Reliability as P0
- **Decision:** Agent dispatch reliability elevated to the single highest priority system problem
- **Assessment:** "Agent dispatch is pathetic" — current dispatch fails silently, agents don't actually run
- **Required:** Watchdogs, auto-retry, verification hooks, task-watchdog.sh built as first step
- **Context:** If dispatch doesn't work, the entire autonomous system is theater

## 2026-03-18 — arXiv 2603.15381 as System Design Reference
- **Decision:** Use arXiv paper 2603.15381 as a reference for system design and configuration
- **Context:** Shared during a rapid configuration session — needs deeper analysis for specific takeaways

## 2026-03-18 — 20+ Agent Roster with Inter-Agent Dispatch
- **Decision:** Expand agent roster to 20+ specialized agents with dynamic creation and inter-agent dispatch
- **Key features:** Agents can call each other, new agents created dynamically at runtime via `create-agent.sh`, Prompt Engineer kept as utility agent dispatchable by others
- **Architecture:** "Any session can be switched between agents and personas effectively"
- **Context:** "Fix the agents list to more specialized roles and expansion, fix dispatcher to use all of em, make it so they can call each other"

## 2026-03-18 — VM Resource Management Policy
- **Decision:** Dispatch heavy computation to host machine Claude Code; never restart/stop/interrupt the VM
- **Constraint:** "Do not restart VM or stop it or interrupt or anything" — VM stability is sacrosanct
- **Context:** VM runs EMA gateway; any interruption kills all active sessions and agents

## 2026-03-18 — Pipeline Auto-Generation from Usage Patterns
- **Decision:** Auto-create new research→implement pipelines by observing Trajan's repeated manual actions
- **Context:** "Create more pipelines based off all usage patterns" — if Trajan does something twice manually, it should become an automated pipeline

## 2026-03-18 — Mobile-First Frontend Strategy
- **Decision:** Frontend layer must have completely separate mobile and desktop experiences — mobile is not responsive desktop
- **Process:** Outline effective desktop view first, then focus 100% on mobile functionality
- **Context:** "Completely different mobile and desktop views" — mobile = purpose-built Mission Control for phone, not a shrunk desktop

## 2026-03-18 — Graceful Gateway Restart Protocol
- **Decision:** Develop a separate gateway restart protocol that doesn't interrupt working agents
- **Requirement:** Agents continue working in Discord while gateway safely restarts without error; no visible disruption
- **Context:** "Separately develop a restart gateway protocol that does not interrupt agents working, they continue in the discord, and safely re-starts itself without error"

## 2026-03-18 — Overdrive Mode (6-Hour Autonomous Sprint)
- **Decision:** "Overdrive" = max parallel agents for 6+ hours, improving system + working on projects + progressing toward vision
- **Trigger:** Trajan says "overdrive" or "start work in overdrive"
- **Execution:** All overnight tasks implemented, all available agents dispatched, soft gateway restart when ready, then continuous productive work
- **Context:** "When everything in log is done trigger the soft gateway restart... then get many agents up and running in overdrive for next 6 hours"

## 2026-03-18 — Research Source Expansion (Inspiration Sources)
- **Decision:** Specifically study awesome-copilot lists, "agent architect bible" document, and LangChain deepagents as inspiration
- **Method:** Extract best ideas and implement directly — not install, reimplement
- **Context:** "Research GitHub awesome copilot for opportunities to grab skills, hooks, insights, exploration and inspiration. Implement directly."

## 2026-03-18 — Memory Promotion System
- **Decision:** Build an explicit system for promoting important ephemeral context (conversation insights, discovered patterns, corrections) into permanent vault memory
- **Scope:** "Definitely memory promotion as well as consultation of all sources and vault for memory system improvement"
- **Context:** Part of pattern formalization — the self-learning loop needs a formal promotion pipeline, not ad-hoc memory writes

## 2026-03-18 — CLAUDE.md Compliance as Formal Pattern
- **Decision:** Formalize CLAUDE.md compliance checking as an ongoing verification thread
- **Scope:** "CLAUDE.md compliance thread, formalize and normalize patterns"
- **Context:** CLAUDE.md instructions drift from actual behavior over time — need automated compliance verification

## 2026-03-18 — Process Registry for Complete Resume
- **Decision:** Build a process registry that tracks ALL running/interrupted processes to guarantee 100% resume coverage after disruptions
- **Requirement:** "I swear there was more" — current resume misses processes. Need exhaustive tracking.
- **Extension:** Consider a parallelization engine for mass resume of interrupted workflows
- **Context:** Incomplete resume after gateway restarts or disruptions is a recurring trust-breaking failure

## 2026-03-18 — Vault Evolution with Middle Ground
- **Decision:** When restructuring vault, actively check whether useful patterns from previous versions should be preserved
- **Principle:** Evolution should be selective, not scorched earth — keep what works from old structure
- **Context:** "Good movement of vault direction? Double check. Any room for middle ground from old versions?"

## 2026-03-18 — Vault Quality Gates (Lint + Scoring)
- **Decision:** Formalize vault quality as measurable, scriptable gates — vault-lint.sh (per-file pass/fail) and vault-quality-score.sh (0-100 composite)
- **Criteria:** Required frontmatter (title, created, updated, type, status, confidence, source, summary, tags), confidence ≠ 0.90, source ≠ unknown, 2+ wikilinks, summary < 150 chars
- **Scoring dimensions:** Frontmatter completeness, wikilink density, confidence calibration, summary coverage, source attribution, file length (penalize <5 lines)
- **Context:** "confidence: 0.90 is meaningless" — 440/469 notes had identical confidence. Quality must be measurable to improve.

## 2026-03-18 — Checkpoint-Based Execution Protocol
- **Decision:** Agents write progress checkpoints every 2 minutes to /tmp/{task_id}-checkpoint.md
- **Recovery:** On timeout, read checkpoint and save to dispatch/results/{task_id}-partial.txt instead of total loss
- **Status:** Tasks get 'partial' status instead of 'failed' when checkpoints exist
- **Context:** Eliminates total work loss on timeouts — partial progress is captured and can be resumed

## 2026-03-18 — Reflexion Pattern for Dispatch
- **Decision:** Before spawning an agent, inject "lessons learned" from last 3 outcomes for that agent+task_type combination
- **Implementation:** dispatch-reflect.sh reads outcome-tracker.json, extracts what worked/failed/common pitfalls, outputs text injected into agent prompt
- **Context:** Agents should learn from their own history — repeated failures on the same task type with no adaptation is waste

## 2026-03-18 — Per-Agent Persistent Memory
- **Decision:** Each agent gets its own persistent memory directory with learnings.md and common-failures.md
- **Agents covered:** researcher, coder, ops, security, vault-keeper, browser-automation, prompt-engineer, concierge, devils-advocate
- **Seeded from:** Existing agent-performance.md observations
- **Context:** Agents need persistent context about their own past performance, not just task-level memory

## 2026-03-18 — Semantic Hub MOC Architecture
- **Decision:** Create _hubs/ directory with 6 Map of Content hub notes linking all related content
- **Hubs:** agent-system, knowledge-management, business, integrations, security, + others as needed
- **Context:** Vault lacks navigational structure — hub notes serve as semantic entry points for both humans and agents

## 2026-03-18 — Tool Study and Integration Wave
- **Decision:** Research, clone locally, and integrate concepts from multiple specific tools
- **Tools:** agent-fs (desplega-ai), harbor (oSealtic), Kali MCP, scitex-python (scientific reasoning/methodology), AdaL CLI, OCD, Rune
- **Method:** Get code local, complete walkthrough, implement valuable concepts — not surface study
- **Scientific layer:** Extract reasoning, structure, evidence, scientific method from scitex-python and integrate as a system capability
- **Academic research:** Add academic research as a formal layer alongside web/GitHub/Reddit research
- **Context:** "grab its reasoning, structure, evidence, concepts, and scientific method + methodology and begin integrating into my system, do academic research and another layer of research"

## 2026-03-18 — Cross-Agent Memory Sharing
- **Decision:** Wire per-agent memory dirs into dispatch — inject learnings before spawning, append results after completion
- **Implementation:** dispatch-engine.sh reads memory/{agent_id}/learnings.md, injects last 10 lines as PAST LEARNINGS block; agent-memory-sync.sh reads all agents' learnings and creates shared-insights.md
- **Context:** Agents learn from their own history and cross-pollinate insights

## 2026-03-18 — First-Class Workflow Templates
- **Decision:** Create reusable workflow template JSON files for the dispatch system
- **Templates:** research-and-implement, vault-cleanup, security-audit, deep-research, full-evolution
- **Location:** ~/dispatch/workflows/
- **Context:** Codifying common multi-step agent workflows as repeatable, triggerable templates

## 2026-03-18 — Document Generation Capability
- **Decision:** Build document generation tooling with templates for proposals, reports, client briefs, invoice drafts
- **Templates at:** ~/vault/Templates/Documents/
- **Context:** System should produce professional documents, not just code and vault notes

## 2026-03-18 — Proactive Task Discovery Upgrade (10% → 40%)
- **Decision:** Expand proactive task generation to scan more sources: Discord channels, vault TODO items, stale files, dispatch follow-ups, aspiration gap items
- **Implementation:** Enhanced proactive-task-generator.sh + aspiration-task-picker.sh
- **Context:** System should find its own work, not just execute what's dispatched

## 2026-03-18 — GitHub PR Review Agent Workflow
- **Decision:** Build automated PR review workflow — list open PRs, fetch diffs, dispatch researcher for review, post comments
- **Implementation:** gh-pr-review.sh + pr-review.json workflow template
- **Context:** Extending agent capabilities beyond the vault into GitHub collaboration

## 2026-03-18 — Summary Backfill as Search Priority
- **Decision:** Add summary frontmatter to all vault files — critical for QMD vector search quality
- **Requirement:** One sentence under 150 chars, derived from first non-frontmatter paragraph
- **Priority:** Only 20/505 notes had summary field — this is a P1 for search/retrieval quality
- **Context:** "summary is the primary embedding target" — QMD search quality depends on summary field existing

## 2026-03-18 — Agent Factory v2 (Template-Based Agent Creation)
- **Decision:** Built template-based agent factory at ~/skills/agent-factory-v2/ with create-agent.sh
- **Templates:** Common agent types: researcher, coder, ops, security, utility — with sensible defaults
- **Capability:** Generate new specialist agents from templates at runtime, supporting the 20+ agent roster expansion
- **Context:** Completes the dynamic agent creation infrastructure decided earlier — agents can now be manufactured on demand, not just pre-defined

## 2026-03-18 — Instruction Catalogue
- **Decision:** Build a searchable instruction catalogue — an index of all agent instructions, skills, and behavioral patterns
- **Scope:** Codify everything learned into reusable instruction sets; study external skill frameworks (codex-skills, obra/superpowers) and integrate best patterns
- **Context:** "implement what you learn And instruction-catalogue" — the system should have a master catalogue of all instructions it has learned and can apply

## 2026-03-18 — Codex-Skills Study & Integration
- **Decision:** Study and integrate codex-skills and similar external skill frameworks into the system
- **Method:** Get code locally, walkthrough, extract valuable patterns — don't install wholesale
- **Context:** "also get codex-skills" — part of the broader pattern of studying external skill systems and reimplementing the best ideas

## 2026-03-19 — Discord Server Restructure v2 (Multi-Agent Deliberation)
- **Decision:** Complete restructure of the Discord server organization via multi-agent debate
- **Process:** Multiple agents iterate, debate, and present a pitch — deliberative process before structural changes
- **Initial proposal:** 3 categories, 12 channels — down from 7 categories, 40+ channels
- **Goal:** "genuinely useful, innovative system" for a solo operator running an AI agent team
- **Context:** Trajan initiated deliberation rather than direct implementation — major structural changes go through multi-agent review first

## 2026-03-20 — Agent Feed as Complete Firehose
- **Decision:** #agent-feed channel becomes the complete event log + proposal surface for all system activity
- **Built:** feed-post.sh (universal poster), proposal.sh (interactive cards), proposal-cron.sh (auto-post/expire), hooks in dispatch.sh, knowledge-loop, proactive-generator, research-pipeline
- **Two streams:** Auto-execute tasks run silently and post results. Proposals need human input and appear as interactive cards.
- **Next:** Mirror feed to Agent OS GUI (web UI) bidirectionally
- **Context:** Trajan clarified tasks are separate from the agent feed. Feed = human interaction surface, tasks = background execution. Agent OS GUI is the polished frontend on top.

## 2026-03-20 — Vault→Neo4j Sync Ownership
- **Decision:** Vault→Neo4j sync owned by a **cron-triggered vault-sync agent**, running every 5 minutes via systemd timer
- **Mechanism:** Reads frontmatter from all vault `.md` files → diffs against last-known graph state → writes only changed nodes/edges to Neo4j (idempotent)
- **Rejected alternatives:** Obsidian plugin event hook (adds Obsidian dependency, breaks headless operation); dedicated always-on sync daemon (unnecessary overhead for a single-VM setup)
- **Pattern match:** Consistent with existing VM-host rsync bridge (60s systemd timer) and message harvester (cron-based batch reads)
- **Context:** Resolved open architecture TBD from `Research/System-Genome-Prior-Art.md`. TODO: implement vault-sync-agent once Neo4j node schema is finalized (see open question #1 in that file)
