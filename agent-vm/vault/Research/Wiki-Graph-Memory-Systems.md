---
title: "Wiki-Graph-Memory Systems: Code Graph Context, GitNexus, and Graph-Based AI Memory"
tags: [research, graph-memory, knowledge-graph, AI-agents, CodeGraphContext, GitNexus, GraphRAG, MemOS, vault-architecture]
created: 2026-04-01
updated: 2026-04-01
status: complete
---

# Wiki-Graph-Memory Systems

A deep-dive into code graph context systems, git-based knowledge graphs, and graph-based memory architectures for AI agents — with a focus on making a wiki/vault serve double duty as both a human-readable knowledge base and a machine-readable graph memory system.

---

## 1. CodeGraphContext — Code as a Queryable Graph

### What It Is

[CodeGraphContext](https://github.com/CodeGraphContext/CodeGraphContext) is an MCP server + CLI toolkit that indexes local code into a graph database, turning any codebase into a queryable knowledge graph accessible to AI agents and developers. 2,700+ GitHub stars. MIT license. Python 3.10–3.14.

**Core idea:** Instead of giving an AI assistant raw file contents, you give it a structured graph of how code *relates* — what calls what, what inherits from what, what imports what. The AI queries the graph rather than reading files sequentially.

### How It Works

**Parsing layer:** Uses [tree-sitter](https://tree-sitter.github.io/) to parse source files across 14 languages (Python, JS, TS, Java, C/C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, Dart, Perl). From each file, it extracts:
- Functions and methods (with signatures and parameters)
- Class definitions and inheritance relationships
- Import/dependency statements
- Function call relationships (who calls what)

**Graph layer:** Extracted relationships get loaded into a graph database backend:
- **KùzuDB** (default) — embedded, zero-config, cross-platform, fast
- **FalkorDB Lite** — Unix-only, in-process alternative
- **Neo4j** — enterprise option via Docker or native install

The graph schema is straightforward: nodes for `Function`, `Class`, `Module`, `File`; edges for `CALLS`, `INHERITS`, `IMPORTS`, `DEFINES`, `CONTAINS`.

**MCP layer:** Exposes graph queries as MCP tools that AI assistants (Claude, Cursor, Codex, Windsurf) call via Model Context Protocol. Natural language queries like "what calls `process_payment`?" get translated to graph traversals.

**CLI layer:** Standalone commands for humans — `cgc index .`, `cgc analyze callers my_function`, `cgc analyze complexity`, dead code detection, visualization.

### MCP Tools Exposed

| Tool | What It Does |
|---|---|
| `callers` | Find all functions that call a given function |
| `callees` | Find all functions called by a given function |
| `call_chain` | Trace execution path between two functions |
| `class_hierarchy` | Show inheritance tree |
| `dead_code` | Find unreachable functions |
| `complexity` | Identify complex hotspots |
| `dependencies` | Map module/file imports |

### Live File Watching

`cgc watch` monitors a directory and automatically updates the graph when files change — critical for active development workflows where the graph must stay current.

### Pre-indexed Bundles (.cgc)

Famous repos (e.g., Flask, FastAPI, CPython) can be shipped as `.cgc` bundle files — load instantly without re-indexing. Enables sharing graph context snapshots.

### Surfacing in a Wiki

Practical patterns for integrating CodeGraphContext into a Quartz/Obsidian vault:

1. **Generate graph exports to markdown** — `cgc analyze` outputs can be piped to markdown files in the vault (e.g., `vault/Code/project-call-graph.md`)
2. **Architecture notes with live queries** — Write vault notes that describe system architecture, link to code symbols by name; CI jobs can regenerate the note when graph changes
3. **Dead code reports** — Scheduled `cgc analyze deadcode` → vault note updated via cron
4. **Dependency maps** — `cgc analyze dependencies` → mermaid diagram → vault note

**Source:** [https://github.com/CodeGraphContext/CodeGraphContext](https://github.com/CodeGraphContext/CodeGraphContext)

---

## 2. GitNexus — The Zero-Server Code Intelligence Engine

### What It Is

[GitNexus](https://github.com/abhigyanpatwari/GitNexus) is a client-side knowledge graph creator for code repositories. 21,100+ GitHub stars. Tagline: "Building the nervous system for agent context."

**Core idea:** Indexes *any* codebase into a knowledge graph capturing every dependency, call chain, cluster, and execution flow — then exposes this through MCP tools so AI agents never miss code relationships. Runs entirely client-side (CLI/local) or in-browser (no server required for web UI).

### GitNexus vs DeepWiki

GitNexus explicitly positions itself against DeepWiki:

> "Like DeepWiki, but deeper. DeepWiki helps you understand code. GitNexus lets you *analyze* it — because a knowledge graph tracks every relationship, not just descriptions."

DeepWiki generates documentation. GitNexus generates a queryable structural map.

### Architecture

**Two modes:**

| Mode | Use Case | Storage | Parsing |
|---|---|---|---|
| CLI + MCP | Daily dev with Cursor/Claude Code/Codex | LadybugDB native (fast, persistent) | tree-sitter native |
| Web UI | Quick exploration, demos | LadybugDB WASM (in-memory per session) | tree-sitter WASM |

**Bridge mode:** `gitnexus serve` lets the web UI connect to the CLI's locally-indexed repos — no re-upload needed.

**LadybugDB** is GitNexus's custom embedded graph database (details not yet public), optimized for code graph workloads.

### One-Command Setup

```bash
npx gitnexus analyze   # indexes, installs skills, writes AGENTS.md/CLAUDE.md
gitnexus setup         # auto-detects editors, writes global MCP config
```

After `analyze`, GitNexus:
- Builds the graph from tree-sitter parse
- Installs agent skills (repo-specific skill files from detected code communities)
- Registers Claude Code PreToolUse + PostToolUse hooks (auto-augment searches with graph context, auto-reindex after commits)
- Creates `AGENTS.md` and `CLAUDE.md` context files

### MCP Tools (7 total)

| Tool | What It Does |
|---|---|
| `list_repos` | Discover all indexed repositories |
| `query` | Hybrid search: BM25 + semantic + RRF fusion |
| `get_symbol` | Look up a specific function/class/symbol |
| `get_dependencies` | Get what a symbol depends on |
| `get_callers` | Find callers of a symbol |
| `get_callees` | Find callees of a symbol |
| `get_clusters` | Show detected code communities/clusters |

### Editor Integration Depth

| Editor | MCP | Skills | Hooks |
|---|---|---|---|
| Claude Code | ✓ | ✓ | PreToolUse + PostToolUse |
| Cursor | ✓ | ✓ | — |
| Codex | ✓ | ✓ | — |
| Windsurf | ✓ | — | — |
| OpenCode | ✓ | ✓ | — |

Claude Code gets the deepest integration — hooks that enrich every search with graph context automatically.

### Auto-Wiki Generation

```bash
gitnexus wiki [path]                    # generate wiki from knowledge graph
gitnexus wiki --model gpt-4o-mini       # with custom model
gitnexus wiki --base-url <url>          # with custom LLM API
```

This is the vault-integration key: GitNexus can *generate a wiki* from the code graph. The wiki is LLM-generated documentation derived from graph structure — every page backed by actual dependency/call analysis.

### Enterprise Features

- **PR Review** — automated blast radius analysis on every PR (what breaks if this PR ships?)
- **Auto-updating Code Wiki** — always-current docs
- **Auto-reindexing** — graph stays fresh
- **Multi-repo support** — unified graph across repositories

**Source:** [https://github.com/abhigyanpatwari/GitNexus](https://github.com/abhigyanpatwari/GitNexus)
**Production ops:** [https://github.com/ShunsukeHayashi/gitnexus-stable-ops](https://github.com/ShunsukeHayashi/gitnexus-stable-ops) (26 repos, 43K symbols, 100K edges)

---

## 3. Graph-Based Memory Systems for AI Agents

### 3.1 Microsoft GraphRAG

**What it is:** A data pipeline + transformation suite that builds a knowledge graph from unstructured text, then uses that graph to answer complex "global" questions that span entire document corpora.

**The problem it solves:** Standard RAG retrieves chunks relevant to a local question. But questions like "What are the main themes in this dataset?" need understanding across the *entire* corpus — a query-focused summarization (QFS) problem, not a retrieval problem. GraphRAG bridges the gap.

**Architecture:**
1. **Entity extraction** — LLM reads documents, extracts entities (people, places, concepts, events)
2. **Relationship extraction** — LLM identifies relationships between entities
3. **Entity knowledge graph** — entities + relationships stored as a graph
4. **Community detection** — Leiden algorithm clusters closely-related entities into communities
5. **Community summarization** — LLM pre-generates summaries for each community at multiple granularity levels
6. **Query time** — question → community summaries → partial responses → final merged response

**Two query modes:**
- **Global search** — uses community summaries to answer thematic/broad questions
- **Local search** — uses entity neighborhoods for specific factual questions

**Data model:**
- Nodes: `Entity` (name, type, description, source documents)
- Edges: `Relationship` (type, description, strength/weight, source documents)  
- Communities: Leiden-detected clusters with pre-built text summaries
- Reports: Multi-level community summaries at different granularities

**Cost warning:** GraphRAG indexing is expensive — it calls the LLM for every document chunk and every entity relationship extraction. Start small.

**Outputs:** Parquet files (entities, relationships, communities, reports, text units). Can query programmatically or via CLI.

**Vault integration:** GraphRAG can be run against a vault's markdown files. The resulting entity graph and community summaries could be exported back as structured vault notes — creating a self-describing knowledge base where the AI built the index.

**Sources:**
- GitHub: [https://github.com/microsoft/graphrag](https://github.com/microsoft/graphrag)
- Paper: [https://arxiv.org/abs/2404.16130](https://arxiv.org/abs/2404.16130)
- Docs: [https://microsoft.github.io/graphrag](https://microsoft.github.io/graphrag)
- Blog: [https://www.microsoft.com/en-us/research/blog/graphrag-unlocking-llm-discovery-on-narrative-private-data/](https://www.microsoft.com/en-us/research/blog/graphrag-unlocking-llm-discovery-on-narrative-private-data/)

---

### 3.2 Mem0 — Universal Memory Layer

**What it is:** [Mem0](https://github.com/mem0ai/mem0) is a memory layer for AI agents that intelligently stores, retrieves, and manages contextual information across conversations. 26% more accurate than OpenAI Memory on LOCOMO benchmark, 91% faster responses than full-context, 90% fewer tokens.

**Architecture:**
- **Multi-level memory:** User-level (preferences, history), Session-level (current context), Agent-level (agent state)
- **Hybrid storage:** Vector DB (semantic similarity) + relational DB (structured facts) + graph store (relationships)
- **Intelligent extraction:** LLM extracts structured memories from conversation automatically
- **Memory lifecycle:** add → extract → store → search → prune/consolidate

**Data model:** Memories are extracted facts stored with:
- `memory` (text string)
- `user_id` (scoping)
- `metadata` (timestamps, sources)
- Embedding (for semantic search)
- Optional graph relationships (entity → entity)

**Vault integration:** Mem0 can store memories as markdown-compatible text. The `mem0 add` / `mem0 search` CLI maps well to vault note operations — memories could be periodically flushed to structured vault files.

**Source:** [https://github.com/mem0ai/mem0](https://github.com/mem0ai/mem0) | YC-backed startup | [https://mem0.ai](https://mem0.ai)

---

### 3.3 MemOS — Memory Operating System

**What it is:** [MemOS](https://github.com/MemTensor/MemOS) is a Memory Operating System for LLMs and AI agents that unifies store/retrieve/manage for long-term memory. Research paper: arXiv:2505.22101 (2025) and arXiv:2507.03724 (2025).

**Core thesis:** Memory should be treated as a first-class OS resource — like files or processes — with unified management, scheduling, and garbage collection.

**Memory types handled:**
- **Knowledge base memory** — structured facts and documents
- **Skill memory** — reusable agent capabilities (cross-task skill reuse)
- **Multi-modal memory** — text, images, structured data
- **Enterprise memory** — access control, audit trails

**Key differentiator:** Skill memory for cross-task skill reuse and evolution. MemOS can store "how to do X" as reusable memory blobs that agents can recall and replay.

**Related work:** Memory³ (arXiv, Journal of Machine Learning 2024) — explicit memory modeling for language systems. Core idea: LLMs should have explicit, addressable memory rather than just implicit weights.

**Sources:**
- GitHub: [https://github.com/MemTensor/MemOS](https://github.com/MemTensor/MemOS)
- Paper 1: [https://arxiv.org/abs/2505.22101](https://arxiv.org/abs/2505.22101)
- Paper 2: [https://arxiv.org/abs/2507.03724](https://arxiv.org/abs/2507.03724)
- Docs: [https://memos-docs.openmem.net](https://memos-docs.openmem.net)

---

### 3.4 Letta — Stateful Agents with Self-Editing Memory

**What it is:** [Letta](https://github.com/letta-ai/letta) (formerly MemGPT) is a platform for building stateful agents — AI with memory blocks that persist and update across sessions.

**Architecture:**
- **Memory blocks** — typed named blocks (`human`, `persona`, `context`) that the agent reads and writes mid-conversation
- **Self-editing** — agents can call tools to modify their own memory blocks (not just retrieve — they *write back*)
- **Persistent state** — agent state survives conversation boundaries by design
- **Skills + subagents** — Letta Code bundles pre-built skills/subagents for advanced memory workflows

**Key concept — in-context editable memory:**
```
Agent reads persona block → "I am X who knows Y"
Agent learns something new → calls memory_edit("persona", "I am X who knows Y and Z")
Next session → agent wakes up already knowing Z
```

This is different from RAG: the agent *modifies its own system prompt substrate* rather than fetching from external search.

**Vault integration:** Letta's memory blocks map well to vault structures — a `human` block could mirror a `vault/Trajan/Preferences.md`, updated bidirectionally.

**Source:** [https://github.com/letta-ai/letta](https://github.com/letta-ai/letta) | [https://docs.letta.com](https://docs.letta.com)

---

### 3.5 Dragon Brain — Knowledge Graph + Vector Search MCP

**What it is:** [Dragon Brain](https://github.com/iikarus/Dragon-Brain) is a production-ready MCP server combining a knowledge graph (FalkorDB/Cypher) with vector search (Qdrant) to give AI agents long-term memory. 31 MCP tools. 1,118 tests.

**Architecture:**
- **FalkorDB** (Redis-compatible graph DB, Cypher query language) for entity/relationship storage
- **Qdrant** (HNSW vector index) for semantic similarity search
- **Hybrid search with RRF** (Reciprocal Rank Fusion) — combines graph traversal results with vector similarity
- **Sentence-transformers** for embeddings (CPU or CUDA GPU)
- **Autonomous "Librarian" agent** — background process that DBSCAN-clusters memories and synthesizes higher-order concepts
- **Time-travel queries** — query memory state at any past timestamp
- **Streamlit dashboard** for visualization

**Data model:**
- Nodes: `Entity` (typed: person, project, concept, etc.) with `Observation` children
- Edges: weighted, typed relationships between entities
- Sessions: tracked conversation context with breakthrough annotations

**Vault integration:** Dragon Brain's entity nodes map directly to vault notes — entities as notes, observations as note content, relationships as wikilinks. The graph serves as the index; markdown files serve as the human-readable layer.

**Unique features vs competitors:**
- DBSCAN autonomous clustering (discovers patterns without explicit labeling)
- True time-travel: "what did I know last Tuesday?" 
- CUDA GPU acceleration for embeddings

**Source:** [https://github.com/iikarus/Dragon-Brain](https://github.com/iikarus/Dragon-Brain)

---

### 3.6 Cognee — Knowledge Engine in 6 Lines

**What it is:** [Cognee](https://github.com/topoteretes/cognee) is an open-source knowledge engine that ingests data in any format and continuously learns to provide right context for AI agents. Combines vector search, graph databases, and cognitive science approaches.

**Architecture:**
```python
await cognee.add("document or text")   # ingest
await cognee.cognify()                  # build knowledge graph
results = await cognee.search("query") # hybrid graph+vector search
```

**Key differentiator:** Ontology grounding — Cognee builds typed, structured knowledge graphs with ontologies rather than raw entity-relationship pairs. This means queries can reason about category hierarchies, not just direct connections.

**Features:**
- Unified ingestion of text, PDFs, web pages, structured data
- Local-first (runs offline)
- Persistent and learning agents — learns from feedback, cross-agent knowledge sharing
- Multimodal support
- OpenClaw plugin available: `@cognee/cognee-openclaw`

**Source:** [https://github.com/topoteretes/cognee](https://github.com/topoteretes/cognee) | [https://docs.cognee.ai](https://docs.cognee.ai)

---

### 3.7 Basic Memory — Markdown-Native Knowledge Graph

**What it is:** [Basic Memory](https://github.com/basicmachines-co/basic-memory) lets you build persistent knowledge through natural conversations with LLMs while keeping everything in plain markdown files. The knowledge graph is built from markdown structure, not a separate database.

**Architecture:**
- **Files as source of truth** — all knowledge stored as `.md` files you own
- **SQLite index** — lightweight local index for search (not the primary store)
- **Vector embeddings** — FastEmbed for semantic search
- **Bidirectional**: both you and the LLM read/write the same files
- **Schema system** — infer, validate, and diff knowledge base structure

**Markdown patterns:**
```markdown
## Observations
- [fact] Python prefers PEP8 naming [[style-guide]]
- [preference] prefers functional patterns [[architecture]]

## Relations
- implements [[design-pattern/strategy]]
- depends_on [[external-service/payment-api]]
```

LLMs learn to write these patterns naturally in conversation, creating a traversable knowledge graph embedded in markdown.

**Critical property: Works with Obsidian out-of-the-box** — markdown files + wikilinks are Obsidian's native format. Basic Memory effectively makes your Obsidian vault a live AI memory system.

**Source:** [https://github.com/basicmachines-co/basic-memory](https://github.com/basicmachines-co/basic-memory) | [https://docs.basicmemory.com](https://docs.basicmemory.com)

---

## 4. Vault-as-Graph Patterns

### 4.1 How Obsidian's Graph View Works

Obsidian's graph view is built on wikilinks (`[[note-name]]`). Every `[[link]]` in any note creates a directed edge in the graph. The graph view renders these edges as a force-directed network.

**What makes it useful:**
- **Orphan detection** — isolated notes (no links in or out) are visually obvious
- **Hub identification** — heavily-linked notes (concepts that tie many ideas together) emerge naturally as large nodes
- **Cluster discovery** — topic clusters emerge from link density without explicit tagging
- **Backlink navigation** — "what links here?" answers questions like "what depends on X?"

**What makes it gimmicky:**
- Force-directed layout is visually striking but often unreadable at scale
- Most users have <500 notes — at that scale the graph is a hairball
- The graph is *undirected* in practice (link directionality rarely meaningful)
- No query interface — you can see the graph but can't ask "find all notes within 2 hops of X"
- No properties on edges — every relationship is equal weight

**Obsidian graph filters (useful):**
- Filter by tag to see only related subgraphs
- Local graph (notes within N hops of current note) — much more useful than full graph
- Depth control (1-hop, 2-hop neighborhoods)

### 4.2 What Makes Graph Structure Actually Useful for AI

For AI agents, the value isn't the visual graph — it's the **navigable structure**:

1. **Link following** — given a starting concept, traverse to related concepts without keyword search
2. **Backlink discovery** — find everything that references a concept (builds "what depends on X?" maps)
3. **Hub detection** — identify core concepts in a knowledge domain
4. **Shortest path** — "how does concept A connect to concept B?"
5. **Embedding propagation** — nodes near each other in the graph should have similar semantic meaning

Obsidian's built-in graph view doesn't expose these as APIs. But the underlying link structure can be extracted and processed by tools like GraphRAG, Basic Memory, or Cognee.

### 4.3 The Dual-Purpose Vault Architecture

**The key insight:** A vault that serves both humans (readable notes) and AI agents (queryable graph) needs to maintain structure at the *file level*, not just the display level.

**Patterns that work for both:**

#### Pattern 1: WikiLink-First Structure
Write every concept as a named entity, link aggressively. The human gets readable prose + sidebar navigation. The AI gets a traversable graph.

```markdown
# Payment Processing

[[Stripe]] handles [[card-authorization]] via [[webhook-events]].
Failed [[payment]] triggers [[retry-logic]] with [[exponential-backoff]].
```

The AI can follow any `[[link]]` to get more context. The human can read it naturally.

#### Pattern 2: Frontmatter Metadata as Graph Properties
Use frontmatter to add structured properties to nodes:

```yaml
---
type: component
depends_on: [stripe, redis, postgres]
implements: [payment-interface]
status: production
last_reviewed: 2026-03-15
---
```

Tools like Obsidian Dataview, Basic Memory schema system, and custom GraphRAG pipelines can use these as edge properties and filters.

#### Pattern 3: Typed Relations Section
Add explicit relationship sections that both humans and AIs can parse:

```markdown
## Relations
- implements [[design-pattern/observer]]
- depends_on [[infrastructure/redis]]
- owned_by [[team/backend]]
- documented_in [[runbook/payment-runbook]]
```

Basic Memory encourages this pattern. It creates *typed* edges (not just "these two things are linked") which enables much richer graph queries.

#### Pattern 4: Separation of Concerns (Layers)
Organize vault into layers that serve different consumers:

```
vault/
  Notes/          ← human-first prose
  System/         ← operational facts (structured, machine-friendly)
  Research/       ← deep dives (both)
  Graph/          ← explicitly graph-structured (entities, relationships)
    Entities/     ← one note per entity
    Relations/    ← relationship documentation
    Index/        ← auto-generated index notes from tools
```

AI agents primarily work in `System/` and `Graph/`; humans primarily work in `Notes/` and `Research/`. Both layers cross-link.

### 4.4 Practical Tool Stack for a Dual-Purpose Vault

| Layer | Tool | Purpose |
|---|---|---|
| Human editing | Obsidian | Write, browse, search |
| AI writing | Basic Memory (MCP) | Structured markdown writes from LLM |
| Code graph | GitNexus or CodeGraphContext | Code → graph, wiki generation |
| Corpus graph | Microsoft GraphRAG | Existing vault → entity graph + community summaries |
| Long-term memory | Dragon Brain or Mem0 | Conversation context, entity relationships |
| Knowledge engine | Cognee | Unified ingestion + graph+vector search |
| Static site | Quartz | Renders vault as human-browsable wiki |

**Minimal viable stack:** Obsidian + Basic Memory + GitNexus
- Obsidian: human editing, graph view, backlinks
- Basic Memory: AI writes structured memories to markdown files
- GitNexus: code graph → auto-wiki markdown files in vault

**Full stack:** Add GraphRAG for periodic corpus indexing, Dragon Brain for cross-session memory, Cognee for unified search.

### 4.5 The Wikilink ↔ Graph Isomorphism

The fundamental insight that makes dual-purpose vaults viable:

```
Obsidian wikilink [[X]] ↔ graph edge (current_note → X)
Frontmatter depends_on: [X, Y] ↔ typed graph edges
Backlinks to [[X]] ↔ reverse traversal of edges pointing to X
Tag #topic ↔ node category/label
```

Every structural element of a well-maintained Obsidian vault is *already* a graph. The only missing piece is an API that lets AI agents query it as a graph (not just as text files).

**Tools that close this gap:**
- **[Obsidian Graph API](https://obsidian.md/graph)** — view-only in Obsidian itself
- **Basic Memory** — MCP server, query by entity/relation
- **Cognee** — ingests vault as knowledge graph with ontology
- **GraphRAG** — batch indexing (not live)
- **[Khoj](https://github.com/khoj-ai/khoj)** — AI assistant with Obsidian plugin, semantic search over vault

---

## 5. Synthesis: Architectural Recommendations

### For the Right Hand / OpenClaw Setup

Given the existing vault at `/home/trajan/vault/` running Quartz at port 8090, with CodeGraphContext already installed as an MCP server:

#### Code Knowledge Layer
- **GitNexus** is the stronger choice over CodeGraphContext for code-as-wiki:
  - `gitnexus wiki` generates actual markdown wiki files from graph
  - Auto-reindexing on commit via Claude Code hooks
  - 21K stars vs 2.7K — much more active
  - Better MCP tooling for agent queries
- Run `gitnexus analyze` in key project repos, pipe wiki output to `vault/Code/[project]/`

#### Vault Memory Layer
- **Basic Memory** is the best fit for the existing markdown vault:
  - Files stay in vault directory
  - Works with Obsidian natively
  - MCP server = AI can read/write vault notes directly
  - Schema system validates structure
- Add as MCP server for Claude Code: `uvx basic-memory mcp`

#### Agent Long-Term Memory
- **Dragon Brain** for structured entity memory across sessions:
  - FalkorDB graph + Qdrant vectors + hybrid RRF search
  - Time-travel queries (debug "what did I know 3 days ago?")
  - Autonomous Librarian clusters memories automatically
  - Already running on this stack family (FalkorDB)

#### Corpus Understanding
- **GraphRAG** for periodic deep indexing of the full vault:
  - Run monthly: `graphrag index --root /home/trajan/vault`
  - Generates community summaries for thematic queries
  - Expensive but not run-constantly — treat as batch job
  - Output community reports → vault notes

#### The Killer Integration: GitNexus + Vault
```
gitnexus analyze ~/Desktop/Coding/project   # index code
gitnexus wiki ~/Desktop/Coding/project \
  --model claude-3.5-haiku \
  --output /home/trajan/vault/Code/project/ # generate wiki to vault
```

Every code change → graph update → wiki regeneration → vault notes stay current. Quartz rebuilds → browsable at port 8090. Agents query via MCP. Humans browse via wiki.

---

## 6. Comparison Table

| System | Primary Use | Storage | Live Update | MCP | Vault-Friendly | Self-Hosted |
|---|---|---|---|---|---|---|
| CodeGraphContext | Code graph | KùzuDB/FalkorDB/Neo4j | Yes (watch) | Yes | Export only | Yes |
| GitNexus | Code graph + wiki | LadybugDB | Yes (hooks) | Yes (7 tools) | Wiki output | Yes |
| Microsoft GraphRAG | Corpus understanding | Parquet files | No (batch) | No | Import/export | Yes |
| Mem0 | Agent memory | Vector+graph | Yes | Via SDK | Export | Yes (or cloud) |
| MemOS | Skill + knowledge memory | Custom | Yes | Via API | Partial | Yes |
| Letta | Stateful agents | Agent state DB | Yes | Via API | Partial | Yes |
| Dragon Brain | Long-term agent memory | FalkorDB+Qdrant | Yes | Yes (31 tools) | Export | Yes |
| Cognee | Unified knowledge engine | Graph+vector | Yes | Via SDK | Yes (ingests MD) | Yes |
| Basic Memory | Human+AI shared notes | Markdown + SQLite | Yes | Yes | Native | Yes |

---

## 7. Key Sources

- CodeGraphContext GitHub: https://github.com/CodeGraphContext/CodeGraphContext
- GitNexus GitHub: https://github.com/abhigyanpatwari/GitNexus
- GitNexus stable ops: https://github.com/ShunsukeHayashi/gitnexus-stable-ops
- GitNexus + Pi integration: https://github.com/tintinweb/pi-gitnexus
- Microsoft GraphRAG GitHub: https://github.com/microsoft/graphrag
- Microsoft GraphRAG Paper: https://arxiv.org/abs/2404.16130
- Microsoft GraphRAG Docs: https://microsoft.github.io/graphrag
- Microsoft GraphRAG Blog: https://www.microsoft.com/en-us/research/blog/graphrag-unlocking-llm-discovery-on-narrative-private-data/
- Mem0 GitHub: https://github.com/mem0ai/mem0
- Mem0 Website: https://mem0.ai
- MemOS GitHub: https://github.com/MemTensor/MemOS
- MemOS Paper 1: https://arxiv.org/abs/2505.22101
- MemOS Paper 2: https://arxiv.org/abs/2507.03724
- Letta GitHub: https://github.com/letta-ai/letta
- Letta Docs: https://docs.letta.com
- Dragon Brain GitHub: https://github.com/iikarus/Dragon-Brain
- Cognee GitHub: https://github.com/topoteretes/cognee
- Cognee Docs: https://docs.cognee.ai
- Basic Memory GitHub: https://github.com/basicmachines-co/basic-memory
- Basic Memory Docs: https://docs.basicmemory.com
- Obsidian: https://obsidian.md
- FalkorDB: https://www.falkordb.com
- Qdrant: https://qdrant.tech
- tree-sitter: https://tree-sitter.github.io
- KùzuDB: https://kuzudb.com
- Context+Impact pipeline (Obsidian+GitNexus): https://github.com/ShunsukeHayashi/context-and-impact
