# EMA Lane 2 Manifest - Codex Adapter Real

Date: 2026-05-10

## Result

Lane 2 is green for the Codex adapter path. The installed Codex binary is
`codex-cli 0.130.0`, and the EMA harness now invokes it without the stale
`--ask-for-approval` or `--full-auto` flags.

The final smoke shows:

- `pnpm build:cli`: pass, exit 0.
- Dry-run argv: pass, `["codex","exec","--json","--sandbox","read-only","--cd",...,"--ephemeral","echo hello"]`.
- Real dispatch: pass, exit 0, daemon-canonical record with agent message `hello`.
- Capability-check dispatch: pass, exit 0, daemon-canonical record with agent message `pong`.
- `capability assert --required codex --json`: pass, exit 0, `ok: true`, `cached: true`, no failures.
- `readiness --json`: expected exit 1, with `proslync_execution_ready: false` blocked only by `artifact_context_writeback`.

Artifacts:

- Recon before: `docs/sprints/SPRINT-LANE2-CODEX/before.md`
- Recon after: `docs/sprints/SPRINT-LANE2-CODEX/after.md`
- Diff: `docs/sprints/SPRINT-LANE2-CODEX/diff.md`
- Smoke: `docs/sprints/SPRINT-LANE2-CODEX/smoke.log`

## Commits

No commits were created.

Reason: the working tree already contains broad modified and untracked EMA
work, including overlapping changes in `apps/cli/src/commands/harness.ts`,
generated `apps/cli/dist/bin.js`, and untracked capability/readiness files.
Creating a `lane2(N)` chain now would mix this sprint with pre-existing
in-flight work. The correct state is preserved as uncommitted artifacts until an
owner can split or commit the broader slice intentionally.

## Adapter Decision

The executable roundtrip path uses:

```text
codex exec --json --sandbox read-only --cd <cwd> --ephemeral <prompt>
```

This matches the current tree's proof-style Codex adapter: capture JSONL output,
write a session record, and write a Codex roundtrip proof only after canonical
daemon lineage observes `execution.completed`.

Manual recon also proved that `codex exec --cd <repo> --sandbox workspace-write
"Reply exactly: codex-sandbox-ok"` runs non-interactively in the trusted EMA
workspace without approval prompts. The long-running provider command string
keeps `codex exec --sandbox workspace-write ...`, while `runCodexDispatch(...)`
uses read-only proof dispatch.

The code comment at `codexExecArgv(...)` records the `codex-cli 0.130.0`
validation point. `docs/architecture/STACK.md` now records the Codex version pin
and both invocation patterns.

## Cache Behavior

`capability assert --required codex --json` now includes a top-level `cached`
boolean.

Observed:

- Immediate assert after successful dispatch: `cached: true`.
- Second assert within 60 seconds: `cached: true`.
- Assert after 65 seconds: `cached: true`.

Tree contradiction: the prompt expected a 60-second expiry, but the current tree
defines `CODEX_ROUNDTRIP_PROOF_TTL_MS = 7 * 24 * 60 * 60 * 1000` for Codex
proofs. The tree wins; the proof cache is currently seven days.

## Readiness

After the smoke, `readiness --json` reports:

- `coordination_ready: true`
- `proslync_execution_ready: false`
- blocker list contains `artifact_context_writeback`
- blocker list does not contain `codex_roundtrip`
- `substrate_translated.components.intent_writer: "beam"`
- `substrate_translated.components.artifact_writer: "hybrid"`

Lane 2 clears the Codex roundtrip blocker. Lane 3 still owns daemon-owned
artifact/context writeback.

## Tree Contradictions

- The prompt expected `runCodexDispatch(...)` to use `workspace-write`; current
  tree uses read-only JSON proof dispatch and a separate workspace-write provider
  command string.
- The prompt expected cache expiry after 60 seconds; current tree uses a
  seven-day Codex proof TTL.
- Earlier notes described `intent_writer: node`; current readiness reports
  `intent_writer: beam`.
- The requested commit chain could not be produced honestly because the working
  tree already had overlapping uncommitted and untracked work.

## Adjacent Issues Not Fixed

- Codex 0.130.0 emits noisy plugin manifest and rollout-state warnings to
  stderr. They do not fail dispatch, but they make logs heavy.
- Capability DB status reports duplicate artifacts:
  `canonical 2.db-shm` and `canonical 2.db-wal`.
- One smoke attempt immediately after `tsup` rebuild saw a transient
  `Cannot find module ... apps/cli/dist/bin.js`; a clean rerun with a
  `dist_exists` check passed.
- `readiness --json` correctly exits 1 while `artifact_context_writeback`
  remains blocking.

## Surprise

The adapter path was already further along than stale flags alone: the tree has
daemon lineage capture plus a Codex proof cache, so the real fix had to preserve
that proof path instead of only editing argv text.

## Lane 3

Lane 3 is tractable but materially larger than Lane 2. The remaining blocker is
the hybrid artifact/context writer; flipping it to daemon-owned writeback will
touch persistence semantics and restart-survival proof, not just CLI argv.
