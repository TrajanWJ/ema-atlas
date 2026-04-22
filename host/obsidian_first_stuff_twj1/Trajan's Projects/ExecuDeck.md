# ExecuDeck

> Executive command environment — dual-surface (terminal + canvas) with multi-agent orchestration and generative UI artifacts.
> Status: Phase 1 (~70% complete) | Started: 2026-02-18

---

## Quick Info

| Field | Value |
|---|---|
| **Location** | `/home/trajan/Desktop/Coding/Projects/execudeck/` |
| **Version** | 0.1.0 |
| **Stack** | Next.js 16.1.6, React 19.2.3, TypeScript 5.x, Tailwind 4, Zustand 5, Zod 3.22 |
| **UI** | shadcn/ui (Radix primitives), Lucide icons |
| **Storage** | IndexedDB (idb-keyval) |
| **Testing** | Vitest |
| **Dev Server** | `npm run dev` (Turbopack) |

## Architecture

Two peer surfaces sharing state via Zustand stores:

```
┌─────────────────────────────────────────────┐
│  TopBar (tabs + mode toggle)                 │
├──────────────────┬──────────────────────────┤
│  Terminal Surface │  Canvas Surface           │
│  - MessageList   │  - PageTree (sidebar)     │
│  - InputBar      │  - PageRenderer            │
│  - GrammarTokens │  - Inspector              │
│  (>, @, #, !)    │  (manifests + components) │
├──────────────────┴──────────────────────────┤
│  StatusBar                                    │
└─────────────────────────────────────────────┘
```

## Current File Structure

```
execudeck/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── providers.tsx
│   └── globals.css
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── SplitView.tsx
│   │   ├── terminal/
│   │   │   ├── TerminalSurface.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBlock.tsx
│   │   │   ├── InputBar.tsx
│   │   │   └── GrammarToken.tsx
│   │   ├── canvas/
│   │   │   ├── CanvasSurface.tsx
│   │   │   ├── PageTree.tsx
│   │   │   ├── PageRenderer.tsx
│   │   │   └── Inspector.tsx
│   │   └── ui/          ← shadcn components
│   │       ├── button, tabs, scroll-area
│   │       ├── collapsible, tooltip
│   │       └── separator
│   ├── contracts/        ← Zod schemas (source of truth)
│   │   ├── tabs.ts
│   │   ├── messages.ts
│   │   ├── manifests.ts
│   │   ├── agents.ts
│   │   ├── proposals.ts
│   │   ├── persistence.ts
│   │   ├── events.ts
│   │   ├── registry.ts
│   │   └── __tests__/schemas.spec.ts
│   ├── state/
│   │   ├── workspace-store.ts
│   │   ├── message-store.ts
│   │   └── manifest-store.ts
│   ├── hooks/
│   │   └── use-persistence.ts
│   ├── lib/
│   │   ├── persistence.ts
│   │   ├── initial-state.ts
│   │   └── utils.ts
│   ├── agents/           ← placeholder
│   ├── canvas/           ← placeholder
│   ├── config/           ← placeholder
│   └── terminal/         ← placeholder
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── STATE_MODEL.md
│   ├── MANIFEST_SYSTEM.md
│   ├── AGENT_MODEL.md
│   ├── CLI_SYSTEM.md
│   ├── TECH_OPTIONS.md
│   └── plans/
│       ├── 2026-02-18-phase1-scaffold-plan.md
│       └── 2026-02-19-creatable-tabs-design.md
├── config/
│   ├── eslint.config.js
│   ├── prettier.config.cjs
│   └── tsconfig.json
├── CLAUDE.md
├── package.json
└── next.config.ts
```

## Dependencies

**Runtime:**

| Package | Version | Purpose |
|---|---|---|
| next | 16.1.6 | App Router framework |
| react / react-dom | 19.2.3 | UI library |
| zustand | ^5.0.0 | State management |
| radix-ui | ^1.4.3 | Accessible primitives |
| idb-keyval | ^6.2.0 | IndexedDB persistence |
| lucide-react | ^0.469.0 | Icons |
| class-variance-authority | ^0.7.0 | Variant styling |
| clsx | ^2.1.0 | Class merging |
| tailwind-merge | ^3.0.0 | Tailwind class dedup |

**Dev:**

| Package | Version | Purpose |
|---|---|---|
| typescript | ^5.0.0 | Type checking |
| tailwindcss | ^4 | Styling |
| vitest | ^1.0.0 | Testing |
| zod | ^3.22.0 | Schema validation |
| eslint + eslint-config-next | ^9 / 16.1.6 | Linting |

## Key Concepts

| Concept | Description |
|---|---|
| **Tabs** | Universal containers (session, page, or hybrid) |
| **Grammar Tokens** | `>` narrative, `@` delegation, `#` status, `!` hint |
| **Manifests** | JSON schemas defining page structure (ComponentNode tree) |
| **Proposal Loop** | Agent proposes → human reviews → accept/reject |
| **Safety Zones** | Z0 (human), Z1 (renderer), Z2 (orchestrator) |

## Agents (Planned)

| Agent | Role |
|---|---|
| **EM** (Executive Management) | High-level planning, agent discovery |
| **MD** (Meta-Development) | Structural/manifest management |
| **Specialists** | Domain-specific (spawned on demand) |

## Phase Progress

- [x] **Phase 0:** Scaffolding & contracts — Zod schemas, docs, project structure
- [ ] **Phase 1:** Core surfaces (~70%) — tabs, split-view, grammar tokens done; terminal interactivity and page tree wiring remaining
- [ ] **Phase 2:** Delegation & proposals — EM→MD hand-off, page proposal flow, clickable tokens (not started)
- [ ] **Phase 3:** Specialist spawning & persistence — agent spawning, IndexedDB persistence, undo/redo, export/import (not started)

### What Exists (Phase 1 Progress)

| Component | Status | Notes |
|---|---|---|
| TopBar + tab management | Done | Mode toggle, tab switching |
| SplitView layout | Done | Terminal/canvas split |
| TerminalSurface + MessageList | Done | Renders message blocks |
| InputBar + GrammarToken | Done | Grammar token parsing |
| CanvasSurface shell | Done | Renders PageTree + PageRenderer |
| PageTree | Built | Sidebar navigation tree |
| PageRenderer | Built | Manifest-driven rendering |
| Inspector | Built | Component inspection panel |
| Zustand stores (3) | Done | workspace, message, manifest |
| Persistence hook | Built | IndexedDB via idb-keyval |
| Contract schemas (8) | Done | tabs, messages, manifests, agents, proposals, persistence, events, registry |
| Schema tests | Done | `schemas.spec.ts` |

### What Remains (Phase 1)

- Terminal interactivity (command execution, response rendering)
- Page tree wiring to manifest store
- Live canvas updates from manifest changes

## Contracts (Source of Truth)

All in `src/contracts/`:
- `tabs.ts` — Tab shape (id, kind, title, artifactId, linkedAgentId)
- `messages.ts` — SessionMessage with OutputBlock union
- `manifests.ts` — PageManifest with ComponentNode tree
- `agents.ts` — Agent identity shape
- `proposals.ts` — Proposal shape
- `persistence.ts` — LocalStateSnapshot
- `events.ts` — Event shapes for inter-component communication
- `registry.ts` — Component registry types

## Docs

Full documentation in `docs/`:
- `ARCHITECTURE.md` — peer surfaces, tabs, proposal loop
- `ROADMAP.md` — phase 0→3 plan
- `STATE_MODEL.md` — entity persistence
- `MANIFEST_SYSTEM.md` — structured artifact editing
- `AGENT_MODEL.md` — agent identities & delegation
- `CLI_SYSTEM.md` — terminal grammar & UI blocks
- `TECH_OPTIONS.md` — technology evaluation
- `plans/` — dated implementation plans

---

## Development Workflows (TBD)

> **These workflows are heavily TBD — to be refined as the Obsidian-Claude integration matures.**

### Daily Development Flow (TBD)
1. Open Obsidian → check project status note
2. `cd execudeck && claude` → Claude reads `CLAUDE.md` + vault context via MCP
3. Work on current phase tasks
4. End of session → update this note with progress
5. Commit changes

### Architecture Decision Flow (TBD)
1. Research in Obsidian vault (tools, patterns, alternatives)
2. Document decision in `docs/` with rationale
3. Update contracts if schema changes needed
4. Link decision back to this project note

### Agent Integration Flow (TBD)
1. Define agent in `src/agents/`
2. Add contract in `src/contracts/agents.ts`
3. Wire delegation tokens in terminal
4. Document agent capabilities in project note

---

## Gotchas

_None captured yet — agents should add entries here when debugging costs >5 min._

## Related Notes

- [[Research - ExecuDeck Tech Landscape 2026]] — tech landscape research (terminal UI, canvas, agents)

---

## Claude Code Integration

- **CLAUDE.md** at project root with conventions
- **MCP Bridge** — vault accessible on port 22360
- **Claudian** — sidebar access when working from Obsidian

#project #execudeck #active
