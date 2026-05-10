# Follow-ups deferred from commit hygiene pass - 2026-05-10

## Codex roundtrip proof TTL

Current: `CODEX_ROUNDTRIP_PROOF_TTL_MS = 7 * 24 * 60 * 60 * 1000` (7 days).

Status: 7-day proof cache is readiness evidence, not a liveness guarantee.

Failure mode: `capability assert --required codex` returns `ready` until cache
expiry even if Codex has been removed, auth has rotated, or network is down,
unless a fresh dispatch forces re-validation.

Decision needed before Proslync mission gating relies on it:

- Keep 7 days as evidence-not-liveness.
- Shorten to a duration that approximates session validity.
- Add a forced re-roundtrip command such as `capability assert --force-fresh`.

Not a Lane 2 change. Revisit during mission-gate hardening or as a dedicated
follow-up sprint.

## apps/web build artifact drift

`apps/web/next-env.d.ts` and `apps/web/tsconfig.tsbuildinfo` are tracked in git
but appear as modified from generated-metadata drift unrelated to the hygiene
chains. Decide separately whether to:

- Sweep tracked build artifacts with gitignore plus remove-from-index.
- Commit drift periodically as a build metadata refresh.
- Leave as-is and accept persistent dirty status on those files.

Not blocking Sprint 2.5, B1 parking, Lane 2, or the Lane 3 preflight work.

## Commit split caveat

B1 was cleanly parked on `b1-substrate-parked-2026-05-10`. The integration
branch was more advanced than the original split model: artifact and canon
writeback already formed a buildable preflight slice, and Proslync acceptance
gesture harnesses were also present. Those were committed as explicit preflight
work rather than being hidden inside Sprint 2.5 or Lane 2 labels.
