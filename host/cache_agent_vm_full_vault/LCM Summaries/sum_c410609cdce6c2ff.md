# LCM Summary sum_c410609cdce6c2ff

Created: 2026-03-20 10:28:59
Kind: leaf
Depth: 0
Conversation: 690
Tokens: 1215
Descendants: 0
Earliest: 2026-03-20T09:46:39.000Z
Latest: 2026-03-20T10:06:45.000Z

## Content

[2026-03-20 09:46 UTC]
Splitting this into two parts — the stuff I'll build, and the stuff I won't.

[2026-03-20 09:46 UTC]
{
  "ok": true,
  "result": {
    "messageId": "1484487512138190889",
    "channelId": "1484435106365046844"
  }
}

[2026-03-20 09:46 UTC]
Now let me plan this properly — 6 features, multi-step.

[2026-03-20 09:46 UTC]
Successfully wrote 1934 bytes to /home/trajan/.openclaw/agents/main/workspace/scratch/TODO-orchestration-batch2.md

[2026-03-20 09:46 UTC]


[2026-03-20 09:46 UTC]
- On pattern review: `~/bin/dispatch-replay.sh stats` for routing accuracy

## Token Budgets
| Agent | Output Budget | Escalation |
|---|---|---|
| Researcher | 15K tokens | Summarize + offer details |
| Coder | 30K tokens | Abort partial, re-scope |
| Ops | 5K tokens | Truncate |
| Utility | 10K tokens | Summarize findings |
| Devil's Advocate | 8K tokens | Structured critique |

Include: "TOKEN BUDGET: Output must not exceed ~{N}K tokens. Summarize if exceeding."

## Evidence-Based Verification

Every task completion claim MUST include evidence. "I did it" is not evidence.

### Standard Evidence Checklist

| Check | Applies To | Evidence |
|---|---|---|
| **BUILD** | Code tasks | Compiles without errors (paste compiler output) |
| **TEST** | Code tasks | Tests pass (paste test runner output) |
| **LINT** | Code tasks | No new warnings (paste linter output) |
| **FUNCTIONALITY** | All tasks | The thing actually works (paste proof — command output, screenshot, file diff) |

### Evidence Rules

1. Evidence must be **FRESH** — command output from within the current session. Not cited from memory, not "I ran this earlier."
2. If evidence is missing → send back for re-verification with: "Missing evidence for: {checklist items}"
3. If evidence is stale (references prior session/run) → reject and re-run
4. For non-code tasks (research, reviews): evidence = citations, file paths created, structured output matching the OUTPUT CONTRACT

### Evidence Format Template

```
EVIDENCE:
  BUILD: {PASS|FAIL|N/A} — {output snippet or "no build step"}
  TEST: {PASS|FAIL|N/A} — {test runner output or "no tests"}
  LINT: {PASS|FAIL|N/A} — {linter output or "no linter configured"}
  FUNCTIONALITY: {PASS|FAIL} — {proof of working behavior}
```

## Verification (Three Layers)

### Layer 0: Cheap Gates (deterministic, no LLM)
Run BEFORE reading the agent's output in detail. Fast, free checks:
- **Researcher:** Does output contain URLs/citations? (string check)
- **Coder:** Does code compile/run? Do tests pass? (exec check)
- **Ops:** Did the service status change as expected? (command check)

[243 more lines in file. Use offset=146 to continue.]

[2026-03-20 09:46 UTC]
## Dispatch Protocol

### Standard Dispatch Context (include in every spawn)

Every agent gets a structured context block — not a freeform prose prompt:

```
TASK: [one sentence — what to do]
GOAL: [why this matters — what the user actually wants]
CONTEXT: [relevant vault/memory findings, prior conversation, related files]
CONSTRAINTS: [token budget, time limit, scope boundaries]
OUTPUT CONTRACT: [exact format expected — see agent's "Returns" column above]
STATUS PROTOCOL: Report DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT.
  It is always OK to say "this is too hard for me."
```

**Before dispatching:** Check `memory/agent-performance.md` for past failures on similar tasks. If an agent has failed this type before, either use a different agent or include what went wrong last time in CONTEXT.

**Pre-execution gate:** Before dispatching, verify the prompt has concrete anchors (file paths, code symbols, numbered steps, error messages). Vague prompts get redirected to planning or deep interview. See `refs/dispatch-protocol.md` Pre-Execution Gate.

**The cycle:** Classify (complexity gate) → Gate check (anchors?) → Plan (if complex) → Construct context → Dispatch → Collect → Verify → Log → Present

**Self-review prohibition:** The agent that implemented work MUST NOT verify it. Coder work → verify with Devil's Advocate or Researcher. See `refs/dispatch-protocol.md` Self-Review Prohibition.

**Evidence-based verification:** Every completion claim needs fresh evidence (build, test, lint, functionality). See `refs/dispatch-protocol.md` Evidence-Based Verification.

**Verification is three-layer:** (0) Cheap gates — deterministic checks before reading output. (1) Spec compliance — does output match the OUTPUT CONTRACT? (2) Quality — is it well-done? All layers in `refs/dispatch-protocol.md`.

**Every completion:** Log to `memory/outcome-tracker.json` with structured outcome.

**Failure circuit breaker:** Same task + same approach = 3 failures → mandatory escalation. Never retry the same approach a 4th time. See `refs/dispatch-protocol.md` Failure Circuit Breaker.

**Timeouts:** Age
[LCM fallback summary; truncated for context management]
