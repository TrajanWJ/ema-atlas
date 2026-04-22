# Agent Quickref

Single-page everything. If you can only read one file, read this. If you
have more time, follow the links.

## The rule

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

If anything contradicts this rule, the rule wins. File a question against
[`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) before "fixing" something that
seems to violate it — usually the contradiction is a misreading.

## What this repo is

Two things at once:
1. **Lineage archive + graph** — handoff docs, per-branch nodes, topic
   edges, open questions. Everything you need to understand the rewrite
   without checking out every branch.
2. **Atlas Next.js app** *(in progress)* — `app/`, `components/`, `lib/`
   render the graph and selected artifacts as a navigable site.

## The 30-second tour

| You want… | Read |
|---|---|
| The single best brief | [`MACBOOK_AGENT_HANDOFF_MASTER.md`](MACBOOK_AGENT_HANDOFF_MASTER.md) |
| The lineage map | [`SYSTEM_GRAPH.md`](SYSTEM_GRAPH.md) |
| One-page lookup of every term/node/doc | [`INDEX.md`](INDEX.md) |
| Definitions of EMA, Hermes, vApp, etc. | [`GLOSSARY.md`](GLOSSARY.md) |
| What's still unresolved | [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) |
| When things happened | [`TIMELINE.md`](TIMELINE.md) |
| How to load context efficiently | [`AGENT_TRAVERSAL.md`](AGENT_TRAVERSAL.md) |
| Set up a fresh machine | [`AGENT_BOOTSTRAP.md`](AGENT_BOOTSTRAP.md) |
| Newest user PRD framing | [`05-fresh-context-project-app-model.md`](05-fresh-context-project-app-model.md) |
| Swarm workspace doctrine + protocol | [`content/swarm/README.md`](content/swarm/README.md) |
| Recipes (add a driver, vApp, branch...) | [`howto/`](howto/) |
| Rules for changing the graph | [`CONTRIBUTING_TO_GRAPH.md`](CONTRIBUTING_TO_GRAPH.md) |
| Machine-readable graph (for the atlas app) | [`graph.json`](graph.json) |

## The four canonical lineages

| Lineage | Status | Where |
|---|---|---|
| **place.org / placeOS** | doctrine-only (UX metaphor donor) | [`graph/nodes/codebase-place-org.qmd`](graph/nodes/codebase-place-org.qmd) |
| **OpenClaw** | doctrine-only (already absorbed into EMA babysitter/incidents) | [`graph/nodes/lineage-openclaw.qmd`](graph/nodes/lineage-openclaw.qmd) |
| **ClaudeForge / TS surfaces** | doctrine-only (interface contract for Hermes seam) | [`graph/nodes/codebase-claudeforge.qmd`](graph/nodes/codebase-claudeforge.qmd) |
| **EMA daemon (Elixir/Phoenix)** | **canonical** | [`graph/nodes/codebase-ema.qmd`](graph/nodes/codebase-ema.qmd) |

## The three state planes (don't conflate)

| Plane | Owner | Examples |
|---|---|---|
| **Control** | EMA `control_plane/event_log` | proposals, executions, dispatch_updates, incidents |
| **Runtime** | Hermes / drivers | live session continuity, provider IDs, tool progress |
| **Collaboration** | (subsystem TBD — open Q2) | docs, wiki pages, canvas objects, threads |
| **Workspace** | repo-owned `workspace/shared/` | plans, handoffs, notes, exports |

Surfaces render all of the above. Surfaces own none of it.

## The 10 open questions (one-liners)

1. **Q1** — Are agent identities first-class members of Org/Space?
2. **Q2** — Is collaboration state in `event_log` or adjacent?
3. **Q3** — Project ↔ Space cardinality
4. **Q4** — Where does the Personal AI execute?
5. **Q5** — Harness/driver contract surface
6. **Q6** — Discord mirror direction (read-only vs bidirectional)
7. **Q7** — Surface stack for Launchpad/HQ (now partly answered by atlas Next.js choice)
8. **Q8** — Sync model for docs/wiki/canvas
9. **Q9** — Replication boundary (P2P vs central)
10. **Q10** — How org/space permissions map onto runtime/tool permissions

Full text + blast radius in [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md).

## The 11 topic edges

`authority` · `execution` · `surfaces` · `workspace` · `collab` · `identity` ·
`orchestration` · `memory` · `transport` · `ux-metaphor` · `recovery`

Each lives in [`graph/edges/<topic>.md`](graph/edges/) with primary nodes,
secondary nodes, cross-references, and open sub-questions.

## The harness driver targets

Currently named in the docs — none implemented as drivers yet beyond
`hermes-native`:

`hermes-native` · `claude-cli` · `codex-cli` · `peer-remote` · `simulated-tui`

See [`graph/edges/execution.md`](graph/edges/execution.md) and
[`howto/add-a-driver.md`](howto/add-a-driver.md).

## The named app surfaces (from the user's newest PRD)

- **Wiki** — semantic layer (Google Docs + Discord + Wikipedia + Obsidian feel)
- **Chat** — EMA-native interface to local models
- **Threads / Server** — EMA-native Discord replacement, mirrored back to Discord
- **Agent virtual environment app** — agent calendar, schedules, project mgmt
- **Blueprint builder** — Karpathy-style knowledge structuring
- **Launchpad** — Win8/Start-style top-level launcher
- **HQ** — per-user, per-project dashboard
- **Virtual Desktop** — main interface (native + web)

Source: [`05-fresh-context-project-app-model.md`](05-fresh-context-project-app-model.md).
Glossary entries in [`GLOSSARY.md`](GLOSSARY.md).

## The three architecture mistakes to avoid

1. Letting surfaces become the real workspace/state container again.
2. Treating providers, runtimes, and agents as the same abstraction.
3. Building distributed sync/orchestration before local/shared-state
   semantics are crisp.

## Swarm default

If you are joining active multi-agent work, read these before touching shared
coordination state:

1. [`content/swarm/README.md`](content/swarm/README.md)
2. [`content/swarm/active-wave-current.md`](content/swarm/active-wave-current.md)
3. [`content/swarm/fresh-orchestrator-read-order.md`](content/swarm/fresh-orchestrator-read-order.md)
4. [`content/swarm/continuous-progress-protocol.md`](content/swarm/continuous-progress-protocol.md)
5. [`content/swarm/orchestrator-alignment.md`](content/swarm/orchestrator-alignment.md)
6. [`content/swarm/object-model.md`](content/swarm/object-model.md)

If Claude is taking the main deliverables lane:

- orchestrator prompt: [`content/swarm/claude-deliverables-orchestrator-prompt.md`](content/swarm/claude-deliverables-orchestrator-prompt.md)
- worker prompt: [`content/swarm/claude-worker-prompt.md`](content/swarm/claude-worker-prompt.md)
- support lanes: [`content/swarm/deliverables-support-lanes.md`](content/swarm/deliverables-support-lanes.md)
- guardrails: [`content/swarm/vision-guardrails.md`](content/swarm/vision-guardrails.md)
- anti-drift rules: [`content/swarm/no-drift-rules.md`](content/swarm/no-drift-rules.md)

## Numbers

- **36 branches** in this transfer pack — see [`SYSTEM_GRAPH.md`](SYSTEM_GRAPH.md)
- **36 nodes** with structured frontmatter under [`graph/nodes/`](graph/nodes/)
- **91 lineage edges** (preserves_from / inspires / superseded_by / adjacent_to)
- **11 topic edges** under [`graph/edges/`](graph/edges/)
- **10 open questions**
- **33 glossary terms**
- **8 howto playbooks**
- **5 utility scripts** (`probe`, `check-graph`, `manifest`, `index`, `graph-json`)

(Numbers above auto-derivable from [`graph.json`](graph.json) — counts may
drift between commits; trust `graph.json#counts` for the live values.)

## When in doubt

```bash
./scripts/probe.sh            # what state is this machine in?
./scripts/check-graph.sh      # is the graph still consistent?
./scripts/manifest.sh         # regenerate SYSTEM_MANIFEST.json
./scripts/graph-json.sh       # regenerate graph.json
./scripts/index.sh            # regenerate INDEX.md
```

If you change anything in `graph/`, `OPEN_QUESTIONS.md`, or `GLOSSARY.md`,
run `manifest.sh + graph-json.sh + index.sh` before committing — they're
idempotent and fast.
