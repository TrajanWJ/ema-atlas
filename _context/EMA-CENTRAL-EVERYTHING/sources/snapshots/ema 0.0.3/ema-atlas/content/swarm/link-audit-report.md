# Link Audit Report — EMA Atlas

Scope: every `app/**/page.tsx` route and every internal `href="/..."` or ``href={`/...`}`` in `app/` and `components/`. Read-only audit — no code was changed.

## Summary

- Total routes on disk: **67** (60 static + 7 dynamic)
- Internal link sources scanned: `app/**/*.tsx` + `components/**/*.tsx` + `components/site-shell.tsx` top-nav
- Total internal links scanned: **~405** (384 in `app/`, 11 in `components/`, 22 nav entries in `site-shell.tsx` via `topLevelRoutes`)
- Broken links: **0**
- Orphan routes (zero inbound links, not reachable via top nav, excluding `/surface-index` and `/` hubs): **9**

All `/parts/<slug>` targets resolve to one of the 8 known part slugs in `lib/ema-atlas.ts` (`authority-control-plane`, `harness-execution`, `shared-workspace`, `coordination-environment`, `semantic-layer`, `shells-surfaces`, `identity-project-space`, `mesh-replication`). All `/vapps/<slug>` targets resolve to one of the 8 entries in `app/vapps/_data.ts` (`wiki`, `chat`, `threads-server`, `agent-virtual-environment`, `blueprint`, `launchpad`, `hq`, `virtual-desktop`).

## Routes on disk

Static (60): `/`, `/agent-day`, `/agent-environment`, `/anti-patterns`, `/artifacts`, `/blueprint`, `/canonical-rule`, `/chat`, `/chat/tenanted`, `/chronicle`, `/collab-plane-options`, `/decisions`, `/demo`, `/demo/surface-tour`, `/desktop`, `/discord-migration`, `/docs`, `/driver-matrix`, `/event-kinds`, `/evidence-tiers`, `/futures-board`, `/glossary-app`, `/graph`, `/handoff`, `/hermes-contract`, `/hq`, `/hq/personal`, `/hq/project`, `/human-day`, `/inbox`, `/incidents`, `/launchpad`, `/launchpad/command`, `/mesh`, `/open-questions-map`, `/parts`, `/personal-ai`, `/program`, `/project-space`, `/proposal-flow`, `/questions`, `/research`, `/scenarios/incident-response`, `/scenarios/onboarding`, `/secrets-boundary`, `/ship-order`, `/showroom`, `/state-planes`, `/surface-index`, `/surfaces-map`, `/threads`, `/threads/bridge`, `/three-futures-gallery`, `/timeline`, `/tour/for-engineer`, `/tour/for-operator`, `/tour/for-skeptic`, `/vapps`, `/weekly-cadence`, `/wiki`, `/wiki/node/example`, `/workspace-contract`.

Dynamic (7): `/briefs/[slug]`, `/canvas/[slug]`, `/docs/[slug]`, `/parts/[slug]`, `/research/[slug]`, `/slides/[slug]`, `/vapps/[slug]`.

## Resolves — inbound link counts

Counts are direct `href` matches across `app/` and `components/`. `topLevelRoutes` in `components/site-shell.tsx` provides one additional inbound edge to each of the 22 nav entries on every page, not counted below.

| Target | Inbound | Notes |
|---|---:|---|
| `/questions` | 53 | global CTA on nearly every page |
| `/canonical-rule` | 30 | deep hub |
| `/parts` | 18 | |
| `/state-planes` | 16 | |
| `/launchpad` | 14 | |
| `/hq/project` | 12 | |
| `/vapps` | 11 | |
| `/parts/shared-workspace` | 11 | slug verified |
| `/threads` | 9 | |
| `/parts/authority-control-plane` | 9 | slug verified |
| `/open-questions-map` | 9 | |
| `/agent-environment` | 9 | |
| `/incidents` | 8 | |
| `/hq` | 7 | |
| `/chronicle` | 7 | |
| `/chat` | 7 | |
| `/proposal-flow` | 6 | |
| `/parts/shells-surfaces` | 6 | slug verified |
| `/parts/identity-project-space` | 6 | slug verified |
| `/handoff` | 6 | |
| `/wiki` | 5 | |
| `/vapps/hq` | 5 | slug verified |
| `/graph` | 5 | |
| `/driver-matrix` | 5 | |
| `/tour/for-skeptic` | 4 | |
| `/surfaces-map` | 4 | |
| `/research` | 4 | |
| `/project-space` | 4 | |
| `/parts/harness-execution` | 4 | slug verified |
| `/hq/personal` | 4 | |
| `/desktop` | 4 | |
| `/demo/surface-tour` | 4 | |
| `/tour/for-engineer` | 3 | |
| `/surface-index` | 3 | hub |
| `/showroom` | 3 | |
| `/program` | 3 | |
| `/parts/semantic-layer` | 3 | slug verified |
| `/event-kinds` | 3 | |
| `/blueprint` | 3 | |
| `/artifacts` | 3 | |
| `/anti-patterns` | 3 | |
| `/wiki/node/example` | 2 | |
| `/vapps/wiki` | 2 | slug verified |
| `/vapps/threads-server` | 2 | slug verified |
| `/vapps/chat` | 2 | slug verified |
| `/threads/bridge` | 2 | |
| `/mesh` | 2 | |
| `/futures-board` | 2 | |
| `/docs` | 2 | |
| `/chat/tenanted` | 2 | |
| `/agent-day` | 2 | |
| `/weekly-cadence` | 1 | |
| `/vapps/blueprint` | 1 | slug verified |
| `/vapps/agent-virtual-environment` | 1 | slug verified |
| `/tour/for-operator` | 1 | |
| `/timeline` | 1 | (nav only otherwise) |
| `/three-futures-gallery` | 1 | |
| `/secrets-boundary` | 1 | |
| `/scenarios/incident-response` | 1 | |
| `/parts/coordination-environment` | 1 | slug verified |
| `/inbox` | 1 | |
| `/hermes-contract` | 1 | |
| `/glossary-app` | 1 | |
| `/` | 1 | (also covered by nav) |

### Dynamic-target link counts

| Target pattern | Inbound | Notes |
|---|---:|---|
| `/parts/${part.slug}` | 10 | emits to `/parts/[slug]` — any resolved `part.slug` is one of 8 known slugs |
| `/slides/${part.slug}` | 9 | emits to `/slides/[slug]` |
| `/canvas/${part.slug}` | 9 | emits to `/canvas/[slug]` (one with `#diagrams` anchor) |
| `/briefs/${part.slug}` | 8 | emits to `/briefs/[slug]` |
| `/vapps/${v.slug}` | 6 | emits to `/vapps/[slug]` — 8 known vapp slugs |
| `/docs/${relToSlug(...)}` | 5 | emits to `/docs/[slug]` — dynamic, slug derived from file path |
| `/research/${file.slug}` | 1 | emits to `/research/[slug]` |
| `/research/parts--${part.slug}` | 1 | emits to `/research/[slug]` — slug format matches `relToSlug` in `app/research/page.tsx` |

Note: `/parts/shared-workspace#diagrams` is not a link here — the `#diagrams` fragment appears on a `/canvas/${part.slug}#diagrams` link, which is a valid dynamic canvas route with an anchor. Fragments are not verified.

## Broken links

**None found.**

Every static `href="/..."` points to an existing route on disk. Every dynamic `href={\`/...\${slug}\`}` target is either (a) consumed by a dynamic `[slug]` route that exists, or (b) enumerated from a known slug list (`parts` in `lib/ema-atlas.ts` or `vapps` in `app/vapps/_data.ts`), all of whose slugs are valid.

`/parts/<slug>` targets seen: `authority-control-plane`, `harness-execution`, `shared-workspace`, `coordination-environment`, `semantic-layer`, `shells-surfaces`, `identity-project-space`. All are in the 8-slug whitelist. `mesh-replication` is in the whitelist but has no direct inbound link outside generated `/parts/[slug]` enumerations from `parts.map(...)` on `/`, `/parts`, `/demo`, `/three-futures-gallery`, `/showroom`, etc. (covered by the dynamic counts above).

`/vapps/<slug>` targets seen: `hq`, `wiki`, `chat`, `threads-server`, `agent-virtual-environment`, `blueprint`. `launchpad` and `virtual-desktop` receive inbound edges only via `vapps.map(...)` in `/vapps`, `/launchpad`, `/launchpad/command`, `/surfaces-map`, `/ship-order` (covered by the dynamic `/vapps/${v.slug}` count of 6).

## Orphan routes

Routes that exist on disk but receive **zero inbound links** from any `app/` or `components/` source and are **not present in `topLevelRoutes`** (the top nav). Hubs `/surface-index` and `/` are excluded by rule.

| Route | Source file | Notes |
|---|---|---|
| `/collab-plane-options` | `app/collab-plane-options/page.tsx` | Not linked from anywhere; not in nav. |
| `/discord-migration` | `app/discord-migration/page.tsx` | Not linked from anywhere; not in nav. |
| `/evidence-tiers` | `app/evidence-tiers/page.tsx` | Not linked from anywhere; not in nav. |
| `/human-day` | `app/human-day/page.tsx` | Not linked from anywhere; not in nav. Has outbound links to `/agent-day`, `/canonical-rule`, `/hq`, `/wiki`, `/launchpad`. |
| `/launchpad/command` | `app/launchpad/command/page.tsx` | Not linked from anywhere; not in nav (parent `/launchpad` is). |
| `/personal-ai` | `app/personal-ai/page.tsx` | Not linked from anywhere; not in nav. |
| `/scenarios/onboarding` | `app/scenarios/onboarding/page.tsx` | Not linked from anywhere; not in nav. `/scenarios/incident-response` is linked from it but there is no reciprocal path in. |
| `/ship-order` | `app/ship-order/page.tsx` | Not linked from anywhere; not in nav. |
| `/workspace-contract` | `app/workspace-contract/page.tsx` | Not linked from anywhere; not in nav. |

Routes covered only by the top nav (reachable but no body-content inbound edges): `/demo`, `/decisions`, `/docs`, `/timeline` have 0–2 inbound body links and are included in `topLevelRoutes`, so they are reachable and not counted as orphans.

## Method notes

1. Route list generated from `app/**/page.tsx` via glob, with `[slug]` preserved as the dynamic marker and `app/` / `/page.tsx` stripped.
2. Link extraction used two ripgrep passes across `app/` and `components/`: one for `href="/..."` strings and one for ``href={`/...`}`` template literals.
3. Slug validation:
   - Part slugs cross-checked against `lib/ema-atlas.ts` (8 slugs).
   - vApp slugs cross-checked against `app/vapps/_data.ts` (8 slugs).
   - `/research/parts--<slug>` verified against `research/parts/*.md` (8 files, all 8 part slugs).
4. Fragment identifiers (e.g. `#diagrams`) were not verified against page anchors; only the path portion was checked.
5. External `href` (protocol-prefixed URLs) excluded.

## Report-back numbers

- Total routes on disk: **67** (60 static + 7 dynamic)
- Total internal links scanned: **~405**
- Broken count: **0**
- Orphan count: **9**
