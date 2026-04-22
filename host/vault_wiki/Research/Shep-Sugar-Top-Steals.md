---
id: "fc63690d-778c-488a-a8f0-3b01bf5e2cad"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Shep & Sugar — Top Steals
tags: [research, cross-pollination, shep, sugar, critical, top-priority]
source: session-2026-04-07
---

# Shep + Sugar — The Highest-Value Cross-Pollination

## Sugar = Memory Layer EMA Is Missing
EMA's SecondBrain is markdown vault — not structured, no importance/decay, no semantic search, not agent-facing via MCP.
Sugar solves all this in 643 LOC of Python. Direct port to Elixir.

### Memory Schema (port verbatim)
- types: decision, preference, file_context, error_pattern, research, outcome, guideline
- scope: project | global | actor | space
- importance score, access_count, last_accessed_at, expires_at
- FTS5 + sqlite-vec semantic search

### MCP Tools (5 to mirror)
- ema_memory_store
- ema_memory_search
- ema_memory_recall (returns formatted markdown)
- ema_memory_context (project context bundle)
- ema_memory_list_recent

### Resources (3)
- ema://project/{slug}/context
- ema://actor/{slug}/state
- ema://intents/tree

## Shep = Runtime Resilience EMA Needs
Battle-tested patterns from a TypeScript SDLC orchestrator. Translate cleanly to Elixir/OTP.

### 1. Typed State Annotations
Replace loose %Proposal{} structs with TypedStruct + per-field reducers. Better type discipline + replay-ability.

### 2. Validate→Repair Loops (KILLER)
Every producer node followed by validate + repair (3 retries max).
Validation runs schema checks, repair re-invokes Claude with errors in prompt.
Direct application to EMA proposal pipeline — solves quality problem.

### 3. Checkpointer + Heartbeat
- executions.last_heartbeat (30s writes)
- executions.checkpoint_data (jsonb snapshot per phase)
- Supervisor detects gap >90s → mark :stuck → allow resume
- ema executions resume <id> loads checkpoint and reinvokes from last completed phase

### 4. LESSONS.md Discipline
Read /tmp/cross-pollination/shep/LESSONS.md — 200 lines of brutal post-mortems.
EMA already has wiki/User/Learnings-Gotchas.md — elevate to same rigor.
Add 'additive-only migrations' rule.

### 5. Clean IAgentExecutor Port
Bridge.run/2 should be the ONLY public surface for Claude invocation.
Delete all bypass call sites. Add CI check.

## Sugar's Ralph Wiggum Pattern
Iterative execution: same prompt repeatedly, agent reads own work from disk/git.
Exit signaled via <promise>done</promise> tags.
CompletionCriteriaValidator REFUSES to start without exit criteria.
Stuck-pattern detection bails early.
Add as Ema.Executions.Ralph alternative dispatcher.

## Sugar's FeedbackProcessor + AdaptiveScheduler
- Analyze last 50 completed + 20 failed
- Compute success patterns by type/priority/source
- AdaptiveScheduler boosts high-success modules, lowers complex-failing types
- Writes to wiki/User/Learnings-Auto.md daily
- Turns proposal engine from static → self-tuning

## Implementation Order (4 weeks)
- Week 1: Memory layer (Ema.Memory) + MCP tools
- Week 2: Wire memory into Shared Agent Context, build Memory vApp
- Week 3: Actor/space scoping, Ralph mode dispatcher
- Week 4: FeedbackProcessor port + Shep validate/repair + checkpoint/heartbeat

## Files to Read for Direct Port
| File | Lines | Purpose |
|------|-------|---------|
| sugar/memory/store.py | 643 | Complete memory store |
| sugar/memory/retriever.py | 250 | Context assembly + token budgeting |
| sugar/mcp/memory_server.py | ~200 | 5 MCP tools, 3 resources |
| sugar/ralph/profile.py | ~100 | Iterative prompt template |
| sugar/ralph/validator.py | ~80 | Completion criteria enforcement |
| sugar/learning/feedback_processor.py | 575 | Self-tuning logic |
| shep/.../node-helpers.ts | 675 | executeNode wrapper with timing+heartbeat |
| shep/LESSONS.md | 200 | Hard-won discipline rules |
