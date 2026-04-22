# 🧠 ExecuDeck: Revised Executive Command Environment

**Two Peer Surfaces | Generative Terminal | Structured GUI Artifacts**

ExecuDeck is a high-trust command environment where intelligent agent networks operate within a generative terminal runtime, producing governed, durable UI artifacts reviewed and accepted by a human.

## 🏛️ The Two-Surface Model
ExecuDeck is composed of two primary, non-hierarchical surfaces. They are peer views that can be toggled or displayed side-by-side.

### 1. Terminal View (Primary Intelligence Surface)
A multi-tab, LLM-driven runtime where agents reason, delegate, and propose actions.
- **Persistent Tabs**: Each tab is an artifact bound to an Agent Identity, LLM Config, and Tool Envelope.
- **Multi-Agent Delegation**: Explicit, traceable hand-offs between specialist agents.
- **Generative Mixed Output**: Narrative text, status updates, and interactive UI blocks.

### 2. Pages View (Artifact & Control Surface)
A structured, extensible workspace used to review, edit, and persist artifacts proposed by agents.
- **No Drag-and-Drop**: Everything is structured and follows a schema.
- **Infinite Nested Navigation**: Navigation bars and tabs can be nested to any depth.
- **Tree & Inspector**: Edit structure via a tree and properties via an inspector.

## 🤖 Core Agent Roles
1. **Executive Management (EM)**: The Governor. High-level reasoning, planning, and agent discovery. Decides when to delegate vs respond.
2. **Meta-Development (MD)**: The Architect. Manages system structure, pages, and UI manifests. Proposes structural changes (new pages, nav bars).

## 📝 Terminal Grammar
- `> `: Narrative / Explanation
- `@AgentName `: Direct Delegation / Hand-off
- `# `: Status / System updates
- `! `: Caution / Meta / Hints
- `/cmd `: Explicit Shell Commands

## 🛠️ Integration Philosophy
We align with (but do not yet commit to) state-of-the-art Generative UI concepts:
- **Tambo**: Inline interactive UI blocks and clickable tokens.
- **CopilotKit**: Agent ↔ UI orchestration and human-in-the-loop gating.
- **A2UI**: Declarative UI manifests and strong safety boundaries.

## 📂 Startup State
The system initializes with two anchor tabs: `[Executive Management]` and `[Meta-Development]`. The initial page tree includes `System`, `Agents`, `Pages`, and `History`.
