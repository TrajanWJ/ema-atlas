# Intent Schema v1

**Status:** Minimal live bootstrap schema
**Goal:** Provide a stable, explicit coordination object for projects and active work.

---

## IntentRecord

```json
{
  "intent_id": "int_host_cli_integration",
  "project_id": "proj_ema",
  "slug": "host-cli-integration",
  "title": "Host CLI integration",
  "kind": "project-focus",
  "status": "active",
  "priority": "high",
  "current_focus": "Prepare live MCP bootstrap for intents engine",
  "summary": "Canonical coordination object for host CLI integration work.",
  "objectives": [
    {
      "id": "obj_context_authority",
      "title": "Make EMA the canonical context authority",
      "status": "active"
    }
  ],
  "blockers": [
    {
      "id": "blk_split_brain",
      "title": "Session/context truth fragmented across multiple systems",
      "severity": "high",
      "status": "open"
    }
  ],
  "next_actions": [
    {
      "id": "act_write_arch_doc",
      "title": "Write canonical architecture doc",
      "status": "pending"
    }
  ],
  "linked_refs": {
    "wiki_pages": [],
    "session_ids": [],
    "proposal_ids": [],
    "execution_ids": [],
    "task_ids": []
  },
  "source": {
    "created_by": "operator",
    "created_via": "mcp",
    "bootstrap_mode": "live"
  },
  "timestamps": {
    "created_at": "2026-04-06T20:45:00Z",
    "updated_at": "2026-04-06T20:45:00Z",
    "last_progress_at": "2026-04-06T20:45:00Z"
  }
}
```

---

## Required fields
- `intent_id`
- `project_id`
- `slug`
- `title`
- `kind`
- `status`
- `current_focus`
- `objectives`
- `blockers`
- `next_actions`
- `linked_refs`
- `timestamps`

---

## Enums

### kind
- `project-root`
- `project-focus`
- `migration`
- `investigation`
- `integration`
- `maintenance`

### status
- `draft`
- `active`
- `blocked`
- `paused`
- `completed`
- `cancelled`

### priority
- `low`
- `normal`
- `high`
- `urgent`

### objective.status
- `pending`
- `active`
- `blocked`
- `done`

### blocker.severity
- `low`
- `medium`
- `high`
- `critical`

### blocker.status
- `open`
- `mitigating`
- `resolved`

### next_action.status
- `pending`
- `active`
- `done`

---

## ProjectStateRecord

```json
{
  "project_id": "proj_ema",
  "slug": "ema",
  "title": "EMA",
  "status": "active",
  "current_focus_intent_id": "int_host_cli_integration",
  "primary_goal": "Establish EMA as canonical context/session/control spine.",
  "active_intent_ids": [],
  "blockers": [],
  "recent_decisions": [],
  "next_actions": [],
  "linked_refs": {
    "wiki_pages": [],
    "session_ids": [],
    "execution_ids": [],
    "proposal_ids": []
  },
  "timestamps": {
    "updated_at": "2026-04-06T20:45:00Z"
  }
}
```

---

## Seed intents
Recommended initial root intents:
- `int_ema_root`
- `int_host_cli_integration`
- `int_session_normalization`
- `int_mcp_baseline`
- `int_wiki_buildout`
- `int_vault_deprecation`
- `int_openclaw_surface_alignment`
- `int_codex_parity`

---

## v1 design rules
- Keep schema small and explicit
- Prefer stable links over rich ontology
- Intent must be editable by operator workflows
- Intent must link to wiki and execution state
- Avoid premature hierarchy depth
