// Public surface for @ema/contracts-ts.
//
// This package re-exports the codegen output verbatim. Consumers should
// import from "@ema/contracts-ts" and let TS resolve to ./generated.
//
// To regenerate, run `pnpm --filter @ema/contracts-ts generate` from the
// repo root (or `pnpm generate` from this package). The source of truth
// lives in packages/contracts/events/*.md.
export * from "./generated/index.ts";
