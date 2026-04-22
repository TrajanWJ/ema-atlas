import {
  type TextChannel,
  type Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  codeBlock,
} from "discord.js";
import type { ProviderEvent, ToolCall } from "@claudeforge/shared";
import { EMBED_COLORS, TOOL_ICONS } from "@claudeforge/shared";

const MAX_EMBED_DESC = 4000;
const MAX_MESSAGE_LEN = 2000;

/**
 * Renders provider events as Discord embeds/messages in a channel.
 * Uses edit-in-place to reduce message spam — text content is batched
 * into a single message that gets edited as new content arrives.
 */
export class OutputHandler {
  private textBuffer = "";
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  // Edit-in-place state
  private activeMessage: Message | null = null;
  private activeMessageContent = "";

  // Metadata tracking for done envelope
  private startTime = 0;
  private toolCallCount = 0;
  private touchedFiles = new Set<string>();
  private totalCost = 0;

  constructor(private channel: TextChannel) {}

  /** Handle a single provider event */
  async handleEvent(event: ProviderEvent): Promise<void> {
    // Set start time on first event
    if (this.startTime === 0) {
      this.startTime = Date.now();
    }

    switch (event.type) {
      case "text":
        this.textBuffer += event.content;
        this.scheduleFlush();
        break;

      case "tool_use":
        await this.flush();
        this.toolCallCount++;
        if (event.toolCall.filePath) {
          this.touchedFiles.add(event.toolCall.filePath);
        }
        // Finalize active message before tool embed
        await this.finalizeActiveMessage();
        await this.sendToolUse(event.toolCall);
        break;

      case "tool_result":
        await this.sendToolResult(event.toolCall, event.isError);
        break;

      case "done":
        await this.flush();
        await this.finalizeActiveMessage();
        this.totalCost = event.cost ?? 0;
        await this.sendDone();
        break;

      case "error":
        await this.flush();
        await this.finalizeActiveMessage();
        await this.sendError(event.message);
        break;

      case "input_request":
        await this.flush();
        await this.finalizeActiveMessage();
        await this.sendInputRequest(event.question, event.options);
        break;
    }
  }

  /** Flush buffered text to Discord using edit-in-place */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (!this.textBuffer.trim()) return;

    const newText = this.textBuffer;
    this.textBuffer = "";

    const combined = this.activeMessageContent + newText;

    if (combined.length <= MAX_MESSAGE_LEN) {
      // Fits in current message — edit in place
      if (this.activeMessage) {
        this.activeMessageContent = combined;
        await this.activeMessage.edit(combined).catch(() => {});
      } else {
        // First text — send new message
        this.activeMessageContent = combined;
        this.activeMessage = await this.channel.send(combined);
      }
    } else {
      // Would exceed limit — finalize current, start new
      await this.finalizeActiveMessage();
      // Split remaining text into chunks
      const chunks = this.splitText(combined, MAX_MESSAGE_LEN);
      for (let i = 0; i < chunks.length; i++) {
        if (i === chunks.length - 1) {
          // Last chunk becomes the new active message
          this.activeMessageContent = chunks[i];
          this.activeMessage = await this.channel.send(chunks[i]);
        } else {
          await this.channel.send(chunks[i]);
        }
      }
    }
  }

  /** Finalize the active message (no more edits) */
  private async finalizeActiveMessage(): Promise<void> {
    this.activeMessage = null;
    this.activeMessageContent = "";
  }

  /** Reset tracking state for a new turn */
  resetTurn(): void {
    this.activeMessage = null;
    this.activeMessageContent = "";
    this.startTime = 0;
    this.toolCallCount = 0;
    this.touchedFiles.clear();
    this.totalCost = 0;
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.flush(), 500);
  }

  private async sendToolUse(toolCall: ToolCall): Promise<void> {
    const style = TOOL_ICONS[toolCall.kind] ?? TOOL_ICONS.generic;
    const embed = new EmbedBuilder()
      .setColor(parseInt(style.color.replace("#", ""), 16))
      .setDescription(this.formatToolUse(toolCall));

    if (toolCall.filePath) {
      embed.setFooter({ text: toolCall.filePath });
    }

    await this.channel.send({ embeds: [embed] });
  }

  private async sendToolResult(toolCall: ToolCall, isError?: boolean): Promise<void> {
    if (!toolCall.output) return;

    const output = toolCall.output.slice(0, MAX_EMBED_DESC - 20);
    const style = isError ? TOOL_ICONS.error : TOOL_ICONS[toolCall.kind] ?? TOOL_ICONS.generic;

    const embed = new EmbedBuilder()
      .setColor(parseInt(style.color.replace("#", ""), 16))
      .setDescription(codeBlock(this.guessLanguage(toolCall), output));

    if (toolCall.filePath) {
      embed.setFooter({ text: `${toolCall.filePath}${toolCall.lineRange ? ` L${toolCall.lineRange}` : ""}` });
    }

    await this.channel.send({ embeds: [embed] });
  }

  private async sendDone(): Promise<void> {
    const duration = Date.now() - (this.startTime || Date.now());
    const durationStr = duration >= 60_000
      ? `${Math.floor(duration / 60_000)}m ${Math.floor((duration % 60_000) / 1000)}s`
      : `${Math.floor(duration / 1000)}s`;

    const filesStr = this.touchedFiles.size > 0
      ? [...this.touchedFiles].map(f => f.split("/").pop()).join(", ")
      : "none";

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.success)
      .setTitle("Session Complete")
      .setDescription(
        [
          `✅ Done | Cost: $${this.totalCost.toFixed(4)} | Duration: ${durationStr}`,
          `Tool calls: ${this.toolCallCount} | Files touched: ${filesStr}`,
        ].join("\n")
      );

    const msg = await this.channel.send({ embeds: [embed] });
    await msg.react("✅").catch(() => {});
  }

  private async sendError(message: string): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.error)
      .setDescription(`❌ **Error:** ${message.slice(0, MAX_EMBED_DESC - 20)}`);
    await this.channel.send({ embeds: [embed] });
  }

  private async sendInputRequest(question: string, options?: string[]): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.warning)
      .setTitle("🔔 Input Requested")
      .setDescription(question);

    if (options?.length) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      for (const opt of options.slice(0, 5)) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`input_${opt}`)
            .setLabel(opt)
            .setStyle(ButtonStyle.Secondary)
        );
      }
      await this.channel.send({ embeds: [embed], components: [row] });
    } else {
      await this.channel.send({ embeds: [embed] });
    }
  }

  private formatToolUse(toolCall: ToolCall): string {
    const icon = TOOL_ICONS[toolCall.kind]?.emoji ?? "⚙️";
    let desc = `${icon} **${toolCall.title}**`;
    if (toolCall.input && toolCall.kind === "bash") {
      desc += "\n" + codeBlock("bash", toolCall.input.slice(0, 500));
    }
    return desc;
  }

  private guessLanguage(toolCall: ToolCall): string {
    if (toolCall.kind === "bash") return "bash";
    const ext = toolCall.filePath?.split(".").pop();
    const map: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      py: "python",
      rs: "rust",
      go: "go",
      json: "json",
      sql: "sql",
      md: "markdown",
      css: "css",
      html: "html",
    };
    return map[ext ?? ""] ?? "";
  }

  private splitText(text: string, maxLen: number): string[] {
    const chunks: string[] = [];
    while (text.length > maxLen) {
      let splitAt = text.lastIndexOf("\n", maxLen);
      if (splitAt <= 0) splitAt = maxLen;
      chunks.push(text.slice(0, splitAt));
      text = text.slice(splitAt);
    }
    if (text) chunks.push(text);
    return chunks;
  }
}
