# EMA Shared Context Contract

Generated: 2026-04-06 UTC  
Status: active working contract  
Intent: define one bounded, canonical context package that can be served by host EMA and consumed consistently by CLI, MCP, OpenClaw, and coding harnesses.

## Why this exists

Right now EMA has multiple overlapping context paths:
- project context endpoints
- vault/wiki search
- session artifacts
- tasks/proposals/executions
- OpenClaw memory/session state
- harness-local transcripts

Without one contract, every surface assembles context differently.
That creates drift, token waste, and fake shared memory.

This contract makes host EMA the context assembler and turns all other surfaces into clients.

---

## Core principles

1. **Host EMA assembles context**
   - clients should request context packages, not build giant ad hoc prompt blobs themselves

2. **Wiki/vault knowledge comes first**
   - semantic memory and durable notes outrank transient chat state

3. **Live runtime state is second**
   - tasks, proposals, executions, failures, and host truth come after semantic grounding

4. **Session artifacts are supporting evidence**
   - useful, but not authoritative memory

5. **Every context package is bounded**
   - token-aware by design
   - no unbounded transcript dumping

6. **Every section should preserve provenance**
   - clients must know whether a fact came from:
     - host truth
     - wiki/vault
     - tasks/proposals/executions
     - session artifacts
     - operator notes

---

## Canonical consumers

This contract is for:
- `ema` CLI
- EMA MCP server
- OpenClaw bridge/operator shell
- Claude Code / Codex / Pi / other harnesses
- future babysitter / governor logic

---

## Canonical request model

A client asks for context with a bounded request.

## Request shape

```json
{
  "subject": {
    "kind": "project|task|proposal|execution|session|channel|topic|operator",
    "id": "optional-stable-id",
    "slug": "optional-slug",
    "query": "optional-freeform description"
  },
  "scope": {
    "mode": "brief|standard|deep|operator",
    "max_chars": 12000,
    "max_items_per_section": 10,
    "include_sections": [
      "summary",
      "host_truth",
      "wiki",
      "projects",
      "tasks",
      "proposals",
      "executions",
      "sessions",
      "operator_notes",
      "sources"
    ]
  },
  "filters": {
    "project_id": "optional",
    "project_slug": "optional",
    "status": ["optional"],
    "tags": ["optional"],
    "time_window": "24h|7d|30d|all"
  },
  "consumer": {
    "surface": "cli|mcp|openclaw|harness|api",
    "name": "optional-client-name",
    "budget": "small|medium|large"
  }
}
```

---

## Canonical response model

```json
{
  "contract_version": "v1",
  "subject": {
    "kind": "project",
    "id": "proj_...",
    "slug": "ema",
    "title": "EMA"
  },
  "summary": {
    "one_line": "EMA host degraded; 10 running executions, 14 open proposals, 10 failed executions.",
    "status": "degraded",
    "top_actionable_issue": "Failed executions present: 10",
    "recommended_next_step": "Inspect failed executions before increasing autonomy."
  },
  "host_truth": {},
  "wiki": {},
  "projects": {},
  "tasks": {},
  "proposals": {},
  "executions": {},
  "sessions": {},
  "operator_notes": {},
  "sources": [],
  "budget": {
    "mode": "standard",
    "chars_used_estimate": 6400,
    "truncated": false
  },
  "generated_at": "2026-04-06T00:00:00Z"
}
```

---

## Required sections

### 1. `summary`
Purpose:
- shortest useful operator/agent understanding

Fields:
- `one_line`
- `status`
- `top_actionable_issue`
- `recommended_next_step`

Rules:
- must always exist
- must fit in a very small token budget

### 2. `host_truth`
Purpose:
- real machine/runtime condition

Preferred source:
- `/api/status`
- `/api/surfaces/host-truth`
- `/api/surfaces`

Fields:
- `status`
- `summary`
- `counts`
- `anomalies`
- `queue`
- `observed_at`

Rules:
- this is runtime truth, not semantic memory
- should include only current operationally relevant state

### 3. `wiki`
Purpose:
- durable semantic memory and related knowledge

Preferred source:
- vault/wiki search and graph APIs
- Second Brain / wiki engine outputs

Fields:
- `top_pages`
- `related_pages`
- `facts`
- `decisions`
- `open_questions`
- `graph_hints`

Rules:
- should be project/topic-centered
- facts should be short, attributed, and deduplicated
- this section outranks raw transcript memory

### 4. `projects`
Purpose:
- project-level frame

Source:
- `/api/projects`
- `/api/projects/:id/context` or slug equivalent

Fields:
- `current_project`
- `related_projects`
- `linked_path`
- `project_health`

### 5. `tasks`
Purpose:
- actionable work state

Source:
- `/api/tasks`
- project context endpoint

Fields:
- `priority_items`
- `blocked_items`
- `recent_items`
- `counts_by_status`

Rules:
- prioritize actionable and blocked items over raw recency

### 6. `proposals`
Purpose:
- emerging or approved possible work

Source:
- `/api/proposals`
- project context endpoint

Fields:
- `active`
- `approved`
- `needs_decision`
- `high_confidence`

Rules:
- avoid giant proposal dumps
- default to most actionable proposals only

### 7. `executions`
Purpose:
- live and recently failed execution state

Source:
- `/api/executions`
- host truth queue summary

Fields:
- `running`
- `failed_recent`
- `stale`
- `completion_signals`

Rules:
- failures are more important than completions for operator use

### 8. `sessions`
Purpose:
- recent useful agent/session artifacts

Preferred source:
- EMA session summaries
- harvested session notes in vault/wiki

Fields:
- `recent_relevant`
- `active_sessions`
- `session_takeaways`

Rules:
- summaries only by default
- no raw transcript inclusion unless explicitly requested

### 9. `operator_notes`
Purpose:
- top-level human directives and explicit priorities

Possible sources:
- operator-maintained notes
- pinned control docs
- special EMA/OpenClaw operator memory pages

Fields:
- `priorities`
- `constraints`
- `approvals_needed`
- `active_directives`

### 10. `sources`
Purpose:
- provenance and debuggability

Each source item should include:
- `kind`
- `path_or_endpoint`
- `id`
- `timestamp`
- `confidence`

---

## Source precedence

When information conflicts, prefer in this order:

1. **host runtime truth**
   - `/api/status`
   - `/api/surfaces/host-truth`
   - live tasks/proposals/executions endpoints

2. **durable semantic memory**
   - wiki/vault pages
   - indexed session summaries
   - explicit decisions/docs

3. **project context aggregations**
   - `/api/projects/:id/context`

4. **session artifacts**
   - recent session notes/summaries

5. **chat-local memory / harness-local context**
   - OpenClaw session memory
   - harness transcript snippets

Important:
- semantic memory can outrank older runtime summaries
- but current live status always outranks stale semantic claims about current state

---

## Output budgets

### brief
Use for:
- quick CLI checks
- agent preflight

Target:
- 1.5k–3k chars

Include:
- summary
- host_truth
- one small tasks/proposals slice
- sources

### standard
Use for:
- most operator/harness requests

Target:
- 4k–12k chars

Include:
- summary
- host_truth
- wiki
- tasks
- proposals
- executions
- short session takeaways
- sources

### deep
Use for:
- research/refactor/design sessions

Target:
- 12k–30k chars

Include:
- everything, still bounded

### operator
Use for:
- control lane / babysitter / orchestration

Target:
- 6k–16k chars

Bias toward:
- host truth
- blockers
- failures
- decisions needed
- recommended next actions

---

## Consumer-specific rules

### CLI
- default mode: `brief` or `standard`
- should render:
  - one-line summary
  - top issue
  - counts
  - next step

### MCP
- default mode: `standard`
- should expose:
  - `context.get`
  - `context.project`
  - `context.task`
  - `context.session`
  - `context.operator`

### OpenClaw
- default mode: `operator`
- should bias toward:
  - priorities
  - blockers
  - failures
  - active work
  - minimal noise

### Harnesses
- default mode: `standard`
- should receive:
  - bounded, task-focused context packages
- should not receive:
  - giant raw transcripts by default

---

## Recommended new API endpoints

These should exist on host EMA eventually:

- `POST /api/context/package`
  - generic package builder
- `GET /api/context/project/:slug/package`
- `GET /api/context/task/:id/package`
- `GET /api/context/session/:id/package`
- `GET /api/context/operator/package`

Minimal v1 implementation can be synthetic and reuse:
- `/api/status`
- `/api/surfaces/host-truth`
- `/api/projects`
- `/api/projects/:id/context`
- `/api/tasks`
- `/api/proposals`
- `/api/executions`
- vault/wiki endpoints

---

## Immediate implementation plan

### Phase 1 — synthetic package builder
Assemble the contract from existing host endpoints.

Inputs:
- `/api/status`
- `/api/surfaces/host-truth`
- `/api/projects`
- `/api/projects/:id/context`
- `/api/tasks`
- `/api/proposals`
- `/api/executions`
- vault/wiki search

Output:
- one response matching this contract

### Phase 2 — expose through MCP
Add MCP tools:
- `context.get`
- `context.project`
- `context.operator`

### Phase 3 — wire CLI
Add commands like:
- `ema context project ema`
- `ema context operator`
- `ema context task <id>`

### Phase 4 — wire OpenClaw bridge
Make OpenClaw request context packages instead of assembling ad hoc state from multiple places.

---

## Current real-world seed values from live EMA

As of current host runtime:
- projects endpoint exists
- project context endpoint exists
- status endpoint now exists
- host-truth endpoint now exists
- surfaces endpoint now exists

Observed current host summary:
- status: degraded
- active projects: 2
- pending tasks: 17
- open proposals: 14
- running agents/executions: 10
- failed executions: 10

That is sufficient to start building `context.operator` immediately.

---

## Definition of done

The contract is successful when:
- CLI, MCP, OpenClaw, and harnesses can all request the same kind of package
- host EMA is the assembler for shared context
- wiki/vault knowledge is consistently included
- live host truth is consistently included
- raw transcript dumping is no longer the default way context is shared
- operator requests across machines/surfaces stop feeling like separate memory universes
