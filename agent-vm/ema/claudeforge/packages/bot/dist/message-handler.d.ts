import type { Message, TextChannel } from "discord.js";
import type { ClassifiedIntent, ExecResult } from "@claudeforge/shared";
export interface InterpreterFns {
    classify: (message: string, directory: string, projectName: string) => ClassifiedIntent;
    executeShell: (command: string, directory: string, timeoutMs?: number) => ExecResult;
}
/**
 * Routes non-command messages through the interpreter layer.
 *
 * Flow: Discord message → classify → gate → execute
 *   chat  → enhance prompt → Claude Code session
 *   shell → safety check → exec in project dir → post output
 *   tool  → exec built-in command → post output
 *   meta  → session lifecycle command
 *   confirm → awaiting user confirmation for dangerous ops
 */
export declare class MessageHandler {
    private sessions;
    private projects;
    private allowedUsers;
    private interpreter;
    private outputHandlers;
    private pendingConfirms;
    constructor(sessions: any, // SessionManager
    projects: any, // ProjectManager
    allowedUsers: Set<string>, interpreter: InterpreterFns);
    registerChannel(channelId: string, channel: TextChannel): void;
    handleMessage(message: Message): Promise<void>;
    private executeIntent;
    private postExecResult;
    private handleMeta;
    private routeToSession;
    /**
     * One-shot Claude CLI invocation for non-project channels.
     * Spawns `claude --print`, pipes the message, streams output back.
     * No session tracking — fire and forget.
     */
    private globalChat;
    /** Post text to a channel, splitting into multiple messages if needed. */
    private postChunked;
}
//# sourceMappingURL=message-handler.d.ts.map