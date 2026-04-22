---
title: "MCP Resources Reference"
space: wiki
tags: ["tools","mcp","reference","resources"]
source: manual
---

# MCP Resources Reference

Read-only context resources exposed by the EMA MCP server. Source: `daemon/lib/ema/mcp/resources.ex`.

Resources let MCP clients (Claude Code) understand EMA's current state without taking action. All resources return JSON with a 30s timeout. On failure, they return a degraded response (`degraded: true` with a message) rather than erroring.

---

## ema://context/operator

**Name:** Operator Context

Canonical operator context package assembled by host EMA. Contains user profile, system state, active projects summary.

**API:** `GET /api/context/operator/package`

**Usage:**
```
Read ema://context/operator
```

---

## ema://context/project

**Name:** Project Context Package

Canonical project context package. Requires a query parameter to identify the project.

**API:** `GET /api/context/project/:id/package` (resolves ID from slug/name via `/api/projects`)

**Usage:**
```
Read ema://context/project?id=ema
Read ema://context/project?id=proslync
```

Returns error if `id` parameter is missing or project not found.

---

## ema://projects/active

**Name:** Active Projects

All active EMA projects with their goals, tasks, and recent activity.

**API:** `GET /api/projects?status=active&include_context=true`

**Usage:**
```
Read ema://projects/active
```

---

## ema://tasks/pending

**Name:** Pending Tasks

Tasks that are blocked or waiting for action, enriched with project and goal context.

**API:** `GET /api/tasks?status=pending,blocked&include_context=true`

**Usage:**
```
Read ema://tasks/pending
```

---

## ema://proposals/recent

**Name:** Recent Approved Proposals

The last 5 approved proposals. Useful as quality examples when generating new proposals.

**API:** `GET /api/proposals?status=approved&limit=5&order=desc`

**Usage:**
```
Read ema://proposals/recent
```

---

## ema://bootstrap/status

**Name:** Bootstrap Status

Onboarding, provider, CLI tool, and active-use readiness for EMA. Shows what services are healthy and what tools are detected.

**API:** `GET /api/onboarding/status`

**Usage:**
```
Read ema://bootstrap/status
```

---

## ema://focus/current

**Name:** Current Focus State

Current focus session and timer state. Returns the active session (if any) with elapsed time, phase, and linked task.

**API:** `GET /api/focus`

**Usage:**
```
Read ema://focus/current
```

---

## ema://vault/search

**Name:** Vault Search

Semantic search over the EMA knowledge vault. Requires a query parameter.

**API:** `GET /api/vectors/query?q=...&k=5`

**Usage:**
```
Read ema://vault/search?q=auth+architecture
Read ema://vault/search?q=intent+engine+design
```

Returns error message if `q` parameter is missing.

---

## ema://intents/active

**Name:** Active Intents

Active intents from the Intent Engine with context. Represents the current semantic truth of what is in progress.

**API:** `GET /api/intents?status=active&limit=20`

**Usage:**
```
Read ema://intents/active
```

---

## ema://intents/tree

**Name:** Intent Tree

Full intent hierarchy as a nested tree. Each node contains its children recursively. Optionally filter by project.

**API:** `GET /api/intents/tree` or `GET /api/intents/tree?project_id=X`

**Usage:**
```
Read ema://intents/tree
Read ema://intents/tree?project_id=abc123
```

---

## Response Format

All resources return this structure:

```json
{
  "contents": [
    {
      "uri": "ema://resource-name",
      "mimeType": "application/json",
      "text": "{\"resource\": \"name\", \"data\": {...}, \"fetched_at\": \"2026-04-06T...\"}"
    }
  ]
}
```

On failure, the `text` field contains:

```json
{
  "resource": "name",
  "degraded": true,
  "message": "EMA API returned HTTP 500",
  "data": [],
  "fetched_at": "2026-04-06T..."
}
```

## Related

- [[MCP-Tools-Reference]]
- [[Claude Code Setup]]
