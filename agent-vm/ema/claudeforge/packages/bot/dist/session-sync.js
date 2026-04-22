import { readdirSync, existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { ChannelType, } from "discord.js";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
const CLAUDE_PROJECTS_DIR = resolve(process.env.HOME ?? "/home/trajan", ".claude/projects");
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_SESSIONS_PER_PROJECT = 50; // Discord category limit is 50 channels
/**
 * Syncs Claude Code project directories to Discord categories + channels.
 * - Each project in ~/.claude/projects/ → Discord category
 * - Each session .jsonl within a project → text channel under that category
 */
export class SessionSync {
    client;
    guildId;
    syncTimer = null;
    knownCategories = new Map(); // slug → categoryId
    constructor(client, guildId) {
        this.client = client;
        this.guildId = guildId;
    }
    async start() {
        await this.sync();
        this.syncTimer = setInterval(() => {
            this.sync().catch((err) => console.error("[session-sync] Sync error:", err));
        }, SYNC_INTERVAL_MS);
    }
    stop() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }
    async sync() {
        const guild = await this.client.guilds.fetch(this.guildId);
        if (!guild) {
            console.error("[session-sync] Guild not found:", this.guildId);
            return;
        }
        const projects = this.discoverProjects();
        if (projects.length === 0)
            return;
        // Cache existing categories and channels to avoid duplicates
        const channels = await guild.channels.fetch();
        const existingCategories = new Map(); // name → id
        const existingTextChannels = new Map(); // categoryId → set of channel names
        for (const [id, channel] of channels) {
            if (!channel)
                continue;
            if (channel.type === ChannelType.GuildCategory) {
                existingCategories.set(channel.name, id);
            }
            if (channel.type === ChannelType.GuildText && channel.parentId) {
                const set = existingTextChannels.get(channel.parentId) ?? new Set();
                set.add(channel.name);
                existingTextChannels.set(channel.parentId, set);
            }
        }
        let created = 0;
        for (const project of projects) {
            try {
                const categoryName = project.displayName.slice(0, 100);
                let categoryId = existingCategories.get(categoryName);
                if (!categoryId) {
                    const category = await guild.channels.create({
                        name: categoryName,
                        type: ChannelType.GuildCategory,
                    });
                    categoryId = category.id;
                    existingCategories.set(categoryName, categoryId);
                    created++;
                }
                this.knownCategories.set(project.slug, categoryId);
                // Ensure #main channel exists
                const channelNames = existingTextChannels.get(categoryId) ?? new Set();
                if (!channelNames.has("main")) {
                    await guild.channels.create({
                        name: "main",
                        type: ChannelType.GuildText,
                        parent: categoryId,
                        topic: `Project: ${project.directory}`,
                    });
                    channelNames.add("main");
                    existingTextChannels.set(categoryId, channelNames);
                    created++;
                }
                // Discover sessions and create channels for each
                const sessions = await this.discoverSessions(project.slug);
                // Cap at limit minus 1 (for #main)
                const maxNew = MAX_SESSIONS_PER_PROJECT - 1 - channelNames.size;
                const toCreate = sessions.filter((s) => !channelNames.has(s.channelName)).slice(0, Math.max(0, maxNew));
                for (const session of toCreate) {
                    try {
                        await guild.channels.create({
                            name: session.channelName,
                            type: ChannelType.GuildText,
                            parent: categoryId,
                            topic: `Session ${session.id.slice(0, 8)} | ${session.timestamp} | ${session.topic.slice(0, 200)}`,
                        });
                        channelNames.add(session.channelName);
                        existingTextChannels.set(categoryId, channelNames);
                        created++;
                    }
                    catch (err) {
                        console.error(`[session-sync] Failed to create channel ${session.channelName}:`, err);
                    }
                }
            }
            catch (err) {
                console.error(`[session-sync] Failed to sync project ${project.displayName}:`, err);
            }
        }
        if (created > 0) {
            console.log(`[session-sync] Created ${created} channels/categories`);
        }
    }
    /**
     * Discover session .jsonl files within a project directory.
     * Returns sessions sorted by most recent first.
     */
    async discoverSessions(slug) {
        const projectDir = join(CLAUDE_PROJECTS_DIR, slug);
        if (!existsSync(projectDir))
            return [];
        const entries = readdirSync(projectDir);
        const sessions = [];
        for (const entry of entries) {
            if (!entry.endsWith(".jsonl"))
                continue;
            const sessionId = entry.replace(".jsonl", "");
            // Skip non-UUID filenames
            if (!/^[0-9a-f]{8}-/.test(sessionId))
                continue;
            const filePath = join(projectDir, entry);
            const mtime = statSync(filePath).mtimeMs;
            const { topic, timestamp } = await this.extractSessionMeta(filePath);
            const channelName = this.makeChannelName(sessionId, topic, timestamp);
            sessions.push({
                id: sessionId,
                channelName,
                topic,
                timestamp,
                mtime,
            });
        }
        // Sort by most recent first
        sessions.sort((a, b) => b.mtime - a.mtime);
        return sessions.slice(0, MAX_SESSIONS_PER_PROJECT - 1);
    }
    /**
     * Extract the first user message and timestamp from a session JSONL.
     * Reads only the first ~50 lines to stay fast.
     */
    async extractSessionMeta(filePath) {
        let topic = "";
        let timestamp = "";
        try {
            const rl = createInterface({
                input: createReadStream(filePath, { encoding: "utf-8" }),
                crlfDelay: Infinity,
            });
            let lineCount = 0;
            for await (const line of rl) {
                if (++lineCount > 50)
                    break;
                try {
                    const d = JSON.parse(line);
                    if (!timestamp && d.timestamp) {
                        timestamp = d.timestamp.slice(0, 10); // YYYY-MM-DD
                    }
                    if (!topic && d.type === "user") {
                        const msg = d.message ?? d.content;
                        if (typeof msg === "string" && msg.length > 3) {
                            topic = msg;
                        }
                        else if (msg && typeof msg === "object") {
                            const content = msg.content;
                            if (typeof content === "string" && content.length > 3) {
                                topic = content;
                            }
                        }
                    }
                }
                catch {
                    // skip malformed lines
                }
                if (topic && timestamp)
                    break;
            }
            rl.close();
        }
        catch {
            // file read error
        }
        return { topic: topic.slice(0, 300), timestamp: timestamp || "unknown" };
    }
    /**
     * Generate a Discord-safe channel name from session metadata.
     * Discord channel names: lowercase, max 100 chars, only alphanumeric + dash + underscore.
     * Format: {date}-{short-topic-or-uuid}
     */
    makeChannelName(sessionId, topic, timestamp) {
        const date = timestamp !== "unknown" ? timestamp : "";
        const shortId = sessionId.slice(0, 8);
        if (!topic || topic.length < 5) {
            return date ? `${date}-${shortId}` : shortId;
        }
        // Extract meaningful words from topic, skip markdown/code
        const cleaned = topic
            .replace(/^#+\s*/gm, "") // strip markdown headers
            .replace(/```[\s\S]*?```/g, "") // strip code blocks
            .replace(/`[^`]+`/g, "") // strip inline code
            .replace(/\*\*([^*]+)\*\*/g, "$1") // strip bold
            .replace(/---+/g, "") // strip horizontal rules
            .replace(/##?\s*(Task|Problem|Reflexion|Context):?\s*/gi, "") // strip common prefixes
            .replace(/[^a-zA-Z0-9\s-]/g, " ") // keep only alphanumeric + spaces + dashes
            .replace(/\s+/g, " ")
            .trim();
        // Take first ~6 meaningful words
        const words = cleaned
            .split(" ")
            .filter((w) => w.length > 1)
            .slice(0, 6);
        const slug = words.join("-").toLowerCase().slice(0, 80) || shortId;
        const name = date ? `${date}-${slug}` : slug;
        // Ensure uniqueness with short session ID suffix
        return `${name}-${shortId}`.slice(0, 100);
    }
    /**
     * Discover project directories from ~/.claude/projects/.
     */
    discoverProjects() {
        if (!existsSync(CLAUDE_PROJECTS_DIR))
            return [];
        const entries = readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true });
        const projects = [];
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            if (entry.name === "-" || entry.name.startsWith("."))
                continue;
            const decoded = this.decodeProjectSlug(entry.name);
            if (!decoded || !existsSync(decoded))
                continue;
            // Skip non-project paths
            if (decoded === process.env.HOME)
                continue;
            if (decoded.includes("/.openclaw/"))
                continue;
            if (decoded === `${process.env.HOME}/bin`)
                continue;
            if (decoded === `${process.env.HOME}/Downloads`)
                continue;
            // Use short display name: last 2 path segments
            const parts = decoded.split("/").filter(Boolean);
            const displayName = parts.length >= 2
                ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}`
                : parts[parts.length - 1] ?? decoded;
            projects.push({ slug: entry.name, directory: decoded, displayName });
        }
        return projects;
    }
    decodeProjectSlug(slug) {
        const stripped = slug.startsWith("-") ? slug.slice(1) : slug;
        const segments = stripped.split("-");
        if (segments.length === 0)
            return null;
        return this.resolveSegments(segments, "/");
    }
    resolveSegments(segments, prefix) {
        if (segments.length === 0) {
            return existsSync(prefix) ? prefix : null;
        }
        const separators = ["/", " ", "-"];
        for (const sep of separators) {
            const candidate = `${prefix}${sep}${segments[0]}`;
            if (existsSync(candidate)) {
                const result = this.resolveSegments(segments.slice(1), candidate);
                if (result)
                    return result;
            }
        }
        if (segments.length >= 2) {
            for (const sep of [" ", "-"]) {
                const combined = `${segments[0]}${sep}${segments[1]}`;
                const candidate = `${prefix}/${combined}`;
                if (existsSync(candidate)) {
                    const result = this.resolveSegments(segments.slice(2), candidate);
                    if (result)
                        return result;
                }
            }
        }
        return null;
    }
}
//# sourceMappingURL=session-sync.js.map