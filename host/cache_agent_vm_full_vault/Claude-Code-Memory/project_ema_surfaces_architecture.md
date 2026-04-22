---
name: EMA Surfaces Architecture
description: EMA Surfaces layer — persistent CLI sessions, WebSocket gateway client, peer discovery, and distributed dispatch
type: project
---

## EMA Surfaces Architecture (implemented 2026-04-05)

New `Ema.Surfaces` module layer replaces one-shot `System.cmd("claude", ...)` with:

1. **ClaudeSession** — GenServer wrapping persistent `claude` CLI sessions via Port. Uses `--session-id` (UUID) for conversation continuity. OAuth handled by CLI internally.
2. **CodexSession** — Same pattern for Codex CLI.
3. **GatewayClient** — WebSocket client to OpenClaw gateway (ws://localhost:18789). Uses gateway token auth + connect challenge protocol (`{type:"req", method:"connect", params:{minProtocol:3, maxProtocol:3, client:{id:"gateway-client",...}, auth:{token:...}}}`).
4. **PeerRegistry** — Tracks connected peers from gateway for distributed dispatch.
5. **Discovery** — Boot-time enumeration of all surfaces (Claude, Codex, OpenClaw, Ollama, Gateway).

**Why:** Previous architecture used fire-and-forget `System.cmd` with no session memory, fragile token management, and file-based dispatch queues. New architecture gives EMA the same freedom of motion as a human at the TUI.

**How to apply:** All new AI execution should go through `Ema.Surfaces.ClaudeSession` or gateway dispatch, not `Ema.Claude.ProviderRegistry`. The old path still works as fallback.

**Key files:**
- `daemon/lib/ema/surfaces/*.ex` — all surface modules
- `daemon/lib/ema_web/controllers/surfaces_controller.ex` — REST API
- API: `GET /api/surfaces`, `POST /api/surfaces/sessions/claude`, `POST /api/surfaces/sessions/:id/prompt`
