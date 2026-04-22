---
title: Intelligence Layer
created: '2026-04-01'
type: codebase
status: active
stack:
  - python
  - sqlite
  - discord-api
host: agent-vm
path: ~/workspace/intelligence/
category: agent-infra
tags:
  - codebase
  - intelligence
  - pipeline
  - peer-review
  - pre-spawn
  - enrichment
summary: >-
  Python daemon that replaces the bash peer-review pipeline. Intent parsing,
  universal routing, prompt compilation, effectiveness tracking in SQLite,
  Discord components v2 output.
related:
  - OpenClaw Agent System
  - Dispatch System
  - EMA
wiki_id: codebases/Intelligence_Layer
imported_from: vault/Codebases/Intelligence Layer.md
imported_at: '2026-04-04T00:23:56.823Z'
---

# Intelligence Layer

Pre-spawn intelligence phase for the dispatch system. Parses intent from raw text, routes via domain map, compiles destination-specific prompts with vault refs, tracks effectiveness in SQLite.

## Architecture

- `intelligence/daemon.py` — Main daemon (socket/stdin loop)
- `intelligence/intent_parser.py` — Intent extraction, domain detection, complexity scoring
- `intelligence/router.py` — Universal router using peer-review-config.json
- `intelligence/prompt_compiler.py` — Per-agent prompt compilation with vault refs
- `intelligence/tracker.py` — SQLite effectiveness tracking (WAL mode)
- `intelligence/discord_emitter.py` — Components v2 stage-by-stage output

## Replaces

- `~/bin/peer-review-score.sh` — Scoring heuristics
- `~/bin/peer-review-engine.sh` — Enrichment + consultant deliberation

## Status

🔨 Active — under development

## Related

- [[OpenClaw Agent System]] — Parent system
- [[Dispatch System]] — Task routing
- [[Architecture/Intelligence Layer - System Vision|Vision Doc]]
