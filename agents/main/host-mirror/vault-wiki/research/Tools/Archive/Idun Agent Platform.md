---
title: Idun Agent Platform
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: agent-research
tags:
  - a2a
  - agent-platform
  - governance
  - guardrails
  - mcp
  - self-hosted
summary: >-
  Open-source agent governance platform that turns LangGraph or Google ADK
  agents into production-ready services. Provides a control plane with:
wiki_id: research/Tools/Archive/Idun_Agent_Platform
imported_from: vault/Research/Tools/Archive/Idun Agent Platform.md
imported_at: '2026-04-04T00:23:57.124Z'
---
# Idun Agent Platform

**Source:** https://github.com/Idun-Group/idun-agent-platform
**Category:** Agent Governance / Platform
**Date:** 2026-03-14
**Status:** Discovered
**Stars:** 111 ⭐
**License:** GPL-3.0
**Language:** TypeScript + Python

## What It Does

Open-source agent governance platform that turns LangGraph or Google ADK agents into production-ready services. Provides a control plane with:

- **Standardized API** via AG-UI and CopilotKit-compatible endpoints
- **Observability** via OpenTelemetry, Langfuse, Arize Phoenix, LangSmith, GCP Trace
- **Memory/session persistence** with in-memory, SQLite, or PostgreSQL backends
- **Guardrails** for PII detection, prompt injection defense, topic restrictions, allowlists/blocklists
- **MCP tool control** — restrict agents to approved MCP tool sets
- **Access control** with SSO-based auth and RBAC
- **A2A protocol** support for agent-to-agent communication

## Architecture

Three-tier: Engine (wraps agents into FastAPI) → Manager (config CRUD, auth, policy) → UI (Next.js admin dashboard). Agents fetch signed configs from Manager.

## Relevance

- Directly relevant to Trajan's MCP server ecosystem and agent governance interests
- Guardrails layer complements existing Lasso prompt injection hooks
- MCP tool control could help manage which MCP servers agents can access
- A2A protocol support aligns with future agent interop direction
- Self-hosted, sovereign design matches Trajan's self-hosted stack philosophy

## Pros

- Comprehensive governance: SSO, RBAC, guardrails, MCP control in one package
- Standards-based: AG-UI, A2A, OpenTelemetry, MCP — no vendor lock-in
- Active development (pushed daily, updated March 13 2026)
- systemd Compose setup for quick local deployment
- CLI for interactive agent configuration (`idun init`)

## Cons

- GPL-3.0 license (copyleft — limits commercial derivative works)
- Early stage (111 stars, small community)
- Requires systemd + PostgreSQL for full Manager mode
- Focused on LangGraph/ADK — no direct Claude Code or [[OpenClaw]] integration
- Telemetry enabled by default (can be disabled)

## Install

```bash
git clone https://github.com/Idun-Group/idun-agent-platform.git
cd idun-agent-platform
cp .env.example .env
docker compose -f systemctl.dev.yml up --build
# Or standalone engine: pip install idun-agent-engine && idun init
```

#agent-platform #governance #mcp #a2a #guardrails #self-hosted

## Related

- [[Idun Agent Platform]]
