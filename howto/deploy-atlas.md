# Deploy the EMA atlas

The atlas is a Next.js 15 / React 19 / TypeScript app that renders the
generated graph artifacts (`graph.json`, `SYSTEM_MANIFEST.json`,
`INDEX.md`) plus the route content under `app/`, `lib/`, and
`content/`. Deployment target is **Vercel** because the app uses RSCs,
dynamic routes, and a couple of route handlers that don't fit a static
export.

The deploy config lives in `vercel.ts` at the repo root. It pins
`framework: "nextjs"` and runs `./scripts/regen-all.sh && next build`
so the deployed atlas always renders freshly-regenerated graph data
(see `ATLAS_NOTES.md` "Build pipeline" for the canonical chain).

## Path A — Vercel dashboard (recommended)

1. Go to <https://vercel.com/new>.
2. **Import Git Repository** and pick `TrajanWJ/ema-atlas`.
3. Framework preset: leave as **Next.js** (Vercel auto-detects; the
   `vercel.ts` file confirms it).
4. Production branch: **`main`**.
5. Build & Output Settings: leave defaults — `vercel.ts` overrides
   the build command to include the regen chain.
6. Environment variables: **none currently required.**
7. Click **Deploy**. The first build runs `npm install`, then
   `scripts/regen-all.sh`, then `next build`.
8. Subsequent pushes to `main` deploy to production automatically.
   Pushes to other branches create preview deployments.

## Path B — Vercel CLI

For one-off deploys from a local checkout (e.g. you want to ship a
preview without pushing a branch):

```bash
npm i -g vercel        # one time
vercel login           # one time
vercel link            # one time per machine; binds repo to a Vercel project
vercel deploy          # preview deployment
vercel deploy --prod   # production deployment
```

`vercel deploy` reads `vercel.ts` from the repo root and runs the same
build command Path A uses.

## Path C — Self-host as static export

**Not supported as-is.** The atlas relies on:

- React Server Components (`app/**/page.tsx`)
- Dynamic route segments such as `app/docs/[slug]/page.tsx`,
  `app/parts/[slug]/page.tsx`, `app/research/[slug]/page.tsx`,
  `app/vapps/[slug]/page.tsx`
- Route handlers under `app/api/graph/route.ts` and
  `app/api/graph/[topic]/route.ts`

`next export` (or `output: "export"` in `next.config.mjs`) cannot emit
a working build for any of those. If you genuinely need self-hosting,
the supported path is `next start` behind a Node-capable host
(Docker, Fly.io, Railway, a long-running EC2/VPS — anywhere
Node 20+ runs). Run the regen chain at build time exactly like
`vercel.ts` does:

```bash
npm ci
./scripts/regen-all.sh
npx next build
npx next start -p 3000
```

The `/api/graph` endpoint will then serve from that host instead of
the Vercel edge.

## Verifying a deploy

After a deploy lands, hit `/api/graph` on the deployed URL and
compare counts against your local dev server:

```bash
curl https://<your-deploy>.vercel.app/api/graph | jq '.counts'
curl http://localhost:3000/api/graph | jq '.counts'
```

The two should match. If they don't, the regen chain on Vercel
either failed silently or ran against a stale checkout — check the
build logs in the Vercel dashboard for the `regen-all` step.

Spot-check a couple of dynamic routes too:

- `/parts` and `/parts/<a-known-slug>`
- `/docs` and `/docs/<a-known-slug>`
- `/graph`
- `/api/graph/<a-known-topic>`

## Environment variables

**None required today.** If/when secrets are introduced (e.g. an
analytics key, an auth provider, an LLM proxy), they go in the Vercel
project's **Settings → Environment Variables** panel, scoped per
environment (Production / Preview / Development). Mirror the names
into a local `.env.local` for `npm run dev`. Do not commit secrets.

## Rolling back

Vercel keeps every prior deployment addressable. To roll back:

1. Open the project in the Vercel dashboard.
2. Go to **Deployments**.
3. Find the last known-good deployment.
4. Click the `…` menu → **Promote to Production**.

The promotion is instant (it just swaps which deployment the
production alias points at) and is fully reversible — promote the
later deployment back when the regression is fixed. No rebuild runs
during a rollback, so the freshness of `graph.json` matches whatever
the rolled-back deployment was built against; if you need fresher
graph data, push a new commit instead of rolling back.

## What this deploy scaffolding does NOT include

- No real Vercel project is provisioned by this config — these files
  only describe how to deploy. Path A or B actually creates the
  project.
- No CI-side deploy. `.github/workflows/atlas-ci.yml` only runs
  regen + `next build` to catch breakage; Vercel's own GitHub
  integration handles deploys.
- No domain config. Add custom domains via the Vercel dashboard.
