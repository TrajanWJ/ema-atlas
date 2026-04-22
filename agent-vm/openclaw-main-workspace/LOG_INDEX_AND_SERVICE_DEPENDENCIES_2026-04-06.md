# Log Index & Service Dependency Map — 2026-04-06

## Core services

### 1. OpenClaw gateway
- unit: `openclaw-gateway.service`
- service file: `~/.config/systemd/user/openclaw-gateway.service`
- config: `~/.openclaw/openclaw.json`
- env file: `~/.openclaw/.env`
- runtime log: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- additional logs: `~/.openclaw/logs/`

Depends on:
- network-online target
- valid env/secret material
- OpenClaw install + config integrity

### 2. OAuth credentials watcher
- unit: `oauth-credentials-watcher.service`
- service file: `~/.config/systemd/user/oauth-credentials-watcher.service`
- script: `/home/trajan/bin/oauth-credentials-watcher.sh`
- logs: `~/.openclaw/logs/oauth-watcher.log` and/or unit journal depending on script behavior

Depends on:
- OpenClaw gateway being up
- local credential sources (Claude/Codex/OpenAI/etc.) remaining valid

### 3. EMA observer
- unit: `ema-observer.service`
- service file: `~/.config/systemd/user/ema-observer.service`
- working dir: `/home/trajan/projects/frontend-layer`
- log: `/home/trajan/logs/ema-observer.log`

Depends on:
- frontend-layer build/runtime assets
- Node/pnpm availability
- any upstream API/tunnel expectations of the UI

### 4. Optional tunnel/publication helpers
Observed logs/scripts:
- `/home/trajan/logs/observer-ngrok.log`
- `/home/trajan/logs/observer-tunnel.log`
- `/home/trajan/logs/observer-ssh-tunnel.log`
- `/home/trajan/bin/observer-ngrok.sh`
- `/home/trajan/bin/observer-tunnel.sh`
- `/home/trajan/bin/observer-ssh-tunnel.sh`

These are not the same thing as the observer service. They are publication/transport helpers around it.

---

## Cron / dispatch / research logs

### Dispatch core
Primary state/log area:
- `/home/trajan/dispatch/`

Key files:
- `dispatch.db`
- `feed.jsonl`
- `schedule.json`
- `active-tasks.json`
- `agent-status.json`
- `proposal-state.json`
- `research-loop-state.json`
- `causal-traces.jsonl`
- `results/`
- `done/`
- `failed/`

Interpretation:
- this is a major operational substrate, not a side folder

### User-facing / shell logs
Common locations:
- `/home/trajan/logs/`
- `/tmp/*.log`
- `/var/log/*.log` for some cron jobs

Examples seen:
- `/home/trajan/logs/ema-observer.log`
- `/home/trajan/logs/ema-daemon.log`
- `/home/trajan/logs/observer-*.log`
- dispatch-related logs in `/tmp` and `~/logs`

---

## Quick dependency map

### OpenClaw lane
OpenClaw config/env
→ `openclaw-gateway.service`
→ chat/control/orchestration surfaces
→ agent routing / thread bindings / MCP-aware workflows

### Auth lane
local CLI credentials
→ watcher scripts
→ OpenClaw / MCP / model access continuity

### EMA lane
SSH/API tunnel on 4488
→ EMA MCP bridge / backend reachability
→ frontend-layer observer on 3200
→ logs/tunnel helpers/public URL files

### Dispatch lane
cron
→ dispatch scripts/db/feed/results
→ proposals/research/tasks/outcomes
→ vault/research/agent loops

---

## What to inspect for common failures

### “OpenClaw seems weird”
1. `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
2. `openclaw status`
3. `systemctl --user status openclaw-gateway.service`

### “Observer UI is down”
1. `systemctl --user status ema-observer.service`
2. `/home/trajan/logs/ema-observer.log`
3. port 3200 listener state
4. tunnel/publication helper logs if remote access is expected

### “EMA integration broken”
1. tunnel health on 4488
2. observer/tunnel logs
3. `ema-mcp-server.js` assumptions
4. Codex/Claude MCP config parity

### “Automation stopped doing things”
1. active crontab
2. `/home/trajan/dispatch/`
3. dispatch results / failed archive
4. watchdog / dispatch shell logs

---

## Recommendation

Eventually split this into:
- `LOG_INDEX.md`
- `SERVICE_DEPENDENCY_MAP.md`
- `FAILURE_PLAYBOOKS.md`

For now, this combined doc is enough to stop blind poking.
