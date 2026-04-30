# 12 — Hermes integration (preparation stub)

Stub doc. The Hermes seam is already named in
`03-event-catalog-v0.md` as the contract boundary inside the daemon
between `ema_control` (owns `dispatch.*`) and `ema_exec` (owns
`execution.*`, `tool.*`). This file exists so the integration wave has
a landing page and so other docs can `see 12-hermes-integration.md`
instead of duplicating the seam definition.

Status: **not implemented.** No Hermes binary is integrated in wave 1,
and normal Codex/Claude sessions are not Hermes. Current work prepares
the runtime rails that Hermes will need later: Harness Glue for
provider/session dispatch and Chronicle for activity ingestion/search.
`dispatch.*`, `execution.*`, `tool.*` event families are declared and
writers are stubbed but no real Hermes turn runs through them yet.

See `18-harness-glue.md` for the Chronicle + Duct Tape preparation
layer. Hermes consumes that layer later; it does not replace it.

## What Hermes is, in EMA terms

Hermes will be an orchestration/execution engine: it takes a dispatched agent turn
(system prompt + scoped capabilities + a tool catalog) and produces
tool calls, tool results, and an ended-dispatch signal. EMA owns the
*dispatch* half (who is asking, with what scope, under what policy);
Harness Glue owns the provider/session bridge, and Chronicle owns
activity indexing. Hermes coordinates those rails later; it is not the
runtime substrate itself.

The seam is event-sourced, not RPC. Neither half calls the other
directly. Both read and write on the same canonical bus.

## Event contract across the seam

| Direction                     | Event                       | Owner         |
| ----------------------------- | --------------------------- | ------------- |
| control → exec (start a turn) | `dispatch.started`          | `ema_control` |
| control → exec (grant scope)  | `dispatch.scope_granted`    | `ema_control` |
| exec → bus (begin execution)  | `execution.started`         | `ema_exec`    |
| exec → bus (tool call)        | `tool.invoked`              | `ema_exec`    |
| exec → bus (tool result)      | `tool.returned`             | `ema_exec`    |
| exec → bus (tool error)       | `tool.errored`              | `ema_exec`    |
| exec → bus (execution done)   | `execution.ended` / `.failed` | `ema_exec`  |
| control → bus (close dispatch) | `dispatch.ended`           | `ema_control` |

All Hermes events carry `dispatch_id` and `execution_id` on the
envelope so the See Agent Work surface can reconstruct a full turn
from any prefix of the log.

## Capability model

Every dispatch carries a scoped grant:

- `org_id` / `space_id` / `project_id` — what scope the agent may read/write.
- Allowed tool families (e.g. `{ blueprint, attachment, connector }`).
- TTL.
- `secret_ref` handles for any external credentials the tools will need
  (connector tokens, model API keys).

In wave N the grant is serialized as a **Biscuit token** (see
`11-transport-and-auth-survey.md` §2). Biscuit is attenuable and
offline-verifiable, which fits the event-sourced + no-central-auth
shape.

Surfaces MUST never hold or see raw tool credentials or model keys.
They see `dispatch_id` + `secret_ref:<ulid>` only.

## Wave-1 constraint

No Hermes binary runs. No real Hermes agent turns. The catalog entries for
`dispatch.*`, `execution.*`, `tool.*` exist only so:

1. the See Agent Work vApp has a defined event shape to mock against,
2. `ema harness ...` can prove normalized Duct Tape/Chronicle event
   rails before real providers are wired, and
3. Biscuit/secret_ref integration has a named seam to attach to.

A wave-1 daemon may accept a `debug.ping`-style command that emits a
`dispatch.started` + `dispatch.ended` pair for end-to-end testing (per
M1 in `plans/IMPLEMENTATION-ROADMAP.md`). That is not real execution.

The CLI command `ema hermes ...` is therefore a projection seed and
resume-packet preview only. The preparation command that should be used
for provider/session work now is `ema harness ...`.

## Wave-N direction

When Hermes integration lands:

1. `ema_exec/` becomes a real bounded context. One supervisor,
   one writer actor that subscribes to `dispatch.started`, and one
   per-execution actor per active turn.
2. Tool-call transport: out-of-process; the execution actor talks to
   a Hermes subprocess over stdin/stdout JSON framing. Do not embed a
   model runtime inside BEAM.
3. Tool results flow back as `tool.returned` / `tool.errored` events;
   the execution actor writes them to the bus.
4. Biscuit verification happens in `ema_exec` on every incoming
   `dispatch.scope_granted`; if verification fails, emit
   `execution.failed` with `error.class: "forbidden"`.
5. Cancellation: appending `dispatch.ended` with a `cancelled: true`
   flag signals the execution actor to kill its subprocess; the actor
   then emits `execution.ended` with `reason: "cancelled"`.

## Out of scope for this stub

- Which model runtime Hermes itself uses.
- Tool schema format (will reuse whatever the Hermes side defines,
  adapted at the seam).
- Retry / resume semantics for long tool calls.
- Streaming partial tool output (today each `tool.returned` is a
  single final event; streaming is deferred).
- Multi-agent turns in one dispatch (handoff vApp territory — see
  `events/handoff.md`).

## Index

- Event families: `events/dispatch.md`, `events/execution.md`,
  `events/tool.md`
- Capability model + Biscuit: `11-transport-and-auth-survey.md` §2
- Secret ref: `types/secret_ref.md`
- See Agent Work consumer: `09-see-agent-work.md`
