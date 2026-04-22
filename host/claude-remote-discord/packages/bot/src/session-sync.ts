import { readdirSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import {
  type Client,
  type Guild,
  ChannelType,
} from "discord.js";

const HOME = process.env.HOME ?? "/home/trajan";
const DEFAULT_DIRECTORY = process.env.DEFAULT_DIRECTORY ?? `${HOME}/Desktop/Coding/Projects`;
const CLAUDE_PROJECTS_DIR = resolve(HOME, ".claude/projects");
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Syncs Claude Code project directories to Discord categories + channels,
 * AND registers them as projects in the DB so message routing works.
 */
export class SessionSync {
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private knownCategories = new Map<string, string>(); // projectName → categoryId

  constructor(
    private client: Client,
    private guildId: string,
    private projects?: any, // ProjectManager (optional for backwards compat)
  ) {}

  /** Run sync once and start the recurring interval. */
  async start(): Promise<void> {
    await this.sync();
    // Also bootstrap projects from existing Discord categories
    await this.bootstrapFromCategories();
    this.syncTimer = setInterval(() => {
      this.sync().catch((err) =>
        console.error("[session-sync] Sync error:", err)
      );
    }, SYNC_INTERVAL_MS);
  }

  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Scan all existing Discord categories and register path-like ones as projects.
   * This handles categories that already existed before the bot started.
   */
  async bootstrapFromCategories(): Promise<void> {
    if (!this.projects) return;

    const guild = await this.client.guilds.fetch(this.guildId);
    if (!guild) return;

    const channels = await guild.channels.fetch();
    let registered = 0;

    for (const [id, channel] of channels) {
      if (!channel || channel.type !== ChannelType.GuildCategory) continue;

      const directory = expandCategoryToPath(channel.name);
      if (!directory) continue;
      if (!existsSync(directory)) {
        console.log(`[session-sync] bootstrap: skipping "${channel.name}" — directory not found: ${directory}`);
        continue;
      }

      try {
        this.projects.ensureProject(directory, id);
        registered++;
        console.log(`[session-sync] bootstrap: registered "${channel.name}" → ${directory} (category=${id})`);
      } catch (err: any) {
        console.error(`[session-sync] bootstrap: failed to register "${channel.name}":`, err.message);
      }
    }

    if (registered > 0) {
      console.log(`[session-sync] bootstrap: registered ${registered} projects from existing categories`);
    }
  }

  /** Discover projects and ensure Discord channels exist. */
  async sync(): Promise<void> {
    const guild = await this.client.guilds.fetch(this.guildId);
    if (!guild) {
      console.error("[session-sync] Guild not found:", this.guildId);
      return;
    }

    const projects = this.discoverProjects();
    if (projects.length === 0) return;

    // Cache existing categories and channels to avoid duplicates
    const channels = await guild.channels.fetch();
    const existingCategories = new Map<string, string>(); // name → id
    const existingTextChannels = new Map<string, Set<string>>(); // categoryId → set of channel names

    for (const [id, channel] of channels) {
      if (!channel) continue;
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

        this.knownCategories.set(project.displayName, categoryId);

        // Register in DB so message routing works
        if (this.projects) {
          try {
            this.projects.ensureProject(project.directory, categoryId);
          } catch (err: any) {
            console.error(`[session-sync] Failed to register project "${project.displayName}":`, err.message);
          }
        }
      } catch (err) {
        console.error(
          `[session-sync] Failed to sync project ${project.displayName}:`,
          err
        );
      }
    }

    if (created > 0) {
      console.log(`[session-sync] Created ${created} channels/categories`);
    }
  }

  /**
   * Discover project directories from ~/.claude/projects/.
   * Directory names are encoded paths where `-` replaces `/`, spaces, and
   * literal dashes. We resolve by trying all split points against the real
   * filesystem to find paths that actually exist.
   */
  private discoverProjects(): Array<{
    directory: string;
    displayName: string;
  }> {
    if (!existsSync(CLAUDE_PROJECTS_DIR)) return [];

    const entries = readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true });
    const projects: Array<{ directory: string; displayName: string }> = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "-" || entry.name.startsWith(".")) continue;

      // Decode slug to real path by resolving against filesystem
      const decoded = this.decodeProjectSlug(entry.name);
      if (!decoded || !existsSync(decoded)) continue;

      // Skip non-project paths
      if (decoded === HOME) continue;
      if (decoded.includes("/.openclaw/")) continue;
      if (decoded === `${HOME}/bin`) continue;
      if (decoded === `${HOME}/Downloads`) continue;

      // Use short display name: last 2 path segments
      const parts = decoded.split("/").filter(Boolean);
      const displayName =
        parts.length >= 2
          ? `${parts[parts.length - 2]}/${parts[parts.length - 1]}`
          : parts[parts.length - 1] ?? decoded;

      projects.push({ directory: decoded, displayName });
    }

    return projects;
  }

  /**
   * Decode a Claude Code project slug back to a real filesystem path.
   * The slug format replaces `/`, ` `, and `-` with `-`, so we must try
   * all interpretations and check which paths actually exist on disk.
   *
   * Strategy: greedy left-to-right. Split on `-`, then try joining segments
   * with `/`, ` `, or `-` and check if the partial path exists as a directory.
   */
  private decodeProjectSlug(slug: string): string | null {
    // Remove leading dash (represents root `/`)
    const stripped = slug.startsWith("-") ? slug.slice(1) : slug;
    const segments = stripped.split("-");
    if (segments.length === 0) return null;

    return this.resolveSegments(segments, "/");
  }

  private resolveSegments(segments: string[], prefix: string): string | null {
    if (segments.length === 0) {
      return existsSync(prefix) ? prefix : null;
    }

    // Try consuming segments greedily: join with /, space, or dash
    // Priority: `/` first (most common), then ` `, then `-`
    const separators = ["/", " ", "-"];

    for (const sep of separators) {
      const candidate = `${prefix}${sep}${segments[0]}`;
      if (existsSync(candidate)) {
        const result = this.resolveSegments(segments.slice(1), candidate);
        if (result) return result;
      }
    }

    // Also try combining current segment with next (multi-word names)
    if (segments.length >= 2) {
      for (const sep of [" ", "-"]) {
        const combined = `${segments[0]}${sep}${segments[1]}`;
        const candidate = `${prefix}/${combined}`;
        if (existsSync(candidate)) {
          const result = this.resolveSegments(segments.slice(2), candidate);
          if (result) return result;
        }
      }
    }

    return null;
  }
}

/**
 * Try to find a project by matching trailing path segments under DEFAULT_DIRECTORY.
 * Given "Projects/pomodoro", tries:
 *   DEFAULT_DIRECTORY/Projects/pomodoro, then DEFAULT_DIRECTORY/pomodoro
 * Returns the first match that exists on disk, or null.
 */
function findUnderDefaultDirectory(pathish: string): string | null {
  const segments = pathish.split("/").filter(Boolean);

  // Try progressively shorter suffixes: all segments, then drop first, etc.
  for (let i = 0; i < segments.length; i++) {
    const suffix = segments.slice(i).join("/");
    const candidate = resolve(DEFAULT_DIRECTORY, suffix);
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Expand a Discord category name that looks like a path to an absolute directory.
 * Handles:
 *   "~/Projects/foo"           → "/home/trajan/Projects/foo"
 *   "~/Desktop/Coding/foo"     → "/home/trajan/Desktop/Coding/foo"
 *   "Projects/foo"             → "/home/trajan/Desktop/Coding/Projects/foo" (DEFAULT_DIRECTORY prefix)
 *   "Coding/foo"               → tries DEFAULT_DIRECTORY parent + "Coding/foo"
 * Returns null if the name doesn't look like a path.
 */
export function expandCategoryToPath(categoryName: string): string | null {
  const name = categoryName.trim();

  // Must contain a / to look like a path
  if (!name.includes("/")) return null;

  // Skip obvious non-path categories
  if (name.toLowerCase().startsWith("text") || name.toLowerCase().startsWith("voice")) return null;

  // ~ expansion
  if (name.startsWith("~/") || name.startsWith("~\\")) {
    const expanded = resolve(HOME, name.slice(2));
    if (existsSync(expanded)) return expanded;

    // Path doesn't exist — try the last segment(s) under DEFAULT_DIRECTORY
    const fallback = findUnderDefaultDirectory(name.slice(2));
    if (fallback) return fallback;

    return expanded; // return the literal expansion as last resort
  }

  // Absolute path
  if (name.startsWith("/")) {
    if (existsSync(name)) return name;

    // Try last segment(s) under DEFAULT_DIRECTORY
    const fallback = findUnderDefaultDirectory(name);
    return fallback ?? name;
  }

  // Relative path — try under DEFAULT_DIRECTORY, then under HOME
  const underDefault = resolve(DEFAULT_DIRECTORY, name);
  if (existsSync(underDefault)) return underDefault;

  const underHome = resolve(HOME, name);
  if (existsSync(underHome)) return underHome;

  // Try treating first segment as child of common parent directories
  // e.g. "Coding/foo" → HOME/Desktop/Coding/foo
  const searchDirs = [HOME, `${HOME}/Desktop`, `${HOME}/Documents`, DEFAULT_DIRECTORY];
  for (const base of searchDirs) {
    const candidate = resolve(base, name);
    if (existsSync(candidate)) return candidate;
  }

  // Last resort: try last segment under DEFAULT_DIRECTORY
  const fallback = findUnderDefaultDirectory(name);
  if (fallback) return fallback;

  return null;
}
