# Docker Stack

## docker-compose.yml

```yaml
networks:
  agent-net:
    driver: bridge
  sandbox-net:
    driver: bridge
    internal: true

volumes:
  mc-data:
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
      dockerfile: Dockerfile
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

  mission-control:
    build:
      context: ./mission-control
      dockerfile: Dockerfile
    ports:
      - "192.168.122.10:3000:3000"
    environment:
      - NODE_ENV=production
    env_file: .env
    volumes:
      - mc-data:/app/.data
    networks:
      - agent-net
    depends_on:
      openclaw-gateway:
        condition: service_started
    read_only: true
    tmpfs:
      - /tmp:size=100M
      - /app/.next/cache:size=200M
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
    mem_limit: 1g
    cpus: 1
    pids_limit: 256
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## .env.example

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Mission Control Auth
AUTH_USER=admin
AUTH_PASS=changeme
API_KEY=mc-xxxxx

# Mission Control Settings
MC_ALLOWED_HOSTS=localhost,192.168.122.10
MC_COOKIE_SECURE=0
MC_COOKIE_SAMESITE=strict

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
| openclaw-gateway | 4 GB | 3 | 512 | No | NET_RAW, NET_ADMIN dropped |
| mission-control | 1 GB | 1 | 256 | Yes | ALL dropped, NET_BIND_SERVICE added |

## Volumes

| Volume | Container | Mount | Purpose |
|---|---|---|---|
| mc-data | mission-control | /app/.data | SQLite DB, persistent state |
| oc-workspace | openclaw-gateway | /workspace | Workspace files for skills/agents |
| oc-config | openclaw-gateway | /home/node/.config | OpenClaw config, platform credentials |

## Networks

| Network | Type | Containers | Purpose |
|---|---|---|---|
| agent-net | bridge | All three services | Inter-container communication |
| sandbox-net | bridge (internal) | openclaw-gateway, sandbox containers | Isolated sandbox execution — no internet |

## Related Notes

- [[Architecture/System Overview\|System Overview]] — architecture diagram
- [[Networking]] — firewall rules and port mapping
- [[Security/Hardening\|Hardening]] — security settings explained

#jarvisai #configuration #docker
