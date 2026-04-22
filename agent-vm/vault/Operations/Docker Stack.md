---
title: "Docker Stack"
created: 2026-03-14
updated: 2026-04-15
type: operations
status: active
confidence: 0.85
confidence_updated: 2026-04-15
source: operations
tags: [agent-vm, configuration, docker]
summary: "Current Docker container inventory and resource allocation on agent VM"
---
# Docker Stack

> Last verified: 2026-04-15 against `docker ps` output.

## Current Running Containers

| Container | Image | Status | Ports | Purpose |
|---|---|---|---|---|
| searxng | searxng/searxng:latest | Up | 127.0.0.1:8889→8080 | Privacy-respecting metasearch engine |
| activepieces | activepieces/activepieces:latest | Up | 0.0.0.0:8180→80 | Workflow automation platform |
| activepieces-redis | redis:7-alpine | Up | 6379 (internal) | Activepieces cache/queue backend |
| activepieces-postgres | postgres:16-alpine | Up | 5432 (internal) | Activepieces database |
| antfly | ghcr.io/antflydb/antfly:omni | Up (healthy) | 127.0.0.1:8080→8080, 127.0.0.1:12380→12380 | Vault search/embedding engine |

## Volumes

| Volume | Container | Purpose |
|---|---|---|
| activepieces_postgres_data | activepieces-postgres | Persistent database storage |
| activepieces_redis_data | activepieces-redis | Redis persistence |
| antfly-data | antfly | Search index and embedding data |

## Historical: OpenClaw Gateway (Removed)

The original Docker stack ran an OpenClaw gateway with docker-socket-proxy for sandboxed agent execution. This was replaced by:
- **Claude Code CLI** (`/usr/bin/claude`) — direct AI coding agent
- **OpenClaw CLI** (`/usr/bin/openclaw`) — still installed for Discord bot
- **Dispatch engine** (EMA v5) — cron-based task scheduling via `~/bin/` scripts

The docker-socket-proxy and openclaw-gateway containers are no longer deployed.

## Related Notes

- [[Architecture/System Overview|System Overview]] — architecture diagram
- [[Networking]] — firewall rules and port mapping
- [[Security/Hardening|Hardening]] — security settings explained

#agent-vm #configuration #docker
- [[project_obsidian_vault]]
