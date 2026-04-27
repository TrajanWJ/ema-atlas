# Kor — Autharis monorepo

Remote hourly talent marketplace ecosystem. Multiple deliverables across different stacks, coordinated by a swarm control plane.

## Layout

```
.
├── autharis/              Next.js 16 prototype (the main product surface)
├── apps/
│   ├── hub/               Static navigator linking every deliverable (F1)
│   ├── docs/              Public docs site (F4)
│   └── storybook/         Component catalog (F5)
├── packages/
│   ├── tokens/            Design tokens — CSS + TS (F2)
│   └── ui/                Shared UI primitives (F3)
├── services/
│   ├── api/               Fastify + TypeScript backend (F6)
│   ├── matching/          Python FastAPI matching microservice (F7)
│   └── events/            Bun WebSocket gateway (F8)
├── src/, index.html       Read-only design prototype reference
└── autharis/_shared/      Swarm control plane (lanes, dispatch, decisions)
```

## Stack diversity (intentional)

- Next.js 16 + React 19 (autharis)
- Astro static (hub)
- Fastify + Node (services/api)
- Python 3.12 + FastAPI (services/matching)
- Bun + native WS (services/events)
- MDX docs, Storybook 8

Each deliverable lives in its own workspace so stacks can evolve independently. The hub surfaces all of them to humans.

## Running

```bash
pnpm install
pnpm dev          # all workspace dev servers in parallel
pnpm dev:hub      # just the navigator
pnpm dev:web      # just the Next.js app
```

Python service has its own setup — see `services/matching/README.md`.

## Swarm coordination

All multi-agent coordination happens in `autharis/_shared/`:

- `lanes.md` — live lock sheet (lanes CT, U0, A1–B4, D1–D8, E1–E8, F1–F8, C1, V1)
- `dispatch/` — copy-paste prompts for launching lane sessions
- `decisions.md` — append-only decision log
- `handoffs/` — cross-lane asks

Read `autharis/_shared/README.md` before writing code anywhere in this repo.
