# EMA Corpus Navigation

This file turns the EMA local corpus into one practical navigation surface.

It is for:

- cross-pollinating design thinking across EMA branches and donor lineages
- finding the right source quickly with `rg`
- navigating the atlas graph via `.qmd` nodes and edge files
- keeping current design work anchored to the newest source of truth

## 1. Source Priority

For active EMA design writing, use this precedence:

1. Current working design doc in this workspace
2. Local EMA 0.0.3 synthesis docs
3. EMA Atlas graph, branch nodes, briefs, decisions, and how-to docs
4. Transfer-pack branch lineage and donor codebase references
5. Autharis shared swarm/dispatch patterns as operational donor material

This keeps the newest framing in charge while still mining the older branches aggressively.

## 2. Local Corpus Roots

Primary roots on disk:

- `/Users/tawj/Desktop/Kor - Autharis/ema 3.0.-1`
- `/Users/tawj/Desktop/ema 0.0.3`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas`
- `/Users/tawj/Desktop/ema 0.0.3/transfer-pack`
- `/Users/tawj/Desktop/Kor - Autharis/autharis`

What each root is best for:

- `ema 3.0.-1`
  - current design drafting workspace
- `ema 0.0.3`
  - cross-pollination docs, synthesis packs, recovery notes, inventories
- `ema-atlas`
  - graph navigation, branch nodes, topic edges, decisions, briefs, vApp docs
- `transfer-pack`
  - compact handoff root and branch-lineage framing
- `autharis`
  - real swarm lane discipline, dispatch patterns, shell primitives, coordination donor material

## 3. Fast Read Order

If you need the fastest possible full-orientation pass:

1. `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/README.md`
2. `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/MACBOOK_AGENT_HANDOFF_MASTER.md`
3. `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/SYSTEM_GRAPH.md`
4. `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/GLOSSARY.md`
5. `/Users/tawj/Desktop/ema 0.0.3/ema-003-lineage-architecture-synthesis.md`
6. `/Users/tawj/Desktop/ema 0.0.3/ema-003-gleam-beam-bounded-contexts.md`
7. `/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md`
8. `/Users/tawj/Desktop/ema 0.0.3/ema-003-github-cross-pollination-map.md`
9. `/Users/tawj/Desktop/ema 0.0.3/ema-003-knowledge-graph-hub.md`

## 4. Atlas-First Navigation

The atlas already contains the best structure for traversing EMA without brute-force reading.

Core atlas files:

- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/SYSTEM_GRAPH.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/SCHEMA.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/nodes/*.qmd`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/edges/*.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/load-context-for-a-task.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph.json`

How to use it:

1. Start in `SYSTEM_GRAPH.md`.
2. Choose a topic edge, not a random branch.
3. Open the relevant `graph/edges/<topic>.md`.
4. Read the primary node `.qmd` files.
5. Pull only the `key_artifacts` you need from those nodes.

Important topic edges:

- `authority`
- `execution`
- `surfaces`
- `workspace`
- `collab`
- `identity`
- `orchestration`
- `memory`
- `transport`
- `ux-metaphor`

## 5. Branch Families That Matter Most

Highest-value branch families from the local atlas:

- `ema-daemon`
  - `codebase-ema`
  - `lineage-original-elixir-ema`
  - `docs-ema-next-steps`
- `surface and shell doctrine`
  - `codebase-claudeforge`
  - `docs-host-system-launchpad-hq`
  - `codebase-place-org`
  - `codebase-place-companion`
- `shared workspace and orchestration`
  - `lineage-openclaw`
  - `lineage-openclaw-agent-workspaces`
  - `codebase-multi-agent-expirements`
- `memory and semantic layer`
  - `docs-vault-wiki`
  - `docs-host-obsidian-vault`
  - `docs-host-vault-context`
- `meta and framing`
  - `main`
  - `lineage-index`
  - `design-review-fresh-context`

Use these as cross-pollination donor clusters:

- control plane and truth: `codebase-ema`, `lineage-original-elixir-ema`
- harness/runtime seam: `codebase-ema`, `codebase-claudeforge`
- workspace discipline: `lineage-openclaw-agent-workspaces`, `autharis/_shared`
- HQ / Launchpad / Desktop posture: `docs-host-system-launchpad-hq`, `codebase-place-org`
- semantic wiki / knowledge plane: `docs-vault-wiki`, atlas briefs and decisions

## 6. Autharis Donor Material

Autharis is useful as a real swarm-work discipline donor, especially:

- `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`
- `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/dispatch/`

What to preserve from Autharis:

- lane decomposition
- dispatch ownership
- coordination through explicit shared files
- shell primitives and work slicing

What not to preserve directly:

- app-specific domain language
- any local file ritual that should become canonical EMA objects

## 7. Search Modes

### A. Whole-corpus search

Use the helper script in this folder:

```bash
./ema-corpus-rg.sh "intent|canon|proposal|plan|spec"
./ema-corpus-rg.sh "Launchpad|HQ|Virtual Desktop|Blueprint"
./ema-corpus-rg.sh "soul|belief|persona|agent"
```

### B. Atlas graph search

Search branch nodes and topic edges:

```bash
rg -n "load_priority|key_artifacts|preserves_from|inspires" \
  /Users/tawj/Desktop/ema\ 0.0.3/ema-atlas/graph/nodes

rg -n "Primary nodes|Secondary nodes|Rule" \
  /Users/tawj/Desktop/ema\ 0.0.3/ema-atlas/graph/edges
```

### C. Cross-pollination search

Search all high-signal docs, excluding build output:

```bash
rg -n --glob '!**/node_modules/**' --glob '!**/.next/**' \
  --glob '!**/.git/**' \
  "EMA owns truth|Hermes owns execution|shared workspace|intent|canon" \
  /Users/tawj/Desktop/ema\ 0.0.3 \
  /Users/tawj/Desktop/Kor\ -\ Autharis/autharis
```

### D. QMD node search

The `.qmd` nodes are the branch graph. Search them directly:

```bash
rg -n "^id:|^era:|^status:|^contributes:|^key_artifacts:" \
  /Users/tawj/Desktop/ema\ 0.0.3/ema-atlas/graph/nodes/*.qmd
```

### E. Decisions search

```bash
rg -n "Q[0-9]+|Status:|Blast radius:" \
  /Users/tawj/Desktop/ema\ 0.0.3/ema-atlas/OPEN_QUESTIONS.md \
  /Users/tawj/Desktop/ema\ 0.0.3/ema-atlas/content/decisions
```

## 8. Search Recipes By Design Topic

Executive doctrine:

```bash
./ema-corpus-rg.sh "core thesis|north star|shared human-agent|durable truth"
```

Intent / canon workflow:

```bash
./ema-corpus-rg.sh "intent|canon|proposal|plan|spec|execution"
```

HQ / Launchpad / Desktop:

```bash
./ema-corpus-rg.sh "Launchpad|HQ|Virtual Desktop|desktop shell|ux-metaphor"
```

Wiki / semantic layer / blueprint:

```bash
./ema-corpus-rg.sh "wiki|semantic layer|blueprint|knowledge graph|vault"
```

Agent model / soul / debate:

```bash
./ema-corpus-rg.sh "agent|soul|belief|debate|simulation|stakeholder"
```

Project / org / space / identity:

```bash
./ema-corpus-rg.sh "organization|project|space|membership|personal ai|identity"
```

Runtime / Hermes / harness:

```bash
./ema-corpus-rg.sh "Hermes|harness|driver|runtime|session|execution"
```

Swarm coordination / lanes / temporal system:

```bash
./ema-corpus-rg.sh "lane|handoff|queue|weekly phase|calendar|checkup"
```

## 9. Practical Navigation Rules

- Search the atlas graph before reading raw branches.
- Read by topic edge, not by chronology.
- Use `.qmd` nodes as branch headers and `key_artifacts` as the first drill-down.
- Treat `codebase-ema` as the main implementation spine.
- Treat `place-org` and `place-companion` as shell/UX donors, not truth owners.
- Treat `openclaw` and `autharis/_shared` as swarm-discipline donors, not direct product canon.
- Treat `design-review-fresh-context` and your current local design doc as the newest framing layer.

## 10. If You Want This To Become a Real EMA Knowledge Plane

The next useful upgrades would be:

- promote this navigation file into atlas or the active design repo
- add a dedicated `soul` node and `temporal-system` node to the atlas graph
- add a generated cross-repo concept index
- add a small script that renders search results grouped by repo root
- expose `graph.json` plus concept docs as the seed of EMA's future wiki/semantic layer
