# EMA-0.0.6 Umbrella Push Plan — 2026-05-10

The 42-commit local body on `bootstrap/m2-m3-shell-port` is the bottleneck for every other front in the Proslync program — daemon refactor, PubSub spine, EMA-side wiki stamps, and cross-repo coordination all wait on it. This doc sequences the push.

## Pre-flight

- [x] Phase 1 stranded-state cleanup (this session, 2026-05-10): branch pruning, Projects/ first-commits, proslync-desktop + sift remotes created.
- [x] Stash triage doc authored: see `stash-triage-2026-05-10.md`. Both stashes confirmed superseded.
- [ ] **Concurrent-actor hold**: as of 2026-05-10, codex is actively committing on `bootstrap/m2-m3-shell-port` (most recent: `3f387be docs: STATUS.md sprint-commit map + parallel-agent collision note`, with new dirty state on bus.gleam / sqlite_ffi.gleam / shell_ipc.gleam / handful of CLI commands). The umbrella push must coordinate with codex's session — either wait until codex pauses, or claim the lane explicitly with `--actor actor:claude` and notify codex via EMA queue/handoff before pushing.

## Step 1 — Drop the stashes

```bash
cd "/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6"
git stash drop stash@{1}     # daemon-internals, fully superseded by 7dff118 swarm registry
git stash drop stash@{0}     # cockpit/web/test, superseded by 5472ef7 + sprint4/7 work
git stash list                # confirm empty
```

If you want to confirm before dropping, the per-file analysis is in `stash-triage-2026-05-10.md`.

## Step 2 — Resolve the in-flight dirty state

As of last check, codex has uncommitted changes:

```
M CHANGELOG.md
M apps/cli/dist/bin.js
M apps/cli/src/commands/doctor.ts
M apps/cli/src/commands/harness.ts
M apps/cli/src/commands/help.ts
M apps/cli/src/commands/wiki.ts
M apps/cli/tsconfig.tsbuildinfo
M apps/daemon/src/ema_daemon/bus.gleam
M apps/daemon/src/ema_daemon/sqlite_ffi.gleam
M apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam
M apps/daemon/src/ema_sqlite_helpers.erl
M apps/web/tsconfig.tsbuildinfo
?? apps/web/src/components/apps/duct-tape/
?? apps/web/tests/e2e/harness-registry.spec.ts
```

This looks like Sprint 6 (Harness/Duct Tape) work in flight. Either:

- **(a) Wait for codex to finish + commit the Sprint 6 work** (preferred), or
- **(b) Coordinate via EMA queue: `ema queue add --lane <ema-modeling-lane> --title "Sprint 6 in-flight handoff" --depends-on:<codex's lane>"`** so the umbrella PR includes Sprint 6 cleanly.

Do not force a push while another actor's daemon edits are uncommitted.

## Step 3 — Push the branch

```bash
git -C "/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6" push -u origin bootstrap/m2-m3-shell-port
```

This uploads ~42-50 commits (including Sprint 6 if it lands first) to GitHub. **No `--force` needed** — the branch has no upstream; this is a brand-new branch on remote.

## Step 4 — Open the umbrella PR

```bash
gh pr create \
  --repo TrajanWJ/EMA-CENTRAL-EVERYTHING \
  --title "EMA 0.0.6 buildout: Sprints 0-10 + s25 substrate + cockpit/dispatch/exec daemon + swarm registry + companion popouts" \
  --body-file docs/orchestration/umbrella-pr-body.md \
  --base main
```

The PR body should be authored separately (see "PR body skeleton" below). Reviewing 1,189 files / +180k LOC at once is brutal but the alternative — rewriting history into a sequence of focused PRs — is its own week of work. Pragmatic call: ship the umbrella, follow up with the rearch tracks.

### PR body skeleton

```markdown
## What this PR is

Four weeks of EMA 0.0.6 buildout that's been local-only on `bootstrap/m2-m3-shell-port`. Closes the core of the head-orchestrator master plan ([2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md](../docs/superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md), Sprints 0-10).

## Sprints shipped (with commit refs)

| Sprint | Track | Commit |
|---|---|---|
| 0 | Dirty State Intake | docs/orchestration/head-orchestrator/current-dirty-state-2026-05-10.md |
| 1 | Doctrine Canon | `0c7626c docs: sprint 1 doctrine canon` |
| 2 | Fast Projection Core | `3748477 sprint2: close cockpit budget gate + honest runtime health` |
| 3 | Proslync Project Registry | `5472ef7 ema: proslync-first cockpit readiness`, `7e1288f register hero-website surface` |
| 4 | Agent Workspace V2 | `f775725 sprint4: agent workspace v2 — daemon-backed primary actions` |
| 6 | Harness + Duct Tape Registry | (this push, if Sprint 6 lands first) |
| 7 | vApp Route/Frame Unification | `6539ceb sprint7: unify vApp route, frame, and mode contracts` |
| 10 | Runtime/Static/Tauri Install Gate | `c885678 sprint10: runtime/static/tauri install gate readiness` |

## Other major work in this PR

- s25 (1-4) — daemon canonical substrate + CLI pipeline floor + bootstrap doctrine + readiness restart artifact
- Daemon-backed swarm registry (`7dff118 Add daemon-backed swarm registry`)
- WIP 0.0.6: cockpit vApp + dispatch/exec daemon + companion desktop (`501adfb`)
- Tauri popout origins, native companion popouts, desktop bundle sync
- ~30 new tooling scripts under `tooling/` (orchestrator-doctor, cockpit-performance-smoke, etc.)
- Doc network: bootstrap historical banners, Proslync STATUS section, EMA contents network repair

## Stop lines preserved

Per the master plan §"Stop Lines":
- ✓ No timeout-budget inflation as a "fix"
- ✓ No `networkidle` for cockpit/vApp readiness
- ✓ Daemon owns truth; surfaces render and request actions
- ✓ Dirty worktrees in sister repos preserved (separate salvage already done — see `proslync-app-ios-final` ORCHESTRATOR.md)

## Swarm Launch Gate

Per the master plan §"Proslync Swarm Launch Gate", Proslync swarms cannot begin until projection performance, agent workspace, intention/chronicle backfeed, and harness all pass. After this PR merges, `ema cockpit workpack --project proslync-app-ios-final --json` returns the workpack → gate clears for single-agent claimed-lane work; full swarm dispatch still gated on Sprint 5 (Intention + Chronicle Backfeed) + remaining harness work.

## After merging

Open the PubSub spine PR (Phase 0 of new track T11 "Bus Federation") — ADR `docs/decisions/2026-05-10-pubsub-spine.md` to be authored.
```

## Step 5 — Reconcile master plan with what shipped

After merge, edit `docs/superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md`:

1. Mark Sprints 0-4, 7, 10 as **shipped** with commit refs.
2. If Sprint 6 also landed, mark it shipped.
3. Note Sprint 5 (Intention + Chronicle Backfeed) as still in flight.
4. Note Sprint 8 (Priority vApp productization) and Sprint 9 (Test architecture) as the remaining acceptance work.
5. Add new track:

   ```markdown
   ## Track T11 — Bus Federation via PubSub Spine

   Trigger: Sprint 2's compact-projection caching is fast for cold reads
   but `bus.gleam` (now 1543 LOC, 40+ message variants) serializes every
   projection read behind one mailbox. Per-entity processes via the
   existing registry are the OTP-correct shape; PubSub gives the topic
   broker that closes the gap.

   Phase 0 — PubSub spine (~400-600 LOC, additive, reversible)
            New: pubsub.gleam supervised actor.
            Wire: bus broadcasts to PubSub on every successful append.
            New IPC verb: subscribe {topic}.
            CLI helper: ws-client.subscribeTopic(topic, handler).
            ADR: docs/decisions/2026-05-10-pubsub-spine.md

   Phase 1 — Split lanes out of bus → per-entity processes.
   Phase 2 — Web subscribes via PubSub through IPC; cockpit polling deletes.
   Phase 3 — Mechanical: queues, missions, campaigns, handoffs.
   Phase 4 — CLI as Erlang node (kills shell-protocol contract).
   Phase 5 — Mnesia for canonical (processes-as-truth, SQLite-as-snapshot).

   Each phase is independent shippable value.
   ```

## Step 6 — Author the PubSub ADR

`docs/decisions/2026-05-10-pubsub-spine.md` documents the decision to introduce PubSub as the foundation for T11. The user's analysis (in chat 2026-05-10) is the source material; lift the rationale + safety properties verbatim, add the alternatives considered (single-actor with priority queue, direct registry calls, etc.) and why PubSub wins.

## Step 7 — Open the PubSub PR (Phase 0)

Per the user's spec:

- Files: `apps/daemon/src/ema_daemon/pubsub.gleam` (new ~150 LOC), `apps/daemon/src/ema_daemon/supervisor.gleam` (~10 LOC), `apps/daemon/src/ema_daemon/bus.gleam` (~20 LOC, single broadcast call), `apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam` (~80 LOC, new `subscribe` verb), `apps/cli/src/ws-client.ts` (~30 LOC, `subscribeTopic` method), `apps/daemon/test/pubsub_test.gleam` (~150 LOC).
- Total: ~400-600 LOC.
- Safety properties:
  - Adds a child to the supervisor; doesn't reorder existing children.
  - Bus's existing subscribe API untouched — projections in flight don't break.
  - New IPC verb is additive; protocol version stays at `v: 0`.
  - No SQL touched. No event schema touched. No CLI command surface touched.
  - If PubSub crashes, supervisor restarts it; bus only fire-and-forgets to it.

## Cross-repo unblocks (the parallel fronts)

Once the umbrella PR merges, these become independent lanes:

| Front | Repo | First slice |
|---|---|---|
| **A** PubSub spine | EMA-0.0.6 | Phase 0 PR per Step 7 |
| **B** Sprint 2 Brand back-office MVP | proslync-app-ios-final | render activation/category UI; closes `queue_item:01KR7Z1J63022KXAQ49PYHNNGM` |
| **C** Hero website copy | proslync-website (`web/` subdir) | source-carded copy from mrs-wilson asks P1–P9 |
| **D** Backend persistence | proslync-backend | brand/campaign/deal/application Drizzle migrations |
| **E** Research-layer refresh | (loaded prompt) | `presentation:research-layer-prompt`; gates the future-master-planner |
| **F** EMA-side wiki-id stamps | EMA-0.0.6 | stamp 9 deferred docs (mechanical, ~10 min) |

These don't conflict file-wise with each other — A is daemon, B/C are web/UI in different repos, D is backend, E is research, F is docs.
