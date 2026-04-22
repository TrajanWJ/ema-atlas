import { spawn } from "node:child_process";
import {
  type ChatInputCommandInteraction,
  type Client,
  type TextChannel,
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
  codeBlock,
} from "discord.js";
import { EMBED_COLORS, DEFAULT_SESSION_NAME, LOG_CHANNEL_NAME } from "@claudeforge/shared";
import type { ProviderName, ToolCall } from "@claudeforge/shared";

// Note: In practice, the server instances are passed via dependency injection.
// This file defines the handler functions assuming access to managers.

export interface HandlerContext {
  db: any; // Persistence
  sessions: any; // SessionManager
  projects: any; // ProjectManager
  allowedUsers: Set<string>;
}

export async function handleOpen(
  interaction: ChatInputCommandInteraction,
  ctx: HandlerContext
): Promise<void> {
  if (!ctx.allowedUsers.has(interaction.user.id)) {
    await interaction.reply({ content: "❌ Not authorized.", ephemeral: true });
    return;
  }

  await interaction.deferReply();

  const path = interaction.options.getString("path", true);
  const sessionName = interaction.options.getString("session") ?? DEFAULT_SESSION_NAME;
  const provider = (interaction.options.getString("provider") as ProviderName) ?? "claude";

  try {
    const { project, sessionId } = await ctx.projects.openLocation({
      directory: path,
      sessionName,
      provider,
    });

    const guild = interaction.guild!;

    // Create category if not already bound
    if (!project.categoryId) {
      const category = await guild.channels.create({
        name: project.name.slice(0, 100),
        type: ChannelType.GuildCategory,
      });
      ctx.projects.bindCategory(project.id, category.id);

      // Create log channel
      const logChannel = await guild.channels.create({
        name: LOG_CHANNEL_NAME,
        type: ChannelType.GuildText,
        parent: category.id,
        topic: `Build logs and non-interactive output for ${project.name}`,
      });
      ctx.projects.bindCategory(project.id, category.id, logChannel.id);
    }

    // Create session channel
    const session = ctx.sessions.get(sessionId);
    if (session && !session.channelId) {
      const proj = ctx.projects.get(project.id);
      const channel = await guild.channels.create({
        name: sessionName,
        type: ChannelType.GuildText,
        parent: proj?.categoryId ?? undefined,
        topic: `Session: ${sessionName} | Provider: ${provider} | Dir: ${path} | tmux: ${session.tmuxName}`,
      });
      ctx.sessions.bindChannel(sessionId, channel.id);
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.success)
      .setTitle("📂 Location Opened")
      .setDescription(`**${project.name}**`)
      .addFields(
        { name: "Path", value: codeBlock(path), inline: false },
        { name: "Session", value: sessionName, inline: true },
        { name: "Provider", value: provider, inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}

export async function handleClose(
  interaction: ChatInputCommandInteraction,
  ctx: HandlerContext
): Promise<void> {
  await interaction.deferReply();

  const channel = interaction.channel;
  if (!channel || !("parentId" in channel) || !channel.parentId) {
    await interaction.editReply("❌ This channel is not in a project category.");
    return;
  }

  const project = ctx.projects.getByCategory(channel.parentId);
  if (!project) {
    await interaction.editReply("❌ No project found for this category.");
    return;
  }

  ctx.projects.closeLocation(project.id);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.warning)
    .setTitle("📁 Location Closed")
    .setDescription(`**${project.name}** archived. All sessions stopped.`);

  await interaction.editReply({ embeds: [embed] });
}

export async function handleLocations(
  interaction: ChatInputCommandInteraction,
  ctx: HandlerContext
): Promise<void> {
  const projects = ctx.projects.list();

  if (projects.length === 0) {
    await interaction.reply({ content: "No open locations. Use `/open <path>` to open one.", ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.primary)
    .setTitle("📂 Open Locations")
    .setDescription(
      projects
        .map((p: any) => {
          const sessions = ctx.sessions.list(p.id);
          const active = sessions.filter((s: any) => s.status === "active").length;
          return `**${p.name}**\n${sessions.length} sessions (${active} active)`;
        })
        .join("\n\n")
    );

  await interaction.reply({ embeds: [embed] });
}

export async function handleSessionNew(
  interaction: ChatInputCommandInteraction,
  ctx: HandlerContext
): Promise<void> {
  await interaction.deferReply();

  const name = interaction.options.getString("name", true);
  const provider = (interaction.options.getString("provider") as ProviderName) ?? "claude";

  const channel = interaction.channel;
  if (!channel || !("parentId" in channel) || !channel.parentId) {
    await interaction.editReply("❌ Run this inside a project category.");
    return;
  }

  const project = ctx.projects.getByCategory(channel.parentId);
  if (!project) {
    await interaction.editReply("❌ No project found for this category.");
    return;
  }

  try {
    const session = await ctx.sessions.createSession({
      projectId: project.id,
      directory: project.directory,
      projectName: project.name,
      name,
      provider,
    });

    // Create channel for the session
    const guild = interaction.guild!;
    const newChannel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: channel.parentId,
      topic: `Session: ${name} | Provider: ${provider} | Dir: ${project.directory} | tmux: ${session.tmuxName}`,
    });
    ctx.sessions.bindChannel(session.id, newChannel.id);

    await interaction.editReply(
      `✅ Session **${name}** created → <#${newChannel.id}>`
    );
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}

export async function handleSessionInfo(
  interaction: ChatInputCommandInteraction,
  ctx: HandlerContext
): Promise<void> {
  const session = ctx.sessions.getByChannel(interaction.channelId);
  if (!session) {
    await interaction.reply({ content: "❌ No session in this channel.", ephemeral: true });
    return;
  }

  const uptime = Date.now() - session.createdAt;
  const uptimeStr = `${Math.floor(uptime / 60000)}m`;

  const embed = new EmbedBuilder()
    .setColor(session.status === "active" ? EMBED_COLORS.success : EMBED_COLORS.info)
    .setTitle(`🤖 Session: ${session.name}`)
    .addFields(
      { name: "Status", value: session.status, inline: true },
      { name: "Provider", value: session.provider, inline: true },
      { name: "Model", value: session.model ?? "default", inline: true },
      { name: "Mode", value: session.mode, inline: true },
      { name: "Uptime", value: uptimeStr, inline: true },
      { name: "Messages", value: String(session.messageCount), inline: true },
      { name: "Cost", value: `$${session.totalCost.toFixed(4)}`, inline: true },
      { name: "tmux", value: codeBlock(`tmux attach -t ${session.tmuxName}`), inline: false },
      { name: "Directory", value: codeBlock(session.directory), inline: false }
    );

  await interaction.reply({ embeds: [embed] });
}

export async function handleStatus(
  interaction: ChatInputCommandInteraction,
  ctx: HandlerContext
): Promise<void> {
  const projects = ctx.projects.list();
  const activeSessions = ctx.sessions.getActive();
  const allSessions = ctx.sessions.list();
  const tasks = ctx.db.getTasks();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.primary)
    .setTitle("⚡ ClaudeForge Status")
    .addFields(
      { name: "Projects", value: String(projects.length), inline: true },
      { name: "Sessions", value: `${activeSessions.length} active / ${allSessions.length} total`, inline: true },
      {
        name: "Tasks",
        value: `📋 ${tasks.filter((t: any) => t.status === "backlog").length} backlog · 🔨 ${tasks.filter((t: any) => t.status === "in_progress").length} active · ✅ ${tasks.filter((t: any) => t.status === "done").length} done`,
        inline: false,
      }
    );

  if (activeSessions.length > 0) {
    embed.addFields({
      name: "Active Sessions",
      value: activeSessions
        .slice(0, 10)
        .map(
          (s: any) =>
            `• **${s.name}** (${s.provider}) — ${s.projectName}`
        )
        .join("\n"),
    });
  }

  await interaction.reply({ embeds: [embed] });
}

export async function handleRun(
  interaction: ChatInputCommandInteraction,
  ctx: HandlerContext
): Promise<void> {
  if (!ctx.allowedUsers.has(interaction.user.id)) {
    await interaction.reply({ content: "❌ Not authorized.", ephemeral: true });
    return;
  }

  await interaction.deferReply();

  const directory = interaction.options.getString("directory", true);
  const prompt = interaction.options.getString("prompt", true);

  const channel = interaction.channel as TextChannel;
  if (!channel) {
    await interaction.editReply("❌ Cannot send messages in this channel.");
    return;
  }

  const startTime = Date.now();
  let totalCost = 0;
  let toolCallCount = 0;
  const touchedFiles = new Set<string>();

  const args = [
    "--print",
    "--output-format", "stream-json",
    "--permission-mode", "bypassPermissions",
  ];

  const proc = spawn("claude", args, {
    cwd: directory,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });

  // Pipe prompt via stdin
  if (proc.stdin) {
    proc.stdin.write(prompt);
    proc.stdin.end();
  }

  await interaction.editReply(`⚡ Running in \`${directory}\`...\n\`\`\`\n${prompt.slice(0, 200)}\n\`\`\``);

  let textBuffer = "";

  const flushText = async () => {
    if (!textBuffer.trim()) return;
    const text = textBuffer.trim();
    textBuffer = "";
    const chunks = splitText(text, 2000);
    for (const chunk of chunks) {
      await channel.send(chunk);
    }
  };

  // Stream stdout
  if (proc.stdout) {
    let buffer = "";
    for await (const chunk of proc.stdout) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === "assistant" && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === "text") {
                textBuffer += block.text;
              }
              if (block.type === "tool_use") {
                await flushText();
                toolCallCount++;
                const filePath = block.input?.file_path ?? block.input?.path;
                if (filePath) touchedFiles.add(filePath);
              }
            }
          }
          if (event.type === "result") {
            totalCost = event.cost_usd ?? 0;
          }
        } catch {
          textBuffer += line;
        }
      }
    }
    if (buffer.trim()) {
      textBuffer += buffer.trim();
    }
  }

  await flushText();

  // Summary embed
  const duration = Date.now() - startTime;
  const durationStr = duration >= 60_000
    ? `${Math.floor(duration / 60_000)}m ${Math.floor((duration % 60_000) / 1000)}s`
    : `${Math.floor(duration / 1000)}s`;

  const filesStr = touchedFiles.size > 0
    ? [...touchedFiles].map(f => f.split("/").pop()).join(", ")
    : "none";

  const embed2 = new EmbedBuilder()
    .setColor(EMBED_COLORS.success)
    .setTitle("Run Complete")
    .setDescription(
      [
        `✅ Done | Cost: $${totalCost.toFixed(4)} | Duration: ${durationStr}`,
        `Tool calls: ${toolCallCount} | Files touched: ${filesStr}`,
      ].join("\n")
    )
    .setFooter({ text: directory });

  const msg = await channel.send({ embeds: [embed2] });
  await msg.react("✅").catch(() => {});

  // Thread-per-task: if a task title was provided, create a thread
  const threadTitle = interaction.options.getString("thread");
  if (threadTitle) {
    await msg.startThread({ name: threadTitle.slice(0, 100) }).catch(() => {});
  }
}

function splitText(text: string, maxLen: number): string[] {
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
