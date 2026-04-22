---
title: "Configuration System"
space: wiki
tags: ["architecture", "configuration", "settings"]
source: manual
---

# Configuration System

EMA has 5 configuration layers, from compile-time to runtime-persistent.

## Layer Overview

| Layer | Location | When Applied | Mutable? |
|-------|----------|-------------|----------|
| Compile-time | `daemon/config/config.exs` | Compilation | No (rebuild required) |
| Environment | `daemon/config/runtime.exs` | Boot | No (restart required) |
| Per-environment | `daemon/config/{dev,test,prod}.exs` | Compilation | No |
| Settings DB | `settings` table via `Ema.Settings` | Runtime | Yes (persistent) |
| Window state | `workspace_windows` table via `Ema.Workspace` | Runtime | Yes (persistent) |

## Compile-Time Config (config.exs)

Feature flags controlling which OTP subsystems start:

| Flag | Default | Controls |
|------|---------|----------|
| `ai_backend` | `:bridge` | AI routing: `:bridge` (multi-backend SmartRouter) or `:runner` (Claude CLI only) |
| `proposal_engine: [enabled:]` | `true` | Proposal generation pipeline + Vectors supervisor |
| `start_second_brain` | `true` | VaultWatcher + GraphBuilder + SystemBrain + Superman |
| `start_claude_sessions` | `true` | SessionWatcher + SessionMonitor |
| `start_canvas` | `true` | Canvas data refresher |
| `start_otp_workers` | `true` | Responsibilities scheduler |
| `start_harvesters` | `false` | Data harvester workers |
| `start_voice` | `false` | Voice supervisor + Discord bridge |
| `start_intention_farmer` | `false` | Intent farming from sessions |
| `start_temporal` | `false` | Temporal/rhythm engine |
| `start_git_watcher` | `false` | Git change monitoring |
| `start_quality` | `false` | Quality metrics supervisor |
| `start_orchestration` | `false` | Orchestration supervisor |
| `evolution_engine` | `false` | Evolution/behavior rules |
| `metamind: [enabled:]` | `false` | MetaMind system |
| `start_startup_bootstrap` | `false` | Auto-bootstrap on first run |
| `mcp_server: [enabled:]` | `false` | MCP stdio server |
| `start_cluster` | `false` | Distributed node coordination |

Other compile-time settings:
- `vault_path` — vault root (default: `/home/trajan/vault`, overridable via `EMA_VAULT_PATH`)
- `openclaw_gateway_url` — OpenClaw endpoint (default: `http://192.168.122.10:18789`)
- `seed_preflight` — proposal quality gates (mode, minimum_score, duplicate threshold)

## Runtime Config (runtime.exs)

Environment variables loaded at boot:

| Env Var | Purpose | Default |
|---------|---------|---------|
| `DATABASE_PATH` | SQLite database location | `~/.local/share/ema/ema.db` |
| `PORT` | HTTP server port | `4488` |
| `POOL_SIZE` | DB connection pool | `5` |
| `EMA_VAULT_PATH` | Vault root directory | `/home/trajan/vault` |
| `ANTHROPIC_API_KEY` | Claude API key (auto-registers provider) | — |
| `DISCORD_BOT_TOKEN` | Discord integration | — |
| `DISCORD_GUILD_ID` | Discord server ID | — |
| `GIT_WATCH_PATHS` | Comma-separated repo paths to monitor | `~/Projects/ema,~/Desktop/place.org,~/Desktop/JarvisAI` |

### Claude Account Discovery

`Ema.Claude.RuntimeBootstrap.build()` auto-discovers AI providers:
- Reads `~/.claude/.credentials.json` and `~/.claude-work/.credentials.json`
- Detects `claude` and `codex` executables on PATH
- Registers OpenClaw gateway if configured
- Auto-registers Anthropic API if `ANTHROPIC_API_KEY` set (models: claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5-20251001)

## Settings DB (Runtime-Persistent)

Source: `daemon/lib/ema/settings/setting.ex`  
Table: `settings` (key-value with timestamps)

| Key | Default | Purpose |
|-----|---------|---------|
| `color_mode` | `"dark"` | UI theme |
| `accent_color` | `"teal"` | Accent color for glass surfaces |
| `glass_intensity` | `"0.65"` | Glass opacity level |
| `font_family` | `"system"` | Font family |
| `font_size` | `"14"` | Base font size |
| `launch_on_boot` | `"true"` | Auto-launch on system startup |
| `start_minimized` | `"false"` | Start in system tray |
| `shortcut_capture` | `"Super+Shift+C"` | Global capture shortcut |
| `shortcut_toggle` | `"Super+Shift+Space"` | Global toggle shortcut |

API: `Settings.get(key)`, `Settings.set(key, value)`, `Settings.all()`  
REST: `GET /api/settings`, `POST /api/settings`  
Channel: `settings:sync` — broadcasts `setting_updated` events

## Window State (Workspace)

Source: `daemon/lib/ema/workspace/window_state.ex`  
Table: `workspace_windows`

Persists per-app window position and size:
- `app_id` — unique app identifier
- `x`, `y` — window position
- `width`, `height` — window size
- `is_open` — current open/closed state
- `is_maximized` — maximized flag

API: `Workspace.upsert(app_id, attrs)`, `Workspace.mark_open/2`, `Workspace.mark_closed/2`

## Spaces (Multi-Context Isolation)

Source: `daemon/lib/ema/spaces/space.ex`  
Table: `spaces`, `space_members`

Spaces provide isolated contexts with separate AI privacy boundaries:

| Field | Type | Purpose |
|-------|------|---------|
| name | string | Space name |
| space_type | string | personal, team, project |
| ai_privacy | string | `isolated` (AI sees only this space) or `federated_read` (AI reads across org spaces) |
| settings | map | Per-space configuration overrides |
| portable | boolean | Can be synced across devices |

Members have roles: owner, editor, viewer.

## Supervision Tree

See [[EMA-Overview]] for the full OTP supervision tree. Key conditional startup pattern:

```
Application.start → core_children (always)
                  → runtime_children (skip in test)
                  → maybe_start_*(config flag) → optional subsystems
                  → post-startup tasks (bootstrap, indexing)
```

## Seeds (First Boot)

Source: `daemon/priv/repo/seeds.exs` (idempotent)

Seeded on first run:
- 1 human actor (trajan)
- 4 projects (EMA, ClaudeForge, DispoHub, ExecuDeck)
- 4 proposal seeds (brainstorm q6h, integrations q12h, code quality daily, new apps q8h)
- 4 responsibilities (tests weekly, PRs daily, review weekly, deps monthly)
- 3 agents (strategist, coach, archivist) via `priv/repo/seeds/agents_seed.exs`

## Dependencies (Key Packages)

| Package | Version | Purpose |
|---------|---------|---------|
| phoenix | ~> 1.8.5 | Web framework |
| ecto_sqlite3 | >= 0.0.0 | SQLite adapter |
| bandit | ~> 1.5 | HTTP server |
| quantum | ~> 3.0 | Job scheduling |
| fuse | ~> 2.5 | Circuit breakers |
| cachex | ~> 4.0 | In-memory caching |
| libcluster | ~> 3.3 | Distributed clustering |
| delta_crdt | ~> 0.6 | CRDT state sync |
| optimus | ~> 0.5 | CLI option parsing |
| owl | ~> 0.12 | CLI pretty printing |
| file_system | ~> 1.0 | File watching |
| req | ~> 0.5 | HTTP client |

Total: 117 migrations, 116 schemas.

## Related

- [[EMA-Overview]] — full supervision tree and subsystem map
- [[AI-Providers]] — provider registry and routing strategies
- [[Data-Model-Reference]] — all schemas and tables
