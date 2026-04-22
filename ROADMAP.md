# Roadmap

The path from "atlas + lineage archive" to "running EMA v0.0.3 on
Gleam/BEAM" and beyond. Status-honest, not promises.

> The roadmap is **non-prescriptive** about which of the three competing
> futures (Operator Cathedral / Living Workspace / Mesh Commonwealth)
> wins for each part — that's user decision territory. The roadmap only
> tracks **what must be true** before each stage can land.

## Where we are

| Stage | What's done |
|---|---|
| Lineage archive | 36 branches, navigable graph, glossary, open questions, timeline |
| Atlas Next.js app | scaffold + parts + 3 visions per part + briefs/slides/canvas/desktop/graph routes |
| Self-aware docs | INDEX, AGENT_QUICKREF, FAQ, CONTRIBUTING_TO_GRAPH, ATLAS_NOTES, LIB_DATA_CONTRACT |
| Pre-build doctrine | extracted from execudeck, superman, t3code-fork; 15 vault candidate terms surfaced |

## Where we're going (immediate)

### Stage 1 — atlas richness (this week)

- All 8 parts have a rich brief (`content/briefs/<slug>.md`) — *in flight*
- All 8 parts have 3 Mermaid diagrams (`content/diagrams/<slug>/*.mmd`) — *done*
- `/questions`, `/timeline`, `/glossary`, `/futures-board`, `/decisions`,
  `/lineage` routes wired to live data — *in flight*
- Printable-PDF pipeline for `/briefs/<slug>` — *stub*
- Embedded Excalidraw / canvas widgets per part — *stub*
- Codebase reference embed (place.org desktop iframe) on `/desktop` — *stub*

### Stage 2 — v0.0.3 preparation (next 1-2 weeks)

The Gleam/BEAM rewrite needs **minimum answers** to a subset of
[`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) before code can be written:

| Question | What "minimum answer" looks like for v0.0.3 |
|---|---|
| Q1 (agent identity) | Pick one: agents are first-class members **or** always-proxy. Either works for v0.0.3 schema. |
| Q3 (Project ↔ Space) | Pick one cardinality. (Q1 must settle first if agents need to belong to spaces.) |
| Q5 (driver contract) | Lock the typed callbacks (`dispatch/cancel/stream_events`) in a Gleam `pub type Driver` interface. |
| Q5 sub: identity-of-execution | execution_id format and lifecycle. |
| Q6 (Discord direction) | Read-only is fine for v0.0.3. Bidirectional later. |
| Q9 (replication boundary) | Defer. v0.0.3 is single-node by design. |

Full prep spec lives in [`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md).

### Stage 3 — v0.0.3 build (lands in `TrajanWJ/ema`, not this repo)

- OTP supervision tree skeleton (port the Elixir
  `lineage-original-elixir-ema/code/daemon/lib/ema/application.ex` shape)
- `control_plane/event_log` with append-only writes
- `control_plane/proposal_events` + `control_plane/execution_supervisor`
  + `control_plane/incidents/*`
- `sessions/{registry,supervisor,monitor}`
- `babysitter/` (chain_scheduler, takeover_manager, tick_router)
- `surfaces/hermes_client` reference driver
- `simulated-tui` driver for tests
- HTTP API for surfaces (matching ClaudeForge `hermes-provider.ts` contract)

The atlas continues to track all of the above as it lands. The atlas does
**not** become the canonical EMA — it documents and presents EMA.

### Stage 4 — first non-trivial vApp (after v0.0.3)

Pick ONE of the named app surfaces from
[`05-fresh-context-project-app-model.md`](05-fresh-context-project-app-model.md)
to land first. Candidates (no decision):

- **Wiki** (semantic layer, inline prompting)
- **Threads/Server** (Discord replacement, EMA-native)
- **Agent vEnv** (calendar, schedules, queues)
- **Blueprint** (Karpathy-style knowledge structuring)

Use [`howto/add-a-vapp.md`](howto/add-a-vapp.md) — pressure-check the
choice before starting.

### Stage 5 — collaboration plane (when Q2 settles)

Stand up the docs/wiki/canvas subsystem. Until Q2 is decided, this is
deferred. See [`graph/edges/collab.md`](graph/edges/collab.md).

### Stage 6 — mesh / P2P (when single-node semantics are crisp)

The strategic future direction. Explicitly deferred — see
[`graph/edges/transport.md`](graph/edges/transport.md) and
[`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) Q9. The vault candidate term
**Distributed AI Delegation** describes the shape this will likely take.

## Status legend

- *done* — landed, in the repo, verifiable
- *in flight* — actively being built (subagents or hand-edits)
- *stub* — placeholder route or doc, content not yet written
- *deferred* — intentionally not yet started; depends on an upstream decision

## Update protocol

When a stage closes, edit the table at the top to move "in flight" → "done"
in the appropriate row, and prepend a `CHANGELOG.md` entry. When you
discover a new stage that should sit between two existing ones, insert
it with a new number and renumber downstream.

## Cross-references

- [`VISION.md`](VISION.md) — the one-paragraph north star
- [`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md) — prep spec for the rewrite
- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) — what blocks each stage
- [`TIMELINE.md`](TIMELINE.md) — what got us here
- [`ATLAS_NOTES.md`](ATLAS_NOTES.md) — how the atlas presentation layer
  evolves alongside the build
