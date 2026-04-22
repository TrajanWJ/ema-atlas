---
type: research
wiki_id: research/AI-Knowledge/OpenClaw
imported_from: vault/Research/AI-Knowledge/OpenClaw.md
imported_at: '2026-04-04T00:23:56.978Z'
tags: []
summary: ''
---
# OpenClaw

> Open-source personal AI assistant that connects to 20+ messaging platforms. Local-first, self-hosted.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [openclaw/openclaw](https://github.com/openclaw/openclaw) |
| **Stars** | 307,000+ |
| **License** | MIT |
| **Language** | TypeScript |
| **Runtime** | Node.js >= 22 |
| **Docker** | Yes (Dockerfile + docker-compose.yml + sandbox variants) |
| **Created** | 2025-11-24 |

## What It Does

- Unified AI inbox across WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Matrix, Teams, LINE, IRC, etc.
- Gateway (WebSocket control plane) coordinates between AI agent and client apps
- Voice support (wake word on macOS/iOS, continuous on Android)
- Interactive canvases, browser automation, cron jobs, webhooks
- Gmail Pub/Sub integration
- Skills platform (bundled, managed, workspace-level)

## History

Created Nov 2025 by Peter Steinberger as "Clawdbot." Renamed "Moltbot" (Jan 2026) after Anthropic trademark issue, then "OpenClaw" three days later.

## Docker Setup

```bash
# Automated:
./docker-setup.sh

# Manual:
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

Key files in repo: `Dockerfile`, `Dockerfile.sandbox`, `Dockerfile.sandbox-browser`, `Dockerfile.sandbox-common`, `docker-compose.yml`, `docker-setup.sh`, `.env.example`

Container runs as non-root `node` user (UID 1000). CLI drops `NET_RAW`/`NET_ADMIN` capabilities, enables `no-new-privileges`.

## Requirements

- Docker Desktop/Engine with Compose v2
- Minimum 2 GB RAM (1 GB risks OOM during build)
- macOS, Linux, or Windows via WSL2

## Security Considerations

**High risk profile — treat with extreme caution:**

- **Full system access** within mounted volumes (shell commands, file access)
- **CVE-2026-25253** documented
- **ClawHavoc supply chain attack** — 341 malicious skills, 9,000+ compromised installations
- **DM pairing** enabled by default — unknown senders receive pairing codes
- Keep gateway bound to `127.0.0.1`, use reverse proxy or VPN (Tailscale)
- Only mount directories OpenClaw actually needs — never expose `$HOME`
- Review `DOCKER-USER` firewall policy on VPS/public hosts
- Never store SSH keys, production creds, or tokens in workspace
- **Strong recommendation:** deploy on dedicated server/VPS, not personal machine

## Alternatives

| Project | Language | Differentiator |
|---|---|---|
| **IronClaw** (NEAR AI) | Rust | WASM sandbox, capability-based permissions, API keys never exposed to tool code |
| **ZeroClaw** | Rust | Low-resource ARM SBCs, security-first architecture |
| **NanoClaw** | TypeScript | Built on Claude Agent SDK, real Docker isolation, agent swarms |
| **Nanobot** | Python | ~4,000 LOC, easy to audit entire codebase |
| **PicoClaw** | Go | <10MB RAM, boots in 1s, runs on $10 RISC-V boards |
| **AnythingLLM** | -- | Web UI, multi-provider, no vendor lock-in |

## Evaluation Notes (2026-03-12)

**Pros:** Massive community, extremely active development, comprehensive Docker support, MIT license, vast messaging platform coverage.

**Cons:** Enormous attack surface (shell access + 20+ integrations), documented supply chain attack history, very large codebase difficult to audit, DM pairing default is risky. The ClawHavoc incident alone is a serious red flag for self-hosting on a personal machine.

**Verdict:** If deploying, use Docker with strict volume mounts, network isolation, and ideally a dedicated VM or VPS. Do not run on primary workstation without containerization.

## Anthropic OAuth / Subscription Auth

### How It Works

Claude Code authenticates with Claude Pro/Max subscriptions via OAuth. The flow:

1. `claude auth login` — opens browser, user logs into claude.ai, OAuth tokens stored in `~/.claude/.credentials.json`
2. `claude setup-token` — generates a long-lived OAuth token (`sk-ant-oat01-...`) valid for ~1 year, intended for headless/CI use
3. Token can be exported as `CLAUDE_CODE_OAUTH_TOKEN` env var for non-interactive use

Your current auth: **Claude Max** via `claude.ai` OAuth (`authMethod: "claude.ai"`, `subscriptionType: "max"`).

### Using Subscription Auth with OpenClaw

OpenClaw supports Anthropic OAuth tokens from Claude subscriptions as an alternative to API keys:

**Setup method:**
```bash
# 1. Generate a setup-token from Claude Code CLI
claude setup-token

# 2. Feed it to OpenClaw during onboarding
openclaw onboard --auth-choice setup-token
# OR paste into existing setup:
openclaw models auth paste-token --provider anthropic
```

The token is stored in `~/.openclaw/agents/main/agent/auth-profiles.json` as either `type: "oauth"` or `type: "token"`.

### Known Issues (as of March 2026)

**Critical bugs — subscription auth is fragile:**

1. **Refresh token discarded** ([#34117](https://github.com/openclaw/openclaw/issues/34117)) — `openclaw configure` stores the OAuth token as `type: "token"` (static) instead of `type: "oauth"`, discarding the refresh token. The token gets an artificial 8h expiry despite being valid for 1 year. Workaround: manually edit `auth-profiles.json` to set `expires` to `now + 1 year`.

2. **Intermittent refresh failures** ([#44616](https://github.com/openclaw/openclaw/issues/44616)) — OAuth refresh fails inconsistently across Telegram topics/chats even when credentials are valid globally.

3. **Setup-token broken in some versions** ([#19938](https://github.com/openclaw/openclaw/issues/19938)) — After certain updates, Anthropic API returns "OAuth authentication is currently not supported" when the token is sent as Bearer auth. The token works in Claude Code but not via OpenClaw's gateway.

4. **Configure wizard corrupts auth** — Running `openclaw configure` can overwrite `auth.order` and model fallbacks, poisoning all Anthropic auth profiles.

### ToS Concern

**Important:** Using Claude Pro/Max subscription tokens with OpenClaw may violate Anthropic's Terms of Service. Issue [#16365](https://github.com/openclaw/openclaw/issues/16365) documents a user who was told this violates ToS and switched to API keys. Anthropic has not officially extended subscription auth to third-party agents — Claude Code, Claude in Chrome, and Cowork are the only sanctioned consumers of subscription OAuth. The community is requesting Anthropic extend this ([#16365](https://github.com/openclaw/openclaw/issues/16365), [#32515](https://github.com/openclaw/openclaw/issues/32515)), but no official response yet.

### Auth Profile Failover

OpenClaw supports multiple auth profiles per provider. You can configure both a subscription token (primary) and an API key (fallback), though automatic failover between auth profiles within the same provider is not well-documented ([#9070](https://github.com/openclaw/openclaw/issues/9070)). Model-level failover to different providers is more reliable.

### Key Environment Variables

| Variable | Purpose |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Pass setup-token to Claude Code without interactive login |
| `ANTHROPIC_API_KEY` | Standard API key auth (separate billing) |

### Credential File Locations

| File | Purpose |
|---|---|
| `~/.claude/.credentials.json` | Claude Code's OAuth credentials (`claudeAiOauth.accessToken`, refresh token) |
| `~/.openclaw/agents/main/agent/auth-profiles.json` | OpenClaw's stored auth profiles per provider |
| `~/.openclaw/openclaw.json` | OpenClaw gateway config including `auth.order` |

## See Also

- [[builderz-labs Mission Control]] — agent orchestration dashboard (complementary)
- [[Research - Self-Hosted AI Agent Platforms 2026]] — comparison of all options
- [[CloudCLI]] — current web UI setup

#ai-assistant #self-hosted #docker #evaluated
