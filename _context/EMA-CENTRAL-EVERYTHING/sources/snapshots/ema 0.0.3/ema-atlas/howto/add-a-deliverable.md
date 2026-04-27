# Playbook — add a deliverable

A **deliverable** is anything the EMA Atlas presents that expresses the
project: brief, slide deck, canvas board, diagram, animation, mockup,
embedded codebase reference, PDF export, etc. Each deliverable lives at
the intersection of (a) one or more parts of EMA and (b) one or more
formats.

## Format inventory (current + planned)

| Format | Where it lives | Status |
|---|---|---|
| Brief (Markdown, screen + print-friendly) | `content/briefs/<slug>.md` rendered by `app/briefs/[slug]/page.tsx` | active |
| Slide deck (Next.js page route) | `app/slides/[slug]/page.tsx` | active |
| Canvas board (Next.js page route) | `app/canvas/[slug]/page.tsx` | active |
| Mermaid diagram | `content/diagrams/<slug>/<name>.mmd` | active (24 generated) |
| Excalidraw embed | TBD `content/excalidraw/<slug>/<name>.excalidraw` | planned |
| Remotion animation | TBD `content/remotion/<slug>/<name>/` | planned |
| Printable PDF | generated from a brief via `scripts/build-pdfs.sh` | stub |
| Codebase reference embed | `app/desktop/` (place.org-style spatial surface) | active |
| Decision card | `components/decision-card.tsx` rendered on `/decisions` | active |
| Futures card | `components/futures-grid.tsx` rendered on `/futures-board` | active |
| Mockup (screenshot or static image) | TBD `content/mockups/<slug>/<name>.png` | planned |

## Steps to add a deliverable

1. **Pick the part(s) it expresses.** Get the slug from `lib/ema-atlas.ts`.
   If the deliverable is part-agnostic (e.g. it covers all three universal
   stances), use `_global` as slug.

2. **Pick the format.** If it's a new format, see "Adding a new format"
   below.

3. **Write the artifact** in the format's canonical location. For
   example, a new brief goes at `content/briefs/<slug>.md`. Match the
   existing structure of sibling briefs in the same directory.

4. **Wire the route** if needed. Existing dynamic routes
   (`/briefs/[slug]`, `/slides/[slug]`, `/canvas/[slug]`) auto-pick up
   new content if your loader reads from `content/<format>/<slug>`.

5. **Add a chip.** On the relevant `app/parts/[slug]/page.tsx` "Artifact
   Routes" section (or in the `Part.deliverables` list in
   `lib/ema-atlas.ts`), add a label. Don't link to a route that doesn't
   exist yet — leave the chip disabled if the deliverable is a stub.

6. **Cross-reference into the graph** if the deliverable cites or replaces
   doctrine that lives in a graph node. Add the new file to the relevant
   `graph/edges/<topic>.md` "Cross-references" section, and to the cited
   node's `referenced_in_docs:` frontmatter.

7. **Update `CHANGELOG.md`** with one bullet under the current wave/pass.

## Adding a new format

If the deliverable is in a format we don't have yet (e.g. you're the
first to ship a Remotion video):

1. Create the canonical directory: `content/<format-name>/`.
2. Write a tiny `app/<format-name>/[slug]/page.tsx` that loads and renders
   one artifact.
3. Add a row to the **Format inventory** table at the top of this file.
4. Add the format to the `Part.deliverables` vocabulary in
   `lib/ema-atlas.ts` (it's a free-form `string[]` today; if it gets
   typed, do that too).
5. If the format has a build step (PDF generation, video render),
   add a script at `scripts/build-<format>.sh` and wire it into
   `prebuild` if it's deterministic.

## Verification

```bash
npx next build                  # should build clean
./scripts/check-graph.sh        # graph still consistent
./scripts/index.sh              # INDEX.md picks up new content
```

Manually open the new deliverable in the dev server (`npm run dev`) and
verify it renders.

## Anti-patterns

- ❌ Embedding deliverable content directly in `app/<route>/page.tsx`.
  Content goes in `content/`, the route only renders.
- ❌ Inventing a new vision or stance for a part. The 3 visions per part
  are canonical (see `lib/ema-atlas.ts`); deliverables express them, not
  rewrite them.
- ❌ Shipping a deliverable that contradicts the canonical rule
  ("EMA owns truth, Hermes owns execution, surfaces do not own state").
  If a deliverable's argument requires breaking the rule, file a question
  against `OPEN_QUESTIONS.md` first.
- ❌ Adding a deliverable that cites a vault candidate term as if it's
  canonical. Vault candidates are in `GLOSSARY.md` under "Vault candidate
  terms" — promote them via `howto/promote-vault-term.md` before relying
  on them in user-facing copy.

## Cross-references

- [`ATLAS_NOTES.md`](../ATLAS_NOTES.md) — atlas data model
- [`LIB_DATA_CONTRACT.md`](../LIB_DATA_CONTRACT.md) — formal schema
- [`lib/ema-atlas.ts`](../lib/ema-atlas.ts) — `Part.deliverables`
- [`CONTRIBUTING_TO_GRAPH.md`](../CONTRIBUTING_TO_GRAPH.md) — graph rules
- [`howto/promote-vault-term.md`](promote-vault-term.md) — promote a candidate term
