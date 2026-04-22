import {
  type Client,
  type TextChannel,
  type Message,
  EmbedBuilder,
} from "discord.js";
import { EMBED_COLORS } from "@claudeforge/shared";

const REFRESH_INTERVAL_MS = 30_000;

/**
 * Auto-updating dashboard pinned in a designated channel.
 * Shows active sessions, recent tasks, and system health.
 */
export class Dashboard {
  private interval: ReturnType<typeof setInterval> | null = null;
  private dashboardMessage: Message | null = null;

  constructor(
    private client: Client,
    private channelId: string,
    private sessions: any, // SessionManager
    private projects: any, // ProjectManager
    private db: any, // Persistence
  ) {}

  async start(): Promise<void> {
    const channel = await this.client.channels.fetch(this.channelId).catch(() => null);
    if (!channel || !("send" in channel)) {
      console.warn("[dashboard] Channel not found or not text-based:", this.channelId);
      return;
    }

    const textChannel = channel as TextChannel;

    // Look for existing pinned dashboard message
    const pinned = await textChannel.messages.fetchPinned().catch(() => null);
    if (pinned) {
      this.dashboardMessage = pinned.find(
        (m) => m.author.id === this.client.user?.id && m.embeds[0]?.title === "ClaudeForge Dashboard"
      ) ?? null;
    }

    // Create initial message if not found
    if (!this.dashboardMessage) {
      const embed = this.buildEmbed();
      this.dashboardMessage = await textChannel.send({ embeds: [embed] });
      await this.dashboardMessage.pin().catch(() => {});
    } else {
      await this.dashboardMessage.edit({ embeds: [this.buildEmbed()] }).catch(() => {});
    }

    // Auto-refresh
    this.interval = setInterval(() => this.refresh(), REFRESH_INTERVAL_MS);
    console.log(`[dashboard] Started in #${textChannel.name}, refreshing every ${REFRESH_INTERVAL_MS / 1000}s`);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async refresh(): Promise<void> {
    if (!this.dashboardMessage) return;
    await this.dashboardMessage.edit({ embeds: [this.buildEmbed()] }).catch((err) => {
      console.error("[dashboard] Failed to refresh:", err);
    });
  }

  private buildEmbed(): EmbedBuilder {
    const activeSessions = this.sessions.getActive();
    const allSessions = this.sessions.list();
    const projectList = this.projects.list();
    const tasks = this.db.getTasks();

    const backlog = tasks.filter((t: any) => t.status === "backlog").length;
    const inProgress = tasks.filter((t: any) => t.status === "in_progress").length;
    const done = tasks.filter((t: any) => t.status === "done").length;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.primary)
      .setTitle("ClaudeForge Dashboard")
      .setDescription(`${projectList.length} projects · ${allSessions.length} sessions · ${activeSessions.length} active`)
      .setTimestamp();

    // Active sessions
    if (activeSessions.length > 0) {
      const lines = activeSessions.slice(0, 10).map((s: any) => {
        const cost = s.totalCost > 0 ? ` · $${s.totalCost.toFixed(4)}` : "";
        return `\u2022 **${s.name}** (${s.provider}) \u2014 ${s.projectName}${cost}`;
      });
      embed.addFields({ name: `Active Sessions (${activeSessions.length})`, value: lines.join("\n") });
    } else {
      embed.addFields({ name: "Active Sessions", value: "None" });
    }

    // Tasks summary
    embed.addFields({
      name: "Tasks",
      value: `\u{1F4CB} ${backlog} backlog \u00B7 \u{1F528} ${inProgress} in progress \u00B7 \u2705 ${done} done`,
      inline: false,
    });

    // Recent tasks (last 5 in-progress or recently done)
    const recentTasks = tasks
      .filter((t: any) => t.status === "in_progress" || t.status === "review")
      .slice(0, 5);

    if (recentTasks.length > 0) {
      const taskLines = recentTasks.map((t: any) => {
        const icon = t.status === "in_progress" ? "\u{1F7E1}" : "\u{1F7E3}";
        const agent = t.agent ? ` (${t.agent})` : "";
        return `${icon} ${t.title}${agent}`;
      });
      embed.addFields({ name: "Active Tasks", value: taskLines.join("\n") });
    }

    embed.setFooter({ text: `Auto-refreshes every ${REFRESH_INTERVAL_MS / 1000}s` });

    return embed;
  }
}
