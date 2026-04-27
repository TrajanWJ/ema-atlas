// Registry of every monorepo deliverable. Consumed by the hub navigator (F1),
// docs (F4), and status dashboard (G5). Populated from autharis/_shared/lanes.md
// and the root README.md on 2026-04-22.

export type Deliverable = {
  slug: string;
  name: string;
  stack: string;
  dir: string;
  lane: string;
  devUrl?: string;
};

export const deliverables: readonly Deliverable[] = [
  // Anchor product
  {
    slug: "autharis",
    name: "Autharis (Next.js prototype)",
    stack: "Next.js 16 + React 19",
    dir: "autharis",
    lane: "B1/B2/B3/B4/C1",
    devUrl: "http://localhost:3000",
  },

  // Wave 4 — monorepo ecosystem
  {
    slug: "hub",
    name: "Monorepo hub navigator",
    stack: "Astro (static)",
    dir: "apps/hub",
    lane: "F1",
    devUrl: "http://localhost:4321",
  },
  {
    slug: "tokens",
    name: "Shared design tokens",
    stack: "TypeScript + CSS",
    dir: "packages/tokens",
    lane: "F2",
  },
  {
    slug: "ui",
    name: "Shared UI primitives",
    stack: "TypeScript + React",
    dir: "packages/ui",
    lane: "F3",
  },
  {
    slug: "docs",
    name: "Public docs site",
    stack: "Starlight or Nextra (MDX)",
    dir: "apps/docs",
    lane: "F4",
    devUrl: "http://localhost:4322",
  },
  {
    slug: "storybook",
    name: "Storybook catalog",
    stack: "Storybook 8",
    dir: "apps/storybook",
    lane: "F5",
    devUrl: "http://localhost:6006",
  },
  {
    slug: "api",
    name: "Fastify API service",
    stack: "Fastify + TypeScript",
    dir: "services/api",
    lane: "F6",
    devUrl: "http://localhost:3001",
  },
  {
    slug: "matching",
    name: "Python matching microservice",
    stack: "Python 3.12 + FastAPI",
    dir: "services/matching",
    lane: "F7",
    devUrl: "http://localhost:8000",
  },
  {
    slug: "events",
    name: "Bun WebSocket gateway",
    stack: "Bun + native WS",
    dir: "services/events",
    lane: "F8",
    devUrl: "ws://localhost:3002",
  },

  // Wave 5 — deliverable breadth
  {
    slug: "mobile",
    name: "Expo talent mobile app",
    stack: "Expo / React Native",
    dir: "apps/mobile",
    lane: "G1",
  },
  {
    slug: "cli",
    name: "Autharis CLI",
    stack: "oclif + Node",
    dir: "apps/cli",
    lane: "G2",
  },
  {
    slug: "extension",
    name: "Browser extension",
    stack: "Plasmo / WXT (MV3)",
    dir: "apps/extension",
    lane: "G3",
  },
  {
    slug: "email",
    name: "Transactional email templates",
    stack: "react-email",
    dir: "apps/email",
    lane: "G4",
  },
  {
    slug: "status",
    name: "Status / uptime dashboard",
    stack: "Next.js or Astro",
    dir: "apps/status",
    lane: "G5",
  },
  {
    slug: "desktop",
    name: "Tauri admin desktop",
    stack: "Tauri + Rust + React",
    dir: "apps/desktop",
    lane: "G6",
  },
  {
    slug: "warehouse",
    name: "dbt + DuckDB warehouse",
    stack: "dbt + DuckDB (Python)",
    dir: "services/warehouse",
    lane: "G7",
  },
  {
    slug: "sdk",
    name: "@autharis/sdk — typed TS SDK",
    stack: "TypeScript (dual ESM/CJS)",
    dir: "packages/sdk",
    lane: "G8",
  },
] as const;
