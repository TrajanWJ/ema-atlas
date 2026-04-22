---
title: Laminar
created: '2026-03-14'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - github
  - mcp
  - openclaw
  - ops
  - research
  - security
summary: >-
  Open-source observability platform purpose-built for AI agents. Written in
  Rust for performance. OpenTelemetry-native tracing with 1-line instrumentat
wiki_id: research/Tools/Laminar
imported_from: vault/Research/Tools/Laminar.md
imported_at: '2026-04-04T00:23:57.133Z'
---
# Laminar

**Source:** https://github.com/lmnr-ai/lmnr (~2,700 stars)
**Category:** AI Agent Observability / Tracing
**Date:** 2026-03-14
**Status:** Installed & Running

## What It Does
Open-source observability platform purpose-built for AI agents. Written in Rust for performance. OpenTelemetry-native tracing with 1-line instrumentation for OpenAI, Anthropic, LangChain, Vercel AI SDK. Includes evals SDK, "Signals" (natural language monitoring rules), SQL editor over trace data, custom dashboards, data annotation tools.

## Relevance
- Self-hosted via systemd at `http://localhost:5667`
- Can instrument Claude Code sessions and [[OpenClaw]] agent runs
- Token usage tracking, latency monitoring, error analysis
- OTel compatible — plays nice with everything
- Rust backend = fast

## Installation
```bash
cd /home/trajan/lmnr
docker compose up -d
```
- UI: http://localhost:5667
- API: ports 8000-8002
- Postgres: port 5433
- Quickwit search: ports 7280-7281

## Pros
- Purpose-built for AI agents, not general APM
- OpenTelemetry native — standard tracing format
- Self-hostable, no vendor lock-in
- Rust backend — extremely fast
- Built-in SQL editor for querying trace data
- YC S24 backed, active development

## Cons
- systemd Compose pulls several containers (Postgres, Clickhouse, Quickwit, etc.)
- Signals/monitoring requires Google Gemini API key
- SDK integration needed per-project — not drop-in for existing [[OpenClaw]] flows
- Still relatively young project

## Notes
- Uses Quickwit for full-text search over spans
- Frontend on port 5667, app-server on 8000-8002
- For production, use systemctl-full.yml (includes RabbitMQ)

## Related

- [[vm-audit-2026-03-16]]
- [[security-audit-2026-03-16]]
- [[loose-ends]]
- [[5-day-analysis-2026-03-18]]
- [[My Stack Decisions]]
- [[security]]
- Decisions
- [[2026-03-16]]
- [[System Services]]
- [[System Setup]]
