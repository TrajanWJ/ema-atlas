---
title: "OpenClaw MCP Server"
type: reference
created: 2026-04-06
tags: [openclaw, archived, mcp, api, tools]
summary: "OpenClaw MCP server documentation - exposed 15 tools for messaging, sessions, scheduling, nodes, web, memory, TTS"
---

# OpenClaw MCP Server

MCP server that exposed OpenClaw Gateway tools to Claude Code and other MCP-compatible clients. Built in Node.js, connected to the Gateway via HTTP at `http://127.0.0.1:18789`.

**Author:** Helms AI | **License:** MIT

## Available Tools (15)

### Messaging
- **openclaw_message_send** -- Send to Telegram, WhatsApp, Discord, Slack, Signal, iMessage, Google Chat
- **openclaw_message_broadcast** -- Broadcast to multiple targets across platforms

### Sessions
- **openclaw_sessions_list** -- List active sessions with optional filtering by kind, activity window
- **openclaw_sessions_history** -- Fetch complete message history for a session (with tool calls)
- **openclaw_sessions_send** -- Send message to another active session (inter-agent communication)
- **openclaw_sessions_spawn** -- Spawn background sub-agent in isolated session

### Scheduling
- **openclaw_cron_list** -- List all scheduled jobs
- **openclaw_cron_add** -- Create new scheduled job
- **openclaw_cron_remove** -- Delete a job
- **openclaw_cron_run** -- Trigger immediate execution

### Nodes (Paired Devices)
- **openclaw_nodes_status** -- Device status (battery, capabilities, online state)
- **openclaw_nodes_notify** -- Push notifications with priority levels
- **openclaw_nodes_camera_snap** -- Capture photos from device cameras
- **openclaw_nodes_location** -- Get device location with accuracy control
- **openclaw_nodes_run** -- Execute commands on remote devices

### Web
- **openclaw_web_search** -- Brave Search API with freshness filtering
- **openclaw_web_fetch** -- Extract readable content from URLs (markdown/text)

### Utilities
- **openclaw_gateway_status** -- Session and gateway status
- **openclaw_gateway_config_get** -- Retrieve gateway configuration
- **openclaw_tts** -- Text-to-speech conversion
- **openclaw_memory_search** -- Semantic search across memory files

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCLAW_GATEWAY_URL` | Gateway HTTP URL | `http://127.0.0.1:18789` |
| `OPENCLAW_GATEWAY_TOKEN` | Auth token | (none) |

## Client Setup

Supported Claude Desktop, Claude Code CLI, Zed Editor, Cline (VSCode), Windsurf, and any generic MCP client. All used the standard pattern:

```json
{
  "command": "node",
  "args": ["/path/to/openclaw-mcp-server/dist/index.js"],
  "env": { "OPENCLAW_GATEWAY_TOKEN": "token" }
}
```

## Related

- [[OpenClaw System Overview]]
- [[OpenClaw Control UI Architecture]]
