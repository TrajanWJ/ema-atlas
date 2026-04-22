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
          { name: "Codex", value: "codex" },
          { name: "Hermes", value: "hermes" }
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
              { name: "Codex", value: "codex" },
              { name: "Hermes", value: "hermes" }
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
              { name: "Backlog", value: "backlog" },
              { name: "In Progress", value: "in_progress" },
              { name: "Review", value: "review" },
              { name: "Done", value: "done" }
            )
        )
    )
    .toJSON(),

  // ─── One-Shot Run ───────────────────────────────────────────

  new SlashCommandBuilder()
    .setName("run")
    .setDescription("Run a one-shot Claude prompt in a directory (no session)")
    .addStringOption((opt) =>
      opt
        .setName("directory")
        .setDescription("Absolute path to run in")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("prompt")
        .setDescription("The prompt to send to Claude")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("provider")
        .setDescription("Agent provider")
        .setRequired(false)
        .addChoices(
          { name: "Claude Code", value: "claude" },
          { name: "Codex", value: "codex" },
          { name: "Hermes", value: "hermes" }
        )
    )
    .toJSON(),

  // ─── Status ───────────────────────────────────────────────

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Show ClaudeForge system status")
    .toJSON(),

  // ─── Code Intelligence ──────────────────────────────────

  new SlashCommandBuilder()
    .setName("commit")
    .setDescription("Generate a conventional commit message for staged changes")
    .addStringOption((opt) =>
      opt
        .setName("directory")
        .setDescription("Project directory (defaults to session dir)")
        .setRequired(false)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("pr-review")
    .setDescription("Review PR changes between a branch and main")
    .addStringOption((opt) =>
      opt
        .setName("branch")
        .setDescription("Branch to review (defaults to current branch)")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("directory")
        .setDescription("Project directory (defaults to session dir)")
        .setRequired(false)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("code-review")
    .setDescription("Review a file or recent diff")
    .addStringOption((opt) =>
      opt
        .setName("file")
        .setDescription("File path to review (or leave blank for recent diff)")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("directory")
        .setDescription("Project directory (defaults to session dir)")
        .setRequired(false)
    )
    .toJSON(),
];
