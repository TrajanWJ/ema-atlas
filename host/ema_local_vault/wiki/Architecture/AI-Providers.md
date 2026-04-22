---
title: "AI Providers"
space: wiki
tags: ["architecture","ai","providers","routing"]
source: manual
---

# AI Providers

EMA routes AI work through a ProviderRegistry + SmartRouter + AccountManager stack.

## Registered Providers

| Provider | Type | Adapter | Status | Models |
|----------|------|---------|--------|--------|
| Claude CLI | `:claude_cli` | `ClaudeCli` | Active | opus-4-6, sonnet-4-6, haiku-4-5 |
| Anthropic API | `:anthropic` | `ApiKey` | Needs `ANTHROPIC_API_KEY` | opus-4-6, sonnet-4-6, haiku-4-5 |
| Codex CLI | `:codex_cli` | `CodexCli` | Installed | o4-mini, o3, gpt-4.1 |
| OpenRouter | `:openrouter` | `OpenRouter` | Needs `OPENROUTER_API_KEY` | 100+ models |
| Ollama | `:ollama` | `Ollama` | Not installed | Local models |
| OpenClaw | `:openclaw` | `OpenClaw` | Offline (VM unreachable) | Agent-based routing |

## Provider Capabilities

| Provider | Streaming | Multi-turn | Tool Use | Code Exec | File Access |
|----------|-----------|------------|----------|-----------|-------------|
| Claude CLI | ✓ | ✓ | ✓ | ✓ | ✓ |
| Codex CLI | ✗ | ✗ | ✓ | ✓ | ✓ |
| OpenRouter | ✓ | ✓ | ✓ | ✗ | ✗ |
| Ollama | ✓ | ✓ | ✗ | ✗ | ✗ |
| Anthropic API | ✓ | ✗ | ✓ | ✗ | ✗ |
| OpenClaw | ✓ | ✗ | ✓ | ✗ | ✗ |

## SmartRouter Task Classification

Prompts auto-classified by keyword matching:

| Task Type | Keywords | Best Provider |
|-----------|----------|---------------|
| `:code_generation` | write, implement, create, refactor, debug | Claude CLI |
| `:code_review` | review, analyze, explain | Claude CLI or Sonnet |
| `:research` | research, find, what is, look up | Any (cost-optimize) |
| `:summarization` | summarize, tldr, condense | Haiku or Ollama |
| `:creative` | brainstorm, write story, come up with | Opus or Sonnet |
| `:bulk` | process all, batch, for each | Cheapest available |

## Model Quality Tiers

```
opus / claude-opus-4-5    → 1.0
sonnet                     → 0.8
haiku                      → 0.6
deepseek-coder-v2          → 0.6
codestral                  → 0.55
llama3.3                   → 0.5
```

## Health & Failover

- Health checks every 30 seconds per provider
- Status transitions: available → degraded (2+ failures) → offline (5+ failures)
- AccountManager rotates keys on rate limit (429)
- Max 2 failover attempts per request

## Activation Checklist

To light up more providers:
1. **OpenRouter** — set `OPENROUTER_API_KEY` → unlocks 100+ models with one key
2. **Anthropic API** — set `ANTHROPIC_API_KEY` → direct API, no CLI overhead
3. **Ollama** — `curl -fsSL https://ollama.com/install.sh | sh && ollama pull llama3.2` → free local

## Related

- [[EMA Architecture Overview]]
- [[Orchestrator]]
