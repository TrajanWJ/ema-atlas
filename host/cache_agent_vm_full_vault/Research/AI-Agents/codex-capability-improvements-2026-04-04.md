---
title: "Codex Capability Improvements — Gap Analysis 2026-04-04"
type: research
created: 2026-04-04
updated: 2026-04-04
confidence: 0.85
tags: [codex, coding-agents, gap-analysis, prompt-engineering, git-discipline, multi-agent, megaplan]
summary: "Structured gap analysis of Codex (gpt-5.4) configuration, prompting, and workflow against best-practice patterns. Seven gaps identified. Top wins: planning phase, git branching protocol, subagent activation."
---

# Codex Capability Improvements — Gap Analysis 2026-04-04

*Sources: 12 total (4 T1 primary, 5 T2 institutional, 3 T3 secondary)*
*Confidence: High (0.85) | Date: 2026-04-04*

---

## Current State (what exists)

### MCP Stack — Strong
`~/.codex/config.toml` has a well-stocked MCP toolset:
- **context7** — live library docs (eliminates API hallucinations)
- **sequential-thinking** — structured problem decomposition
- **memory** + **codebase-memory-mcp** — dual memory layer
- **git** — repo operations beyond filesystem
- **fetch** + **playwright** — web access + browser automation
- **ema** + **filesystem** — EMA integration + project file access

Model: `gpt-5.4`. Sandbox: `workspace-write + network-access`. This is a solid foundation.

### Agent Harness — Good Bones, Missing Key Phases
`SOUL.md` + `CLAUDE.md` define:
- ✅ Pre-flight context injection (file paths, architecture note, success criteria, constraints)
- ✅ Mandatory execution rule (must invoke `codex exec`, not model-only)
- ✅ Failure protocol with partial output preservation
- ✅ Timeout/checkpoint protocol
- ✅ Cross-agent learning via `.learnings/LEARNINGS.md`
- ✅ Code quality standards from vault modules
- ❌ **No planning phase before execution** — task goes straight to `codex exec`
- ❌ **No structured output contract** (no finalize.json equivalent)
- ❌ **No git branching discipline** in the workflow
- ❌ **Codex subagents not utilized** (explorer/worker/default)
- ❌ **No eval/verification loop** for iterative tasks

### Skills Available for Codex
Coding-relevant installed skills:
- `commit-standards` — opinionated conventional commits (installed, not in CLAUDE.md)
- `pr-review` — PR review via gh CLI (installed, not wired)
- `devloop-agent-pack` — full multi-agent dev loop (installed, complex)
- `context7` (MCP) — already in config

From am-will/codex-skills (already in vault, install status unknown):
- `planner` + `parallel-task` — plan-then-spawn pattern
- `llm-council` — multi-model planning synthesis
- `read-github` — LLM-friendly repo reading

### What's Already Researched (Don't Repeat)
- **Megaplan** (peteromallet): plan/critique/gate/finalize.json → EXECUTED state machine. Verdict: steal it.
  - Key insight: executor reads ONLY finalize.json, not full plan history
  - Critique loop generates FLAG-XXX records, gate approves/disputes
- **Anthropic long-running harness**: feature_list.json + progress.txt + git as external memory
  - One feature at a time, verified before marking done, git commit every session

---

## Gap Analysis (what's missing)

### Gap 1 — No Planning Phase Before Execution [CRITICAL]

**Current**: Task → `codex exec "..."` → result  
**Best practice**: Task → Plan → Critique/Review → Gate → Structured spec → Execute

Megaplan proves this with a 9-phase state machine. Anthropic's harness validates it independently with feature_list.json. Both agree: immediate execution without a planning pass is the primary failure mode for complex tasks.

**Evidence of harm**: Fleet-wide mistakes.md shows "coder.failed cluster" — 9 tasks failed in one batch, root cause: missing architectural context. LEARNINGS.md shows Codex failing to correctly scope EMA work without proper pre-planning.

**What to add**: Before `codex exec`, inject a brief planning step: Claude (the orchestration model in the Codex agent) generates a structured mini-spec (task scope, file targets, success criteria, risks) and injects it into the prompt. For complex tasks (>30 min estimated), require explicit gate approval before launch.

### Gap 2 — No Git Branching Discipline [HIGH]

**Current**: CLAUDE.md says nothing about branching. No branch-per-task enforcement. `commit-standards` skill is installed but not wired into the Codex workflow.

**Best practice** (simonwillison, commit-standards skill):
- Every task gets a dedicated branch: `feat/task-slug`, `fix/issue-name`
- Branch created before any file modification
- Atomic commits with WHY-focused messages
- PR opened for human review before merging
- `git worktree` for parallel tasks (workmux pattern)

**Why it matters**: Without branching, Codex edits on main cause hard-to-reverse state. `git bisect` becomes impossible. Multiple concurrent tasks corrupt each other.

**What to add**: Explicit branching protocol in CLAUDE.md step 1.5: create feature branch before invoking `codex exec`. Reference `commit-standards` skill. Add branch naming to the pre-flight checklist.

### Gap 3 — Codex Subagents Not Utilized [HIGH]

**Current**: Codex subagents (explorer/worker/default) were announced GA in March 2026. Not mentioned anywhere in the Codex agent config or SOUL.md.

**What they enable**:
- **Explorer** subagent: codebase investigation, understanding unfamiliar repos, finding relevant files
- **Worker** subagent: parallel small task execution (CSV-style batching)
- **Default**: general-purpose

**Pattern that works** (from subagents research note):
```
"Investigate why the settings modal fails to save" (→ explorer)
"Implement these 5 small fixes in parallel" (→ worker × N)
```

**What to add**: Document subagent invocation patterns in CLAUDE.md. Use explorer for Phase 1 (codebase orientation) before spawning the main execution task. Use worker for parallel small fixes.

### Gap 4 — No Persistent State for Long Tasks [MEDIUM]

**Current**: Timeout protocol writes to `/tmp/codex-checkpoint-[slug].md`. Ephemeral. No session-to-session continuity.

**Anthropic harness pattern**: External artifacts as memory — `feature_list.json` (all features with pass/fail), `progress.txt` (session handoff notes), git log (technical history). Each session reads these before working.

**What to add**: For tasks spanning multiple sessions, create a `codex-task-[slug].json` in the project directory with: task definition, files touched, progress notes, next steps. Codex reads it on startup. Write it before ending session.

### Gap 5 — No Eval/Verification Loop [MEDIUM]

**Current**: Codex returns output. No verification loop, no scoring, no "keep going until criteria met."

**OpenAI's own guidance** (developers.openai.com/codex/use-cases/iterate-on-difficult-problems): For hard tasks, give Codex evaluation scripts with deterministic checks + LLM-as-judge. Set stopping criteria (e.g., "continue until score >90%"). Log each iteration's results.

**Applicable to**: Refactoring tasks, optimization, multi-step debugging, tasks with passing test suites as acceptance criteria.

**What to add**: For tasks with test suites, the codex exec prompt should include: "Run tests after each change. Only report DONE when `[test command]` returns 0. Document failures and recovery steps."

### Gap 6 — Model Routing Not Used [LOW-MEDIUM]

**Current**: Everything runs on gpt-5.4. CLAUDE.md documents override syntax (`-c model=o3`) but it's never applied by default.

**Megaplan pattern**: Planning phases use stronger model (Claude), execution phases use efficient model.

**Practical for Trajan**: Planning/critique pass → use `o3` for higher reasoning. Execution → `gpt-5.4`. This is already supported by the TOML migration notation.

**What to add**: In CLAUDE.md, add guidance: for complex planning tasks (architecture, multi-file refactors >500 LOC), add `-c model=o3` to the codex exec call.

### Gap 7 — Repos Lack AGENTS.md [LOW]

**Current**: Codex has AGENTS.md in its own workspace but projects it works on may not have AGENTS.md/CLAUDE.md files.

**Best practice**: Each project Codex regularly touches should have a brief AGENTS.md: conventions, test command, forbidden files, key architectural decisions.

**What to add**: Codex should generate an AGENTS.md on first contact with any new repo if one doesn't exist.

---

## Concrete Improvements (ranked by impact)

### 1. Pre-Flight Planning Step in CLAUDE.md [IMPACT: CRITICAL]

**What**: Add step 1.5 to the task dispatch protocol: before `codex exec`, Claude (the orchestration layer) generates a structured prompt spec:

```markdown
## Task Spec
**Files**: [list absolute paths of files to touch]
**Architecture context**: [2-3 sentences on how this component fits]
**Success criteria**: [exact definition of done]
**Must-not-touch**: [off-limits files/code]
**Risks**: [1-2 known gotchas]
**Complexity estimate**: [simple/medium/complex]
```

For `complex` tasks: add `--think` flag to `codex exec` call and request a plan before execution.

**Why it works**: Fleet mistakes.md shows failure rate drops when architectural context is injected. Megaplan's finalize.json pattern proves structured handoffs reduce plan drift. Anthropic's harness validates externalized context.

**Time to implement**: 30 min (edit CLAUDE.md + SOUL.md)

### 2. Git Branching Protocol [IMPACT: HIGH]

**What**: Add to CLAUDE.md step 0 (before pre-flight):

```bash
# Step 0: Create task branch
git checkout -b feat/[task-slug]
# OR for fixes:
git checkout -b fix/[issue-slug]
```

Add to step 5 (after codex returns result):
```bash
# Step 5: Commit + PR
# Apply commit-standards skill for message format
# Create PR for human review before merge
```

Wire in the `commit-standards` skill reference. Add explicit: "Never apply diffs directly to main."

**Time to implement**: 20 min (edit CLAUDE.md)

### 3. Codex Subagent Patterns [IMPACT: HIGH]

**What**: Add to SOUL.md + CLAUDE.md:

```
## Subagent Routing

**Explorer subagent**: Use for codebase investigation before implementation tasks.
Prompt pattern: "Investigate [problem/codebase] and return: relevant file list, 
key functions, existing patterns, potential impact zones."

**Worker subagent**: Use for parallel independent fixes.
Prompt pattern: "Execute these N independent tasks in parallel: [task list in CSV format]"

**Default**: All other tasks.
```

**Time to implement**: 30 min

### 4. Task Persistence JSON for Multi-Session Work [IMPACT: MEDIUM]

**What**: For tasks estimated >30 min or spanning multiple sessions:

```bash
# Create at task start:
/tmp/codex-task-[slug].json  → {task, files_in_scope, progress, next_steps, session_count}
# Update before session end
# Read at session start if resuming
```

Model after Anthropic's feature_list.json pattern.

**Time to implement**: 45 min (add protocol to CLAUDE.md + create JSON schema)

### 5. Eval Loop Enforcement for Test-Backed Tasks [IMPACT: MEDIUM]

**What**: When task has a test suite, codex exec prompt must include:

```
After making changes:
1. Run: [test command]
2. If any tests fail, fix them before reporting done.
3. Do NOT report DONE with failing tests.
4. If you can't fix tests within 3 attempts, report DONE_WITH_CONCERNS with exact failure details.
```

**Time to implement**: 15 min (add to CLAUDE.md template)

### 6. Model Routing Guidelines [IMPACT: LOW-MEDIUM]

**What**: Add to CLAUDE.md:

```
## Model Selection

- Default: gpt-5.4 (fast, capable)
- Complex planning/architecture (>500 LOC refactor, new feature design): add -c model=o3
- Pattern: codex exec "task" -c model=o3  
```

**Time to implement**: 10 min

### 7. AGENTS.md Generation for New Repos [IMPACT: LOW]

**What**: When tasked with a repo that has no AGENTS.md:

```
First action: Generate AGENTS.md with: project overview, test command, 
key conventions, forbidden files, architecture summary.
```

**Time to implement**: 15 min (add to CLAUDE.md step 0)

---

## Quick Wins (can implement today)

These can all be done in < 2 hours total by editing CLAUDE.md and SOUL.md:

1. **Add pre-flight task spec template to CLAUDE.md** — copy the Task Spec block above, make it step 1.5 in dispatch protocol. [30 min]

2. **Add git branching to CLAUDE.md step 0** — one-liner: `git checkout -b [type]/[slug]` before codex exec. Reference commit-standards skill. [20 min]

3. **Add eval loop mandate for test-backed tasks** — add the test loop template to CLAUDE.md. [15 min]

4. **Add subagent routing section to SOUL.md** — document explorer/worker patterns. [20 min]

5. **Add model routing guidance to CLAUDE.md** — `-c model=o3` for complex tasks. [10 min]

**Total quick win cost: ~95 minutes. Estimated improvement: eliminates the two top failure modes (thin spec → failure, no branching → messy state).**

---

## Longer Plays (1-week horizon)

### A. Megaplan Mini-Harness for Codex

Build a lightweight wrapper around `codex exec` that enforces a 3-phase mini-megaplan:
1. **Plan phase**: Claude generates finalize-style JSON spec for the task
2. **Critique pass**: Run a quick verification prompt against the plan ("identify risks, gaps, conflicts")
3. **Exec phase**: codex exec receives the finalize JSON as structured context, not freeform prompt

This is 60% of Megaplan's value at 20% of the complexity. Port the finalize.json schema.

Estimated: 2-3 days (design spec + build harness + test on 2-3 real tasks)

### B. LLM-Council Integration for Architecture Decisions

The `llm-council` skill from am-will spawns Claude + Codex + Gemini to independently plan the same task, then synthesizes. Apply this specifically to:
- New feature architecture decisions
- Refactoring strategy choices
- Debugging novel issues

Requires: Anthropic + OpenAI + Google API keys (Trajan already has these for the full stack).

Estimated: 1 day (install + wire into Codex agent workflow as optional mode)

### C. Git Worktree Parallel Execution (workmux)

workmux enables git worktree + tmux for isolated parallel Codex tasks on the same repo. Already researched. Applicable to host projects (execudeck, proslync, etc.) where Trajan runs multiple concurrent features.

Install: `cargo install workmux` or grab the binary from releases.

Estimated: 4 hours to set up + document workflow

### D. Feature-Gated Progress Tracking

Implement the Anthropic feature_list.json pattern for EMA and any other long-running projects. A feature tracker that Codex reads and updates each session would enable:
- Pick up where you left off without context loss
- Automated progress reporting to Trajan
- Never re-implement completed features

Estimated: 3 days (design schema per project, create init script, update CLAUDE.md startup protocol)

---

## New Skills Worth Installing

These are NOT yet installed in the Codex agent workflow but high-value:

```bash
# Install planner + plan-harder for structured pre-execution planning
npx skills add am-will/codex-skills --skill planner --skill plan-harder -a codex -g

# Install llm-council for multi-model architecture synthesis
npx skills add am-will/codex-skills --skill llm-council -a codex -g

# Install read-github for repo investigation during planning phase
npx skills add am-will/codex-skills --skill read-github -a codex -g
```

Note: `context7` is already configured as an MCP server, so skip that one.

---

## Sources

1. [T1] `/home/trajan/.openclaw/agents/codex/workspace/SOUL.md` — Codex agent current config
2. [T1] `/home/trajan/.openclaw/agents/codex/workspace/CLAUDE.md` — Codex dispatch protocol
3. [T1] `~/.codex/config.toml` — MCP stack, model, sandbox config
4. [T1] `/home/trajan/vault/Research/AI-Agents/megaplan-plan-execute-split.md` — plan/execute state machine pattern (primary research, already done)
5. [T1] `/home/trajan/vault/Research/AI-Agents/Claude-Code-Harness-Long-Running-Agents.md` — Anthropic feature_list.json + progress.txt harness
6. [T2] [simonwillison.net — Using Git with coding agents](https://simonwillison.net/guides/agentic-engineering-patterns/using-git-with-coding-agents/) — git bisect, branching, session seeding patterns
7. [T2] [simonwillison.net — Use subagents and custom agents in Codex](https://simonwillison.net/2026/Mar/16/codex-subagents/#atom-everything) — Codex subagents GA, explorer/worker/default roles
8. [T2] [developers.openai.com — Iterate on difficult problems](https://developers.openai.com/codex/use-cases/iterate-on-difficult-problems) — eval loop, stopping rules, iteration discipline
9. [T2] `/home/trajan/vault/Research/codex-skills-collection.md` — am-will skill catalog with planner/llm-council
10. [T2] `/home/trajan/vault/Agent-Learnings/mistakes.md` — fleet failure patterns (thin spec → failure cluster)
11. [T2] `/home/trajan/vault/Agent-Learnings/patterns.md` — verified MCP stack patterns
12. [T3] `/home/trajan/vault/Research/AI-Agents/workmux-parallel-agents.md` — git worktree parallel agents

---

*Related: [[megaplan-plan-execute-split]] | [[Claude-Code-Harness-Long-Running-Agents]] | [[codex-skills-collection]] | [[Agent-Learnings/mistakes]]*
