---
type: tool-note
date: 2026-03-20
tags: [automation, browser, pipeline, replay, flyto, MCP]
domain: automation-tools
status: installed
version: 2.23.1
aliases: [flyto, flyto-core]
---

# flyto-core v2.23.1 — Traced Automation Pipelines with Step Replay

## Core Concept

Flyto is a pipeline runner with 412 modules across 6 domains (browser, flow, api, image, docker, file). Every step is traced and cached, enabling replay from any step — so when a 20-step pipeline fails at step 15, you re-run from step 15 with cached steps 1-14 returning instantly.

## Key Features

### Step-Level Tracing & Replay
```bash
flyto replay --from-step 8
```
- Every step execution is traced with inputs, outputs, and timing
- Cached steps return instantly on replay
- Only the failed step (and subsequent steps) re-run
- Massive time saver for long-running research/scraping pipelines

### 412 Modules Across 6 Domains
- **browser** — headless browser automation, page interactions
- **flow** — control flow, conditionals, loops, error handling
- **api** — HTTP requests, API integrations, auth
- **image** — screenshot, OCR, image processing
- **docker** — container management, isolated execution
- **file** — read/write/transform files, CSV/JSON/YAML

### 32+ Built-in Recipes
- `competitor-intel` — competitive analysis pipeline
- `full-audit` — comprehensive site/service audit
- `scrape-to-csv` — web scraping with structured output
- Plus 29+ more domain-specific workflows

### MCP Server Mode
```bash
flyto serve
```
Exposes flyto pipelines as MCP tools — any MCP client (Claude Code, Cursor, etc.) can invoke flyto recipes.

## Installation

```bash
pip install flyto-core[browser]
```

The `[browser]` extra includes headless browser dependencies.

## Use Case: Our Research Pipelines

**Problem:** Research pipelines (GitHub repo discovery, documentation scraping, competitive analysis) often fail partway through due to rate limits, network issues, or page structure changes. Re-running from scratch wastes time and API calls.

**Solution:** Port research pipelines to flyto recipes. On failure:
1. Fix the failing step
2. `flyto replay --from-step N` — cached steps are instant
3. Only the fixed step and downstream re-execute

This is especially valuable for the GitHub Interesting pipeline where we scrape dozens of repos in sequence.

## Install Status

Installed v2.23.1 on 2026-03-20.

## Related Notes

- [[agent-architecture-sota-2026-03-19]]
- [[MCP Ecosystem]]
