/**
 * Message Interpreter — sits between Discord input and execution.
 *
 * Responsibilities:
 * 1. Classify intent (chat | shell | tool | meta | confirm)
 * 2. Safety gate (block/confirm dangerous patterns)
 * 3. Minimal prompt enhancement (project context, not bloat)
 * 4. Route to the right executor
 */
export type IntentKind = "chat" | "shell" | "tool" | "meta" | "confirm";
export interface ClassifiedIntent {
    kind: IntentKind;
    /** Original message */
    raw: string;
    /** Cleaned/enhanced payload to send to executor */
    payload: string;
    /** For shell: the command. For tool: the tool name. */
    target?: string;
    /** Safety flags */
    safety: SafetyResult;
    /** Context injected into prompt */
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
    /** If warn, this is the confirmation message to show */
    confirmPrompt?: string;
}
export declare function classify(message: string, directory: string, projectName: string): ClassifiedIntent;
export declare function checkSafety(command: string): SafetyResult;
export declare function buildContext(directory: string, projectName: string): PromptContext;
/**
 * Minimally enhance the user's message with project context.
 * Rules:
 * - Don't bloat. Keep additions under ~200 tokens.
 * - Only add what Claude Code wouldn't know from the filesystem.
 * - Never rewrite the user's intent.
 * - First message in a session gets more context; subsequent messages get less.
 */
export declare function enhancePrompt(message: string, context: PromptContext): string;
export interface ExecResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    truncated: boolean;
}
export declare function executeShell(command: string, directory: string, timeoutMs?: number): ExecResult;
//# sourceMappingURL=interpreter.d.ts.map