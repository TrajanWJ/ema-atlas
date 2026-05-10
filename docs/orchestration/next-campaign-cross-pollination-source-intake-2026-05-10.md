<!-- wiki-id: ema:next-campaign-cross-pollination-source-intake -->
<!-- see-also: ema:head-orchestrator, ema:operating-model, ema:status, proslync:plan, proslync:cross-poll-integration -->

# Next Campaign - Cross-Pollination + Source Intake First

Generated: 2026-05-10

This revises the earlier lock-in campaign prompt so external reference discovery,
open-source donor analysis, source-carding, and product-object routing are part of
the operating loop instead of an occasional research prelude.

## Current Truth To Start From

- Locked architecture source: `/Users/trajanm4air/.claude/plans/your-missing-many-pieces-dazzling-tulip.md`.
- EMA active build: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6`.
- Branch: `bootstrap/m2-m3-shell-port`.
- Current local delta at this revision: one commit ahead of `origin/bootstrap/m2-m3-shell-port`, not 42+.
- EMA daemon/web are up in the latest verification pass.
- First Proslync Sprint 2 swarm is already done:
  - Backend product evidence packet queue item closed.
  - Brand HQ deal-evidence UI queue item closed.
  - Presentation-assets source-card sync queue item closed.
- Do not describe the first Proslync swarm as future work. The next Proslync
  swarm should build on that evidence and continue the source-backed spine.

## Revised Oneliner Mission

Codify the locked EMA host-node / p2p / conflict / recovery doctrine, then make
cross-pollination a first-class workspace primitive: every architecture and
client-work swarm must discover relevant external references, capture source and
license posture, map useful patterns to entity families and product objects, and
only then implement or queue code changes.

The target operating spine becomes:

```text
SourceQuery -> SourceRecord -> DonorArtifact -> PatternExtraction
-> EntityClass/ProductObjectDelta -> QueueItem -> ImplementationArtifact
-> VerificationEvidence -> SourceRegistryUpdate
```

For Proslync, the client-work equivalent remains:

```text
source card -> product object delta -> implementation slice
-> local/backend/cockpit proof -> presentation/hero proof -> EMA queue update
```

## Revised Preflight

Run from the parent repo, not a generated worktree:

```bash
cd "/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6"
[ "$(git rev-parse --show-toplevel)" = "/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6" ]
git fetch origin
git status --short --branch
git log --oneline origin/bootstrap/m2-m3-shell-port..HEAD | head -20
git stash list
ema ping --json
ema status --json
ema cockpit workpack --project EMA --json
ema doctor --strict --json
wiki check
sed -n '1,80p' /Users/trajanm4air/.claude/plans/your-missing-many-pieces-dazzling-tulip.md
tail -120 docs/orchestration/STATUS.md
```

Stop before writes if:

- Codex or another actor owns a touching path in `ema cockpit workpack --project EMA --json`.
- `git status --short` shows unrelated files outside the planned write scope.
- `git log origin/bootstrap/m2-m3-shell-port..HEAD` shows new commits you have not
  read yet.
- The target change implies opening or merging the umbrella PR.

## Source-First Operating Contract

Every track below must either update a source artifact or explicitly state why
the work is internal-only.

Required source fields:

| Field | Requirement |
|---|---|
| Source ID | Stable ID, preferably namespace-prefixed. |
| Retrieval | URL/path, retrieval date, and actor/tool used. |
| License/use posture | Direct-port allowed, rewrite-only, inspiration-only, blocked, or source-needed. |
| Source type | Official docs, primary repo, paper, vendor page, journalism, social voice, local memory, or internal artifact. |
| Confidence | Verified, source-needed, inspiration-only, synthetic, or stale. |
| Pattern extracted | The reusable mechanism, not vague admiration. |
| Target entity/product object | EMA entity family or Proslync object affected. |
| Implementation route | Now, queued, blocked, or rejected. |
| Verification evidence | Command, screenshot, runtime proof, or source-card validation. |

No open-source code moves into EMA or Proslync without license posture. GPL and
unclear-license donor code is blocked for code import; it may still inspire a
rewrite if the source card says so.

## Track 0 - Cross-Pollination Intake Layer

This track is mandatory and precedes architecture implementation.

**Goal:** create the durable intake lane for external references, donor repos,
source cards, license posture, and pattern routing.

**Owns:**

- `packages/contracts/workspace/v0/source-intake.md` (new)
- `docs/orchestration/source-intake/` (new)
- `docs/orchestration/source-intake/query-log-2026-05-10.md` (new)
- `docs/orchestration/source-intake/source-inventory-2026-05-10.md` (new)
- `docs/orchestration/source-intake/pattern-routing-2026-05-10.md` (new)

**Does not touch:**

- Daemon Gleam modules.
- Existing Proslync app/backend code.
- `origin/b1-substrate-parked-2026-05-10`.

**Required content:**

1. EMA architecture source candidates:
   - Iroh / DERP / relay topology references.
   - Local-first and CRDT references for prose and soft entities.
   - Distributed mutual exclusion references for lane claims and capability tokens.
   - Sequencing / leader-election references for approval queue and migrations.
   - BIP-39 / deterministic recovery references.
2. Agent-workspace source candidates:
   - Existing local cmux, Duct Tape, Harness, Chronicle, CLI command catalog,
     wiki resolver, and doc-registry patterns.
   - External orchestration/control-plane references where license posture is clear.
3. Proslync source candidates:
   - NIL / compliance / Brand HQ / AD cockpit sources already known in the
     Proslync research plane.
   - New open-source or public references only if they are source-carded.

**Done when:**

- Each candidate has a source posture.
- Each useful pattern maps to one entity class or product object.
- Each "build now" item has a queue item or a track assignment.

## Track 1 - ADR Authoring + Doctrine Updates

Use the locked plan as architectural authority, but cite Track 0 source records
where an ADR relies on external protocol or recovery concepts.

New ADRs:

- `docs/decisions/2026-05-10-host-node-doctrine.md`
- `docs/decisions/2026-05-10-multi-host-conflict-policy.md`
- `docs/decisions/2026-05-10-recovery-bip39.md`

Doctrine updates:

- `docs/architecture/01-topology.md`
- `docs/architecture/02-daemon-supervision.md`
- `docs/architecture/06-blueprint-boundaries.md`
- `docs/architecture/11-transport-and-auth-survey.md`
- `docs/architecture/15-web-org-access-point.md`
- `docs/architecture/16-google-identity-and-browser-access.md`
- `docs/operations/peer-computer-access.md`
- `docs/decisions/2026-04-24-transport-and-auth.md`
- `docs/WORKSPACE-ENTRYPOINT.md`

Add or preserve `wiki-id` stamps and register new canonical docs in
`/Users/trajanm4air/Desktop/Projects/EMA/atlas/knowledge/doc-registry.json`.

## Track 2 - Org-Scoped Architecture

Implement the locked model as:

```text
org -> host_set -> entity_class -> conflict_strategy
```

Track 2 must consume Track 0's source-intake table for the conflict-strategy
column names and must avoid changing the Track 3 swarm scope modules.

Owns:

- `apps/daemon/src/ema_daemon/bus.gleam`
- `apps/daemon/src/ema_daemon/event_envelope.gleam`
- `apps/daemon/src/ema_daemon/sqlite_ffi.gleam`
- `apps/cli/src/commands/cockpit.ts`
- `apps/cli/src/commands/project.ts`
- `apps/cli/src/commands/org.ts` (new)

Required proof:

- `ema org status --org <id>` round-trips.
- Project projection JSON contains `org_id`.
- Legacy `--project` flows still work.

## Track 3 - Daemon-Enforced Swarm Scope Claims

Scope claims are the implementation guardrail that makes cross-pollinated,
multi-agent work viable.

Owns:

- `apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam`
- `apps/daemon/src/ema_swarm/**`
- `apps/cli/src/commands/swarm.ts`

Required proof:

- `ema swarm scope-claim` accepts a clean claim.
- A second overlapping claim is rejected by the daemon.
- Non-overlapping claims can run in parallel.
- `scope.registry` can answer "who is editing this path right now?"

## Track 4 - Shared Workspace Schema + Source Registry

This track absorbs Track 0 into EMA's durable schema layer.

Owns:

- `packages/contracts/workspace/v0/schema.md`
- `packages/contracts/workspace/v0/source-intake.md`
- `apps/daemon/src/ema_workspace/**`
- `apps/cli/src/commands/wiki.ts`
- `apps/cli/src/commands/help.ts`

Required workspace projections:

- `workspace.entities`
- `workspace.events`
- `workspace.commands`
- `workspace.wiki_ids`
- `workspace.artifacts`
- `workspace.sources`
- `workspace.donor_patterns`

`ema wiki resolve <id>` should become daemon-canonical while the existing
`~/.local/bin/wiki` resolver remains a file-backed offline fallback.

## Track 5 - Proslync Follow-On Swarm

This is not the first swarm; it is the next source-backed client-work swarm.

Use `lane:01KR7K0ZGA009YGND4AHPRJ9BN` and continue from the already-closed
evidence triad.

Sub-agent scopes:

| Agent | Scope | First useful slice |
|---|---|---|
| A - source scout | Proslync research plane + presentation source cards | Add new source-carded references for Brand HQ, evidence packets, NIL Go-style disclosure, AD risk, and comparable evidence. |
| B - app worker | `components/brand/**`, `app/deal/**`, `lib/types/{commitment,approval,trust,comparable-deal,deal-receipt}.types.ts` | Build NIL Deal Detail and missing primitives that consume source-backed evidence fields. |
| C - backend worker | `src/services/**`, `src/routes/**`, `src/db/schema/**`, tests | Continue evidence packet persistence into deal detail/application endpoints. |
| D - presentation/hero proof | presentation-assets docs + hero copy only | Promote only source-carded and screenshot-proven claims. |

Every sub-agent must produce:

- Source posture.
- Product object delta.
- Implementation artifact or explicit blocker.
- Verification command.
- EMA agent report.

## Definition Of Done

- The three ADRs land and docs point at the source-intake loop.
- Track 0 creates durable query log, source inventory, and pattern routing docs.
- `workspace.sources` / `workspace.donor_patterns` are included in the shared
  workspace schema plan or implementation.
- Proslync follow-on swarm does not implement any open-source idea without
  source and license posture.
- `wiki check` remains clean or every remaining gap is named.
- `ema doctor --strict --json` exits 0 or every blocker is named in STATUS.md.
- `docs/orchestration/STATUS.md` records the commit map and deferred items.

## Operator Gates

Do not perform these without explicit operator approval:

- Open or merge the umbrella PR.
- Force-push, rebase, or amend pushed history.
- Drop stashes.
- Push Proslync sibling repos.
- Touch `origin/b1-substrate-parked-2026-05-10`.
- Start Iroh sidecar revival, browser passkey implementation, distributed
  sequencer, or migration leader election before the doctrine/source tracks land.

