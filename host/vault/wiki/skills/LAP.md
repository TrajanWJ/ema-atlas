---
title: LAP
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: skill-documentation
tags:
  - agents
  - claude
  - skills
summary: >-
  LAP compiles API specifications (OpenAPI, GraphQL, AsyncAPI, Protobuf,
  Postman, Smithy) into a compressed, AI-readable format. It also provides a
  regi
wiki_id: skills/LAP
imported_from: vault/Skills/LAP.md
imported_at: '2026-04-04T00:23:57.202Z'
---
# LAP (API Spec Compiler)

**Status:** ✅ Installed via ClawHub
**Location:** `/home/trajan/skills/lap/`
**CLI:** `lapsh` (or `npx @lap-platform/lapsh`)

## What It Does
LAP compiles API specifications (OpenAPI, GraphQL, AsyncAPI, Protobuf, Postman, Smithy) into a compressed, AI-readable format. It also provides a registry for searching, downloading, and publishing API specs.

## Key Features
- **Compile** any API spec to `.lap` format — optimized for AI agent consumption
- **Registry** — search/get/publish specs on `registry.lap.sh`
- **Skill generation** — auto-generate Claude Code skills from API specs (`lapsh skill`)
- **Batch operations** — `skill-batch` for processing entire directories
- **Multi-format** — auto-detects OpenAPI, GraphQL, AsyncAPI, Protobuf, Postman, Smithy

## Core Commands
| Command | Purpose |
|---------|---------|
| `lapsh search <query>` | Search LAP registry |
| `lapsh compile <spec>` | Compile spec to LAP format |
| `lapsh get <name>` | Download spec from registry |
| `lapsh skill <spec>` | Generate Claude Code skill from spec |
| `lapsh skill-install <name>` | Install skill from registry |
| `lapsh publish <spec>` | Publish to registry |

## Evaluation
**Usefulness: 8/10** — Excellent for working with APIs. The compile-to-LAP format is clever — it strips verbosity from OpenAPI specs while keeping what matters for AI agents. The registry adds discoverability. Skill generation is the killer feature: turn any API spec into a ready-to-use Claude Code skill.

**Maturity: 7/10** — Well-documented SKILL.md, clear error recovery guide, proper CLI with flags. Feels production-ready.

**Relevance:** High for Trajan's stack. Any time we need to integrate with a new API, LAP can compile the spec and auto-generate a skill for it.

---
*Evaluated: 2026-03-16*

## Related

- [[README]]
- [[goals-aspirations]]
- [[briefing-2026-03-16]]
