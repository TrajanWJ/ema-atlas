# @ema/agent-blueprint-grower

Auto-grow Blueprint agent. Subscribes to the daemon's `event_trail` and `collab.document` projection streams; when prose contains a recognised pattern, the agent emits the matching `blueprint.*` canonical event.

Per the v0.1 design at `Projects/EMA/atlas/incubating/skills-and-wiki-catalog.md`. Deliberately **not** an MCP server — the canonical CLI surface is the LLM-callable contract; this agent is a passive observer that converts free prose into canonical mutations.

## Patterns

| Trigger | Action |
| --- | --- |
| `Eventually EMA should…`, `It would be amazing if…`, `Long-term I want…`, `The dream is…` | `blueprint.aspiration.capture` (timeframe `long_term`, `source_type` `auto_detected`) |
| `DECIDED: …`, `Decision: …`, `## Decision …` | `blueprint.decision.lock` |
| `GAP: <q>?`, `GAC: <q>?`, `Question: <q>?` | `blueprint.gac.create` (skipped if `EMA_BLUEPRINT_DOC_ID` unset) |
| `BLOCKED: …`, `Blocker: …` | `blueprint.blocker.open` |

All emissions use `actor:agent:blueprint-grower`.

## Run

```bash
pnpm install
pnpm --filter @ema/agent-blueprint-grower build
pnpm --filter @ema/agent-blueprint-grower start
```

Required env (optional):
- `EMA_IPC_URL` — defaults to `ws://127.0.0.1:49555`
- `EMA_ORG_ID` — defaults to `org:01J00000000000000000000001`
- `EMA_BLUEPRINT_DOC_ID` — required for GAC creation; without it, GAC detections log a warning and are skipped

## Disable

Kill the process. There is no env flag — the agent is opt-in by virtue of being launched.

## Local testing

The CLI does not currently expose an "inject chat event" command, so the canonical end-to-end flow is exercised by:

1. Run `pnpm --filter @ema/agent-blueprint-grower test` — runs `node:test` over `src/detectors.test.ts` to verify pattern detection.
2. Pipe a sample prose document containing trigger lines through the running agent's stdin, OR write to the shared collab document via `ema collab` once that surface lands.

A first-class trigger-injection CLI is a follow-up.

## Idempotency

The agent maintains an in-memory `Set` of sha256 fingerprints with a 60-second TTL. The same line will not produce duplicate emissions within that window, which protects against `event_trail` projection re-broadcasts during the agent's lifetime.

## Reconnect

Exponential backoff on disconnect, capped at 10 seconds.
