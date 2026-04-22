# LCM Summary sum_251ae3cdf3f8b2fa

Created: 2026-03-20 09:22:40
Kind: leaf
Depth: 0
Conversation: 712
Tokens: 1215
Descendants: 0
Earliest: 2026-03-20T08:46:39.000Z
Latest: 2026-03-20T08:46:39.000Z

## Content

[2026-03-20 08:46 UTC]
=== bot.ts ===
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
        const proc = spawn("claude", ["--print", "--permission-mo
[LCM fallback summary; truncated for context management]
