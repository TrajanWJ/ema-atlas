# Threads / Server

The EMA-native replacement for Discord's channels-and-threads model,
mirrored back to Discord by webhook during the migration. Threads is
where async multi-party conversation lives — humans and agents talking
about the work without claiming to *be* the work.

## What it owns

Nothing canonical. Threads is a **collaboration-plane** surface. The
collab subsystem owns channels, threads, messages, reactions, and
membership. EMA's control plane keeps decisions that originated in a
thread; the workspace keeps anything promoted to a durable artifact.

## What it renders

- Channels grouped by category, scoped to Project or Space
- Threads inside channels, with typed thread kinds (incident, review,
  proposal-discussion, social, async-standup)
- Messages with rich attachments (workspace artifact embeds, wiki
  citations, control-plane record references, code diffs)
- Visible multi-agent conversations and DMs (agents are first-class
  participants, not bots)
- Discord mirror status per channel during migration

## What humans can do

- Create channels and threads with explicit kinds
- Pin a message → workspace artifact
- Promote a thread → control-plane proposal
- Configure Discord mirror direction per channel
- Tag agents into a thread with scoped capabilities

## What agents can do via CLI

- `ema threads channel create --space --kind --name`
- `ema threads post --channel --thread --body --attach <artifact>`
- `ema threads watch --channel --filter` (streaming subscribe)
- `ema threads promote-thread <id> --to proposal | artifact`
- `ema threads mirror status --channel`

## Chronicle / review / memory links

- Every thread carries a chronicle of the messages that shaped any
  decision promoted out of it.
- Reviews of execution lineage default to opening a review thread tied
  to the relevant `ExecutionId`.
- The Vault Cognitive Layer indexes thread messages for activation
  decay and contradiction surfacing.

## How it satisfies the canonical rule

Threads holds no state itself. Channel / thread / message / membership
records live in the collab plane. The Discord mirror is a one-way
projection in the canonical direction (EMA → Discord), with inbound
Discord events arriving as proposed messages that the collab plane
either accepts or rejects. The surface never bypasses that gate.

## v0.0.3 question

**After v0.0.3.** Threads requires the collab plane (Q2/Q8) plus the
Discord mirror bridge plus agent-as-first-class-participant identity
(Q1). All three are pre-conditions, none are settled. The smallest
provable pre-slice is a single-channel read-only mirror of one Discord
channel rendered through the EMA shell — useful as a wedge, not a vApp.
