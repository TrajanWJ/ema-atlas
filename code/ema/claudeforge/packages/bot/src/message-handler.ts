import { spawn } from "node:child_process";
import type { Message, TextChannel, MessageReaction, User } from "discord.js";
import type { ClassifiedIntent, ExecResult } from "@claudeforge/shared";
import { OutputHandler } from "./output-handler.js";

const GLOBAL_DIR = process.env.HOME ?? "/home/trajan";
const GLOBAL_PROJECT_NAME = "global";
const MAX_MESSAGE_LEN = 1900;

// Interpreter functions — injected at construction to avoid cross-package imports
export interface InterpreterFns {
  classify: (message: string, directory: string, projectName: string) => ClassifiedIntent;
  executeShell: (command: string, directory: string, timeoutMs?: number) => ExecResult;
}

/**
 * Routes non-command messages through the interpreter layer.
 *
 * Flow: Discord message → classify → gate → execute
 *   chat  → enhance prompt → Claude Code session
 *   shell → safety check → exec in project dir → post output
 *   tool  → exec built-in command → post output
 *   meta  → session lifecycle command
 *   confirm → awaiting user confirmation for dangerous ops
 */
export class MessageHandler {
  private outputHandlers = new Map<string, OutputHandler>();
  private pendingConfirms = new Map<string, { intent: ClassifiedIntent; directory: string; expires: number }>();

  constructor(
    private sessions: any, // SessionManager
    private projects: any, // ProjectManager
    private allowedUsers: Set<string>,
    private interpreter: InterpreterFns,
  ) {
    // Listen for session output events and route to Discord
    this.sessions.on?.("session.output", (sessionId: string, event: any) => {
      const session = this.sessions.get(sessionId);
      if (!session?.channelId) return;

      const handler = this.outputHandlers.get(session.channelId);
      if (handler) {
        handler.handleEvent(event).catch((err: any) =>
          console.error(`[bot] Output error for ${sessionId}:`, err)
        );
      }
    });
  }

  registerChannel(channelId: string, channel: TextChannel): void {
    this.outputHandlers.set(channelId, new OutputHandler(channel));
  }

  async handleMessage(message: Message): Promise<void> {
    if (message.author.bot) return;
    if (!this.allowedUsers.has(message.author.id)) return;

    // Find the project for this channel (fall back to global dispatch)
    const channel = message.channel as TextChannel;
    const project = channel.parentId
      ? this.projects.getByCategory(channel.parentId)
      : null;
    const isProjectChannel = !!project;

    const directory = project?.directory ?? GLOBAL_DIR;
    const projectName = project?.name ?? GLOBAL_PROJECT_NAME;

    // Classify the message
    const intent = this.interpreter.classify(message.content, directory, projectName);

    console.log(`[interpreter] ${intent.kind} | safety=${intent.safety.level} | "${intent.raw.slice(0, 60)}"`);

    // Safety gate
    if (intent.safety.level === "block") {
      await message.reply(`🛑 **Blocked**\n${intent.safety.reason}`);
      return;
    }

    if (intent.safety.level === "warn") {
      // Post confirmation prompt, store pending
      const reply = await message.reply(intent.safety.confirmPrompt!);
      await reply.react("✅");
      await reply.react("❌");

      const key = reply.id;
      this.pendingConfirms.set(key, {
        intent,
        directory,
        expires: Date.now() + 60_000, // 1 minute timeout
      });

      // Listen for reaction
      const filter = (reaction: MessageReaction, user: User) =>
        ["✅", "❌"].includes(reaction.emoji.name ?? "") && this.allowedUsers.has(user.id);

      try {
        const collected = await reply.awaitReactions({ filter, max: 1, time: 60_000, errors: ["time"] });
        const reaction = collected.first();
        this.pendingConfirms.delete(key);

        if (reaction?.emoji.name === "✅") {
          await this.executeIntent(intent, directory, message, isProjectChannel);
        } else {
          await reply.edit(`${intent.safety.confirmPrompt}\n\n❌ **Cancelled.**`);
        }
      } catch {
        this.pendingConfirms.delete(key);
        await reply.edit(`${intent.safety.confirmPrompt}\n\n⏰ **Timed out — cancelled.**`);
      }
      return;
    }

    // Safe — execute directly
    await this.executeIntent(intent, directory, message, isProjectChannel);
  }

  private async executeIntent(
    intent: ClassifiedIntent,
    directory: string,
    message: Message,
    isProjectChannel: boolean = true,
  ): Promise<void> {
    switch (intent.kind) {
      case "shell":
      case "tool": {
        // Execute command directly
        await message.react("⚡");
        const result = this.interpreter.executeShell(intent.payload, directory);
        await this.postExecResult(message, intent, result);
        break;
      }

      case "meta": {
        await this.handleMeta(intent, message);
        break;
      }

      case "chat": {
        if (isProjectChannel) {
          await this.routeToSession(intent, directory, message);
        } else {
          await this.globalChat(intent, message, directory);
        }
        break;
      }
    }
  }

  private async postExecResult(message: Message, intent: ClassifiedIntent, result: ExecResult): Promise<void> {
    const output = result.stderr || result.stdout || "(no output)";
    const icon = result.exitCode === 0 ? "✅" : "❌";
    const cmd = intent.target ?? intent.payload.slice(0, 60);

    let reply = `${icon} \`${cmd}\``;
    if (output.length > 1900) {
      reply += `\n\`\`\`\n${output.slice(0, 1900)}\n...(truncated)\n\`\`\``;
    } else {
      reply += `\n\`\`\`\n${output}\n\`\`\``;
    }

    await message.reply(reply);
  }

  private async handleMeta(intent: ClassifiedIntent, message: Message): Promise<void> {
    const session = this.sessions.getByChannel(message.channelId);

    switch (intent.payload) {
      case "stop":
      case "abort":
        if (session) {
          this.sessions.abortSession(session.id);
          await message.reply("⏹️ Aborted.");
        } else {
          await message.reply("No active session.");
        }
        break;

      case "status": {
        if (session) {
          const s = session;
          await message.reply(
            `📊 **Session:** ${s.name}\n` +
            `**Status:** ${s.status}\n` +
            `**Provider:** ${s.provider}\n` +
            `**Messages:** ${s.messageCount ?? 0}\n` +
            `**Cost:** $${(s.totalCost ?? 0).toFixed(4)}\n` +
            `**tmux:** \`${s.tmuxName}\``
          );
        } else {
          await message.reply("No session in this channel.");
        }
        break;
      }

      case "attach":
        if (session) {
          await message.reply(`\`\`\`\ntmux attach -t ${session.tmuxName}\n\`\`\``);
        } else {
          await message.reply("No session to attach to.");
        }
        break;

      case "context": {
        if (intent.context) {
          const ctx = intent.context;
          const parts = [`**Project:** ${ctx.projectName}`, `**Dir:** \`${ctx.directory}\``];
          if (ctx.gitBranch) parts.push(`**Branch:** ${ctx.gitBranch}`);
          if (ctx.techStack?.length) parts.push(`**Stack:** ${ctx.techStack.join(", ")}`);
          if (ctx.recentFiles?.length) parts.push(`**Recent:** ${ctx.recentFiles.slice(0, 5).join(", ")}`);
          await message.reply(parts.join("\n"));
        }
        break;
      }

      case "clear":
        if (session) {
          this.sessions.stopSession(session.id);
          await message.reply("🧹 Session cleared. Next message starts fresh.");
        }
        break;

      default:
        await message.reply(`Unknown meta command: ${intent.payload}`);
    }
  }

  private async routeToSession(intent: ClassifiedIntent, directory: string, message: Message): Promise<void> {
    let session = this.sessions.getByChannel(message.channelId);

    // Auto-create session if none exists
    if (!session) {
      const channel = message.channel as TextChannel;
      const project = this.projects.getByCategory(channel.parentId!);
      if (!project) return;

      try {
        console.log(`[bot] Auto-spawning session for ${project.name}`);
        session = await this.sessions.createSession({
          projectId: project.id,
          directory: project.directory,
          projectName: project.name,
          name: channel.name ?? "session",
          provider: "claude",
        });
        this.sessions.bindChannel(session.id, message.channelId);

        try {
          await channel.setTopic(
            `Session: ${session.name} | Dir: ${project.directory} | tmux: ${session.tmuxName}`
          );
        } catch { /* ignore permission errors */ }
      } catch (err: any) {
        await message.reply(`❌ Failed to start session: ${err.message}`);
        return;
      }
    }

    // Resume idle sessions
    if (session.status === "idle" || session.status === "stopped") {
      try {
        await this.sessions.resumeSession(session.id);
      } catch { /* try sending anyway */ }
    }

    // Ensure output handler
    if (!this.outputHandlers.has(message.channelId)) {
      this.registerChannel(message.channelId, message.channel as TextChannel);
    }

    await message.react("⏳");

    try {
      // Send the enhanced payload, not the raw message
      await this.sessions.sendMessage(session.id, intent.payload);
    } catch (err: any) {
      await message.reply(`❌ ${err.message}`);
      try { await message.reactions.cache.get("⏳")?.users.remove(message.client.user!.id); } catch { /* */ }
    }
  }

  /**
   * One-shot Claude CLI invocation for non-project channels.
   * Spawns `claude --print`, pipes the message, streams output back.
   * No session tracking — fire and forget.
   */
  private async globalChat(intent: ClassifiedIntent, message: Message, directory: string): Promise<void> {
    await message.react("⏳");

    try {
      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn("claude", ["--print", "--permission-mode", "bypassPermissions"], {
          cwd: directory,
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env },
        });

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
        proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

        proc.on("error", (err) => reject(err));
        proc.on("close", (code) => {
          if (code !== 0 && stderr) {
            reject(new Error(stderr.slice(0, 500)));
          } else {
            resolve(stdout || "(no output)");
          }
        });

        proc.stdin.write(intent.payload);
        proc.stdin.end();
      });

      // Remove ⏳, add ✅
      try { await message.reactions.cache.get("⏳")?.users.remove(message.client.user!.id); } catch { /* */ }
      await message.react("✅");

      // Split into Discord-safe chunks
      await this.postChunked(message, output);
    } catch (err: any) {
      try { await message.reactions.cache.get("⏳")?.users.remove(message.client.user!.id); } catch { /* */ }
      await message.reply(`❌ ${err.message ?? "Claude process failed"}`);
    }
  }

  /** Post text to a channel, splitting into multiple messages if needed. */
  private async postChunked(message: Message, text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) {
      await message.reply("(no output)");
      return;
    }

    if (trimmed.length <= MAX_MESSAGE_LEN) {
      await message.reply(trimmed);
      return;
    }

    // Split on newlines, respecting the limit
    let remaining = trimmed;
    let isFirst = true;
    while (remaining.length > 0) {
      let chunk: string;
      if (remaining.length <= MAX_MESSAGE_LEN) {
        chunk = remaining;
        remaining = "";
      } else {
        // Try to split at a newline
        const cutIdx = remaining.lastIndexOf("\n", MAX_MESSAGE_LEN);
        const splitAt = cutIdx > MAX_MESSAGE_LEN / 2 ? cutIdx : MAX_MESSAGE_LEN;
        chunk = remaining.slice(0, splitAt);
        remaining = remaining.slice(splitAt).replace(/^\n/, "");
      }

      if (isFirst) {
        await message.reply(chunk);
        isFirst = false;
      } else {
        await (message.channel as TextChannel).send(chunk);
      }
    }
  }
}
