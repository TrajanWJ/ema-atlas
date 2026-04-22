---
title: XpressDrop
created: '2026-04-01'
type: codebase
status: active
stack:
  - next.js-15
  - react-19
  - typescript
  - css-modules
host: host-machine
path: ~/Desktop/Coding/Projects/xpressdrop
repo_branch: master
category: e-commerce
tags:
  - codebase
  - storefront
  - flooring
  - e-commerce
  - proxy-api
summary: >-
  Storefront app for Chad's Flooring. Next.js 15 with external API proxy,
  cookie-based auth rotation, catalog browsing under /xpr/.
related:
  - LetMeScale
  - ProSlync
wiki_id: codebases/XpressDrop
imported_from: vault/Codebases/XpressDrop.md
imported_at: '2026-04-04T00:23:56.825Z'
---

# XpressDrop

Storefront app for Chad's Flooring. Next.js 15 App Router with external API proxy at chadsflooring.bz, cookie-based auth (round-robin rotation).

## Architecture

- All storefront routes under `/xpr/`
- API routes proxy to external backend
- `context/CatalogContext.tsx` — global catalog state
- `lib/cookie-manager.ts` — auth cookie rotation
- Dev server pinned to port 3005

## Status

- **Git:** master, 261 dirty files (last commit: 2026-03-10)
- **Deployment:** Local dev
- **Active development:** Yes

## Related

- [[LetMeScale]] — Another Next.js storefront project
- [[ProSlync]] — Business project
