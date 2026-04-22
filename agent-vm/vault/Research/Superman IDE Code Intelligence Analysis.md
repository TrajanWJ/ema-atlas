---
title: "Superman IDE Code Intelligence Engine — Deep Analysis"
created: 2026-03-25
updated: 2026-03-25
type: research
status: complete
confidence: 0.92
source: researcher-agent
domain: architecture, agent-systems, self-improvement
tags: [architecture, code-intelligence, self-evolution, working-memory, intent-graph, gap-analysis, experience-store]
summary: "Deep analysis of Superman IDE's autonomous code intelligence engine (~16.6k lines, 94 files). Maps its patterns against our OpenClaw system. Extracts concrete immediate and long-term improvements."
aliases: [superman-ide-analysis, code-intelligence-analysis]
---

# Superman IDE Code Intelligence Engine — Deep Analysis

*Sources: 1 primary (direct codebase inspection — 94 files, ~16.6k lines)*
*Confidence: 0.92 (High — read all key source files directly)*
*Date: 2026-03-25*

---

## Summary

Superman IDE is a TypeScript autonomous code intelligence engine that treats codebases as *products* rather than file trees, and continuously self-improves toward a declared product vision. Its autonomous loop (index → intent graph → gap analysis → plan → execute → validate → learn → repeat) is architecturally mature, with persistent working memory, confidence-adjusted experience learning, structural + LLM gap detection, and a "baseline comparison" pattern that's genuinely novel. The codebase is production-quality: well-typed, well-tested, and architecturally clean despite its complexity.

The most immediately transferable insight: **the experience store + confidence adjustment pattern** is a drop-in improvement to our agent dispatch system. Right now we track agent performance as aggregate stats — Superman shows how to track individual experiences, embed them semantically, find similar past situations, and adjust confidence per-outcome. This maps directly onto our `memory/agent-performance.md` and dispatch protocol.

The single most important long-term insight: **target product definition as the ground truth for gap analysis**. Superman doesn't just find bugs — it compares actual vs. *intended* capabilities and derives a gap list from that comparison. Our system has no equivalent. We have Horizon goals in the aspirational design doc, but no engine that continuously compares actual vs. intended and derives work from the diff.

---

## 1. Deep Code Review

### 1.1 Architecture Overview

Superman IDE is structured as a **Next.js frontend + Express backend + MCP server** trifecta:

```
┌────────────────────────────────────────────────────┐
│  Next.js Frontend (app/)                           │
│  CodeEditor, IntentGraphPanel, InsightsPanel, AI   │
└────────────────┬───────────────────────────────────┘
                 │ REST + SSE
┌────────────────▼───────────────────────────────────┐
│  Express Server (src/server.ts + src/routes/)      │
│  index-repo, query, simulate, autonomous, apply    │
└──┬──────┬──────┬──────┬──────┬──────┬─────────────┘
   │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼
 Parse  Graph  Embed  Intent  Gap  Execute
 AST    KG     Qdrant  Graph  Eng   Mod/Eng
```

**The core data pipeline** (from `src/autonomous-engine.ts`):

```
indexRepository()
  → parseRepository()  (AST → CodeNodes)
  → buildDependencyGraph()  (CodeNodes → edges)
  → KnowledgeGraph.build()  (nodes + edges → bidirectional adjacency)
  → generateEmbeddings()  (nodes → vector DB)
  → generateIntentGraph()  (model → IntentGraph)
  → buildFlowIndex()  (intent nodes → flow search index)
  → analyzeGapsFromIntentGraph()  (intent vs. actual → Gap[])
  → getRecommendedFocus()  (gaps + flows → ranked FocusItem[])
  → createPlan()  (gaps → PlanStep[])
  → executePlanWithMemory()  (steps → applied changes)
  → validate()  (build + baseline diff → pass/fail)
  → recordExperience()  (outcome → indexed experience)
  → memory.save()  (WorkingState → .codevault-memory.json)
```

**Key data structures** (from `src/types.ts`):
- `CodeNode` — any parsed symbol (function, class, route, import) with type, path, range, content, and metadata
- `CodeEdge` — typed relationships (calls, imports, extends, implements, contains, uses)
- `KnowledgeGraph` — bidirectional adjacency Map with forward/reverse indices, O(1) node lookup
- `IntentNode` — hierarchical intent node with level (0=product, 1=system, 2=feature, 3=implementation, 4=code), status (planned/partial/complete), and `linkedCode[]` pointers to CodeNode IDs
- `IntentGraph` — wraps the IntentNode tree with traversal, status propagation, and serialization
- `Gap` — detected issue with type, system, severity, description, and affected node IDs
- `WorkingState` — the full persisted state: intent, flows, gaps, plan, decisions, experiences, changedFiles
- `Experience` — indexed learning record: query, flow, intent, plan, actions taken, result, files, lesson, confidence (0-1)

### 1.2 Key Design Patterns and Innovations

**Pattern 1: Two-Level World Model**

Superman maintains two views of the codebase simultaneously:
- `ProjectModel` — structural view: systems (domain-grouped nodes), flows (route handler traces), entities (model classes)
- `IntentGraph` — aspirational view: what the product *should* be, hierarchically from product → system → feature → code

The gap engine compares them: things in `IntentGraph` with status `planned` are gaps. This is fundamentally different from static analysis — it asks "what's missing relative to the goal" rather than "what's wrong with what exists."

**Pattern 2: Baseline Comparison for Validation**

From `src/execution/runner.ts` and `src/autonomous-engine.ts`:

```typescript
const iterationBaseline = captureBaseline(buildResult);
// ... make changes ...
const newErrors = diffErrors(codeErrors, iterationBaseline);
if (newErrors.length === 0) {
  log('execute', 'Build has errors but none are new — treating as success');
  return true;
}
```

This is elegant: capture all existing build errors *before* any changes, then only care about *new* errors introduced by this iteration. Pre-existing technical debt doesn't block autonomous improvement. This is a genuinely novel pattern I haven't seen elsewhere.

**Pattern 3: Experience Store with Semantic Retrieval**

From `src/experience-store.ts`:
- Experiences are vectorized with embeddings (same model as code)
- Retrieval is hybrid: semantic similarity + keyword overlap, merged and deduped
- Confidence starts at 0.8 (success), 0.5 (partial), 0.2 (failure)
- Positive reinforcement: +0.1 per confirmed working application
- Negative reinforcement: -0.15 per confirmed failure
- Low-confidence experiences (< 0.3) are filtered from retrieval

This means the system gets *smarter* over time — patterns that work get reinforced, patterns that fail get buried.

**Pattern 4: Incremental Plan Refinement**

From `src/working-memory.ts` — `refinePlan()` and `refineGaps()`:
- Resolved gaps are tracked by key and never re-reported
- Failed step IDs are tracked and filtered from future plans
- Unexecuted steps from prior iterations are carried forward
- New gaps are merged with existing unresolved gaps

The system doesn't throw away its state between iterations. It accumulates knowledge. This is architecturally distinct from stateless loops.

**Pattern 5: Focus Engine Scoring**

From `src/focus-engine.ts`:
```
score = (1 - completeness) * 40        // incompleteness: 0-40 pts
     + min(25, gapCount * 8)           // gap density: 0-25 pts
     + min(20, missingSteps * 10)      // missing steps: 0-20 pts
     + (1 - confidence) * 15           // low confidence: 0-15 pts
     + (criticalGaps > 0 ? 20 : 0)    // critical gap boost
```

Multi-factor scoring surfaces what actually needs attention rather than what was detected first or what's easiest.

**Pattern 6: Self-Evolution with Target Product Definition**

From `src/self-evolve.ts` — the `TARGET_PRODUCT` constant is a hardcoded `ProductGoal` with `requiredFlows`, each containing named `steps` and `priority`. The engine compares detected flows against required flows and generates gaps from the diff. This is the "north star" approach: declare intent explicitly, let the engine close the gap autonomously.

**Pattern 7: Convergence Detection**

```typescript
const seenGapSignatures = new Map<string, number>();
function gapSignature(gaps: Gap[]): string {
  return gaps.map(g => `${g.type}:${g.description}`).sort().join('|');
}
// ...
if (count >= 3) {
  log('auto', 'Convergence failed: same gaps detected 3 times, stopping');
  break;
}
```

If the same gap set appears 3 iterations in a row, the system recognizes it's stuck and stops rather than looping forever.

### 1.3 Code Quality Assessment

**Strengths:**
- TypeScript throughout, well-typed interfaces in `types.ts` — the data model is explicit and consistent
- Test coverage for key components (`__tests__/working-memory.test.ts`, `knowledge-graph.test.ts`, `simulation-engine.test.ts`, etc.)
- Functional decomposition is clean — `gap-engine.ts`, `focus-engine.ts`, `planner.ts`, `experience-store.ts` are all single-responsibility
- Error handling is consistent: `logError()` + graceful degradation rather than crashes
- The `safeParseJSON` wrapper in `claude-client.ts` prevents LLM JSON parse failures from breaking the loop
- MCP server (`codevault-mcp/`) exposes core capabilities as tools for IDE integration — good extensibility

**Weaknesses:**
- `autonomous-engine.ts` at 713 lines is doing too much. The `buildProjectModel()` helper that builds `ProjectModel` from `KnowledgeGraph` is embedded in the engine file rather than a separate module. Should be extracted.
- The `TARGET_PRODUCT` in `self-evolve.ts` is hardcoded — the self-evolution engine *knows about itself*. This is philosophically correct for a bootstrap but limits reuse. The product vision should be injectable, not baked in.
- `buildSystems()` in `autonomous-engine.ts` uses regex-based domain inference (`inferDomain()`). This works for known patterns but will silently miscategorize novel codebases. No fallback to LLM classification for unknown domains.
- No distributed execution — the autonomous loop is single-threaded. For large codebases, gap analysis and plan execution happen sequentially. Parallelism would help.
- The experience store's in-memory index (`ExperienceIndex`) doesn't survive process restarts except via the JSON in `.codevault-memory.json`, which re-embeds on load. Expensive for large experience sets.

### 1.4 How the Autonomous Loop Works

**Phase 1: Index**
`indexRepository()` → parse all TS/JS/Python/Go/Rust/Java files with tree-sitter via `@ast-grep/napi`, extract `CodeNode[]` and `CodeEdge[]`, build `KnowledgeGraph`, generate embeddings for non-import nodes (capped at 500), upsert to Qdrant.

**Phase 2: Model**
`buildProjectModel()` → group nodes by domain (`inferDomain()` regex), trace call chains from route handlers to build flows, extract model-pattern classes as entities. Result: `ProjectModel` with systems, flows, entities.

**Phase 3: Intent Graph**
`generateIntentGraph()` → `generateFlowIntentGraph()` → detect product type, map flows to user journeys with steps and completeness scores, infer missing flows. Result: hierarchical `IntentGraph` with `planned/partial/complete` status nodes.

**Phase 4: Gap Analysis**
`analyzeGapsFromIntentGraph()` → walk intent graph for `planned` nodes (each is a gap), run structural checks (broken integrations, architectural issues), check intent coverage vs. model domains, check feature completeness. Result: deduplicated `Gap[]` with severity rankings.

**Phase 5: Focus**
`getRecommendedFocus()` → score each flow and orphan gap with multi-factor formula, sort descending. Result: ranked `FocusItem[]`.

**Phase 6: Plan**
`createPlan()` → group gaps by system, order systems by `SYSTEM_PRIORITY` (database → auth → middleware → validation → api → services → frontend → testing), LLM-generate 1-5 atomic steps per system gap cluster. Result: `ExecutionPlan` with ordered `PlanStep[]`.

**Phase 7: Execute**
`executePlanWithMemory()` → for each step: check if previously failed (skip), check dependencies, call `proposeChanges()` (LLM generates diffs), call `applyChanges()` (surgical edits via ast-grep), record decision outcome. Track `succeeded/failed` counts.

**Phase 8: Validate**
`validate()` → capture baseline build state, run `npm run build`, classify errors as new vs. pre-existing using fingerprint diff, attempt auto-fix for new errors only, run tests, simulate top 3 flows. Return pass/fail.

**Phase 9: Learn**
`recordExperience()` → create Experience record (query, flow, plan, actions, result, lesson), embed with same model as code, add to in-memory index. `adjustExperienceConfidence()` for similar past experiences.

**Phase 10: Save + Loop**
`memory.save()` → serialize `WorkingState` to `.codevault-memory.json`. Increment iteration. Check convergence condition. Re-index if gaps remain.

---

## 2. Comparison to Our System

### 2.1 Where They Overlap

| Concept | Superman IDE | Our System | Notes |
|---|---|---|---|
| Working memory | `WorkingState` in `.codevault-memory.json` | `memory/YYYY-MM-DD.md` + `MEMORY.md` | Both persist state across sessions. Superman's is structured JSON; ours is markdown |
| Gap detection | `analyzeGapsFromIntentGraph()` — structural + LLM | Gap signals in `AGENTS.md` + `Evolution Signals.md` | We track gaps manually; Superman detects them automatically |
| Self-improvement | Self-evolution engine with target product | `soulcraft`, `self-improving-agent`, `context-evolution` skills | Superman's is algorithmic; ours is skill-based (semi-manual) |
| Experience learning | Experience store with confidence adjustment | `memory/agent-performance.md` + outcome tracker | Both track what worked. Superman's is searchable and confidence-weighted |
| Knowledge graph | `KnowledgeGraph` with typed edges | Obsidian vault with wikilinks | Different scope: code vs. knowledge. Both are graphs |
| Intent hierarchy | IntentGraph (product → system → feature → code) | AGENTS.md dispatch + Horizon goals | Superman's is dynamic and generated; ours is static docs |
| Flow detection | Structured user flows from route analysis | Not present | Superman has this; we don't |
| Focus ranking | Multi-factor scoring formula | `SYSTEM_PRIORITY` + severity | Superman's is dynamic; ours is mostly static |
| Convergence detection | Gap signature hashing + iteration count | Not present (would loop forever) | Superman stops when stuck; we have no equivalent |
| Baseline comparison | `captureBaseline()` + `diffErrors()` | Not present | Novel pattern — unique to Superman |

### 2.2 Where They Diverge

**Domain:** Superman is code-intelligence — it knows TypeScript ASTs, call chains, route handlers, database models. Our system is general-purpose orchestration — it knows agents, tasks, channels, workflows.

**Scope of "world model":** Superman models *one codebase*. Our system models *a person's work life* — tasks, channels, research, code, systems, people.

**Execution model:** Superman makes *code changes* autonomously. Our system *dispatches agents* autonomously. Superman writes files; we spawn processes.

**Memory structure:** Superman's `WorkingState` is a typed JSON object with a strict schema. Our memory is unstructured markdown with conventions. Superman's is machine-readable; ours is human-readable.

**Intent source:** Superman's intent comes from code analysis + a hardcoded `TARGET_PRODUCT`. Our intent comes from Trajan's messages + vault goals + session history.

**Autonomy level:** Superman runs fully autonomously (no human in the loop during iterations). Our system is human-in-the-loop by design — Trajan is always the initiator.

### 2.3 What Superman Does That We Don't

1. **Structured flow detection** — automatically mapping user journeys from code structure (route handlers → call chains → completion points)
2. **Intent graph** — hierarchical goal structure that's computed, not documented
3. **Baseline comparison** — fingerprinting pre-existing errors before changes, ignoring them in validation
4. **Experience store with embeddings** — semantic search over past outcomes, not just text logs
5. **Confidence decay and adjustment** — experiences get more/less trusted based on repeated outcomes
6. **Gap convergence detection** — knows when to stop because it's stuck
7. **Product vision generation** — LLM-infers what a codebase is *trying to become*
8. **Flow simulation** — predicts flow validity without executing it
9. **Multi-factor focus scoring** — explicit formula for prioritization
10. **Surgical edits** — ast-grep-based precise code modification (vs. full-file rewrites)

### 2.4 What We Do That Superman Doesn't

1. **Multi-agent orchestration** — dispatch to specialists, coordinate teams, adversarial review
2. **Cross-domain operations** — research, code, ops, security, Discord, vault — all in one system
3. **Human interface** — Discord/Telegram integration, formatting, channel routing
4. **Proactive anticipation** — heartbeats, scheduled work, anticipation queue (in our Horizon 3)
5. **Behavioral modeling** — tracking Trajan's patterns, preferences, cognitive load
6. **Knowledge synthesis** — Obsidian vault with semantic search, wikilinks, topic clustering
7. **Multi-model support** — can dispatch to Claude, Codex, Gemini, etc.
8. **Session continuity** — LCM compaction, CONTINUE.md, cross-session memory via files
9. **Skill system** — composable capabilities that can be loaded on demand
10. **Forum/thread lifecycle management** — Discord project tracking, lifecycle tags

### 2.5 Architectural Philosophy Differences

**Superman's philosophy:** *The system knows what the code should be. Tell it the target. Let it autonomously close the gap.* The target product definition is the oracle; code is the lagging indicator. Self-modification is the mechanism.

**Our philosophy:** *The system knows what Trajan wants right now. Decode intent. Route to the right agent. Verify the result.* Trajan is the oracle; agents are the workers. Human oversight is the mechanism.

These aren't in conflict — they're complementary. Superman's approach is better for autonomous code improvement. Our approach is better for a general-purpose cognitive assistant. The synthesis is a system that can apply Superman's autonomous loops to specific domains (code improvement, vault organization) while maintaining human oversight for strategic decisions.

---

## 3. Immediate Improvements We Could Adopt

### 3.1 Structured Experience Store for Agent Dispatch

**Priority: Critical**

**What it is:** Replace our text-based `memory/agent-performance.md` with a typed, semantic-searchable experience store. Before every agent dispatch, query the store for similar past tasks and use results to inform routing.

**Where it comes from:** `src/experience-store.ts` + `src/working-memory.ts`

**How it maps:** Our `memory/outcome-tracker.json` tracks outcomes but doesn't support semantic retrieval. Right Hand already queries `memory/agent-performance.md` before dispatch (per AGENTS.md Dispatch Protocol), but it's doing a linear text scan.

**Implementation sketch:**
```typescript
// experience-store.ts adapted for agents
interface AgentExperience {
  id: string;
  timestamp: number;
  taskDescription: string;
  agentId: string;
  outcome: 'success' | 'failure' | 'partial';
  durationMs: number;
  lesson: string;
  confidence: number; // starts 0.8/0.5/0.2, adjusts per future outcome
  embedding: number[]; // for semantic retrieval
}

// Before dispatch:
const relevant = await findSimilarExperiences(taskDescription, 5);
const failedAgents = relevant
  .filter(e => e.outcome === 'failure' && e.confidence > 0.4)
  .map(e => e.agentId);
// Route away from agentIds with high failure confidence on similar tasks
```

**File to update:** `memory/outcome-tracker.json` → upgrade format. Add semantic retrieval to Right Hand's dispatch loop. Store embeddings alongside outcomes.

**Impact:** Smarter routing on the first attempt. Reduces wasted dispatches to agents that have failed on similar tasks before.

---

### 3.2 Working Memory with Structured State

**Priority: High**

**What it is:** A typed, machine-readable state file that persists across sessions — not markdown daily notes, but a structured JSON object capturing: current active gaps, iteration count, recent decisions, health score, and changed files.

**Where it comes from:** `src/working-memory.ts` — the `WorkingState` interface and `WorkingMemory` class

**How it maps:** Our system already persists state via `MEMORY.md`, daily notes, and vault files. But these are human-readable and can't be queried programmatically. For autonomous evolution loops, we need a machine-readable equivalent.

**Implementation sketch:**
```json
// ~/.openclaw/agents/main/workspace/working-state.json
{
  "iteration": 12,
  "health": 74,
  "activeGoals": [...],
  "resolvedGoalKeys": [...],
  "recentDecisions": [
    {
      "iteration": 12,
      "action": "dispatch researcher on X",
      "outcome": "success",
      "reason": "similar past task succeeded 80% confidence",
      "timestamp": 1748209200000
    }
  ],
  "failedApproaches": ["approach-A", "approach-B"],
  "changedDomains": ["vault", "agents", "discord"]
}
```

**File to create:** `~/.openclaw/agents/main/workspace/working-state.json`. Read in SOUL.md `On Startup` flow. Update after every significant decision.

**Impact:** Right Hand accumulates session knowledge in a structured form. Future sessions can pick up exactly where the last one left off, not just via human-readable CONTINUE.md.

---

### 3.3 Baseline Comparison for Agent Validation

**Priority: High**

**What it is:** Before any autonomous improvement run, capture the current state of known issues. After the run, only flag *new* problems — not pre-existing ones. This prevents technical debt from blocking all autonomous progress.

**Where it comes from:** `src/execution/runner.ts` — `captureBaseline()` + `diffErrors()`

**How it maps:** In our system, when the Ops agent or coder agent runs improvements, we sometimes see "failures" that are actually pre-existing. The coder gets blamed for a problem it didn't introduce. This blocks future runs and creates false negatives in agent performance tracking.

**Implementation sketch:**
```bash
# Before any autonomous improvement run:
~/bin/baseline-capture.sh > /tmp/baseline-state.json

# After improvements:
~/bin/baseline-diff.sh /tmp/baseline-state.json > /tmp/new-issues.txt
# Only surface new-issues.txt — not the full diff
```

For agent runs: Right Hand captures the "known issues" snapshot (from `vault/System/Evolution Signals.md`, open GitHub issues, error logs) before dispatching. After the agent returns, compares against snapshot. Penalizes only new regressions, not pre-existing debt.

**File to update:** AGENTS.md Dispatch Protocol — add baseline capture step before "two-stage review."

---

### 3.4 Multi-Factor Focus Scoring

**Priority: High**

**What it is:** Replace ad-hoc prioritization with an explicit scoring formula for deciding what the system should work on next. Inputs: gap count, severity, completeness deficit, blockage count, time since last attempt.

**Where it comes from:** `src/focus-engine.ts` — `getRecommendedFocus()`

**How it maps:** Our system has `vault/System/Evolution Signals.md` and the crystallization engine, but no formal scoring for prioritizing which evolution task to tackle. Right Hand often has to make judgment calls about what to work on next.

**Implementation sketch:**
```python
def focus_score(item):
    score = 0
    score += (1 - item.completeness) * 40       # incompleteness
    score += min(25, item.gap_count * 8)          # gap density
    score += min(20, item.blocking_count * 10)    # what else depends on this
    score += (1 - item.confidence) * 15           # uncertainty bonus
    if item.has_critical_gap: score += 20
    return min(100, score)
```

Run this on every heartbeat to surface the highest-value next action. Output to `vault/System/Focus Queue.md`.

**File to create:** `~/bin/focus-scorer.sh`. Integrate with heartbeat in HEARTBEAT.md.

---

### 3.5 Gap Analysis with Intent vs. Actual Comparison

**Priority: High**

**What it is:** A gap analysis that compares our *aspirational goals* (from Horizon docs, SOUL.md) against our *actual capabilities* and surfaces specific actionable gaps — not qualitative complaints but named, severity-ranked items with suggested fixes.

**Where it comes from:** `src/gap-engine.ts` — `analyzeGapsFromIntentGraph()` + structural detection functions

**How it maps:** We have `Aspirational System Design.md` (what we want) and the current system (what we have). We do *no* automated comparison between them. All gap detection is manual or accidental.

**Implementation sketch:**
```json
// vault/System/Gap Registry.json
[
  {
    "type": "missing_capability",
    "domain": "agent-dispatch",
    "description": "No semantic search over past agent experiences — routing uses text scan",
    "severity": "high",
    "horizon": 2,
    "suggestedFix": "Implement experience store with embeddings",
    "detectedAt": "2026-03-25",
    "status": "open"
  }
]
```

A script runs on heartbeat, compares aspirational docs against `vault/System/Deployed Capabilities.md` (a file we'd maintain), surfaces gaps ranked by severity × horizon proximity.

**File to create:** `vault/System/Gap Registry.json` + `vault/System/Deployed Capabilities.md`. Script: `~/bin/gap-detector.sh`.

---

### 3.6 Confidence-Adjusted Routing

**Priority: Medium**

**What it is:** Extend agent dispatch to explicitly factor in per-agent confidence scores for specific task types — not just aggregate success rate, but "how confident am I that Researcher can handle this specific type of task based on similar past tasks?"

**Where it comes from:** `src/experience-store.ts` — `adjustConfidence()` and the confidence 0-1 scale

**How it maps:** Our `memory/agent-performance.md` has qualitative notes and `outcome-tracker.json` has binary outcomes. Neither gives us task-type-specific confidence per agent.

**Implementation sketch:**
Add to `outcome-tracker.json` schema:
```json
{
  "agentId": "researcher",
  "taskType": "codebase-analysis",
  "confidence": 0.82,
  "sampleCount": 11,
  "lastUpdated": "2026-03-25"
}
```

Before dispatch: lookup `(agentId, taskType)` confidence. If < 0.4, try a different agent or add fallback chain. After outcome: adjust confidence ±0.1/-0.15 using Superman's formula.

**File to update:** `memory/outcome-tracker.json` schema + Right Hand dispatch protocol.

---

## 4. Long-Term Improvements (Mesh with Our Vision)

### 4.1 Full Knowledge Graph of the Agent System

**What it is:** A machine-readable graph where nodes are agents, skills, vault notes, config files, cron jobs, and Discord channels — and edges are "uses," "spawns," "reads," "writes," "triggers" relationships. Queryable, traversable, visualizable.

**Connection to our Horizon goals:** Directly enables Horizon 4's "Memory Palace" (Aspirational System Design.md) — the vault evolves from flat files to a spatial knowledge graph. Also enables the Intelligence Layer (Intelligence Layer - System Vision.md) which needs to know "what tools exist" to route intelligently.

**What Superman IDE teaches:** The `KnowledgeGraph` class is the right abstraction. Bidirectional adjacency maps with typed edges (`calls`, `imports`, `contains`, `uses`) translate directly: our edges would be `spawns`, `reads-from`, `writes-to`, `triggers`, `depends-on`. The forward/reverse indexing pattern enables both "what does agent X use?" and "what uses skill Y?"

**How it would transform our system:** Right Hand could traverse the graph to find which skills are most centrally connected (high usage), which agents have no fallbacks (single points of failure), which vault areas are most densely linked (high-value knowledge clusters). The Intelligence Layer could use graph traversal for routing: "find all agents that have `web-search` in their transitive skill set."

**Timeline:** 60 days (Horizon 2-3). A JSON representation is achievable now; a traversable API adds 2 weeks.

---

### 4.2 Intent-Driven Agent Orchestration

**What it is:** Apply Superman's IntentGraph pattern to agent orchestration. Instead of static routing rules in AGENTS.md, maintain a dynamic intent graph: product goals at level 0, system goals at level 1, current tasks at level 2, agent assignments at level 3. Gap analysis compares intended vs. actual task completion.

**Connection to Horizon goals:** This IS Horizon 2 ("Intent-Driven" from Aspirational System Design.md) — "Intent parsing replaces task creation. Trajan says 'I want to ship X' → system decomposes into tasks." Superman shows the concrete implementation: the IntentGraph is how you represent the decomposition tree, and `analyzeGapsFromIntentGraph()` is how you find what's missing.

**What Superman IDE teaches:**
- Intent nodes have levels (product → system → feature → code). For agents: (goal → domain → task → agent-action)
- Status propagation (complete/partial/planned) gives you a live view of goal completion
- Gap derivation from status is automatic — any `planned` node is a gap
- The LLM generates the intent graph from description, not requiring manual specification

**How it would transform our system:** Trajan says "Ship the client template this week." The system decomposes this into an IntentGraph: market-research (planned) → draft-v1 (planned) → devil-advocate-review (planned) → delivery (planned). Each heartbeat, the system checks which nodes are still `planned` and auto-dispatches the next one. Goal completion is visible as a graph, not as a status message.

**Timeline:** 90 days (Horizon 3). Requires: goal object format (near-term, from Aspirational Design), intent graph construction (medium), gap-based auto-dispatch (medium).

---

### 4.3 Self-Evolution Engine for the Agent System

**What it is:** Adapt Superman's `selfEvolve()` pattern — target product definition, gap comparison, prioritized improvements, autonomous execution — to apply to the agent system itself. Define what a "complete" version of our system looks like, then let the system continuously work toward it.

**Connection to Horizon goals:** This is the Crystallization Engine from Aspirational System Design.md, implemented: "patterns observed → patterns tested → patterns hardened → patterns automated." Superman's convergence detection tells us when to stop (gap signature repeating). Superman's experience store tells us which approaches to avoid (failed patterns).

**What Superman IDE teaches:**
- The `TARGET_PRODUCT` constant in `self-evolve.ts` is the ground truth. For our system, this would be: "A cognitive extension for Trajan that handles H2 goals: intent parsing, goal tracking, predictive scheduling, context-aware routing."
- `compareAgainstTarget()` generates gaps by diffing required flows against detected flows. For our system: "Required: semantic experience search. Detected: text scan. Gap: high severity."
- `prioritizeGaps()` merges product gaps with simulation issues. For our system: merge structural gaps (missing capabilities) with operational issues (agent timeouts, routing failures).
- The self-improvement loop caps at 3 improvements per iteration — avoids over-ambitious single runs.

**How it would transform our system:** The system would know, at any given heartbeat, exactly what's missing relative to its declared self-improvement target. It would automatically queue the highest-value improvement, implement it, validate it (using baseline comparison), learn from the outcome, and repeat. The human role shifts from "tell the system what to improve" to "approve crystallized patterns."

**Timeline:** 120 days (Horizon 3-4). This is the most ambitious item. Foundation pieces (experience store, intent graph, gap registry) unlock this.

---

### 4.4 Experience-Based Routing with Confidence Decay

**What it is:** Agent selection becomes fully experience-driven: every dispatch is scored against a semantic index of past outcomes, routed to the agent with the highest confidence score for this task type, and outcomes feed back into confidence scores with decay.

**Connection to Horizon goals:** The "Reputation System" from Aspirational System Design.md: "Not just success rate, but style profiles... reputation informs task decomposition." Superman's `adjustConfidence()` with ±0.1/-0.15 is the concrete implementation of reputation adjustment.

**What Superman IDE teaches:**
- Confidence starts at 0.8/0.5/0.2 based on initial outcome quality — not 1.0 for every success
- The hybrid retrieval (semantic + keyword) is more robust than either alone
- Filtering experiences with confidence < 0.3 prevents the system from acting on stale or unreliable data
- Experience text = `query + flow + plan + actions + result + lesson` — comprehensive enough for good semantic matching

**How it would transform our system:** Right Hand never routes blindly to a specialist. Every dispatch is an informed bet: "Based on 7 similar past tasks, Researcher handles 'codebase analysis' with 82% confidence. Coder handles it with 43%." The system learns specializations that aren't in AGENTS.md — it discovers them from data.

**Timeline:** 45 days (Horizon 2). This is the most achievable long-term improvement. Build on the immediate experience store (Section 3.1), add confidence decay, extend to full routing.

---

### 4.5 Simulation Engine for Agent Workflows

**What it is:** Before executing a multi-agent workflow (especially novel ones), simulate it: check if each step has a handler, verify transitions between steps, identify dead ends. Flag issues before wasting agent calls.

**Connection to Horizon goals:** The "Divergence Engine" from Aspirational System Design.md uses multiple agents to reason about decisions before acting. Simulation is the deterministic pre-check before that. The Intelligence Layer (Intelligence Layer - System Vision.md) needs to score routing decisions — simulation provides the structural component of that scoring.

**What Superman IDE teaches:**
- `simulateFlow()` in `src/simulation/engine.ts` is deterministic — no LLM needed. It checks: `handlerFound`, `stateTransitionValid`, `systemResponseCorrect`, `dead_end`, `redundant`, `broken_transition`.
- For agent workflows: `handlerFound` = agent with this capability exists. `stateTransitionValid` = output format of step N matches input format of step N+1. `dead_end` = last step produces output but no consumer is specified.
- The `overallValidity` score (valid steps / total steps) is a pre-dispatch confidence signal.

**How it would transform our system:** Complex multi-agent workflows get structurally validated before firing. Broken chains (step A produces JSON, step B expects markdown) get caught before wasting multiple agent calls. The system can flag "this workflow has a 60% validity score — confirm before dispatching?"

**Timeline:** 90 days (Horizon 3). Requires the agent knowledge graph (4.1) to resolve capability lookups.

---

### 4.6 Autonomous Improvement Loops

**What it is:** The full synthesis: the system runs continuous autonomous improvement loops during idle periods. Each loop: detect gaps → prioritize → plan → execute → validate → learn → repeat. Human approval only at crystallization checkpoints, not for individual runs.

**Connection to Horizon goals:** This is Horizon 4 — "Cognitive Extension" where "the system manages: what needs to happen this week, what's overdue, what's blocked, what's been forgotten." Superman's complete autonomous loop is the reference implementation.

**What Superman IDE teaches:**
- MAX_ITERATIONS = 5 is right — don't overrun. Break early on convergence.
- Baseline capture before any iteration is non-negotiable.
- Failed step tracking prevents retry loops.
- Experience consultation before planning avoids known-bad approaches.
- The save-on-every-iteration pattern is crucial — partial progress is never lost.

**How it would transform our system:** The heartbeat becomes an autonomous improvement trigger. During idle periods: scan for gaps, pick highest-scoring item from focus queue, implement it, validate using baseline comparison, log experience. Trajan wakes up to a system that's better than when he left. The inner monologue from Aspirational System Design.md (`[observation] Three vault notes about auth patterns exist...`) becomes the input feed for this loop.

**Timeline:** 150 days (Horizon 4). This is the culmination, not the starting point.

---

## 5. Synthesis

The most important insight from this analysis is:

**Superman IDE proves that a declared target product + automated gap analysis + experience-adjusted planning is sufficient for meaningful autonomous self-improvement. The missing piece in our system isn't capability — it's structure.**

We have aspirational goals in markdown files. We have agents that can execute almost anything. We have memory in daily notes. What we don't have is the bridge: a machine-readable representation of intent that can be automatically compared against reality to produce a ranked gap list that feeds autonomous execution.

Superman's `TARGET_PRODUCT` constant is philosophically the same as our `Aspirational System Design.md`. But Superman's is machine-readable. The `compareAgainstTarget()` function can close the loop automatically. Our aspirational doc sits in the vault, unread by any loop.

The path from where we are to Horizon 4 is exactly Superman's implementation, generalized:
1. `TARGET_PRODUCT` → Goal Registry (structured JSON version of aspirational docs)
2. `KnowledgeGraph` → Agent Knowledge Graph (who does what, with what skills, to what outcome)
3. `analyzeGapsFromIntentGraph()` → Gap Detector (goals vs. actual capabilities)
4. `experience-store.ts` → Agent Experience Store (past outcomes, confidence-adjusted, semantically searchable)
5. `autonomous-engine.ts` → Autonomous Improvement Loop (heartbeat-triggered, convergence-aware)

The implementation doesn't require building everything at once. It stacks: start with the experience store (Section 3.1), add the gap registry (Section 3.5), build the focus scorer (Section 3.4), and you've already captured 80% of Superman's intelligence patterns with about 20% of the implementation work.

The single thing to build first: **a typed `working-state.json` with an experience array and a gap list**, with a script that updates it after every significant agent outcome. Everything else builds on that foundation.

---

## Sources

1. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/autonomous-engine.ts` — Main autonomous loop, 713 lines
2. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/working-memory.ts` — Persistent working memory implementation
3. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/experience-store.ts` — Experience learning with confidence adjustment
4. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/gap-engine.ts` — Structural + LLM gap detection
5. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/self-evolve.ts` — Target product definition + self-evolution loop
6. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/intent-graph.ts` — Multi-level intent graph
7. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/focus-engine.ts` — Multi-factor focus scoring
8. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/simulation/engine.ts` — Deterministic flow simulation
9. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/planner.ts` — System-priority-ordered execution planning
10. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/types.ts` — Full type system
11. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/product-vision.ts` — LLM-generated product vision
12. [Primary — codebase] `/tmp/superman-ide/superman-ide-code-intelligence-engine/src/auto-intent-generator.ts` — Multi-level intent graph generation
13. [Primary — vault] `/home/trajan/vault/Architecture/Aspirational System Design.md` — Our four-horizon vision
14. [Primary — vault] `/home/trajan/vault/Architecture/Intelligence Layer - System Vision.md` — Intelligence layer vision
15. [Primary — workspace] `/home/trajan/.openclaw/agents/main/workspace/AGENTS.md` — Agent roster and dispatch protocol
16. [Primary — workspace] `/home/trajan/.openclaw/agents/main/workspace/SOUL.md` — Right Hand personality and protocol

---

## Related

- [[Aspirational System Design]]
- [[Intelligence Layer - System Vision]]
- [[Self-Critique and Auto-Evolution Design]]
- [[Session Management Deep Dive]]
- [[Queue Architecture v2]]
