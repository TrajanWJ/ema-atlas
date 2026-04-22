// vercel.ts — typed Vercel project config for the EMA atlas.
//
// Why TypeScript over vercel.json: the atlas is a TS project end-to-end
// and we want a small amount of type-checking on the deploy config without
// making the local build depend on Vercel-specific packages.
//
// Build command rationale: the atlas reads from `graph.json`, the system
// manifest, and `INDEX.md`, all of which are *generated* by the regen
// chain. We must run the chain before `next build` so the deployed app
// renders the freshest graph and not whatever happened to be committed.
// See ATLAS_NOTES.md "Build pipeline" for the canonical chain.

type VercelConfig = {
  framework?: string;
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
};

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
