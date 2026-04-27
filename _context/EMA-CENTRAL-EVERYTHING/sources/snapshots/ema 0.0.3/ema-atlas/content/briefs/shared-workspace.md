# Shared Workspace

## The frame

The shared workspace is the place humans and agents are supposed to
co-inhabit instead of merely chatting through. Plans, notes, tasks,
handoffs, threads, files, and exports want to be first-class objects
attached to a project, not loose artifacts scattered across folders and
chat scrollback. The canonical rule applies here in a slightly different
register: **EMA owns truth, Hermes owns execution, surfaces do not own
state.** A workspace artifact is the most tempting place for a surface to
break that rule — it feels like a document, so surfaces want to treat it
like a document. The discipline is that the workspace is a projection of
control-plane facts, even when it looks and reads like a folder of
markdown.

The shape is partially built and unusually concrete. There is a
filesystem-shaped shared workspace at `code/ema/workspace/shared/` with
its own contract, status vocabulary, timestamp rules, and INDEX files
for actors, handoffs, swarm state, and exports. There is also a
database-shaped path inside the daemon: a workspace indexer, an index
store, a synthesizer, and an HTTP controller. Both exist; neither is
clearly canonical. The open question is not whether EMA has a workspace
— it has two — but which artifact types are first-class in v1, and
whether the workspace should ultimately be file-shaped, database-shaped,
or a deliberate hybrid.

## What's already true

- A filesystem workspace is established with a contract:
  `codebase-ema/code/ema/workspace/shared/WORKSPACE_CONTRACT.md`,
  `codebase-ema/code/ema/workspace/shared/START_HERE.md`,
  `codebase-ema/code/ema/workspace/shared/README.md`.
- Conventions are written down rather than implicit:
  `codebase-ema/code/ema/workspace/shared/conventions/STATUS_VOCAB.md`
  and `codebase-ema/code/ema/workspace/shared/conventions/TIMESTAMP_RULES.md`.
- Actors, handoffs, swarm state, and exports each have their own
  directory with INDEX/README:
  `codebase-ema/code/ema/workspace/shared/actors/INDEX.md`,
  `codebase-ema/code/ema/workspace/shared/handoffs/INDEX.md`,
  `codebase-ema/code/ema/workspace/shared/swarm/INDEX.md`,
  `codebase-ema/code/ema/workspace/shared/exports/README.md`.
- A daemon-side workspace subsystem exists in parallel:
  `codebase-ema/code/ema/daemon/lib/ema/workspace/indexer.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/workspace/index_store.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/workspace/synthesizer.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/workspace/supervisor.ex`.
- Workspace is reachable over HTTP:
  `codebase-ema/code/ema/daemon/lib/ema_web/controllers/workspace_controller.ex`,
  with tests in
  `codebase-ema/code/ema/daemon/test/ema_web/controllers/workspace_controller_test.exs`.
- A CLI surface already targets the workspace:
  `codebase-ema/code/ema/cli/ema_cli/commands/workspace.py`.

## What's still open

- **Q1** — agent identity drives attribution on every workspace artifact;
  without it, "claude-a1 wrote this" is convention, not enforcement.
- **Q2** — is collaboration state inside the event log or beside it?
  This single question decides whether wiki/doc edits are workspace
  artifacts in their own right or projections of control-plane events.
- **Q3** — Project ↔ Space cardinality determines what a workspace
  *belongs to*: a project, a space, or a tuple of both.
- **Q8** — sync model for docs/wiki/canvas (Yjs / Automerge / pure-Elixir
  CRDT / centralized event log / hybrid) lands directly on workspace
  artifacts; pick wrong and you rebuild the synthesizer.
- **Q9** — replication boundary controls whether the workspace can
  reasonably exist on more than one machine without a redesign.

## The three futures, expanded

### Workspace as Curated Command Archive (operator-cathedral)

In this future the workspace is small, deliberate, and sharp. Every
artifact has an explicit type — plan, handoff, export, actor card —
attached to a control-plane reality. Improvisation does not happen here;
it happens in chat or scratch, and gets *promoted* into the workspace
when it earns its keep. The current `WORKSPACE_CONTRACT.md` and
`STATUS_VOCAB.md` are the seeds of this stance.

**What this would force you to build first**
- A closed artifact-type registry — extending
  `WORKSPACE_CONTRACT.md` — that the indexer enforces, not just
  documents.
- A promotion flow: a chat message or scratch note becomes a workspace
  artifact via an explicit, control-plane-recorded action.
- A pruner / archiver that keeps the workspace small enough to remain
  legible.

**What this would force you to give up**
- The casual ergonomics of "just drop a file in `shared/`"; every drop
  becomes a typed event.
- A lot of useful informal capture — some real signal will live outside
  the workspace because it never gets promoted.

**Smallest provable slice (2 weeks):** make `handoffs/` enforce a typed
schema. A handoff cannot be created except by a control-plane command;
the indexer rejects rogue files; the HTTP controller exposes a `POST
/handoffs` that is the only legal entry point. One artifact type,
fully closed.

### Workspace as Lush, Inhabited Environment (living-workspace)

This future treats the workspace as a place where work *lives*. Plans,
threads, prompts, files, and agent traces accumulate in one environment
that feels alive, social, and legible over time. The current
filesystem layout — actors, handoffs, swarm, exports, plans, inbox —
already implies this: many surfaces, many artifact kinds, a sense of
inhabitation. The risk is sediment: lush workspaces silt up unless
something composts them.

**What this would force you to build first**
- A unified activity stream over the workspace — combining
  `workspace/indexer.ex`, `workspace/synthesizer.ex`, and the
  filesystem `INDEX.md` files into one rendered "what happened here"
  view.
- A clear authorship and last-touched-by signal on every artifact, so
  agent-vs-human contributions remain legible.
- A composting model: explicit lifecycle for stale artifacts (active →
  cold → archived) tied to `STATUS_VOCAB.md`.

**What this would force you to give up**
- The dream of a tidy workspace; you accept some sediment in exchange
  for emergent richness.
- Strict separability between "workspace" and "knowledge graph" — the
  semantic layer and the workspace start to share surface area.

**Smallest provable slice (2 weeks):** ship a "Workspace Activity"
route built on `workspace/synthesizer.ex` that renders the last N
events across actors, handoffs, swarm, and exports as one chronologic
feed, with author and artifact type on every row. One feed, one
synthesizer, no new schema.

### Workspace as Replica-Friendly Substrate (mesh-commonwealth)

Here the workspace is designed to converge across peers without losing
provenance. Some artifacts are CRDT-shaped (free-form notes, drafts);
others require explicit arbitration (handoffs, plans, status). The
filesystem shape and the daemon shape are reconciled into one substrate
that can replicate, with the synthesizer producing the same view on
every node.

**What this would force you to build first**
- A per-artifact-type convergence policy — which types merge
  automatically and which require a lease.
- A peer-aware indexer extending `workspace/indexer.ex` so it can
  ingest artifacts from another daemon and attribute them.
- A provenance envelope on every artifact recording origin peer,
  authority lease, and merge history.

**What this would force you to give up**
- Single-writer simplicity; the workspace stops being a flat folder and
  becomes a versioned object store.
- Some near-term workspace features — anything that assumes "I am the
  only daemon writing this" gets blocked behind the convergence work.

**Smallest provable slice (2 weeks):** two daemons share one
`shared/inbox/` directory. Notes added on either side converge with
attribution; the synthesizer produces an identical render on both;
conflicting edits surface as explicit "needs arbitration" entries
rather than silent overwrites.

## Decision pressure

1. **Filesystem-shaped vs database-shaped vs hybrid.** Filesystem
   (`workspace/shared/`): grep-friendly, agent-friendly, weak
   constraints. Database (`workspace/index_store.ex`): typed,
   enforceable, opaque to other tools. Hybrid: best of both, double the
   surface to keep coherent.
2. **Open artifact set vs closed artifact set.** Open: anything in
   `shared/` is a workspace object. Closed: only registered types count;
   loose files are noise.
3. **Workspace events on the control-plane bus vs separate workspace
   log.** On the bus: one timeline, heavier `event_log.ex`. Separate
   log: lighter plane, two stories to reconcile.
4. **Promotion-required vs everything-counts.** Promotion: small
   workspace, real friction to capture. Everything-counts: rich workspace,
   sediment guaranteed.
5. **Per-project workspace vs cross-project workspace.** Per-project:
   simple authority story, friction to share. Cross-project: shared
   actors and handoffs work naturally, but Q3 (Project↔Space) becomes
   blocking.
6. **Synthesizer as authoritative view vs synthesizer as one of many
   renders.** Authoritative: surfaces just render; one truth.
   Many-renders: surfaces can specialize, but views drift.

## Read next

- `graph/nodes/codebase-ema.qmd`
- `graph/nodes/lineage-openclaw-agent-workspaces.qmd`
- `graph/nodes/docs-ema-next-steps.qmd`
- `graph/edges/workspace.md`
- `graph/edges/collab.md`
- `graph/edges/memory.md`
- `codebase-ema/code/ema/docs/AGENT_SHARED_WORKSPACE_ARCHITECTURE.md`
- `codebase-ema/code/ema/docs/DATA_MODELS.md`
- `codebase-ema/code/ema/docs/SUPERMAN-FOLDER-SYSTEM-SPEC.md`
- `codebase-ema/code/ema/docs/AGENT-CONTRACT.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/03-IDENTITY/SHARED-WORKSPACE-CAPABILITIES.qmd`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/03-IDENTITY/EMA-SHARED-WORKSPACE-IDENTITY.qmd`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/13-CLI-GUI-PARITY/CLI-GUI-MIRRORED-WORKSPACE-VISION.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/13-CLI-GUI-PARITY/SHARED-WORKSPACE-ACCESS-PATTERNS.qmd`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/17-KNOWLEDGE/WORKSPACE-GRAPH-OBJECTS.qmd`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/05-WIKI/EMA-SHARED-OBJECT-MODEL-DRAFT.md`
