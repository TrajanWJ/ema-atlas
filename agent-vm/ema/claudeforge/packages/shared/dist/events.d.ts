import type { AppStatus, ChatMessage, ProjectLocation, SessionRecord, SessionStatus, SystemHealth, TaskRecord, ToolCall } from "./types.js";
export type ProviderEvent = {
    type: "session_init";
    providerSessionId: string;
} | {
    type: "text";
    content: string;
} | {
    type: "tool_use";
    tool: string;
    input: string;
    toolCall: ToolCall;
} | {
    type: "tool_result";
    tool: string;
    output: string;
    toolCall: ToolCall;
    isError?: boolean;
} | {
    type: "image";
    mediaType: string;
    data: string;
} | {
    type: "done";
    sessionId: string;
    cost?: number;
} | {
    type: "error";
    message: string;
} | {
    type: "input_request";
    question: string;
    options?: string[];
};
export type ServerEvent = {
    type: "session.output";
    sessionId: string;
    data: ProviderEvent;
} | {
    type: "session.status";
    sessionId: string;
    status: SessionStatus;
} | {
    type: "session.created";
    session: SessionRecord;
} | {
    type: "session.updated";
    session: SessionRecord;
} | {
    type: "session.closed";
    sessionId: string;
} | {
    type: "message.created";
    message: ChatMessage;
} | {
    type: "project.created";
    project: ProjectLocation;
} | {
    type: "project.updated";
    project: ProjectLocation;
} | {
    type: "task.created";
    task: TaskRecord;
} | {
    type: "task.updated";
    task: TaskRecord;
} | {
    type: "system.health";
    data: SystemHealth;
} | {
    type: "system.status";
    data: AppStatus;
} | {
    type: "system.error";
    data: {
        source: string;
        message: string;
        severity: string;
    };
};
export type ClientCommand = {
    type: "session.message";
    sessionId: string;
    content: string;
} | {
    type: "session.create";
    directory: string;
    name: string;
    provider?: string;
    model?: string;
} | {
    type: "session.stop";
    sessionId: string;
} | {
    type: "session.resume";
    sessionId: string;
} | {
    type: "task.create";
    data: Partial<TaskRecord>;
} | {
    type: "task.update";
    taskId: string;
    data: Partial<TaskRecord>;
} | {
    type: "shell.run";
    sessionId: string;
    command: string;
};
export declare const WS_EVENTS: {
    readonly SESSION_OUTPUT: "session.output";
    readonly SESSION_STATUS: "session.status";
    readonly SESSION_CREATED: "session.created";
    readonly SESSION_UPDATED: "session.updated";
    readonly SESSION_CLOSED: "session.closed";
    readonly MESSAGE_CREATED: "message.created";
    readonly PROJECT_CREATED: "project.created";
    readonly PROJECT_UPDATED: "project.updated";
    readonly TASK_CREATED: "task.created";
    readonly TASK_UPDATED: "task.updated";
    readonly SYSTEM_HEALTH: "system.health";
    readonly SYSTEM_STATUS: "system.status";
    readonly SYSTEM_ERROR: "system.error";
};
//# sourceMappingURL=events.d.ts.map