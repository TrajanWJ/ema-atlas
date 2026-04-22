# Swarm Harvest Summary — 2026-04-21

## Outcome

The initial live harness launch produced mixed runtime results, but the swarm artifacts were recovered and completed.

### Harness launch result
- 10 sessions launched across Claude Code, Hermes, and Codex
- Hermes produced one direct successful artifact during the live run
- Claude sessions were unreliable / partially idle, with at least one auth failure
- Codex sessions were impaired by sandbox/MCP transport failures on this host

### Recovery result
Missing actor outputs were backfilled with fresh agent work and written into the shared workspace.

## Final actor artifacts present

- `workspace/shared/actors/claude-a1.md` — canonical graph v1
- `workspace/shared/actors/claude-a2.md` — temporal engine v1
- `workspace/shared/actors/claude-a3.md` — OTP supervision sketch
- `workspace/shared/actors/hermes-a4.md` — daemon/CLI-facing agent workspace UX
- `workspace/shared/actors/hermes-a5.md` — swarm coordination contract v1
- `workspace/shared/actors/codex-a6.md` — workspace hardening audit
- `workspace/shared/actors/codex-a7.md` — computed views / task design
- `workspace/shared/actors/codex-a8.md` — session breadcrumb model
- `workspace/shared/actors/claude-a9.md` — anti-drift mechanisms
- `workspace/shared/actors/codex-a10.md` — v1 build order

## What this swarm actually produced

The swarm now covers the full immediate architecture surface for EMA’s shared workspace direction:

1. canonical graph shape
2. temporal frontmatter + CLI ideas
3. OTP supervision boundaries
4. agent-facing workspace packet UX
5. swarm coordination contract
6. workspace hardening requirements
7. computed task/todo/board/agenda rules
8. session breadcrumb model
9. anti-drift policies and reconciliation rules
10. a sharply scoped first build slice

## Recommended next operator step

Use `codex-a10.md` as the implementation slice anchor, then immediately build:
1. workspace hardening files/templates
2. BEAM workspace index/read model
3. actor packet endpoint
4. Python CLI commands for workspace open / handoff inbox / agenda / block create

That is now the cleanest path forward.
