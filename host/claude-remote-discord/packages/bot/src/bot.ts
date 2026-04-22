import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  REST,
  Routes,
  type Interaction,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type TextChannel,
  codeBlock,
} from "discord.js";
import { EMBED_COLORS } from "@claudeforge/shared";
import { commands } from "./commands.js";
import { MessageHandler, type InterpreterFns } from "./message-handler.js";
import { SessionSync } from "./session-sync.js";
import { SessionChannelSync } from "./session-channel-sync.js";
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
import { PERSONAS } from "./personas.js";
import { NotificationService } from "./notifications.js";

const PREFERENCES_TEMPLATE = `# ClaudeForge User Preferences

## Style
- Be direct and concise
- Write working code, not pseudocode
- Show diffs when modifying existing files
- Explain reasoning briefly, dont over-explain

## Standards
- Use TypeScript strict mode
- Prefer async/await over callbacks
- Use meaningful variable names
- Add error handling to all async operations
- Follow existing project conventions

## Do Not
- Ask "shall I proceed?" — just do it
- Explain basic concepts I already know
- Add unnecessary comments
- Use var — use const/let
`;

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
  private notifications!: NotificationService;
  private activePersonas = new Map<string, string>();
  private projectPersonalities = new Map<string, string>();

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
    this.messageHandler = new MessageHandler(sessions, projects, allowedUsers, defaultInterpreter, db);

    this.client.on("ready", () => {
      console.log(`[bot] Logged in as ${this.client.user?.tag}`);
      this.registerCommands(config);
      this.ensurePreferencesFile();
      this.notifications = new NotificationService(this.client);
      this.messageHandler.setNotifications(this.notifications);

      // Listen for session errors and high cost to send notifications
      sessions.on?.("session.error", (sessionId: string, error: string) => {
        const session = sessions.get(sessionId);
        if (session) {
          this.notifications.sessionError(session.name, error, session.projectName).catch(() => {});
        }
      });
      sessions.on?.("session.output", (sessionId: string, event: any) => {
        if (event.type === "done" && event.cost && event.cost > 1.0) {
          const session = sessions.get(sessionId);
          if (session) {
            this.notifications.highCostAlert(session.name, event.cost, session.projectName).catch(() => {});
          }
        }
      });

      // Start session sync — auto-create categories for Claude projects AND register in DB
      const sync = new SessionSync(this.client, config.guildId, projects);
      sync.start().catch((err) =>
        console.error("[bot] Session sync startup error:", err)
      );

      // Start session-channel sync — auto-create Discord channels for sessions
      const channelSync = new SessionChannelSync(this.client, config.guildId, sessions, projects, db);
      channelSync.boot().catch((err) =>
        console.error("[bot] Session channel sync boot error:", err)
      );
    });

    this.client.on("interactionCreate", (interaction) => {
      if (interaction.isButton()) {
        this.handleButton(interaction as ButtonInteraction).catch((err) =>
          console.error("[bot] Button error:", err)
        );
        return;
      }
      this.handleInteraction(interaction);
    });

    this.client.on("messageCreate", (message) =>
      this.messageHandler.handleMessage(message)
    );

    this.client.login(config.token);
  }

  private ensurePreferencesFile(): void {
    const home = process.env.HOME ?? "/home/trajan";
    const prefsDir = join(home, ".claudeforge");
    const prefsPath = join(prefsDir, "preferences.md");

    if (existsSync(prefsPath)) return;

    try {
      mkdirSync(prefsDir, { recursive: true });
      writeFileSync(prefsPath, PREFERENCES_TEMPLATE, "utf-8");
      console.log(`[bot] Created preferences file: ${prefsPath}`);
    } catch (err) {
      console.error("[bot] Failed to create preferences file:", err);
    }
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

  private async handleDashboard(cmd: ChatInputCommandInteraction): Promise<void> {
    const projects = this.ctx.projects.list().filter((p: any) => !p.isArchived);
    const allSessions = this.ctx.sessions.list();
    const activeSessions = allSessions.filter((s: any) => s.status === "active");
    const totalCost = allSessions.reduce((sum: number, s: any) => sum + (s.totalCost ?? 0), 0);
    const totalTokens = allSessions.reduce((sum: number, s: any) => sum + (s.totalTokens ?? 0), 0);

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.primary)
      .setTitle("ClaudeForge Dashboard")
      .addFields(
        { name: "Projects", value: String(projects.length), inline: true },
        { name: "Active Sessions", value: String(activeSessions.length), inline: true },
        { name: "Total Sessions", value: String(allSessions.length), inline: true },
        { name: "Total Cost", value: `$${totalCost.toFixed(2)}`, inline: true },
        { name: "Total Tokens", value: totalTokens.toLocaleString(), inline: true },
        { name: "Uptime", value: `${hours}h ${minutes}m`, inline: true },
      )
      .setTimestamp();

    if (activeSessions.length > 0) {
      const lines = activeSessions.slice(0, 8).map((s: any) => {
        const cost = s.totalCost > 0 ? ` | $${s.totalCost.toFixed(4)}` : "";
        return `🟢 **${s.name}** — ${s.provider}${cost}`;
      });
      embed.addFields({ name: "Active Sessions", value: lines.join("\n").slice(0, 1024) });
    }

    if (projects.length > 0) {
      const lines = projects.slice(0, 8).map((p: any) => {
        const sessions = this.ctx.sessions.list(p.id);
        const active = sessions.filter((s: any) => s.status === "active").length;
        return `**${p.name}** — ${active > 0 ? `${active} active` : "idle"}`;
      });
      embed.addFields({ name: "Projects", value: lines.join("\n").slice(0, 1024) });
    }

    await cmd.reply({ embeds: [embed] });
  }

  private async handleButton(interaction: ButtonInteraction): Promise<void> {
    if (!this.ctx.allowedUsers.has(interaction.user.id)) {
      await interaction.reply({ content: "❌ Not authorized.", ephemeral: true });
      return;
    }

    const [action, sessionId] = interaction.customId.split("_", 2);

    switch (action) {
      case "continue": {
        await interaction.deferReply();
        try {
          await this.ctx.sessions.sendMessage(sessionId, "continue");
          await interaction.editReply("▶️ Continuing...");
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Failed";
          await interaction.editReply(`❌ ${msg}`);
        }
        break;
      }
      case "stop": {
        this.ctx.sessions.stopSession(sessionId);
        await interaction.reply("⏹️ Session stopped.");
        break;
      }
      case "copy": {
        const handler = this.messageHandler.getOutputHandler(interaction.channelId);
        const lastResponse = handler?.getLastResponse();
        if (lastResponse) {
          const truncated = lastResponse.slice(0, 1900);
          await interaction.reply({ content: codeBlock(truncated), ephemeral: true });
        } else {
          await interaction.reply({ content: "No response to copy.", ephemeral: true });
        }
        break;
      }
      default:
        // Input request buttons
        if (interaction.customId.startsWith("input_")) {
          const value = interaction.customId.slice(6);
          const session = this.ctx.sessions.getByChannel(interaction.channelId);
          if (session) {
            await interaction.deferReply();
            try {
              await this.ctx.sessions.sendMessage(session.id, value);
              await interaction.editReply(`Sent: **${value}**`);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Failed";
              await interaction.editReply(`❌ ${msg}`);
            }
          }
        }
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
                  const sessions = this.ctx.sessions.list(project.id)
                    .sort((a: any, b: any) => (b.lastActivity ?? 0) - (a.lastActivity ?? 0));
                  if (sessions.length === 0) {
                    await cmd.reply({ content: "No sessions in this location. Use `/session new` to create one.", ephemeral: true });
                    break;
                  }
                  const statusEmoji: Record<string, string> = { active: "🟢", idle: "🟡", stopped: "⚫", error: "🔴" };
                  const statusColor: Record<string, number> = { active: EMBED_COLORS.success, idle: EMBED_COLORS.warning, stopped: EMBED_COLORS.info, error: EMBED_COLORS.error };
                  const lines = sessions.map((s: any) => {
                    const emoji = statusEmoji[s.status] ?? "⚪";
                    const cost = s.totalCost > 0 ? `$${s.totalCost.toFixed(4)}` : "$0";
                    const msgs = s.messageCount ?? 0;
                    const lastActive = s.lastActivity ? `<t:${Math.floor(s.lastActivity / 1000)}:R>` : "never";
                    return `${emoji} **${s.name}** (\`${s.provider}\`) — **${s.status}**\n  Messages: ${msgs} | Cost: ${cost} | Last active: ${lastActive}`;
                  });
                  const topStatus = sessions[0]?.status ?? "active";
                  const embed = new EmbedBuilder()
                    .setColor(statusColor[topStatus] ?? EMBED_COLORS.primary)
                    .setTitle(`Sessions — ${project.name} (${sessions.length})`)
                    .setDescription(lines.join("\n\n").slice(0, 4000))
                    .setFooter({ text: project.directory });
                  await cmd.reply({ embeds: [embed] });
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
        case "dashboard":
          await this.handleDashboard(cmd);
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
        case "continue": {
          const session = this.ctx.sessions.getByChannel(cmd.channelId);
          if (!session) {
            await cmd.reply({ content: "❌ No session in this channel.", ephemeral: true });
            break;
          }
          await cmd.reply("▶️ Continuing generation...");
          try {
            await this.ctx.sessions.sendMessage(session.id, "continue");
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to continue";
            await cmd.followUp(`❌ ${message}`);
          }
          break;
        }
        case "mode": {
          const session = this.ctx.sessions.getByChannel(cmd.channelId);
          if (!session) {
            await cmd.reply({ content: "❌ No session in this channel.", ephemeral: true });
            break;
          }
          const mode = cmd.options.getString("mode", true);
          try {
            this.ctx.sessions.updateSession(session.id, { mode });
            await cmd.reply(`✅ Session mode set to **${mode}**.`);
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to set mode";
            await cmd.reply({ content: `❌ ${message}`, ephemeral: true });
          }
          break;
        }
        case "persona": {
          const sub = cmd.options.getSubcommand();
          switch (sub) {
            case "use": {
              const name = cmd.options.getString("name", true);
              const persona = PERSONAS[name];
              if (!persona) {
                await cmd.reply({ content: `❌ Unknown persona: ${name}`, ephemeral: true });
                break;
              }
              this.activePersonas.set(cmd.channelId, name);
              this.messageHandler.setPersona(cmd.channelId, name);
              const embed = new EmbedBuilder()
                .setColor(EMBED_COLORS.primary)
                .setTitle(`${persona.emoji} Persona: ${persona.name}`)
                .setDescription(persona.description)
                .setFooter({ text: "All messages in this channel will use this persona" });
              await cmd.reply({ embeds: [embed] });
              break;
            }
            case "list": {
              const lines = Object.entries(PERSONAS).map(
                ([key, p]) => `${p.emoji} **${p.name}** (\`${key}\`)\n${p.description}`
              );
              const embed = new EmbedBuilder()
                .setColor(EMBED_COLORS.primary)
                .setTitle("Available Personas")
                .setDescription(lines.join("\n\n"));
              await cmd.reply({ embeds: [embed] });
              break;
            }
            case "clear": {
              this.activePersonas.delete(cmd.channelId);
              this.messageHandler.setPersona(cmd.channelId, null);
              await cmd.reply("✅ Persona cleared. Using default behavior.");
              break;
            }
          }
          break;
        }
        case "config": {
          const sub = cmd.options.getSubcommand();
          const channel = cmd.channel;
          const categoryId = channel && "parentId" in channel ? channel.parentId : null;
          const project = categoryId ? this.ctx.projects.getByCategory(categoryId) : null;

          if (!project) {
            await cmd.reply({ content: "❌ Not in a project category.", ephemeral: true });
            break;
          }

          switch (sub) {
            case "personality": {
              const prompt = cmd.options.getString("prompt", true);
              this.projectPersonalities.set(project.id, prompt);
              await cmd.reply(`✅ System prompt set for **${project.name}**.`);
              break;
            }
            case "info": {
              const personality = this.projectPersonalities.get(project.id);
              const activePersona = this.activePersonas.get(cmd.channelId);
              const embed = new EmbedBuilder()
                .setColor(EMBED_COLORS.primary)
                .setTitle(`⚙️ Config: ${project.name}`)
                .addFields(
                  { name: "Directory", value: `\`${project.directory}\``, inline: false },
                  { name: "Personality", value: personality ?? "_Not set_", inline: false },
                  { name: "Active Persona", value: activePersona ? PERSONAS[activePersona]?.name ?? "None" : "None", inline: true },
                );
              await cmd.reply({ embeds: [embed] });
              break;
            }
          }
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
