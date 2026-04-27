# Playbook — add an atlas route

Use this when you're adding a new top-level Next.js route to the EMA
atlas (e.g. `/state-planes`, `/discord-migration`, `/secrets-boundary`).
The user has been adding ~25+ of these in parallel; this playbook
keeps them coherent.

> A route is **part of the atlas presentation layer**, not the
> canonical content. The content the route renders should already exist
> elsewhere (`graph.json`, `content/`, `OPEN_QUESTIONS.md`,
> `GLOSSARY.md`). The route just composes it.

## When to add a route

- You want a navigable URL for an existing piece of context
  (a question, a research doc, a vApp surface, a topic edge).
- You want to render existing content (briefs, matrices, diagrams) in
  a new shape (gallery, board, tour).
- You want to expose a new program-level view (timeline, futures,
  decisions, roles).

## When NOT to add a route

- You're trying to put unique content in the route. **Content lives in
  `content/` or `graph/` or root `*.md`.** Routes only render.
- A sibling route already does this — extend that route instead.
- The view is one-shot demo material — write it to
  `content/demo/<scene>.md` and render in `/demo`.

## Steps

1. **Confirm the slug.**
   - Single-word kebab-case where possible: `/desktop`, `/timeline`,
     `/handoff`, `/ship-order`.
   - For nested concepts: `/parts/[slug]`, `/vapps/[slug]/example`.
   - Slug should match a glossary term where one exists, so the
     auto-linker can wire references.

2. **Pick the load source.** Per `ATLAS_NOTES.md` "Stable data sources":
   - `graph.json` — for nodes, triples, topics, questions, glossary.
   - `lib/markdown.ts` `loadMarkdown(rel)` — for any markdown body.
   - `fs.readdir` for directory listings (research/, content/, howto/).
   - `lib/diagrams.ts` for inline SVG.
   - `lib/decisions.ts` for OPEN_QUESTIONS-derived data.
   - **Never** read across git branches at runtime.

3. **Write `app/<slug>/page.tsx`** as a React Server Component:

   ```tsx
   import { SiteShell } from "@/components/site-shell";
   // import data sources

   export default async function MyRoutePage() {
     const data = await loadSomething();
     return (
       <SiteShell
         eyebrow="<short label>"
         title="<route title>"
         intro="<one-sentence framing>"
       >
         {/* rendered content */}
       </SiteShell>
     );
   }
   ```

4. **Add the route to the data model** in `lib/ema-atlas.ts` if it's
   top-level navigation:

   ```ts
   export const topLevelRoutes = [
     // existing entries — DO NOT REMOVE OR REORDER
     { href: "/<slug>", label: "<Nav label>" },
   ];
   ```

5. **Style with existing CSS classes.** The atlas already has:
   - `.panel` for cards
   - `.chip` for action buttons
   - `.panel__tag` for eyebrow labels
   - `.list__title`, `.list__copy`, `.list__eyebrow`
   - `.stat-ribbon` for hero stats
   - `.route-links`, `.section-grid`, `.card-grid`, `.inline-list`
   - `.qcard`, `.timeline`, `.futures-grid`, `.docs-tier`, `.vapp-card`
   - `.research-list`, `.research-doc`, `.brief`, `.slide`, `.canvas`

   Append new classes to `app/globals.css` only if absolutely needed.

6. **Apply auto-linking** if the route renders markdown:
   ```tsx
   import { decorate, loadGlossaryTerms } from "@/lib/text-decorate";
   const terms = await loadGlossaryTerms();
   // pass `terms` into your markdown renderer
   ```

7. **Update snapshot docs** (this is the easy-to-skip step):
   - `PROJECT_STATUS.md` — add a row to the atlas-route table with
     status (planned / sketched / shipped).
   - `DELIVERABLES_INDEX.md` — add a row to the routes table.
   - `content/api-spec.md` — add the path/method/response/stability row.
   - `MAP.md` — only if the route changes the layout categories.
   - Optionally `AGENT_QUICKREF.md` if it's a tier-1 navigation entry.

8. **Verify:**
   ```bash
   npx next build
   ./scripts/regen-all.sh
   ```
   Build must compile clean. Regen must show 0 warnings.

## Naming conventions

- `app/<topic>/page.tsx` — single-shot route ("/timeline").
- `app/<collection>/page.tsx` + `app/<collection>/[slug]/page.tsx` —
  list + detail pair ("/parts" + "/parts/[slug]").
- `app/<collection>/[slug]/<sub>/page.tsx` — typed sub-views
  ("/scenarios/incident-response", "/tour/for-engineer").
- `app/api/<thing>/route.ts` — JSON API.
- `app/<topic>/_<helper>.ts` — colocated helper (underscore prefix
  prevents Next.js from treating it as a route).

## Anti-patterns

- ❌ Inventing content in the route. Content lives elsewhere.
- ❌ Adding a new npm dep for a single route. Use existing primitives.
- ❌ Inlining SVG strings or diagrams. Use `lib/diagrams.ts`.
- ❌ Hardcoding glossary definitions or open-question text. Read from
  the source files via `lib/markdown.ts`.
- ❌ Skipping the snapshot-doc updates. Routes that aren't tracked rot.
- ❌ Top-level routes that duplicate sub-route paths
  (e.g. `/wiki` and `/vapps/wiki` both rendering wiki content). Decide
  which is canonical.

## Verification

```bash
ls app/<slug>/page.tsx                   # route exists
grep -l "<slug>" lib/ema-atlas.ts        # in topLevelRoutes if top-level
grep "<slug>" PROJECT_STATUS.md          # status row exists
grep "<slug>" DELIVERABLES_INDEX.md      # route catalog row exists
grep "<slug>" content/api-spec.md        # api-spec row exists
npx next build                           # builds clean
```

## Commit message template

```
atlas: add /<slug> route (renders <what>)

- app/<slug>/page.tsx — <one-line on what it shows>
- lib/ema-atlas.ts — topLevelRoutes += /<slug>  (if top-level)
- snapshot updates: PROJECT_STATUS, DELIVERABLES_INDEX, content/api-spec

Status: <planned|sketched|shipped>. Source: <data source(s)>.
```

## Cross-references

- [`ATLAS_NOTES.md`](../ATLAS_NOTES.md) — atlas data model
- [`LIB_DATA_CONTRACT.md`](../LIB_DATA_CONTRACT.md) — schema for `graph.json`
- [`STYLE_GUIDE.md`](../STYLE_GUIDE.md) — voice + form
- [`howto/add-a-deliverable.md`](add-a-deliverable.md) — when the route
  is for a new deliverable format
- [`howto/add-a-vapp.md`](add-a-vapp.md) — when the route is a vApp
- [`howto/refresh-snapshot-docs.md`](refresh-snapshot-docs.md) — to
  keep the snapshots from rotting
