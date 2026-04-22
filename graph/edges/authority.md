# Edge: authority (control plane / system of record)

**Rule:** EMA owns truth. Authority lives in the Elixir daemon's
`control_plane/`. No other node may store canonical state.

## Primary
- `codebase-ema` — `code/ema/daemon/lib/ema/control_plane/` (event_log, store,
  replay, execution_supervisor, incidents/*, proposal_events, persistence,
  schema, supervisor)
- `lineage-original-elixir-ema` — `code/daemon/lib/ema/control_plane/`
  (predecessor; confirms continuity)
- `docs-ema-next-steps` — `01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT.md`

## Cross-references
- `02-project-transfer-brief.md` §2, §4
- `03-architectural-evolution-and-major-decisions.md` §6
- `MACBOOK_AGENT_HANDOFF_MASTER.md` §2, §6
- `04-agent-orchestration-and-shared-workspace-briefing.md` §5

## Open
- Org/Space/Project/Membership not yet in `control_plane/schema.ex` — see
  `design-review-fresh-context/05-fresh-context-project-app-model.md`.
