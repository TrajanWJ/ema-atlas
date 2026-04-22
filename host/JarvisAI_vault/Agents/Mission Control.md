# Mission Control

## Overview

Mission Control is an orchestration dashboard for managing AI agent fleets. It provides a web-based UI with 32 feature panels for monitoring, scheduling, and controlling agents across multiple frameworks.

## Quick Info

| Property | Value |
|---|---|
| Container | mission-control |
| Port | 3000 (published to 192.168.122.10) |
| URL (from workstation) | http://192.168.122.10:3000 |
| URL (inside VM) | http://localhost:3000 |
| Memory | 1 GB limit |
| CPUs | 1 |
| Data Volume | mc-data (/app/.data) |
| Database | SQLite (in mc-data volume) |
| Filesystem | read_only: true |

## Authentication

| Setting | Value |
|---|---|
| Default user | admin (AUTH_USER env var) |
| Password | Set via AUTH_PASS env var |
| API Key | Set via API_KEY env var |
| Roles | viewer, operator, admin |
| Cookie | MC_COOKIE_SECURE=0 (HTTP), MC_COOKIE_SAMESITE=strict |
| Allowed hosts | localhost, 192.168.122.10 (MC_ALLOWED_HOSTS) |

## Features (32 Panels)

Key capabilities include:

- **Kanban task board** — visual task management for agent workflows
- **Token monitoring** — track API token usage and costs across agents
- **Quality gates** — set pass/fail criteria for agent outputs
- **Natural language scheduling** — schedule agent tasks in plain English
- **Agent trust scoring** — track reliability and accuracy per agent
- **Live agent dashboard** — real-time status of all connected agents
- **Conversation history** — browse past agent interactions
- **Skill management** — install, configure, and monitor agent skills

## Framework Adapters

Mission Control integrates with multiple AI agent frameworks:

| Framework | Integration |
|---|---|
| CrewAI | Adapter available |
| LangGraph | Adapter available |
| AutoGen | Adapter available |
| Claude SDK | Adapter available |
| OpenClaw | Native integration |

## Architecture

```
Browser (workstation)
    │
    ▼
Mission Control (:3000)
    │
    ▼ agent-net (Docker DNS)
    │
OpenClaw Gateway (:18789)
    │
    ▼ sandbox-net
    │
Sandbox Containers
```

Mission Control connects to OpenClaw via Docker DNS resolution on agent-net: `openclaw-gateway:18789`.

## Health Check

Mission Control runs `node healthcheck.js` every 30s with 3 retries.

## Related Notes

- [[OpenClaw]] — AI gateway that Mission Control orchestrates
- [[Platforms]] — connected messaging platforms
- [[Configuration/Docker Stack\|Docker Stack]] — compose file and env vars
- [[Architecture/System Overview\|System Overview]] — where Mission Control fits in the stack

#jarvisai #agents #mission-control
