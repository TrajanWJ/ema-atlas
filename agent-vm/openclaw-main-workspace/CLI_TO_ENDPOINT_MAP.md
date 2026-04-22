# CLI to Endpoint Map

**Status:** Draft
**Purpose:** Map canonical CLI commands to EMA endpoints or planned API surfaces.

---

## Read-first commands

### `ema project get <project>`
- `GET /api/control-plane/projects/:project/state`

### `ema intent list --project <project>`
- `GET /api/control-plane/projects/:project/intents`

### `ema intent snapshot --project <project>`
- `GET /api/control-plane/projects/:project/intent-snapshot`

### `ema context project <project>`
- `GET /api/context/project/:project/package`

### `ema context operator`
- `GET /api/context/operator/package`

### `ema context session-evidence <project>`
- `GET /api/context/project/:project/session-evidence`

---

## Planned bootstrap/write commands

### `ema project bootstrap <project>`
- planned: `POST /api/control-plane/projects/:project/bootstrap`

### `ema intent update <intent-id>`
- planned: `POST /api/control-plane/intents/:id/update`

### `ema intent bootstrap --project <project>`
- planned: `POST /api/control-plane/projects/:project/bootstrap`

### `ema wiki sync-project <project>`
- planned: EMA/wiki sync endpoint or internal command path

---

## Planned MCP/plugin normalization commands

### `ema mcp baseline show`
- planned: manifest reader over canonical baseline file

### `ema mcp baseline generate`
- planned: generator path over Claude/Codex outputs

### `ema mcp diff claude`
- planned: compare baseline vs effective Claude MCP/plugin surface

### `ema mcp diff codex`
- planned: compare baseline vs effective Codex MCP surface

### `ema mcp parity openclaw`
- planned: OpenClaw parity report generation

---

## Planned session normalization commands

### `ema session import claude`
- existing/near-existing import path in EMA surfaces

### `ema session import codex`
- existing/near-existing import path in EMA surfaces, needs parity hardening

### `ema session bind <session-id> --project <project>`
- planned canonical binding path in control plane
