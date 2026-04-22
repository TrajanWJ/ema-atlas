# Truks

> Full-stack dispatch/fleet management OS — multi-platform (web, iOS, desktop). Three related sub-projects under one umbrella.

## Quick Info

| Field | Value |
|---|---|
| **Location** | `/home/trajan/Desktop/Coding/Projects/truck stuff/` |
| **Status** | Phase 1 active |

## Sub-Projects

### Truks (Dispatch OS) — Main App

| Field | Value |
|---|---|
| **Path** | `truck stuff/Truks/` |
| **Stack** | Next.js 16, React 19, TypeScript, Tailwind 4, Express, Prisma, PostgreSQL |
| **Mobile** | Expo (React Native) at `dispatch-ios/` |
| **UI** | Radix UI, Framer Motion, Recharts |
| **Auth** | JWT |
| **Storage** | Cloudflare R2 (docs), falls back to local dev |

Phase 1: Express + Prisma + Postgres implemented. Load management, document management (RateCon/POD), role-based access. Seeded data: admin@local.dev / 1234.

### Truks-Scraping — FMCSA Lead Scraper

| Field | Value |
|---|---|
| **Path** | `truck stuff/Truks-Srapping/` |
| **Stack** | Express, Vanilla JS, better-sqlite3, Socket.IO, Cheerio |

Web scraper for FMCSA/SAFER carrier databases. Dashboard for managing leads (add, edit, tag, export CSV). Real-time scraping progress via Socket.IO.

### Truk Landing — Marketing Site

| Field | Value |
|---|---|
| **Path** | `truck stuff/truk landing/` |
| **Stack** | React 19, Vite 7, Three.js, React Three Fiber, Framer Motion, Lenis |

3D-heavy landing page with smooth scroll animations.

## Gotchas

_None captured yet._

## Related Notes

- [[Trajan's Projects]]

#project #truks #trucking #active
