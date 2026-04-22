---
title: "MCP Server"
created: 2026-04-01
type: codebase
status: shipped
stack: [python, fastapi]
host: agent-vm
path: ~/mcp-server/
category: agent-infra
tags: [codebase, mcp, api, tools, agent-endpoint]
summary: "MCP endpoint exposing 10 tools for external agent access. Vault search, dispatch queue, web search/fetch, system health, pipeline stats."
related: [OpenClaw Agent System, Intelligence Layer]
---

# MCP Server

HTTP MCP endpoint at `http://0.0.0.0:8899` exposing agent VM tools to external systems.

## Tools (10)

| Tool | Description |
|---|---|
| `vault_search` | Semantic search over the wiki |
| `dispatch_queue` | List pending/active/done tasks |
| `dispatch_submit` | Submit new tasks |
| `agent_status` | Running agents, session health |
| `web_search` | SearXNG meta-search |
| `web_fetch` | URL content extraction |
| `pipeline_stats` | Research pipeline statistics |
| `pipeline_task` | Task detail lookup |
| `read_file` | Read VM filesystem |
| `system_health` | Disk, memory, load, services |

## Service

- **systemd:** `mcp-server.service`
- **Port:** 8899
- **Status:** ✅ Active

## Related

- [[OpenClaw Agent System]] — Parent system
- [[EMA]] — Future consumer of this endpoint
