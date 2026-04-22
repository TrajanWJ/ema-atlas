# Meta EMA Operator Handoff

This document is the durable handoff for the dedicated EMA operator agent.

## Mission

Become the continuity-holder and operator for EMA as a living project.
Your job is not just to complete isolated tasks, but to maintain a coherent understanding of:

- EMA canon
- implementation reality
- planning / blueprint / intention-building layers
- the gap between vision and implementation
- how to turn **meta EMA** into the first real project / first real space
- how agents should work through CLI
- how Trajan should work through GUI

## Non-Negotiable Reality

- Work happens on the **host machine**.
- From the agent VM, host access is via: `ssh host-machine`
- Host repo: `~/Projects/ema`
- Current runtime: **TypeScript / Electron monorepo**
- Old Elixir/Phoenix/Tauri stack: archived under `IGNORE_OLD_TAURI_BUILD/` and reference-only

## Read-First Order

1. `docs/OPERATING-REALITY.md`
2. `docs/CANON-PLANNING-BOUNDARY.md`
3. `docs/INTENTION-BUILDING-SYSTEM.md`
4. `docs/GAP-LEDGER-SYSTEM.md`
5. `docs/MEMORY-SYNC.md`
6. `AGENTS.md`
7. `CLAUDE.md`
8. `docs/backend/README.md`
9. `docs/backend/SOURCE-OF-TRUTH.md`
10. `docs/GROUND-TRUTH.md`
11. `ema-genesis/EMA-GENESIS-PROMPT.md`
12. `ema-genesis/_meta/CANON-STATUS.md`

## Plane Discipline

Always separate:
- canon
- planning / blueprint / intention-building
- implemented runtime reality
- explicit gap analysis

Do not collapse these into one narrative.
Do not present aspiration as shipped truth.
Do not let stale docs overrule current verified reality.

## Durable Memory

Shared EMA memory anchor:
- `docs/MEMORY-SYNC.md`

Cross-tool memory symlink targets were created so OpenClaw / Claude / Codex / EMA operator-memory all point back to the same memory-sync anchor.

If you learn something durable:
- write it into the right repo doc or EMA durable storage
- do not rely only on chat/session history

## Current High-Value Truths

- Genesis is the canonical target; `EMA-V1-SPEC` is Phase 1 of the Genesis vision, not a replacement for Genesis.
- The active backend spine now includes intents → durable proposals → executions, with Chronicle / review / promotion / goals / calendar layers becoming real runtime surfaces.
- The repo contains both a broad vision and a partially-real implementation; your job is to reconcile, not flatten.
- The UI/app inventory is broader than the truly coherent product map; renderer structure is not the same thing as product authority.
- The CLI is currently more canon-reader/query-surface than full operator surface.

## Meta EMA Objective

Drive toward a first workable "meta EMA" project / space that:
- agents can operate through CLI
- Trajan can inspect and operate through GUI
- reflects canon, plans, runtime state, gap ledger, and active work in one coherent environment

## Operating Loop

When starting or refreshing:
1. Re-read read-first docs.
2. Check `docs/agent-handoffs/META-EMA-OPERATOR.md`.
3. Reconcile with current host repo state.
4. Check active intents / executions / canon changes.
5. Update this handoff if the durable operating contract changed.

## Immediate Focus Areas

- establish the cleanest source-of-truth hierarchy for future agent runs
- reconcile canon vs implementation vs planning without confusion
- shape meta EMA as the first project/space that can host future work
- improve agent continuity and operator leverage without depending on stale prompt blobs

Primary planning anchor for the first concrete space/workline definition:
- docs/planning/FIRST-META-EMA-SPACE.md

## Verified Runtime Notes — 2026-04-13

- Host verification path remains: `ssh host-machine`, then `cd ~/Projects/ema`.
- The active host CLI entrypoint is `./bin/ema`.
- The host repo currently does **not** expose the `ema openclaw ...` wrapper described by the OpenClaw EMA skill; treat that wrapper as aspirational/stale until implemented in this repo.
- Root cause of `./bin/ema status` reporting the daemon unreachable was **not** one issue but two stacked failures:
  1. the host default `node` is `v20.20.1`, while the installed native `better-sqlite3` build was compiled for Node ABI `127` / Node `v22`; running `services/dist/startup.js` under the host default node failed immediately with `ERR_DLOPEN_FAILED`.
  2. once started under `~/.nvm/versions/node/v22.22.1/bin/node`, boot then failed against the live SQLite file because `calendar_entries` was missing the newer `task_id` column while startup DDL immediately tried to create `calendar_entries_task_idx` on that column.
- Verified minimal DB repair for the current runtime: `ALTER TABLE calendar_entries ADD COLUMN task_id TEXT;` against `~/.local/share/ema/ema.db`. After that change, the service booted cleanly under Node 22 and `/api/health` returned `ok` on `:4488`.
- Verified durable host recovery path from agent-side SSH/tooling: launch the runtime under the explicit Node 22 binary via **user systemd transient units**, not plain detached background jobs, e.g. `systemd-run --user --unit=ema-services ... $HOME/.nvm/versions/node/v22.22.1/bin/node services/dist/startup.js` and the equivalent `ema-workers` unit. Plain SSH-detached/tmux/nohup attempts were not durable from this tooling context.
- After the Node-version correction + DB column repair + systemd-run bring-up, `./bin/ema status` returned healthy again and `curl http://127.0.0.1:4488/api/health` succeeded.
