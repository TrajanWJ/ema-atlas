import {
  type Client,
  type TextChannel,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import { EMBED_COLORS } from "@claudeforge/shared";
import type { SessionRecord } from "@claudeforge/shared";

/**
 * Auto-creates Discord channels for sessions and archives them on close.
 * Listens to SessionManager events so channels are created regardless of
 * whether the session originated from Discord, REST API, or web UI.
 */
export class SessionChannelSync {
  constructor(
    private client: Client,
    private guildId: string,
    private sessions: any, // SessionManager (EventEmitter)
    private projects: any, // ProjectManager
    private db: any, // Persistence
  ) {
    // Listen for session creation events
    this.sessions.on?.("session.created", (session: SessionRecord) => {
      this.ensureChannelForSession(session).catch((err: unknown) =>
        console.error(`[session-channel-sync] Failed to create channel for session ${session.id}:`, err)
      );
    });

    // Listen for session close events
    this.sessions.on?.("session.closed", (sessionId: string) => {
      this.archiveChannelForSession(sessionId).catch((err: unknown) =>
        console.error(`[session-channel-sync] Failed to archive channel for session ${sessionId}:`, err)
      );
    });

    // Forward assistant messages to Discord for sessions created outside Discord.
    // The MessageHandler's output handler handles streaming for Discord-originated
    // sessions — this catches messages from REST API / web UI sessions.
    this.sessions.on?.("message.created", (message: { role: string; sessionId: string; content: string; toolCall?: unknown }) => {
      if (message.role !== "assistant") return;
      if (message.toolCall) return; // skip tool call noise

      this.forwardMessageToChannel(message.sessionId, message.content).catch((err: unknown) =>
        console.error(`[session-channel-sync] Forward error for ${message.sessionId}:`, err)
      );
    });
  }

  /** On bot startup, create channels for any sessions missing them. */
  async boot(): Promise<void> {
    const allSessions: SessionRecord[] = this.db.getSessions();
    let synced = 0;
    for (const session of allSessions) {
      if (!session.channelId && session.status !== "stopped") {
        await this.ensureChannelForSession(session);
        synced++;
      }
    }
    if (synced > 0) {
      console.log(`[session-channel-sync] Boot sync: created channels for ${synced} sessions`);
    }
    console.log(`[session-channel-sync] Boot sync complete — checked ${allSessions.length} sessions`);
  }

  /** Create a Discord channel for a session under its project's category. */
  async ensureChannelForSession(session: SessionRecord): Promise<void> {
    // Skip if session already has a channel
    if (session.channelId) return;

    // Look up the project to find the Discord category
    const project = this.db.getProject(session.projectId);
    if (!project?.categoryId) {
      console.log(`[session-channel-sync] No category for project ${session.projectId}, skipping channel creation`);
      return;
    }

    const guild = await this.client.guilds.fetch(this.guildId);

    const channelName = this.formatChannelName(session.name, session.provider);

    // Check if a channel with this name already exists under the category
    const existing = guild.channels.cache.find(
      (ch) => ch.parentId === project.categoryId && ch.name === channelName
    );
    if (existing) {
      // Bind the existing channel instead of creating a duplicate
      this.sessions.bindChannel(session.id, existing.id);
      console.log(`[session-channel-sync] Bound existing channel #${channelName} to session ${session.id}`);
      return;
    }

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: project.categoryId,
      topic: `Session: ${session.name} | Provider: ${session.provider} | Dir: ${session.directory}`,
    });

    // Bind channel to session in DB
    this.sessions.bindChannel(session.id, channel.id);

    // Post welcome embed
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.primary)
          .setTitle(`Session: ${session.name}`)
          .setDescription(
            `**Provider:** ${session.provider}\n**Directory:** \`${session.directory}\`\n**Status:** ${session.status}`
          )
          .setFooter({ text: `Session ID: ${session.id}` })
          .setTimestamp(),
      ],
    });

    console.log(`[session-channel-sync] Created channel #${channelName} for session ${session.id}`);
  }

  /** Archive a session's Discord channel (rename, post notice). */
  async archiveChannelForSession(sessionId: string): Promise<void> {
    const session: SessionRecord | undefined = this.db.getSession(sessionId);
    if (!session?.channelId) return;

    try {
      const guild = await this.client.guilds.fetch(this.guildId);
      const channel = await guild.channels.fetch(session.channelId);

      if (channel && channel.isTextBased()) {
        const textChannel = channel as TextChannel;
        await textChannel.setName(`archived-${textChannel.name}`.slice(0, 100));
        await textChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x8892B0)
              .setTitle("Session Archived")
              .setDescription("This session has been stopped. Use `/session resume` to restart.")
              .setTimestamp(),
          ],
        });
      }
    } catch (err) {
      console.error(`[session-channel-sync] Failed to archive channel ${session.channelId}:`, err);
    }
  }

  /** Forward an assistant message to its session's Discord channel. */
  private async forwardMessageToChannel(sessionId: string, content: string): Promise<void> {
    const session: SessionRecord | undefined = this.db.getSession(sessionId);
    if (!session?.channelId) return;

    try {
      const channel = await this.client.channels.fetch(session.channelId);
      if (!channel?.isTextBased()) return;

      const truncated = content.length > 1900
        ? content.slice(0, 1900) + "\n... (truncated)"
        : content;
      await (channel as TextChannel).send(truncated);
    } catch (err) {
      console.error(`[session-channel-sync] Failed to forward to channel ${session.channelId}:`, err);
    }
  }

  /** Format a session name into a valid Discord channel name. */
  private formatChannelName(name: string, provider: string): string {
    const prefix = provider === "codex" ? "cx" : "cc";
    return `${prefix}-${name}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);
  }
}
