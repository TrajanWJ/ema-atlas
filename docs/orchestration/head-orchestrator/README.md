# EMA 0.0.6 Head Orchestrator

Status: active.
Goal: ship a functional local 0.0.6 install that can run Proslync work.

## Tracks

| Track | Owner | Status | Evidence |
|---|---|---|---|
| Runtime release | runtime sub-orchestrator | open | `tooling/runtime-process-report.mjs` |
| Proslync workspace | cockpit sub-orchestrator | open | `ema cockpit projection --project proslync-app-ios-final --json` |
| Intention recovery | backfeed sub-orchestrator | open | `ema cockpit intentions --project proslync-app-ios-final --json` |
| UI refresh | UI sub-orchestrator | open | Playwright screenshots |
| E2E verification | test sub-orchestrator | open | `pnpm e2e:functional` |
| Doctrine/save | docs sub-orchestrator | open | build/project record diffs |

## Stop Line

Do not replace `/Users/trajanm4air/Desktop/EMA 0.0.6.app` until:

- CLI typecheck passes.
- Daemon tests pass.
- Web build passes.
- Runtime process report can identify live daemon/web listeners.
- Reinstall dry-run passes.
- Cockpit shows Proslync active builds, surfaces, queue, lanes, and intentions.
