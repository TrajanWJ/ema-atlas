# @autharis/hub

Static navigator landing page linking every deliverable in the Autharis monorepo.

Owned by swarm **Lane F1**. Not yet held. See `../../autharis/_shared/dispatch/lane-F1-hub.md` for the dispatch prompt.

## Intended stack

- Astro 4 static site
- Zero JS on the critical path; island-style accents only if needed
- Pulls a registry from `packages/tokens/deliverables.ts` (or its own `src/deliverables.ts`) listing every app/service with name, description, status, entry URL

## What it must render

- Hero with Autharis wordmark (reused from `packages/ui` once F3 lands)
- Grid of deliverable cards: Web app, Docs, Storybook, API, Matching service, Events gateway, Prototype
- Lane status chip on each card fed from `autharis/_shared/lanes.md` (parsed at build time)
