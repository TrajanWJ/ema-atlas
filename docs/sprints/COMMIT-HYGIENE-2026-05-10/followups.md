# Follow-ups deferred from commit hygiene pass - 2026-05-10

## Codex roundtrip proof TTL — RESOLVED 2026-05-10

Current: `CODEX_ROUNDTRIP_PROOF_TTL_MS = 7 * 24 * 60 * 60 * 1000` (7 days).

Status: 7-day proof cache remains as readiness evidence (not a liveness
guarantee). The decision among "keep / shorten / add a force-fresh option" was
resolved by adding the `--force-fresh` flag, which is the most flexible and
least disruptive option:

- Default (`ema capability assert --required codex --json`) reads the 7-day
  cache. Fast-path readiness check; correct for orientation/dashboards.
- Forced (`ema capability assert --required codex --force-fresh --json`)
  bypasses the cache and runs a smoke dispatch every time. Right for
  mission-gate hardening, pre-swarm-launch, and CI gates that must prove the
  Codex pipeline is currently live.

Mechanism: `apps/cli/src/commands/capability.ts` `assertRequired` reads
`flagBool(args, "force-fresh")` and threads it into `CapabilityReportOptions`.
`codexCapability` skips the early cache return when `forceFresh` is set, so
the smoke dispatch always runs on `--force-fresh`.

Mission-gate hardening should adopt `--force-fresh` in the gate's verification
script. Document the flag in any agent-bootstrap recipe that requires
liveness, not just evidence.

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
