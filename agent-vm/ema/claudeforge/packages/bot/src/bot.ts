import { spawn } from "node:child_process";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  type Interaction,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { commands } from "./commands.js";
import { MessageHandler, type InterpreterFns } from "./message-handler.js";
import { SessionSync } from "./session-sync.js";
import {
  handleOpen,
  handleClose,
  handleLocations,
  handleSessionNew,
  handleSessionInfo,
  handleStatus,
  handleRun,
  type HandlerContext,
} from "./command-handlers.js";

export interface BotConfig {
  token: string;
  clientId: string;
  guildId: string;
  allowedUsers: string[];
}

export class ClaudeForgeBot {
  private client: Client;
  private messageHandler: MessageHandler;
  private ctx: HandlerContext;

  constructor(
    config: BotConfig,
    sessions: any,
    projects: any,
    db: any,
    interpreter?: InterpreterFns,
  ) {
    // MessageContent is a privileged intent — requires enabling in Discord Developer Portal:
    // https://discord.com/developers/applications/1484096808778072144/bot
    // Toggle "Message Content Intent" under Privileged Gateway Intents
    // For now, fall back to non-privileged intents so the bot can connect
    const intents = [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ];
    // Only request MessageContent if explicitly opted in (after enabling in portal)
    if (process.env.ENABLE_MESSAGE_CONTENT !== "false") {
      intents.push(GatewayIntentBits.MessageContent);
    }
    this.client = new Client({ intents });

    const allowedUsers = new Set(config.allowedUsers);

    this.ctx = { db, sessions, projects, allowedUsers };
    // Default interpreter stubs — real ones injected from start.ts
    const defaultInterpreter: InterpreterFns = interpreter ?? {
      classify: (msg, dir, name) => ({
        kind: "chat" as const,
        raw: msg,
        payload: msg,
        safety: { level: "safe" as const },
      }),
      executeShell: (cmd, dir) => ({
        stdout: "",
        stderr: "Interpreter not loaded",
        exitCode: 1,
        truncated: false,
      }),
    };
    this.messageHandler = new MessageHandler(sessions, projects, allowedUsers, defaultInterpreter);

    this.client.on("ready", () => {
      console.log(`[bot] Logged in as ${this.client.user?.tag}`);
      this.registerCommands(config);

      // Start session sync — auto-create categories for Claude projects
      const sync = new SessionSync(this.client, config.guildId);
      sync.start().catch((err) =>
        console.error("[bot] Session sync startup error:", err)
      );
    });

    this.client.on("interactionCreate", (interaction) =>
      this.handleInteraction(interaction)
    );

    this.client.on("messageCreate", (message) =>
      this.messageHandler.handleMessage(message)
    );

    this.client.login(config.token);
  }

  private async registerCommands(config: BotConfig): Promise<void> {
    const rest = new REST().setToken(config.token);
    try {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log(`[bot] Registered ${commands.length} slash commands`);
    } catch (err) {
      console.error("[bot] Failed to register commands:", err);
    }
  }

  /**
   * Spawns `claude --print` with a prompt, streams output back to the interaction.
   * Reuses the same pattern as globalChat in message-handler.ts.
   */
  private async handleClaudeCommand(
    cmd: ChatInputCommandInteraction,
    ctx: HandlerContext,
    opts: { prompt: string; dirOption: string },
  ): Promise<void> {
    if (!ctx.allowedUsers.has(cmd.user.id)) {
      await cmd.reply({ content: "❌ Not authorized.", ephemeral: true });
      return;
    }

    // Resolve directory from option, session, or default
    let directory = cmd.options.getString(opts.dirOption);
    if (!directory) {
      const session = ctx.sessions.getByChannel(cmd.channelId);
      if (session) {
        directory = session.directory;
      } else {
        // Try to get project from category
        const channel = cmd.channel;
        if (channel && "parentId" in channel && channel.parentId) {
          const project = ctx.projects.getByCategory(channel.parentId);
          if (project) directory = project.directory;
        }
      }
    }
    if (!directory) {
      await cmd.reply({
        content: "❌ No directory found. Use the `directory` option or run in a project channel.",
        ephemeral: true,
      });
      return;
    }

    await cmd.deferReply();

    try {
      const output = await new Promise<string>((resolve, reject) => {
        const proc = spawn("claude", ["--print", "--permission-mode", "bypassPermissions"], {
          cwd: directory!,
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

        proc.stdin.write(opts.prompt);
        proc.stdin.end();
      });

      // Split into Discord-safe chunks (max 2000 chars)
      const trimmed = output.trim();
      if (trimmed.length <= 1900) {
        await cmd.editReply(trimmed);
      } else {
        // First chunk goes to the reply, rest go as follow-up messages
        await cmd.editReply(trimmed.slice(0, 1900) + "\n...");
        const channel = cmd.channel as TextChannel;
        let remaining = trimmed.slice(1900);
        while (remaining.length > 0) {
          const chunk = remaining.slice(0, 1900);
          remaining = remaining.slice(1900);
          await channel.send(chunk);
        }
      }
    } catch (err: any) {
      await cmd.editReply(`❌ ${err.message ?? "Claude process failed"}`);
    }
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const cmd = interaction as ChatInputCommandInteraction;

    try {
      switch (cmd.commandName) {
        case "open":
          await handleOpen(cmd, this.ctx);
          break;
        case "close":
          await handleClose(cmd, this.ctx);
          break;
        case "locations":
          await handleLocations(cmd, this.ctx);
          break;
        case "session": {
          const sub = cmd.options.getSubcommand();
          switch (sub) {
            case "new":
              await handleSessionNew(cmd, this.ctx);
              break;
            case "info":
              await handleSessionInfo(cmd, this.ctx);
              break;
            case "end": {
              const session = this.ctx.sessions.getByChannel(cmd.channelId);
              if (session) {
                this.ctx.sessions.stopSession(session.id);
                await cmd.reply("✅ Session ended.");
              } else {
                await cmd.reply({ content: "❌ No session in this channel.", ephemeral: true });
              }
              break;
            }
            case "resume": {
              const session = this.ctx.sessions.getByChannel(cmd.channelId);
              if (session) {
                await this.ctx.sessions.resumeSession(session.id);
                await cmd.reply("✅ Session resumed.");
              } else {
                await cmd.reply({ content: "❌ No session in this channel.", ephemeral: true });
              }
              break;
            }
            case "attach": {
              const session = this.ctx.sessions.getByChannel(cmd.channelId);
              if (session) {
                await cmd.reply(`\`\`\`\ntmux attach -t ${session.tmuxName}\n\`\`\``);
              } else {
                await cmd.reply({ content: "❌ No session in this channel.", ephemeral: true });
              }
              break;
            }
            case "list": {
              const channel = cmd.channel;
              if (channel && "parentId" in channel && channel.parentId) {
                const project = this.ctx.projects.getByCategory(channel.parentId);
                if (project) {
                  const sessions = this.ctx.sessions.list(project.id);
                  const list = sessions
                    .map((s: any) => `• **${s.name}** (${s.provider}) — ${s.status}`)
                    .join("\n");
                  await cmd.reply(list || "No sessions in this location.");
                } else {
                  await cmd.reply({ content: "❌ Not in a project category.", ephemeral: true });
                }
              }
              break;
            }
          }
          break;
        }
        case "stop": {
          const session = this.ctx.sessions.getByChannel(cmd.channelId);
          if (session) {
            this.ctx.sessions.abortSession(session.id);
            await cmd.reply("⏹️ Generation aborted.");
          } else {
            await cmd.reply({ content: "❌ No session in this channel.", ephemeral: true });
          }
          break;
        }
        case "run":
          await handleRun(cmd, this.ctx);
          break;
        case "status":
          await handleStatus(cmd, this.ctx);
          break;
        case "shell": {
          const command = cmd.options.getString("command", true);
          const session = this.ctx.sessions.getByChannel(cmd.channelId);
          if (!session) {
            await cmd.reply({ content: "❌ No session in this channel.", ephemeral: true });
            break;
          }
          await cmd.deferReply();
          const { execSync } = await import("node:child_process");
          try {
            const output = execSync(command, {
              cwd: session.directory,
              timeout: 30_000,
              maxBuffer: 1024 * 1024,
              encoding: "utf-8",
            });
            const truncated = output.slice(0, 1900);
            await cmd.editReply(`\`\`\`\n$ ${command}\n${truncated}\n\`\`\``);
          } catch (err: any) {
            await cmd.editReply(`\`\`\`\n$ ${command}\n${(err.stderr ?? err.message).slice(0, 1900)}\n\`\`\``);
          }
          break;
        }
        case "commit":
          await this.handleClaudeCommand(cmd, this.ctx, {
            prompt: "Generate a conventional commit message for the staged changes in this directory. Review git diff --cached. Output ONLY the commit message, nothing else. Use conventional commit format (feat:, fix:, refactor:, etc.).",
            dirOption: "directory",
          });
          break;
        case "pr-review": {
          const branch = cmd.options.getString("branch");
          const branchPrompt = branch
            ? `Review the changes in branch '${branch}' vs main.`
            : "Review the changes in the current branch vs main.";
          await this.handleClaudeCommand(cmd, this.ctx, {
            prompt: `${branchPrompt} Give a concise code review covering: bugs, security issues, code quality, and suggestions. Be direct and actionable.`,
            dirOption: "directory",
          });
          break;
        }
        case "code-review": {
          const file = cmd.options.getString("file");
          const reviewPrompt = file
            ? `Review the file '${file}'. Give a concise code review covering: bugs, security issues, code quality, and suggestions.`
            : "Review the recent git diff (unstaged + staged changes). Give a concise code review covering: bugs, security issues, code quality, and suggestions. Be direct and actionable.";
          await this.handleClaudeCommand(cmd, this.ctx, {
            prompt: reviewPrompt,
            dirOption: "directory",
          });
          break;
        }
        default:
          await cmd.reply({ content: "Unknown command.", ephemeral: true });
      }
    } catch (err) {
      console.error("[bot] Command error:", err);
      const reply = cmd.deferred
        ? cmd.editReply("❌ An error occurred.")
        : cmd.reply({ content: "❌ An error occurred.", ephemeral: true });
      await reply.catch(() => {});
    }
  }
}
