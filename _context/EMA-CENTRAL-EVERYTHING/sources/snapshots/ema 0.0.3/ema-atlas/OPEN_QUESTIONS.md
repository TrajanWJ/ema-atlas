# Open Questions

Single canonical list of unresolved decisions. **Do not resolve here.** This
file is for tracking and cross-referencing — actual decisions get saved to
memory or to the relevant node/edge file with a `> resolved YYYY-MM-DD:`
blockquote.

Each question carries:
- **status** — open / parked / resolved
- **blast radius** — what depends on it
- **where it surfaces** — node/edge/doc paths

---

## Q1 — Are agent identities first-class members of Org/Space?

- **Status:** open
- **Blast radius:** entire identity model, attribution on collab objects,
  permission semantics, audit trail, personal-AI scope resolution
- **Where it surfaces:**
  - `graph/edges/identity.md`
  - `04-agent-orchestration-and-shared-workspace-briefing.md` §1, §2
  - `02-project-transfer-brief.md` §10
  - `MACBOOK_AGENT_HANDOFF_MASTER.md` §16 q3
- **Why it matters:** until decided, every later subsystem will hardcode
  "no scope" assumptions. This is the highest-blast-radius open question.

## Q2 — Is collaboration state in `event_log` or adjacent?

- **Status:** open
- **Blast radius:** entire docs/wiki/canvas subsystem, sync model,
  CRDT-vs-event-log choice, agent-as-editor semantics
- **Where it surfaces:**
  - `graph/edges/collab.md`
  - `02-project-transfer-brief.md` §6, §9, §12 q1-q2
  - `04-agent-orchestration-and-shared-workspace-briefing.md` §6
  - `docs-ema-next-steps/.../ULTIMATE-WIKI-ARCHITECTURE.qmd`

## Q3 — Project ↔ Space cardinality

- **Status:** open
- **Blast radius:** schema design, navigation UI, permission model, personal-AI access resolution
- **Where it surfaces:**
  - `graph/edges/identity.md`
  - `05-fresh-context-project-app-model.md` (uses both terms)
- **Variants in play:** N:M · Project-inside-Space · Space-inside-Project · disjoint-with-shared-membership

## Q4 — Where does the Personal AI execute?

- **Status:** open
- **Blast radius:** P2P design, capability locality, latency budget, secret handling
- **Where it surfaces:**
  - `graph/edges/transport.md`
  - `graph/edges/identity.md`
  - `05-fresh-context-project-app-model.md` ("personal AI can access all projects/spaces")
- **Variants:** user's machine · daemon · Project-affine · per-call placement decision

## Q5 — Harness/driver contract surface

- **Status:** open
- **Blast radius:** every non-`hermes-native` driver, including planned
  `claude-cli`, `codex-cli`, `peer-remote`, `simulated-tui`
- **Where it surfaces:**
  - `graph/edges/execution.md`
  - `codebase-ema/code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md` (plan)
  - `codebase-ema/code/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md`
- **Variants:** sync RPC · streaming events with continuation tokens · gRPC · JSON-RPC

## Q6 — Discord mirror direction

- **Status:** open
- **Blast radius:** Threads/Server in EMA, webhook design, permission gating
  on cross-surface message flow
- **Where it surfaces:**
  - `05-fresh-context-project-app-model.md` §3
  - `graph/edges/surfaces.md`
- **Variants:** read-only mirror to Discord · bidirectional · EMA superset
  with Discord as one rendering target

## Q7 — Surface stack for Launchpad/HQ

- **Status:** open (no commits yet)
- **Blast radius:** native vs web parity story, deployment story (Vercel?),
  shared component library
- **Where it surfaces:**
  - `05-fresh-context-project-app-model.md` (mentions "native desktop app"
    and "website like place.org" without committing)
  - `docs-host-system-launchpad-hq`
  - `docs-frontend-interface-inspirations`

## Q8 — Sync model for docs/wiki/canvas

- **Status:** open (subset of Q2)
- **Variants:** Yjs · Automerge · pure-Elixir CRDT · centralized event log · hybrid

## Q9 — Replication boundary (which records replicate P2P vs stay central)

- **Status:** open, deliberately deferred
- **Where it surfaces:**
  - `02-project-transfer-brief.md` §12 q5
  - `MACBOOK_AGENT_HANDOFF_MASTER.md` §10
- **Note:** must NOT be answered before Q1, Q2, Q3 settle.

## Q10 — How org/space permissions map onto runtime/tool permissions

- **Status:** open
- **Where it surfaces:**
  - `02-project-transfer-brief.md` §12 q6
  - `graph/edges/identity.md`
- **Tension:** simple inheritance vs explicit policy bundles

---

## Operating rule

When you discover a new open question, add it here with the same shape, and
add a back-reference from at least one `graph/edges/*.md` file. When a
question is resolved, mark `status: resolved YYYY-MM-DD →` and link the doc
that holds the decision (do **not** delete the entry — historical context).
