---
title: "Cherry Studio — Codebase Teardown"
type: research
created: 2026-03-23
tags:
  - frontend
  - electron
  - ai-client
  - reference-architecture
status: complete
repo: https://github.com/CherryHQ/cherry-studio
version_analyzed: 1.7.10
---

# Cherry Studio — Comprehensive Codebase Teardown

Cherry Studio is a **multi-provider AI chat client** built as an Electron desktop app. It's one of the most feature-rich open-source AI frontends available — supporting 60+ LLM providers, image generation, knowledge bases, MCP servers, an agent system (Claude Code SDK), notes, translation, mini-apps, and more. v2.0 refactor is actively in progress.

---

## 1. Tech Stack

### Core Framework
| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Electron | 38.7.0 |
| **Build** | electron-vite (rolldown-vite) | 5.0.0 |
| **Language** | TypeScript | ~5.8.3 |
| **Package Manager** | pnpm | 10.27.0 |
| **Node requirement** | ≥22.0.0 | — |

### Frontend (Renderer)
| Concern | Library | Notes |
|---|---|---|
| **UI Framework** | React 19 | Latest with `@ant-design/v5-patch-for-react-19` |
| **Routing** | react-router-dom v6 | HashRouter (Electron-friendly) |
| **State** | Redux Toolkit + redux-persist | ~25 slices; persisted to localStorage with blacklist for runtime/messages |
| **UI Library** | Ant Design (antd) 5.27 | Primary component library, patched |
| **Styling** | styled-components 6 + Tailwind CSS 4 | Dual system — styled-components for complex components, Tailwind for utility |
| **Animation** | framer-motion / motion 12 | Page transitions, message animations |
| **Rich Text Editor** | TipTap 3.2 (ProseMirror) | Notes page — full block editor with code blocks (Shiki), math (KaTeX), images, drag handles, YAML frontmatter |
| **Code Editor** | CodeMirror (@uiw/react-codemirror) | For JSON/config editing |
| **Markdown** | react-markdown + remark/rehype plugins | Chat messages with GFM, math, alerts, code highlighting |
| **Code Highlighting** | Shiki 3 | Streaming-aware tokenizer (`ShikiStreamService`) |
| **Diagrams** | Mermaid 11, Graphviz (@viz-js), PlantUML | Rendered inline in chat |
| **Math** | KaTeX 0.16 + rehype-katex/rehype-mathjax | LaTeX rendering in messages |
| **DnD** | @dnd-kit + @hello-pangea/dnd | Sortable lists, drag reordering |
| **Virtualization** | @tanstack/react-virtual | Long message lists, model lists |
| **i18n** | i18next + react-i18next | 20+ locales with auto-translation scripts |
| **Data Fetching** | @tanstack/react-query + SWR | Hybrid — react-query for agents, SWR for some caching |
| **Validation** | Zod 4 | Heavy use in agent types, API schemas |
| **Flow Diagrams** | @xyflow/react | Chat flow visualization |

### AI/LLM Integration
| Library | Purpose |
|---|---|
| `ai` (Vercel AI SDK) 5.x | Core streaming abstraction, middleware pipeline |
| `@ai-sdk/*` (15+ providers) | OpenAI, Anthropic, Google, Azure, Bedrock, Mistral, xAI, Cerebras, Perplexity, HuggingFace, Google Vertex |
| `@anthropic-ai/claude-agent-sdk` | Agent mode (Claude Code integration) |
| `@cherrystudio/openai` (fork) | Patched OpenAI client |
| `@modelcontextprotocol/sdk` 1.23 | MCP server support |
| `@langchain/*` | Knowledge base embeddings |
| `@cherrystudio/embedjs-*` | Custom embedding pipeline (PDF, CSV, web, images, sitemap, XML) |
| `ollama-ai-provider-v2` | Ollama integration |

### Main Process (Electron)
| Concern | Library |
|---|---|
| **Database** | `@libsql/client` + Drizzle ORM | Agent data persistence (SQLite) |
| **API Server** | Express 5 + Swagger | Internal REST API for agent management |
| **Knowledge** | Custom embedjs pipeline | Chunking, embedding, reranking |
| **MCP** | Built-in servers (browser, filesystem, hub) |
| **OCR** | `@napi-rs/system-ocr` + `tesseract.js` |
| **Logging** | Winston + daily rotate |
| **File Processing** | sharp, officeparser, pdf-parse, epub |

---

## 2. Route / Page Structure

### Router (`src/renderer/src/Router.tsx`)

Uses `HashRouter` with a sidebar or tab-based layout depending on `navbarPosition` setting.

| Route | Component | Description |
|---|---|---|
| `/` | `HomePage` | **Main chat interface** — the core of the app. Assistants sidebar, message list, input bar |
| `/store` | `AssistantPresetsPage` | Browse/import preset assistant templates (community store) |
| `/paintings/*` | `PaintingsRoutePage` | **Image generation** — sub-routes for different providers (Aihubmix, Zhipu, Silicon, DMXAPI, TokenFlux, OVMS, NewApi) |
| `/translate` | `TranslatePage` | Dedicated translation interface with history and settings |
| `/files` | `FilesPage` | File browser with content viewer |
| `/notes` | `NotesPage` | **Full notes editor** — TipTap-based, tree sidebar, full-text search, Obsidian-like |
| `/knowledge` | `KnowledgePage` | Knowledge base management — files, URLs, sitemaps, videos, directories |
| `/apps/:appId` | `MinAppPage` | Single mini-app view (webview container) |
| `/apps` | `MinAppsPage` | Mini-app browser/grid with settings |
| `/code` | `CodeToolsPage` | Code tools page |
| `/settings/*` | `SettingsPage` | Deeply nested settings (see below) |
| `/launchpad` | `LaunchpadPage` | Quick launch / dashboard |

### Settings Sub-Pages
Located in `src/renderer/src/pages/settings/`:

- **ProviderSettings** — Per-provider config (API key, host, model list, health checks). Special pages for Anthropic, AWS Bedrock, Vertex AI, GPUStack, LM Studio, GitHub Copilot, DMXAPI, CherryIN, OVMS
- **ModelSettings** — Default model selection, quick model, translate model
- **AssistantSettings** — Default assistant config: prompt, model, knowledge bases, MCP, memory, regular prompts
- **AgentSettings** — Agent (Claude Code) configuration: name, avatar, description, model, prompt, permissions, tools, plugins, accessible directories
- **MCPSettings** — MCP server management: add/remove servers, marketplace, npx/uv install, JSON editor, sync, built-in servers
- **WebSearchSettings** — Web search provider config, blacklists, compression (cutoff/RAG), subscriptions
- **MemorySettings** — Long-term memory config with user selector
- **DisplaySettings** — Theme, sidebar icons, layout
- **DataSettings** — Import/export, backups (local, WebDAV, S3, Nutstore), integrations (Obsidian, Notion, Joplin, Siyuan, Yuque)
- **DocProcessSettings** — OCR configuration (system, Tesseract, PaddleOCR, image-based), preprocessing providers
- **SelectionAssistantSettings** — OS text selection assistant: actions, filters, trusted processes
- **ToolSettings** — API server settings
- **ShortcutSettings** — Keyboard shortcuts
- **QuickAssistantSettings** — Quick assistant configuration
- **QuickPhraseSettings** — Quick phrase templates
- **TranslateSettingsPopup** — Translation prompt settings, custom languages
- **GeneralSettings** — General app settings
- **AboutSettings** — Version, updates

### Secondary Windows
Located in `src/renderer/src/windows/`:

- **Mini Window** (`windows/mini/`) — Compact floating window with:
  - `HomeWindow` — Quick input bar, clipboard preview, feature menus
  - `ChatWindow` — Minimal chat interface
  - `TranslateWindow` — Quick translate
- **Selection Window** (`windows/selection/`) — OS text selection integration:
  - `SelectionToolbar` — Floating toolbar on text selection
  - `SelectionActionApp` — Action popup (general AI actions, translate)

---

## 3. Agent Configuration UI

Cherry Studio has **two distinct agent systems**:

### 3a. Assistants (Legacy/Primary System)
The original system. Defined in `src/renderer/src/types/index.ts` as the `Assistant` type:

```typescript
type Assistant = {
  id: string
  name: string
  prompt: string               // System prompt
  knowledge_bases?: KnowledgeBase[]
  topics: Topic[]
  type: string
  emoji?: string               // Avatar
  description?: string
  model?: Model
  defaultModel?: Model
  settings?: Partial<AssistantSettings>  // Temperature, top_p, etc.
  messages?: AssistantMessage[]          // Few-shot examples
  enableWebSearch?: boolean
  enableUrlContext?: boolean
  enableGenerateImage?: boolean
  mcpMode?: 'disabled' | 'auto' | 'manual'
  mcpServers?: MCPServer[]
  knowledgeRecognition?: 'off' | 'on'
  regularPhrases?: QuickPhrase[]
  tags?: string[]
  enableMemory?: boolean
}
```

**UI Flow:**
- Sidebar `AssistantsTab` shows all assistants grouped by tags
- `AddAssistantPopup` / `AddAssistantOrAgentPopup` for creation
- `AssistantSettings/` page has sub-sections: Prompt, Model, Knowledge Base, MCP, Memory, Regular Prompts
- Assistants can be imported from the Store (`/store` route — `AssistantPresetsPage`)
- Each assistant has Topics (conversation threads) with their own message history
- Settings tab in the home page right panel (`SettingsTab`) for per-conversation model params

### 3b. Agents (New System — Claude Code SDK)
A newer system backed by a full REST API and SQLite database. Defined in `src/renderer/src/types/agent.ts`:

```typescript
type AgentBase = {
  name?: string
  description?: string
  accessible_paths: string[]    // Directory access control
  instructions?: string         // System prompt
  model: string                 // Main model ID
  plan_model?: string           // Optional planning model
  small_model?: string          // Optional fast model
  mcps?: string[]               // MCP tool IDs
  allowed_tools?: string[]      // Tool whitelist
  slash_commands?: SlashCommand[]
  configuration?: {
    avatar?: string
    permission_mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'
    max_turns: number
  }
}
```

**UI Components:**
- `AgentSettingsPopup` — Full agent config with sections:
  - `EssentialSettings` — Name, avatar, description, model
  - `PromptSettings` — System instructions
  - `ToolingSettings` — MCP servers, allowed tools
  - `PluginSettings` — Plugin browser, installed plugins list, plugin detail modals
  - `AccessibleDirsSetting` — Directory path management
  - `AdvancedSettings` — Permission mode, max turns
- `SessionSettingsPopup` — Per-session overrides of agent config
- `AgentItem` in sidebar for agent display
- Agent sessions have their own message rendering: `AgentSessionMessages`, `AgentSessionInputbar`
- Tool permission cards: `ToolPermissionRequestCard` with approve/deny flows
- Rich tool renderers: `BashTool`, `EditTool`, `ReadTool`, `WriteTool`, `SearchTool`, `GlobTool`, `GrepTool`, `WebSearchTool`, `WebFetchTool`, `TaskTool`, `SkillTool`, `TodoWriteTool`, `ExitPlanModeTool`

### Agent Persistence
- Main process runs an Express API server (`src/main/apiServer/`)
- SQLite via `@libsql/client` + Drizzle ORM (`src/main/services/agents/`)
- Agents service integrates with Claude Code SDK (`src/main/services/agents/services/claudecode/`)
- Database schema managed via Drizzle Kit migrations

---

## 4. Model / Provider Management

### Provider Architecture
Cherry Studio ships with **60+ pre-configured providers** defined in `src/renderer/src/config/providers.ts`. Each provider has:

```typescript
type SystemProvider = {
  id: SystemProviderId
  name: string
  type: 'openai' | 'anthropic' | 'gemini' | ...
  apiKey: string
  apiHost: string
  anthropicApiHost?: string
  models: Model[]
  isSystem: boolean
  enabled: boolean
}
```

**Notable Built-in Providers:** CherryAI, OpenAI, Anthropic, Google Gemini, Azure, AWS Bedrock, Vertex AI, DeepSeek, Ollama, LM Studio, Groq, xAI/Grok, Mistral, Perplexity, OpenRouter, SiliconFlow, HuggingFace, Cerebras, Together, Fireworks, Nvidia, GitHub Copilot, and many China-focused providers (Zhipu, Baichuan, Moonshot, Minimax, Doubao/ByteDance, etc.)

### State Management (Redux `llm` slice)
```typescript
interface LlmState {
  providers: Provider[]
  defaultModel: Model
  quickModel: Model
  translateModel: Model
  quickAssistantId: string
  settings: LlmSettings  // Per-provider settings (Ollama keepAlive, Vertex SA, AWS creds)
}
```

Key actions: `addProvider`, `updateProvider`, `removeProvider`, `addModel`, `removeModel`, `updateModel`, `setDefaultModel`, `setQuickModel`, `setTranslateModel`

### Provider Settings UI
`src/renderer/src/pages/settings/ProviderSettings/`:

- **ProviderList** — Left panel listing all providers (system + custom)
- **ProviderSetting** — Right panel with per-provider config
- **AddProviderPopup** — Add custom OpenAI-compatible providers
- **ModelList** — Model management per provider:
  - `ModelListItem` — Individual model with edit/remove
  - `ModelListGroup` — Grouped display
  - `ManageModelsPopup` — Bulk model management
  - `AddModelPopup` — Manual model addition
  - `HealthCheckPopup` — Test model connectivity
  - `EditModelPopup` — Edit model properties (type selector: chat/embedding/reasoning/vision/etc.)
  - `NewApiAddModelPopup` / `NewApiBatchAddModelPopup` — For API-compatible providers
- **SelectProviderModelPopup** — Model picker used across the app
- Specialized settings: `AnthropicSettings`, `AwsBedrockSettings`, `VertexAISettings`, `GPUStackSettings`, `LMStudioSettings`, `GithubCopilotSettings`, `OVMSSettings`

### AI Core Pipeline
`src/renderer/src/aiCore/` is the heart of the LLM integration:

- **Provider Factory** (`provider/factory.ts`) — Creates AI SDK provider instances from config
- **Provider Config** (`provider/config/`) — Per-provider configuration (aihubmix, newApi, azure-anthropic, vertex-anthropic)
- **Middleware Pipeline** — Vercel AI SDK middleware for:
  - `noThinkMiddleware` — Strip thinking tokens
  - `qwenThinkingMiddleware` — Qwen reasoning format
  - `openrouterReasoningMiddleware` — OpenRouter reasoning
  - `toolChoiceMiddleware` — Tool selection
  - `skipGeminiThoughtSignatureMiddleware` — Gemini quirks
  - `openrouterGenerateImageMiddleware` — Image generation via OpenRouter
- **Legacy Clients** (`legacy/clients/`) — Pre-AI-SDK clients for specific providers: Anthropic, Gemini, AWS, Zhipu, PPIO, OVMS, etc.
- **Legacy Middleware** — Full middleware chain: abort handling, error handling, logging, stream adaptation, text/think chunk processing, tool use extraction, image generation, web search
- **Tools** — `KnowledgeSearchTool`, `MemorySearchTool`, `WebSearchTool`
- **Plugins** — `reasoningTimePlugin`, `searchOrchestrationPlugin`, `telemetryPlugin`

### Model Capabilities Detection
`src/renderer/src/config/models/`:
- `vision.ts` — Which models support vision
- `reasoning.ts` — Which models support reasoning/thinking
- `tooluse.ts` — Which models support tool calling
- `websearch.ts` — Which models have built-in web search
- `embedding.ts` — Embedding model detection
- `logo.ts` — Model logo/icon mapping

---

## 5. Most Interesting UI Patterns & Components

### 5a. Message Block Architecture
Messages aren't monolithic — they're composed of typed blocks:
- `MainTextBlock` — Markdown content
- `ThinkingBlock` — Collapsible reasoning/thinking display with animation
- `ToolBlock` — Tool call visualization
- `ImageBlock` / `VideoBlock` — Media
- `CitationBlock` — Source citations
- `FileBlock` — Attached files
- `TranslationBlock` — Translation overlay
- `ErrorBlock` — Error display
- `CompactBlock` — Compressed display
- `PlaceholderBlock` — Loading state

The `BlockManager` service manages streaming block creation/updates.

### 5b. Streaming Markdown with Shiki
`ShikiStreamService` + `ShikiStreamTokenizer` — Custom implementation that tokenizes code blocks incrementally as they stream in, avoiding full re-parse on each chunk. Uses a Web Worker (`shiki-stream.worker.ts`) for off-main-thread highlighting.

### 5c. Input Bar Tool System
The input bar (`src/renderer/src/pages/home/Inputbar/`) has a pluggable tool system:
- Each tool (attachment, web search, knowledge base, MCP, thinking, generate image, etc.) is a registered module
- Tools have button components, activation logic, and state
- `InputbarToolsProvider` context manages active tools
- Quick panels with search for model mention (`@model`), activity directory, web search providers

### 5d. Mini-App System
Full webview-based mini-app platform:
- `MinAppTabsPool` — Tab pool for managing multiple webview instances
- `WebviewContainer` — Sandboxed webview with search, settings
- Apps can be pinned to sidebar (`PinnedMinapps`)
- Custom per-app icons and settings

### 5e. Selection Assistant (OS-level)
A system-wide text selection assistant:
- `SelectionToolbar` — Floating toolbar that appears on text selection
- `SelectionActionApp` — Popup with AI actions (summarize, translate, explain, etc.)
- Process trust management (macOS accessibility)
- Configurable action list with custom prompts

### 5f. QuickPanel System
Reusable command palette / quick picker:
- `QuickPanelProvider` — Context wrapper
- Configurable strategies (model selection, web search, activity directory)
- Keyboard-driven with search filtering

### 5g. Components v2 (Discord-like)
The codebase uses Discord Components v2 patterns — identity bars, rich embeds, interactive buttons. The `TopView` system manages popup/overlay rendering.

### 5h. Redux Store Architecture
25+ Redux slices covering every feature area. Persisted via redux-persist with intelligent blacklisting. Cross-window sync via `StoreSyncService` middleware. v2 refactor is actively migrating this — many files carry deprecation notices pointing to PR #10162.

### 5i. Dual Styling System
Interesting choice: **styled-components** for complex, dynamic components (code toolbars, rich editor, window controls) + **Tailwind CSS 4** for utility styling. `tailwind-merge` for class conflict resolution.

### 5j. Knowledge Base Pipeline
Full RAG pipeline in a desktop app:
- Custom `@cherrystudio/embedjs-*` packages for embedding (10+ loaders: PDF, CSV, web, images, sitemap, XML, markdown, MS Office)
- Reranker with multiple strategies
- Vector storage via libsql
- Knowledge search integrated as an AI tool

### 5k. Trace/Telemetry System
Built-in observability:
- `TraceTree` / `SpanDetail` — Visual span tree for debugging AI calls
- `AiSdkSpanAdapter` — Adapts AI SDK telemetry to custom span format
- OpenTelemetry export support
- Separate trace window

### 5l. DnD System
Two DnD implementations coexist:
- `@dnd-kit` — Newer, used for sortable lists (`DraggableList`, `DraggableVirtualList`)
- `@hello-pangea/dnd` — Used for some legacy drag operations
- Custom `useDraggableReorder` hook abstracts the complexity

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Express  │  │ Drizzle  │  │  MCP     │  │Knowledge│ │
│  │ API (5.0)│  │ + SQLite │  │ Servers  │  │Pipeline │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Claude  │  │   OCR    │  │  File    │              │
│  │Code SDK  │  │ Service  │  │ Service  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└───────────────────────┬─────────────────────────────────┘
                        │ IPC (preload bridge)
┌───────────────────────┴─────────────────────────────────┐
│                   Electron Renderer                       │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              React 19 + Redux Toolkit                │ │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐ │ │
│  │  │ Router │  │ Store  │  │ AI Core│  │ Services │ │ │
│  │  │ (v6)   │  │(25 sl.)│  │Pipeline│  │(30+ svc.)│ │ │
│  │  └────────┘  └────────┘  └────────┘  └──────────┘ │ │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐ │ │
│  │  │  antd  │  │TipTap  │  │ Shiki  │  │react-md  │ │ │
│  │  │  5.27  │  │  3.2   │  │Stream  │  │+ remark  │ │ │
│  │  └────────┘  └────────┘  └────────┘  └──────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │   Mini Window    │  │ Selection Window │              │
│  │ (chat/translate) │  │ (toolbar/action) │              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## Key Takeaways for Frontend Vision

1. **Massive provider coverage** — 60+ pre-configured providers with a generic "OpenAI-compatible" escape hatch. This is their moat.
2. **Dual agent systems** — Legacy "Assistants" (simple prompt+model) alongside new "Agents" (Claude Code SDK with tools, permissions, SQLite persistence). The v2 refactor aims to unify these.
3. **AI SDK middleware pattern** — The Vercel AI SDK middleware pipeline is how they handle provider quirks (reasoning format differences, image generation, thinking tokens) cleanly.
4. **Block-based messages** — Messages decomposed into typed blocks enables rich rendering (code, math, diagrams, citations, tool calls) without a monolithic component.
5. **Desktop-native features** — Selection assistant, mini window, system OCR, MCP filesystem access — things web apps can't do.
6. **Kitchen-sink scope** — Chat + notes + knowledge bases + translation + image generation + mini-apps + code tools + MCP. Ambitious but coherent.
7. **v2 refactor in progress** — Major data/UI refactoring (PR #10162) is actively changing the Redux store and component architecture. Many files carry deprecation warnings.
8. **Chinese ecosystem focus** — Heavy investment in China-specific providers (Zhipu, Baichuan, DeepSeek, Moonshot, ByteDance, etc.) and integrations (Nutstore, Siyuan).
