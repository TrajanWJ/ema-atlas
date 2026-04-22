// ─── Provider & Session Types ───────────────────────────────

export type ProviderName = "claude" | "codex" | "hermes";
export type SessionMode = "auto" | "plan" | "normal";
export type SessionStatus = "active" | "idle" | "stopped" | "error";
export type TaskStatus = "backlog" | "in_progress" | "review" | "done" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "critical";
export type MessageRole = "user" | "assistant" | "system" | "tool";

export type ToolCallKind =
  | "read"
  | "edit"
  | "write"
  | "bash"
  | "search"
  | "done"
  | "error"
  | "thinking"
  | "generic";

// ─── Core Data Models ───────────────────────────────────────

export interface ProjectLocation {
  id: string;
  name: string;
  directory: string;
  categoryId?: string | null;
  logChannelId?: string | null;
  personality?: string | null;
  config?: Record<string, unknown>;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

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
  status: SessionStatus;
  verbose: boolean;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
}

export interface ToolCall {
  id: string;
  kind: ToolCallKind;
  tool: string;
  title: string;
  input?: string;
  output?: string;
  filePath?: string;
  lineRange?: string;
  isError?: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  toolCall?: ToolCall | null;
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  agent?: ProviderName | null;
  sessionId?: string | null;
  projectName?: string | null;
  output?: string | null;
  createdAt: number;
  startedAt?: number | null;
  completedAt?: number | null;
  updatedAt: number;
}

export interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
}

export interface AppStatus {
  projects: number;
  sessions: number;
  activeSessions: number;
  tasks: { backlog: number; in_progress: number; review: number; done: number };
  health: SystemHealth;
}

// ─── API Request Types ──────────────────────────────────────

export interface OpenLocationRequest {
  directory: string;
  sessionName?: string;
  provider?: ProviderName;
  model?: string;
  mode?: SessionMode;
}

export interface CreateSessionRequest {
  projectId: string;
  directory: string;
  projectName: string;
  name: string;
  provider?: ProviderName;
  channelId?: string;
  model?: string;
  mode?: SessionMode;
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  agent?: ProviderName;
  projectName?: string;
}

export interface RunShellRequest {
  sessionId: string;
  command: string;
}

// ─── Interpreter Types ──────────────────────────────────────

export type IntentKind = "chat" | "shell" | "tool" | "meta" | "confirm";

export interface ClassifiedIntent {
  kind: IntentKind;
  raw: string;
  payload: string;
  target?: string;
  safety: SafetyResult;
  context?: PromptContext;
}

export interface PromptContext {
  projectName: string;
  directory: string;
  gitBranch?: string;
  recentFiles?: string[];
  techStack?: string[];
  claudeMd?: string;
}

export interface SafetyResult {
  level: "safe" | "warn" | "block";
  reason?: string;
  confirmPrompt?: string;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  truncated: boolean;
}
