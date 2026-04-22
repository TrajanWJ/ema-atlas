---
title: Promptcmd Installation
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - ai
  - cli
  - productivity
  - prompts
  - tools
summary: >-
  Promptcmd turns `.prompt` template files into native CLI commands with
  argument parsing, `--help` text, and stdin/stdout piping. Define a prompt
  once,
wiki_id: research/Promptcmd_Installation
imported_from: vault/Research/Promptcmd Installation.md
imported_at: '2026-04-04T00:23:57.100Z'
---
# Promptcmd Installation

**Date:** 2026-03-16
**Version:** 1.1.0
**Repo:** https://github.com/tgalal/promptcmd
**Docs:** https://docs.promptcmd.sh
**Status:** ✅ Installed, ⚠️ needs standard Anthropic API key for execution

## What Is It

Promptcmd turns `.prompt` template files into native CLI commands with argument parsing, `--help` text, and stdin/stdout piping. Define a prompt once, run it like `cat file.py | review-code`. Supports Anthropic, OpenAI, OpenRouter, Ollama, and Google providers.

## Installation

Installed via official installer to `~/.promptcmd/bin/`:
- `promptcmd` — executor binary
- `promptctl` — management CLI (create, enable, import, ssh, config, etc.)

**PATH:** Add to shell profile:
```bash
source $HOME/.promptcmd/bin/env
```

## Configuration

Config file: `~/.config/promptcmd/config.toml`

```toml
[providers.anthropic]
model = "claude-sonnet-4-20250514"
# api_key = "sk-ant-api03-..."  # needs standard API key
```

**Environment variables:** `PROMPTCMD_ANTHROPIC_API_KEY`, `PROMPTCMD_OPENAI_API_KEY`, `PROMPTCMD_OPENROUTER_API_KEY`

### ⚠️ API Key Issue

The VM's `ANTHROPIC_API_KEY` is an OAuth token (`sk-ant-oat...`) from Claude Max — not a standard API key. Promptcmd sends it as `x-api-key` to the Anthropic Messages API, which rejects OAuth tokens. **Fix options:**
1. Add a standard Anthropic API key (`sk-ant-api03-...`) to config.toml
2. Use OpenRouter: set `PROMPTCMD_OPENROUTER_API_KEY` and change model to `openrouter/anthropic/claude-sonnet-4-20250514`
3. Use Ollama for local models (no API key needed)

## Installed Prompts

Source files in `~/prompts/`, imported and enabled in `~/.promptcmd/bin/`:

### `summarize`
Pipe text, get a summary. Options: `--words N`, `--bullets`
```bash
cat article.txt | summarize --words 50
echo "long text" | summarize --bullets
```

### `review-security`
Pipe code, get security audit. Option: `--severity low|medium|high|critical`
```bash
cat app.py | review-security
cat server.js | review-security --severity high
```

### `review-code`
Pipe code, get code review. Options: `--lang python`, `--focus "error handling"`
```bash
cat main.go | review-code --lang go
cat utils.py | review-code --focus "performance"
```

## SSH Integration

Forward prompts to remote shells:
```bash
promptctl ssh user@server
# Now on the remote, all enabled prompts are available
server$ cat code.py | review-code
```

SSH help available via `promptctl ssh --help`.

## Key Features

- **Provider switching:** `-m openai`, `-m ollama/model:tag`
- **Load balancing:** Configure provider groups for cost optimization
- **Caching:** `--config-cache-ttl 120` for deterministic pipelines
- **Variants:** Custom model personalities (GlaDOS mode, etc.)
- **Dry run:** `--dry` to preview without API call
- **Render only:** `--render` / `promptctl render` to see expanded template
- **Auto-generated `--help`** from prompt schema

## Useful Commands

```bash
promptctl list              # List all enabled prompts
promptctl cat summarize     # View prompt template
promptctl create myprompt   # Create new prompt interactively
promptctl import -e file.prompt  # Import and enable
promptctl render summarize  # Preview rendered template
promptctl config edit       # Edit config.toml
```

## Tags
#tools #cli #prompts #ai #productivity

## Related

- [[Promptcmd Installation]]
- [[briefing-2026-03-16]]
- [[github-intel-favorites]]
