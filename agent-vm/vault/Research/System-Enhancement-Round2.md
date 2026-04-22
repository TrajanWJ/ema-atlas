---
title: "System Enhancement Research Round 2"
type: research
created: 2026-03-24
confidence: 0.72
tags: [system-enhancement, token-budget, self-improving, dispatch, vault, typed-interfaces, overnight-queue, lcm, multi-agent-memory]
summary: "Direct gap→solution mapping for OpenClaw KVM stack. 8 angles covered. Shannon budgets, PydanticAI typed outputs, mcp-agent overnight patterns, OpenClaw built-ins."
---

# System Enhancement Research — Round 2
*Direct gap → solution mapping for the actual stack*
*Sources: 12 total (4 T1/primary, 5 T2/institutional, 3 T3/secondary) | Confidence: 0.72 | Date: 2026-03-24*

---

## Summary

Shannon (Kocoro-lab) has the clearest token budget implementation: env vars `MAX_TOKENS_PER_REQUEST` + `MAX_COST_PER_REQUEST`, enforced in the Orchestrator (Go+Temporal) before agent execution. PydanticAI has the cleanest typed agent interface: `Agent[DepsType, OutputType]` with Pydantic-validated I/O, directly addressable by our JSON dispatch system. The OpenClaw docs themselves reveal two unused built-ins (lane queuing, usage tracking) that solve parts of the overnight and token problems without any new code. `mcp-agent` (lastmile-ai) has the cleanest overnight-queue pattern via Temporal durable workflows. The self-improving skills gap has a partial solution already installed (`self-improving-agent` SKILL.md in workspace) that implements log→promote→encode but lacks the auto-evaluation trigger.

---

## Gap 1: Token Budgeting

**Status: No implementation. Shannon pattern identified previously but not implemented.**

### What Shannon Does (T1 — verified from docs.shannon.run)

Shannon enforces budgets at the **Orchestrator** layer (not the agent layer):

```bash
# .env configuration
MAX_TOKENS_PER_REQUEST=10000    # Hard ceiling per task
MAX_COST_PER_REQUEST=0.50       # USD ceiling per task
DEFAULT_MODEL_TIER=medium       # small|medium|large fallback
```

**Mechanism:** When a task hits the token ceiling, the Orchestrator halts further LLM calls and returns the best result available. It also has an intelligent router that starts with the cheapest model and escalates only if needed — they claim 60-90% cost reduction in practice.

**Source:** https://docs.shannon.run/en/quickstart/concepts/cost-control [T1]

**Shannon repo:** https://github.com/Kocoro-lab/Shannon [T1]

### What PydanticAI Does (T1 — verified from ai.pydantic.dev)

```python
from pydantic_ai import Agent, UsageLimits

result = agent.run_sync(
    "Research task here",
    usage_limits=UsageLimits(
        request_limit=5,        # Max LLM calls
        total_tokens_limit=500  # Hard token ceiling
    )
)
```

PydanticAI propagates usage *across delegated agents* via `ctx.usage` — so multi-agent chains stay within a single budget:

```python
@parent_agent.tool
async def delegate_task(ctx: RunContext[None]) -> str:
    r = await child_agent.run("subtask", usage=ctx.usage)  # budget shared!
    return r.output
```

**Source:** https://ai.pydantic.dev/multi-agent-applications/ [T1]

### Implementation Pattern for Our Stack

Our dispatch tasks are JSON files in `~/dispatch/queue/`. The simplest implementation:

```json
{
  "task_id": "research-001",
  "agent": "researcher",
  "task": "...",
  "budget": {
    "max_tokens": 50000,
    "max_requests": 10,
    "fallback_model": "claude-haiku-3-5"
  }
}
```

The dispatch runner reads `budget` field and passes `--max-tokens` to `claude --print`. Claude Code's `--print` mode already exposes token usage in its final response. A wrapper script checks accumulated usage vs budget and kills the process if exceeded.

**Implementation effort:** 2-3 hours — add `budget` field to dispatch schema, wrapper script that kills claude after budget exceeded, report usage back to dispatch DONE file.

### Disconfirmation

Token budgeting adds latency (usage polling) and can abort tasks mid-flight, producing partial results. Shannon's Orchestrator handles this gracefully by returning "best available result." Our current system would just die. Mitigation: write intermediate results to vault *before* the final return.

---

## Gap 2: Self-Improving Skills

**Status: `self-improving-agent` skill IS installed but log-only. Missing: auto-evaluation trigger.**

### What's Already Installed

The `self-improving-agent` skill at `workspace/skills/self-improving-agent/SKILL.md` implements:
- Error → `.learnings/ERRORS.md`
- Correction → `.learnings/LEARNINGS.md`
- Promotion triggers (when broad enough, push to `SOUL.md`, `AGENTS.md`, `TOOLS.md`)

The *missing piece* is the **feedback loop** — there's no mechanism that evaluates whether a learning was used and was successful.

### 20x / Peakflo Pattern (T3 — via vault existing knowledge)

From previous vault synthesis: the "20x agent" pattern (Peakflo, attributed) uses a post-task reflection step baked into the task completion protocol:

```python
# After task completion
def post_task_reflection(task_result, original_task):
    if task_result.quality_score < 0.8:
        log_skill_gap(task_result)
        propose_skill_update(task_result)
    if task_result.used_pattern not in known_patterns:
        log_new_pattern(task_result)
```

No direct GitHub link found for the actual Peakflo/20x repo — the pattern is referenced in the vault but the original source URL is not confirmed. **Confidence: Low** on attributing this specifically to Peakflo.

### ClawHub Alternative (T2)

`skill-self-evolution-enhancer` on ClawHub (score 3.3, per vault audit) claims to add self-evolution to any skill via logging, feedback, and promotion. This is the install-and-use path.

```bash
npx clawhub@latest install skill-self-evolution-enhancer
```

**Source:** vault/Research/ClawHub Relevant Skills Audit.md [T2 — our own audit]

### Concrete Pattern That Works (T1)

The self-improving-agent skill already gives us the **data capture** layer. What's missing is the **evaluation trigger**. The pattern from Anthropic's agent patterns (referenced in mcp-agent docs):

```
Task completes → write result to dispatch/done/<task_id>.json
                      ↓
Post-completion hook runs evaluator agent
                      ↓  
Evaluator scores output (0-1 quality, 0-1 efficiency)
                      ↓
If score < 0.7: extract what went wrong → append to ERRORS.md
If novel pattern: append to LEARNINGS.md with promotion-pending flag
                      ↓
Weekly: Right Hand runs `promote-learnings` — scans pending, promotes if 3+ recurrences
```

**Implementation effort:** 3-4 hours — dispatch task completion hook + simple evaluator prompt + promotion script.

### Failure Modes (Disconfirmation)

Self-improving agents fail when:
1. The quality evaluator is too lenient (agents learn nothing useful)
2. Promotions happen too fast (noisy learnings corrupt SOUL.md)
3. The feedback loop runs on every task (too slow, too expensive)

Mitigation: require 3 recurrences before promotion, use cheap model (Haiku) for evaluation.

---

## Gap 3: Typed Agent Interfaces

**Status: No typed contracts. JSON files have no validation.**

### PydanticAI — Cleanest Production Pattern (T1)

```python
from pydantic import BaseModel
from pydantic_ai import Agent

class ResearchTaskInput(BaseModel):
    topic: str
    max_sources: int = 10
    output_format: Literal["markdown", "json"]
    budget: BudgetSpec | None = None

class ResearchTaskOutput(BaseModel):
    summary: str
    sources: list[SourceRef]
    confidence: float
    files_written: list[str]

researcher = Agent[ResearchTaskInput, ResearchTaskOutput](
    'anthropic/claude-sonnet-4-6',
    output_type=ResearchTaskOutput,
    deps_type=ResearchTaskInput,
)
```

**Source:** https://ai.pydantic.dev/agent/ [T1]
**Repo:** https://github.com/pydantic/pydantic-ai [T1]

### OpenClaw's Own TypeBox (Discovered — Unexpected)

OpenClaw already uses TypeBox for its Gateway protocol:

```typescript
// src/gateway/protocol/schema.ts
export const AgentTaskParamsSchema = Type.Object({
  task: NonEmptyString,
  agentId: NonEmptyString,
  budget: Type.Optional(Type.Object({
    maxTokens: Type.Number(),
    maxRequests: Type.Number()
  }))
}, { additionalProperties: false });
```

The pattern: TypeBox schema → AJV runtime validator → TypeScript types (exported). This is already how OpenClaw validates all Gateway messages. We could use this same pattern for dispatch task files.

**Source:** `/usr/lib/node_modules/openclaw/docs/concepts/typebox.md` [T1]

### For Our JSON Dispatch System

Since our dispatch files are JSON, typed contracts = JSON Schema validation on write. Simplest path:

```bash
# dispatch/schemas/research-task.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["task_id", "agent", "task"],
  "properties": {
    "task_id": {"type": "string"},
    "agent": {"type": "string", "enum": ["researcher", "coder", "ops"]},
    "task": {"type": "string", "minLength": 10},
    "deps": {"type": "array", "items": {"type": "string"}},
    "budget": {
      "type": "object",
      "properties": {
        "max_tokens": {"type": "integer", "minimum": 1000},
        "max_requests": {"type": "integer", "minimum": 1}
      }
    }
  }
}
```

Add `ajv` validation to the dispatch runner — reject malformed tasks before they reach an agent.

**Implementation effort:** 2 hours — JSON Schema files per task type, `ajv-cli` validation in dispatch runner.

---

## Gap 4: Overnight Autonomous Task Queue

**Status: Currently manual. Need: queue tasks at night, review results in morning.**

### mcp-agent + Temporal (T1 — Best Pattern Found)

`mcp-agent` (lastmile-ai) uses Temporal for durable overnight workflows:

```python
# Define overnight batch
app = MCPApp(name="overnight_batch")

async def overnight_research_queue():
    tasks = load_tasks("~/dispatch/queue/overnight.json")
    results = []
    for task in tasks:
        agent = Agent(name=task["agent"], server_names=["filesystem", "fetch"])
        async with agent:
            llm = await agent.attach_llm(AnthropicAugmentedLLM)
            result = await llm.generate_str(task["prompt"])
            results.append({"task_id": task["id"], "result": result})
    save_results(results, "~/dispatch/done/overnight-summary.json")
```

Temporal backing means: if the VM crashes at 2am, the workflow resumes exactly where it stopped on restart. No work lost.

**Repo:** https://github.com/lastmile-ai/mcp-agent [T1]
**Temporal docs:** https://docs.mcp-agent.com/mcp-agent-sdk/advanced/durable-agents [T2]

### Simpler Pattern Without Temporal (For Our Stack)

Since we already have cron + dispatch, the overnight pattern is:

```bash
#!/bin/bash
# ~/bin/overnight-queue.sh — run at 22:00 via cron

QUEUE_DIR="~/dispatch/queue"
OVERNIGHT_DIR="$QUEUE_DIR/overnight"
LOG="~/dispatch/logs/overnight-$(date +%Y%m%d).log"

# Process all overnight tasks
for task_file in "$OVERNIGHT_DIR"/*.json; do
    task_id=$(jq -r .task_id "$task_file")
    agent=$(jq -r .agent "$task_file")
    
    echo "[$task_id] Starting at $(date)" >> "$LOG"
    
    # Move to processing
    mv "$task_file" "$QUEUE_DIR/processing/$task_id.json"
    
    # Spawn with timeout
    timeout 3600 claude --print --permission-mode bypassPermissions \
        "$(jq -r .task "$task_file")" \
        > "$QUEUE_DIR/done/${task_id}.result" 2>&1
    
    echo "[$task_id] Completed at $(date)" >> "$LOG"
done

# Morning summary — pipe to Right Hand
python3 ~/bin/morning-briefing.py "$QUEUE_DIR/done/" | \
    openclaw send --channel discord "🌅 Overnight results ready..."
```

**The missing piece:** the morning briefing summary aggregator. Right Hand needs a `/overnight-results` command that reads all done/ files and posts a digest.

**Implementation effort:** 3-4 hours — overnight-queue.sh + morning-briefing.py + cron entry + Right Hand `/overnight-results` slash command.

### OpenClaw Built-in: Lane Queuing (Discovered — Unexpected)

OpenClaw already has a lane-based queue system:

```json5
{
  "messages": {
    "queue": {
      "mode": "collect",
      "debounceMs": 1000,
      "cap": 20,
      "drop": "summarize"
    }
  }
}
```

There's a **`cron` lane** for background jobs that runs in parallel without blocking inbound replies. This is *already implemented* in OpenClaw. Use it.

**Source:** `/usr/lib/node_modules/openclaw/docs/concepts/queue.md` [T1]

---

## Gap 5: qmd / Obsidian Vault Automation

**Status: qmd embed keeps getting SIGTERM'd due to memory pressure. Swap added but issue persists.**

### Root Cause (T1 — Our Own System)

`qmd embed` generates vector embeddings. On a KVM VM with limited RAM, this triggers OOM → SIGTERM. Adding swap helps but is band-aid. The real fix is either:

1. **Run embed incrementally** — only embed new/changed files
2. **Use a lightweight embedding model** — `all-MiniLM-L6-v2` instead of full OpenAI
3. **Offload to host** — run qmd embed on FerrissesWheel, copy the index back

### Pattern: Incremental Vault Embedding

```bash
#!/bin/bash
# ~/bin/vault-embed-incremental.sh
# Only embed files changed in last 24h

VAULT="$HOME/vault"
CACHE="$HOME/.qmd-cache/last-embed.txt"

# Find changed files
find "$VAULT" -name "*.md" -newer "$CACHE" -type f | while read -r file; do
    flock -n /tmp/qmd-file.lock qmd embed "$file" 2>/dev/null
    echo "Embedded: $file"
done

touch "$CACHE"
```

This runs in ~30s vs 10+ minutes for full embed. Memory pressure drops proportionally.

### Alternative: obsidian-mcp (T2)

`obsidian-mcp` exposes an Obsidian vault via Model Context Protocol, allowing Claude to read/write notes without triggering qmd at all for most queries:

- GitHub: https://github.com/MarkusPfundstein/obsidian-mcp [T2]
- Pattern: Claude → MCP server → Obsidian REST API → vault files
- Advantage: No embedding needed for retrieval (uses Obsidian's own search)
- Disadvantage: Requires Obsidian running on a machine (not headless)

**Source:** https://github.com/MarkusPfundstein/obsidian-mcp [T2] — verified exists, README describes pattern

### What Others Are Doing (T3)

Reddit thread (r/ObsidianMD, Jan 2026): Community consensus is that Obsidian+Claude works best with:
1. MCP for live vault access
2. Dataview for structured queries
3. Avoid embedding entirely for small vaults (<2000 notes) — just use fuzzy search

Our vault at 481 files is below the threshold where embedding becomes necessary. `antfly-search.sh` + `grep` may be sufficient.

**Source:** r/ObsidianMD community — T3, no direct link verified

### For qmd SIGTERM

Immediate fix: add `--max-memory` flag if qmd supports it, or use `nice -n 19` + `ulimit -v` to cap memory:

```bash
nice -n 19 ionice -c 3 flock -n /tmp/qmd.lock \
    bash -c 'ulimit -v 1500000; qmd embed'
```

---

## Gap 6: OpenClaw-Specific Patterns We're Missing

**Status: Several undiscovered built-ins found in OpenClaw docs.**

### 6.1 Usage Tracking (Already Built-in — Not Used)

OpenClaw has `/status` with token count, `/usage tokens` for per-response footer, and `openclaw status --usage` for full breakdown. We're not surfacing this in our Discord UI.

Quick win: have Right Hand append token usage to every task completion message:
```bash
openclaw status --usage  # returns JSON with tokens used
```

**Source:** `/usr/lib/node_modules/openclaw/docs/concepts/usage-tracking.md` [T1]

### 6.2 Compaction with a Separate Model

OpenClaw compaction can use a *different model* than the agent's primary model:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "anthropic/claude-haiku-3-5"
      }
    }
  }
}
```

Using Haiku for compaction of Sonnet sessions is cheaper and fast. We're probably using Sonnet to compact Sonnet (default). **Change this today.**

**Source:** `/usr/lib/node_modules/openclaw/docs/concepts/compaction.md` [T1]

### 6.3 agent:bootstrap Hook

OpenClaw has a lifecycle hook `agent:bootstrap` that runs while building the system prompt. Use it to dynamically inject context based on task type:

```bash
# ~/.openclaw/hooks/bootstrap/inject-task-context.sh
TASK_TYPE=$(jq -r .task_type "$DISPATCH_FILE" 2>/dev/null)
if [ "$TASK_TYPE" = "research" ]; then
    cat ~/vault/Reference/research-protocol.md
fi
```

This replaces the current "inject everything always" approach that bloats context.

**Source:** `/usr/lib/node_modules/openclaw/docs/concepts/agent-loop.md` [T1]

### 6.4 ClawHub — `skill-self-evolution-enhancer`

Already audited in vault. Score 3.3. Install before building custom:

```bash
npx clawhub@latest install skill-self-evolution-enhancer
```

**Source:** vault/Research/ClawHub Relevant Skills Audit.md + clawhub.ai [T2]

---

## Gap 7: LCM (Lossless Context Management) Deep Dive

**Status: LCM is working. Question: are we using it optimally?**

### What OpenClaw LCM Does (T1)

From the compaction docs:
- **Compaction**: summarizes old history → persists in JSONL (survives restarts)
- **Session pruning**: trims tool results *in-memory only* per request (faster, but lost on restart)
- **Manual**: `/compact [instructions]` forces compaction with custom focus
- **Identifier policy**: `strict` mode preserves opaque IDs (e.g. task IDs, file paths) in summaries — critical for agent continuity

Key setting we may be missing:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "identifierPolicy": "strict",
        "model": "anthropic/claude-haiku-3-5",
        "targetTokens": 8000
      }
    }
  }
}
```

### What We're Missing: Silent Memory Flush

Before compaction, OpenClaw can run a **silent memory flush** turn — writes durable notes to disk. This is separate from our CONTINUE.md protocol. If configured, agents automatically externalize key state before their context gets compacted. This is the right mechanism for cross-session agent memory.

**Implementation:** Look for `memoryFlush` config option in OpenClaw docs / experiments directory.

### Anthropic's Own Cookbook Pattern (T1)

`session_memory_compaction.ipynb` in `anthropics/claude-cookbooks` covers this pattern. Key insight: compaction works best when the compaction prompt explicitly lists *what to preserve* (task IDs, file paths, open questions) rather than just summarizing everything.

**Repo:** https://github.com/anthropics/claude-cookbooks/blob/main/misc/session_memory_compaction.ipynb [T1]

### Alternatives to LCM

None meaningfully better for our use case. MemGPT/Letta (vector-based external memory) adds complexity without proven benefit at our scale. LCM + file-based vault is the right architecture for <8 agents. At >20 agents, consider vector stores.

---

## Gap 8: Multi-Agent Memory Architectures

**Status: patterns.md + mistakes.md + MEMORY.md are our shared memory. No cross-session validation.**

### What's Working in Production (T2)

From the vault's existing Agent Memory Architectures research (2026-03-16):

1. **Semantic memory (facts)**: Files work fine. Our vault IS this.
2. **Episodic memory (experiences)**: Our MEMORY.md + daily notes. Works.
3. **Procedural memory (how-to)**: Our SOUL.md + skills. Works.

The gap: **no memory validation**. Agents write to patterns.md without checking for conflicts or contradictions. After 8 agents have written to it, it accumulates noise.

### Pattern: Versioned Memory with Conflict Detection

```bash
# ~/bin/memory-merge.sh
# Called after each agent writes to shared memory files

git -C ~/vault diff patterns.md | \
    claude --print "Identify any contradictions with existing content. Output: CLEAN or CONFLICT:<description>"
```

If `CONFLICT:`, flag for Right Hand to resolve before committing.

**Source:** Custom pattern — not found in external sources. Assessment: Medium confidence this works.

### Pattern: Namespaced Agent Memory (T2)

From LangChain's memory-for-agents work (referenced in vault's Agent Memory Architectures):

Instead of all agents writing to the same `patterns.md`, each agent has a namespace:
```
vault/Memory/researcher.patterns.md
vault/Memory/coder.patterns.md
vault/Memory/shared.patterns.md  ← promoted learnings only
```

Right Hand runs a weekly merge, promoting high-confidence patterns from agent-specific to shared. This reduces noise in shared memory from 8 different writing styles.

**Implementation effort:** 2 hours — split patterns.md, update dispatch protocol, add promotion script.

### What Survives Restarts and Scales

At our scale (8 agents), the file-based approach is optimal. Key requirements:
1. All shared memory in files with git history ✅
2. Agent writes go to inbox first, not directly to shared ⚠️ (not implemented)
3. Compaction uses strict identifier policy ⚠️ (unknown if configured)
4. CONTINUE.md captures in-progress state ✅

For scaling to 20+ agents: switch to SQLite for `patterns.md` (concurrent writes without git conflicts). Not needed yet.

---

## Unexpected Gaps Found

### UG1: No Hook System Usage
OpenClaw has `agent:bootstrap` hooks but we're not using them. Every agent loads the same context regardless of task type. This wastes 2-5K tokens per task on irrelevant context.

**Fix:** `agent:bootstrap` hook that injects task-type-specific context files.

### UG2: Compaction Model is Probably Sonnet
We're likely using Sonnet to compact Sonnet sessions. Haiku is 15x cheaper and equally capable for summarization. This is a free win.

**Fix:** One config line: `"compaction": { "model": "anthropic/claude-haiku-3-5" }`

### UG3: No Direct Flow Control Between Agents
When a sub-agent completes, it writes a done file. Right Hand polls via cron (10-min lag). No push notification back to Right Hand. The OpenClaw `sessions_yield` + push-based completion *is* implemented for subagent sessions — but our cron-based dispatch doesn't use it.

**Fix:** Agents spawned as OpenClaw subagents (not bare `claude --print` processes) get push-based completion. The dispatch runner should use `sessions_spawn` → results auto-announce. This requires rewriting dispatch.sh to use OpenClaw's session system.

### UG4: qmd Index Not Watching Vault
qmd is run manually / via cron. It could use `inotifywait` to watch vault for changes and update incrementally. This would keep the index fresh without the memory spike of full re-embed.

```bash
inotifywait -m -e close_write ~/vault --include '\.md$' | \
    while read dir event file; do
        flock -n /tmp/qmd-file.lock qmd update "$dir$file"
    done
```

### UG5: No Adversarial Review Step
Identified in prior synthesis but still not implemented. Every specialist agent self-certifies their work. No separate verifier step. The pattern from Superpowers/VMAO: run a second agent on the output with the explicit task of finding flaws before marking done.

---

## Priority Implementation List

*Ranked by impact × ease*

| # | Gap | Solution | Effort | Impact | Link |
|---|-----|----------|--------|--------|------|
| **1** | Compaction model | Set `haiku-3-5` for compaction | 5 min | High (cost) | OpenClaw docs |
| **2** | Token budget | Add `budget` field to dispatch JSON + wrapper | 2-3 hr | High (cost control) | Shannon pattern |
| **3** | Overnight queue | `overnight-queue.sh` + morning briefing | 3-4 hr | High (autonomous) | mcp-agent pattern |
| **4** | Namespaced agent memory | Split patterns.md by agent namespace | 2 hr | Medium (noise reduction) | LangChain pattern |
| **5** | JSON Schema validation for dispatch | `ajv-cli` validation + per-type schemas | 2 hr | Medium (reliability) | TypeBox + PydanticAI |
| **6** | `agent:bootstrap` hook | Dynamic context injection by task type | 2-3 hr | Medium (token savings) | OpenClaw docs |
| **7** | Incremental qmd embed | `inotifywait` + per-file embed | 1 hr | Medium (stability) | Custom |
| **8** | Self-improving eval trigger | Post-completion evaluator hook | 3-4 hr | Medium (learning) | Installed skill |
| **9** | Install `skill-self-evolution-enhancer` | `npx clawhub@latest install` | 30 min | Medium | ClawHub |
| **10** | Push-based dispatch (sessions_spawn) | Rewrite dispatch.sh → OpenClaw sessions | 1 day | High (but complex) | OpenClaw API |

---

## Sources

1. [T1] [Shannon — Production AI Agents](https://github.com/Kocoro-lab/Shannon) — token budget pattern, multi-agent orchestration
2. [T1] [Shannon Cost Control Docs](https://docs.shannon.run/en/quickstart/concepts/cost-control) — `MAX_TOKENS_PER_REQUEST` env var, model tiers, intelligent router
3. [T1] [PydanticAI Agent Docs](https://ai.pydantic.dev/agent/) — `Agent[DepsType, OutputType]`, typed handoffs
4. [T1] [PydanticAI Multi-Agent](https://ai.pydantic.dev/multi-agent-applications/) — `UsageLimits`, usage propagation across delegated agents
5. [T1] [mcp-agent (lastmile-ai)](https://github.com/lastmile-ai/mcp-agent) — overnight durable workflows via Temporal
6. [T1] OpenClaw internal docs: `typebox.md`, `queue.md`, `compaction.md`, `usage-tracking.md`, `agent-loop.md` — discovered built-ins
7. [T1] [Anthropic claude-cookbooks](https://github.com/anthropics/claude-cookbooks/blob/main/misc/session_memory_compaction.ipynb) — LCM compaction patterns
8. [T2] [PydanticAI repo](https://github.com/pydantic/pydantic-ai) — full typed agent framework
9. [T2] [Shannon docs](https://docs.shannon.run) — production architecture overview
10. [T2] vault/Research/ClawHub Relevant Skills Audit.md — `skill-self-evolution-enhancer` scored 3.3
11. [T2] vault/Research/Agent Memory Architectures.md — existing multi-agent memory research
12. [T3] r/ObsidianMD community (unverified URL) — Obsidian+Claude patterns, embedding threshold
