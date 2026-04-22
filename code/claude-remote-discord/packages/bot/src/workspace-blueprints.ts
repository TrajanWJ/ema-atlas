import { ChannelType, type Client } from "discord.js";

type ProjectBinding = {
  directory: string;
  sessionName?: string;
  provider?: "hermes" | "claude" | "codex";
};

type WorkspaceBlueprint = {
  category: string;
  projectBinding?: ProjectBinding;
  channels: Array<{ name: string; topic: string }>;
};

const ADIL_ROOT = "/home/trajan/Projects/ema/recovered/adil/real-estate-ai-openclaw-src";

const ADIL_BLUEPRINTS: WorkspaceBlueprint[] = [
  {
    category: "ADIL · PERSONAL",
    channels: [
      {
        name: "welcome",
        topic: "Private-ish operator surface for onboarding, handoffs, and direct collaboration with Adil.",
      },
      {
        name: "notes",
        topic: "Personal notes, quick asks, and lightweight follow-ups that should not clutter the build lanes.",
      },
    ],
  },
  {
    category: "ADIL · WHOLESALING AI",
    projectBinding: {
      directory: ADIL_ROOT,
      sessionName: "main",
      provider: "hermes",
    },
    channels: [
      {
        name: "main",
        topic: "High-signal command layer for the real-estate AI workspace — decisions, priorities, blockers, and next actions.",
      },
      {
        name: "architecture",
        topic: "AI architecture, agent roles, routing logic, and modernization work for the recovered OpenClaw workspace.",
      },
      {
        name: "bot-workbench",
        topic: "Dedicated constructive agent-to-agent lane. Protocol: state observed reality, propose one next action, ask at most one blocker, no meta-chatter.",
      },
      {
        name: "intake-enrichment",
        topic: "Shared backbone lane for normalized intake, enrichment, scoring, and routing inputs.",
      },
      {
        name: "follow-up-kpis",
        topic: "Follow-up orchestration, KPI intelligence, queue doctrine, and pipeline visibility.",
      },
    ],
  },
  {
    category: "ADIL · WHOLESALING HOUSES",
    projectBinding: {
      directory: `${ADIL_ROOT}/agents/house`,
      sessionName: "main",
      provider: "hermes",
    },
    channels: [
      {
        name: "main",
        topic: "House wholesaling execution lane: intake, outreach, triage, underwriting, and disposition.",
      },
      {
        name: "list-building",
        topic: "Off-market list building, distress stacking, seller targeting, and acquisition list criteria.",
      },
      {
        name: "outreach-triage",
        topic: "Seller outreach, reply classification, hot lead escalation, and active conversation handling.",
      },
      {
        name: "underwriting-dispo",
        topic: "Fast underwriting, MAO logic, spread checks, buyer matching, and dispo preparation.",
      },
    ],
  },
  {
    category: "ADIL · WHOLESALING LAND",
    projectBinding: {
      directory: `${ADIL_ROOT}/agents/land`,
      sessionName: "main",
      provider: "hermes",
    },
    channels: [
      {
        name: "main",
        topic: "Land wholesaling execution lane: sourcing, zoning, constraints, underwriting, and buyer fit.",
      },
      {
        name: "sourcing",
        topic: "Land sourcing, seller qualification, and buyer-criteria oriented parcel discovery.",
      },
      {
        name: "zoning-constraints",
        topic: "Zoning, entitlement, GIS constraints, municipality monitoring, and highest-best-use analysis.",
      },
      {
        name: "underwriting-dispo",
        topic: "Land underwriting, buyer match, and disposition-ready decision support.",
      },
    ],
  },
];

export class WorkspaceBlueprintSync {
  constructor(
    private client: Client,
    private guildId: string,
    private projects: any,
  ) {}

  async sync(): Promise<void> {
    const guild = await this.client.guilds.fetch(this.guildId);
    if (!guild) {
      console.error("[workspace-blueprints] Guild not found:", this.guildId);
      return;
    }

    const channels = await guild.channels.fetch();
    const categoryIds = new Map<string, string>();
    const textChannelsByParent = new Map<string, Set<string>>();

    for (const [id, channel] of Array.from(channels.entries())) {
      if (!channel) continue;
      if (channel.type === ChannelType.GuildCategory) {
        categoryIds.set(channel.name, id);
      }
      if (channel.type === ChannelType.GuildText && channel.parentId) {
        const names = textChannelsByParent.get(channel.parentId) ?? new Set<string>();
        names.add(channel.name);
        textChannelsByParent.set(channel.parentId, names);
      }
    }

    let created = 0;
    for (const blueprint of ADIL_BLUEPRINTS) {
      let categoryId = categoryIds.get(blueprint.category);
      if (!categoryId) {
        const category = await guild.channels.create({
          name: blueprint.category,
          type: ChannelType.GuildCategory,
        });
        categoryId = category.id;
        categoryIds.set(blueprint.category, categoryId);
        created++;
      }

      const existingNames = textChannelsByParent.get(categoryId) ?? new Set<string>();
      for (const channelBlueprint of blueprint.channels) {
        if (existingNames.has(channelBlueprint.name)) continue;

        await guild.channels.create({
          name: channelBlueprint.name,
          type: ChannelType.GuildText,
          parent: categoryId,
          topic: channelBlueprint.topic,
        });
        existingNames.add(channelBlueprint.name);
        created++;
      }

      textChannelsByParent.set(categoryId, existingNames);

      if (blueprint.projectBinding) {
        const { project } = await this.projects.openLocation({
          directory: blueprint.projectBinding.directory,
          sessionName: blueprint.projectBinding.sessionName,
          provider: blueprint.projectBinding.provider,
        });
        this.projects.setProjectConfig?.(project.id, {
          defaultProvider: blueprint.projectBinding.provider,
        });
        this.projects.bindCategory(project.id, categoryId);
      }
    }

    if (created > 0) {
      console.log(`[workspace-blueprints] Created ${created} Adil workspace channels/categories`);
    }
  }
}
