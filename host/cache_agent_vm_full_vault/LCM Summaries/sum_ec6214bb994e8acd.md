# LCM Summary sum_ec6214bb994e8acd

Created: 2026-03-20 08:16:27
Kind: leaf
Depth: 0
Conversation: 712
Tokens: 1215
Descendants: 0
Earliest: 2026-03-20T08:09:13.000Z
Latest: 2026-03-20T08:09:14.000Z

## Content

[2026-03-20 08:09 UTC]
import {
  SlashCommandBuilder,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

export const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  // ─── Location Management ─────────────────────────────────

  new SlashCommandBuilder()
    .setName("open")
    .setDescription("Open a directory as a project location")
    .addStringOption((opt) =>
      opt
        .setName("path")
        .setDescription("Absolute path on the host machine")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("session")
        .setDescription("Session name (default: main)")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("provider")
        .setDescription("Agent provider")
        .setRequired(false)
        .addChoices(
          { name: "Claude Code", value: "claude" },
          { name: "Codex", value: "codex" }
        )
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close the current location and archive its category")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("locations")
    .setDescription("List all open project locations")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("navigate")
    .setDescription("Navigate to a directory (opens if not already open)")
    .addStringOption((opt) =>
      opt.setName("path").setDescription("Directory path").setRequired(true)
    )
    .toJSON(),

  // ─── Session Management ───────────────────────────────────

  new SlashCommandBuilder()
    .setName("session")
    .setDescription("Manage sessions")
    .addSubcommand((sub) =>
      sub
        .setName("new")
        .setDescription("Create a new session in this location")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Session name").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("provider")
            .setDescription("Agent provider")
            .setRequired(false)
            .addChoices(
              { name: "Claude Code", value: "claude" },
              { name: "Codex", value: "codex" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List sessions in this location")
    )
    .addSubcommand((sub) =>
      sub.setName("end").setDescription("End the session in this channel")
    )
    .addSubcommand((sub) =>
      sub.setName("resume").setDescription("Resume a stopped session")
    )
    .addSubcommand((sub) =>
      sub.setName("info").setDescription("Show session details")
    )
    .addSubcommand((sub) =>
      sub
        .setName("attach")
        .setDescription("Get tmux attach command for terminal access")
    )
    .toJSON(),

  // ─── Agent Interaction ────────────────────────────────────

  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Abort current agent generation")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("model")
    .setDescription("Change model for this session")
    .addStringOption((opt) =>
      opt.setName("model").setDescription("Model ID").setRequired(true)
    )
    .toJSON(),

  // ─── Shell ────────────────────────────────────────────────

  new SlashCommandBuilder()
    .setName("shell")
    .setDescription("Run a shell command in the session directory")
    .addStringOption((opt) =>
      opt.setName("command").setDescription("Shell command").setRequired(true)
    )
    .toJSON(),

  // ─── Tasks ────────────────────────────────────────────────

  new SlashCommandBuilder()
    .setName("task")
    .setDescription("Task management")
    .addSubcommand((sub) =>
      sub
        .setName("new")
        .setDescription("Create a new task")
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Task title").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("description").setDescription("Task description").setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("priority")
            .setDescription("Priority")
            .setRequired(false)
            .addChoices(
              { name: "Low", value: "low" },
              { name: "Normal", value: "normal" },
              { name: "High", value: "high" },
              { name: "Critical", value: "critical" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("List tasks")
        .addStringOption((opt) =>
          opt
            .setName("status")
            .setDescription("Filter by status")
            .setRequired(false)
            .addChoices(
              { name: "Backlog", value: "backlog" }
[LCM fallback summary; truncated for context management]
