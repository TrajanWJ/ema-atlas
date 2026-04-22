import type { ProviderEvent } from "@claudeforge/shared";
import type { AgentProvider, StartSessionOptions } from "./types.js";
/**
 * Claude Code provider — spawns `claude` CLI in tmux sessions.
 * Uses --print mode with JSON output for structured streaming.
 */
export declare class ClaudeProvider implements AgentProvider {
    readonly name = "claude";
    private sessions;
    startSession(options: StartSessionOptions): AsyncGenerator<ProviderEvent>;
    sendMessage(sessionId: string, message: string): AsyncGenerator<ProviderEvent>;
    abort(sessionId: string): void;
    kill(sessionId: string): void;
    isAlive(sessionId: string): boolean;
    private mapEvent;
    private mapToolCall;
    private classifyTool;
    private toolTitle;
}
//# sourceMappingURL=claude-provider.d.ts.map