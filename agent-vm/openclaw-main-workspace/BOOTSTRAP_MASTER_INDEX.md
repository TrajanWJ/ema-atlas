# Bootstrap Master Index

## Purpose

This is the top-level map for the orchestrator bootstrap lane.
If you are trying to understand the system without re-reading chat history, start here.

---

## Core entrypoints

### Scripts
- `bootstrap/bootstrap-status.sh` — quick status snapshot
- `bootstrap/bootstrap-doctor.sh` — full bootstrap doctor
- `bootstrap/bootstrap-restart.sh` — restart core services
- `bootstrap/sync-mcp-baseline.py` — sync Claude MCP from canonical baseline
- `bootstrap/sync-codex-mcp.py` — sync Codex MCP from canonical baseline
- `bootstrap/ema-doctor.sh` — check EMA observer/tunnel/runtime health

### Canonical manifests
- `bootstrap/mcp-baseline.json` — canonical MCP baseline
- `bootstrap/automation-registry.curated.json` — curated automation registry
- `bootstrap/automation-registry.generated.json` — generated automation registry snapshot

### Registry helpers
- `bootstrap/registry-summary.sh` — summarize registry counts by owner/domain/class/risk
- `AUTOMATION_REGISTRY_GUIDE.md` — how to maintain and extend the registry
- `AUTOMATION_CLEANUP_CANDIDATES_2026-04-06.md` — current cleanup/review candidate list

---

## Bootstrap docs

### Foundation
- `BOOTSTRAP_AUDIT_2026-04-06.md`
- `BOOTSTRAP_RUNBOOK.md`
- `BOOTSTRAP_OWNERSHIP_MAP.md`
- `CRON_SERVICE_CLASSIFICATION_2026-04-06.md`

### Expansion maps
- `EMA_INTEGRATION_MAP_2026-04-06.md`
- `LOG_INDEX_AND_SERVICE_DEPENDENCIES_2026-04-06.md`
- `AGENT_LANE_OWNERSHIP_2026-04-06.md`
- `VAULT_KNOWLEDGE_FLOW_MAP_2026-04-06.md`
- `AUTOMATION_CRON_DEEPER_CLEANUP_2026-04-06.md`
- `DISPATCH_SUBSTRATE_MAP_2026-04-06.md`

---

## Read order

### If you want the 2-minute version
1. `BOOTSTRAP_RUNBOOK.md`
2. `BOOTSTRAP_AUDIT_2026-04-06.md`
3. `bootstrap/bootstrap-doctor.sh`

### If you want to understand runtime ownership
1. `BOOTSTRAP_OWNERSHIP_MAP.md`
2. `AGENT_LANE_OWNERSHIP_2026-04-06.md`
3. `LOG_INDEX_AND_SERVICE_DEPENDENCIES_2026-04-06.md`

### If you want to understand automation
1. `CRON_SERVICE_CLASSIFICATION_2026-04-06.md`
2. `AUTOMATION_CRON_DEEPER_CLEANUP_2026-04-06.md`
3. `bootstrap/automation-registry.generated.json`

### If you want to understand EMA
1. `EMA_INTEGRATION_MAP_2026-04-06.md`
2. `bootstrap/ema-doctor.sh`
3. `LOG_INDEX_AND_SERVICE_DEPENDENCIES_2026-04-06.md`

### If you want to understand knowledge/vault flow
1. `VAULT_KNOWLEDGE_FLOW_MAP_2026-04-06.md`
2. `DISPATCH_SUBSTRATE_MAP_2026-04-06.md`

---

## Current stance

- security hardening is intentionally deferred in this lane pass
- emphasis so far is: inventory, normalize, document, generate a controllable spine

---

## Recommended next mechanical step

Replace generated snapshots and prose-only maps with a machine-readable registry for:
- services
- cron jobs
- scripts
- files written
- risk level
- ownership

That would let the docs become generated views instead of hand-maintained archaeology.
