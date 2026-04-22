# Session Map — Meta-build swarm

Launched on 2026-04-21T04:41:02Z from agent-vm.

## Sessions

- `ema-claude-a1` — Claude Code — canonical graph v1
- `ema-claude-a2` — Claude Code — temporal frontmatter + CLI surface
- `ema-claude-a3` — Claude Code — OTP supervision sketch
- `ema-hermes-a4` — Hermes — daemon/CLI-facing agent workspace UX
- `ema-hermes-a5` — Hermes — swarm coordination contract v1
- `ema-codex-a6` — Codex — workspace folder hardening
- `ema-codex-a7` — Codex — computed views design
- `ema-codex-a8` — Codex — session breadcrumb model
- `ema-claude-a9` — Claude Code — anti-drift mechanisms
- `ema-codex-a10` — Codex — v1 build order

## Output targets

All agents are instructed to write to:
- `workspace/shared/actors/<agent-id>.md`

Optional handoffs:
- `workspace/shared/handoffs/<agent-id>--handoff.md`
