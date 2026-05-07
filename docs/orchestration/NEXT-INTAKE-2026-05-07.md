# EMA next intake - 2026-05-07

## Current working state

The active build is consolidated around daemon-owned coordination. Agents should
orient from daemon registries first:

```bash
ema next --json
ema tl about --summary --json
ema agent orient --json
ema lane list --json
ema queue list --json
ema vcalendar tick --json
```

The empty markdown coordination templates under `Projects/EMA/atlas/workspace/`
are fallback snapshots/templates, not live ownership state.

## Live source of truth

Trust sources in this order:

1. Daemon command result.
2. Daemon registry projection.
3. CLI projection summary.
4. Exported markdown snapshot.
5. Project-record markdown template.

Do not infer idle agents from empty `CLAIMS.md`, `HANDOFFS_PENDING.md`,
`LANES_CATALOG.md`, `PROTECTED_ZONES.md`, or `BLOCKERS.md`.

## Next progress lanes

- Agent Workspace vApp: render `lane.registry`, `queue.registry`,
  `handoff.registry`, `agent.reports`, and `problem.graph` without treating UI
  state as authority.
- Snapshot exporter: generate markdown workspace snapshots from daemon state so
  `Projects/EMA/atlas/workspace/exports/` becomes useful without becoming the
  writer.
- Handoff hygiene: scope and display handoffs by project, lane, actor, and
  status across CLI and See-Agent-Work.
- Problem graph depth: use `problem.log`, `problem.solution`, and
  `problem.link` to capture recurring conceptual failures instead of burying
  them in chat.
- CWT integration: keep `ema cwt ingest` dry-run until the import writer lands;
  promote selected CWT records through daemon queue/lane/problem commands.

## First action for the next agent

Run:

```bash
ema agent orient --json
ema agent meta-progress --json
ema lane list --json
ema queue list --json
```

Then claim or refresh one lane before editing. If the work expands, log the
new slice as a queue item instead of broadening the current lane.
