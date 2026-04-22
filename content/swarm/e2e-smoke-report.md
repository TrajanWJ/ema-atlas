# EMA Atlas — End-to-End Route Smoke Report

- **Date:** 2026-04-22
- **Target:** `http://localhost:3030` (Next.js dev server)
- **Method:** `curl -s -w '%{http_code} %{time_total}s'` per route; body scanned for `<title>` and for error strings `Build Error | Failed to compile | Unhandled Runtime Error | Module not found`.
- **Route discovery:** `app/**/page.tsx`. Dynamic `[slug]` routes substituted with real slugs from `app/vapps/_data.ts`, `lib/ema-atlas.ts`, and `app/docs/_tiers.ts`.
- **Retries:** Any route that returned `500` or `000` on the cold-start first pass was re-requested; the table below shows the final (warm) result.

## Summary

| Metric | Count |
| --- | --- |
| Total routes tested | 71 |
| 200 OK | 70 |
| 404 | 1 |
| 500 | 0 |
| Pages >5s | 0 |
| Pages with Next.js error strings in body | 0 |
| Pages with non-empty `<title>` | 71 |

## Hot (needs attention)

### /canvas/[slug] is broken

- `/canvas/authority-control-plane` returns **404** consistently after warm-up, and a **500** on some requests. A direct recheck after the main run returned HTTP 500 with body text "could not be found" three times — suggesting the diagram loader throws when expected diagram assets are missing, and the error handler then short-circuits to a not-found response.
- Source: `app/canvas/[slug]/page.tsx` calls `loadDiagrams(slug)` and `DIAGRAM_CAPTIONS[slug]`. Likely missing files under `content/diagrams/` (directory exists per `ls content`, but the specific slug's assets are not rendering).
- Other `/parts`, `/slides`, `/briefs` routes for the same slug all return 200 — the issue is isolated to the canvas route.

### Cold-start 500s (now resolved)

On the first pass, every route that the Next.js dev server had not yet compiled returned 500 or connection-refused (000). The project uses on-demand route compilation; the first hit returns 500 before the module graph finishes. A second request 0–3s later returned 200 for every non-canvas route. No `Build Error / Failed to compile / Module not found` strings appeared in any body, so there are **no genuine compile errors** — only first-hit compile latency. If consumers of this server rely on the very first response per route, add a warm-up script to the dev workflow.

## Notes on route coverage

- `/research/[slug]` route exists but the backing `content/research/` tree is absent; `/research` index renders 200 with no items. No concrete research slug to test, so dynamic route was not probed.
- `/docs/[slug]` tested with `README` and `VISION` — both 200 at 1.09s and 0.12s.
- `/parts/[slug]` tested with `authority-control-plane` and `semantic-layer` — both 200.
- `/slides/[slug]` and `/briefs/[slug]` tested with `authority-control-plane` — 200.
- `/vapps/[slug]` tested with `wiki` and `hq` — both 200.
- `/canvas/[slug]` tested with `authority-control-plane` — **404/500 (hot)**.

## Full results

| path | status | time | title? | err? |
| --- | --- | --- | --- | --- |
| / | 200 | 1.883s | y | - |
| /parts | 200 | 0.208s | y | - |
| /graph | 200 | 0.193s | y | - |
| /desktop | 200 | 0.244s | y | - |
| /demo | 200 | 0.248s | y | - |
| /questions | 200 | 0.370s | y | - |
| /timeline | 200 | 0.342s | y | - |
| /futures-board | 200 | 0.384s | y | - |
| /decisions | 200 | 0.369s | y | - |
| /research | 200 | 0.377s | y | - |
| /vapps | 200 | 0.341s | y | - |
| /launchpad | 200 | 0.459s | y | - |
| /hq | 200 | 0.385s | y | - |
| /wiki | 200 | 0.344s | y | - |
| /threads | 200 | 0.357s | y | - |
| /chat | 200 | 0.429s | y | - |
| /agent-environment | 200 | 0.401s | y | - |
| /hq/project | 200 | 0.734s | y | - |
| /blueprint | 200 | 0.614s | y | - |
| /hq/personal | 200 | 0.713s | y | - |
| /chat/tenanted | 200 | 0.449s | y | - |
| /wiki/node/example | 200 | 0.471s | y | - |
| /launchpad/command | 200 | 0.432s | y | - |
| /threads/bridge | 200 | 0.474s | y | - |
| /artifacts | 200 | 2.060s | y | - |
| /surfaces-map | 200 | 1.174s | y | - |
| /showroom | 200 | 0.352s | y | - |
| /program | 200 | 0.265s | y | - |
| /demo/surface-tour | 200 | 0.295s | y | - |
| /canonical-rule | 200 | 0.298s | y | - |
| /state-planes | 200 | 0.349s | y | - |
| /agent-day | 200 | 0.279s | y | - |
| /handoff | 200 | 0.315s | y | - |
| /driver-matrix | 200 | 0.442s | y | - |
| /project-space | 200 | 0.463s | y | - |
| /human-day | 200 | 0.321s | y | - |
| /incidents | 200 | 0.388s | y | - |
| /chronicle | 200 | 0.427s | y | - |
| /proposal-flow | 200 | 0.413s | y | - |
| /inbox | 200 | 0.377s | y | - |
| /mesh | 200 | 0.367s | y | - |
| /docs | 200 | 0.407s | y | - |
| /open-questions-map | 200 | 0.402s | y | - |
| /ship-order | 200 | 0.389s | y | - |
| /weekly-cadence | 200 | 0.389s | y | - |
| /anti-patterns | 200 | 0.697s | y | - |
| /glossary-app | 200 | 0.465s | y | - |
| /evidence-tiers | 200 | 0.742s | y | - |
| /event-kinds | 200 | 0.625s | y | - |
| /collab-plane-options | 200 | 0.531s | y | - |
| /personal-ai | 200 | 0.432s | y | - |
| /tour/for-skeptic | 200 | 0.416s | y | - |
| /discord-migration | 200 | 0.530s | y | - |
| /tour/for-engineer | 200 | 0.436s | y | - |
| /scenarios/incident-response | 200 | 0.515s | y | - |
| /three-futures-gallery | 200 | 0.915s | y | - |
| /hermes-contract | 200 | 0.483s | y | - |
| /workspace-contract | 200 | 0.614s | y | - |
| /secrets-boundary | 200 | 0.498s | y | - |
| /scenarios/onboarding | 200 | 0.520s | y | - |
| /tour/for-operator | 200 | 0.469s | y | - |
| /surface-index | 200 | 0.492s | y | - |
| /vapps/wiki | 200 | 1.451s | y | - |
| /vapps/hq | 200 | 0.080s | y | - |
| /parts/authority-control-plane | 200 | 0.918s | y | - |
| /parts/semantic-layer | 200 | 0.050s | y | - |
| /slides/authority-control-plane | 200 | 1.135s | y | - |
| /briefs/authority-control-plane | 200 | 1.099s | y | - |
| /canvas/authority-control-plane | 404 | 2.336s | y | - |
| /docs/README | 200 | 1.092s | y | - |
| /docs/VISION | 200 | 0.116s | y | - |

## Reproduction

```bash
# discover routes
ls app/**/page.tsx
# probe with retry after compile-miss
curl -s -o /tmp/body -w '%{http_code} %{time_total}s\n' http://localhost:3030<path>
grep -oE '<title[^>]*>[^<]*</title>' /tmp/body
grep -E 'Build Error|Failed to compile|Unhandled Runtime Error|Module not found' /tmp/body
```

All probes used `--max-time 60` (90s on retry). No response time exceeded 2.4s warm.
