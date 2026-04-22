# lib/ Data Contract

Formal TypeScript-shaped contract for the data the atlas Next.js app
consumes from this repo. Updated whenever `graph.json` or any of the input
files changes shape. The contract is **descriptive, not prescriptive** —
the source of truth is the actual JSON in [`graph.json`](graph.json) at
the time of build.

## Top-level (`graph.json`)

```ts
type GraphFile = {
  schema_version: 1;
  generated_at: string;        // ISO-8601 UTC, e.g. "2026-04-22T08:45:00Z"
  repo: "TrajanWJ/ema-transfer-pack-20260422-060938";
  canonical_rule: string;      // render verbatim
  counts: {
    nodes: number;
    triples: number;
    topics: number;
    questions: number;
    glossary_terms: number;
  };
  nodes: AtlasNode[];
  triples: AtlasTriple[];
  topics: AtlasTopic[];
  open_questions: AtlasQuestion[];
  glossary: AtlasTerm[];
};
```

## Node

```ts
type NodeStatus =
  | "canonical"      // truth-bearing, code may flow forward
  | "active"         // current planning material
  | "doctrine-only"  // patterns/lessons only, no code reuse
  | "inspiration"    // visual/structural reference
  | "archive"        // fixture / archaeology
  | "meta";          // map of the map

type NodeEra =
  | "place-org"
  | "openclaw"
  | "claudeforge"
  | "ema-daemon"
  | "mesh-p2p"
  | "hybrid"
  | "meta";

type NodeType = "codebase" | "lineage" | "docs" | "recovery" | "meta";

type ContributesTag =
  | "authority" | "execution" | "surface" | "workspace" | "collab"
  | "identity" | "placement" | "memory" | "orchestration" | "doctrine"
  | "ux-metaphor" | "transport" | "driver" | "recovery";

type AtlasNode = {
  id: string;                  // matches `git branch -r` short name
  type: NodeType;
  era: NodeEra;
  status: NodeStatus;
  contributes: ContributesTag[];
  preserves_from: string[];    // ids of parent nodes
  inspires: string[];          // ids of child nodes (reciprocal of preserves_from)
  superseded_by: string[];     // ids
  adjacent_to: string[];       // sibling ids
  referenced_in_docs: string[];// repo-relative doc paths
  key_artifacts: string[];     // paths inside the branch worth git-show'ing first
  aliases: string[];           // historical names / old paths
  load_priority: 1 | 2 | 3 | 4 | 5;  // 1 = read first; 5 = archive
  summary: string;             // first paragraph of the node body
  node_path: string;           // e.g. "graph/nodes/codebase-ema.qmd"
};
```

## Triple (lineage edge)

```ts
type TripleKind =
  | "preserves_from"    // src inherits ideas/code from tgt
  | "inspires"          // src is downstream of tgt   (reciprocal)
  | "superseded_by"     // src replaced by tgt
  | "adjacent_to";      // sibling, no parent-child relationship

type AtlasTriple = {
  source: string;       // node id
  kind: TripleKind;
  target: string;       // node id
};
```

Counts are 4× redundant (every `preserves_from` edge implies an
`inspires` edge in the other direction). Use whichever direction the UI
needs; don't deduplicate naively or you'll lose half the navigation.

## Topic

```ts
type AtlasTopic = {
  topic: string;            // e.g. "authority"
  edge_path: string;        // e.g. "graph/edges/authority.md"
  rule: string;             // the "**Rule:**" line from the edge file
  cited_nodes: string[];    // node ids that appear in the edge file body
};
```

## Open question

```ts
type AtlasQuestion = {
  id: `Q${number}`;          // e.g. "Q1"
  title: string;
  status: string;            // "open" | "parked" | "resolved YYYY-MM-DD → ..."
  blast_radius: string;      // human-readable scope of impact
};
```

## Glossary term

```ts
type AtlasTerm = {
  term: string;              // e.g. "Hermes"
  definition: string;        // markdown, may contain `code`
  source: string;            // path or label of the canonical source
};
```

## Manifest (separate file)

```ts
type ManifestFile = {
  schema_version: 1;
  generated_at: string;
  repo: string;
  canonical_rule: string;
  entry_docs: string[];      // ordered reading list
  branch_count: number;
  node_count: number;
  edge_topics: string[];
  branches: Record<string, string>;  // branch name -> head sha
  nodes: AtlasNode[];        // duplicates graph.json#nodes; manifest is the lighter file
};
```

`SYSTEM_MANIFEST.json` is the lighter index; `graph.json` is the rich
view. Most app routes should consume `graph.json`. Use the manifest only
for build-time integrity checks (e.g. "does every cited node id exist as
a branch?").

## Stability guarantees

- **Field renames bump `schema_version`.** If you ever ship a breaking
  schema change, update `scripts/graph-json.sh`, this contract, and any
  consumer in `lib/` together — and bump `schema_version`.
- **Adding fields is non-breaking.** Consumers should ignore unknown keys.
- **The controlled vocabularies** (`NodeStatus`, `NodeEra`, `NodeType`,
  `ContributesTag`, `TripleKind`) are extended via `graph/SCHEMA.md` and
  this file in the same commit.

## Validation snippet

```ts
// lib/validate-atlas.ts (sketch)
import graph from '../graph.json';

function validate() {
  if (graph.schema_version !== 1) throw new Error("schema mismatch");
  const ids = new Set(graph.nodes.map(n => n.id));
  for (const t of graph.triples) {
    if (!ids.has(t.source) || !ids.has(t.target))
      throw new Error(`dangling triple: ${t.source} -${t.kind}-> ${t.target}`);
  }
  for (const topic of graph.topics) {
    for (const id of topic.cited_nodes) {
      if (!ids.has(id))
        throw new Error(`topic ${topic.topic} cites missing node ${id}`);
    }
  }
}
validate();
```

Run this in `prebuild` (or in a Vitest unit test) so a graph regression
fails fast before the atlas ships stale wiring.

## Cross-references

- [`graph/SCHEMA.md`](graph/SCHEMA.md) — node frontmatter (source of truth for vocab)
- [`ATLAS_NOTES.md`](ATLAS_NOTES.md) — how the app should consume this contract
- [`scripts/graph-json.sh`](scripts/graph-json.sh) — emitter for `graph.json`
- [`scripts/manifest.sh`](scripts/manifest.sh) — emitter for `SYSTEM_MANIFEST.json`
