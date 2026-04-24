# L-writers-org-space — Org + Default Space Writers

**Status:** queued
**Owner:** unassigned (specialist TBD — Canon Writers Orchestrator is the natural fit; the Codex V2 worker brief lists this as recommended first slice).
**Wave:** W1 → W2 bridge
**Corresponds to:** Target Slices in `doctrine/planning/orchestrator-prompts/CANON-WRITERS-ORCHESTRATOR-PROMPT.md` (ema_orgs, ema_spaces).

## Read first

1. `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`
2. `doctrine/planning/orchestrator-prompts/CANON-WRITERS-ORCHESTRATOR-PROMPT.md`
3. `doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md` (topology rules: `Organization -> Space -> Project`; every org auto-creates one same-name default space).
4. `runtime/EMA-0.0.5--4-24/docs/architecture/02-daemon-supervision.md`
5. `runtime/EMA-0.0.5--4-24/docs/architecture/05-writer-topology.md`
6. `runtime/EMA-0.0.5--4-24/docs/architecture/03-event-catalog-v0.md`
7. `runtime/EMA-0.0.5--4-24/docs/architecture/10-first-boot.md`
8. `runtime/EMA-0.0.5--4-24/packages/contracts/events/catalog.v0.md`
9. `runtime/EMA-0.0.5--4-24/packages/contracts/types/ids.md`
10. Current state of the placeholder modules at `apps/daemon/src/ema_orgs/` and `apps/daemon/src/ema_spaces/` — audit before editing.

## Scope

Writable paths:

- `apps/daemon/src/ema_orgs/**`
- `apps/daemon/src/ema_spaces/**`
- `packages/contracts/events/catalog.v0.md` (new event kinds — same-change requirement).
- `packages/contracts/events/families/orgs.md` (or equivalent family file).
- `packages/contracts/events/families/spaces.md` (same).
- `packages/contracts/types/ids.md` (new prefixes — same-change requirement).
- Replay tests under `apps/daemon/test/ema_orgs/` and `apps/daemon/test/ema_spaces/`.

Out of scope for this lane:

- Surface code (owned by Runtime Slice + Product Surface Donor).
- IPC plumbing (owned by Runtime Slice).
- Blueprint or git-ema writers (separate downstream lanes).
- Projection actors that expose org/space to the topbar — those belong to `L-projections-topbar` and its follow-ups.

## Dependencies

- Depends on: daemon scaffold compiling green (true as of 2026-04-24).
- Soft dependency: `L-ipc-client-finish` if you want to exercise end-to-end via a surface command rather than a replay test. Replay-only verification avoids this coupling.
- Unblocks: `L-projections-topbar` (can now render real projection data instead of seed-only), Blueprint/git-ema writer lanes (future).

## Exit criteria

1. `org.created` command accepted via daemon IPC, validated, appended to the canonical SQLite `events` table. Envelope validation rejects missing or malformed fields.
2. `space.created` command is emitted automatically by the org writer on the same commit chain — every org auto-creates one same-name default space on creation (non-negotiable from LANGUAGE-LOCK).
3. New event kinds `org.created` and `space.created` appear in `packages/contracts/events/catalog.v0.md` with same-change updates.
4. New ID prefixes for org and space appear in `packages/contracts/types/ids.md` with same-change updates.
5. Replay test in `apps/daemon/test/ema_orgs/` opens a fresh canonical SQLite, replays a fixture event stream, asserts the projection state matches the event log. Same for `ema_spaces`.
6. `gleam test` is green. `bash scripts/contract-check.sh` is green.
7. A surface command through the IPC round-trip produces the same write-and-event behavior as the replay test (can be deferred to a follow-on lane if the lane owner explicitly calls it out).

## Reporting template

```text
Lane: L-writers-org-space
Status: closed <YYYY-MM-DD>
Files changed:
  - apps/daemon/src/ema_orgs/*.gleam
  - apps/daemon/src/ema_spaces/*.gleam
  - packages/contracts/events/catalog.v0.md
  - packages/contracts/events/families/orgs.md
  - packages/contracts/events/families/spaces.md
  - packages/contracts/types/ids.md
  - apps/daemon/test/ema_orgs/*.gleam
  - apps/daemon/test/ema_spaces/*.gleam
Event kinds added: org.created, space.created (+ any internal envelope kinds)
ID prefixes added: <list>
Replay tests: <count> passing
gleam test: <pass/fail>
contract-check: <pass/fail>
IPC round-trip exercised: <yes | deferred to follow-on>
Risks: <list>
Unblocks: L-projections-topbar (real org/space data), future Blueprint/git-ema writer lanes.
```

## Ledger anchor

Report lane closure to `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`.
