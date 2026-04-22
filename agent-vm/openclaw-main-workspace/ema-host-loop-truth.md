# EMA Host Loop Truth (2026-04-06 UTC)

This is the as-built host loop observed on the machine.

## Live execution path

1. Host-side producer scripts write task JSON into `~/dispatch/queue/`
2. `~/bin/dispatch-engine.sh` is the real dispatcher/executor coordinator
3. It attempts EMA-surface routing indirectly via `rate-limit-handler.sh` -> `ema-surface-dispatch.sh`
4. If EMA API is unreachable, it falls back to direct `claude --print`
5. Results land in `~/dispatch/results/`
6. Task state moves through file directories:
   - `~/dispatch/queue/`
   - `~/dispatch/active/`
   - `~/dispatch/done/`
   - `~/dispatch/failed/`
   - `~/dispatch/partial/`
7. `~/bin/dispatch-completion-hook.sh` performs post-completion fanout

## Important current reality

- EMA surfaces code exists in `~/Projects/ema`, but the EMA API was not reachable at `http://127.0.0.1:4488/api/surfaces` during this audit.
- Therefore EMA is not yet the live execution authority.
- The host loop truth currently lives in processes, ports, logs, and files on disk — not in `dispatch.db`.

## Current breakpoint that was fixed

- `~/bin/vault-research-loop.sh` was emitting malformed JSON when vault previews contained raw quotes.
- `~/bin/dispatch-engine.sh` was treating parse failures as null descriptions, creating empty files in `~/dispatch/failed/`, and leaving bad queue entries in place.
- The fix changed producer emission to `jq -n` and changed the dispatcher to explicitly quarantine malformed tasks once with a metadata wrapper plus preserved raw payload.

## What EMA should do next

- Observe this host-truth loop first
- Normalize host evidence into a clean status model
- Then progressively become the execution authority instead of assuming it already is
