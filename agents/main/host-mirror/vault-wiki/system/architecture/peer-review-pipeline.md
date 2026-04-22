---
title: Peer Review Pipeline — Prompt Pre/Post Processing Architecture
created: '2026-03-24'
type: knowledge
status: active
confidence: 0.85
tags:
  - architecture
  - metaprompting
  - dispatch
  - peer-review
  - prompt-engineering
summary: >-
  LLM-powered prompt preprocessing and post-processing pipeline that replaces
  manual prompt crafting between Claude sessions.
wiki_id: system/architecture/peer-review-pipeline
imported_from: vault/Architecture/peer-review-pipeline.md
imported_at: '2026-04-04T00:23:56.790Z'
---

# Peer Review Pipeline

## Problem Statement

Trajan's current workflow for non-trivial tasks:
1. Has an idea or need
2. Opens a Claude session manually
3. Brainstorms, builds context, refines the prompt
4. Crafts a structured prompt with sub-agent patterns, vault context, constraints
5. Passes that refined prompt to a coding agent
6. Manually evaluates output quality

**Steps 2-4 are manual prompt engineering that should be automated.** The system should take a raw intent and produce an optimized, context-rich execution plan — the same way Trajan would, but without requiring his time.

## Architecture

### Discord Category: 🧠 PEER REVIEW

| Channel | ID | Purpose |
|---|---|---|
| #📥-intake | 1485849847620829234 | Raw requests land, preprocessing begins |
| #🔬-deliberation | 1485849849004822609 | Agents debate approach in threads |
| #📤-refined | 1485849857015943218 | Final execution plans ready for dispatch |
| #📊-post-review | 1485849858379354132 | Post-execution quality analysis |

### Pipeline Stages

```
Stage 0: INTAKE
  Raw request arrives (from Trajan, channel-sweep, or another agent)
  → Complexity scorer determines: fast-track or full peer review
  → Posts to #📥-intake with classification

Stage 1: ENRICHMENT (Prompt Engineer agent)
  → Pulls vault context (qmd search for related notes, past decisions)
  → Identifies domain (code/research/ops/security/etc.)
  → Applies 4-D optimization framework:
    1. Context & Role: Who should execute this? What expertise needed?
    2. Task Specification: Break down into subtasks, identify dependencies
    3. Output Format: What does "done" look like? Files, reports, code?
    4. Quality Criteria: Success metrics, verification steps
  → Generates structured execution plan

Stage 2: DELIBERATION (parallel agents in thread)
  → Devil's Advocate challenges the plan (what could go wrong?)
  → Domain specialist adds constraints (Coder: "use X pattern", Security: "watch for Y")
  → Researcher pulls relevant web/vault context if knowledge gaps exist
  → Thread visible in #🔬-deliberation for Trajan to steer
  → Consensus timeout: 3 minutes (auto-proceed if no human intervention)

Stage 3: REFINEMENT
  → Synthesize deliberation into final execution prompt
  → Structure with: sub-agent pattern, vault refs, success criteria, timeout
  → Post to #📤-refined
  → Auto-dispatch to execution (or wait for 👍 on high-complexity tasks)

Stage 4: EXECUTION
  → Standard dispatch-engine.sh flow
  → Task file includes peer-review metadata (original intent, enrichment log, deliberation summary)

Stage 5: POST-REVIEW
  → After execution completes, post results to #📊-post-review
  → Score prompt effectiveness: did the output match intent?
  → Log patterns: what enrichments helped? What was wasted?
  → Feed back to prompt patterns library
```

### Complexity Scoring (Fast-Track vs Full Review)

```python
# Factors that increase complexity:
- Multiple domains involved (code + ops + security) → +3 per domain beyond 1
- Ambiguous intent (no clear verb/action) → +2
- System-wide impact (config changes, deployments) → +3
- Novel task (no similar past tasks in outcome tracker) → +2
- Long-running (estimated >15 min execution) → +1

# Thresholds:
- Score 0-2: FAST TRACK → Skip to Stage 3, minimal enrichment
- Score 3-5: LIGHT REVIEW → Stage 1 enrichment only, skip deliberation
- Score 6+: FULL REVIEW → All stages, thread in #deliberation
```

### Integration Points

#### With dispatch-engine.sh
- New field in task JSON: `peer_review: {status, enrichment_log, deliberation_summary, complexity_score}`
- dispatch-engine.sh reads `peer_review.status` — only dispatches tasks marked `"approved"` or `"fast-tracked"`
- Peer review pipeline writes enriched tasks to `~/dispatch/queue/` with full metadata

#### With Right Hand (AGENTS.md)
- Right Hand routes non-trivial tasks through peer review instead of direct dispatch
- Threshold check happens in the routing rules (AGENTS.md "CLASSIFY" step)
- Right Hand can override and fast-track if urgency demands it

#### With Existing Infrastructure
- `task-classifier.sh` — replaced by LLM-powered classification in Stage 0
- `dispatch-router.sh` — enhanced with peer review metadata for smarter routing
- `dispatch-reflect.sh` — Stage 5 post-review feeds into this reflection system
- `memory/outcome-tracker.json` — receives peer review quality scores
- `memory/workflow-patterns.json` — deliberation patterns get tracked for crystallization

### Implementation: `~/bin/peer-review-engine.sh`

Core script that orchestrates the pipeline:

```bash
peer-review-engine.sh intake <raw_request> [--complexity-override N]
peer-review-engine.sh enrich <task_id>
peer-review-engine.sh deliberate <task_id>
peer-review-engine.sh refine <task_id>
peer-review-engine.sh post-review <task_id> <result_file>
peer-review-engine.sh status
```

Each subcommand handles one pipeline stage. Can be called sequentially or by Right Hand.

### Agent Roles in Pipeline

| Stage | Agent | Role |
|---|---|---|
| 0 (Intake) | Right Hand | Complexity scoring, initial classification |
| 1 (Enrichment) | Prompt Engineer | Context pulling, 4-D optimization, plan generation |
| 2 (Deliberation) | Devil's Advocate + Domain Specialist | Challenge plan, add constraints |
| 3 (Refinement) | Right Hand | Synthesize and produce final execution prompt |
| 4 (Execution) | Target agent (Coder/Researcher/etc.) | Execute the refined plan |
| 5 (Post-Review) | Prompt Engineer | Score effectiveness, log patterns |

### Token Budget

Full peer review costs ~3-5K tokens for enrichment + ~2-3K per deliberation agent.
Estimated overhead: 8-15K tokens per reviewed task.
Fast-tracked tasks: ~0 additional tokens.
Light review: ~3-5K tokens.

**Break-even:** If peer review prevents even one failed dispatch cycle (which wastes 20-50K tokens), it pays for itself on the first catch.

### Metaprompting Patterns Applied

From vault research:
1. **4-D Optimization** (Lyra framework) — used in Stage 1 enrichment
2. **Self-Reflection** (Chain-of-Thought GPT) — used in Stage 5 post-review
3. **Constraint-First Design** — deliberation focuses on what NOT to do before what to do
4. **Recursive Self-Improvement** — post-review feeds patterns back to enrichment templates

### Files to Create

1. `~/bin/peer-review-engine.sh` — Main orchestrator script
2. `~/bin/peer-review-enrich.sh` — Stage 1: LLM-powered enrichment
3. `~/bin/peer-review-score.sh` — Complexity scorer
4. `~/dispatch/peer-review/` — Working directory for in-progress reviews
5. `~/.openclaw/agents/main/workspace/peer-review-config.json` — Thresholds, timeouts, channel IDs

### Channel IDs (for Discord integration)

```json
{
  "category_id": "1485847064972759182",
  "intake_channel": "1485849847620829234",
  "deliberation_channel": "1485849849004822609",
  "refined_channel": "1485849857015943218",
  "post_review_channel": "1485849858379354132"
}
```

## Related

- [[bayesian-agent-routing]] — Future routing enhancement that pairs with this
- [[Metaprompting Patterns]] — Core patterns used in enrichment
- [[Advanced Prompt Engineering Frameworks]] — 4-D framework source
- [[dispatch-audit-2026-03-19]] — Current dispatch infrastructure audit
