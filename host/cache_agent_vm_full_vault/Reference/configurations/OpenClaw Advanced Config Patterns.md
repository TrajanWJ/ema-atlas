---
title: "OpenClaw Advanced Config Patterns"
created: 2026-03-14
updated: 2026-03-14
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: reference
tags: [configuration, openclaw, patterns, reference]
summary: "Automatically saves important context before compaction clears old messages:"
---
# OpenClaw Advanced Config Patterns

> Reference configurations and patterns discovered from [[OpenClaw]] docs and community.

## Memory Optimization

### Memory Flush on Compaction
Automatically saves important context before compaction clears old messages:
```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "mode": "safeguard",
        "memoryFlush": {
          "enabled": true,
          "softThresholdTokens": 4000
        }
      }
    }
  }
}
```

### Session Memory Search
Search across past sessions for context:
```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "enabled": true,
        "sources": ["memory", "sessions"],
        "experimental": {
          "sessionMemory": true
        }
      }
    }
  }
}
```

## Automation Patterns

### Cron Schedules
```
# One-shot reminder
cron add --schedule "at 2026-03-15T09:00" --task "Remind about meeting"

# Every interval
cron add --schedule "every 4h" --task "Check system health"

# Crontab syntax
cron add --schedule "0 9 * * MON" --task "Weekly digest"
```

### Heartbeat Optimization
```json
{
  "agents": {
    "defaults": {
      "heartbeat": {
        "every": "30m"
      }
    }
  }
}
```
Keep HEARTBEAT.md small (< 50 lines) to minimize token burn per check.

## Multi-Agent Routing

### Bind Agent to Channel
```json
{
  "agents": {
    "list": [
      {
        "id": "research",
        "workspace": "/home/trajan/.openclaw/agents/research/workspace",
        "channels": {
          "discord": {
            "guilds": {
              "GUILD_ID": {
                "channels": {
                  "research-channel-id": {}
                }
              }
            }
          }
        }
      }
    ]
  }
}
```

### Agent-Specific Model
```json
{
  "agents": {
    "list": [
      {
        "id": "fast-agent",
        "model": "anthropic/claude-haiku-4-5"
      }
    ]
  }
}
```

## Tool Profiles

### Browser Configuration
```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Web Search (Requires API Key)
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "brave",
        "apiKey": "YOUR_BRAVE_API_KEY",
        "maxResults": 5
      }
    }
  }
}
```

## Performance Patterns

### Thread Bindings (Discord)
Auto-create threads for long conversations:
```json
{
  "channels": {
    "discord": {
      "threadBindings": {
        "enabled": true,
        "idleHours": 48,
        "spawnSubagentSessions": true
      }
    }
  }
}
```

### Streaming
Partial streaming for responsive feel:
```json
{
  "channels": {
    "discord": {
      "streaming": "partial"
    }
  }
}
```

## Security Patterns

### Full Unrestricted Access
```json
{
  "tools": {
    "exec": {
      "host": "gateway",
      "security": "full",
      "ask": "off"
    }
  }
}
```
Plus exec-approvals.json with wildcard allowlist.

### Sandboxed Agent (for untrusted tasks)
```json
{
  "agents": {
    "list": [
      {
        "id": "sandboxed",
        "sandbox": {
          "mode": "docker",
          "image": "ubuntu:22.04",
          "network": "none"
        }
      }
    ]
  }
}
```

#openclaw #configuration #patterns #reference

## Related

- [[OpenClaw Advanced Config Patterns]]
- [[research-round-3-deprecation-and-advancement-analysis]]
- [[multi-agent-orchestration-frameworks]]
- [[Metaprompting Patterns]]
