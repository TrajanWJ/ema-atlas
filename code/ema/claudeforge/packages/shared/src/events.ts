import type {
  AppStatus,
  ChatMessage,
  ProjectLocation,
  SessionRecord,
  SessionStatus,
  SystemHealth,
  TaskRecord,
  ToolCall,
} from "./types.js";

// ─── Provider Events (from Claude/Codex SDK) ───────────────

export type ProviderEvent =
  | { type: "session_init"; providerSessionId: string }
  | { type: "text"; content: string }
  | { type: "tool_use"; tool: string; input: string; toolCall: ToolCall }
  | { type: "tool_result"; tool: string; output: string; toolCall: ToolCall; isError?: boolean }
  | { type: "image"; mediaType: string; data: string }
  | { type: "done"; sessionId: string; cost?: number }
  | { type: "error"; message: string }
  | { type: "input_request"; question: string; options?: string[] };

// ─── Server → Client Events (WebSocket) ────────────────────

export type ServerEvent =
  | { type: "session.output"; sessionId: string; data: ProviderEvent }
  | { type: "session.status"; sessionId: string; status: SessionStatus }
  | { type: "session.created"; session: SessionRecord }
  | { type: "session.updated"; session: SessionRecord }
  | { type: "session.closed"; sessionId: string }
  | { type: "message.created"; message: ChatMessage }
  | { type: "project.created"; project: ProjectLocation }
  | { type: "project.updated"; project: ProjectLocation }
  | { type: "task.created"; task: TaskRecord }
  | { type: "task.updated"; task: TaskRecord }
  | { type: "system.health"; data: SystemHealth }
  | { type: "system.status"; data: AppStatus }
  | { type: "system.error"; data: { source: string; message: string; severity: string } };

// ─── Client → Server Commands (WebSocket) ───────────────────

export type ClientCommand =
  | { type: "session.message"; sessionId: string; content: string }
  | { type: "session.create"; directory: string; name: string; provider?: string; model?: string }
  | { type: "session.stop"; sessionId: string }
  | { type: "session.resume"; sessionId: string }
  | { type: "task.create"; data: Partial<TaskRecord> }
  | { type: "task.update"; taskId: string; data: Partial<TaskRecord> }
  | { type: "shell.run"; sessionId: string; command: string };

// ─── Event Names ────────────────────────────────────────────

export const WS_EVENTS = {
  SESSION_OUTPUT: "session.output",
  SESSION_STATUS: "session.status",
  SESSION_CREATED: "session.created",
  SESSION_UPDATED: "session.updated",
  SESSION_CLOSED: "session.closed",
  MESSAGE_CREATED: "message.created",
  PROJECT_CREATED: "project.created",
  PROJECT_UPDATED: "project.updated",
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated",
  SYSTEM_HEALTH: "system.health",
  SYSTEM_STATUS: "system.status",
  SYSTEM_ERROR: "system.error",
} as const;
