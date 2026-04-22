# CLI Rollout Plan

## Phase 1 — Read-first recovery
Implement and verify:
- `ema project get <project>`
- `ema intent list --project <project>`
- `ema intent snapshot --project <project>`
- `ema context project <project>`
- `ema context operator`
- `ema context session-evidence <project>`

Dependencies:
- migrations
- seeds
- read-route tests

---

## Phase 2 — Bootstrap/write
Implement:
- `ema project bootstrap <project>`
- `ema intent bootstrap --project <project>`
- `ema intent update <intent-id>`
- `ema wiki sync-project <project>`

Dependencies:
- phase 1 stable
- initial seed intents agreed

---

## Phase 3 — Session normalization
Implement:
- `ema session import claude`
- `ema session import codex`
- `ema session bind`
- session evidence enriched in context packages

Dependencies:
- canonical session registry work

---

## Phase 4 — MCP/plugin normalization
Implement:
- `ema mcp baseline show`
- `ema mcp baseline generate`
- `ema mcp diff claude`
- `ema mcp diff codex`
- `ema mcp parity openclaw`

Dependencies:
- layered manifest model
- generator upgrades

---

## Phase 5 — Wiki/intents maturity
Implement:
- wiki intent mirrors
- project page sync
- architecture/decision/ops page sync
- session backfill into wiki

Dependencies:
- wiki page spine
- seed intents
