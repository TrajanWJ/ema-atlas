# Edge: execution (Hermes & harness drivers)

**Rule:** Hermes owns execution. Drivers live above providers. Drivers must
report into EMA's event_log, never directly into surfaces.

## Primary
- `codebase-ema` — `code/ema/daemon/lib/ema/surfaces/hermes_client.ex`
- `codebase-ema` — `code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md`
- `codebase-ema` — `code/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
- `codebase-claudeforge` — `packages/server/src/providers/hermes-provider.ts`
  (working surface↔Hermes seam, with `X-Hermes-Session-Id` continuity)

## Secondary / inspiration
- `codebase-agent-os-bridge` — runtime bridging patterns
- `docs-clis-mcps-integrations` — claude-cli, codex-cli, MCP material
- `docs-host-vault-agent-modules-routing` — routing prior art

## Driver targets (planned)
`hermes-native | claude-cli | codex-cli | peer-remote | simulated-tui`
(see `MACBOOK_AGENT_HANDOFF_MASTER.md` §7, `02-project-transfer-brief.md` §4)
