---
type: research
status: saved
confidence: 0.75
source: T2
summary: >-
  Desktop app for managing multiple AI coding CLI accounts (Claude Code, Codex,
  OpenCode, Gemini, OpenClaw) with local gateway forwarding
tags:
  - claude-code
  - tooling
  - multi-agent
  - cli
  - rust
  - tauri
url: 'https://github.com/farion1231/cc-switch'
stars: 27900
discovered: 2026-03-31T00:00:00.000Z
discovered_by: researcher
wiki_id: research/Tools/cc-switch
imported_from: vault/Research/Tools/cc-switch.md
imported_at: '2026-04-04T00:23:57.138Z'
---

# cc-switch

Desktop tool (Rust/Tauri) for managing multiple AI coding CLI accounts across providers.

## What it does
- Switch between Claude Code, Codex, OpenCode, Gemini CLI, OpenClaw accounts
- Local gateway forwarding — all CLIs point at a single local proxy
- GUI account management instead of env var juggling
- Trending #1 Rust on GitHub as of 2026-03-31

## Use case
Power users running multiple AI coding tools who don't want to manage separate auth tokens manually. Particularly useful if you're switching between Claude Max + Codex/GPT-4 + local models.

## Notes
- Heavy sponsor banners in README — note the commercial angle
- Core functionality is genuinely useful for the use case
- 27.9k stars, trending

## Related
[[OpenClaw]] | [[Research/GithubInteresting-2026-03-31]]
