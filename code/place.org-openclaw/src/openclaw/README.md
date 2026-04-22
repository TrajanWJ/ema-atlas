# src/openclaw/ — OpenClaw Integration Layer

All AI/agent features for the place.org-openclaw fork live here.
Nothing outside this directory should be modified by the fork.

## Quick Reference

| Directory | Purpose |
|-----------|---------|
| `gateway/` | WebSocket client to OpenClaw gateway |
| `apps/` | Fork-only apps (same PlaceApp contract) |
| `stores/` | Fork-only Zustand stores |
| `hooks/` | Fork-only React hooks |
| `types/` | Fork-only TypeScript types |
| `widgets/` | Ambient bar widgets, dock badges |
| `enhancements/` | Wrappers adding features to upstream apps |

## Rules

1. NEVER import from or modify files in `src/components/apps/`, `src/stores/`, `src/hooks/`, `src/types/`, `src/lib/`
2. Every enhancement: `if (!connected) return null`
3. Fork apps use the same PlaceApp registration contract as upstream apps
4. Gateway connection config: localStorage > env var > ws://localhost:18789

## See Also

- `/CLAUDE.md` — AI agent instructions for this repo
- `/docs/openclaw/FORK-ARCHITECTURE.md` — Full architecture doc
