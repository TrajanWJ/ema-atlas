---
tags: [agents, memory, architecture, vector-stores, graph-memory, episodic-memory, research, MemGPT, mem0, LangChain, retrieval]
summary: "A comprehensive survey of advanced memory approaches for AI agents, covering vector stores, graph memory, episodic/semantic/procedural memory taxonomi"
date: 2026-03-16
updated: 2026-03-16
status: active
confidence: 0.80
confidence_updated: 2026-03-18
category: Agent Systems
type: research
source: research
created: 2026-03-16
title: "Agent Memory Architectures"
---

# Agent Memory Architectures

A comprehensive survey of advanced memory approaches for AI agents, covering vector stores, graph memory, episodic/semantic/procedural memory taxonomies, memory consolidation and forgetting, hybrid retrieval, and notable implementations. Extends the foundations in [[Multi-Agent Architecture Evaluation]] and connects to [[Self-Organizing Agent Architectures]].

---

## Cognitive Science Foundations

Modern agent memory architectures draw directly from human cognitive memory models. The mapping (popularized by Lilian Weng's influential "LLM Powered Autonomous Agents" post and adopted by LangChain) is:

| Human Memory | Agent Equivalent | Implementation |
|---|---|---|
| **Sensory Memory** | Raw input embeddings | Embedding models (text, image, audio) |
| **Short-Term / Working Memory** | In-context window | Conversation buffer, system prompt, scratchpad |
| **Long-Term Memory** | External stores | Vector DBs, knowledge graphs, file systems |

Long-term memory further subdivides into three types that have become the standard taxonomy for agent memory design (per LangChain's memory-for-agents framework):

- **Semantic Memory** -- Facts and knowledge ("Paris is the capital of France")
- **Episodic Memory** -- Specific experiences ("Last time the user asked about deployment, they wanted systemd")
- **Procedural Memory** -- How to do things (system prompts, tool-use patterns, learned workflows)

---

## 1. Vector Store Memory

### Core Architecture

```
User Input → Embedding Model → Query Vector
                                    ↓
                            Vector Database
                           (similarity search)
                                    ↓
                            Top-K Results → LLM Context
```

### Retrieval Strategies

#### Dense Retrieval (Semantic)
Pure embedding similarity. Good for meaning-based matching but struggles with exact terms, acronyms, and domain jargon.

**ANN Algorithms** (from Weng's survey):
- **LSH** -- Locality-sensitive hashing; buckets similar vectors together
- **ANNOY** -- Random projection trees (used by Spotify)
- **HNSW** -- Hierarchical navigable small-world graphs; best general-purpose
- **FAISS** -- Facebook's library; GPU-accelerated, vector quantization
- **ScaNN** -- Google's anisotropic vector quantization; optimized for inner product

#### Sparse Retrieval (Lexical)
BM25 / TF-IDF based. Handles exact keyword matching, rare terms, and proper nouns well.

#### Hybrid Search (Dense + Sparse)
The current best practice. Combines semantic understanding with lexical precision.

**Qdrant's fusion methods:**
- **Reciprocal Rank Fusion (RRF)** -- Boosts results appearing near the top in multiple ranking lists. Supports weighted prefetches (v1.17+) to prioritize stronger models.
- **Distribution-Based Score Fusion (DBSF)** -- Normalizes scores using mean +/- 3 standard deviations, then sums. More statistically principled than RRF.

**Multi-stage reranking pattern (Qdrant):**
```
Stage 1: Broad retrieval with cheap/quantized vectors (high recall)
    ↓
Stage 2: Re-score with full-precision vectors or cross-encoder (high precision)
    ↓
Stage 3: Optional ColBERT/multi-vector late interaction reranking
```

**Pinecone's pipeline:**
```
Query → Embedding → Hybrid Index (dense + sparse) → Dedup → Rerank → Top-K
```

### Vector Database Comparison for Agent Memory

| Database | Hybrid Search | Metadata Filter | Managed | Key Strength |
|---|---|---|---|---|
| **ChromaDB** | Yes (v2+) | `where` + `where_document` | No (local-first) | Dev experience, auto-embedding |
| **Qdrant** | RRF + DBSF | Payload filtering | Both | Fusion methods, multi-stage |
| **Pinecone** | Dense + sparse | Namespace + metadata | Yes | Scale, serverless |
| **Milvus** | Yes | Attribute filtering | Both | GPU acceleration |
| **PGVector** | Via extensions | Full SQL | Self-hosted | Postgres ecosystem |
| **FAISS** | No (dense only) | No | Library only | Raw speed, GPU |

### ChromaDB Pattern (Simplest Agent Memory)

```python
import chromadb

client = chromadb.Client()
memory = client.create_collection("agent_memory")

# Store a memory (auto-embeds with Sentence Transformers)
memory.add(
    documents=["User prefers Python over JavaScript for backend work"],
    metadatas=[{"type": "preference", "user": "trajan", "confidence": 0.9}],
    ids=["mem_001"]
)

# Retrieve relevant memories
results = memory.query(
    query_texts=["What language should I use for the API?"],
    n_results=5,
    where={"user": "trajan"}  # metadata filter
)
```

### When to Use Vector Memory
- Semantic similarity retrieval over unstructured text
- Large memory stores where exact matching fails
- Conversational agents needing contextual recall
- RAG pipelines augmenting LLM knowledge

---

## 2. Graph Memory

### Core Architecture

```
Conversation → LLM Entity Extraction → Entities + Relationships
                                              ↓
                                      Graph Database (Neo4j, etc.)
                                              ↓
                              Cypher/SPARQL Query → Subgraph → LLM Context
```

### GraphRAG (Microsoft Research)

The GraphRAG approach builds a full knowledge graph from source data, then uses community detection for hierarchical summarization:

1. **Entity + Relationship Extraction** -- LLM processes entire dataset to create entity-relationship network
2. **Hierarchical Clustering** -- Bottom-up community detection organizes entities into semantic clusters
3. **Community Summarization** -- Pre-computed summaries at each hierarchy level
4. **Query Routing** -- Local queries hit entity neighborhoods; global queries hit community summaries

**Key advantage over vector-only RAG:** Handles "connect the dots" queries where relevant information is dispersed across many documents, and whole-dataset summarization queries ("What are the top themes?") where baseline RAG fails entirely.

### Knowledge Graph Schema for Agent Memory

```cypher
// Neo4j schema pattern for agent memory
CREATE (u:User {name: "Trajan", id: "user_001"})
CREATE (p:Preference {type: "language", value: "Python"})
CREATE (t:Tool {name: "Claude Code", category: "IDE"})
CREATE (proj:Project {name: "ExecuDeck", status: "active"})

// Relationships capture memory with temporal context
CREATE (u)-[:PREFERS {since: date("2025-01-01"), confidence: 0.95}]->(p)
CREATE (u)-[:USES {frequency: "daily"}]->(t)
CREATE (u)-[:WORKS_ON {role: "architect"}]->(proj)
CREATE (proj)-[:BUILT_WITH]->(p)

// Query: What does the user work with?
MATCH (u:User {name: "Trajan"})-[r]->(n)
RETURN u, type(r), n
```

### Temporal Knowledge Graphs

```
[Entity] --[Relationship]@{valid_from, valid_to}--> [Entity]

// Captures belief evolution
[User] --[PREFERS {from: 2025-01, to: 2025-06}]--> [React]
[User] --[PREFERS {from: 2025-06}]--> [Svelte]
```

### Graph Memory Operations

```python
# Pseudocode for LLM-driven graph memory
class GraphMemory:
    def add_from_conversation(self, messages):
        # LLM extracts structured triples
        prompt = f"""Extract entities and relationships from this conversation.
        Return as JSON: [{{"subject": ..., "predicate": ..., "object": ..., "confidence": ...}}]
        Conversation: {messages}"""
        triples = llm.extract(prompt)

        for triple in triples:
            self.graph.merge_node(triple["subject"])
            self.graph.merge_node(triple["object"])
            self.graph.merge_edge(
                triple["subject"], triple["object"],
                type=triple["predicate"],
                confidence=triple["confidence"],
                timestamp=now()
            )

    def query(self, question):
        # LLM generates graph query from natural language
        cypher = llm.generate_cypher(question, schema=self.graph.schema)
        results = self.graph.execute(cypher)
        return results

    def get_entity_neighborhood(self, entity, depth=2):
        # Multi-hop traversal for context
        return self.graph.traverse(entity, max_depth=depth)
```

### When to Use Graph Memory
- Multi-hop reasoning ("Who works on projects that use Python?")
- Relationship-rich domains (people, organizations, codebases)
- When you need to explain reasoning paths (provenance)
- Whole-dataset summarization and theme extraction
- Temporal reasoning about how knowledge evolves

---

## 3. Episodic Memory

### Core Concept
Memory of specific events and experiences, preserving temporal sequence, context, and outcomes. Enables "experience replay" for learning.

### Episode Structure

```python
@dataclass
class Episode:
    id: str
    timestamp: datetime
    trigger: str              # What initiated this episode
    context: dict             # Environmental state at the time
    actions: list[Action]     # What the agent did
    observations: list[str]   # What the agent perceived
    outcome: Outcome          # Success/failure + metrics
    reflection: str           # Agent's self-assessment (optional)
    embedding: list[float]    # For similarity retrieval
```

### Implementation: Few-Shot from Experience

The LangChain team identifies episodic memory as the backbone of [[few-shot]] prompting from collected examples:

```python
class EpisodicMemory:
    def __init__(self, vector_store):
        self.store = vector_store

    def record(self, episode: Episode):
        """Store an episode with its embedding for later retrieval."""
        self.store.add(
            documents=[episode.serialize()],
            metadatas=[{
                "outcome": episode.outcome.status,
                "task_type": episode.trigger_type,
                "timestamp": episode.timestamp.isoformat()
            }],
            embeddings=[episode.embedding],
            ids=[episode.id]
        )

    def recall_similar(self, current_situation: str, k: int = 3,
                       filter_success: bool = True) -> list[Episode]:
        """Retrieve similar past episodes, optionally filtered to successes."""
        where_filter = {"outcome": "success"} if filter_success else None
        results = self.store.query(
            query_texts=[current_situation],
            n_results=k,
            where=where_filter
        )
        return [Episode.deserialize(doc) for doc in results["documents"][0]]

    def generate_few_shot_prompt(self, current_task: str) -> str:
        """Build a few-shot prompt from relevant past episodes."""
        episodes = self.recall_similar(current_task)
        examples = "\n\n".join([
            f"### Past Example (similarity: {ep.score:.2f})\n"
            f"Task: {ep.trigger}\n"
            f"Approach: {ep.actions_summary}\n"
            f"Outcome: {ep.outcome.description}"
            for ep in episodes
        ])
        return f"Here are relevant past experiences:\n\n{examples}"
```

### Memory Consolidation (Short-Term to Long-Term)

```
Immediate Buffer (last N interactions)
        ↓ (periodic consolidation)
Working Summaries (compressed recent context)
        ↓ (pattern extraction)
Long-Term Episodes (significant experiences only)
        ↓ (abstraction)
Semantic Knowledge (generalized patterns and rules)
```

```python
class MemoryConsolidator:
    def consolidate(self, recent_episodes: list[Episode]) -> dict:
        # Step 1: Identify patterns across episodes
        patterns = self.llm.extract_patterns(recent_episodes)

        # Step 2: Score significance (novelty + utility)
        scored = [(ep, self.score_significance(ep)) for ep in recent_episodes]

        # Step 3: Keep high-significance episodes, summarize the rest
        keep = [ep for ep, score in scored if score > self.threshold]
        summarize = [ep for ep, score in scored if score <= self.threshold]
        summary = self.llm.summarize_episodes(summarize)

        # Step 4: Extract semantic knowledge from patterns
        new_knowledge = self.llm.generalize(patterns)

        return {
            "preserved_episodes": keep,
            "summary": summary,
            "new_semantic_knowledge": new_knowledge
        }
```

---

## 4. Semantic vs. Procedural Memory

### Semantic Memory (Facts and Knowledge)

What the agent **knows**. Extracted from interactions, stored for retrieval.

**Implementation pattern (from LangChain's framework):**
```python
# Hot path: Agent explicitly decides to remember
def process_message(self, message):
    response = self.llm.generate(
        message,
        tools=[self.remember_tool, self.search_memory_tool, ...]
    )
    # Agent may call remember_tool during generation:
    # remember_tool("User prefers dark mode and uses vim keybindings")
    return response

# Background path: Async extraction after interaction
async def extract_memories(self, conversation):
    facts = await self.llm.extract(
        f"Extract key facts and preferences from: {conversation}"
    )
    for fact in facts:
        await self.semantic_store.upsert(fact)
```

**Hot path vs. background path tradeoff** (per LangChain):
- **Hot path**: Agent calls a "remember" tool mid-conversation. Immediate but adds latency.
- **Background**: Async extraction after conversation ends. No latency but delayed availability.

### Procedural Memory (How-To Knowledge)

What the agent **does**. The combination of model weights, system prompts, tool definitions, and learned workflows.

**Rarely modified at runtime**, but emerging patterns include:
- Agents that update their own system prompts based on feedback
- Tool-use pattern libraries that evolve from episodic memory
- Workflow templates extracted from successful episode sequences

```python
class ProceduralMemory:
    def __init__(self):
        self.workflows = {}      # task_type -> workflow template
        self.tool_preferences = {}  # context -> preferred tools

    def learn_from_episode(self, episode: Episode):
        if episode.outcome.success:
            task_type = episode.classify_task()
            # Update workflow template with successful pattern
            if task_type in self.workflows:
                self.workflows[task_type].merge(episode.actions)
            else:
                self.workflows[task_type] = Workflow.from_episode(episode)

    def get_plan(self, task_description: str) -> Workflow:
        task_type = self.classify(task_description)
        return self.workflows.get(task_type, self.default_workflow)
```

---

## 5. Memory Consolidation and Forgetting

### Why Forgetting Matters
Unbounded memory growth causes: increased retrieval latency, higher costs, context pollution (irrelevant memories drowning out relevant ones), and contradictory information accumulating over time.

### Forgetting Strategies

#### Time-Based Decay
```python
def compute_relevance(memory, current_time):
    age = current_time - memory.timestamp
    recency_score = math.exp(-decay_rate * age.total_seconds())
    importance_score = memory.importance  # Set at creation
    access_score = math.exp(-decay_rate * (current_time - memory.last_accessed).total_seconds())
    return (recency_score * 0.3) + (importance_score * 0.5) + (access_score * 0.2)

def garbage_collect(memories, threshold=0.1):
    return [m for m in memories if compute_relevance(m, now()) > threshold]
```

#### Importance-Based Retention
```python
def score_importance(memory, llm):
    """LLM judges memory importance on a 1-10 scale."""
    score = llm.rate(f"Rate importance (1-10) of remembering: {memory.content}")
    return score / 10.0
```

#### Consolidation (Merge Similar Memories)
```python
def consolidate_memories(memories, similarity_threshold=0.85):
    clusters = cluster_by_similarity(memories, threshold=similarity_threshold)
    consolidated = []
    for cluster in clusters:
        if len(cluster) == 1:
            consolidated.append(cluster[0])
        else:
            # LLM merges multiple memories into one
            merged = llm.merge(
                f"Combine these related memories into one:\n" +
                "\n".join(m.content for m in cluster)
            )
            consolidated.append(Memory(content=merged, importance=max(m.importance for m in cluster)))
    return consolidated
```

#### Contradiction Resolution
```python
def resolve_contradictions(new_memory, existing_memories):
    for existing in existing_memories:
        if contradicts(new_memory, existing):
            # Keep the more recent one, or ask the LLM to reconcile
            if new_memory.timestamp > existing.timestamp:
                existing.superseded_by = new_memory.id
                existing.active = False
            else:
                resolution = llm.resolve(
                    f"Old: {existing.content}\nNew: {new_memory.content}\n"
                    f"Which is correct, or how do they reconcile?"
                )
                # Store resolution as the canonical memory
```

---

## 6. Notable Implementations

### MemGPT / Letta

**Core idea:** OS-inspired virtual memory management for LLM agents. Just as an operating system creates the illusion of unlimited RAM through paging between fast memory and disk, MemGPT creates the illusion of unlimited context through tiered memory.

**Memory hierarchy:**

```
┌─────────────────────────────────────────┐
│  Core Memory (in-context, always loaded) │  ← System prompt + memory blocks
│  - persona block: agent's identity       │     (read/write via tools)
│  - human block: user information         │
│  - custom blocks: task-specific state    │
├─────────────────────────────────────────┤
│  Recall Memory (conversation history)    │  ← Searchable message log
│  - full conversation transcripts         │     (auto-populated, queryable)
│  - timestamped, paginated               │
├─────────────────────────────────────────┤
│  Archival Memory (long-term vector store)│  ← Unlimited external storage
│  - vector-indexed passages               │     (read/write via tools)
│  - arbitrary documents and data          │
└─────────────────────────────────────────┘
```

**Key innovation:** The agent itself decides what to page in and out. Memory management is exposed as **tools** the agent can call:

```python
# Letta's memory tools (agent calls these during generation)
core_memory_append(label="human", content="User is building a Discord bot")
core_memory_replace(label="human", old="likes React", new="switched to Svelte")
archival_memory_insert(content="Detailed conversation about OAuth flow...")
archival_memory_search(query="OAuth", page=0)
recall_memory_search(query="What did we discuss yesterday?")
```

**OS parallel:** Uses "interrupts" to manage control flow -- heartbeat events, user messages, and system events all trigger the agent, which can then decide to manage memory before responding.

**Evaluated on:** Document analysis (processing docs exceeding context window) and multi-session chat (agents that remember across conversations).

### mem0

**Core idea:** Multi-level memory system (User, Session, Agent) with both vector and graph storage, using LLM-driven extraction rather than storing raw text.

**Architecture:**

```
Conversation → LLM Extraction → Structured Memories
                                       ↓
                    ┌──────────────────┴──────────────────┐
                    │                                      │
              Vector Store                          Graph Store
         (semantic retrieval)                  (relationship retrieval)
              Qdrant/Chroma/                         Neo4j
              Pinecone/etc.
                    │                                      │
                    └──────────────────┬──────────────────┘
                                       ↓
                              Reranker (relevance scoring)
                                       ↓
                              Merged Results → LLM Context
```

**Three memory levels:**
1. **User Memory** -- Long-term preferences, characteristics, facts about the user
2. **Session Memory** -- Context within a specific conversation
3. **Agent State** -- Operational information for the autonomous system

**Vector store support:** 19 backends (Qdrant default, plus ChromaDB, Pinecone, Milvus, PGVector, FAISS, Redis, Elasticsearch, Supabase, Weaviate, and more).

**Graph memory:** Extracts entities and relationships from conversations into Neo4j, enabling multi-hop queries that vector search alone cannot answer.

**Key metrics claimed:** +26% accuracy over OpenAI Memory, 91% faster responses than full-context, 90% lower token usage.

```python
from mem0 import Memory

m = Memory()

# Add memories from conversation (LLM extracts structured facts)
m.add("I prefer Python for backend, TypeScript for frontend. I use Neovim.",
      user_id="trajan")

# Search memories (hybrid vector + graph retrieval)
results = m.search("What editor does the user prefer?", user_id="trajan")
# → [{"memory": "Uses Neovim as primary editor", "score": 0.92}]

# Graph-enhanced query (multi-hop)
results = m.search("What tools relate to the user's development workflow?",
                    user_id="trajan")
# → Traverses: User → prefers → Python → used_with → Neovim → ...
```

### LangChain / LangGraph Memory

**LangChain's taxonomy** (from their "Memory for Agents" blog post):

| Memory Type | Implementation | Update Strategy |
|---|---|---|
| **Procedural** | System prompt + agent code | Rarely changed; model weights + instructions |
| **Semantic** | LLM-extracted facts → vector store | Hot path (tool call) or background extraction |
| **Episodic** | [[Few-shot]] examples from past runs | Collected from interactions, similarity-retrieved |

**Key principle: "Memory is application-specific."** There is no one-size-fits-all. What agents remember and how they store it varies by use case, requiring customizable, low-level control.

**LangGraph's approach** (state-based agents):
- **Short-term:** Thread-based checkpointing -- full conversation state persisted per thread
- **Long-term:** Cross-thread memory store with namespace organization
- **Semantic search:** Optional embedding index over memory store for retrieval

```python
# LangGraph memory pattern (conceptual)
from langgraph.checkpoint import MemorySaver
from langgraph.store import InMemoryStore

checkpointer = MemorySaver()  # Short-term: per-thread state
store = InMemoryStore()        # Long-term: cross-thread memories

# Store a memory in a namespace
store.put(("user", "trajan", "preferences"), "lang", {"value": "Python"})

# Retrieve by namespace
prefs = store.search(("user", "trajan", "preferences"))

# With semantic search enabled
results = store.search(("user", "trajan"), query="coding preferences",
                       limit=5)  # embedding-based retrieval
```

---

## 7. Combining Multiple Memory Types

### The Hybrid Memory Router

The most effective architectures combine multiple memory types with intelligent routing:

```python
class HybridMemorySystem:
    def __init__(self):
        self.working = WorkingMemory()        # In-context scratchpad
        self.semantic = VectorStore()          # Facts and knowledge
        self.episodic = EpisodicStore()        # Past experiences
        self.graph = KnowledgeGraph()          # Structured relationships
        self.procedural = ProceduralStore()    # Workflows and patterns

    def remember(self, content: str, source: str):
        """Route new information to appropriate stores."""
        # Always add to semantic (vector) store
        self.semantic.add(content, metadata={"source": source})

        # Extract entities/relationships for graph
        triples = self.llm.extract_triples(content)
        if triples:
            self.graph.add_triples(triples)

        # If it's an experience, add to episodic
        if self.is_experience(content):
            episode = self.llm.structure_episode(content)
            self.episodic.add(episode)

    def recall(self, query: str, context: dict) -> str:
        """Multi-strategy retrieval with fusion."""
        # 1. Vector similarity search
        semantic_results = self.semantic.search(query, k=5)

        # 2. Graph traversal from entities in query
        entities = self.llm.extract_entities(query)
        graph_results = self.graph.neighborhood(entities, depth=2)

        # 3. Similar past experiences
        episodic_results = self.episodic.recall_similar(query, k=3)

        # 4. Relevant procedures
        procedures = self.procedural.get_relevant(query)

        # 5. Fuse and rerank
        all_results = self.fuse(semantic_results, graph_results,
                                episodic_results, procedures)
        reranked = self.rerank(query, all_results)

        return self.format_context(reranked[:10])

    def fuse(self, *result_sets):
        """Reciprocal Rank Fusion across memory types."""
        scores = defaultdict(float)
        for result_set in result_sets:
            for rank, result in enumerate(result_set):
                scores[result.id] += 1.0 / (rank + 60)  # RRF constant
        return sorted(scores.items(), key=lambda x: x[1], reverse=True)
```

### Decision Matrix: When to Use Which Memory Type

| Scenario | Primary Memory | Secondary | Rationale |
|---|---|---|---|
| Personal assistant | Semantic (vector) | Graph | User facts + relationship reasoning |
| Coding agent | Procedural + Episodic | Semantic | Workflows + past solutions + API knowledge |
| Research agent | Graph + Semantic | Episodic | Entity relationships + domain knowledge |
| Customer support | Episodic + Semantic | Graph | Past tickets + product knowledge |
| Multi-session chat | Semantic + Episodic | Procedural | User facts + conversation history |
| Planning/scheduling | Graph + Episodic | Procedural | Dependencies + past plan outcomes |

---

## 8. Retrieval Strategies Deep Dive

### Hybrid Search Architecture

```
Query
  ├── Dense Embedding (semantic meaning)
  ├── Sparse Encoding (BM25/SPLADE keywords)
  └── Structured Query (graph/metadata filters)
         ↓
    Parallel Retrieval
         ↓
    Score Fusion (RRF or DBSF)
         ↓
    Cross-Encoder Reranking (optional, expensive but accurate)
         ↓
    Top-K Results → LLM Context
```

### Reranking Approaches

1. **Cross-Encoder Reranking** -- Most accurate. Jointly encodes query + document. Expensive, so only applied to top candidates.
2. **ColBERT Late Interaction** -- Token-level similarity via MaxSim. Faster than cross-encoder, more accurate than bi-encoder.
3. **LLM-as-Reranker** -- Use the LLM itself to score relevance. Powerful but high latency.
4. **Cohere Rerank / Jina Reranker** -- Managed reranking APIs. Easy to integrate.

### Multi-Stage Retrieval (Qdrant Pattern)

```python
# Qdrant multi-stage with prefetch
from qdrant_client import QdrantClient, models

client = QdrantClient()

# Stage 1: Broad retrieval with cheap matryoshka embeddings (256d)
# Stage 2: Rerank with full embeddings (1536d)
results = client.query_points(
    collection_name="agent_memory",
    prefetch=[
        models.Prefetch(
            query=short_embedding,  # 256d, fast
            using="fast-vector",
            limit=100
        ),
        models.Prefetch(
            query=sparse_vector,  # BM25-style
            using="sparse-vector",
            limit=100
        )
    ],
    query=full_embedding,  # 1536d, accurate
    using="full-vector",
    limit=10,
    with_payload=True
)
```

### Contextual Retrieval Enhancements

- **Query Expansion** -- LLM rewrites the query to improve recall ("What editor?" -> "What text editor or IDE does the user prefer?")
- **Hypothetical Document Embedding (HyDE)** -- Generate a hypothetical answer, embed that, and search for similar real documents
- **Parent Document Retrieval** -- Embed small chunks, but retrieve the full parent document for context
- **Self-Query** -- LLM extracts metadata filters from natural language ("recent Python projects" -> `where: {language: "Python", date: ">2025-01"}`)

---

## 9. Architecture Patterns Summary

### Pattern 1: MemGPT-Style Tiered Memory
Best for: Long-running agents, multi-session chat, document analysis.
```
Core Memory (always in context) ↔ Agent Tools ↔ Archival Memory (vector store)
                                                ↔ Recall Memory (conversation log)
```

### Pattern 2: mem0-Style Extracted Memory
Best for: Personalization, user-facing products, cross-session continuity.
```
Conversation → LLM Extraction → Vector Store + Graph Store → Hybrid Retrieval
```

### Pattern 3: LangGraph-Style Checkpointed Memory
Best for: Stateful workflows, multi-step agents, resumable tasks.
```
Thread Checkpoint (short-term) + Namespaced Store (long-term) + Semantic Index
```

### Pattern 4: GraphRAG Knowledge Memory
Best for: Research, analysis, "connect the dots" reasoning, global summarization.
```
Source Data → Entity Extraction → Knowledge Graph → Community Detection → Hierarchical Summaries
```

### Pattern 5: Episodic Learning Memory
Best for: Agents that improve over time, [[few-shot]] from experience, A/B testing approaches.
```
Interaction → Episode Recording → Similarity Index → Few-Shot Retrieval → Outcome Tracking
```

---

## 10. Implications for Our System

### Current State
Our system uses file-based memory (vault, daily notes, MEMORY.md) with strengths in simplicity, transparency, human readability, and git-based version control. See [[project_obsidian_vault]] and `project_agent_stack`.

### Enhancement Roadmap

**Phase 1: Semantic Layer (Low Effort, High Impact)**
Add vector search over existing vault files using ChromaDB or local Qdrant. Enables "find notes about X" without exact keyword matching.

**Phase 2: Episodic Tracking**
Log agent interactions with outcomes. Track which approaches worked for which task types. Feed back as [[few-shot]] examples.

**Phase 3: Graph Overlay**
Build a knowledge graph from vault wikilinks (already have the link structure). Add LLM-extracted entities from note content. Enables multi-hop queries across the vault.

**Phase 4: Hybrid Retrieval**
Combine vector search + graph traversal + file-based lookup with RRF fusion. Route queries to the best memory type based on query classification.

**Phase 5: Memory Lifecycle**
Implement consolidation (merge related memories), forgetting (decay stale memories), and contradiction resolution (supersede outdated facts).

### Key Takeaway

The field has converged on a clear principle from LangChain: **memory is application-specific**. There is no universal [[memory architecture]]. The right approach combines multiple memory types with intelligent routing, and the specific mix depends on the agent's domain, interaction patterns, and performance requirements.

---

## Sources and Further Reading

- Lilian Weng, "LLM Powered Autonomous Agents" (2023) -- foundational taxonomy
- MemGPT/Letta (arxiv:2310.08560) -- OS-inspired virtual context management
- mem0 (github.com/mem0ai/mem0) -- multi-level memory with vector + graph
- LangChain "Memory for Agents" (2025) -- semantic/episodic/procedural framework
- Microsoft GraphRAG -- knowledge graph + community detection for RAG
- Qdrant Hybrid Queries -- RRF, DBSF, multi-stage reranking
- Pinecone RAG Guide -- hybrid search + agentic RAG patterns
- "A Survey on the Memory Mechanism of LLM-Based Agents" (arxiv:2404.13501)

Related: [[Multi-Agent Architecture Evaluation]] | [[Self-Organizing Agent Architectures]] | [[Metaprompting and Dynamic Agent Architecture]]

## Related

- [[Multi-Agent]]
- [[patterns]]
- Coordination
- Recursive
- Knowledge
- Mining
- [[-]]
- [[3-Layer]]
- [[Architecture]]
