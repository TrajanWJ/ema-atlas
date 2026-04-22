---
type: project
wiki_id: projects/Trajan_s_Projects
imported_from: vault/Projects/Trajan's Projects.md
imported_at: '2026-04-04T00:23:56.901Z'
tags: []
summary: ''
---
# Trajan's Projects

> Active and planned development projects. Each project is a sub-graph of linked notes.

---

## Active

| Project | Status | Stack | Location |
|---|---|---|---|
| [[Proslync]] | Phase 1 Complete — Showcase Running | Next.js 16, FastAPI, PostgreSQL, Pinecone | `~/Desktop/Coding/Projects/proslync` |
| [[ExecuDeck]] | Phase 1 (70%) | Next.js 16, React 19, TypeScript, Tailwind 4 | `~/Desktop/Coding/Projects/execudeck/` |
| [[LetMeScale]] | In Progress — Cinematic Redesign | Next.js 15, TypeScript, Tailwind v4, Framer Motion | `~/Desktop/Coding/Projects/letmescale` (docs moved to `Archive/LetMeScale-docs/`) |
| [[DispoHub]] | Production-ready | React 19, Vite 7, Express 4, Electron 33 | `~/Desktop/Coding/Projects/dispohub` |
| [[Truks]] | Phase 1 active | Next.js 16, Express, Prisma, PostgreSQL, Expo | `~/Desktop/Coding/Projects/truck stuff/` |
| [[XpressDrop]] | Production demo | Next.js 15, Zustand, Zod | `~/Desktop/Coding/Projects/xpressdrop` |
| [[Pomodoro (FlexiFocus)]] | Active dev (v2) | Preact, Vite, TypeScript, PWA | `~/Desktop/Coding/Projects/pomodoro` |
| [[JarvisAI]] | Phase 1 — VM + Docker Setup | KVM, Ubuntu 24.04, Docker, OpenClaw, Mission Control | `~/Desktop/JarvisAI/` |
| [[QuickNotes]] | Phase 1 — Initial Build | Python 3.12, PySide6 (Qt 6) | `~/Desktop/quicknotes/` |

## Planned / Pre-Build

| Project | Status | Stack | Location |
|---|---|---|---|
| [[Wilson Premier Agent Platform]] | Phase 0 — Feasibility | Python, OpenAI Agents SDK, n8n, PostgreSQL, pgvector, Docker | `~/Desktop/wilson ai bs/` |

## Archive / Prototype

| Project | Status | Stack | Location |
|---|---|---|---|
| [[Blueprint Media Archive]] | Prototype | TypeScript, Express, Python, Playwright | `~/Desktop/Coding/Projects/blueprint-media-full-archive` |

---

## Project Sub-Graph Structure

Every project note is the **hub** of a sub-graph. Related notes link back to the project note and are listed in its "Related Notes" section. Agents must build and maintain these connections.

```
                    ┌─────────────────┐
                    │  Project Note   │  ← hub (Trajan's Projects/)
                    │  (status, arch, │
                    │   phase, quick  │
                    │   info)         │
                    └────────┬────────┘
          ┌──────────┬───────┼───────┬──────────┐
          ▼          ▼       ▼       ▼          ▼
    Architecture  Research  People  Learnings  Session
    Design Doc    Notes     Notes   & Gotchas  Logs
    (here or      (here or  (Contacts  (Learnings  (Session
     Session       AI        & People/) & Gotchas/) Log/)
     Log/)        Knowledge/)
```

### Required sub-graph nodes

Every project MUST have these linked from a `## Related Notes` section at the bottom of the project note:

| Node type | Location | When to create |
|---|---|---|
| Architecture design doc | `Trajan's Projects/` (same folder) | When architecture decisions are made |
| Research notes | `Trajan's Projects/` or `AI Knowledge/` | When tech landscape is researched |
| People notes | `Contacts & People/` | When a client/collaborator is associated |
| ADRs | `Session Log/` | When a significant decision is recorded |
| Session logs | `Session Log/` | Every session that touches this project |

### Linking rules

- Project note links OUT to all related notes via `## Related Notes`
- Related notes link BACK to the project note (e.g., `See also: [[Proslync]]`)
- Use the project tag (e.g., `#proslync`, `#execudeck`) on all related notes for searchability
- When creating a new note related to a project, ALWAYS update the project note's `## Related Notes`

---

## How Projects Connect to the Vault

Each project has:
1. A note here with status, architecture, and phase progress
2. A `CLAUDE.md` at the project root with conventions
3. MCP bridge access to this vault for broader context
4. A sub-graph of related notes across the vault

#projects #active
