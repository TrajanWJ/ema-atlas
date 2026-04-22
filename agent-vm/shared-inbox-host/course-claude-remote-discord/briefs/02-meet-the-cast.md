# Module 2: Meet the Cast

### Teaching Arc
- **Metaphor:** A film crew — shared is the script everyone reads from, server is the director calling the shots, bot is the lead actor facing the audience, web is the camera showing what's happening
- **Opening hook:** ClaudeForge is split into 4 packages, each with a clear job. Think of them as crew members on a film set.
- **Key insight:** Splitting a project into focused packages means each piece can be understood, tested, and modified independently
- **"Why should I care?":** When you tell an AI agent "put this logic in the server package," you need to know what belongs where. This module gives you that map.

### Screens
1. **The monorepo layout** — Visual file tree of the 4 packages
2. **Shared: the script** — Types and events that everyone imports
3. **Server: the director** — Session manager, persistence, REST API, WebSocket
4. **Bot: the lead actor** — Discord commands, message routing, output rendering
5. **Web: the camera** — Next.js UI, Zustand stores, real-time updates
6. **Group chat: a day in the life** — Components chatting with each other
7. **Quiz** — drag-and-drop matching

### Code Snippets (pre-extracted)

Snippet 1 — Shared types (packages/shared/src/types.ts lines 1-9):
```typescript
export type ProviderName = "claude" | "codex";
export type SessionMode = "auto" | "plan" | "normal";
export type SessionStatus = "active" | "idle" | "stopped" | "error";
export type TaskStatus = "backlog" | "in_progress" | "review" | "done" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "critical";
export type MessageRole = "user" | "assistant" | "system" | "tool";
```

Snippet 2 — Server events (packages/shared/src/events.ts lines 15-25):
```typescript
export type ProviderEvent =
  | { type: "session_init"; providerSessionId: string }
  | { type: "text"; content: string }
  | { type: "tool_use"; tool: string; input: string; toolCall: ToolCall }
  | { type: "tool_result"; tool: string; output: string; toolCall: ToolCall; isError?: boolean }
  | { type: "image"; mediaType: string; data: string }
  | { type: "done"; sessionId: string; cost?: number; inputTokens?: number; outputTokens?: number; providerSessionId?: string }
  | { type: "error"; message: string }
  | { type: "input_request"; question: string; options?: string[] }
  | { type: "thinking"; content: string };
```

Snippet 3 — SessionRecord type (packages/shared/src/types.ts lines 36-57):
```typescript
export interface SessionRecord {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  directory: string;
  channelId?: string | null;
  provider: ProviderName;
  providerSessionId?: string | null;
  tmuxName: string;
  model?: string | null;
  mode: SessionMode;
  agentPersona?: string | null;
  systemPrompt?: string | null;
  status: SessionStatus;
  verbose: boolean;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
}
```

### Interactive Elements

- [x] **Visual file tree** — 4 packages with key files annotated
- [x] **Code-English translation** — Snippet 1 (shared types) and Snippet 2 (provider events)
- [x] **Group chat animation** — actors: Shared, Server, Bot, Web. Flow: Bot receives Discord message -> asks Server to route -> Server checks Shared types -> Server spawns Claude -> streams events -> Bot renders to Discord + Web gets WebSocket update
- [x] **Drag-and-drop** — Match responsibilities to packages (e.g., "Manages tmux sessions" -> Server, "Renders Discord embeds" -> Bot, "Defines event types" -> Shared, "Shows Kanban board" -> Web)
- [x] **Quiz** — 3 architecture questions

### Connections
- **Previous module:** "What Is ClaudeForge?" — showed the big picture and end-to-end trace
- **Next module:** "The Message Highway" — zooms into how messages get classified and routed
- **Tone:** Teal accent. Module background: var(--color-bg-warm) (odd module). Each package gets a consistent actor color: Shared=actor-4 (golden), Server=actor-2 (teal), Bot=actor-1 (vermillion), Web=actor-3 (plum).
