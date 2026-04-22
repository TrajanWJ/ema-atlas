# Agent Model: Governors, Architects, and Specialists

Agents are participants in a governed ecosystem, accessing context on-demand.

## 1. Context Access Mechanism
Agents do not hold massive undifferentiated state. They use the **`query_context`** mechanism.
- **Explicit Tool Call**: `query_context(id: string, scope: 'tab' | 'page', query?: string)`
- **Function**: The orchestrator retrieves the session history or manifest, summarizes it if necessary, and injects it into the prompt.
- **Safety**: Agents only have access to IDs identified in their `ContextAccessPolicy`.

## 2. Core Agent Identities
- **Executive Management (EM)**: The Governor. High-level planning and discovery. Orchestator of specialists.
- **Meta-Development (MD)**: The Architect. Logic specialized in the manifest registry and structural schema. Minimal prose, maximal structure.

## 3. Delegation Patterns
- **Standard**: `EM -> Specialist`
- **Reverse**: `Specialist -> EM` (Clarification of executive intent)
- **Fork**: `EM -> [Specialist A, Specialist B]` (Parallel execution with multi-tab lineage).

## 4. Verbosity & Fatigue
To avoid "prompt fatigue," agents support configurable verbosity:
- **Summary (Default)**: Concise, narrative results.
- **Verbose**: Deep reasoning trace (collapsible in the CLI).
- **Debug**: Full tool-call logs and raw manifests.

## 5. Knowledge Distribution
Agents treat **Pages** as part of their RAG system.
- An agent can "look up" documentation or data on a page by referencing its ID (e.g., `A1`) through the `query_context` tool.
- Pages are effectively living memory artifacts for the agent network.
