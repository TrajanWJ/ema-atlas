---
title: LangChain Deep Agents — Architecture & Stolen Patterns
type: research
tags:
  - langchain
  - langgraph
  - deep-agents
  - agent-architecture
  - subagent-spawning
  - filesystem
  - context-management
source: 'https://docs.langchain.com/oss/python/deepagents/overview'
date: '2026-03-18'
created: '2026-03-18'
updated: '2026-03-18'
status: active
confidence: 0.8
relevance: high
summary: >-
  LangChain's new 'Deep Agents' framework: batteries-included with virtual
  filesystem, subagent spawning, write_todos planning, and pluggable backends.
  Directly maps to OpenClaw's architecture. Key insight: filesystem as context
  overflow valve.
wiki_id: research/LangChain-Deep-Agents
imported_from: vault/Research/LangChain-Deep-Agents.md
imported_at: '2026-04-04T00:23:57.092Z'
---

# LangChain Deep Agents — Architecture Study

**Source:** docs.langchain.com/oss/python/deepagents (March 2026)
**Framework stack:** Deep Agents SDK → LangChain agents → LangGraph runtime

## What Deep Agents Is

LangChain's "batteries-included" agent harness. Same core tool-calling loop as other frameworks, but ships with:
1. **`write_todos`** — built-in task planning and decomposition tool
2. **Virtual filesystem** (`ls`, `read_file`, `write_file`, `edit_file`) — context overflow valve
3. **Subagent spawning** (`task` tool) — context isolation per subtask
4. **Pluggable filesystem backends** — in-memory / local disk / LangGraph store / sandboxes
5. **Long-term memory** — LangGraph Memory Store across threads

## The Hierarchy

```
Deep Agents SDK (harness, batteries-included)
  ↓ built on
LangChain agents (core agent abstraction, <10 lines)
  ↓ built on  
LangGraph (state machine runtime, durable execution, streaming, HIL)
```

**For us:** Our system is already at "LangGraph level" conceptually — we just don't use the Python library. OpenClaw IS the runtime; agents + SOUL.md IS the agent harness.

---

## Core Capability Deep Dive

### 1. `write_todos` — Planning Before Acting

Deep Agents agents call `write_todos` to break complex tasks into discrete steps BEFORE executing them. This is:
- Explicit, visible planning (not just "thinking" in a prompt)
- Tracked progress — agent checks off steps as it goes
- Adaptive — plan can be revised as new information emerges

**Our equivalent:** Agents plan inline in text. This works but is invisible and non-persistent.
**Improvement:** Add a structured `TODO.md` that agents explicitly write to and track.

### 2. Virtual Filesystem as Context Overflow Valve

**This is the key insight:** Instead of cramming everything into context window, agents write long results to files and read them back when needed. The filesystem IS the working memory.

```python
# Agent writes research to file
write_file("research/topic-a.md", long_research_result)

# Agent reads back when needed
content = read_file("research/topic-a.md")
```

**Why this matters:** Prevents context window overflow on long tasks. Multiple subagents can share data via files. Persistent between calls.

**Our equivalent:** We do this manually — agents write to vault, read back with `qmd search`. But it's ad-hoc, not systematic.
**Improvement:** Every long-running task should have a `scratch/` directory agents write to. Results go in vault when done.

### 3. Subagent Spawning via `task` Tool

```python
# Main agent spawns specialist subagent
task("Research quantum computing applications in cryptography", 
     context=["relevant vault excerpts"])
```

Key design: **main agent context stays clean**. Subagent gets isolated context → does work → returns result. Parent never sees the subagent's scratch work.

**Our equivalent:** `sessions_spawn` with `runtime="subagent"`. Same concept.
**Difference:** Deep Agents makes this a first-class built-in tool. We treat it as an advanced pattern. Should be default for complex tasks.

### 4. Pluggable Backends (The Interesting Architectural Idea)

Deep Agents separates **what the filesystem provides** from **where it stores data**:

| Backend | Storage | Use Case |
|---|---|---|
| In-memory | RAM | Fast, ephemeral |
| Local disk | Host filesystem | Standard dev |
| LangGraph store | Cloud DB | Cross-thread persistence |
| Modal/Daytona/Deno sandboxes | Isolated VM | Safe code execution |
| Composite routing | Multiple | Mix and match |

**OpenClaw parallel:**
- Vault (QMD) = LangGraph store
- `/tmp/` scratch = in-memory
- Agent VM = sandbox

The key missing piece: **composite routing** — "store X here, Y there" — that routes different data to different backends automatically.

### 5. Long-Term Memory = LangGraph Memory Store

Memory Store is keyed by `(namespace, key)` tuples. Agents write facts they want to remember:
```python
store.put(("user_preferences", "trajan"), {"style": "direct", "verbosity": "low"})
```
Retrieved in future sessions:
```python
prefs = store.get(("user_preferences", "trajan"))
```

**Our equivalent:** vault/Trajan/ + SOUL.md. But it's human-maintained, not agent-maintained.
**Improvement:** Agents should be able to write directly to their own preference store with a structured schema.

---

## LangGraph Core Concepts (Stolen)

### State Machines for Agent Workflows

LangGraph models agent behavior as a directed graph:
- **Nodes** = agent actions (call LLM, use tool, branch)
- **Edges** = transitions (always / conditional)
- **State** = shared data flowing through the graph

**The key insight for us:** Our "dispatch protocol" in AGENTS.md is an informal state machine. LangGraph would formalize it. Every step in our workflow could be a node with explicit entry/exit conditions.

### Human-in-the-Loop as Graph Interrupt

LangGraph implements HIL as graph interrupts — the graph pauses at a designated node, waits for human input, then resumes:
```python
@graph.node
def human_review(state):
    # Graph pauses here until human responds
    pass
```

**For us:** This is how to implement "ask Trajan before destructive action" — pause the workflow, send Discord message, wait for reply, resume.

### Durable Execution = Checkpointing

LangGraph checkpoints state after every node. If execution fails, resume from last checkpoint. 

**Our equivalent:** CONTINUE.md before risky ops. But LangGraph does this automatically at every step.

---

## Framework Comparison (Updated)

| Dimension | Our System | Deep Agents | LangGraph | CrewAI |
|---|---|---|---|---|
| Runtime | OpenClaw | LangGraph | LangGraph | CrewAI |
| Agent config | SOUL.md + AGENTS.md | Python + system_prompt | Python | YAML/Python |
| Memory | Vault + daily notes | LangGraph store | Custom | Memory tools |
| Subagents | sessions_spawn | task() built-in | Custom | subprocess |
| Filesystem | Manual vault writes | Virtual FS built-in | None | None |
| Planning | Ad-hoc in text | write_todos built-in | Custom | Task list |
| Hooks | None | sessionStart/End events | State edges | Callbacks |
| HIL | Discord message | Graph interrupt | Graph interrupt | Human input tool |

**Our unique advantages:**
- Discord as native UI (no one else has this)
- Vault as shared knowledge base (persistent, searchable)
- Multi-agent specialization via separate processes (true isolation)
- Self-evolution via SOUL.md writes

**Their advantages we should steal:**
- `write_todos` as explicit planning step
- Virtual filesystem as systematic context management
- Pluggable backends concept
- LangSmith-style observability

---

## Key Patterns to Implement

### Pattern A: Structured TODO Before Complex Tasks
Every complex task should start with:
```markdown
## Task Plan — [task name]
Created: [timestamp]
Status: IN_PROGRESS

- [ ] Step 1: ...
- [ ] Step 2: ...
- [x] Step 3: DONE — [result summary]
```
Agents write to `scratch/TODO-[task].md`, check off steps, move result to vault when done.

### Pattern B: Scratch Directory per Task
```
scratch/
  task-[id]/
    research.md      ← raw research output
    analysis.md      ← processed analysis
    draft.md         ← working draft
    notes.md         ← ephemeral notes
```
Main agent coordinates; sub-agents write to their task directory. Ephemeral — cleared after vault write.

### Pattern C: Memory Store Schema
Agents write structured preference data:
```json
{
  "namespace": "agent-memory",
  "agent": "right-hand",
  "last_updated": "2026-03-18",
  "preferences": {
    "response_length": "concise",
    "delegation_threshold": "3+ agent domains",
    "routing_patterns": {...}
  }
}
```
This replaces ad-hoc SOUL.md edits with structured data.

---

## Connections
- [[Multi-Agent Coordination Patterns]] — LangGraph state machine = formal version of our dispatch protocol
- [[Self-Critique and Auto-Evolution Design]] — Memory Store = structured version of our evolution signals
- [[Hermes Agent Architecture Study]] — Hermes also uses iteration budget + subagent spawning
- [[Awesome-Copilot-Deep-Dive]] — hooks complement Deep Agents lifecycle events
- [[Autonomous-Learning-System-ABC]] — System M meta-controller = LangGraph conditional edges

## Related

- [[Agent-Architecture-Synthesis-2026-03]]
- [[OpenViking-Context-Database]]
