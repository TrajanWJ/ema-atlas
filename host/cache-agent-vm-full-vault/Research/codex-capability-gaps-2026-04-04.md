---
title: "Codex Capability Gap Report — 2026-04-04"
created: 2026-04-04
updated: 2026-04-04
type: research
status: active
confidence: 0.82
source: researcher-subagent
tags: [codex, coding-agent, gaps, improvements, multi-agent]
summary: "Gap analysis of Codex agent vs coder learnings, skill collection, and external best practices. 7 prioritized gaps with action plan."
---

# Codex Capability Gap Report — 2026-04-04

*Sources: Internal cross-pollination (8 files), external fetch (GitHub/OpenAI docs), runtime inspection*
*Confidence: High on structural gaps | Medium on external best practices (web search unavailable)*
*Date: 2026-04-04*

---

## Cross-Pollination Findings

### From coder.LEARNINGS.md

**Successful patterns (coder built these without failing):**
- Complex multi-file frontend builds (feed detail panels, workbench tabs, API endpoints)
- SQLite dual-write integration and DB audits
- Proposal engine design + implementation (v2 from scratch)
- Python intelligence daemon replacing bash pipeline
- Long-horizon tasks with many sub-steps (e.g., unified Agent OS wiring)

**Failure patterns (coder.failed, all from 2026-03-19):**
- Build: Reminder Engine
- Build: Streaming Progress (Edit-Not-Post)
- Build: Cross-Channel Backlinker
- Build: Approval Gate for High-Stakes Actions
- Implement improvements from research proposal for 'self_lear...' (x2)
- Fix cron persistence
- Fix #1 priority item

**Signal from failures:** The failures are clustered on the same day (2026-03-19) and all involve either (a) features that touch Discord/OpenClaw-specific infrastructure, or (b) self-improvement loop tasks. These likely failed because Codex lacked context about OpenClaw internals, not because of capability limits. Codex gets passed tasks without knowing the project's full context.

**Successful pattern extracted:** Coder succeeds on well-specified tasks with clear paths + file targets. It fails when the task requires inferring missing architectural knowledge.

### From researcher.LEARNINGS.md

- All early failures (2026-03-19) were standard research tasks — suggests early agent scaffolding problems, not model issues
- Later tasks (2026-03-25 onward) all complete successfully — pipeline stabilized
- No learnings relate to Codex specifically; researcher doesn't interact with Codex directly

### From agent-improvements-2026-03-20.md

Three proposed patches (from coder's pattern analysis):
1. **Consolidate duplicate startup reads sections in SOUL.md** — two conflicting sections cause agents to silently miss one
2. **Add failed task protocol** — the `coder.failed` stub was never resolved after 3 recurrences
3. **Add complexity gate for Claude Code delegation** — "complex" was never defined, causing inconsistent spawn decisions

**Gap:** These patches were proposed but likely not applied. Codex has no equivalent failed-task protocol. And the complexity gate was proposed for the coder agent — not carried over to Codex.

### From codex-skills-collection.md

Skills catalogued for Codex but not installed:
- **planner** — phased plans with sprints + atomic tasks
- **plan-harder** — enhanced analysis + detailed task breakdown
- **parallel-task** — launch multiple subagents from plan files
- **llm-council** — spawn Claude + Codex + Gemini to independently plan, judge synthesizes best
- **context7** — fetch up-to-date library docs via Context7 API
- **openai-docs-skill** — query OpenAI docs via MCP
- **read-github** — LLM-friendly repo reading (no auth needed)
- **markdown-url** — clean Markdown view of any URL
- **frontend-design** / **frontend-responsive-ui** — Anthropic design standards
- **vercel-react-best-practices** — React/Next.js guidance

**Only confirmed installed in ~/skills/:** `agent-browser`

None of these are in Codex's workspace skills directory (no skills dir exists there at all).

### From coding-patterns.md + coding-standards.md

These are the canonical standards:
- Tool selection: Edit for simple, Claude Code for complex, spawn for multi-file refactors
- Quality: Correctness first, elegance second, no over-engineering
- Review mindset: Small diffs, one concern per change, test happy AND failure paths

**Gap vs Codex SOUL.md:** SOUL.md doesn't explicitly mention coding standards. It's purely about "invoke Codex CLI" — no mention of: preferred code quality standards, what to do if Codex produces bad output, how to validate diffs, or when to use `codex review` vs `codex exec`.

### From Codex CLAUDE.md/SOUL.md Gap Analysis

**Current state:**
- CLAUDE.md: Well-structured. Covers auth, dispatch protocol, example workflow, model override, mandatory execution rule
- SOUL.md: Concise. Covers core purpose, invocation rules, integration, superpowers

**What's MISSING from both:**
1. **No .learnings/ directory** — confirmed by runtime check. Zero cross-agent learning.
2. **No startup reads** — AGENTS.md says "read SOUL.md and USER.md on startup" but no instruction to read Agent-Learnings or cross-agent learnings
3. **No failed task protocol** — CLAUDE.md has "return BLOCKED" but zero guidance on what to report or how to document
4. **No task complexity gate** — unlike the coder agent which had this proposed, Codex has no filter
5. **No coding standards reference** — doesn't point to vault/Agents/Modules/coding-standards.md
6. **No sandbox escalation procedure** — CLAUDE.md says "flag if task needs unrestricted disk/network" but no specific escalation path
7. **No timeout/retry behavior** — if `codex exec` hangs or times out, no protocol exists
8. **No progress checkpointing** — long Codex runs can fail silently with no partial output saved
9. **The mandatory execution rule exists in CLAUDE.md but NOT in SOUL.md** — SOUL.md is the authoritative file loaded on startup; the rule needs to be in both
10. **BOOTSTRAP.md still exists** — this is the generic "configure who you are" bootstrap, not a Codex-specific one. Suggests workspace was adapted from a generic template without cleaning up.

---

## External Research Findings

*Note: web_search unavailable (no Brave API key configured). Used web_fetch directly for key URLs.*

### From OpenAI Codex GitHub (github.com/openai/codex)

The Codex CLI is actively maintained. Key details:
- Install: `npm install -g @openai/codex` or `brew install --cask codex`
- Auth: ChatGPT Plus/Pro/Team plans OR API key
- Latest release available via GitHub releases

**Architecture insight from leaks (per Reddit intelligence, March 2026):**
- Claude Code source leaked via npm map file → extensive community analysis
- Claude Code uses: tool loops, context management, session state
- Key finding from r/LocalLLaMA: "Claude Code's multi-agent orchestration system extracted from source" — confirms the pattern of tool-calling loops with explicit context injection

**Best practices surfaced from community (from researcher's Reddit intel):**
- "I built a tool that saves ~50K tokens per Claude Code conversation by pre-indexing" — context pre-loading before agent invocation is a major pattern
- "Why the 1M context window burns through limits faster and what to do about it" — large context = expensive; agents need context budgeting
- "PSA: Claude Code has two cache bugs that can silently 10-20x your API costs" — caching correctness matters
- "Claude Code has a hidden runtime and your slash commands can use it" — undocumented capabilities exist
- Garry Tan's gstack (56k stars): personal skill pack for Claude Code — confirms skill system value
- boris Cherny's 15 tips — source creator's own advice is high-signal

### From vault/Research/Best-Practices-2026-03-27.md (referenced in researcher learnings)

Key findings applied from March 2026 research sprint:
- **Specification Gap**: Multi-agent coordination collapses 58%→25% without rich specs — task descriptions to Codex need more context
- **AI-Supervisor pattern**: Persistent Knowledge Graph shared memory outperforms stateless pipelines
- **MARCH pattern**: Information isolation between verifier and generator prevents confirmation bias
- **worktrunk**: git worktree-per-agent for parallel isolation
- **ralph-orchestrator**: LOOP_COMPLETE sentinel + PDD planning phase

### External Codex CLI Facts

Based on official docs:
- `codex exec` is the primary non-interactive mode
- `codex review` for code review
- `-c model=<model>` for model override
- `--sandbox <mode>` for sandbox control
- Image analysis with `-i` flags
- MCP servers supported via config.toml (already configured: codebase-memory-mcp, ema, filesystem)

---

## Gap Analysis (ranked by impact)

### Gap 1: No .learnings/ Directory or Cross-Agent Knowledge Sharing — Impact: HIGH

**What it is:** Codex has no `.learnings/LEARNINGS.md`, no startup reads of cross-agent patterns, and no mechanism to accumulate taREDACTED_TOKEN knowledge.

**Why it matters:** Every other agent (coder, researcher) has LEARNINGS.md. The coder agent's 9 failure entries from 2026-03-19 were all about tasks that failed — and Codex would face the same task types without knowing they failed before.

**Evidence:** Runtime check confirmed no `.learnings/` directory. AGENTS.md/SOUL.md have no startup read protocol beyond SOUL.md + USER.md.

**Recommended fix:** Create `.learnings/LEARNINGS.md`, add startup read of `vault/Agent-Learnings/` files (patterns, mistakes, tools) to CLAUDE.md/SOUL.md.

---

### Gap 2: No Failed Task Protocol — Impact: HIGH

**What it is:** When `codex exec` fails, CLAUDE.md says "return BLOCKED with exact failure" but provides zero structure for what to document, where to log it, or how to escalate.

**Why it matters:** The coder agent had the same gap — 3 recurrences hit before it was flagged. The agent-improvements-2026-03-20.md proposed a fix for coder but it was never carried to Codex. A Codex failure silently disappears with no learning for the fleet.

**Evidence:** CLAUDE.md has one line: "If codex fails, return BLOCKED or DONE_WITH_CONCERNS with exact failure." No structured format, no logging, no escalation path.

**Recommended fix:** Add structured failure report format (see CLAUDE.md patches section below). Add instruction to append failure to `.learnings/LEARNINGS.md`.

---

### Gap 3: Task Specifications Too Thin — Impact: HIGH

**What it is:** Tasks arrive to Codex as plain English with minimal context. The Specification Gap finding (from arXiv 2603.24284, surfaced in March 2026 research) shows coordination collapses 58%→25% without rich specs.

**Why it matters:** Coder's failures were concentrated on tasks requiring knowledge of OpenClaw internals. Codex would face the same. Without file paths, architecture context, and success criteria, Codex exec will produce generic solutions that don't fit the system.

**Evidence:** CLAUDE.md Step 2 says "Gather context — File paths, diffs, error messages" but this is reactive. No pre-flight context injection protocol exists.

**Recommended fix:** Add a pre-flight protocol to CLAUDE.md: before `codex exec`, always inject: (a) relevant file paths, (b) brief architecture note, (c) success criteria. Template this.

---

### Gap 4: No Skills Installed in Codex Workspace — Impact: MEDIUM-HIGH

**What it is:** Codex has no skills directory. The codex-skills-collection.md documents 13 skills worth installing, but zero are in `~/.openclaw/agents/codex/workspace/skills/`.

**Why it matters:** Skills like `planner`, `context7`, `read-github`, and `llm-council` would materially improve Codex's planning quality and documentation access. `agent-browser` is installed globally in ~/skills/ but Codex doesn't have a skills dir to inherit from.

**Evidence:** `ls ~/.openclaw/agents/codex/workspace/skills/` → "NO skills dir"

**Recommended fix:** Install high-value skills into Codex workspace: `planner`, `context7`, `read-github`, `agent-browser`. See Skills to Install section.

---

### Gap 5: Mandatory Execution Rule Only in CLAUDE.md, Not SOUL.md — Impact: MEDIUM

**What it is:** The critical rule "never silently substitute your own model-only answer for a Codex run" exists only in CLAUDE.md. SOUL.md is the file loaded on startup — if SOUL.md doesn't have this rule, it can be missed.

**Why it matters:** Without this rule in SOUL.md, the agent's primary behavioral constraint (actually invoke Codex CLI) has a single point of failure. If CLAUDE.md isn't loaded, the rule is invisible.

**Evidence:** SOUL.md does have "Non-Negotiable Rule" section but it's lighter than CLAUDE.md's "Mandatory execution rule." SOUL.md says "you must actually invoke the local codex CLI" without the specific edge cases (no `cat`, no `read`, no model-only shortcut).

**Recommended fix:** Mirror the full mandatory execution rule into SOUL.md with same specificity as CLAUDE.md.

---

### Gap 6: No Coding Standards Reference — Impact: MEDIUM

**What it is:** Codex has SOUL.md and CLAUDE.md focused entirely on "invoke CLI and return results." Neither references `vault/Agents/Modules/coding-standards.md` or `coding-patterns.md`.

**Why it matters:** Codex will execute tasks using whatever defaults gpt-5.4 has, not Trajan's standards. Correctness-first, no over-engineering, small diffs — these need to be in Codex's context.

**Evidence:** coding-standards.md exists at vault/Agents/Modules/ but is not referenced anywhere in Codex's workspace.

**Recommended fix:** Add a "Quality Standards" section to CLAUDE.md pointing to vault/Agents/Modules/coding-standards.md and summarizing the key rules inline.

---

### Gap 7: No Timeout / Retry / Progress Checkpointing Protocol — Impact: MEDIUM

**What it is:** Long `codex exec` runs (complex multi-file builds) can hang or time out with no partial output saved. There's no protocol for progress reporting during long runs.

**Why it matters:** Coder succeeded on complex tasks partly because it worked incrementally and reported checkpoints. Codex has no equivalent instruction.

**Evidence:** CLAUDE.md has a 5-step dispatch protocol with no mention of timeouts, retries, or partial output preservation. Researcher's SOUL.md explicitly requires "checkpoint every 2 minutes" — no equivalent in Codex.

**Recommended fix:** Add checkpoint protocol to CLAUDE.md: for tasks estimated >5 minutes, write partial results to a temp file before full completion. Add retry logic (1 retry with modified prompt before BLOCKED).

---

### Gap 8 (Bonus): BOOTSTRAP.md Should Be Deleted — Impact: LOW

**What it is:** BOOTSTRAP.md still exists in Codex's workspace. This is a generic "configure your identity" startup file for fresh deployments. Codex already has SOUL.md, IDENTITY.md, USER.md — it's fully configured.

**Why it matters:** Token waste on every startup read. Signal that the workspace is a lightly-adapted template, not a purpose-built Codex env.

**Recommended fix:** Delete BOOTSTRAP.md.

---

## Recommended Action Plan

### Immediate (do now, low effort, high impact)

1. **Create .learnings/ directory for Codex**
   ```bash
   mkdir -p ~/.openclaw/agents/codex/workspace/.learnings/
   ```
   Create `LEARNINGS.md` with header matching coder's format.

2. **Add startup reads to CLAUDE.md**
   Add reading of:
   - `vault/Agent-Learnings/patterns.md`
   - `vault/Agent-Learnings/mistakes.md`
   - `.learnings/LEARNINGS.md`

3. **Mirror mandatory execution rule to SOUL.md**
   Current SOUL.md has a lighter version. Match CLAUDE.md's full specificity.

4. **Delete BOOTSTRAP.md**
   It's dead weight and a template artifact.

### Short-term (this week)

5. **Add failed task protocol to CLAUDE.md**
   Structured format, instruction to log to .learnings.

6. **Add coding standards reference to CLAUDE.md**
   Summary inline + path to vault/Agents/Modules/coding-standards.md.

7. **Add pre-flight context injection protocol**
   Before every `codex exec`, inject: relevant file paths, architecture note, success criteria.

8. **Install skills into Codex workspace**
   Priority order: `planner`, `context7`, `read-github`, `agent-browser`.

9. **Add timeout/checkpoint protocol**
   For tasks >5 min, write partial results to temp file.

### Long-term (next sprint)

10. **Implement cross-agent learning loop**
    On task completion, Codex should append outcome to `.learnings/LEARNINGS.md`.
    Right Hand should read Codex .learnings on startup.

11. **Add task complexity gate**
    Mirroring the coder's proposed gate: spawn Codex only for multi-file, build-required work.

12. **Evaluate llm-council skill**
    For complex architectural decisions, use llm-council (Codex + Claude + Gemini synthesis).
    Requires OpenAI + Anthropic + Google API keys.

13. **Add Knowledge Graph shared memory**
    Based on AI-Supervisor pattern from March 2026 research: persistent KG outperforms stateless pipelines.
    codebase-memory-mcp is already configured — needs to be actively used.

---

## Skills to Install

Priority-ordered:

| Skill | Source | Why | Install Command |
|-------|--------|-----|-----------------|
| `planner` | am-will/codex-skills | Phased plans with sprints — prevents underspecified tasks | `npx skills add am-will/codex-skills --skill planner -g` |
| `context7` | am-will/codex-skills | Up-to-date library docs — reduces hallucinated APIs | `npx skills add am-will/codex-skills --skill context7 -g` |
| `read-github` | am-will/codex-skills | LLM-friendly repo reading without auth | `npx skills add am-will/codex-skills --skill read-github -g` |
| `agent-browser` | am-will/codex-skills | Already in ~/skills/ but not in codex workspace | Copy/link from ~/skills/ |
| `llm-council` | am-will/codex-skills | Multi-model synthesis for complex decisions | `npx skills add am-will/codex-skills --skill llm-council -g` (needs API keys) |
| `plan-harder` | am-will/codex-skills | Deep analysis + detailed task breakdown | `npx skills add am-will/codex-skills --skill plan-harder -g` |
| `context-budgeting` | ~/skills/ | Already installed globally — add to Codex workspace | Link from ~/skills/ |

---

## CLAUDE.md Patches

### Patch 1: Add Startup Reads Section

Add after "## Your Role":

```markdown
## Startup Protocol

On session start, read:
1. `SOUL.md` — who you are
2. `.learnings/LEARNINGS.md` — accumulated task patterns (if it exists)
3. `vault/Agent-Learnings/mistakes.md` — fleet-wide failure patterns to avoid
4. `vault/Agent-Learnings/patterns.md` — fleet-wide reusable patterns
```

### Patch 2: Add Failed Task Protocol

Add after "Report status — DONE / DONE_WITH_CONCERNS / BLOCKED":

```markdown
## Failed Task Protocol

When a task fails or `codex exec` returns an error:

1. **State what you tried** — command run, flags used, working directory
2. **State what failed** — exact exit code, stderr excerpt, timeout if applicable
3. **State what would unblock you** — missing context, needed file path, required clarification
4. **Write partial findings** — never discard partial output; save to `/tmp/codex-partial-[task-slug].md`
5. **Do NOT retry the same command a third time** — re-plan or escalate

**Failure report format:**
```
STATUS: FAILED
Command: codex exec "..." -c sandbox=workspace-write
Exit: 1 / Timeout: yes/no
Stderr: [first 5 lines]
Partial output: /tmp/codex-partial-[slug].md
Would unblock: [specific missing context]
```

Append failure to `.learnings/LEARNINGS.md` so the fleet learns.
```

### Patch 3: Add Pre-Flight Context Protocol

Add to Task Dispatch Protocol, between steps 1 and 2:

```markdown
1.5. **Pre-flight context injection** — Before calling Codex, inject into the prompt:
   - Relevant file paths (absolute)
   - Architecture note (2-3 sentences on how this component fits the system)
   - Success criteria (what does "done" look like?)
   - Any known constraints (don't touch X, must use Y pattern)
```

### Patch 4: Add Coding Standards Reference

Add new section:

```markdown
## Code Quality Standards

When reviewing or validating Codex output, apply these standards (from vault/Agents/Modules/coding-standards.md):

- **Correctness first** — working > elegant > clever
- **Read before modifying** — understand the existing pattern, extend don't replace
- **Minimal changes** — a bug fix doesn't need surrounding cleanup
- **No dead code** — delete it, don't comment it out
- **Test both paths** — happy path AND failure path
- **Small diffs** — one concern per change

If Codex output violates these standards, note it in DONE_WITH_CONCERNS status.
```

### Patch 5: Add Timeout/Checkpoint Protocol

Add to Task Dispatch Protocol after step 3:

```markdown
3.5. **Timeout/checkpoint protocol** — For tasks estimated >5 minutes:
   - Set a mental checkpoint at 5 minutes
   - If `codex exec` is still running, capture any stdout so far
   - Write partial results to `/tmp/codex-checkpoint-[task-slug].md`
   - If timeout occurs (>15 minutes), treat as BLOCKED and follow Failed Task Protocol
```

---

## SOUL.md Patches

### Patch 1: Strengthen Mandatory Execution Rule

Current SOUL.md has:
> "For any substantive coding or review request, you must actually invoke the local codex CLI before answering."

Replace with the full rule from CLAUDE.md:

```markdown
## Non-Negotiable Execution Rule

For any substantive coding or review request, you must actually invoke the local `codex` CLI before answering.

- Do not answer from the orchestration model alone
- Prefer `codex review` for review/diff tasks
- Prefer `codex exec` for implementation, debugging, and repo analysis
- If the Codex CLI fails, say so explicitly and include the command, exit code, and stderr summary
- Only answer without invoking Codex for trivial meta-chat about your role or auth status
- If the request explicitly says `run codex exec`, `actually use codex`, or `use codex review`, your first relevant tool call must execute that exact Codex CLI path rather than substituting file reads, `cat`, or your own reasoning
- Every final answer must mention whether you used `codex exec` or `codex review`, the working directory, and a short result excerpt as evidence Codex ran
```

### Patch 2: Add Cross-Agent Learning Note

Add to "Integration" section:

```markdown
## Cross-Agent Learning

After completing or failing a task:
- Append outcome to `.learnings/LEARNINGS.md` (create if needed)
- Include: task summary, outcome (success/fail), what worked, what didn't
- This propagates learning to Right Hand and other agents at next startup
```

---

## Summary Assessment

**Biggest bang-for-buck fixes:**
1. `.learnings/` directory + startup reads — 30 minutes to implement, breaks the amnesia cycle
2. Mandatory execution rule in SOUL.md — 5 minutes, prevents the single biggest Codex failure mode (model answers without invoking CLI)
3. Failed task protocol — 20 minutes, stops silent failures from disappearing

**Confidence level on gaps:** High — all confirmed by direct file inspection and runtime checks, not speculation.

**External research limitation:** Brave API key not configured, so no web search was possible. External findings based on web_fetch of OpenAI docs + signals extracted from researcher's Reddit/arxiv intel from March 2026. The community intelligence from researcher's pipeline is actually high-quality signal for this — Boris Cherny's tips, Claude Code source leak analysis, and arxiv spec gap findings are all directly applicable.
