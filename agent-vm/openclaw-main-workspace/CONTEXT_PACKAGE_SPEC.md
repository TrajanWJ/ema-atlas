# Context Package Spec v1

**Status:** Canonical shared-context contract
**Goal:** Provide one bounded context API for CLI, MCP, OpenClaw, Claude, Codex, and future surfaces.

---

## Core rule

EMA assembles bounded context packages.

Clients consume them.

Clients should not construct large cross-surface prompt bundles independently.

---

## Source precedence

1. live EMA host/runtime truth
2. durable Wiki semantic memory
3. EMA project/task/proposal/execution state
4. EMA-normalized session evidence
5. local chat/session context

---

## Request shape

```json
{
  "subject": {
    "kind": "project",
    "id": "proj_ema"
  },
  "consumer": "mcp",
  "budget": "medium",
  "include": [
    "host_truth",
    "wiki",
    "project_state",
    "intents",
    "executions",
    "sessions"
  ],
  "limits": {
    "max_sessions": 10,
    "max_executions": 10,
    "max_wiki_refs": 8
  }
}
```

---

## Response shape

```json
{
  "summary": "EMA project is currently focused on host CLI integration and intent bootstrapping.",
  "host_truth": {},
  "wiki": {},
  "project_state": {},
  "intents": [],
  "tasks": [],
  "proposals": [],
  "executions": [],
  "sessions": [],
  "operator_notes": [],
  "sources": []
}
```

---

## Required top-level sections
- `summary`
- `host_truth`
- `wiki`
- `project_state`
- `intents`
- `sources`

Optional:
- `tasks`
- `proposals`
- `executions`
- `sessions`
- `operator_notes`

---

## Source object

```json
{
  "kind": "wiki_page",
  "id": "wiki:projects/EMA",
  "title": "EMA",
  "confidence": "high",
  "updated_at": "2026-04-06T20:45:00Z"
}
```

### source.kind
- `host_truth`
- `wiki_page`
- `project_state`
- `intent`
- `task`
- `proposal`
- `execution`
- `session`
- `operator_note`

### confidence
- `high`
- `medium`
- `low`

---

## Package types

### `context.project_package`
For project continuation and recovery.

### `context.operator_package`
For top-level operator visibility across projects/intents.

### `context.session_evidence`
For bounded historical evidence and session-derived decisions.

---

## v1 rules
- Prefer summaries + links over raw transcript dumps
- Include provenance in `sources`
- Obey budget/limit constraints
- Keep output deterministic enough for repeated use
