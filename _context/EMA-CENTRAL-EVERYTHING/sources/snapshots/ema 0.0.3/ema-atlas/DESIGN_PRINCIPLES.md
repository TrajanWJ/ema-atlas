# Design Principles

Distilled from `03-architectural-evolution-and-major-decisions.md` §7,
`MACBOOK_AGENT_HANDOFF_MASTER.md` §15+§19, `02-project-transfer-brief.md`
§11, and the Gleam/BEAM orientation in [`GLEAM_NOTES.md`](GLEAM_NOTES.md).

These are the **non-negotiable** principles. Anything that contradicts
one of them needs an explicit `OPEN_QUESTIONS.md` entry before it ships.

---

## The canonical rule (governs everything else)

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

If a proposal feels like it violates this rule, the rule wins. File a
question, don't "fix" the rule.

---

## P1 — Authority before surface

The control-plane truth must be explicit and independent of any
Discord/web/UI affordance. Build the daemon first; the surface is the
last layer, not the first.

*Source:* `03-…major-decisions.md` §7.1.
*Gleam translation:* the `control_plane` OTP application is the only
holder of canonical mutation paths. Surfaces (mist/wisp/lustre routes)
consume typed projections, never call `event_log.append/2`.

## P2 — Execution is a substrate, not an authority

Hermes (or any runtime) executes under EMA lineage. It does not become
a shadow state machine that surfaces have to reconcile against
separately.

*Source:* `03-…major-decisions.md` §7.2.
*Gleam translation:* drivers implement a typed `Driver` contract via
`Subject(DriverMsg)`. Driver outputs land in `event_log` only — never
on a surface socket directly.

## P3 — Workspace state must be shared and durable

Humans and agents need a common place to operate from. Workspace
artifacts (plans, handoffs, notes, exports) live in repo-/space-owned
storage, not in chat scrollback or runtime residue.

*Source:* `03-…major-decisions.md` §7.3, `04-agent-orchestration-and-shared-workspace-briefing.md` §3.

## P4 — Identity layers must stay separate

Execution IDs, provider session IDs, UI session IDs, collaboration
object IDs, and peer identities **must not collapse into each other.**
Most of EMA's hard bugs in the OpenClaw/ClaudeForge era came from
identity conflation.

*Source:* `02-project-transfer-brief.md` §11, `03-…major-decisions.md`
§7.4, FAQ "Things people get wrong".

## P5 — Harnesses are not just providers

A model **provider** (Anthropic, OpenAI, local) is below the harness
layer. A **harness** is the execution shell around a model invocation.
A **driver** is the EMA-side adapter that picks a harness for a given
dispatch. Treating these as one abstraction was named explicitly as one
of the three architecture mistakes to avoid.

*Source:* `MACBOOK_AGENT_HANDOFF_MASTER.md` §20, `GLOSSARY.md`,
`graph/edges/execution.md`.

## P6 — Local semantics before distributed semantics

Do not spread ambiguity across peers. Pin the single-node semantics
first, then add P2P. The strategic mesh future is **deferred** until
local clarity holds — see `OPEN_QUESTIONS.md` Q9.

*Source:* `03-…major-decisions.md` §7.6, `02-project-transfer-brief.md`
§13 risk #6.

## P7 — Extract doctrine, not residue

OpenClaw, place.org, ClaudeForge, agent-os-* contribute **principles
and useful mechanisms**, not accidental baggage. When mining a legacy
branch, use [`howto/extract-doctrine-from-a-legacy-branch.md`](howto/extract-doctrine-from-a-legacy-branch.md);
don't copy code from `doctrine-only` or `inspiration` nodes.

*Source:* `03-…major-decisions.md` §7.7.

## P8 — Capability locality is real

Tools, auth, resources, and devices differ across human shells, agent
turns, daemons, surfaces, and machines. Orchestration must respect this
— it cannot assume every node has the same capabilities.

*Source:* `04-…orchestration.md` §5,
`codebase-ema/code/ema/docs/AGENT-CONTRACT.md`.
*Gleam translation:* every `Dispatch` carries an explicit `placement`
field (`Local | Daemon | Peer(NodeId) | HostAffinity(_)`); the driver
registry resolves placement, not the caller.

## P9 — Collaboration objects may need their own substrate

Live docs/wiki/canvas edits don't fit `event_log`'s append-only shape.
The collaboration plane is **adjacent** to the control plane, not the
same subsystem — see `OPEN_QUESTIONS.md` Q2 + Q8 and
[`research/COLLAB_PLANE_OPTIONS.md`](research/COLLAB_PLANE_OPTIONS.md)
*(in flight)*.

*Source:* `MACBOOK_AGENT_HANDOFF_MASTER.md` §9, `04-…orchestration.md`
§6.

## P10 — Org/Space are first-class

Multi-tenant scoping is part of v1, not a v2 feature. `project_id` (and
`space_id` if Q3 settles inside-project) lands on every control-plane
record from day one. Per-Project event_log shards or per-Space
permission gating cannot be retrofitted cleanly.

*Source:* `02-project-transfer-brief.md` §10,
`05-fresh-context-project-app-model.md`.

---

## The three architecture mistakes (don't make these)

1. **Letting surfaces become the real workspace/state container again.**
2. **Treating providers, runtimes, and agents as the same abstraction.**
3. **Building distributed sync/orchestration before local/shared-state
   semantics are crisp.**

*Source:* `MACBOOK_AGENT_HANDOFF_MASTER.md` §20.

---

## How to use this file

When designing a new part, subsystem, vApp, or driver, run through
P1–P10 and the three mistakes. If your design fights any of them,
either:

1. **Fix the design** — usually the principle is right.
2. **File an `OPEN_QUESTIONS.md` entry** — the principle may need
   nuance for this specific case; surface it before shipping.
3. **Run [`howto/gleam-fit-review.md`](howto/gleam-fit-review.md)** if
   the friction is at the language level (e.g. a principle is hard to
   express cleanly in Gleam types).

Cite specific principles by P-number in commits and PRs:
> `feat: add execution_id propagation through driver registry (P2, P4)`

That keeps the principles visible in the repo's commit history, not
just in this file.

---

## Cross-references

- [`VISION.md`](VISION.md) — the one-paragraph north star
- [`AGENT_QUICKREF.md`](AGENT_QUICKREF.md) — single-page everything
- [`GLOSSARY.md`](GLOSSARY.md) — controlled vocabulary
- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) — what's not yet decided
- [`GLEAM_NOTES.md`](GLEAM_NOTES.md) — Gleam-specific framing
- All `graph/edges/<topic>.md` — per-topic rules that derive from these
  principles
