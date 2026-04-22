# Blueprint

A Karpathy-style knowledge-structuring artifact that integrates with the
Wiki and intent capture. Blueprint is the surface where a project's
shape — concepts, dependencies, intents, open questions — gets drawn as
a structure rather than a stream.

## What it owns

Nothing canonical. Blueprint is a **collaboration-plane** surface that
specializes in a particular kind of collab object: the blueprint graph.
A blueprint is a typed subgraph of the wiki with explicit roles
(concept, intent, question, decision, dependency) and explicit topology
(prerequisite, refines, blocks, derives-from).

## What it renders

- A canvas of blueprint nodes with typed roles and edges
- An "intent stack" panel showing captured intents at the top of the
  graph and the concepts they decompose into below
- Open-question pins anchored to the parts of the graph they pressure
- Live prompts (the same inline-prompt mechanic as the Wiki)
- A "build order" projection that linearizes the graph by dependency

## What humans can do

- Sketch a blueprint by dragging concepts and drawing edges
- Capture a raw intent and decompose it inline
- Pin an open question to a node or edge
- Promote a blueprint subgraph to a wiki-canonical structure
- Export a build-order projection to the workspace as a plan

## What agents can do via CLI

- `ema blueprint create --space --title`
- `ema blueprint node add --kind --label --parent`
- `ema blueprint edge add --from --to --kind`
- `ema blueprint pin-question <node> --question-id`
- `ema blueprint export-plan <id> --to workspace`

## Chronicle / review / memory links

- Each promotion of a blueprint subgraph to wiki-canonical emits a
  `BlueprintPromotion` control-plane event.
- Open questions pinned in a blueprint cross-link to `OPEN_QUESTIONS.md`
  entries by id.
- The Intelligence Layer reads pinned-question density per blueprint as
  a "where is the team thinking hardest right now" signal.

## How it satisfies the canonical rule

Blueprint stores nothing. Nodes and edges live in the collab plane as
typed wiki objects with the `blueprint` tag set. Promotions to
canonical wiki nodes go through the same `collab_plane.propose_edit/2`
gate as any other wiki edit. Blueprint code is pure rendering plus
proposed-mutation emission.

## v0.0.3 question

**After v0.0.3.** Blueprint depends on the Wiki, which depends on the
collab plane. The smallest pre-v0.0.3 stand-in is the existing
`/futures-board` route — a static three-futures-per-question grid is
already a degenerate blueprint. Promote that route into a real blueprint
once the collab plane lands.
