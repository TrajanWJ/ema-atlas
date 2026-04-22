---
title: ByteRover
created: '2026-03-14'
updated: '2026-03-14'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - claude
  - code
  - knowledge
  - openclaw
  - research
  - skills
summary: >-
  ByteRover is a ClawHub skill that replaces [[OpenClaw]]'s default flat-file
  memory (MEMORY.md) with a **structured context tree**. Instead of dumping 
wiki_id: research/Tools/ByteRover
imported_from: vault/Research/Tools/ByteRover.md
imported_at: '2026-04-04T00:23:57.126Z'
---
# ByteRover

**Source:** https://clawhub.ai/byteroverinc/byterover
**Video Review:** https://youtu.be/qMutYqVroD0 (Fahd Mirza, 13min, 2026-03-11)
**Category:** [[OpenClaw]] Memory Plugin
**Date:** 2026-03-14
**Status:** Evaluated (not installed)

## What It Does

ByteRover is a ClawHub skill that replaces [[OpenClaw]]'s default flat-file memory (MEMORY.md) with a **structured context tree**. Instead of dumping everything into growing markdown files:

1. **Organized storage** — Separate markdown files per knowledge chunk in a structured folder tree
2. **Semantic retrieval** — Before each response, queries the tree and injects only relevant context (not the whole file)
3. **Auto-curation** — After meaningful work, curates new knowledge back into the tree automatically
4. **Deduplication** — Avoids the common problem of repeated facts in MEMORY.md
5. **CLI tools** — `brv query`, `brv curate`, `brv view` for direct interaction

## Key Stats (from video)

- 26,000 installs in first week on ClawHub
- 90% accuracy on LoCoMo benchmark after 8 months of iteration
- Works with Ollama local models (demo used Qwen 3.5 35B)

## How It Works

- Replaces the memory plugin slot in [[OpenClaw]]
- Stores facts in a context tree (organized folders of markdown)
- Semantic search before each response → injects only relevant knowledge
- After responses, curates new knowledge back into the tree
- CLI available: `brv query "what do I know about X"`, `brv curate "new fact"`, `brv view`

## Installation

```bash
clawhub install byteroverinc/byterover
brv setup  # configures memory integration
# Connect to provider (Ollama, OpenAI, etc.)
# Restart gateway
```

## Relevance to Our Stack

We currently use:
- `MEMORY.md` (flat file, manual curation)
- `memory/YYYY-MM-DD.md` (daily notes)
- [[Engram]] (persistent memory via MCP)
- QMD (vault semantic search)

ByteRover addresses a real pain point — MEMORY.md does grow and get stale. However, we already have:
- [[Engram]] for structured persistent memory
- QMD for semantic vault search
- [[Auto-knowledge]] skill for capture

**Verdict:** Worth monitoring. Could replace MEMORY.md if [[Engram]] doesn't fully solve the staleness problem. The semantic retrieval before each response is the key differentiator — our current setup loads the full MEMORY.md every time.

## Notes

- Video by Fahd Mirza (prolific [[OpenClaw]] YouTuber, 70+ videos on the platform)
- Demo was on Ubuntu with Nvidia RTX 6000 (48GB VRAM) + Ollama
- Some CLI commands still buggy ("very new project, bleeding edge")
- "ByteRover will never replace your memory, but it will make sure your AI agent never loses it"
- Can also connect with Codex or Claude Code
