import { type Client } from "discord.js";
/**
 * Syncs Claude Code project directories to Discord categories + channels.
 * - Each project in ~/.claude/projects/ → Discord category
 * - Each session .jsonl within a project → text channel under that category
 */
export declare class SessionSync {
    private client;
    private guildId;
    private syncTimer;
    private knownCategories;
    constructor(client: Client, guildId: string);
    start(): Promise<void>;
    stop(): void;
    sync(): Promise<void>;
    /**
     * Discover session .jsonl files within a project directory.
     * Returns sessions sorted by most recent first.
     */
    private discoverSessions;
    /**
     * Extract the first user message and timestamp from a session JSONL.
     * Reads only the first ~50 lines to stay fast.
     */
    private extractSessionMeta;
    /**
     * Generate a Discord-safe channel name from session metadata.
     * Discord channel names: lowercase, max 100 chars, only alphanumeric + dash + underscore.
     * Format: {date}-{short-topic-or-uuid}
     */
    private makeChannelName;
    /**
     * Discover project directories from ~/.claude/projects/.
     */
    private discoverProjects;
    private decodeProjectSlug;
    private resolveSegments;
}
//# sourceMappingURL=session-sync.d.ts.map