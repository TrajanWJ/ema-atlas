# EMA Integration Map — 2026-04-06

## What EMA appears to be in this environment

EMA is not a single process here. It is a stack with at least four visible surfaces:

1. **EMA core project**
   - `/home/trajan/Projects/ema`
   - includes daemon, CLI, docs, dispatch DB, wiki-engine, and claudeforge

2. **EMA MCP bridge**
   - `/home/trajan/bin/ema-mcp-server.js`
   - exposed into Claude/Codex via MCP as `ema`
   - points at `EMA_URL=http://192.168.122.1:4488/api`

3. **EMA observer / frontend surface**
   - `/home/trajan/projects/frontend-layer`
   - user service: `ema-observer.service`
   - serves on `0.0.0.0:3200`

4. **EMA backend/API reachability**
   - local port 4488 is currently a forwarded/bridged endpoint
   - observed listener: `127.0.0.1:4488` owned by `ssh`
   - this strongly suggests the EMA API is reached via SSH tunnel rather than a direct local daemon bind

---

## Current runtime picture

### OpenClaw
- gateway on `0.0.0.0:18789`
- dashboard visible on LAN

### EMA observer/frontend
- `ema-observer.service`
- `pnpm exec next start --hostname 0.0.0.0 --port 3200`
- working dir: `/home/trajan/projects/frontend-layer`

### EMA API path
- MCP bridge points to `http://192.168.122.1:4488/api`
- active listener seen on `127.0.0.1:4488` by `ssh`
- meaning: there is likely an address translation / tunnel chain in play

This is the first thing to document more cleanly later, because right now it is operationally fragile knowledge.

---

## Files and components of interest

### Core repo
- `/home/trajan/Projects/ema/daemon`
- `/home/trajan/Projects/ema/cli`
- `/home/trajan/Projects/ema/wiki-engine`
- `/home/trajan/Projects/ema/docs`
- `/home/trajan/Projects/ema/dispatch.db`

### Frontend / observer
- `/home/trajan/projects/frontend-layer`
- `/home/trajan/.config/systemd/user/ema-observer.service`
- `/home/trajan/logs/ema-observer.log`
- tunnel helpers/logs:
  - `/home/trajan/bin/observer-tunnel.sh`
  - `/home/trajan/bin/observer-ssh-tunnel.sh`
  - `/home/trajan/bin/observer-ngrok.sh`
  - `/home/trajan/logs/observer-tunnel.log`
  - `/home/trajan/logs/observer-ssh-tunnel.log`
  - `/home/trajan/logs/observer-ngrok.log`
  - `/home/trajan/logs/observer-public-url.txt`

### MCP / CLI bridge
- `/home/trajan/bin/ema-mcp-server.js`
- `/home/trajan/bin/ema-mcp-server.sh`
- `/home/trajan/bin/ema`
- `/home/trajan/bin/ema-context-bundle.sh`
- `/home/trajan/bin/ema-surface-dispatch.sh`

### Knowledge / memory adjacency
- codebase-memory caches for EMA repos exist under:
  - `~/.cache/codebase-memory-mcp/`

---

## Operational interpretation

### Likely responsibilities
- **Projects/ema** = source / backend / docs / architecture
- **frontend-layer** = operator-facing UI or observer surface
- **ema-mcp-server.js** = lets local coding/agent tools talk to EMA API
- **ssh on 4488** = transport layer to backend/API
- **OpenClaw** = orchestration/chat/control layer around these pieces

### Main fragility points
1. API reachability depends on tunnel state
2. frontend and backend live in different repos/paths
3. MCP bridge assumes the endpoint path without surfacing tunnel health clearly
4. observer has multiple publication/tunnel helpers (SSH, ngrok, maybe others)

---

## Recommended future cleanup

### Short-term
- make one explicit diagram: user → OpenClaw / frontend-layer → EMA API → backend source repo
- document the exact tunnel/source-of-truth for port 4488
- define whether `frontend-layer` is canonical EMA UI or temporary observer shell

### Medium-term
- create one `ema-doctor.sh` or extend bootstrap doctor with:
  - observer service health
n  - port 3200 health
  - port 4488 tunnel health
  - MCP bridge smoke test
- decide one canonical public exposure method:
  - SSH tunnel
  - ngrok
  - LAN-only
  - something else

### Long-term
- reduce split-brain between EMA repo, frontend-layer repo, and observer/tunnel scripts

---

## Bottom line

EMA here is a **federated integration**, not a neat app:
- code lives in one place
- UI in another
- API transport via tunnel
- agents reach it through MCP/CLI wrappers

That is workable, but only if the runtime path is documented as a system rather than remembered as lore.
