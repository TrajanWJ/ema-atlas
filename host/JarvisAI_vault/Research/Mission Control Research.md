# Mission Control Research

> Open-source dashboard for AI agent orchestration. Centralized web UI for managing agent fleets, tasks, tokens, and workflows.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [builderz-labs/mission-control](https://github.com/builderz-labs/mission-control) |
| **Stars** | 2,349 |
| **Version** | v2.0.0 (Mar 11, 2026) |
| **License** | MIT |
| **Stack** | Next.js 16, React 19, TypeScript 5.7, SQLite |
| **Docker** | Yes (multi-stage Dockerfile + hardened docker-compose) |
| **Created** | 2026-02-13 |

## What It Does

- 32 feature panels: tasks, agents, skills, logs, tokens, memory, security, cron, alerts, webhooks, pipelines
- Kanban task board with drag-and-drop, priorities, threaded comments
- Quality gates ("Aegis" review system) requiring sign-off
- Natural language scheduling (e.g., "every 2 hours" -> cron)
- Auto-discovery of local Claude Code sessions from `~/.claude/projects/`
- Multi-gateway support for connecting to multiple agent systems
- Framework adapters: CrewAI, LangGraph, AutoGen, Claude SDK, OpenClaw
- Token usage and cost monitoring
- Real-time via WebSocket + Server-Sent Events

## Zero External Dependencies

No Redis, Postgres, or message queue required. SQLite (WAL mode) via better-sqlite3 handles everything.

## Docker Setup

```bash
# Automated:
bash install.sh --docker

# Manual:
docker build -t mission-control .
docker run -p 3000:3000 -v mission-control-data:/app/.data \
  -e AUTH_USER=admin -e AUTH_PASS=your-secure-password \
  -e API_KEY=your-api-key mission-control
```

SQLite data persists in `/app/.data/` (mount a volume).

### Docker Security (default docker-compose)

- `read_only: true` filesystem
- `cap_drop: ALL` (only `NET_BIND_SERVICE` added back)
- `no-new-privileges`
- 512MB memory limit, 1 CPU limit, PID limit 256
- Dedicated bridge network
- Hardened overlay available: `docker-compose.hardened.yml` (log rotation, strict cookies, HSTS, internal-only network)

## Requirements

- Docker (containerized) or Node.js 22+ (native)
- Native build tools for better-sqlite3: `python3`, `make`, `g++`
- 512MB RAM, 1 CPU core (Docker defaults)
- Port 3005 (native) or 3000 (Docker), configurable

## Security Features

- Role-based access: viewer, operator, admin
- Session + API key authentication
- Trusted reverse proxy / header auth
- `__Host-` cookie prefix for secure contexts
- Content Security Policy with per-request nonces
- Webhook signature verification (HMAC-SHA256)
- Prompt injection detection
- Credential leak detection + agent trust scoring
- Secret scanning across agent communications
- Three strictness profiles: minimal, standard, strict
- `MC_ALLOWED_HOSTS` for origin restriction

## Gotchas

- **Alpha software** — APIs and schemas may change between releases
- SQLite single-writer limitation — one instance per data directory only
- Gateway WebSocket needs HTTPS in production (WebCrypto requirement)
- Non-standard ports often blocked on VPS — reverse-proxy through 443
- 5 releases in 2 weeks — rapid breaking changes expected
- Native build requires `python3 + make + g++` for better-sqlite3 compilation

## Alternatives

| Tool | Type | Differentiator |
|---|---|---|
| **CrewAI** | Agent framework + dashboard | Role-based multi-agent; 44K+ stars |
| **LangGraph + LangSmith** | Orchestration + observability | Graph-based agent design with monitoring |
| **Dify** | Low-code agent platform | Visual workflow builder with LLMOps |
| **Langflow** | Visual builder | Canvas for multi-agent and RAG workflows |
| **AutoGen** (Microsoft) | Multi-agent framework | Conversational agents with code execution |

Mission Control differentiates as a **management dashboard/control plane** that sits above agent frameworks, not a framework itself.

## Evaluation Notes (2026-03-12)

**Pros:** Excellent Docker security defaults out of the box, zero external dependencies (SQLite only), comprehensive monitoring and task management, Claude Code session auto-discovery, active development with daily commits.

**Cons:** Very young project (1 month old), alpha stability, rapid breaking changes, single-writer SQLite limits scaling, small community compared to alternatives.

**Verdict:** Strong candidate for Docker deployment. The hardened Docker compose is production-ready. Complements [[OpenClaw Research]] as an orchestration layer. Wait for v2.x to stabilize before relying on it for critical workflows.

## See Also

- [[Setup Log]] — current setup history (Mission Control is a potential upgrade/replacement)
- [[OpenClaw Research]] — AI assistant it can orchestrate
- [[Self-Hosted AI Agent Platforms 2026]] — comparison of all options

#agent-orchestration #self-hosted #docker #evaluated #jarvisai
