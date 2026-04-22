# EMA Auth & Provider Management Design

**Date:** 2026-04-03
**Status:** Blueprint — integrate when EMA AI dispatch layer is built

## Overview

EMA should reuse the same multi-provider OAuth infrastructure as EMA dispatch. When any EMA node dispatches AI work, it should:

1. Discover available OAuth sources (Claude CLI, Codex, host machine, etc.)
2. Auto-refresh expiring tokens
3. Failover between providers when rate-limited or out of usage

## Token Sources (priority order)

| Priority | Source | Provider | Location |
|----------|--------|----------|----------|
| 0 | Local Claude CLI | Anthropic | `~/.claude/.credentials.json` |
| 1 | Host machine Claude CLI | Anthropic | `ssh host-machine ~/.claude/.credentials.json` |
| 2 | OAuth sources dir | Anthropic | `~/.claude/oauth-sources/*.json` |
| 3 | Codex (OpenAI) | OpenAI | `~/.codex/auth.json` on host |
| 100+ | Auth profiles | Anthropic | `~/.ema-dispatch/agents/*/agent/auth-profiles.json` |

## Reusable Components

EMA should import/call these existing scripts:

- **`~/bin/sync-host-oauth.sh`** — Pulls host credentials to VM
- **`~/bin/refresh-ema-dispatch-oauth.sh`** — Multi-source discovery, refresh, and sync
- **`~/bin/oauth-credentials-watcher.sh`** — inotifywait daemon for instant sync
- **`~/bin/oauth-auto-approve.sh`** — Chrome auto-approve for browser re-auth

## Implementation Pattern

```python
# EMA auth module should follow this pattern:

class MultiProviderAuth:
    """Discover, refresh, and rotate AI provider tokens."""

    def __init__(self, config_dir: Path):
        self.sources = []  # List[AuthSource]
        self.providers = {}  # Dict[str, ProviderConfig]

    def discover(self):
        """Scan for all available OAuth sources."""
        # 1. Local Claude CLI credentials
        # 2. oauth-sources/ directory
        # 3. Codex auth.json
        # 4. Environment variables

    def refresh_all(self):
        """Refresh any tokens expiring within 2 hours."""
        # Uses platform.claude.com/v1/oauth/token
        # client_id: 9d1c250a-e61b-44d9-88ed-5944d1962f5e

    def get_token(self, provider: str = "anthropic") -> str:
        """Get best available token, with automatic failover."""
        # Try primary → secondary → slot-3 → ... → openai fallback

    def on_rate_limit(self, provider: str, profile: str):
        """Mark a profile as rate-limited, rotate to next."""
```

## Cross-Node Auth in EMA Mesh

When EMA dispatches AI jobs across the mesh:
- Each node maintains its own token pool
- Job routing considers node token health (not just compute capacity)
- Tokens never leave the node — the node executes the AI call locally
- Token health signals propagated via gossip protocol (not the tokens themselves)

## Key Constants

```
ANTHROPIC_TOKEN_URL = "https://platform.claude.com/v1/oauth/token"
ANTHROPIC_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
OPENAI_BASE_URL = "https://api.openai.com/v1"
TOKEN_REFRESH_THRESHOLD_MS = 7_200_000  # 2 hours
```
