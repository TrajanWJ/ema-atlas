# DispoHub

> Real estate wholesale deal marketplace — connects wholesalers with investors. Full platform with deal listing, AI matching, escrow pipeline, subscriptions, and contract generation.

## Quick Info

| Field | Value |
|---|---|
| **Location** | `/home/trajan/Desktop/Coding/Projects/dispohub/` |
| **Stack** | React 19, Vite 7, Express 4, lowdb 7 (JSON), Electron 33 |
| **Auth** | JWT (bcryptjs) |
| **Real-time** | Socket.IO |
| **Charts** | Recharts 3 |
| **Deploy** | Vercel serverless + Electron desktop |
| **Status** | Production-ready |

## Architecture

Monorepo with 3 workspaces:

```
dispohub/
├── client/     → React 19 + Vite 7 (SPA)
├── server/     → Express 4 + lowdb (JSON file DB)
└── electron/   → Desktop wrapper
```

Key services:
- `matchingEngine` — AI-powered deal-investor matching
- `escrowService` — Transaction state machine
- `reputationEngine` — Ratings system

RBAC: Wholesaler, Investor, Admin roles.

## Features

- Deal listing and management
- Offer management pipeline
- Escrow state machine (transaction tracking)
- 8 real estate calculators
- AI matching engine
- Tiered subscriptions
- Contract generation
- CSV export, favorites, lead status tracking

## Gotchas

_None captured yet._

## Related Notes

- [[Trajan's Projects]]

#project #dispohub #real-estate #active
