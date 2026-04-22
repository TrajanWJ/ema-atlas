import type { ProviderEvent } from "@claudeforge/shared";
import type { AgentProvider, StartSessionOptions } from "./types.js";
/**
 * Codex provider — spawns `codex` CLI in tmux sessions.
 * Uses exec mode for non-interactive use.
 */
export declare class CodexProvider implements AgentProvider {
    readonly name = "codex";
    private sessions;
    startSession(options: StartSessionOptions): AsyncGenerator<ProviderEvent>;
    sendMessage(sessionId: string, message: string): AsyncGenerator<ProviderEvent>;
    abort(sessionId: string): void;
    kill(sessionId: string): void;
    isAlive(sessionId: string): boolean;
}
//# sourceMappingURL=codex-provider.d.ts.map