---
title: "Multi-Agent Coordination Patterns"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
tags: [code, evolution, github, knowledge, prompts, research]
summary: "Five dominant architectures have emerged across the ecosystem:"
---
# Multi-Agent Coordination Patterns

> Research note covering coordination architectures, [[communication patterns]], task decomposition, and error handling across major multi-agent frameworks (CrewAI, AutoGen, LangGraph, OpenAI Agents SDK, and emerging protocols).

**Date:** 2026-03-16
**Related:** [[Self-Organizing Agent Architectures]], [[Agent Memory Architectures]], [[Multi-Agent Architecture Evaluation]], [[Metaprompting and Dynamic Agent Architecture]]

---

## 1. Coordination Architecture Taxonomy

Five dominant architectures have emerged across the ecosystem:

| Architecture | Control Model | Scalability | Best For |
|---|---|---|---|
| **Orchestrator-Worker** | Centralized fan-out | Medium (10-20 agents) | Independent subtasks with result synthesis |
| **Pipeline/Sequential** | Linear chain | Low-Medium | ETL, research-then-analyze flows |
| **Hierarchical** | Tree delegation | High (50+ agents) | Enterprise-scale, multi-domain |
| **Swarm** | Decentralized emergent | High | Exploration, unknown problem spaces |
| **Mesh** | Peer-to-peer direct | Low (3-8 agents) | Iterative refinement, code review loops |

### Decision Framework

```
Is the problem decomposition known upfront?
├── YES: Are subtasks independent?
│   ├── YES → Orchestrator-Worker (parallel dispatch)
│   └── NO  → Pipeline/Sequential
└── NO: How many agents?
    ├── 3-8  → Mesh (collaborative reasoning)
    ├── 8-20 → Swarm (emergent coordination)
    └── 20+  → Hierarchical (tree delegation)
```

### Performance Characteristics

| Pattern | Control | Fault Tolerance | Debugging | Typical Latency |
|---|---|---|---|---|
| Swarm | Low | High | Hard | Variable |
| Mesh | Medium | Medium | Medium | 5-15s per cycle |
| Hierarchical | High | Medium | Medium | 6-12s minimum |
| Orchestrator-Worker | High | Low | Easy | 3-8s |
| Pipeline | High | Low | Easy | Sum of stages |

---

## 2. Framework-Specific Patterns

### 2.1 CrewAI — Role-Based Orchestration

CrewAI organizes agents around **roles, goals, and backstories** — a natural-language mapping that makes multi-agent systems accessible. Two process types:

#### Sequential Process
Tasks execute in list order. Each task must have an explicit agent. Context flows automatically from predecessor tasks.

```python
from crewai import Crew, Agent, Task, Process

researcher = Agent(
    role="Senior Researcher",
    goal="Find comprehensive data on the topic",
    backstory="Expert research analyst with 20 years experience"
)
analyst = Agent(
    role="Data Analyst",
    goal="Extract actionable insights from research",
    backstory="Statistical expert who turns raw data into strategy"
)

research_task = Task(
    description="Research market trends in AI agents",
    agent=researcher,
    expected_output="Comprehensive market report"
)
analysis_task = Task(
    description="Analyze the research and identify opportunities",
    agent=analyst,
    expected_output="Strategic recommendations"
)

crew = Crew(
    agents=[researcher, analyst],
    tasks=[research_task, analysis_task],
    process=Process.sequential  # Default
)
result = crew.kickoff()
```

#### Hierarchical Process
A **manager agent** dynamically assigns tasks based on agent capabilities. Tasks do NOT require explicit agent assignment — the manager decides.

```python
from crewai import Crew, Agent, Task, Process, LLM

# Option A: Auto-created manager
crew = Crew(
    agents=[researcher, analyst, writer],
    tasks=[task1, task2, task3],
    process=Process.hierarchical,
    manager_llm=LLM(model="gpt-4o")
)

# Option B: Custom manager agent (must NOT be in agents list)
manager = Agent(
    role="Project Manager",
    goal="Ensure quality task execution and coordination",
    backstory="Expert at coordinating complex multi-team workflows"
)
crew = Crew(
    agents=[researcher, analyst, writer],
    tasks=[task1, task2, task3],
    process=Process.hierarchical,
    manager_agent=manager
)
```

**Key constraints:**
- `manager_agent` must NOT appear in the `agents` list
- Delegation is disabled by default (opt-in via `allow_delegation=True`)
- Tasks cannot reference future tasks in context dependencies
- Maximum one async task, and only at end of task list

#### CrewAI Flows API
The newer Flows API bridges the gap to production by allowing explicit control flow between crews, supporting conditional branching, looping, and event-driven triggers outside the crew abstraction.

---

### 2.2 AutoGen / AG2 — Conversation-Centric Coordination

AutoGen (now evolving into AG2 / Microsoft Agent Framework) models everything as **multi-agent conversations**. Four core patterns:

#### Two-Agent Chat
Direct conversation between two agents. One initiates via `initiate_chat()`, producing a `ChatResult` with history, summary, and token costs.

```python
import autogen

assistant = autogen.AssistantAgent(
    name="assistant",
    llm_config={"model": "gpt-4"}
)
user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    code_execution_config={"work_dir": "coding"}
)

user_proxy.initiate_chat(
    assistant,
    message="Write a Python function to calculate fibonacci numbers"
)
```

#### Sequential Chat (Carryover)
Multiple two-agent conversations chained via **carryover** — each chat's summary becomes context for the next.

```python
chat_results = user_proxy.initiate_chats([
    {"recipient": researcher, "message": "Research topic X",
     "summary_method": "reflection_with_llm"},
    {"recipient": analyst, "message": "Analyze findings",
     "summary_method": "last_msg"},
    {"recipient": writer, "message": "Write the report",
     "summary_method": "reflection_with_llm"}
])
```

#### Group Chat (Central Pattern)
3+ agents in a shared conversation, orchestrated by `GroupChatManager`:

```python
groupchat = autogen.GroupChat(
    agents=[researcher, analyst, critic, writer],
    messages=[],
    max_round=12,
    speaker_selection_method="auto",     # LLM picks next speaker
    send_introductions=True,             # agents know each other
    allowed_or_disallowed_speaker_transitions={
        researcher: [analyst, critic],   # constrain who follows whom
        analyst: [critic, writer],
        critic: [researcher, analyst],
        writer: [critic]
    },
    speaker_transitions_type="allowed"
)

manager = autogen.GroupChatManager(
    groupchat=groupchat,
    llm_config={"model": "gpt-4"}
)

user_proxy.initiate_chat(manager, message="Analyze market trends")
```

**Speaker selection strategies:**
- `auto` — LLM decides based on conversation context (default)
- `round_robin` — predetermined order
- `random` — arbitrary selection
- `manual` — human selects next speaker

#### Nested Chat
Packages complex workflows into a single agent via `register_nested_chats()`. When triggered, the agent executes sequential sub-conversations internally, returning the final summary as its response. This is how AutoGen achieves composability.

#### AG2 (v0.4+) Evolution
The v0.4 rewrite introduced:
- **Async-first execution** with event-driven messaging
- **Request/response AND event-driven** patterns
- Pluggable orchestration strategies
- Integration with Semantic Kernel as "Microsoft Agent Framework"

---

### 2.3 LangGraph — State Machine Agents

LangGraph models multi-agent coordination as **directed graphs** where agents are nodes, edges are control/data flow, and a shared state object ties everything together.

#### Core State Management

```python
from typing import TypedDict, Annotated
import operator
from langgraph.graph import StateGraph, START, END

class ResearchState(TypedDict):
    topic: str
    sections: list[dict]
    completed_sections: Annotated[list, operator.add]  # reducer-driven
    final_report: str

# Each node reads/writes to shared state
def research_node(state: ResearchState) -> dict:
    # Do research, return partial state update
    return {"completed_sections": [{"title": "...", "content": "..."}]}

def synthesis_node(state: ResearchState) -> dict:
    # Combine all completed sections
    sections = state["completed_sections"]
    return {"final_report": compile_report(sections)}

graph = StateGraph(ResearchState)
graph.add_node("research", research_node)
graph.add_node("synthesize", synthesis_node)
graph.add_edge(START, "research")
graph.add_edge("research", "synthesize")
graph.add_edge("synthesize", END)

app = graph.compile()
```

**Key insight:** `Annotated[list, operator.add]` is a **reducer** — when multiple nodes write to `completed_sections`, values are appended rather than overwritten. This prevents data loss in parallel multi-agent execution.

#### Supervisor Pattern

```python
from langgraph_supervisor import create_supervisor
from langgraph.prebuilt import create_react_agent

# Create specialized agents
math_agent = create_react_agent(
    model="gpt-4o",
    tools=[calculator, wolfram],
    name="math_expert"
)
research_agent = create_react_agent(
    model="gpt-4o",
    tools=[web_search, arxiv],
    name="researcher"
)

# Supervisor coordinates them
workflow = create_supervisor(
    agents=[math_agent, research_agent],
    model="gpt-4o",
    prompt="You coordinate research tasks. Delegate math to math_expert and research to researcher."
)

app = workflow.compile()
result = app.invoke({"messages": [{"role": "user", "content": "..."}]})
```

The supervisor uses **handoff tools** internally — `create_handoff_tool` passes full message history plus a tool message indicating successful handoff.

#### Dynamic Fan-Out with Send API

```python
from langgraph.constants import Send

def route_to_workers(state):
    """Dynamically spawn worker nodes based on state."""
    return [
        Send("worker", {"section": s})
        for s in state["sections"]
    ]

graph.add_conditional_edges("planner", route_to_workers)
```

Each worker gets its own isolated state, but writes back to shared keys via reducers. This is LangGraph's answer to scatter-gather parallelism.

#### LangGraph Swarm
A high-level library for **decentralized agent collaboration** — agents hand off tasks to each other without a central supervisor, using direct handoff tools.

#### Key Patterns Summary

| Pattern | LangGraph Implementation |
|---|---|
| Sequential | Linear edges between nodes |
| Routing | `add_conditional_edges` with classifier function |
| Scatter-Gather | `Send` API for dynamic fan-out, reducer for fan-in |
| Supervisor | `create_supervisor` with handoff tools |
| Evaluator-Optimizer | Cycle in graph with conditional exit |
| Human-in-the-Loop | `interrupt()` at node boundaries |

---

### 2.4 OpenAI Agents SDK — Handoff-First Design

The production evolution of the experimental Swarm framework. The core abstraction is the **handoff**: agents transfer control explicitly, carrying conversation context.

```python
from agents import Agent, handoff, Runner
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

# Specialist agents
billing_agent = Agent(
    name="Billing agent",
    instructions=f"{RECOMMENDED_PROMPT_PREFIX}\nHandle billing inquiries.",
    model="gpt-4o"
)
refund_agent = Agent(
    name="Refund agent",
    instructions=f"{RECOMMENDED_PROMPT_PREFIX}\nProcess refund requests.",
    model="gpt-4o"
)

# Triage agent with handoffs
triage_agent = Agent(
    name="Triage agent",
    instructions="Route customer queries to the right specialist.",
    handoffs=[billing_agent, handoff(refund_agent)]
)

# Run
result = await Runner.run(triage_agent, input="I want a refund")
```

#### Structured Handoff with Context

```python
from pydantic import BaseModel

class EscalationData(BaseModel):
    reason: str
    priority: int
    customer_id: str

async def on_handoff(ctx: RunContextWrapper[None], input_data: EscalationData):
    log_escalation(input_data)

escalation_handoff = handoff(
    agent=escalation_agent,
    on_handoff=on_handoff,
    input_type=EscalationData,
    tool_name_override="escalate_to_supervisor",
    tool_description_override="Escalate high-priority issues"
)
```

**How it works internally:** Handoffs are represented as **tools** to the LLM (e.g., `transfer_to_refund_agent`). The model calls the tool, and the SDK handles the agent switch, context transfer, and conversation continuation.

**Configuration options:**
- `input_filter` — transform conversation history on handoff (e.g., `handoff_filters.remove_all_tools`)
- `is_enabled` — conditionally activate handoffs based on state
- `nest_handoff_history` — collapse prior conversation into summary (beta)

---

## 3. Communication Patterns

### 3.1 Message Passing
- **Direct:** Agent A sends message to Agent B (AutoGen two-agent, OpenAI handoffs)
- **Broadcast:** Message goes to all agents in group (AutoGen GroupChat)
- **Routed:** Central router dispatches to selected agent (LangGraph conditional edges)

### 3.2 Shared State
- **Global state object:** All agents read/write to shared TypedDict (LangGraph)
- **Reducer-driven updates:** Annotated types prevent write conflicts (`Annotated[list, operator.add]`)
- **Checkpointed state:** Persistent snapshots for recovery and human-in-the-loop (LangGraph checkpointer)

### 3.3 Blackboard Pattern
- **Swarm variant:** Agents read/write to shared blackboard without direct connections
- **Emergent coordination:** No agent knows the full plan; behavior emerges from local rules
- **Used by:** LangGraph Swarm, OpenAI's original Swarm concept

### 3.4 Conversation History as State
- **AutoGen approach:** The conversation itself IS the shared state
- **Carryover mechanism:** Summaries propagate context between sequential chats
- **GroupChat:** Full conversation visible to all participants; manager selects next speaker

```
┌─────────────────────────────────────────────┐
│           Communication Patterns            │
│                                             │
│  Message Passing    Shared State  Blackboard│
│  ┌──┐   ┌──┐      ┌──────────┐  ┌───────┐ │
│  │A │──→│B │      │  State   │  │ Board │ │
│  └──┘   └──┘      │ {topic,  │  │       │ │
│                    │  results,│  │ read/  │ │
│  ┌──┐   ┌──┐      │  report} │  │ write  │ │
│  │A │──→│ALL│      └────┬─────┘  └───┬───┘ │
│  └──┘   └───┘       ↕  ↕  ↕      ↕  ↕  ↕  │
│                    ┌─┐┌─┐┌─┐   ┌─┐┌─┐┌─┐  │
│  ┌──┐  ┌─┐┌─┐     │A││B││C│   │A││B││C│  │
│  │R │─→│A││B│      └─┘└─┘└─┘   └─┘└─┘└─┘  │
│  └──┘  └─┘└─┘                               │
└─────────────────────────────────────────────┘
```

---

## 4. Task Decomposition Strategies

### 4.1 Static Decomposition (Design-Time)
- **CrewAI Sequential:** Tasks defined in list order at crew creation
- **LangGraph Pipeline:** Nodes and edges defined in graph construction
- **Best for:** Known, repeatable workflows

### 4.2 Dynamic Decomposition (Runtime)
- **CrewAI Hierarchical:** Manager agent decomposes on the fly
- **LangGraph Send API:** Dynamic fan-out based on runtime state
- **AutoGen Group Chat:** LLM-selected next speaker adapts to conversation
- **Best for:** Unknown problem spaces, variable workloads

### 4.3 Recursive Decomposition
- **Hierarchical teams:** Top-level supervisor delegates to mid-level supervisors, who delegate to workers
- **LangGraph nested graphs:** Sub-graphs as nodes in parent graphs
- **AutoGen nested chats:** Complex workflows packaged as single agent responses
- **Best for:** Enterprise scale (50+ agents), multi-domain problems

### 4.4 Emergent Decomposition
- **Swarm patterns:** No explicit decomposition; agents self-organize around shared blackboard
- **Handoff chains:** Agent A decides it needs Agent B, who decides it needs Agent C
- **Best for:** Exploration, creative problem-solving

---

## 5. Error Handling and Recovery

### 5.1 Circuit Breaker Pattern
Adapted for agent clusters — monitors interaction success rates, response times, and error frequency. When failures exceed threshold, the circuit opens and routes around the failing agent.

```python
# Conceptual circuit breaker for agent calls
class AgentCircuitBreaker:
    def __init__(self, failure_threshold=3, reset_timeout=60):
        self.failures = 0
        self.threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.state = "closed"  # closed, open, half-open
        self.last_failure_time = None

    async def call_agent(self, agent, task):
        if self.state == "open":
            if time.time() - self.last_failure_time > self.reset_timeout:
                self.state = "half-open"
            else:
                return await self.fallback(task)

        try:
            result = await agent.execute(task)
            if self.state == "half-open":
                self.state = "closed"
                self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            if self.failures >= self.threshold:
                self.state = "open"
            raise
```

### 5.2 Retry with Exponential Backoff
Standard for transient failures (API rate limits, network issues). Calibrate timeouts using **95th percentile** response times, not averages.

### 5.3 Redundant Agent Pools
Run multiple instances of critical agents. If primary fails, standby takes over with shared state context. LangGraph's checkpointer enables stateful recovery — agents pick up from last checkpoint.

### 5.4 Framework-Specific Error Handling

| Framework | Error Strategy |
|---|---|
| **CrewAI** | `max_iter` limits prevent infinite loops; guardrails on delegation depth |
| **AutoGen** | `max_round` on GroupChat; `max_consecutive_auto_reply` per agent |
| **LangGraph** | Graph-level `recursion_limit`; checkpointed state for rollback; conditional edges for error routing |
| **OpenAI SDK** | `max_turns` on Runner; input/output guardrails; handoff `is_enabled` for conditional routing |

### 5.5 Guardrail Patterns
- **Input guardrails:** Validate before agent processes (OpenAI SDK applies to initial agent)
- **Output guardrails:** Validate agent output before passing downstream (applied to final agent)
- **Iteration limits:** Prevent runaway loops (`max_iter`, `max_round`, `recursion_limit`)
- **Cost caps:** Token budget enforcement at crew/conversation level
- **Human-in-the-loop breakpoints:** LangGraph `interrupt()` at critical decision points

---

## 6. Emerging Interoperability Protocols

Four protocols are converging to standardize multi-agent communication:

### 6.1 Model Context Protocol (MCP)
- **Origin:** Anthropic, 2024
- **Purpose:** Standardize how AI applications connect to external tools and data sources
- **Role:** The "USB port" for agent-to-tool communication

### 6.2 Agent-to-Agent Protocol (A2A)
- **Origin:** Google, April 2025 (now Linux Foundation)
- **Purpose:** Enable communication between opaque agentic applications across frameworks
- **Key features:**
  - **Agent Cards** (JSON) for capability discovery
  - Task lifecycle management (submitted, working, completed, failed)
  - Multi-modal support (text, audio, video)
  - 50+ partners (Salesforce, SAP, Langchain, etc.)

### 6.3 Agent Communication Protocol (ACP)
- **Purpose:** Lightweight message-passing between agents in same deployment

### 6.4 Agent Network Protocol (ANP)
- **Purpose:** Discovery and communication across organizational boundaries

**The MCP + A2A combination** is emerging as the dominant pairing: MCP for agent-to-tool, A2A for agent-to-agent.

---

## 7. Architecture Comparison Matrix

| Dimension | CrewAI | AutoGen/AG2 | LangGraph | OpenAI SDK |
|---|---|---|---|---|
| **Orchestration** | Role-based | Conversation-based | Graph-based | Handoff-based |
| **State Model** | Implicit (task context) | Conversation history | Explicit TypedDict + reducers | Conversation + RunContext |
| **Parallelism** | Limited (async tasks) | Concurrent pattern | Send API fan-out | Sequential handoffs |
| **Human-in-Loop** | Via agent input | `ALWAYS`/`TERMINATE` modes | `interrupt()` at nodes | Guardrails + callbacks |
| **Composability** | Crews + Flows | Nested chats | Nested sub-graphs | Agent hierarchies |
| **Learning Curve** | Low | Medium | High | Low |
| **Production Readiness** | Medium (Flows API helps) | Medium (AG2 rewrite) | High | High |
| **Max Agent Scale** | ~10-15 | ~10-20 (GroupChat) | 50+ (hierarchical) | ~5-10 (handoff chains) |

---

## 8. Practical Patterns for Implementation

### Pattern 1: Supervisor with Fallback

```
                    ┌──────────────┐
                    │  Supervisor  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Agent A  │ │ Agent B  │ │ Agent C  │
        │ (primary)│ │ (primary)│ │ (primary)│
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │             │
        ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
        │ Agent A' │ │ Agent B' │ │ Agent C' │
        │(fallback)│ │(fallback)│ │(fallback)│
        └──────────┘ └──────────┘ └──────────┘
```

### Pattern 2: Evaluator-Optimizer Loop

```
        ┌──────────┐     ┌───────────┐
        │ Generator│────→│ Evaluator │
        │  Agent   │←────│   Agent   │
        └──────────┘     └─────┬─────┘
             ▲                 │
             │            pass/fail?
             │                 │
             └─── fail ────────┤
                               │
                          ┌────▼────┐
                          │  Output │
                          └─────────┘
```

### Pattern 3: Hierarchical Team of Teams

```
                ┌─────────────────┐
                │   Executive     │
                │   Supervisor    │
                └────────┬────────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
     ┌────────────┐┌────────────┐┌────────────┐
     │  Research  ││ Engineering││  Writing   │
     │  Manager  ││  Manager   ││  Manager   │
     └─────┬──────┘└─────┬──────┘└─────┬──────┘
           │             │             │
      ┌────┼────┐   ┌────┼────┐   ┌────┼────┐
      ▼    ▼    ▼   ▼    ▼    ▼   ▼    ▼    ▼
     W1   W2   W3  W4   W5   W6  W7   W8   W9
```

This distributes context window burden across levels — each manager only needs to understand its domain, not the entire problem space.

---

## 9. Key Takeaways

1. **No single pattern wins.** The right architecture depends on task structure, scale, and failure tolerance requirements. Start simple (sequential/handoff), evolve to complex (hierarchical/swarm) only when needed.

2. **State management is the hard problem.** LangGraph's reducer-driven TypedDict is the most explicit solution. AutoGen's conversation-as-state is simplest but scales poorly. CrewAI's implicit context passing works until it doesn't.

3. **Handoffs are converging as the universal primitive.** OpenAI SDK, LangGraph Swarm, and A2A protocol all use explicit handoff/transfer semantics. Even CrewAI's delegation is a handoff in disguise.

4. **Error handling is underdeveloped everywhere.** Most frameworks offer basic iteration limits but lack circuit breakers, redundancy, or graceful degradation out of the box. This is a gap worth filling in custom implementations.

5. **MCP + A2A will define the interop layer.** MCP for tools, A2A for agent-to-agent. Building against these protocols now reduces future migration pain.

6. **The multi-agent trap is real.** A single well-prompted agent with good tools often outperforms a poorly coordinated multi-agent system. Use multi-agent only when you genuinely need specialized reasoning, parallel execution, or fault isolation.

---

## Sources

- [CrewAI Framework](https://crewai.com/) — Role-based orchestration platform
- [CrewAI Process Types (DeepWiki)](https://deepwiki.com/crewAIInc/crewAI/2.4-process-types)
- [AutoGen Conversation Patterns](https://microsoft.github.io/autogen/0.2/docs/tutorial/conversation-patterns/)
- [AutoGen Multi-Agent Patterns Deep Dive](https://sparkco.ai/blog/deep-dive-into-autogen-multi-agent-patterns-2025)
- [LangGraph Workflows and Agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)
- [Choosing the Right Multi-Agent Architecture (LangChain Blog)](https://blog.langchain.com/choosing-the-right-multi-agent-architecture/)
- [OpenAI Agents SDK Handoffs](https://openai.github.io/openai-agents-python/handoffs/)
- [Agent Orchestration Patterns: Swarm vs Mesh vs Hierarchical](https://gurusup.com/blog/agent-orchestration-patterns)
- [A2A Protocol (Google)](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [A2A Protocol Spec](https://a2a-protocol.org/latest/)
- [Microsoft Agent Framework Announcement](https://devblogs.microsoft.com/foundry/introducing-microsoft-agent-framework-the-open-source-engine-for-agentic-ai-apps/)
- [Multi-Agent AI Orchestration: Enterprise Strategy 2025-2026](https://www.onabout.ai/p/mastering-multi-agent-orchestration-architectures-patterns-roi-benchmarks-for-2025-2026)
- [The Multi-Agent Trap (Towards Data Science)](https://towardsdatascience.com/the-multi-agent-trap/)

## Related

- [[Agent-Architecture-Synthesis-2026-03]]
- [[LangChain-Deep-Agents]]
- [[reliability-first-reorg-v1]]
