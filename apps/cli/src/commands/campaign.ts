import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { DEFAULT_ACTOR, DEFAULT_ORG, filterProjectScopedRecords, readProjection, sendWorkspaceCommand, workspaceScopeContext } from "./workspace-daemon.js";
import { runStubContract } from "./stub-contract.js";

type Campaign = { id: string; campaign_id?: string; title?: string; status?: string; project_id?: string | null; updated_at?: string | null };

export async function runCampaign(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runCampaignHelp(args);
  if (verb === "create") return createCampaign(args);
  if (verb === "archive") return archiveCampaign(args);
  if (verb === "show") return showCampaign(args);
  return listCampaigns(args);
}

function runCampaignHelp(args: ParsedArgs): number {
  return runStubContract(args, {
    noun: "campaign",
    status: "available",
    docRef: "docs/cli/agent-workspace.md",
    commands: [
      { verb: "create", flags: ["title", "project", "depends-on", "done-when"], required: ["title"], summary: "Create a long-running initiative in the resolved workspace scope." },
      { verb: "list", flags: ["project", "all-projects", "json"], summary: "List campaigns in the resolved workspace scope." },
      { verb: "show", flags: ["campaign"], required: ["campaign"], summary: "Show one campaign from campaign.registry." },
      { verb: "archive", flags: ["campaign", "reason"], required: ["campaign"], summary: "Archive a campaign with an optional reason." },
    ],
  });
}

async function createCampaign(args: ParsedArgs): Promise<number> {
  const title = flagString(args, "title");
  if (!title) {
    emitError("ema campaign create: --title is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "campaign.create", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    title,
    project_id: flagString(args, "project") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
    done_when: flagString(args, "done-when") ?? null,
  }, { human: `created campaign "${title}"`, resourceLabel: "campaign" });
}

async function archiveCampaign(args: ParsedArgs): Promise<number> {
  const campaign = flagString(args, "campaign");
  if (!campaign) {
    emitError("ema campaign archive: --campaign is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "campaign.archive", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    campaign_id: campaign,
    reason: flagString(args, "reason") ?? null,
  }, { human: `archived campaign ${campaign}` });
}

async function listCampaigns(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const campaigns = await loadCampaigns(args);
  if (!campaigns) return 1;
  if (json) emitJson({ ok: true, source: "campaign.registry", campaigns });
  else {
    emitPretty("# campaigns");
    if (campaigns.length === 0) emitPretty("  (none)");
    for (const campaign of campaigns) emitPretty(`  ${campaign.id} [${campaign.status ?? "unknown"}] ${campaign.title ?? ""}`);
  }
  return 0;
}

async function showCampaign(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const id = flagString(args, "campaign");
  if (!id) {
    emitError("ema campaign show: --campaign is required");
    return 64;
  }
  const campaigns = await loadCampaigns(args);
  if (!campaigns) return 1;
  const campaign = campaigns.find((item) => item.id === id || item.campaign_id === id) ?? null;
  if (json) emitJson({ ok: true, source: "campaign.registry", campaign });
  else if (campaign) emitPretty(JSON.stringify(campaign, null, 2));
  else emitPretty(`campaign not found: ${id}`);
  return campaign ? 0 : 1;
}

async function loadCampaigns(args: ParsedArgs): Promise<Campaign[] | null> {
  const context = await workspaceScopeContext(args);
  const items = await readProjection(args, {
    name: "campaign.registry",
    pick: (data) => (data.campaigns as Campaign[] | undefined) ?? [],
  });
  if (!items) return null;
  return filterProjectScopedRecords(items, context);
}
