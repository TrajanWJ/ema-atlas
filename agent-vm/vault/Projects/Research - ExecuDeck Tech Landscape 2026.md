---
created: 2026-03-11
type: research
project: "[[ExecuDeck]]"
status: current
updated: 2026-04-14
---

# Research: ExecuDeck Tech Landscape 2026

Technology landscape research for [[ExecuDeck]] — a dual-surface (terminal + canvas) command environment with multi-agent orchestration and generative UI artifacts.

Stack: Next.js 16, React 19, TypeScript, Tailwind 4, Zustand 5, Zod, shadcn/ui, IndexedDB (idb-keyval).

---

## 1. Terminal UI in React

### xterm.js — The Standard

[xterm.js](https://xtermjs.org/) remains the dominant web terminal emulator. It powers VS Code's integrated terminal, Warp's browser preview, and most web-based terminal UIs.

**React wrappers (ranked by viability):**

| Library | Notes |
|---|---|
| [@xterm/xterm](https://www.npmjs.com/package/@xterm/xterm) (direct) | Best approach — wrap it yourself with a `useRef` + `useEffect`. Full control, no wrapper lag. Scoped `@xterm/*` packages are the current standard; old `xterm` packages are deprecated. |
| [react-xtermjs](https://github.com/Qovery/react-xtermjs) (Qovery) | Component + hook API. Decent for quick setup. |
| [@pablo-lion/xterm-react](https://github.com/PabloLION/xterm-react) | More actively maintained alternative with additional functionality. |

**Performance addons:**
- `@xterm/addon-webgl` (v0.19.0) — WebGL2 renderer, best performance. Use as primary.
- `@xterm/addon-canvas` (v0.7.0) — 2D canvas fallback when WebGL2 unavailable.
- DOM renderer is the default fallback but slowest.

**Recommendation for [[ExecuDeck]]:** Write a thin custom React wrapper around `@xterm/xterm` directly. The existing React wrapper libraries tend to lag behind xterm.js releases and add unnecessary abstraction. Use `@xterm/addon-webgl` for rendering, with canvas fallback. This gives full control over the terminal lifecycle and fits React 19's ref patterns cleanly.

### Lessons from Warp and Cursor

- **Warp** renders at 60fps+ using GPU-accelerated rendering. Their key UX innovation: the terminal is block-based — each command + output is a discrete "block" that can be selected, copied, or acted on independently. They also support inline AI, command palette (Cmd+P), and multiline editing natively.
- **Cursor** treats terminal output as context for the AI agent, streaming terminal blocks into the agent's context window.
- **Key pattern:** Modern terminals treat command/output pairs as structured blocks, not raw character streams. [[ExecuDeck]]'s grammar token approach (>, @, #, !) aligns with this — each token line could be a structured block.

---

## 2. Canvas / Page Builder Patterns

### Manifest-Driven Rendering

The pattern [[ExecuDeck]] needs — rendering UI from a manifest/schema — is well-established:

**Puck Editor** ([puckeditor.com](https://puckeditor.com/)) — Most relevant open-source reference.
- You provide a config object mapping component names to React components + field definitions.
- The editor outputs JSON describing the page layout.
- A `<Render>` component takes that JSON and renders it. No editor needed at render time.
- MIT licensed, works with Next.js, headless CMS agnostic.
- **Key insight:** Puck's data model (JSON config -> component tree) is essentially [[ExecuDeck]]'s manifest -> artifact rendering pipeline.

**Craft.js** ([github.com/prevwong/craft.js](https://github.com/prevwong/craft.js)) — More low-level framework for building custom editors. Full control over drag/drop behavior and component resolution.

**Builder.io** — Commercial but instructive. Their visual editor demonstrates polished drag-and-drop with clear drop zone indicators.

**Recommendation for [[ExecuDeck]]:** Study Puck's architecture for the manifest -> component rendering pipeline. The pattern of "JSON schema in, rendered React out" with a `<Render>` component is exactly what artifact rendering needs. Don't use Puck directly (it's a page editor, not a command environment), but adopt its data model pattern.

### Generative UI — The Emerging Pattern

Generative UI is the most relevant emerging pattern for [[ExecuDeck]]'s artifact system. Key developments:

- **Vercel AI SDK** (`ai-sdk.dev`) — Connects LLM tool calls to React components. When a tool returns data, it maps to a registered component for rendering.
- **CopilotKit** — Full framework for agent-driven UI. Agents can call tools that return React components rendered in the client.
- **Tambo** ([github.com/tambo-ai/tambo](https://github.com/tambo-ai/tambo)) — Generative UI SDK where agents call components like functions with Zod schemas. Props stream to components as the LLM generates them.
- **Thesys** (thesys.dev) — Outputs structured UI specs (forms, tables, charts, layouts) renderable via their React SDK.
- **AG-UI Protocol** — Oracle adopted this; it defines how agents communicate UI updates to applications.

**Key pattern:** The AI layer generates a structured UI spec (not raw HTML), defining which components to render, how to arrange them, and what props to pass. The client has a registry of available components and renders from the spec.

**Recommendation for [[ExecuDeck]]:** This is the architecture to adopt. Define a component registry with Zod schemas for each component's props. Agent output includes structured specs referencing registry components. The canvas renders from these specs. This is manifest-driven rendering powered by agent output.

---

## 3. Multi-Agent UI Patterns

### Orchestration Patterns (2026 State of the Art)

The field has matured significantly. Key patterns from Microsoft, Google, and the broader ecosystem:

| Pattern | Description | [[ExecuDeck]] Relevance |
|---|---|---|
| **Supervisor/Router** | A routing agent with no tools delegates to specialized workers based on request analysis. | Maps to [[ExecuDeck]]'s `@delegate` token — the primary agent routes to specialists. |
| **Handoff** | Dynamic delegation where agents assess tasks and transfer to more appropriate agents. | Core pattern for [[ExecuDeck]]'s agent delegation. |
| **Hierarchical Delegation** | Parent agent breaks goals into sub-tasks, delegates parts, waits for results to continue reasoning. | Enables complex multi-step commands. |
| **Plan-and-Execute** | Agent drafts a structured plan, pauses for approval, then executes. | Maps directly to [[ExecuDeck]]'s proposal/approval workflow. |

**Protocols:**
- **MCP (Model Context Protocol)** — Anthropic's standard for agent-tool integration. Broad adoption throughout 2025-2026. The leading standard.
- **A2A (Agent-to-Agent Protocol)** — Google's open standard for agent-to-agent communication (April 2025). Development slowed after mid-2025.
- **AG-UI** — Protocol for agents to communicate UI updates to frontends.

**Recommendation for [[ExecuDeck]]:** Adopt the Supervisor/Handoff pattern. The primary agent acts as supervisor, using `@delegate` tokens to hand off to specialist agents. Each handoff should be a structured message (not free text) with task description, context, and expected output format. Use MCP for tool integration. Consider AG-UI for streaming UI updates from agents to the canvas.

### Reference Implementation: Open Multi-Agent Canvas

[CopilotKit's Open Multi-Agent Canvas](https://github.com/CopilotKit/open-multi-agent-canvas) is the closest existing project to [[ExecuDeck]]'s vision:
- Multi-agent chat interface managing multiple agents in one conversation.
- Built with Next.js + LangGraph + CopilotKit.
- Architecture: User question -> CopilotKit UI (chat + canvas) -> LangGraph agent workflow -> streaming state updates via AG-UI events -> canvas renders output.
- Supports MCP servers for deep research capabilities.

**Also notable:**
- [AI-Agents-Orchestrator](https://github.com/hoangsonww/AI-Agents-Orchestrator) — Coordinates multiple AI coding assistants with role-based multi-agent communication and lead-gated final responses. Vue/Nuxt UI dashboard.
- [CLI Agent Orchestrator (AWS)](https://aws.amazon.com/blogs/opensource/introducing-cli-agent-orchestrator-transforming-developer-cli-tools-into-a-multi-agent-powerhouse/) — Multi-agent framework for CLI tools with a UI layer.

---

## 4. Human-in-the-Loop / Proposal-Approval Workflow

This pattern has become critical infrastructure in 2026. Best practices:

### Core Flow
1. Agent receives task
2. Agent proposes an action (structured object, not free text)
3. Agent pauses — routes proposal to human
4. Human reviews context, approves/rejects/edits
5. Agent resumes only on approval

### Design Principles
- **Hard separation between proposing and approving** — the most reliable pattern for propose/approve/execute loops.
- **Every approval request should be a structured object** that can be logged, routed, reviewed, and executed.
- **Define clear approval criteria** — only require confirmation for actions with meaningful consequences.
- **Provide detailed context** — show users exactly what the action will do.

### Framework Support
- **LangGraph** — Built-in interrupt/resume for human-in-the-loop. Agent graph pauses at approval nodes.
- **AG-UI** — Protocol support for human-in-the-loop where users approve tool executions.
- **Cloudflare Workflows** — `waitForApproval()` method for durable processes that can wait hours/days.

**Recommendation for [[ExecuDeck]]:** Model proposals as first-class Zod-validated objects: `{ type, description, impact, artifacts, requiredApprovals }`. The terminal surface shows the proposal summary; the canvas surface shows the preview. Approval/rejection is a single action that transitions the proposal state. Store proposal history in IndexedDB for audit trail.

---

## 5. Zustand 5 Patterns

### What Changed in v5
- Dropped React < 18 support; uses native `useSyncExternalStore` (no more `use-sync-external-store` shim).
- Stricter TypeScript types (minimum TS 4.5).
- Dropped UMD/SystemJS/ES5 support.
- `persist` middleware no longer auto-stores initial state — must explicitly set state after creation.
- No new features — focused on modernization and cleanup.

### Slice Pattern (Recommended for [[ExecuDeck]])

Break state into domain-specific slices, combine in a central store:

```typescript
// Each slice is a function that receives set/get
const createTerminalSlice = (set, get) => ({
  lines: [],
  addLine: (line) => set((s) => ({ lines: [...s.lines, line] })),
});

const createCanvasSlice = (set, get) => ({
  artifacts: [],
  activeArtifact: null,
});

// Combine in one store
const useStore = create(
  persist(
    devtools((...a) => ({
      ...createTerminalSlice(...a),
      ...createCanvasSlice(...a),
      ...createAgentSlice(...a),
    })),
    { name: 'execudeck-store', storage: createJSONStorage(() => indexedDBStorage) }
  )
);
```

### IndexedDB Persistence — Critical Gotcha

**Race condition warning:** Zustand's persist middleware hydrates asynchronously with IndexedDB. It may set up an empty store and persist it back to IDB before the old data loads. Solutions:
- Use [`zustand-indexeddb`](https://github.com/zustandjs/zustand-indexeddb) package — designed for this exact use case.
- Or implement custom `getItem`/`setItem` with proper async handling and the `skipHydration` option.
- Use React Suspense boundaries around hydration-dependent UI.

### Best Practices
- Use `devtools` middleware in development for debugging.
- Use `get()` for cross-slice logic (one slice reading/calling actions from another).
- For custom equality: use `createWithEqualityFn` from `zustand/traditional` (v5 removed equality customization from `create`).

---

## 6. Next.js 16 / React 19 Patterns

### Next.js 16 (October 2025)

Major release — largest performance-focused update since the App Router:

| Feature | Relevance to [[ExecuDeck]] |
|---|---|
| **Turbopack default** | 2-5x faster builds, now stable. Use it. |
| **Cache Components** | Partial Pre-Rendering (PPR) + `use cache` for instant navigation. Good for canvas page caching. |
| **`proxy.ts` replaces `middleware.ts`** | Runs on Node.js runtime, makes the network boundary explicit. Use for auth/routing. |
| **DevTools MCP** | AI-assisted debugging via Model Context Protocol. Directly relevant — [[ExecuDeck]] can leverage this for self-debugging. |
| **React 19.2 bundled** | Latest React with compiler optimizations. |

### Next.js 16.1 (December 2025)
- Turbopack file system caching for dev (faster HMR).
- New bundle analyzer.
- 20MB smaller install.
- `next upgrade` CLI for easy updates.

### React 19 Key Patterns

| Pattern | How to Use in [[ExecuDeck]] |
|---|---|
| **Server Components (default)** | Use for static layout, navigation, initial data fetch. Zero JS shipped. |
| **`'use client'` directive** | Terminal component, canvas interactions, agent chat — anything with state/hooks. |
| **`useActionState`** | Form handling for proposal approval UI. |
| **`useOptimistic`** | Optimistic updates when approving/rejecting proposals. |
| **`useTransition`** | Route changes, tab switches, surface toggling — keeps UI responsive. |
| **`use` API** | Read promises/context in render. Good for streaming agent responses. |
| **React Compiler** | Auto-memoization. Stop using `useMemo`/`useCallback` manually. |

**Recommendation:** Lean heavily into Server Components for the shell/layout. The terminal and canvas are client components. Use `useTransition` for surface switching. Use `useOptimistic` for proposal approval (show approved state immediately, reconcile when server confirms).

---

## 7. shadcn/ui Latest (2026)

### Recent Updates
- **shadcn/cli v4** (March 2026) — Latest CLI version.
- **shadcn/create** (February 2026) — Visual project builder at `ui.shadcn.com/create`. Configure entire project setup visually before writing code.
- **Base UI support** — Can now choose between Radix UI and Base UI as the primitive layer.
- **RTL support** (January 2026).
- **Unified Radix UI package** (February 2026).
- **Registry directory** (October 2025) — Browse and install community components.
- **MCP Server** (August 2025) — `shadcn` CLI has an MCP server for AI agent integration.
- **shadcn/skills** — Gives coding agents context to work with components and registry correctly.

### Design System Presets
Presets pack entire design system configs into short codes: colors, theme, icon library, fonts, radius. Use the **Nova preset** or create a custom one for [[ExecuDeck]]'s terminal-meets-canvas aesthetic.

**Recommendation for [[ExecuDeck]]:** Use shadcn/ui with Radix UI primitives. Create a custom preset for the dual-surface aesthetic (dark terminal surface, lighter canvas surface). Leverage the MCP server and shadcn/skills for agent-assisted component creation. The registry system is useful for sharing [[ExecuDeck]]-specific components.

---

## 8. Grammar / DSL for Agent Communication

### [[ExecuDeck]]'s Grammar Tokens
- `>` narrative — agent telling a story / explaining
- `@` delegation — agent handing off to another agent
- `#` status — status updates and state changes
- `!` hint — suggestions and nudges

### Industry Context

The dominant protocols for structured agent communication in 2026:
- **MCP (Anthropic)** — JSON-RPC for agent-tool communication. The standard.
- **A2A (Google)** — JSON-RPC 2.0 + HTTP + SSE for agent-to-agent communication. Adoption slowed.
- Both use structured JSON schemas, not grammar tokens.

### Assessment

[[ExecuDeck]]'s token grammar (>, @, #, !) is a **presentation-layer DSL**, not an agent communication protocol. This is a good distinction:
- Under the hood, agents communicate via structured JSON messages (MCP-compatible).
- The grammar tokens are how those messages are **displayed** in the terminal surface — a human-readable rendering of structured agent output.
- This is similar to how Markdown is a presentation format for structured content.

**Recommendation:** Formalize this as a two-layer architecture:
1. **Wire format:** Structured JSON messages between agents (Zod-validated, MCP-compatible).
2. **Display format:** Grammar tokens render those messages in the terminal. Each token type maps to a message type: `>` = NarrativeMessage, `@` = DelegationMessage, `#` = StatusMessage, `!` = HintMessage.

This keeps the protocol clean and machine-readable while the terminal display stays human-friendly.

---

## 9. Similar Projects — Architecture Lessons

### CopilotKit Open Multi-Agent Canvas
- **Architecture:** Next.js + LangGraph + CopilotKit. User -> Chat UI + Canvas -> LangGraph workflow -> AG-UI streaming -> Canvas render.
- **Lesson:** Streaming state updates from agent backend to UI via events is the proven pattern. Don't poll.

### AI-Agents-Orchestrator
- **Architecture:** Vue/Nuxt UI with role-based agents and lead-gated responses.
- **Lesson:** Role-based agent teams with a lead/gate pattern maps well to [[ExecuDeck]]'s supervisor model.

### OpenCode
- **Architecture:** Terminal-first AI coding agent.
- **Lesson:** Terminal UIs for AI agents benefit from structured output blocks (not raw streams).

### Warp Terminal
- **Architecture:** Rust core + GPU rendering. Block-based terminal model.
- **Lesson:** Treating each command/output as a discrete block enables selection, copying, and AI interaction per-block.

---

## 10. Architecture Recommendations Summary

### Immediate Actions
1. **Terminal:** Custom xterm.js wrapper with `@xterm/addon-webgl`. Block-based output model (each grammar token line = a block).
2. **Canvas:** Manifest-to-component renderer inspired by Puck's JSON -> `<Render>` pattern. Component registry with Zod schemas.
3. **State:** Zustand 5 slice pattern. Use `zustand-indexeddb` for persistence. Separate slices for terminal, canvas, agents, proposals.
4. **Agents:** Supervisor/handoff pattern. MCP for tool integration. AG-UI for streaming UI updates.
5. **Proposals:** First-class Zod-validated proposal objects. Hard propose/approve/execute separation.

### Key Libraries to Evaluate
| Need | Library | Why |
|---|---|---|
| Terminal | `@xterm/xterm` + `@xterm/addon-webgl` | Industry standard, GPU-accelerated |
| Generative UI | Vercel AI SDK or Tambo | Structured tool-call -> component rendering |
| Agent orchestration | LangGraph or custom | Stateful graph-based agent workflows |
| Component registry | Custom + Zod | Manifest-driven rendering with validation |
| Persistence | `zustand-indexeddb` | Purpose-built for Zustand + IndexedDB |
| UI primitives | shadcn/ui (Radix) | Latest components, MCP server, presets |

### Architecture Layers
```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  Terminal Surface  │  Canvas Surface    │
│  (xterm.js blocks) │  (component render)│
├─────────────────────────────────────────┤
│           Grammar Token Layer           │
│  > narrative  @ delegate  # status  !   │
│  (maps structured messages to display)  │
├─────────────────────────────────────────┤
│           State Layer (Zustand 5)       │
│  terminal │ canvas │ agents │ proposals │
│  (persisted to IndexedDB)              │
├─────────────────────────────────────────┤
│           Agent Orchestration           │
│  Supervisor → Specialist Agents         │
│  (MCP tools, AG-UI streaming)          │
├─────────────────────────────────────────┤
│           Wire Protocol                 │
│  Structured JSON (Zod-validated)        │
│  MCP-compatible message format          │
└─────────────────────────────────────────┘
```

---

## Sources

### Terminal UI
- [xterm.js](https://xtermjs.org/)
- [react-xtermjs (Qovery)](https://github.com/Qovery/react-xtermjs)
- [How Warp Works](https://www.warp.dev/blog/how-warp-works)
- [Warp Terminal Features](https://docs.warp.dev/how-does-warp-compare/terminal-features)

### Canvas / Generative UI
- [Puck Editor](https://puckeditor.com/docs)
- [Craft.js](https://github.com/prevwong/craft.js/)
- [Vercel AI SDK Generative UI](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces)
- [CopilotKit Generative UI](https://www.copilotkit.ai/generative-ui)
- [Tambo Generative UI SDK](https://github.com/tambo-ai/tambo)
- [Developer's Guide to Generative UI in 2026](https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026)
- [Top 5 Page Builders for React 2026](https://dev.to/fede_bonel_tozzi/top-5-page-builders-for-react-190g)

### Multi-Agent Patterns
- [AI Agent Orchestration Patterns (Microsoft Azure)](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [Google's Multi-Agent Design Patterns](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/)
- [Multi-Agent Systems 2026 Guide](https://dev.to/eira-wexford/how-to-build-multi-agent-systems-complete-2026-guide-1io6)
- [AI Agent Delegation and Coordination](https://zylos.ai/research/2026-03-08-ai-agent-delegation-team-coordination-patterns)
- [Open Multi-Agent Canvas (CopilotKit)](https://github.com/CopilotKit/open-multi-agent-canvas)
- [AI-Agents-Orchestrator](https://github.com/hoangsonww/AI-Agents-Orchestrator)
- [CLI Agent Orchestrator (AWS)](https://aws.amazon.com/blogs/opensource/introducing-cli-agent-orchestrator-transforming-developer-cli-tools-into-a-multi-agent-powerhouse/)

### Human-in-the-Loop
- [Human-in-the-Loop Best Practices (Permit.io)](https://www.permit.io/blog/human-in-the-loop-for-ai-agents-best-practices-frameworks-use-cases-and-demo)
- [Approval Workflows for AI Agents (StackAI)](https://www.stackai.com/insights/human-in-the-loop-ai-agents-how-to-design-approval-workflows-for-safe-and-scalable-automation)
- [Plan-and-Execute with Approval (LangGraph)](https://www.marktechpost.com/2026/02/16/how-to-build-human-in-the-loop-plan-and-execute-ai-agents-with-explicit-user-approval-using-langgraph-and-streamlit/)
- [Human-in-the-Loop with AG-UI (Microsoft)](https://learn.microsoft.com/en-us/agent-framework/integrations/ag-ui/human-in-the-loop)

### Zustand 5
- [Zustand v5 Announcement](https://pmnd.rs/blog/announcing-zustand-v5)
- [Zustand v5 Migration Guide](https://github.com/pmndrs/zustand/blob/main/docs/migrations/migrating-to-v5.md)
- [zustand-indexeddb](https://github.com/zustandjs/zustand-indexeddb)
- [Zustand Slices Pattern](https://deepwiki.com/pmndrs/zustand/7.1-slices-pattern)

### Next.js 16 / React 19
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16)
- [Next.js 16.1 Blog Post](https://nextjs.org/blog/next-16-1)
- [Next.js 16 Features Overview (MakerKit)](https://makerkit.dev/blog/tutorials/nextjs-16)
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2)
- [React Stack Patterns 2026](https://www.patterns.dev/react/react-2026/)
- [React Trends 2026 (Netguru)](https://www.netguru.com/blog/react-js-trends)

### shadcn/ui
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog)
- [Shadcn Visual Project Builder (InfoQ)](https://www.infoq.com/news/2026/02/shadcn-ui-builder/)
- [Shadcn Ecosystem Guide 2025](https://www.devkit.best/blog/mdx/shadcn-ui-ecosystem-complete-guide-2025)
- [shadcn/ui Cheat Sheet 2026](https://dev.to/codedthemes/shadcnui-cheat-sheet-2026-2f5k)

### Agent Communication / DSL
- [AI Agent Protocols 2026 Guide](https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide)
- [A2A Protocol for AI Agent Communication (IBM)](https://www.ibm.com/think/tutorials/use-a2a-protocol-for-ai-agent-communication)
- [Agentic AI Trends 2026](https://machinelearningmastery.com/7-agentic-ai-trends-to-watch-in-2026/)

---

## Staleness Review (2026-04-14)

Verified during vault audit. This research is 34 days old. The ExecuDeck project remains active (Phase 1, ~70% per [[ExecuDeck]] project note). Stack versions listed here match the project note (Next.js 16.1.6, React 19.2.3, Zustand 5, etc.). Library recommendations remain current — no major version bumps detected in core dependencies. The research content is still valid as a reference for architecture decisions.

#research #execudeck #tech-landscape #2026
