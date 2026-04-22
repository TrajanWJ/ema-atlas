---
type: project
wiki_id: projects/XpressDrop
imported_from: vault/Projects/XpressDrop.md
imported_at: '2026-04-04T00:23:56.902Z'
tags: []
summary: ''
---
# XpressDrop

> Next.js storefront demo for flooring products. External API integration with cookie-based auth rotation.

## Quick Info

| Field | Value |
|---|---|
| **Location** | `/home/trajan/Desktop/Coding/Projects/xpressdrop/` |
| **Stack** | Next.js 15, React 19, TypeScript, Tailwind 4, Zustand |
| **Validation** | Zod |
| **Animations** | Framer Motion |
| **Auth** | JWT + cookie rotation |
| **External API** | chadsflooring.bz (proxied via `/api/`) |
| **Testing** | Vitest + React Testing Library |
| **KV** | Vercel KV |
| **Port** | 3005 (pinned) |
| **Status** | Production demo |
| **Has CLAUDE.md** | Yes |

## Architecture

```
xpressdrop/
├── app/xpr/          → Storefront routes
├── app/api/          → API proxy endpoints
├── context/          → CatalogContext (global state)
├── lib/
│   ├── cookie-manager.ts  → Auth cookie rotation
│   └── schemas.ts         → WEIGHT_TAG_MAP, validation
└── hooks/            → useProductRow, etc.
```

## Gotchas

_None captured yet._

## Related Notes

- [[Trajan's Projects]]

#project #xpressdrop #ecommerce #active
