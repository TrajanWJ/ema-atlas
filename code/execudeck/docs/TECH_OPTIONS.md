# Technical Options & Assumptions (Revised)

## 1. Frontend Framework & UI
- **ASSUMPTION**: **Next.js (App Router)** + **Radix UI Primitives** + **shadcn/ui**.
- Rationale: Optimal blend of modern aesthetics (Glassmorphism, Dark Mode), accessibility, and headless-first control.

## 2. Terminal Runtime
- **ASSUMPTION**: **Tambo.ai React SDK**.
- Rationale: High-velocity implementation of generative UI, streaming, and inline interactive blocks with built-in component registration logic.

## 3. State & Persistence
- **ASSUMPTION**: **Zustand** for transient state (UI placement, active tabs).
- **ASSUMPTION**: **IndexedDB** (via `idb-keyval`) for local-first persistence of message history and manifest documents.

## 4. Agent Orchestration
- **ASSUMPTION**: **Custom Orchestrator** leveraging **CopilotKit-like** patterns for tool-gating and `query_context` management.

## 5. Layout Strategy
- **ASSUMPTION**: **CSS Grid / Flexbox** for a 50/50 **Vertical Split** as the primary human-in-the-loop layout.

## 6. MVP Registry Components
- **Terminal Blocks**: ChoiceList, FormBlock, TableBlock, LinkToken, ProgressBlock.
- **GUI Components**: Card, DataTable, LineChart, NavGroup, TextElement.
