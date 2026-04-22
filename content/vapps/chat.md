# Chat

The EMA-native interface to local and hosted models. Chat is what
Claude.ai, Codex, and Hermes-CLI each are individually — combined,
EMA-tenanted, harness-aware, and lineage-recording. The chat window is
where most user-visible "running an agent" actually happens.

## What it owns

Nothing canonical. Chat is a **runtime surface** — it renders sessions
that the Hermes execution fabric owns. EMA's control plane keeps the
execution record; Hermes keeps the live process; Chat keeps the human in
the loop.

## What it renders

- Live sessions (token streams, tool-call traces, sub-agent delegations)
- Driver and provider selection (which harness, which model, what
  placement: local / daemon / peer)
- Inline workspace artifact previews (drag a plan into context)
- Chronicle pane: the lineage chain behind the current turn
- Background-results contract messages from async sub-agents

## What humans can do

- Start / fork / branch / archive sessions
- Inject workspace artifacts and wiki nodes as context
- Approve / reject control-plane proposals raised mid-session
- Switch driver targets without losing the conversation
- Promote a session into a workstream or a workspace artifact

## What agents can do via CLI

- `ema chat session start --project --driver --provider --space`
- `ema chat session continue <id> --message`
- `ema chat session fork <id> --at-turn`
- `ema chat session export <id> --to workspace`
- `ema chat tool register --schema` (driver-side tool surface)

## Chronicle / review / memory links

- Each session emits `SessionStart`, `Turn`, `ToolCall`, `Delegation`,
  `SessionEnd` events to the control-plane log.
- Memory links: sessions resolve to workstream + workspace + wiki
  context bundles via the Intelligence Layer's `context_for/2`.
- Reviews live in Threads; a thread can quote a turn by stable id.

## How it satisfies the canonical rule

Chat is a surface, not a runtime. It calls Hermes (`driver.dispatch/2`)
and renders the typed event stream Hermes returns. The session itself
lives in a Hermes Subject, supervised by the runtime tree. Chat code
holds no provider keys, no event log, no replay logic.

## v0.0.3 question

**Yes — ship in v0.0.3.** Chat is the smallest provable slice that
exercises the canonical rule end-to-end (control plane records, Hermes
runs, surface renders). The minimum viable build is a single-driver
(`hermes-native`) chat with one tool and a chronicle pane. Everything
else (multi-driver picker, fork/branch, workspace inject) is iterative.
