import { EmbedBuilder, type Client, type TextChannel } from "discord.js";
import { EMBED_COLORS } from "@claudeforge/shared";

type NotificationLevel = "info" | "warning" | "error" | "critical";

interface NotificationOptions {
  title: string;
  message: string;
  level: NotificationLevel;
  sessionName?: string;
  projectName?: string;
}

const LEVEL_COLORS: Record<NotificationLevel, number> = {
  info: EMBED_COLORS.info,
  warning: EMBED_COLORS.warning,
  error: EMBED_COLORS.error,
  critical: EMBED_COLORS.error,
};

const LEVEL_ICONS: Record<NotificationLevel, string> = {
  info: "INFO",
  warning: "WARN",
  error: "ERROR",
  critical: "CRITICAL",
};

/**
 * Posts notifications to a designated Discord channel.
 * Channel ID is configured via NOTIFICATION_CHANNEL_ID env var.
 */
export class NotificationService {
  private channelId: string | null;
  private channel: TextChannel | null = null;

  constructor(private client: Client) {
    this.channelId = process.env.NOTIFICATION_CHANNEL_ID ?? null;
    if (!this.channelId) {
      console.log("[notify] NOTIFICATION_CHANNEL_ID not set — notifications disabled");
    }
  }

  private async resolveChannel(): Promise<TextChannel | null> {
    if (this.channel) return this.channel;
    if (!this.channelId) return null;

    try {
      const ch = await this.client.channels.fetch(this.channelId);
      if (ch?.isTextBased()) {
        this.channel = ch as TextChannel;
        return this.channel;
      }
    } catch (err) {
      console.error("[notify] Failed to resolve notification channel:", err);
    }
    return null;
  }

  async send(opts: NotificationOptions): Promise<void> {
    const channel = await this.resolveChannel();
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(LEVEL_COLORS[opts.level])
      .setTitle(`[${LEVEL_ICONS[opts.level]}] ${opts.title}`)
      .setDescription(opts.message)
      .setTimestamp();

    if (opts.sessionName) {
      embed.addFields({ name: "Session", value: opts.sessionName, inline: true });
    }
    if (opts.projectName) {
      embed.addFields({ name: "Project", value: opts.projectName, inline: true });
    }

    try {
      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("[notify] Failed to send notification:", err);
    }
  }

  /** Session crashed or errored */
  async sessionError(sessionName: string, error: string, projectName?: string): Promise<void> {
    await this.send({
      title: "Session Error",
      message: `Session **${sessionName}** encountered an error:\n\`\`\`\n${error.slice(0, 500)}\n\`\`\``,
      level: "error",
      sessionName,
      projectName,
    });
  }

  /** Session stopped due to idle timeout */
  async sessionIdleTimeout(sessionName: string, projectName?: string): Promise<void> {
    await this.send({
      title: "Session Idle Timeout",
      message: `Session **${sessionName}** was stopped after 30 minutes of inactivity.`,
      level: "warning",
      sessionName,
      projectName,
    });
  }

  /** Session cost exceeded threshold */
  async highCostAlert(sessionName: string, cost: number, projectName?: string): Promise<void> {
    await this.send({
      title: "High Cost Alert",
      message: `Session **${sessionName}** has accumulated **$${cost.toFixed(2)}** in costs.`,
      level: "warning",
      sessionName,
      projectName,
    });
  }

  /** Provider became unavailable */
  async providerUnavailable(provider: string, error: string): Promise<void> {
    await this.send({
      title: "Provider Unavailable",
      message: `Provider **${provider}** is unavailable:\n${error.slice(0, 500)}`,
      level: "critical",
    });
  }
}
