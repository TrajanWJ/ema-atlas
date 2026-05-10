# Proslync Intention Harvest - 2026-05-10

## Summary

Bounded run:

```bash
node apps/cli/dist/bin.js intention harvest --project proslync-app-ios-final --max-sources 100 --json
node apps/cli/dist/bin.js intention projection --project proslync-app-ios-final --json
```

| Metric | Count |
|---|---:|
| Sources seen | 100 |
| Records parsed | 830 |
| Candidate intents | 552 |
| Proslync relevant | 142 |
| EMA relevant | 239 |
| Lost followups | 350 |
| Duplicates skipped | 22 |

Top tags: `lost_followup` 350, `ema_build_process_intent` 239, `proslync_product_intent` 142, `proslync_build_process_intent` 105, `harness_glue_pattern` 103, `session_manager_pattern` 73, `chronicle_pattern` 71.

## Highest Priority Lost Intentions

| Rank | Title | Tags | Destination | Evidence |
|---:|---|---|---|---|
| 1 | ProSlync iOS sprint-1 demolition swarm | proslync_product_intent, proslync_build_process_intent, ema_build_process_intent, lost_followup | proslync_queue | `md:/Users/trajanm4air/.codex/memories/rollout_summaries/2026-05-09T04-57-35-T7DH-proslync_ios_sprint1_demolition_and_sim_qa.md#2` |
| 2 | Proslync EMA swarm restart prompt | proslync_product_intent, proslync_build_process_intent, ema_build_process_intent, lost_followup | proslync_queue | `md:/Users/trajanm4air/.codex/memories/rollout_summaries/2026-05-09T04-47-42-bWtm-proslync_ema_swarm_restart_prompt.md#2` |
| 3 | PLAN.md open questions | proslync_product_intent, proslync_build_process_intent, ema_build_process_intent, lost_followup | proslync_queue | `md:/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final/PLAN.md#22` |
| 4 | Harness self-orchestration surface | ema_build_process_intent, lost_followup, harness_glue_pattern, session_manager_pattern | ema_queue | `md:/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/24-harness-vapp-launch.md#9` |
| 5 | Duct Tape donor pollination checklist | ema_build_process_intent, lost_followup, chronicle_pattern, harness_glue_pattern | ema_queue | `md:/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/18-harness-glue.md#5` |

## Proslync Product Intentions

| Title | Why It Matters | Evidence | Recommendation |
|---|---|---|---|
| AD back-office positioning | Keeps Proslync framed as buyer-side AD operating software, not a generic athlete social app. | `AGENTS.md#2`, `PLAN.md#3` | Keep as read-only doctrine; do not create another queue item. |
| Brand-first, then athlete | Matches Mrs. Wilson's stated build sequence and the current six-beat demo arc. | `PLAN.md#4` | Keep visible in cockpit surfaces and worker prompts. |
| Backend product-core before surfaces | Confirms that UI mocks should give way to product objects and APIs. | `README.md` in backend, master plan README | Queue backend object persistence only once Sprint 2 lane is active. |
| Desktop AD cockpit and Brand HQ | Makes the missing AD buyer surface visible in EMA and Proslync desktop. | `proslync-desktop/README.md#1`, master plan README | Keep in cockpit surface registry and implementation queue. |
| Open questions Q1-Q16 | Captures unresolved stakeholder decisions that should gate broad implementation. | `PLAN.md#22` | Keep as PLAN.md authority; backfeed only newly-discovered Q17+ items. |

## EMA Capabilities Trajan Is Manually Simulating

| Manual Behavior | EMA Gap | Proposed Primitive | Evidence |
|---|---|---|---|
| Reading session history to recover what got dropped | No reviewable intention projection existed in CLI or cockpit. | `ema intention harvest/list/show/backfeed` plus cockpit Intentions tab. | This plan and `docs/architecture/24-harness-vapp-launch.md#9` |
| Telling agents which active builds belong to Proslync | Cockpit had partial projection, but no intention/recovery layer. | Proslync-native cockpit project with active builds, surfaces, lanes, queue, intentions. | `/api/cockpit/projection`, `/api/cockpit/intentions` |
| Acting as the safety filter before queue writes | Backfeed could over-promote stale chat if automatic. | Dry-run-first queue command with evidence refs and explicit `--approve reviewed`. | `ema intention backfeed` |
| Converting broad orchestration doctrine into concrete follow-ups | Previous cockpit plan left write bridge and home-current switcher as pending. | Three EMA queue items opened in Task 6. | `docs/superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md` |

## Harness/Chronicle/Session-Manager Patterns To Absorb

| Pattern | Source Family | EMA Use |
|---|---|---|
| Harness provider/session registry | EMA | Make external agent/provider availability inspectable before dispatch. |
| Self-orchestration methods: discover plans, recover intent, synthesize lanes, dispatch, integrate, write back | EMA/Duct Tape | Promote from donor pattern into native EMA planning and swarm lifecycle. |
| Chronicle-style event families | EMA/Duct Tape | Treat activity/session history as recoverable evidence, not chat noise. |
| cmux/session-manager cockpit | EMA | Give multi-agent work a visible local control plane, not only scattered terminals. |
| File-backed projections first | EMA | Keep CLI/cockpit useful before daemon IPC write paths are complete. |

## Conversion Review

No harvested Proslync product intention was auto-converted in this pass. The top Proslync items mostly restate current canonical doctrine from PLAN.md, AGENTS.md, CLAUDE.md, and rollout summaries; pushing those into queue would duplicate existing plan authority.

Dry-run was verified for an EMA-owned recovered intention:

```bash
node apps/cli/dist/bin.js intention backfeed --project EMA --intent intent:3eb4d018bf6009e5 --destination queue --dry-run --json
```

Result: `target_project` resolved to `EMA` and the emitted command begins with `ema queue add --project "EMA"`.

Dry-run was also verified for a Proslync-owned recovered intention:

```bash
node apps/cli/dist/bin.js intention backfeed --project proslync-app-ios-final --intent intent:9d3f284ce2bfac56 --destination queue --dry-run --json
```

Result: `target_project` resolved to `proslync-app-ios-final`.

## Rejected Or Stale Records

| Record | Reason |
|---|---|
| PLAN.md section headers as queue candidates | Current plan authority, not lost work. Keep visible, do not duplicate. |
| CLAUDE.md/AGENTS.md positioning sections | Doctrine already current. Keep read-only. |
| Generic historical session fragments without evidence refs | Need manual review before promotion. |
| Donor-only Duct Tape implementation details | Useful as pattern source, but not Proslync queue unless mapped to an EMA primitive. |

## Handoff

### Verified Commands

```bash
ema cockpit projection --project proslync-app-ios-final --json
ema intention projection --project proslync-app-ios-final --json
ema cockpit intentions --project proslync-app-ios-final --json
```

### Open Decisions

| Decision | Owner | Why It Matters |
|---|---|---|
| Which harvested Proslync product intentions should become Sprint 2 queue items? | Trajan | Prevents overfeeding stale chat into the current plan. |
| Should intention backfeed write directly to EMA queue after review, or require copied approval text? | Trajan | Defines safety posture for session-derived work. |
| Should Chronicle/session history become a continuous daemon watcher or an on-demand harvest? | Trajan | Controls background scope and privacy. |

### Residual Risks

| Risk | Mitigation |
|---|---|
| Session history includes stale or contradictory requests | Keep `review_state`, `confidence`, and `evidence_ref` mandatory. |
| Proslync plan already changed after older sessions | Compare against `ema cockpit projection` and current PLAN.md before queue creation. |
| Farmer overclassifies generic text as intention | Require confidence threshold and manual approval; improve semantic section scoring next. |
