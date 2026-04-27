# Classification Map

This is the first-pass classification of the current EMA-related filesystem.

## Keep as primary sources

### `ema-atlas`

Keep as:
- doctrinal source
- lineage archive
- presentation/deliverables repo

Do not treat as:
- the future 0.0.5 runtime repo

Why:
- it contains too much value to discard
- but it is structurally a transfer/atlas repo, not the clean new EMA runtime
  home

### `ema 3.0.-1`

Keep as:
- 0.0.5 planning source

Do not treat as:
- final codebase root

Why:
- it contains the freshest planning and online research
- but it currently lives inside an unrelated parent workspace

## Keep as donor sources

### `autharis`

Use for:
- lane discipline
- swarm coordination patterns
- shell/desktop inspiration
- shared-workspace operational rigor

Do not merge wholesale into EMA.

Why:
- it is a different product with a different codebase and a dirty tree
- it should be mined selectively, not absorbed blindly

## Keep as archives / synthesis packs

### `ema 0.0.3`

Use for:
- synthesis docs
- implementation notes
- recovered thought
- atlas-adjacent support material

Do not treat as:
- the runtime repo

Why:
- it is better as a research archive and doctrine shelf than as a root project

## Ignore for now

### `code/ema`

Ignore unless later populated intentionally.

Why:
- currently meaningless as an engineering base

## Central target roles to create

The new central EMA world should eventually separate into at least these roles:

1. `ema-runtime`
   - the actual 0.0.5 codebase
2. `ema-docs`
   - living master design docs, PRD, technical docs, visual system docs
3. `ema-atlas`
   - kept as atlas/doctrine/presentation repo
4. `ema-donors`
   - curated donor extracts from Autharis and any other source
5. `ema-archive`
   - snapshots, transfer packs, deprecated iterations

That role separation is more important than any exact folder naming.
