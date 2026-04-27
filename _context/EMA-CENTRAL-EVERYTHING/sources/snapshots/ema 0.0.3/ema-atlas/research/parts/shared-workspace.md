# Shared Workspace — Gleam mapping

## Part summary

The shared workspace is where humans and agents co-inhabit through
plans, handoffs, exports, actor cards, swarm state and notes — typed
artifacts attached to a project rather than loose files. The Elixir
tree already has both a filesystem layout under
`code/ema/workspace/shared/` (with a written `WORKSPACE_CONTRACT.md`
and `STATUS_VOCAB.md`) and a daemon-side subsystem
(`workspace/{indexer,index_store,synthesizer,supervisor}.ex`). The
Gleam port treats the filesystem as the storage substrate but exposes
artifacts through a typed `WorkspaceArtifactId` and a closed
`ArtifactKind` sum.

## Type sketch

```gleam
import gleam/option.{type Option}
import gleam/dict.{type Dict}

pub opaque type WorkspaceArtifactId { WorkspaceArtifactId(String) }

pub type ArtifactKind {
  Plan
  Task
  Handoff
  Note
  ActorCard
  SessionExport
  ContextBundle
}

pub type ArtifactStatus {
  Draft
  Active
  Cold
  Archived
  NeedsArbitration
}

pub type Artifact {
  Artifact(
    id: WorkspaceArtifactId,
    kind: ArtifactKind,
    project: ProjectId,
    title: String,
    body_path: String,            // path under workspace/shared/
    author: Actor,
    last_touched_by: Actor,
    status: ArtifactStatus,
    created_at_ms: Int,
    updated_at_ms: Int,
    provenance: Provenance,
  )
}

pub type Provenance {
  Provenance(
    origin_peer: Option(PeerId),
    via_command: Option(String),  // event_log seq id
    merge_history: List(String),
  )
}

pub type IndexEntry {
  IndexEntry(id: WorkspaceArtifactId, fts_blob: String, kind: ArtifactKind)
}
```

## Actor sketch

```gleam
pub type IndexerMsg {
  Reindex(reply_to: Subject(Result(Int, IndexerError)))
  Notify(path: String)            // filesystem watcher hook
  Lookup(id: WorkspaceArtifactId, reply_to: Subject(Option(Artifact)))
}

pub type StoreMsg {
  Put(entry: IndexEntry)
  Search(query: String, reply_to: Subject(List(IndexEntry)))
}

pub type SynthesizerMsg {
  ActivityFeed(project: ProjectId, limit: Int,
               reply_to: Subject(List(Artifact)))
}

pub type WatcherMsg {
  FsEvent(path: String, kind: FsEventKind)
}

pub type FsEventKind { Created Modified Deleted }
```

- `ema/workspace/indexer` — owns `Subject(IndexerMsg)`. Maps to
  `Ema.Workspace.Indexer`.
- `ema/workspace/store` — `Subject(StoreMsg)`, wraps SQLite FTS5. Maps
  to `Ema.Workspace.IndexStore`.
- `ema/workspace/synthesizer` — `Subject(SynthesizerMsg)`. Maps to
  `Ema.Workspace.Synthesizer`.
- `ema/workspace/watcher` — `Subject(WatcherMsg)`, wraps a `:fs`
  filesystem watcher. No direct Elixir analog (today the indexer scans
  on tick).
- `ema/workspace/supervisor` — wraps the four above. Maps to
  `Ema.Workspace.Supervisor`.

## Supervision tree fragment

```text
root_supervisor
└── workspace/supervisor (one_for_one)
    ├── workspace/store
    ├── workspace/indexer
    ├── workspace/watcher
    └── workspace/synthesizer
```

The workspace tree boots after `persistence/repo` (it needs the SQLite
handle for FTS5) and after `identity/registry` (artifacts need a
`ProjectId` to be addressable), but before `surfaces/supervisor`.

## Where it leans on Erlang/Elixir interop

- `:fs` (the `fs` Hex package, an Erlang FS-events wrapper) for
  filesystem notifications — Gleam has no native filesystem watcher.
  Wrap as a typed `WatcherMsg` actor.
- `:filelib.wildcard/1` and `:file.list_dir/1` for initial scans.
- `:erlang.binary_to_term/1` is *not* used for artifact bodies —
  artifacts stay markdown / JSON on disk; only the index is binary.
- SQLite FTS5 via the `sqlight` Hex package; if FTS5 features are
  missing, FFI to `:esqlite3` and execute raw `MATCH` queries.
- For checksums on artifacts (provenance integrity),
  `:crypto.hash(:sha256, bytes)` via `gleam_crypto` or direct FFI.
- `:erlang.system_time(:millisecond)` for timestamps.

## Tests this part needs at v0.0.3

- Round-trip test: write a `Handoff` artifact via the indexer, search
  via `store.Search`, fetch via `indexer.Lookup`; recovered artifact
  equals input.
- Property test (`gleam_qcheck`): for any list of `Artifact` writes
  with unique IDs, the synthesizer's activity feed returns them in
  `updated_at_ms` descending order.
- Filesystem-vs-index consistency test: write a markdown file directly
  under `workspace/shared/handoffs/`, fire a fake `FsEvent(Created)`,
  assert the indexer adopts it within N ticks.
- Type-separation test: a `WorkspaceArtifactId` cannot be passed where
  an `ExecutionId` or `SessionId` is expected (compile-fail fixture).
- Activity-feed slice test (per gate #10 of EMA_V0_0_3_PREP.md): every
  workspace artifact type from `graph/edges/workspace.md` (plan, task,
  handoff, note, session export, context bundle) is addressable from a
  control-plane record by ID.
- Status-vocab enforcement test: an artifact with `Status` not in the
  closed sum is rejected at decode time (golden test against the
  `STATUS_VOCAB.md` rule).

## Open questions specific to Gleam mapping

- **Q1** — `Artifact.author` must be an `Actor`, but until agent
  identity is first-class, agent-authored artifacts collapse to
  `HumanActor` and the indexer attribution is approximate.
- **Q2** — if collaboration state moves into `event_log`, then
  `Artifact` becomes a projection actor over events rather than a
  filesystem reader; the Gleam-side decision on whether `workspace`
  owns its own log is blocked on this. Q2 still open.
- **Q3** — `Artifact.project: ProjectId` assumes a single project.
  If Spaces span projects (Q3 N:M), every artifact needs an additional
  `space: Option(SpaceId)` field that today does not exist.
- **Q8** — without a chosen sync model for collab docs, the `Note`
  and `Plan` artifact kinds cannot pick between "markdown file the
  indexer reads" and "Yjs/Automerge document the synthesizer
  projects." With no Gleam-native CRDT lib, FFI to a Node-side Yjs
  process or a pure-Elixir CRDT becomes the forced fork.
- **Q9** — `Provenance.origin_peer` is typeable today but every value
  is `None` until replication ships. The merge_history field is
  speculative.

## Read next

- `graph/edges/workspace.md`, `graph/edges/collab.md`,
  `graph/edges/memory.md`
- `content/briefs/shared-workspace.md`
- `codebase-ema/code/ema/workspace/shared/{WORKSPACE_CONTRACT.md,conventions/STATUS_VOCAB.md,conventions/TIMESTAMP_RULES.md}`
- `codebase-ema/code/ema/daemon/lib/ema/workspace/{indexer,index_store,synthesizer,supervisor}.ex`
- `EMA_V0_0_3_PREP.md` gate #10
- `OPEN_QUESTIONS.md` Q1, Q2, Q3, Q8, Q9
- `sqlight` Hex docs: https://hexdocs.pm/sqlight/
