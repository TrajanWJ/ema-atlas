---
title: Docker Stack
created: '2026-03-14'
updated: '2026-03-16'
type: playbook
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: operations
tags:
  - agent-vm
  - configuration
  - docker
summary: '```yaml'
wiki_id: operations/Docker_Stack
imported_from: vault/Operations/Docker Stack.md
imported_at: '2026-04-04T00:23:56.839Z'
---
# systemd Stack

## systemctl.yml

```yaml
networks:
  agent-net:
    driver: bridge
  sandbox-net:
    driver: bridge
    internal: true

volumes:
  oc-workspace:
  oc-config:

services:
  docker-socket-proxy:
    image: tecnativa/docker-socket-proxy:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - CONTAINERS=1
      - NETWORKS=1
      - IMAGES=1
      - POST=1
      - LOG_LEVEL=warning
    networks:
      - agent-net
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    mem_limit: 128m
    read_only: true
    tmpfs:
      - /tmp:size=10M
      - /run:size=10M
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  openclaw-gateway:
    build:
      context: ./openclaw
      dockerfile: systemdfile
    env_file: .env
    environment:
      - MAX_SANDBOXES=1
      - DISABLE_DM_PAIRING=true
      - SANDBOX_NETWORK=sandbox-net
      - DOCKER_HOST=tcp://docker-socket-proxy:2375
    volumes:
      - oc-workspace:/workspace
      - oc-config:/home/node/.config
    networks:
      - agent-net
      - sandbox-net
    depends_on:
      docker-socket-proxy:
        condition: service_started
    cap_drop:
      - NET_RAW
      - NET_ADMIN
    security_opt:
      - no-new-privileges:true
    mem_limit: 4g
    cpus: 3
    pids_limit: 512
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:18789/__openclaw__/canvas/', r => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

```

## .env.example

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# OpenClaw Settings
MAX_SANDBOXES=1
DISABLE_DM_PAIRING=true
SANDBOX_NETWORK=sandbox-net

# Messaging Platforms (configure during onboarding)
# TELEGRAM_BOT_TOKEN=
# DISCORD_BOT_TOKEN=
# SLACK_BOT_TOKEN=
```

## Container Resource Limits

| Container | Memory | CPUs | PIDs | Read-Only | Capabilities |
|---|---|---|---|---|---|
| docker-socket-proxy | 128 MB | default | default | Yes | ALL dropped |
| [[OpenClaw]]-gateway | 4 GB | 3 | 512 | No | NET_RAW, NET_ADMIN dropped |

## Volumes

| Volume | Container | Mount | Purpose |
|---|---|---|---|
| oc-workspace | [[OpenClaw]]-gateway | /workspace | Workspace files for skills/agents |
| oc-config | [[OpenClaw]]-gateway | /home/node/.config | [[OpenClaw config]], platform credentials |

## Networks

| Network | Type | Containers | Purpose |
|---|---|---|---|
| agent-net | bridge | [[OpenClaw]]-gateway, docker-socket-proxy | Inter-container communication |
| sandbox-net | bridge (internal) | [[OpenClaw]]-gateway, sandbox containers | Isolated sandbox execution — no internet |

## Related Notes

- [[Architecture/System Overview|System Overview]] — architecture diagram
- [[Networking]] — firewall rules and port mapping
- [[Security/Hardening|Hardening]] — security settings explained

#agent-vm #configuration #docker
- [[project_obsidian_vault]]
