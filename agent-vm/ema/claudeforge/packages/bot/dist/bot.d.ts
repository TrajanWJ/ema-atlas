import { type InterpreterFns } from "./message-handler.js";
export interface BotConfig {
    token: string;
    clientId: string;
    guildId: string;
    allowedUsers: string[];
}
export declare class ClaudeForgeBot {
    private client;
    private messageHandler;
    private ctx;
    constructor(config: BotConfig, sessions: any, projects: any, db: any, interpreter?: InterpreterFns);
    private registerCommands;
    /**
     * Spawns `claude --print` with a prompt, streams output back to the interaction.
     * Reuses the same pattern as globalChat in message-handler.ts.
     */
    private handleClaudeCommand;
    private handleInteraction;
}
//# sourceMappingURL=bot.d.ts.map