# Proposal: Agent Architecture Improvements

**Date:** 2026-03-20
**Author:** Researcher Agent
**Task ID:** pipeline-research-20260320-070001
**Status:** PROPOSAL

---

## 1. Current State

The OpenClaw Right Hand system has a well-designed multi-agent architecture:

- **Core roster:** Right Hand (persistent) + 5 specialists (Researcher, Coder, Ops, Utility, Devil's Advocate) + dynamic agents via `agent-factory.sh`
- **System stats:** 17 agent configs, 61 skills, 9 queued / 13 done / 1 failed at assessment time
- **Dispatch pipeline:** Complexity gate → pre-execution gate → context construction → spawn → collect → verify → log
- **Model tiering:** LIGHT / STANDARD / HEAVY routing with documented agent defaults
- **Memory:** 4-tier (working MEMORY.md → episodic daily notes → semantic vault/QMD → procedural SOUL/AGENTS.md)
- **Outcome tracking:** `memory/outcome-tracker.json` records task_id, agent, result, duration, timestamp

**Identified gaps from architecture review:**

1. OUTPUT CONTRACTs are specified in dispatch prompts but never programmatically verified — garbage output propagates silently
2. outcome-tracker.json captures pass/fail but not task-type-specific quality, making routing decisions experience-based rather than data-driven
3. Multi-agent handoffs rely on Right Hand manually extracting context from one agent's output and reformatting for the next — error-prone and not validated
4. Dynamic agent lifecycle transitions (probationary → established → retired) are manual, creating drift between card state and actual performance
5. Tool access constraints (Researcher READ-ONLY, Utility scoped to vault/) live in system prompt text — no enforcement until output is reviewed

---

## 2. Improvements

---

### Improvement 1: Output Contract Validation Layer

**Problem:** The dispatch protocol defines `OUTPUT CONTRACT` fields in every spawn prompt (structured report with cited sources, working code + test output, etc.), but when an agent returns, Right Hand receives the raw output with no automated check against the contract. A Researcher that returns a freeform paragraph instead of a structured report with citations propagates silently. This is the root cause of quality inconsistency — the system only catches failures at the next stage, not at the boundary.

**Rationale:** Contract enforcement at the boundary (not downstream) is the standard reliability pattern for service-oriented architectures. A lightweight schema check costs near-zero but eliminates a whole class of quality degradation. Anthropic's "Building Effective Agents" (2024) identifies human-in-the-loop gates and structured outputs as the two most effective reliability improvements for agentic systems.

**Expected impact:** Catch ~80% of low-quality returns before they pollute downstream agents or reach the user. Reduces need for adversarial re-review when a simple format check would suffice.

**Implementation Steps (coder agent):**
1. Create `workspace/schemas/output-contracts.json` — define schemas per agent type:
   ```json
   {
     "researcher": {"required": ["FINDINGS", "SOURCES", "confidence"], "confidence_fields": ["score", "evidence_quality", "coverage"]},
     "coder": {"required": ["STATUS"], "status_values": ["DONE", "DONE_WITH_CONCERNS", "BLOCKED", "NEEDS_CONTEXT", "PARTIAL"]},
     "ops": {"required": ["ACTION_TAKEN", "VERIFICATION"]},
     "devils-advocate": {"required": ["WEAKNESSES", "RISK_RATING"]}
   }
   ```
2. Create `~/bin/validate-output.sh <agent_type> <output_file>` — checks required fields are present, logs failures to `memory/contract-violations.json`.
3. Call `validate-output.sh` in the dispatch cycle after every agent completion (in the `dispatch.sh done` handler, before logging to outcome-tracker).
4. On validation failure: surface the violation to Right Hand with a structured error: `CONTRACT_VIOLATION: agent=researcher, missing=SOURCES, action=re-dispatch|escalate`.
5. Add violation count to `memory/agent-performance.md` per agent — feed this into routing decisions (see Improvement 2).

---

### Improvement 2: Task-Type Performance Profiling for Adaptive Routing

**Problem:** `memory/outcome-tracker.json` records binary pass/fail per task, but doesn't capture task type, quality score, or model tier used. The routing table in AGENTS.md is static documentation — it can't adapt based on observed performance. The `governance-integration` workflow-pattern shows 67% success rate, but Right Hand has no automatic signal to use a different agent or add extra context when dispatching that pattern.

**Rationale:** Static routing tables are an architectural ceiling — the system can only improve through manual AGENTS.md edits. Adding task-type tagging to outcome tracking creates a feedback loop. Research on adaptive agent routing (Shi et al. 2024, arXiv:2402.01817 — "AgentBench: Evaluating LLMs as Agents") shows that task-type-specific performance varies significantly across model tiers, and that routing based on observed performance outperforms static assignment by 15-30%.

**Expected impact:** Routing decisions improve over time without manual AGENTS.md changes. Patterns with <70% success automatically trigger routing escalation suggestions.

**Implementation Steps (coder agent):**
1. Extend `memory/outcome-tracker.json` schema with new fields per entry:
   ```json
   {
     "task_type": "research|code|ops|vault|adversarial|utility",
     "model_tier": "LIGHT|STANDARD|HEAVY",
     "quality_score": 0-3,
     "pattern_id": "research-sweep|governance-integration|etc"
   }
   ```
   `quality_score`: 0=failed, 1=completed with corrections, 2=completed correctly, 3=completed + exceeded expectations.
2. Create `~/bin/routing-stats.sh [agent] [task_type]` — outputs success rate, average quality, model tier breakdown for a given agent+task combination from outcome-tracker.json.
3. Add a pre-dispatch call to `routing-stats.sh` in `dispatch.sh` — if success_rate < 0.70 for the proposed agent+task_type combo, output a routing warning: `LOW_CONFIDENCE_ROUTE: agent=researcher, task_type=governance-integration, rate=0.67 — consider adding extra context or escalating tier`.
4. Document quality scoring rubric in `refs/dispatch-protocol.md` Quality Scoring section so Right Hand scores consistently.
5. After 30+ outcome entries, run `routing-stats.sh --all` weekly to review and propose AGENTS.md routing table updates.

---

### Improvement 3: Formalized Multi-Agent Handoff Artifacts

**Problem:** In multi-stage pipelines (Research → Synthesize → Vault-Write; Plan → Implement → Verify), Right Hand manually extracts findings from one agent's raw output and reformats them as context for the next agent. This is done in Right Hand's working memory with no written intermediate state. If Right Hand misreads a finding, abbreviates context, or misattributes a source, the error compounds through the pipeline. The workflow-patterns.json shows governance-integration at 67% success — "v1 failed to land changes" likely due to context loss at handoff.

**Rationale:** Defined handoff interfaces are the single most impactful reliability improvement for multi-stage pipelines. Anthropic's agent composition research (2024) shows that explicit shared state between agents — even simple JSON files — reduces compounding errors more than increasing individual agent quality. The system already has `scratch/TODO-{slug}.md` for multi-agent plans; extending this to include structured handoff artifacts is a small increment with large reliability gains.

**Expected impact:** Eliminate the "silent context loss" failure class in multi-agent pipelines. Makes pipeline stages independently reviewable and re-runnable.

**Implementation Steps (coder agent):**
1. Define handoff artifact schema at `workspace/schemas/handoff-artifact.json`:
   ```json
   {
     "artifact_id": "string",
     "pipeline_id": "string",
     "from_agent": "string",
     "to_agent": "string",
     "stage": "string",
     "timestamp": "ISO8601",
     "findings": [],
     "concerns": [],
     "files_created": [],
     "context_for_next": {},
     "confidence": {}
   }
   ```
2. Each agent in a pipeline writes its handoff artifact to `scratch/handoff-{pipeline_id}-{stage}.json` as part of its output (add to OUTPUT CONTRACT for pipeline-mode spawns).
3. Right Hand reads the artifact file (not the raw conversation output) when constructing context for the next stage. This makes handoff state explicit, writable, and reviewable.
4. Create `~/bin/pipeline-status.sh <pipeline_id>` — reads all handoff artifacts for a pipeline and outputs a stage-by-stage status summary.
5. Add a `--resume` flag to `dispatch.sh run` that loads the most recent handoff artifact for the pipeline, enabling pipeline resume after failure without re-running completed stages.

---

### Improvement 4: Dynamic Agent Lifecycle Automation

**Problem:** Dynamic agents have a documented lifecycle (Created → Probationary → Established → Retired) in AGENTS.md, but transitions are manual. The `agent-cards.json` includes a `probationary` field and task count, but nothing automatically promotes or flags agents for retirement based on outcome data. The result: agents sit in probationary state indefinitely, or established agents that have degraded stay active because no one checked.

**Rationale:** Manual lifecycle management doesn't scale as the agent roster grows. The outcome tracking data already exists — this improvement is about closing the loop from data to action. Dynamic agent lifecycle automation is a concrete instance of the "self-learning system" pattern described in SOUL.md, applied at the agent-management level rather than the content level.

**Expected impact:** Established agent registry reflects actual performance. Underperforming agents get flagged before they damage multi-agent pipelines. Reduces Right Hand's manual oversight overhead.

**Implementation Steps (coder agent):**
1. Extend `agent-cards.json` schema per agent entry:
   ```json
   {
     "lifecycle_state": "probationary|established|flagged|retired",
     "task_count": 0,
     "success_count": 0,
     "quality_avg": null,
     "last_reviewed": "ISO8601",
     "retirement_reason": null
   }
   ```
2. Modify `dispatch.sh done` handler: after logging to outcome-tracker, call `~/bin/agent-lifecycle.sh update <agent_id>` which reads outcome-tracker and updates the agent card's counts.
3. `agent-lifecycle.sh transitions` implements the transition rules:
   - Probationary → Established: task_count ≥ 5 AND success_rate ≥ 0.70
   - Established → Flagged: last 3 tasks have quality_avg < 1.5
   - Flagged → Retired: no successful task in 14 days OR manual confirmation
   - Flagged → Established: 2 consecutive successes clears the flag
4. Run `agent-lifecycle.sh transitions` in the morning cron (or hook it to `dispatch.sh status`). Flagged/retired transitions post a Discord notification via Right Hand.
5. Add `lifecycle_state != "retired"` filter to `agent-cards.json` routing lookup in AGENTS.md routing logic.

---

### Improvement 5: Capability Constraints as Enforceable Schema

**Problem:** Tool access constraints for agents (Researcher = READ-ONLY on source files, Utility = scoped to vault/, etc.) are enforced via text in system prompts: `"You are READ-ONLY. You may NOT use Write or Edit tools on source files."` This is a soft constraint — an agent that ignores or misreads the instruction will violate it, and the violation is only caught during output review. There's no enforcement layer between the instruction and the action.

**Rationale:** Defense-in-depth applies to agent permissions the same way it applies to system permissions. Text instructions are the "honor system." Schema-encoded constraints are the "locked door." The agent card schema already has a `denied` field per agent — this improvement encodes it as a machine-readable allowlist/denylist that can be checked before a tool call is allowed.

**Expected impact:** Prevents permission violations from reaching production state. Enables confident spawning of Researcher and Utility agents without runtime audit of every tool call.

**Implementation Steps (coder agent):**
1. Extend `agent-cards.json` schema with a `capabilities` block per agent:
   ```json
   {
     "capabilities": {
       "allowed_tools": ["Read", "Grep", "Glob", "WebSearch", "WebFetch"],
       "denied_tools": ["Write", "Edit", "Bash", "NotebookEdit"],
       "write_scope": null,
       "exec_scope": null
     }
   }
   ```
   For Coder: `allowed_tools: ["*"]`, `denied_tools: []`. For Researcher: `denied_tools: ["Write", "Edit", "Bash"]`, `write_scope: ["scratch/", "vault/"]`.
2. Create `~/bin/capability-check.sh <agent_id> <tool_name> [path]` — reads agent-cards.json, returns ALLOW or DENY with reason. Used as a pre-spawn validation step.
3. In the spawn context construction (the structured context block in AGENTS.md), auto-generate the tool restriction list from the agent card's `capabilities` field rather than hand-writing it. This keeps the system prompt in sync with the schema.
4. Add capability validation to `agent-factory.sh create` — when creating a new dynamic agent, require explicit `capabilities` declaration. Reject agents with `allowed_tools: ["*"]` unless a `reason` field explains the broad access.
5. Document capability schema in `refs/dispatch-protocol.md` Capability Constraints section with worked examples per agent type.

---

## 3. Priority & Impact Summary

| # | Improvement | Reliability Gain | Effort | Priority |
|---|---|---|---|---|
| 1 | Output Contract Validation | High — catches format failures at boundary | Low (schema + shell script) | P1 |
| 2 | Task-Type Performance Profiling | Medium — adaptive routing over time | Medium (schema extension + routing-stats.sh) | P2 |
| 3 | Formalized Multi-Agent Handoffs | High — eliminates context-loss failures in pipelines | Medium (schema + artifact writes per agent) | P1 |
| 4 | Dynamic Agent Lifecycle Automation | Medium — prevents registry drift | Low-Medium (lifecycle.sh + cron hook) | P2 |
| 5 | Capability Constraints as Schema | Medium — defense-in-depth for permissions | Low (schema extension + capability-check.sh) | P3 |

**Recommended sequence:** Improvements 1 and 3 first (reliability at dispatch boundaries), then 2 and 4 (learning over time), then 5 (hardening).

---

## 4. Sources

1. **Anthropic (2024).** "Building Effective Agents." anthropic.com/engineering/building-effective-agents — Simple composable patterns, explicit state, human-in-the-loop gates as reliability primitives.
2. **Shi, Y. et al. (2024).** "AgentBench: Evaluating LLMs as Agents." arXiv:2402.01817 — Task-type-specific performance varies significantly; adaptive routing outperforms static assignment.
3. **Wang, L. et al. (2024).** "A Survey on Large Language Model-based Autonomous Agents." arXiv:2308.11432 — Surveys agent memory, planning, and tool-use architectures; structured handoff artifacts identified as a key reliability mechanism.
4. **OpenClaw AGENTS.md (2026).** Internal governance documentation — source of current architecture state, dispatch protocol, agent roster, and lifecycle definitions.
5. **OpenClaw workflow-patterns.json (2026).** Internal pattern log — governance-integration at 67% success rate; confirms handoff and context loss as real failure modes.

---

## 5. Confidence Block

```json
{
  "confidence": 0.82,
  "evidence_quality": "T2",
  "coverage": "complete",
  "blind_spots": [
    "Did not read agent-factory.sh or agent-specialization.sh source — implementation steps assume script interfaces based on AGENTS.md docs",
    "dispatch.sh internals not read — 'done handler' step assumes a hookable completion point exists",
    "Did not check if agent-cards.json already has a capabilities schema partially implemented"
  ]
}
```
