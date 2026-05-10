# Proslync Intention Source Map - 2026-05-10

## Purpose

Map every read-only evidence source that can reveal lost Proslync intentions,
EMA build-process gaps, Harness Glue patterns, Chronicle/session-manager
patterns, and Trajan-driven agentic-development habits EMA should emulate.

## Verified Discovery Snapshot

The first discovery pass found these source families:

- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/.ema-dev/harness-glue`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/18-harness-glue.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/vapps/duct-tape-onion-harness.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/tooling/harness-glue-cli-smoke.mjs`
- `/Users/trajanm4air/Desktop/Active builds/chronicle`
- `/Users/trajanm4air/Desktop/Active builds/chronicle/code/server/chronicle_api`
- `/Users/trajanm4air/Desktop/Active builds/chronicle/code/server/chronicle_core`
- `/Users/trajanm4air/Desktop/Active builds/chronicle/code/server/chronicle_ingest`
- `/Users/trajanm4air/Desktop/Active builds/duct-tape-onion-harness`
- `/Users/trajanm4air/Desktop/Projects/EMA/.ema-dev/harness-glue`
- `/Users/trajanm4air/Desktop/Projects/EMA/atlas/app/chronicle`
- `/Users/trajanm4air/Desktop/Projects/chronicle`
- `/Users/trajanm4air/Desktop/Projects/duct-tape-onion-harness`
- `/Users/trajanm4air/Desktop/Projects/ema-agent-multiplexer-interface`

The text scan confirmed these EMA-side anchors:

- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/harness.ts`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/cockpit.ts`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/lib/ema_intention_farmer.ex`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/lib/ema_intention_farmer/`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/24-harness-vapp-launch.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/superpowers/specs/2026-05-09-intention-backlog-farmer.md`
- `/Users/trajanm4air/Desktop/Projects/ema-agent-multiplexer-interface/blueprint/`
- `/Users/trajanm4air/Desktop/Projects/EMA/atlas/workspace/cmux-native-orchestrator-proposal.md`

## Canonical Read Order

1. Current EMA build docs and CLI:
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/18-harness-glue.md`
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/24-harness-vapp-launch.md`
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/vapps/duct-tape-onion-harness.md`
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/harness.ts`
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/cockpit.ts`
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/superpowers/specs/2026-05-09-intention-backlog-farmer.md`
2. Session evidence:
   - `/Users/trajanm4air/.codex/sessions/**/*.jsonl`
   - `/Users/trajanm4air/.codex/archived_sessions/*.jsonl`
   - `/Users/trajanm4air/.codex/history.jsonl`
   - `/Users/trajanm4air/.codex/session_index.jsonl`
   - `/Users/trajanm4air/.claude/projects/**/*.jsonl`
3. Memory summaries:
   - `/Users/trajanm4air/.codex/memories/MEMORY.md`
   - `/Users/trajanm4air/.codex/memories/rollout_summaries/*.md`
4. Donor/source projects:
   - `/Users/trajanm4air/Desktop/Active builds/chronicle`
   - `/Users/trajanm4air/Desktop/Projects/chronicle`
   - `/Users/trajanm4air/Desktop/Active builds/duct-tape-onion-harness`
   - `/Users/trajanm4air/Desktop/Projects/duct-tape-onion-harness`
   - `/Users/trajanm4air/Desktop/Projects/ema-agent-multiplexer-interface`
5. Proslync active builds:
   - `/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final`
   - `/Users/trajanm4air/Desktop/Active builds/proslync-backend`
   - `/Users/trajanm4air/Desktop/Active builds/proslync-desktop`
   - `/Users/trajanm4air/Desktop/Active builds/proslync-presentation-assets-final`

## Classification Tags

| Tag | Meaning | Canonical Destination |
|---|---|---|
| `proslync_product_intent` | Product idea or client-facing feature for Proslync | Proslync PLAN.md / queue |
| `proslync_build_process_intent` | Build/test/repo/process improvement for Proslync | Proslync queue/lane |
| `ema_build_process_intent` | EMA capability needed to make this work less manual | EMA queue/lane |
| `agentic_style_to_emulate` | Trajan behavior EMA should learn as a workflow primitive | agentic style map |
| `human_workaround_ema_lacks` | Work Trajan/Codex did manually because EMA lacks the feature | EMA capability queue |
| `harness_glue_pattern` | Dispatch/session/tool-event pattern | Harness Glue docs/queue |
| `chronicle_pattern` | Activity/session/replay/search pattern | Chronicle projection/docs |
| `session_manager_pattern` | cmux/t3code/session-manager control-plane pattern | multiplexer/EMA queue |
| `lost_followup` | A concrete unresolved ask or plan item | EMA queue item |
| `duplicate_or_stale` | Superseded by newer state | Evidence only |

## Non-Negotiables

- Source artifacts are read-only.
- No harvested record becomes canon without a review state.
- Proslync records must include the active project id if known: `project:01KR0FKC3Q028AX7DK658J8D99`.
- Human wording is preserved as evidence; the cleaned title can be normalized separately.
