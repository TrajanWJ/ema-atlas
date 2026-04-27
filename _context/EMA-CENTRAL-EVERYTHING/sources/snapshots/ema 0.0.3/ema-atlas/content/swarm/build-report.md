# Next.js production build report

**Result:** PASS on attempt 3 (exit code 0).

**Next version:** 15.5.15
**Routes built:** 73 (Static, SSG, Dynamic mix). Includes `/_not-found`, `/api/graph`, `/api/graph/[topic]`.

## Attempts

### Attempt 1 — fail
Compiled OK, generated 73/73 static pages, then crashed at the very end:
```
[Error [PageNotFoundError]: Cannot find module for page: /_error]
```
No source-level cause. Symptom of a stale / partially-written `.next` dir — Next 15 tries to resolve an internal `/_error` shim and can miss it when the output tree is dirty.

### Attempt 2 — fail (after `rm -rf .next`)
```
[Error [PageNotFoundError]: Cannot find module for page: /_not-found]
[Error [PageNotFoundError]: Cannot find module for page: /api/graph]
[Error: Failed to collect page data for /_not-found]
```
and on a subsequent try, the real underlying error surfaced:
```
Error occurred prerendering page "/questions"
[Error: Cannot find module './1331.js'
Require stack: .next/server/webpack-runtime.js -> .next/server/app/questions/page.js]
Error occurred prerendering page "/launchpad"
[Error: Cannot find module './1331.js' ...]
```
A webpack chunk (`1331.js`) referenced by `webpack-runtime.js` was missing from the emitted output. This is a known Next 15.5.x webpack-cache/parallel-worker race — a stale `node_modules/.cache` entry was producing a runtime manifest that referenced chunks the fresh build did not emit.

### Attempt 3 — pass
Cleared both caches and rebuilt:
```
rm -rf .next node_modules/.cache && npx next build
```
Result: `✓ Compiled successfully`, `✓ Generating static pages (73/73)`, `Finalizing page optimization`, `Collecting build traces`. Exit 0.

## Fixes applied

**None to source files.** The failure was entirely in stale build caches; no `.tsx`, `next.config.*`, `package.json`, `tsconfig.json`, `globals.css`, `_data.ts`, or `lib/ema-atlas.ts` edits were made or required.

## Recommendation

The build is green but fragile against stale `node_modules/.cache`. If the same `MODULE_NOT_FOUND: ./NNNN.js` signature returns in CI, the minimal remediation is to run `rm -rf .next node_modules/.cache` before `next build`, or (out of scope for this lane) pin/upgrade Next past 15.5.15 where the webpack persistent-cache race is reported fixed.

## Left unfixed

Nothing. Build passes cleanly.
