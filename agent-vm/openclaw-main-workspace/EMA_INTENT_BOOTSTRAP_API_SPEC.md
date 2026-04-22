# EMA Intent Bootstrap API Spec

**Status:** Draft v1 API contract
**Goal:** Define the first read-first and bootstrap endpoints for intent/project-state/context normalization in EMA.

---

## 1. Design principles

1. Read-first before write-heavy orchestration.
2. Extend current EMA control-plane instead of introducing a parallel API family.
3. Keep payloads small, explicit, and provenance-aware.
4. Make MCP a thin projection of these endpoints.
5. Preserve compatibility with existing `context_for` during transition.

---

## 2. Base paths

### Control-plane project/intents
- `GET /api/control-plane/projects/:project/state`
- `POST /api/control-plane/projects/:project/bootstrap`
- `GET /api/control-plane/projects/:project/intents`
- `POST /api/control-plane/intents/:id/update`
- `GET /api/control-plane/projects/:project/intent-snapshot`

### Context packages
- `GET /api/context/project/:project/package`
- `GET /api/context/operator/package`
- `GET /api/context/project/:project/session-evidence`

---

## 3. Read-first endpoints

### `GET /api/control-plane/projects/:project/state`
Return canonical project-state record.

#### Response
```json
{
  "project": {
    "project_id": "proj_ema",
    "slug": "ema",
    "title": "EMA",
    "status": "active",
    "current_focus_intent_id": "int_host_cli_integration",
    "primary_goal": "Establish EMA as canonical context/session/control spine.",
    "active_intent_ids": ["int_host_cli_integration"],
    "blockers": ["split session truth"],
    "recent_decisions": [],
    "next_actions": [],
    "linked_refs": {
      "wiki_pages": [],
      "session_ids": [],
      "execution_ids": [],
      "proposal_ids": []
    },
    "timestamps": {
      "updated_at": "2026-04-06T20:58:00Z"
    }
  }
}
```

---

### `GET /api/control-plane/projects/:project/intents`
List intent records for a project.

#### Query params
- `status` optional
- `kind` optional
- `limit` optional

#### Response
```json
{
  "project": "ema",
  "intents": []
}
```

---

### `GET /api/control-plane/projects/:project/intent-snapshot`
Return compact operator-facing summary.

#### Response
```json
{
  "project": "ema",
  "focus": "Host CLI integration",
  "active": 4,
  "blocked": 1,
  "top_blockers": ["split session truth"],
  "next_actions": [
    "write canonical architecture doc",
    "expose context package endpoints"
  ]
}
```

---

### `GET /api/context/project/:project/package`
Return bounded shared context package.

#### Query params
- `budget` = `small|medium|large`
- `include` repeatable or comma-separated

#### Response
```json
{
  "summary": "EMA project is focused on host CLI integration and intent bootstrapping.",
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

### `GET /api/context/operator/package`
Return top-level operator package spanning current priorities.

#### Query params
- `budget`
- `limit_projects`
- `limit_intents`

#### Response
```json
{
  "summary": "EMA and related host CLI integration work are currently the top active priorities.",
  "active_projects": [],
  "top_intents": [],
  "blockers": [],
  "next_actions": [],
  "sources": []
}
```

---

### `GET /api/context/project/:project/session-evidence`
Return bounded session-derived evidence for a project.

#### Query params
- `limit`
- `provider`

#### Response
```json
{
  "project": "ema",
  "sessions": [],
  "derived_decisions": [],
  "open_loops": [],
  "sources": []
}
```

---

## 4. Bootstrap/write endpoints

### `POST /api/control-plane/projects/:project/bootstrap`
Idempotently create project-state and initial intents.

#### Request
```json
{
  "title": "EMA",
  "seed_intents": [
    "host-cli-integration",
    "session-normalization",
    "mcp-baseline",
    "wiki-buildout",
    "vault-deprecation"
  ],
  "operator": "trajan"
}
```

#### Response
```json
{
  "project": {},
  "created_intents": [],
  "existing_intents": []
}
```

---

### `POST /api/control-plane/intents/:id/update`
Patch canonical intent state.

#### Request
```json
{
  "patch": {
    "status": "active",
    "current_focus": "Prepare live MCP bootstrap for intents engine",
    "next_actions": [
      {
        "id": "act_seed_intents",
        "title": "Seed root intents in EMA",
        "status": "pending"
      }
    ]
  },
  "operator": "trajan"
}
```

#### Response
```json
{
  "intent": {}
}
```

---

## 5. Error shape

All new endpoints should use a stable error body:

```json
{
  "error": "bad_request",
  "message": "human-readable message"
}
```

Recommended error values:
- `not_found`
- `bad_request`
- `invalid_patch`
- `bootstrap_conflict`
- `unsupported_budget`

---

## 6. MCP projection mapping

These endpoints project directly to:
- `intent.get_project`
- `intent.list`
- `intent.snapshot`
- `intent.bootstrap_project`
- `intent.update`
- `context.project_package`
- `context.operator_package`
- `context.session_evidence`

---

## 7. First implementation target

Implement in this order:
1. `GET /api/control-plane/projects/:project/state`
2. `GET /api/control-plane/projects/:project/intents`
3. `GET /api/control-plane/projects/:project/intent-snapshot`
4. `GET /api/context/project/:project/package`
5. `POST /api/control-plane/projects/:project/bootstrap`
6. `POST /api/control-plane/intents/:id/update`

This provides a usable read-first and bootstrap-capable v1.
