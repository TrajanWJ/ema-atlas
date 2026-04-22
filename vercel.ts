// vercel.ts — typed Vercel project config for the EMA atlas.
//
// Why TypeScript over vercel.json: the atlas is a TS project end-to-end
// and we want type-checked drift-detection on the deploy config. The
// `@vercel/config` package exports the `VercelConfig` type used below.
//
// NOTE: `@vercel/config` is listed in package.json devDependencies but is
// NOT installed yet. Run `npm i` to materialize it before relying on the
// type import at build time. Vercel itself reads this file directly.
//
// Build command rationale: the atlas reads from `graph.json`, the system
// manifest, and `INDEX.md`, all of which are *generated* by the regen
// chain. We must run the chain before `next build` so the deployed app
// renders the freshest graph and not whatever happened to be committed.
// See ATLAS_NOTES.md "Build pipeline" for the canonical chain.

import type { VercelConfig } from "@vercel/config";

const config: VercelConfig = {
  // Next.js detection is automatic, but we pin it for clarity.
  framework: "nextjs",

  // Run the regen chain, then next build. Mirrors scripts/regen-all.sh
  // (check-graph -> manifest -> graph-json -> index) so the deployed
  // atlas always renders the freshest graph.
  buildCommand: "./scripts/regen-all.sh && next build",

  // Default install is fine; pinned for explicitness.
  installCommand: "npm install",

  // Production output dir is the Next.js default; do not override.
  // outputDirectory: ".next",

  // No env vars required currently. Add via Vercel dashboard if/when
  // server-side secrets are introduced (see howto/deploy-atlas.md).
};

export default config;
