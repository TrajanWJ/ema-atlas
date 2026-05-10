# EMA-0.0.6 Stash Triage — 2026-05-10

Two stashes sitting on `bootstrap/m2-m3-shell-port` since the earlier substrate work. Both are **architecturally superseded** by the 42-commit body that landed afterward. Recommendation: **drop both** before the umbrella push.

Verification was done by comparing each stashed change against the current HEAD content. Where the same change already exists in HEAD, the stash is redundant.

## stash@{0} — "0.0.6 architecture audit + rearch campaign opened; doc drift sync"

13 files, 1,747 LOC of stash diff. CLI cockpit + web cockpit + e2e tests + tooling.

| File | Change in stash | Status in HEAD | Verdict |
|---|---|---|---|
| `apps/cli/src/commands/cockpit.ts` | Replace `inferClient` / `discoverBuilds` / `inferSurfaces` with project-registry-backed equivalents | Already migrated to `getRegistryForProject` via commit `5472ef7 ema: proslync-first cockpit readiness` (Sprint 3) | **superseded** |
| `apps/cli/dist/bin.js` | Build artifact | Will regenerate on next `pnpm build:cli` | **drop** (build output) |
| `apps/cli/tsconfig.tsbuildinfo` | Build artifact | Will regenerate | **drop** |
| `apps/web/app/api/cockpit/projection/route.ts` | Cockpit projection API tweaks | Sprint 2 + Sprint 3 work has reshaped this | **superseded** |
| `apps/web/src/vapps/cockpit/components/agent-chat.tsx` | Component edit | Sprint 4 (`f775725 sprint4: agent workspace v2`) reworked agent surfaces | **superseded** |
| `apps/web/src/vapps/cockpit/components/capture-form.tsx` | Component edit | Same | **superseded** |
| `apps/web/tests/e2e/all-usable-vapps.spec.ts` | E2E spec | Sprint 7 (`6539ceb sprint7: unify vApp route, frame, and mode contracts`) reshaped routing → spec changes | **likely superseded** |
| `apps/web/tests/e2e/cockpit-proslync.spec.ts` | E2E spec | Same | **likely superseded** |
| `apps/web/tests/e2e/launchpad-cockpit.spec.ts` | E2E spec | Same | **likely superseded** |
| `apps/web/tests/e2e/proslync-first-vapps.spec.ts` | E2E spec | Same | **likely superseded** |
| `apps/web/tsconfig.tsbuildinfo` | Build artifact | Regenerates | **drop** |
| `package.json` | Possibly script additions | Compare diff before dropping | **review then drop** |
| `tooling/ema-functional-e2e.mjs` | Tooling helper | Already fully present in HEAD per `+367 LOC` in unpushed body | **superseded** |

**Action**: `git stash drop stash@{0}` after a 5-minute review of `package.json` to confirm no unique script entries.

## stash@{1} — "Docs: CWT vApp launch contract + master orchestration plan"

8 files, 359 LOC of stash diff. Daemon-internals and CLI handoff/help.

| File | Change in stash | Status in HEAD | Verdict |
|---|---|---|---|
| `apps/daemon/src/ema_daemon/bus.gleam` | Adds `SwarmRegistryProjection(reply)` message variant + handler at handle/3 + public `swarm_registry_projection_json(bus)` fn | **Identical content already at lines 79, 589-590, 1420-1421 of current bus.gleam** (added by `7dff118 Add daemon-backed swarm registry`) | **fully superseded** |
| `packages/contracts/events/catalog.v0.md` | Adds `swarm.created/started/paused/stopped/report_generated` events under new `## swarm` heading | Same 5 events already at lines 141-142+ of current catalog.v0.md | **fully superseded** |
| `apps/daemon/src/ema_daemon/event_envelope.gleam` | Likely paired event-envelope shape change for swarm events | Companion to bus change above; would be in HEAD | **likely superseded** |
| `apps/daemon/src/ema_daemon/sqlite_ffi.gleam` | Likely `swarm_registry_projection_json` FFI binding | Companion to bus change; HEAD has the call sites already | **likely superseded** |
| `apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam` | IPC verb routing for swarm projection | HEAD ships swarm-CLI surface (`ema swarm create/list/show/start/...`) so IPC routing must already exist | **superseded** |
| `apps/cli/src/commands/handoff.ts` | CLI handoff command edit | Sprint 4 agent-workspace work touched this | **likely superseded** |
| `apps/cli/src/commands/help.ts` | Per-subcommand --help edit | Already in HEAD via `842fb33 cli: per-subcommand --help across stub-contract command groups` | **superseded** |
| `packages/contracts/events/README.md` | Doc update for swarm contract section | Companion doc change | **superseded** |

**Action**: `git stash drop stash@{1}` — every change has a confirmed equivalent in HEAD. The stash was the early WIP draft; the 42-commit body is the merged version.

## Combined recommendation

```bash
# Optional 5-minute review:
cd "/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6"
git stash show -p stash@{0} > /tmp/stash0.diff
grep -A 3 "package.json" /tmp/stash0.diff | head -20

# Drop both:
git stash drop stash@{1}      # daemon-internals, fully superseded
git stash drop stash@{0}      # cockpit/web/test, fully superseded

# Verify clean:
git stash list                # should be empty
```

Recovery path if dropping was wrong: `git stash` entries live in `.git/refs/stash` reflog for ~30 days. Use `git fsck --unreachable | grep commit` + `git stash apply <sha>` to revive.

## Why the stashes existed

The earliest commits in the unpushed body (`a5619c3 0.0.6 architecture audit + rearch campaign opened; doc drift sync`, `ec9238f Docs: CWT vApp launch contract + master orchestration plan`) were checkpoint commits made *during* the substrate refactor. The stashes are likely "uncommitted edits at the moment of those checkpoint commits" — fragments of in-flight work that the next commit absorbed cleanly. Per `git stash` lore, this is the most common reason stashes hang around: you stashed "just in case", and then the work flowed forward without needing them.

## Next step after dropping

The bootstrap/m2-m3-shell-port branch becomes a clean push target. See `umbrella-push-plan-2026-05-10.md` for the sequenced playbook.
