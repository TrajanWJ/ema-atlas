---
title: "EMA 16-Week Roadmap — Cross-Pollination Edition"
date: 2026-04-04
updated: 2026-04-04
author: Strategist (subagent)
tags: [ema, roadmap, 16-week, cross-pollination, openclaw, vault, claude-code-bot, intelligence]
type: master-roadmap
status: active
confidence: 0.93
---

# 🗺️ EMA 16-Week Roadmap — Cross-Pollination Edition

**Design philosophy:** Compound momentum. Each week unlocks the next. Cross-pollination is a first-class deliverable — patterns export as soon as they're proven. No Honcho dependency. Memory concepts are native.

**Starting state (Week 6 baseline):**
- EMA execution system: concurrent-safe, semantically correct ✅
- Bridge (Elixir ↔ Claude Code): sync, Phase 1 ✅
- Proposals engine: generator + evaluator ✅
- OpenClaw: 29 agents, Discord/Telegram, stable ✅
- Claude Code Bot v2: running, monitored ✅
- Vault: ~100+ architecture docs, QMD semantic search ✅
- Host-VM Bridge: rsync every 60s, bidirectional ✅

---

## CROSS-POLLINATION DEPENDENCY GRAPH

```
                    EXPORTS →
                    
EMA ──────────────→ Campaign.Flow topology → OpenClaw multi-agent routing  [W7-8]
EMA ──────────────→ Outcome tracking schema → OpenClaw fitness scoring     [W8]
EMA ──────────────→ Reflexion pattern → Claude Code Bot context injection   [W9-10]
EMA ──────────────→ Deliberation Gate → OpenClaw pre-dispatch review        [W9]
EMA ──────────────→ ReflexionStore → Claude Code Bot memory layer          [W11]
EMA ──────────────→ Superman context format → OpenClaw skill context        [W12]

OpenClaw ─────────→ Skills architecture → EMA feature modules             [W9-10]
OpenClaw ─────────→ Heartbeat protocol → EMA health monitoring             [W8]
OpenClaw ─────────→ Agent fitness scoring → EMA agent routing weights      [W10]
OpenClaw ─────────→ AGENTS.md dispatch protocol → EMA CampaignManager     [W9]

Claude Code Bot ──→ Agent spawn pattern → EMA AgentBridge improvements    [W7-8]
Claude Code Bot ──→ Discord result formatting → EMA HQ notification style [W8]
Claude Code Bot ──→ Session ID tracking → EMA session store improvements  [W9]

Vault ────────────→ Wikilink graph structure → EMA knowledge graph edges   [W11]
Vault ────────────→ QMD semantic search → EMA Superman embedding pipeline  [W12]
Vault ────────────→ Staleness detection → EMA stale intent advisor         [W13]

Host-VM Bridge ───→ Bidirectional sync pattern → EMA P2P CRDT prototype   [W15]
```

---

## WEEKS 1–2 (April 7–18): "Core Loop Live"

**Theme:** Ship the minimum viable intelligent dispatch system. Make EMA run itself.

### Features Shipping

| Project | Feature | Effort | Notes |
|---------|---------|--------|-------|
| **EMA** | Campaign.Flow struct + state machine | 2h | `:forming → :ready → :running → :completed` |
| **EMA** | Bridge async dispatch (Phoenix PubSub + long-poll) | 3h | Returns 202 immediately |
| **EMA** | `/api/projects/:id/context` endpoint | 4h | Live SQLite + task/proposal data |
| **EMA** | Dispatch Board (WebSocket + React viz) | 4h | Campaign topology, click-to-detail |
| **EMA** | Deliberation Gate (StructuralDetector) | 2h | Intercepts restructure/migrate/delete |
| **EMA** | EMA ReflexionStore (native memory, no Honcho) | 2h | Last 3 outcomes by task_type injected pre-dispatch |
| **EMA** | Outcome Dashboard v1 | 2d | Token cost, success rates, fitness scores |
| **EMA** | Execution Live Stream | 2d | Real-time agent output via claude-wrapper.sh |
| **EMA** | EMA CLI (6 commands: create/dispatch/status/list/logs/cancel) | 3d | No dependency on HQ UI |
| **HQ Frontend** | WebSocket wiring to executions:all | 2d | Live dispatch board embedded |

### Quick Wins (Must Ship, Low Effort)
- **ReflexionStore**: 2h, immediately makes every dispatch smarter
- **Deliberation Gate keyword list**: keyword matcher for 8 structural verbs — prevents most rework
- **outcome-tracker.json write hook**: 30min, unlocks all learning features
- **EMA CLI task create**: fastest path to submitting tasks without HQ UI

### Cross-Pollination Events

**🔄 CP-1: Campaign.Flow topology → OpenClaw multi-agent dispatch routing**
- EMA builds `Campaigns.Flow` as a DAG: nodes=agents, edges=handoffs
- Pattern: each node has `role`, `input_spec`, `output_spec`, `completion_condition`
- OpenClaw imports: structured multi-agent dispatch can use same DAG contract
- What moves: the struct spec + state machine logic
- When: After Campaign.Flow ships (mid W7)
- Owner: Right Hand reads EMA's struct and annotates AGENTS.md with equivalent pattern

**🔄 CP-2: Claude Code Bot spawn pattern → EMA AgentBridge improvements**
- Claude Code Bot's `bot.py` spawns Claude sessions with session ID tracking
- EMA Bridge should import: session ID → persistent handle pattern (already partially done)
- What moves: Session ID ownership model, retry-on-orphan pattern
- When: W8 during Bridge async work
- Action: Read `claude-code-bot/bot.py`, extract session management pattern, apply to `Claude.Bridge`

### Architecture Decisions (Make Before W7 Starts)
1. **Honcho = OUT** — Use `Ema.ReflexionStore` (last 3 outcomes by type). Native. No external service.
2. **Superman W7** = stub only. Real engine in W9. Context endpoint returns structured file data, no embeddings.
3. **Context endpoint integration fields** = omit from MVP. `"integrations": null` placeholder.
4. **Bridge async** = Phoenix PubSub + long-poll fallback. WebSocket is primary.
5. **Dispatch Board** = React + Zustand + `dispatchBoardStore`. Not D3 yet — nodes as positioned divs.

### Risk Flags
- 🚨 **Tauri daemon auto-start broken** — Must debug on FerrissesWheel Day 1. Blocks demo.
- ⚠️ **Bridge sync→async migration** — 6 callsites need updating. One missed = silent token burn.
- ⚠️ **outcome-tracker.json must be wired** — Everything downstream depends on this. Smoke test early.
- ⚠️ **CLI scope creep** — Hard cap: 6 commands, no feature parity chase.

### End-State (After W1-2)
The system can:
- Accept tasks via CLI or HQ UI
- Dispatch agents async (non-blocking) with context injection
- Show live dispatch topology in HQ
- Require proposals for structural changes (no more blind reworks)
- Inject prior outcomes into every agent before it starts
- Track all outcomes with token costs and success rates
- Stream live execution output

**Single most important thing to get right:** The Bridge async dispatch. Everything else (live stream, dispatch board, reflexion) flows through it. If it stays sync, all downstream features are blocked.

---

## WEEKS 3–4 (April 21 – May 1): "Intelligence Layer"

**Theme:** Proposals get smarter. Agents get context. Campaigns run multi-step.

### Features Shipping

| Project | Feature | Effort | Notes |
|---------|---------|--------|-------|
| **EMA** | Proposal Comparison Viewer | 2d | Side-by-side diff, quality scores, select-and-dispatch |
| **EMA** | Agent Workbench (SOUL.md A/B test) | 3d | Edit agent prompts, test in-app, compare outcomes |
| **EMA** | Execution Diff Viewer | 2d | Git diff of what agent actually changed |
| **EMA** | Campaign Manager v1 | 5d | Multi-step: Research → Build → Review pipelines |
| **EMA** | Superman.Context stub wired | 2h | `.superman` file data in context endpoint |
| **OpenClaw** | AGENTS.md annotated with Campaign.Flow pattern | 1h | Right Hand imports DAG topology for multi-agent routing |

### Quick Wins
- **Proposal diff view**: 1 day, immediately useful for every dispatch decision
- **Execution Diff Viewer**: shows exactly what changed — fastest way to catch bad agents
- **Campaign Manager "linear" mode**: 2 sequential steps before adding branching

### Cross-Pollination Events

**🔄 CP-3: OpenClaw AGENTS.md dispatch protocol → EMA CampaignManager**
- OpenClaw's AGENTS.md has a mature "Dispatch Cycle" (decompose→assign→dispatch→verify→log→chain)
- EMA CampaignManager should import: the verify (two-stage review) + retry logic
- What moves: The spec-compliance → quality check → iterate (max 3) pattern
- When: W9, before CampaignManager ships
- Action: Embed the 3-loop retry + spec compliance check inside EMA's Campaign execution

**🔄 CP-4: EMA outcome tracking schema → OpenClaw agent fitness scoring**
- EMA's `outcome-tracker.json` schema is richer than OpenClaw's `memory/agent-performance.md`
- What moves: Add `quality_score`, `proposal_used`, `learned` fields to OpenClaw's tracker
- When: W9, after EMA schema is battle-tested with real W7-8 data
- Action: Vault Keeper updates `memory/outcome-tracker.json` format to match EMA schema exactly

### Architecture Decisions
1. **Campaign Manager topology**: Start with linear DAG only (step1 → step2 → step3). Add branching in W11.
2. **Agent Workbench scope**: Edit SOUL.md fragments only, not full replacement. A/B dispatch to test variant.
3. **Execution Diff format**: Full git diff, stored in `intents/SLUG/diffs/`. Link from Dashboard.

### Risk Flags
- 🚨 **Campaign Manager is 5d** — Largest feature this period. Parallelize with Execution Diff.
- ⚠️ **Agent Workbench rabbit hole** — Time-box A/B testing. Hard cap: 2 quality metrics, not 10.
- ⚠️ **Superman stub latency** — If `.superman` file reads are slow, cache on first read.

### End-State (After W3-4)
The system can:
- Compare proposal variants before committing to one
- Run multi-step campaigns (Research → Build → Review) without manual intervention
- Show exactly what every agent changed (git diff)
- Tune agent prompts and test quality in-app
- OpenClaw's dispatch uses DAG topology from EMA campaigns
- OpenClaw outcome tracking upgraded to EMA-quality schema

**Single most important thing to get right:** Campaign Manager. It transforms EMA from "single-agent task runner" to "multi-agent workflow engine." This is the architecture unlock that enables everything after.

---

## WEEKS 5–6 (May 4–15): "Cross-Project Mesh"

**Theme:** Patterns flow bidirectionally. EMA features appear in OpenClaw. OpenClaw skills become EMA modules.

### Features Shipping

| Project | Feature | Effort | Notes |
|---------|---------|--------|-------|
| **EMA** | Knowledge Graph Browser (vault-connected) | 5d | Nodes: concepts/entities/decisions. Edges from vault. |
| **EMA** | Multi-Space UI v1 | 3d | Space selector: Personal / Proslync / etc |
| **EMA** | Vault Auto-Sync (bidirectional backlinks) | 2d | EMA writes wikilinks back to vault when outcomes land |
| **OpenClaw** | Heartbeat protocol → EMA health endpoint | 1d | `/api/health` exposes same metrics as OC heartbeat |
| **OpenClaw** | Skill context injection using Superman format | 2d | Skills read project context using EMA's format spec |
| **Claude Code Bot** | Session ID tracking improvement (from EMA pattern) | 1d | Bot imports EMA's session ownership model |

### Quick Wins
- **`/api/health` endpoint**: 30min, makes EMA monitorable the same way OpenClaw monitors itself
- **Vault auto-sync wikilinks**: 2h, vault becomes the ground truth for EMA knowledge graph seeds
- **Space selector UI shell**: 1d even if only Personal space works — sets the pattern

### Cross-Pollination Events

**🔄 CP-5: OpenClaw skills architecture → EMA feature modules**
- OpenClaw skills are isolated SKILL.md + scripts packages, installable and swappable
- EMA can adopt same pattern: feature modules with install/uninstall/configure lifecycle
- What moves: The `SKILL.md` spec format + install convention
- When: W11 design phase (ship installable feature modules in W13)
- Action: Design `EMA_MODULE.md` spec that mirrors SKILL.md format

**🔄 CP-6: EMA Deliberation Gate → OpenClaw pre-dispatch review**
- EMA's Deliberation Gate intercepts structural tasks before dispatch
- OpenClaw should have equivalent: before spawning agent for high-complexity/high-risk tasks, require proposal
- What moves: `StructuralDetector` keyword list + gate logic (simplified for agent tasks)
- When: W11, after EMA gate has shipped and proven in production
- Action: Right Hand imports gate as "high-stakes task review" — ask Trajan before dispatching agents on irreversible tasks

**🔄 CP-7: Vault wikilink graph → EMA knowledge graph seeds**
- Vault has 100+ docs with `[[wikilinks]]` — natural graph edges
- EMA Knowledge Graph Browser can bootstrap from vault's existing graph
- What moves: Parse `[[wikilinks]]` from vault markdown, create EMA graph edges automatically
- When: W11 (Knowledge Graph Browser)
- Action: EMA reads vault, extracts all `[[wikilinks]]`, maps them to EMA concepts/entities

### Architecture Decisions
1. **Knowledge Graph storage**: PostgreSQL graph tables (nodes + edges) in EMA DB. Not a separate graph DB.
2. **Multi-Space isolation**: Each space is a DB row with isolated task/execution/proposal namespaces.
3. **Vault sync direction**: Vault → EMA (one-way seed). EMA → Vault (outcome notes only).
4. **OpenClaw health monitoring EMA**: Heartbeat check queries `/api/health`. Alerts on drift.

### Risk Flags
- 🚨 **Knowledge Graph scope**: Ship list + filter first. D3 visualization is Week 13. No scope creep.
- ⚠️ **Vault wikilink parser**: Obsidian has escaped brackets, aliases, block references. Handle gracefully.
- ⚠️ **Multi-Space data isolation**: Cross-space queries must be opt-in. Default: no leakage between spaces.

### End-State (After W5-6)
The system can:
- Navigate vault + codebase as connected graph in HQ
- Work in multiple spaces (Personal, Proslync) with isolated agent contexts
- Write outcome notes back to vault automatically
- OpenClaw monitors EMA health using same protocol as its own heartbeats
- OpenClaw skills use Superman-format project context when dispatching
- Claude Code Bot has improved session tracking

**Single most important thing to get right:** Multi-Space data isolation. If spaces leak, the whole model collapses. Get the namespace separation correct before adding cross-space views.

---

## WEEKS 7–8 (May 18 – May 29): "Agent Evolution"

**Theme:** Agents learn from themselves. Specialization emerges. Self-improvement loops close.

### Features Shipping

| Project | Feature | Effort | Notes |
|---------|---------|--------|-------|
| **EMA** | Reflexion Loop v2 (domain-specialized) | 3d | Last 3 outcomes per domain+agent pair, not just type |
| **EMA** | Agent Specialization Engine | 4d | Track per-agent fitness per domain; auto-route to best |
| **EMA** | Memory Dreaming (scheduled job) | 2d | Analyzes recent outcomes, writes preference inferences to vault |
| **EMA** | Installable Feature Modules (EMA_MODULE.md spec) | 3d | OpenClaw skill pattern applied to EMA features |
| **EMA** | Stale Intent Advisor (from vault staleness pattern) | 1d | Flags intents with no execution in 14+ days |
| **OpenClaw** | Pre-dispatch review gate (from EMA Deliberation Gate) | 2d | High-stakes tasks require proposal before agent spawn |
| **Claude Code Bot** | Reflexion context injection (from EMA pattern) | 2d | Bot reads last 3 bot-task outcomes before dispatching |

### Quick Wins
- **Memory Dreaming cron**: 30min setup (cron + analysis script), massive compound value
- **Stale Intent Advisor**: 1d, surfaces forgotten work without needing to manually audit
- **Agent fitness auto-routing**: 1d wire-up once fitness data exists from W1-6

### Cross-Pollination Events

**🔄 CP-8: EMA ReflexionStore → Claude Code Bot context injection**
- EMA's `Ema.ReflexionStore` format is well-tested by W13
- Claude Code Bot should import the same "last 3 outcomes per domain" injection
- What moves: The `reflexion_block` format + domain bucketing logic
- When: W13 (after EMA reflexion is battle-hardened)
- Action: Right Hand extracts reflexion_block format, Bot injects it before dispatching Claude sessions

**🔄 CP-9: EMA memory dreaming → OpenClaw vault writing pattern**
- EMA's dreaming job analyzes outcomes and writes inferences to vault
- OpenClaw already does this manually (SOUL.md "write preferences to vault")
- What moves: Automated dreaming job pattern — cron + outcome analysis + structured vault write
- When: W13, parallel implementation
- Action: Ops agent creates equivalent cron for OpenClaw that analyzes agent-performance.md + writes to vault

**🔄 CP-10: OpenClaw agent fitness scoring (upgraded in W9-10) → EMA routing weights**
- OpenClaw's fitness data now uses EMA's richer schema (from CP-4)
- EMA's specialization engine reads fitness by domain from OpenClaw's outcome tracker
- What moves: Cross-system fitness comparison — "which system's coder agent is better at feature-build?"
- When: W14 (unified fitness view)
- Action: EMA dashboard shows EMA agents + OpenClaw agents side by side with comparable fitness scores

### Architecture Decisions
1. **Memory Dreaming output format**: Structured vault notes in `vault/System/Agent-Inferences/YYYY-MM-DD.md`
2. **Feature Module install location**: `ema/modules/MODULE_NAME/` with `EMA_MODULE.md` at root
3. **Specialization routing**: Soft override only. Human can always pick a different agent. No hard lock.
4. **Reflexion domain buckets**: `[feature-build, research, review, refactor, migration, ops]` — 6 buckets, no proliferation

### Risk Flags
- 🚨 **Memory Dreaming quality**: Bad inferences written to vault are worse than none. Add confidence threshold (>0.7 to write).
- ⚠️ **Specialization lock-in**: If one agent "wins" a domain, diversity drops. Keep at least 2 agents per domain eligible.
- ⚠️ **Installable modules cold start**: Modules with dependencies need dependency resolution. Keep simple: no circular deps.

### End-State (After W7-8)
The system can:
- Route tasks to the statistically best agent for each domain
- Self-improve overnight via memory dreaming (wake up smarter)
- Specialize agents based on accumulated outcome data
- Manage capabilities as installable feature modules
- OpenClaw gates high-stakes agent dispatches with proposal requirement
- Claude Code Bot has reflexion context before every session

**Single most important thing to get right:** Memory Dreaming confidence thresholds. Low-confidence inferences poisoning the vault is the primary failure mode. Gate aggressively (>0.7) and log what was written for auditability.

---

## WEEKS 9–10 (June 1–12): "Distributed Preview"

**Theme:** P2P foundations. External API. Distributed agent clusters.

### Features Shipping

| Project | Feature | Effort | Notes |
|---------|---------|--------|-------|
| **EMA** | P2P Mesh Preview (mDNS + Tailscale, 2 nodes) | 1w | Agent-VM ↔ host machine as first 2-node cluster |
| **EMA** | External API (REST + webhooks for external tools) | 3d | POST /api/external/task, GET /api/external/status/:id |
| **EMA** | Distributed Agent Clusters (campaign across 2 nodes) | 4d | CampaignManager routes steps to different EMA instances |
| **EMA** | Superman Semantic Engine (BM25 + Ollama embeddings) | 5d | From stub to real context injection |
| **EMA** | Knowledge Graph D3 Visualization | 2d | Full graph viz (deferred from W11) |
| **OpenClaw** | EMA external API integration | 2d | OC can dispatch tasks to EMA via API |
| **Host-VM Bridge** | P2P sync pattern (CRDT prototype) | 3d | Replace rsync timer with CRDT merge |

### Quick Wins
- **External API**: Unlocks any tool (scripts, webhooks, Discord slash commands) to dispatch EMA tasks
- **2-node P2P test**: Agent-VM + host-machine already have SSH tunnel. mDNS discovery over LAN = almost free.
- **Superman BM25 first**: Keyword search before vector search. Ships in 2d.

### Cross-Pollination Events

**🔄 CP-11: Host-VM Bridge bidirectional sync → EMA P2P CRDT prototype**
- Host-VM Bridge uses rsync with file-based mailbox pattern
- EMA P2P needs CRDT-based sync, but can bootstrap using same "bidirectional file exchange" concept
- What moves: The `inbox-host/` + `inbox-vm/` + archive pattern → EMA node "pending outbox" pattern
- When: W15 (P2P work)
- Action: EMA models each node as having `outbox/` + `inbox/` directories for pending CRDT deltas

**🔄 CP-12: EMA external API → Claude Code Bot enhanced dispatching**
- EMA's `/api/external/task` endpoint lets external tools submit tasks
- Claude Code Bot can become a Discord → EMA bridge (not just Discord → Claude directly)
- What moves: Bot can submit to EMA, get back a campaign with tracking, show HQ link in Discord
- When: W15-16
- Action: Add EMA dispatch mode to bot.py. `/ema task [description]` submits to EMA instead of direct Claude

### Architecture Decisions
1. **P2P transport stack**: mDNS for LAN (zero config), Tailscale for cross-network. No DHT in preview.
2. **CRDT library**: `crdt` hex package for Elixir. LWW Register for task state. Automerge for rich text.
3. **External API auth**: Bearer tokens (static, per-integration). No OAuth in preview.
4. **Distributed campaign routing**: Step affinity (prefer same node) unless agent availability requires cross-node.

### Risk Flags
- 🚨 **CRDT merge conflicts**: Test with intentional concurrent edits before any production campaign runs on 2 nodes.
- 🚨 **P2P scope**: Ship 2-node LAN-only. Global DHT is Phase 5+. Don't let mesh ambition eat the sprint.
- ⚠️ **Ollama latency**: Embedding pipeline adds 200-400ms per context build. Cache aggressively.
- ⚠️ **External API abuse**: Even internal-only, add rate limiting (100 req/min per token) from day 1.

### End-State (After W9-10 / Week 16)
The system can:
- Run agent campaigns distributed across 2 nodes (agent-VM + host machine)
- Accept tasks from any external tool via REST API
- Give agents real semantic codebase context (BM25 + embeddings)
- Discover peer EMA nodes automatically on the LAN
- Sync state between nodes using CRDTs (no central authority)
- Navigate the knowledge graph with full D3 visualization
- Claude Code Bot can dispatch to EMA and show campaign tracking links

---

## FULL CROSS-POLLINATION DEPENDENCY GRAPH

```
WEEK 7-8 (W1-2 of roadmap):
  EMA Campaign.Flow ──────────────────→ OpenClaw dispatch routing [CP-1]
  Claude Code Bot spawn pattern ───────→ EMA AgentBridge session model [CP-2]

WEEK 9-10 (W3-4 of roadmap):
  OpenClaw AGENTS.md dispatch protocol → EMA CampaignManager retry logic [CP-3]
  EMA outcome tracking schema ─────────→ OpenClaw fitness scoring upgrade [CP-4]

WEEK 11-12 (W5-6 of roadmap):
  OpenClaw skills architecture ────────→ EMA feature module spec [CP-5]
  EMA Deliberation Gate ───────────────→ OpenClaw pre-dispatch review [CP-6]
  Vault wikilink graph ────────────────→ EMA knowledge graph seeds [CP-7]

WEEK 13-14 (W7-8 of roadmap):
  EMA ReflexionStore ──────────────────→ Claude Code Bot context injection [CP-8]
  EMA memory dreaming job ─────────────→ OpenClaw vault writing automation [CP-9]
  OpenClaw fitness scores (upgraded) ──→ EMA routing weight comparison [CP-10]

WEEK 15-16 (W9-10 of roadmap):
  Host-VM Bridge sync pattern ─────────→ EMA P2P CRDT outbox model [CP-11]
  EMA external API ────────────────────→ Claude Code Bot EMA dispatch mode [CP-12]
```

**Cross-pollination count by period:**
- W1-2: 2 events ✅
- W3-4: 2 events ✅
- W5-6: 3 events ✅
- W7-8: 3 events ✅
- W9-10: 2 events ✅
- **Total: 12 cross-pollination events across 10 weeks**

---

## QUICK REFERENCE TIMELINE

```
PERIOD      WEEKS    THEME                         CRITICAL FEATURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
W1-2        Apr 7-18  Core Loop Live               Bridge async dispatch
W3-4        Apr 21-  Intelligence Layer            Campaign Manager v1
            May 1
W5-6        May 4-15  Cross-Project Mesh           Multi-Space + knowledge graph
W7-8        May 18-29 Agent Evolution              Memory dreaming + specialization
W9-10       Jun 1-12  Distributed Preview          P2P mesh + external API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**EMA feature cadence mapping:**
```
W7-W8   (roadmap W1-2): Dispatch Board, Gate, Outcome Dashboard, Live Stream, CLI ✅
W9-W10  (roadmap W3-4): Proposal Comparison, Agent Workbench, Exec Diff, Campaigns v1 ✅
W11-W12 (roadmap W5-6): Cross-project patterns → OpenClaw, Multi-Space, vault sync ✅
W13-W14 (roadmap W7-8): Reflection loops, specialization, self-improvement ✅
W15-W16 (roadmap W9-10): P2P preview, external API, distributed clusters ✅
```

---

## SINGLE MOST IMPORTANT THING PER PHASE

| Phase | Most Important Thing | Why |
|-------|---------------------|-----|
| **W1-2** | Bridge async dispatch | Every downstream feature flows through it |
| **W3-4** | Campaign Manager architecture | Transforms single-agent → multi-agent system |
| **W5-6** | Multi-space data isolation | Cross-space leakage breaks the whole model |
| **W7-8** | Memory dreaming confidence thresholds | Bad inferences are worse than no inferences |
| **W9-10** | CRDT conflict resolution tests | Production distributed systems need this proven before going live |

---

## VISION STATEMENT: WHAT DOES WEEK 16 LOOK LIKE?

At Week 16, you have a system that is:

**Distributed by default.** EMA runs on your agent-VM and your host machine as a 2-node cluster. Tasks spawn on whichever node has capacity. State syncs via CRDTs — no central authority, no single point of failure. If one node goes down, the other keeps running.

**Intelligent without external services.** Every agent receives a context block before starting: last 3 outcomes from the same domain, relevant vault notes, project history, Superman codebase context. No Honcho, no API calls — all local. Memory dreaming runs every night, analyzes outcomes, writes inferences to vault. The system wakes up smarter.

**Self-improving through specialization.** After 10 weeks of outcome tracking, agents have domain fitness scores. The system routes `feature-build` tasks to the agent that has succeeded 87% of the time on feature-build, not just whichever one's available. Agent Workbench lets you tune SOUL.md fragments in-app and test the difference.

**Cross-pollinated across every project.** OpenClaw's dispatch uses Campaign.Flow topology. Claude Code Bot injects reflexion blocks from EMA's pattern. OpenClaw gates high-stakes dispatches with EMA's Deliberation Gate. The Vault seeds EMA's knowledge graph. Every project is borrowing the best patterns from every other project.

**Open to external integration.** Any tool — Discord slash commands, scripts, webhooks, other apps — can submit tasks to EMA via REST API. Results come back via webhook or polling. EMA is no longer just "Trajan's dispatch system" — it's an agent infrastructure that anything can plug into.

**Manageable as a knowledge system.** The Knowledge Graph Browser shows EMA's own architecture as a navigable graph seeded from the vault. You can ask "which projects depend on the vault architecture?" and get a real answer. Stale intents surface automatically. Every outcome writes a note back to vault.

---

## WHAT COULD DERAIL THIS

1. **Bridge async migration** (W1-2) — If the sync→async Bridge migration creates regressions, half the W1-2 features are blocked. Mitigate: write comprehensive tests before migration, keep sync wrapper for backward compat.

2. **Campaign Manager complexity** (W3-4) — This is the largest feature (5d) and the most architecturally significant. If it ships with a bad state machine, it's expensive to fix. Mitigate: linear DAG only, prove it works before adding branching.

3. **Memory Dreaming quality** (W7-8) — The dreaming job writes to vault. If it writes bad inferences confidently, vault gets poisoned. Mitigate: confidence threshold >0.7 gate, keep a `dream-log.md` of every write for auditability.

4. **P2P scope explosion** (W9-10) — The mesh architecture is ambitious. mDNS + Tailscale for 2 nodes is reasonable. Global DHT is not. Hard scope gate: 2 nodes, LAN-first, no DHT in preview.

5. **Cross-pollination as afterthought** — If CPs get treated as "nice to have," they'll all slip to "next sprint." Mitigate: each CP has a named owner action (not just "import the pattern"), and they're in the success criteria for each block.

---

## APPENDIX: NATIVE MEMORY CONCEPTS (No Honcho)

### Pre-Dispatch Context Injection
```elixir
# Before spawning any agent:
def build_agent_context(task) do
  reflexion = ReflexionStore.last_outcomes(task.domain, task.agent_type, limit: 3)
  vault_notes = VaultIndex.query(task.description, limit: 5)
  daily_notes = DailyNotes.recent(days: 3)
  superman = Superman.context_for(task.project_slug)
  
  %{reflexion: reflexion, vault: vault_notes, daily: daily_notes, codebase: superman}
  |> format_context_block()
end
```

### Memory Dreaming (Scheduled Job)
```
Every night at 2am:
1. Read outcome-tracker.json entries from last 7 days
2. Group by domain + agent
3. For each group: find patterns (what worked, what failed, what inputs correlate with success)
4. If confidence > 0.7: write inference to vault/System/Agent-Inferences/YYYY-MM-DD.md
5. Log all writes to dream-log.md
6. Mark inferences as "unverified" until 3+ subsequent outcomes confirm them
```

### Reflexion (Read Before Starting)
```
Agent prompt preamble:
---REFLEXION BLOCK---
Last 3 outcomes for domain=feature-build, agent=coder:

1. [2026-04-08] Task: "Add WebSocket to dispatch board" → SUCCESS (quality: 8.5)
   Learned: Start with store wiring before component. Test WebSocket separately.
   
2. [2026-04-07] Task: "Bridge async migration" → SUCCESS (quality: 9.0)
   Learned: Keep sync wrapper. Update callsites after tests pass.
   
3. [2026-04-05] Task: "Fix Tauri auto-start" → FAILED
   Learned: Check sidecar config first. Tauri needs explicit binary path in tauri.conf.json.

Apply these learnings before starting.
---END REFLEXION---
```

---

*Generated: 2026-04-04 UTC*
*Source: MASTER-SYSTEM-OVERVIEW.md, WEEK-7-UNIFIED-PLAN.md, ROADMAP_SYNTHESIS.md, EMA-SELF-BUILDING-BOOTSTRAP.md*
*Author: Strategist subagent*
