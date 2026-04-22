---
title: Agent Stack Best Practices — March 2026
type: research
created: '2026-03-27'
confidence: 0.88
tags:
  - agent-stack
  - best-practices
  - dispatch
  - multi-agent
  - spec-quality
  - model-routing
  - worktree
  - knowledge-graph
summary: >-
  13 concrete best practices for Trajan's OpenClaw agent stack, derived from
  arXiv papers and GitHub patterns discovered this week.
wiki_id: research/Best-Practices-2026-03-27
imported_from: vault/Research/Best-Practices-2026-03-27.md
imported_at: '2026-04-04T00:23:57.003Z'
---

# Agent Stack Best Practices — March 2026

*Sources: 9 total (4 T1 arXiv primary, 4 T2 GitHub repos, 1 T2 competitive)*
*Confidence: 0.88 (High) | Date: 2026-03-27*
*Task ID: best-practices-enrichment-001*

---

## Summary

Five high-signal findings from this week's research sweep translate into concrete, implementable changes. The dominant theme: **spec quality and shared memory beat cleverness at the agent layer**. Richer task descriptions, persistent cross-agent state, and information asymmetry by design are the levers — not model sophistication or coordination protocols. Three changes are low-effort and high-confidence enough to implement this week (BP-2, BP-4, BP-8). The knowledge graph and experience store changes (BP-3, BP-6) are higher effort but architecturally significant.

---

## Best Practices

### BP-1: Token-Aware Model Routing in Dispatch
**Finding:** Thinking token consumption varies 9.7× on identical queries — listed API price is an unreliable proxy for actual cost (Price Reversal, arXiv 2603.23971).
**Current state:** `dispatch-engine.sh` routes all tasks to the same model with no token budget awareness. Priority scoring is based on task priority field only.
**Recommended change:** Add a `model_hint` field to dispatch task JSON (`haiku`/`sonnet`/`opus`). For tasks with `complexity: low` or `type: monitoring|triage|summarize`, default to Haiku. Reserve Sonnet/Opus for `type: research|coding|architecture`. Cap thinking tokens per task class in the dispatch template: `"thinking_budget": 2048` for simple tasks. Measure actual token usage per agent run and log to dispatch DB for routing calibration.
**Effort:** Med
**Confidence:** High
**Priority:** P1

---

### BP-2: Structured Spec Format for Dispatch Tasks
**Finding:** Two-agent accuracy collapses 58% → 25% when spec detail is stripped. Coordination gap is 25-39pp. Restoring full spec is the only recovery — AST conflict reports and coordination protocols don't help (Specification Gap, arXiv 2603.24284).
**Current state:** Dispatch task JSON has `description` (truncated to 120 chars in status display), `instructions`, and `context`. No enforced structure. Task descriptions in the queue are often one-liners.
**Recommended change:** Enforce a structured spec template for all dispatch tasks with four mandatory sections: `(1) What: exact deliverable`, `(2) Success criteria: how to verify done`, `(3) Constraints: what not to do / scope limits`, `(4) Context: files/systems the agent needs to know about`. Reject tasks at dispatch time if these are missing. For multi-agent tasks (where one agent's output feeds another), spec quality is _especially_ critical — the spawning agent must write full specs, not just summaries.
**Effort:** Low
**Confidence:** High
**Priority:** P1

---

### BP-3: Persistent Knowledge Graph as Agent Shared Memory
**Finding:** Multi-agent pipelines with a persistent shared Knowledge Graph outperform stateless pipelines — particularly for self-improving loops (AI-Supervisor, arXiv 2603.24402).
**Current state:** Agent state is stored in `~/.openclaw/memory/main.sqlite`. Agents have no shared read/write world model. Right Hand reads agent output files but there's no structured graph of discovered knowledge that persists and compounds across sessions.
**Recommended change:** Implement a lightweight KG layer on top of the existing SQLite store. Minimum viable: nodes (concepts/entities/findings), edges (typed relationships), and a consensus requirement before a node is "committed" (two agents independently discover the same thing). The Superman IDE pattern (see [[Superman IDE Code Intelligence Analysis]]) is a direct blueprint. Start with the research domain: when Researcher writes a vault note, extract entities and relationships into the graph. Right Hand reads the graph, not individual notes, when orienting.
**Effort:** High
**Confidence:** Med
**Priority:** P2

---

### BP-4: Separate Verification from Generation (MARCH Pattern)
**Finding:** Giving the verifier agent access to the generator's reasoning prevents it from catching confirmation bias. Information isolation is the key mechanism — an 8B model with isolated verification matches closed-source performance on hallucination benchmarks (MARCH, arXiv 2603.24579).
**Current state:** When Right Hand reviews Researcher or Coder output, it reads the full agent output including the agent's own reasoning and conclusions. No isolation. The reviewing agent sees everything the generating agent saw.
**Recommended change:** When dispatch spawns a verification pass (e.g., code review, research validation), the verification task spec should NOT include the generating agent's reasoning — only its deliverables. Specifically: strip agent chain-of-thought from verification task context. For research tasks: verifier gets vault note (output), not the research session transcript. For code tasks: reviewer gets the diff, not the implementation rationale. Add a `verification_mode: isolated` flag to dispatch tasks that enables this stripping.
**Effort:** Low
**Confidence:** High
**Priority:** P1

---

### BP-5: Git Worktree Isolation for Parallel Coding Tasks
**Finding:** worktrunk (GitHub) implements git worktree-per-agent as the standard pattern for parallel coding work — agents get isolated working copies, no merge conflicts mid-task.
**Current state:** Parallel coding tasks from dispatch share the same working directory. Race conditions on file writes are possible when two agents touch adjacent code.
**Recommended change:** For any dispatch task with `type: coding` and `parallel: true`, pre-provision a git worktree in a temp directory before spawning the agent. Pass the worktree path as the agent's working directory. On task completion, merge back to main branch (or PR if `requires_review: true`). The Claude Code Agent tool already supports `isolation: worktree` — wire this into dispatch for coding tasks.
**Effort:** Med
**Confidence:** High
**Priority:** P2

---

### BP-6: Per-Experience Confidence Tracking (Superman IDE Pattern)
**Finding:** Superman IDE's experience store tracks individual task outcomes, embeds them semantically, and uses similar past experiences to adjust confidence on new plans — far more granular than aggregate performance stats (see [[Superman IDE Code Intelligence Analysis]]).
**Current state:** Agent performance is tracked as aggregate stats in memory. No per-experience tracking, no semantic similarity matching across past tasks, no per-task confidence adjustment.
**Recommended change:** Add an experience log to the dispatch DB: `(task_id, task_embedding, agent, outcome, actual_tokens, actual_duration, confidence_before, confidence_after)`. On each new dispatch, retrieve the 3 most semantically similar past experiences, use their outcomes to weight confidence estimates. Flag tasks where similar past experiences had >50% failure rate with a `high_risk: true` marker. Start simple: store task descriptions + outcomes as JSON in existing SQLite store; add semantic lookup later.
**Effort:** Med
**Confidence:** Med
**Priority:** P2

---

### BP-7: LOOP_COMPLETE Sentinel + Mandatory Planning Phase
**Finding:** ralph-orchestrator (GitHub) shows two patterns that reduce agent drift: (1) an explicit `LOOP_COMPLETE` sentinel that agents emit when done, making termination unambiguous, and (2) a Planning-Driven Development (PDD) phase before any execution where the agent writes a plan and waits for approval.
**Current state:** Agent tasks terminate when the process exits. No formal completion signal. Right Hand spawns agents and checks output files — no explicit protocol for "task complete, here are my outputs." Planning is implicit (happens inside the agent's context, not as a separate phase).
**Recommended change:** (1) Require all agents to end their final message with a structured completion block: `STATUS: DONE|BLOCKED|PARTIAL`, `FILES_MODIFIED: [list]`, `NEXT_ACTIONS: [list]`. Dispatch engine parses this to update DB state rather than relying on process exit alone. (2) For tasks with `complexity: high`, add a mandatory planning checkpoint: agent writes a plan to `/tmp/{task_id}-plan.md`, dispatch reads it and either approves (continues) or aborts (sends back for revision) before the agent executes.
**Effort:** Med
**Confidence:** High
**Priority:** P2

---

### BP-8: MCP File Indexing to Reduce Token Waste
**Finding:** fff.nvim MCP (GitHub) demonstrates that exposing file system metadata via MCP rather than having agents run repeated file-search commands can significantly reduce token waste on file discovery operations.
**Current state:** Agents spend early tokens on file discovery (`ls`, `find`, `glob`) to orient themselves. This is repeated on every task spawn with no caching across sessions.
**Recommended change:** Expose a lightweight MCP server that serves: (1) repo file tree with modification times, (2) fuzzy file name search, (3) recent files changed (last N commits). Agents query this MCP instead of running shell file discovery commands. The vault already has `qmd` for semantic search — extend this pattern to code files via a thin MCP wrapper. Low-hanging fruit: cache `git ls-files` output per repo, serve it via a local HTTP endpoint that agents can query.
**Effort:** Low
**Confidence:** Med
**Priority:** P2

---

### BP-9: Centralized LLM Routing with Safety Filter Chains
**Finding:** katanemo/plano (GitHub) implements centralized LLM routing where all model calls pass through a routing layer that applies safety filters, cost controls, and model selection logic in one place.
**Current state:** Each agent makes direct API calls. No centralized routing. Safety filtering is per-agent, inconsistent. No way to enforce a token budget ceiling or swap models system-wide without touching every agent.
**Recommended change:** Route all outbound LLM calls through a single dispatch-aware proxy (can be a simple Python FastAPI service on localhost). Proxy enforces: (1) per-task token budget cap, (2) model selection override based on task type, (3) rate limiting during peak hours (see BP-10), (4) request/response logging to SQLite for cost attribution. This is also where the MARCH isolation filter (BP-4) can be enforced centrally. Start with a thin logging proxy — add routing logic incrementally.
**Effort:** High
**Confidence:** Med
**Priority:** P3

---

### BP-10: Off-Peak Dispatch Scheduling for High-Complexity Tasks
**Finding:** Reddit reports (multiple threads, week of 2026-03-24) indicate Claude session limit errors concentrate at peak hours (9am-11am, 2pm-4pm PT). Heavy dispatch during these windows causes cascading failures.
**Current state:** `dispatch-engine.sh` runs every 10 minutes via cron unconditionally. No time-of-day awareness. High and low complexity tasks compete for the same dispatch slots.
**Recommended change:** Add time-of-day awareness to dispatch priority scoring. Peak hours (9-11am, 2-4pm PT): boost priority threshold — only dispatch P1 tasks, hold P2/P3 in queue. Off-peak (6pm-8am PT, weekends): lower threshold, dispatch everything. Add an `earliest_dispatch: HH:MM` field to task JSON for tasks that should only run during off-peak windows. This is a 10-line addition to the dispatch scoring function.
**Effort:** Low
**Confidence:** Med
**Priority:** P2

---

### BP-11: Claude Code Auto Mode Integration
**Finding:** Claude Code Auto Mode (released ~2026-03-20) enables CC to autonomously select tools, spawn sub-agents, and manage its own context without requiring explicit tool permission grants — changing the permission model for spawned CC sessions.
**Current state:** Right Hand spawns CC sessions with `--permission-mode bypassPermissions` for hard tasks. This is a blanket permission grant that bypasses all safety checks.
**Recommended change:** Evaluate replacing `--permission-mode bypassPermissions` with Auto Mode for appropriate task types. Auto Mode provides autonomy without blanket bypass. For tasks with sensitive scope (file deletion, git push, external API calls), retain explicit permission mode. For pure research/analysis/generation tasks, Auto Mode is safer. Add a `permission_mode` field to dispatch task JSON: `auto` (default for new tasks) | `bypass` (legacy, requires explicit justification in task spec).
**Effort:** Low
**Confidence:** Med
**Priority:** P2

---

### BP-12: Target Product Spec for Gap-Driven Work Derivation
**Finding:** Superman IDE's most architecturally novel pattern: it doesn't just find bugs — it compares actual capabilities against a declared product vision and derives work items from that gap. Our system has no equivalent (see [[Superman IDE Code Intelligence Analysis]]).
**Current state:** Work is driven by Trajan's direct requests, cron pipelines, and reactions. No formal "target state" document that the system continuously compares against actual state to derive work autonomously.
**Recommended change:** Write a `vault/System/OpenClaw-Target-State.md` that declares: what OpenClaw should be able to do autonomously, at what quality level, by when. Right Hand reads this on startup and generates gap analysis tasks: "We declared X, current state is Y, gap = Z, propose work." This closes the loop between aspirational design (Horizon goals) and actual dispatch work. Start with 10-15 capability statements, not a full spec. The discipline of writing it will surface gaps you haven't consciously recognized.
**Effort:** Med
**Confidence:** High
**Priority:** P2

---

### BP-13: KV Cache Quantization for Local Inference Evaluation
**Finding:** RotorQuant (competitive, 2026-03-25) demonstrates KV cache quantization at 10-19× speedup for local LLM inference without significant quality degradation.
**Current state:** Trajan's stack uses Anthropic API exclusively. No local inference. KV cache quantization is irrelevant to API usage.
**Recommended change:** No action now. File as a future-state consideration: if/when Trajan moves any workloads to local inference (e.g., for cost reduction on high-volume monitoring/triage tasks), KV cache quantization should be the first optimization evaluated. Current API dependency makes this moot. Revisit when local inference is on the roadmap.
**Effort:** N/A
**Confidence:** Med
**Priority:** P3

---

## Priority Matrix

| Priority | BPs | Theme |
|---|---|---|
| **P1 — This week** | BP-2, BP-4, BP-1 | Spec quality, isolated verification, token-aware routing |
| **P2 — This month** | BP-3, BP-5, BP-6, BP-7, BP-8, BP-10, BP-11, BP-12 | KG memory, worktrees, experience store, planning phase, MCP files, peak scheduling, Auto Mode, target spec |
| **P3 — Backlog** | BP-9, BP-13 | Centralized routing proxy, local inference |

## Top 3 for Immediate Action

1. **BP-2 (Structured Spec Format)** — Low effort, highest-confidence ROI. The Specification Gap paper's finding is stark: spec quality is the primary lever. Current one-liner dispatch descriptions are a coordination liability.
2. **BP-4 (Isolated Verification)** — Low effort, directly implementable. Strip generator reasoning from verifier context in dispatch. This costs nothing and prevents systematic confirmation bias.
3. **BP-1 (Token-Aware Model Routing)** — Med effort, clear cost savings. Adding `model_hint` + `complexity` to task JSON and routing accordingly will reduce API spend on triage/monitoring tasks immediately.

## Open Questions

- Is the Right Hand's `memory/agent-performance.md` still being written to, or has it been replaced by main.sqlite? If sqlite-only, BP-6 needs to target the DB schema directly.
- What's the current task spec format in the dispatch queue? If it already has structured fields, BP-2 may be about enforcement, not schema design.
- Has Claude Code Auto Mode been tested against any dispatch-spawned tasks? Need a test run before committing to BP-11.

## Sources

1. [T1] https://arxiv.org/abs/2603.23971 — Price Reversal, thinking token heterogeneity (Stanford/Berkeley/Microsoft)
2. [T1] https://arxiv.org/abs/2603.24284 — Specification Gap, two-agent coordination collapse
3. [T1] https://arxiv.org/abs/2603.24402 — AI-Supervisor, persistent KG shared memory
4. [T1] https://arxiv.org/abs/2603.24579 — MARCH, information-isolated multi-agent verification
5. [T2] github.com/worktrunk — git worktree-per-agent pattern
6. [T2] github.com/ralph-orchestrator — LOOP_COMPLETE sentinel + PDD planning
7. [T2] github.com/fff.nvim — MCP file indexing to reduce search token waste
8. [T2] github.com/katanemo/plano — Centralized LLM routing + safety filter chains
9. [T2] Reddit (r/ClaudeAI, week of 2026-03-24) — CC Auto Mode, peak-hour session limits, RotorQuant

## Related Notes
- [[Agent-Architecture-Synthesis-2026-03]]
- [[Superman IDE Code Intelligence Analysis]]
- [[Agent Memory Architectures]]
- [[Agent Continuity Patterns]]
