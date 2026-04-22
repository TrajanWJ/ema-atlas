---
title: LetMeScale
created: '2026-04-01'
type: codebase
status: active
stack:
  - next.js
  - typescript
  - monorepo
  - shared-ui
host: host-machine
path: ~/Desktop/Coding/Projects/letmescale
repo_branch: master
category: saas
tags:
  - codebase
  - landing-page
  - design-system
  - monorepo
summary: >-
  SaaS landing page monorepo with shared UI library, animations, and
  configurable section layouts via DevNav options.
related:
  - ProSlync
  - XpressDrop
wiki_id: codebases/LetMeScale
imported_from: vault/Codebases/LetMeScale.md
imported_at: '2026-04-04T00:23:56.823Z'
---

# LetMeScale

SaaS landing page monorepo with shared UI library, animations, and configurable section layouts.

## Architecture

- `apps/landing` — Main landing page (Next.js, port 3004)
- `Alternate-reality` — V2 landing page experiment (port 4001)
- `packages/ui` — Shared UI library (animations, components, tokens)
- `docs/design/` — Design system docs

### Design Principle: Options Over Variants
Expose configurable options in DevNav rather than duplicating components. Layout variations live as options in `SECTION_OPTION_DEFS` in `page.tsx`.

## Status

- **Git:** master, 2 dirty files (last commit: 2026-03-16)
- **Deployment:** Local dev
- **Active development:** Yes

## Related

- [[XpressDrop]] — Another Next.js project
- [[ProSlync]] — Business project
