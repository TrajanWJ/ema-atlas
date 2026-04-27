# Decision matrix — Q6 (Discord mirror direction)

Per-question decision matrix for resolving Q6 in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Follows the shape laid
out in [`content/decision-matrix-template.md`](../decision-matrix-template.md)
verbatim.

> A matrix forces you to write the cost on each option **before** you
> pick. The Decision section stays blank until the user chooses.

## Question

`Q6` — `Discord mirror direction (read-only vs bidirectional)`

(Restated verbatim from [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q6.)

The question's stated **blast radius** is "Threads/Server in EMA,
webhook design, permission gating on cross-surface message flow." It
surfaces in [`05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md) §3
(Threads/Server) and [`graph/edges/surfaces.md`](../../graph/edges/surfaces.md).

`OPEN_QUESTIONS.md` names three variants: `read-only mirror to Discord`,
`bidirectional`, `EMA superset with Discord as one rendering target`.

The [`content/vapps/threads-server.md`](../vapps/threads-server.md) and
[`content/vapps/threads-server-deep.md`](../vapps/threads-server-deep.md)
briefs both frame Discord mirroring as **transitional**, not the
end-state center of gravity. That framing shapes the option space
below.

## Options being weighed

| Option | Short name | One-line description |
|---|---|---|
| Option A | `read-only-mirror` | Discord stays as-is; EMA reads Discord messages via webhook into EMA's `event_log` (as adjacent records, not as canonical state). EMA does not write back to Discord. The atlas is where the user operates; Discord becomes a read-only activity feed. This is the safest v0.0.3 shape. |
| Option B | `bidirectional` | EMA and Discord sync both ways. EMA-native threads render into Discord; Discord messages land in EMA with attribution. Requires a two-way permission model and conflict semantics for edits/deletes. |
| Option C | `superset-with-rendering-target` | EMA threads are the canonical state; Discord is **one** of several rendering targets (plus web, plus native). Discord becomes "dumb pipe" — EMA owns all thread objects, Discord just mirrors. |
| Option D | `gateway-bridge-with-policy` | A policy-gated gateway brokers traffic between EMA and Discord. Each Space/Project can opt in to one-way or two-way, with explicit per-channel mapping and per-member attribution rules. |

## Criteria

Scored `+ / 0 / – / blocker` with a one-line "why" inline.

| Criterion | Why it matters | A read-only | B bidirectional | C superset | D gateway |
|---|---|---|---|---|---|
| Aligns with canonical rule (P1) | Surfaces don't own state | + (EMA reads; no canonical data in Discord) | – (Discord state becomes part of truth if not careful) | + (EMA owns; Discord renders) | 0 (depends on gateway enforcement) |
| Compatible with Q1 open | Agent-member attribution | + (attribute webhook-sourced messages to an `ExternalActor(discord_user_id)`) | – (need agent identity settled before two-way writes) | 0 (depends on which vApp does the rendering) | 0 (gateway can defer, but must eventually decide) |
| Smallest provable slice | 2-week vertical possible | + (webhook → `event_log` record; done) | – (conflict semantics alone are multi-week) | – (whole Threads vApp must land first) | 0 (gateway policy layer is moderate scope) |
| Reversible | Can migrate off cleanly | + (just stop reading; no data in EMA was ever Discord-canonical) | – (a lot of EMA state to migrate if we pull back) | 0 (reduce Discord-target; don't change canonical) | + (flip the policy to one-way) |
| Gleam-native | Typed without FFI escapes | + (HTTP webhook → typed envelope) | 0 (discord client library is usually Elixir/Node; FFI needed) | 0 (same) | 0 (same) |
| Auditability | Control-plane-visible | + (every mirror op is an event_log row) | 0 (two-way needs careful attribution) | + (EMA owns; audit is native) | + (gateway logs every decision) |
| Tests writable in v0.0.3 | Properties + examples | + (webhook replay is easy) | – (two-way merge semantics under partition are hard) | 0 (thread-object tests are fine; Discord transport tests need mocks) | 0 (policy tests are tractable) |
| Affects Threads/Server vApp | What the vApp can do | 0 (Discord remains user-facing) | + (Threads becomes primary) | + (Threads is primary by construction) | + (Threads is primary; gateway is optional) |
| Permission gating complexity | Org/Space scope | + (read-only doesn't need write perms) | – (two-way needs per-member write grants) | 0 (EMA-native perms, no Discord policy) | 0 (policy per Space is the whole feature) |

## Costs and bets

### Option A — `read-only-mirror`
- **Bet:** Discord stays the operator surface for v0.0.3; EMA operates
  in parallel through its own surfaces (Threads vApp, atlas, CLI).
  User-facing behavior change is minimal, and the migration path to
  C or D is intact because EMA's canonical state never lived in Discord.
- **Cost:** We don't demonstrate "EMA-native Discord replacement"
  in v0.0.3. The atlas Threads vApp is a read-only viewer plus an
  EMA-internal compose path; Discord users don't see anything new.

### Option B — `bidirectional`
- **Bet:** Users get full parity immediately — post in either surface,
  see the same thread. Strongest "Discord replacement" story.
- **Cost:** The hardest permission + conflict model to get right.
  Edit/delete semantics under network partition require real thought.
  Deferred until Q1 (agent identity) settles because we can't safely
  attribute two-way writes from an agent without a decided identity
  model. Shipping this in v0.0.3 is unrealistic.

### Option C — `superset-with-rendering-target`
- **Bet:** EMA wins by framing. Discord is one of many rendering
  targets; the Threads vApp is the truth. Matches the canonical rule
  most cleanly.
- **Cost:** Requires the Threads/Server vApp to be non-stub at v0.0.3
  ship time. The deeper brief
  ([`content/vapps/threads-server-deep.md`](../vapps/threads-server-deep.md))
  already sketches what this entails; it's more than v0.0.3 has room for.

### Option D — `gateway-bridge-with-policy`
- **Bet:** We get flexibility — each Space picks its own direction. A
  sensible default emerges over time as usage patterns show up.
- **Cost:** Introduces a new subsystem (the gateway) that isn't on the
  `ARCHITECTURE.md` 7-layer stack yet. The policy layer duplicates Q10
  (org/space → runtime perms) territory — may force Q10 resolution
  prematurely.

## Open questions this decision creates

- **How are Discord attachments handled?** Treated as external
  references only, or cloned into `workspace/shared/`?
- **What's the EMA-member attribution for an anonymous Discord webhook
  message?** `ExternalActor(discord_id)` sub-type of `MemberId`? An
  implicit per-Org "guest" member?
- **Rate-limiting on the mirror side** — if Discord ever becomes
  write-heavy (Option B/C/D), we need back-pressure against the
  Discord API limits or risk silent data loss.

## Reversibility plan

- **A → B/C/D later:** Easy. `event_log` is append-only; adding write
  capabilities is an additive schema change.
- **B → A:** Hard. Requires deciding which surface "owns" any thread
  object created during the bidirectional window.
- **C → A/B/D:** Moderate. Threads are canonical in EMA; the migration
  is rendering-target reduction, not data reshaping.
- **D → A/B/C:** Easiest of all — the gateway's policy layer is the
  only thing that flips.

## Provenance

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q6
- [`05-fresh-context-project-app-model.md`](../../05-fresh-context-project-app-model.md) §3 Threads/Server
- [`content/vapps/threads-server.md`](../vapps/threads-server.md)
- [`content/vapps/threads-server-deep.md`](../vapps/threads-server-deep.md)
- [`graph/edges/surfaces.md`](../../graph/edges/surfaces.md)
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) P1
- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q1 (dependency on agent identity)
- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q10 (dependency on perm mapping)

## Decision

> **Resolution:** _[leave blank — user fills in when decided]_
> Recorded in: _[link to commit or decision doc]_
> Affects: Q1 (agent attribution on cross-surface messages) · Q10
> (gateway policy duplicates per-Space perm territory).

Once the Decision is filled in, follow
[`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md):
mark Q6 resolved in `OPEN_QUESTIONS.md`, trim
`graph/edges/surfaces.md` "Open", update any affected working
assumptions in `SECURITY_PRIVACY.md`, prepend a `CHANGELOG.md` entry.

## Cross-references

- [`content/decision-matrix-template.md`](../decision-matrix-template.md)
- [`content/decisions/PRIORITY.md`](PRIORITY.md) — Q6 is currently Tier 4
- [`content/decisions/Q1-agents-as-first-class-members.md`](Q1-agents-as-first-class-members.md)
- [`content/decisions/Q10-org-space-to-runtime-perms.md`](Q10-org-space-to-runtime-perms.md) (sibling, in this wave)
- [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md)
