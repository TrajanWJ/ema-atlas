---
name: agent-os-foundation-repair
description: Complete redesign spec for Agent OS — dispatch.db as single source of truth, OpenClaw integration, WebUI ground truth, proposal engine v2
type: project
---

Agent OS Foundation Repair spec written to ~/docs/specs/2026-03-20-agent-os-foundation-repair-design.md

**Why:** System had disconnected subsystems — dispatch.sh vs OpenClaw gateway, mock data everywhere, fake agent statuses, broken inbox, proposals that never executed, no link between TUI and web UI.

**How to apply:** 6-phase implementation. Phase 1: dispatch.db (SQLite) as single source of truth. Phase 2: bridge API reads from SQLite. Phase 3: OpenClaw gateway hooks into dispatch. Phase 4: WebUI stripped of all mocks, reads only real data. Phase 5: Proposal engine v2 with autonomous dispatch. Phase 6: Documentation + QA.

Key decisions:
- SQLite with WAL replaces all JSON files and JSONL
- Web UI becomes primary interface (replaces TUI for dispatch)
- Zero mock data rule — empty = empty, never fake
- Every item links via task_id to full context chain
- PID verification includes command check (anti-recycling)
- Circuit breaker tracked in agents table
- SSE with Last-Event-ID for reconnection
last_used: 2026-03-20
