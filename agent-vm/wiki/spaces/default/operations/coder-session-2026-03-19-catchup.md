---
title: Coder Session — 2026-03-19 Catchup
type: playbook
domain: system-ops
tags:
  - session-log
  - catchup
  - installs
  - vault-docs
created: '2026-03-19'
confidence: 0.95
source: 'agent:coder'
summary: >-
  Daily catchup implementation session — installs, repo watchlist update, vault
  docs, AGENTS.md audit and rewrites.
wiki_id: operations/coder-session-2026-03-19-catchup
imported_from: vault/Operations/coder-session-2026-03-19-catchup.md
imported_at: '2026-04-04T00:23:56.856Z'
---

# Coder Session — 2026-03-19 Catchup

## What Was Installed

### sift-agent
- **Result: NOT INSTALLED**
- `sift-agent` does not exist on PyPI
- `sift` exists on PyPI (v6.0.0) but is the old grep-like CLI tool — NOT bilalimamoglu/sift
- bilalimamoglu/sift appears to be a GitHub-only project without a PyPI release yet
- **Action:** Added to watch-repos.txt; install when pip package ships

### KittenTTS
- **Result: INSTALLED** (pip install --user --break-system-packages)
- `kittentts` v0.1.3 on PyPI
- Note: dependency conflict with scenedetect (click version mismatch) — non-critical, pip exit 0
- `pipx install kittentts` fails (no CLI entrypoint — it's a library)
- Install path: `pip install kittentts --user --break-system-packages`

## Repos Added to Watch List

File: `~/.config/watch-repos.txt`

Added 17 repos:
```
bilalimamoglu/sift           # CLI output compression: 198K→129 tokens
MBing/mcp-time-travel        # time-travel debugger for MCP agents
github/spec-kit              # GitHub official spec-driven dev toolkit
github/gh-aw                 # GitHub official agentic workflows + firewall
ivanviragine/wade            # worktree-per-issue AI coding workflow
getsentry/sentry-mcp         # official Sentry MCP + Claude Code plugin
sam-ent/fleet-mem            # shared code intelligence, git-concurrent
thomscoder/z1                # zero-config Claude Code ↔ browser proxy
ManushPahuja/ScreenHand      # 111 tools desktop MCP, OCR, Chrome CDP
polymit/phantom              # Rust browser engine for AI agents, 6x DOM efficiency
FabianKuebler/fenced         # markdown-as-agentic-UI protocol
kanoniv/agent-auth           # Ed25519 delegation chains for agent identity
Myr-Aya/GouvernAI-claude-code-plugin  # runtime risk-tier guardrails
buildoak/wet                 # Go proxy: 82% context bloat reduction
mnemox-ai/idea-reality-mcp  # pre-build reality check scanner
BlueprintLabIO/markdown-ui   # interactive widgets in plain markdown
KittenML/KittenTTS           # SOTA TTS under 25MB, CPU-only ONNX
```

## Vault Docs Written

### Architecture

| File | Summary |
|------|---------|
| `vault/Architecture/agents-md-audit-2026-03-19.md` | Full audit of all 12 AGENTS.md files; lean templates |
| `vault/Architecture/consensus-loop-pattern.md` | Cross-model review gate pattern |
| `vault/Architecture/spec-driven-dev-patterns.md` | spec-kit + gh-aw + wade pipeline |
| `vault/Architecture/fleet-mem-coordination.md` | AST-aware multi-agent coordination |
| `vault/Architecture/context-compression-patterns.md` | Wet proxy vs RLM compact-hook |

### Research

| File | Summary |
|------|---------|
| `vault/Research/security-agent-attack-vectors-2026-03-19.md` | PDF injection, bot PR epidemic, GouvernAI risk-tier |

## AGENTS.md Changes

Rewrote 5 agents from boilerplate-heavy (~80%+ noise) to lean signal-only versions:

| Agent | Before | After | Removed |
|-------|--------|-------|---------|
| browser-automation | ~70 lines | 7 lines | Roster, vault structure, memory, startup, agent-to-agent, self-evolution |
| coder | ~70 lines | 8 lines | Same boilerplate blocks |
| ops | ~70 lines | 11 lines | Same; kept all tool entries |
| security | ~65 lines | 11 lines | Same; added landmines section |
| vault-keeper | ~70 lines | 7 lines | Same |

**Agents left unchanged (already lean or signal-dense):**
- `main` (Right Hand) — too much genuine signal to touch
- `concierge` — already lean
- `devils-advocate` — already lean (needs epistemic checklist added, flagged in audit)
- `researcher` — kept the critical "don't use X" warnings, removed only vault structure block
- `prompt-engineer` / `strategist` / `universal-orchestrator` — already lean

## Vault Index

Ran `qmd update && qmd embed` — 25 chunks from 9 documents embedded successfully.

## Status

**DONE** — All 7 tasks complete.

Notable: sift-agent not on PyPI yet — watch `bilalimamoglu/sift` repo for pip release.
