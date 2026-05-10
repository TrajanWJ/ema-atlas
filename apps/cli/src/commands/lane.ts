import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { maybeRunVerbHelp, runStubContract, type StubCommand } from "./stub-contract.js";
import {
  DEFAULT_ACTOR,
  DEFAULT_ORG,
  filterProjectScopedRecords,
  readProjection,
  sendWorkspaceCommand,
  workspaceScopeContext,
  type WorkspaceScopeContext,
} from "./workspace-daemon.js";

const DOC_REF = "docs/cli/agent-workspace.md";

const LANE_COMMANDS: StubCommand[] = [
  {
    verb: "open",
    flags: ["mission", "title", "scope", "done-when", "depends-on"],
    required: ["title"],
    summary: "Open an ownership track inside a mission or workstream.",
  },
  {
    verb: "list",
    flags: ["mission", "project", "status", "all-projects"],
    summary: "List lanes in scope.",
  },
  {
    verb: "show",
    flags: ["project", "all-projects", "lane", "id"],
    required: ["lane or id"],
    summary: "Show lane owner, scope, protected paths, queue items, blockers, and handoffs.",
  },
  {
    verb: "claim",
    flags: ["lane", "actor", "scope", "goal", "next", "refresh-by", "blocker"],
    required: ["lane", "actor", "scope", "goal", "next"],
    summary: "Claim or refresh lane ownership with exact scope and next step.",
  },
  {
    verb: "release",
    flags: ["lane", "actor", "handoff", "reason"],
    required: ["lane", "actor"],
    summary: "Release lane ownership after handoff or completion.",
  },
  {
    verb: "block",
    flags: ["lane", "reason", "depends-on", "escalate-to"],
    required: ["lane", "reason"],
    summary: "Mark a lane blocked and name the dependency or escalation path.",
  },
  {
    verb: "move",
    flags: ["lane", "status"],
    required: ["lane", "status"],
    summary: "Move a lane through idea/ready/active/review/blocked/done.",
  },
  {
    verb: "close",
    flags: ["lane", "reason", "verify"],
    required: ["lane"],
    summary: "Close a lane after result, verification, and handoff are recorded.",
  },
];

const LANE_STUB_OPTS = {
  noun: "lane",
  status: "available",
  docRef: DOC_REF,
  commands: LANE_COMMANDS,
};

type LaneRecord = {
  id: string;
  lane_id?: string;
  title: string;
  project_id?: string | null;
  mission_id?: string | null;
  status: string;
  updated_at?: string | null;
  actor_id?: string | null;
  scope?: string | null;
};

type LaneLoadResult = {
  context: WorkspaceScopeContext;
  items: LaneRecord[];
};

export async function runLane(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  const helpExit = maybeRunVerbHelp(args, LANE_STUB_OPTS);
  if (helpExit !== null) return helpExit;
  if (verb === "open") return runOpen(args);
  if (verb === "list") return runRecentList(args);
  if (verb === "show") return runShow(args);
  if (verb === "claim") return runClaim(args);
  if (verb === "move") return runMove(args);
  if (verb === "block") return runBlock(args);
  if (verb === "release") return runRelease(args);
  if (verb === "close") return runClose(args);

  return runStubContract(args, LANE_STUB_OPTS);
}

async function runOpen(args: ParsedArgs): Promise<number> {
  const title = flagString(args, "title");
  if (!title) {
    emitError("ema lane open: --title is required");
    return 64;
  }

  return sendWorkspaceCommand(args, "lane.open", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    name: title,
    project_id: flagString(args, "project") ?? null,
    mission_id: flagString(args, "mission") ?? null,
    scope: flagString(args, "scope") ?? null,
    done_when: flagString(args, "done-when") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
    section_id: flagString(args, "blueprint-section") ?? null,
    gac_id: flagString(args, "blueprint-gac") ?? null,
    decision_id: flagString(args, "blueprint-decision") ?? null,
    cadence: flagString(args, "cadence") ?? null,
  }, {
    human: `opened lane "${title}"`,
    resourceLabel: "lane",
  });
}

async function runClaim(args: ParsedArgs): Promise<number> {
  const lane = flagString(args, "lane");
  const scope = flagString(args, "scope");
  const goal = flagString(args, "goal");
  const next = flagString(args, "next");
  if (!lane || !scope || !goal || !next) {
    emitError("ema lane claim: --lane, --scope, --goal, and --next are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.claim", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    scope,
    goal,
    next,
    refresh_by: flagString(args, "refresh-by") ?? null,
    blocker: flagString(args, "blocker") ?? null,
  }, { human: `claimed lane ${lane}` });
}

async function runMove(args: ParsedArgs): Promise<number> {
  const lane = flagString(args, "lane");
  const status = flagString(args, "status");
  if (!lane || !status) {
    emitError("ema lane move: --lane and --status are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.move", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    status,
  }, { human: `moved lane ${lane} to ${status}` });
}

async function runBlock(args: ParsedArgs): Promise<number> {
  const lane = flagString(args, "lane");
  const reason = flagString(args, "reason");
  if (!lane || !reason) {
    emitError("ema lane block: --lane and --reason are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.block", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    reason,
    depends_on: flagString(args, "depends-on") ?? null,
    blocked_by: flagString(args, "escalate-to") ?? null,
  }, { human: `blocked lane ${lane}` });
}

async function runRelease(args: ParsedArgs): Promise<number> {
  const lane = flagString(args, "lane");
  if (!lane) {
    emitError("ema lane release: --lane is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.release", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    handoff_id: flagString(args, "handoff") ?? null,
    reason: flagString(args, "reason") ?? null,
  }, { human: `released lane ${lane}` });
}

async function runClose(args: ParsedArgs): Promise<number> {
  const lane = flagString(args, "lane");
  if (!lane) {
    emitError("ema lane close: --lane is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "lane.close", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    lane_id: lane,
    reason: flagString(args, "reason") ?? null,
    verify: flagString(args, "verify") ?? null,
  }, { human: `closed lane ${lane}` });
}

async function runShow(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const laneId = flagString(args, "lane") ?? flagString(args, "id");
  if (!laneId) {
    emitError("ema lane show: --lane or --id is required");
    return 64;
  }
  const lanes = await loadLanes(args);
  if (!lanes) return 1;
  const lane = lanes.items.find((item) => item.id === laneId || item.lane_id === laneId) ?? null;
  if (json) {
    emitJson({
      ok: lane !== null,
      source: "lane.registry",
      daemon_authority: "canonical_events",
      workspace_scope: lanes.context.scope,
      all_projects: lanes.context.allProjects,
      filter: lanes.context.allProjects ? "all_projects" : "project",
      lane,
      error: lane ? null : {
        class: "not_found",
        message: `lane not found in resolved workspace scope: ${laneId}`,
      },
    });
  }
  else if (!lane) emitPretty(`lane not found: ${laneId}`);
  else emitPretty(JSON.stringify(lane, null, 2));
  return lane ? 0 : 1;
}

async function runRecentList(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const lanes = await loadLanes(args);
  if (!lanes) return 1;
  const activeFilters = listFilters(args);
  const items = filterLanes(lanes.items, activeFilters);
  if (json) {
    emitJson({
      ok: true,
      source: "lane.registry",
      daemon_authority: "canonical_events",
      workspace_scope: lanes.context.scope,
      all_projects: lanes.context.allProjects,
      filter: lanes.context.allProjects ? "all_projects" : "project",
      filters: activeFilters,
      lanes: items,
    });
  } else {
    emitPretty("# lanes");
    if (activeFilters.length > 0) {
      emitPretty(`filters: ${activeFilters.map((f) => `${f.key}=${f.value}`).join(" ")}`);
    }
    if (items.length === 0) emitPretty("  (none)");
    for (const lane of items) {
      const owner = lane.actor_id ? ` owner=${lane.actor_id}` : "";
      const mission = lane.mission_id ? ` mission=${lane.mission_id}` : "";
      const updated = lane.updated_at ? ` updated=${lane.updated_at}` : "";
      emitPretty(`  ${lane.id} [${lane.status}] ${lane.title}${owner}${mission}${updated}`);
    }
  }
  return 0;
}

type ListFilter = { key: "status" | "mission"; value: string };

function listFilters(args: ParsedArgs): ListFilter[] {
  return [
    ["status", flagString(args, "status")],
    ["mission", flagString(args, "mission")],
  ].flatMap(([key, value]) =>
    value ? [{ key: key as ListFilter["key"], value }] : [],
  );
}

function filterLanes(items: LaneRecord[], filters: ListFilter[]): LaneRecord[] {
  if (filters.length === 0) return items;
  return items.filter((item) =>
    filters.every((filter) => {
      if (filter.key === "status") return item.status === filter.value;
      return item.mission_id === filter.value;
    }),
  );
}

async function loadLanes(args: ParsedArgs): Promise<LaneLoadResult | null> {
  const context = await workspaceScopeContext(args);
  const items = await readProjection(args, {
    name: "lane.registry",
    pick: (data) => (data.lanes as LaneRecord[] | undefined) ?? [],
  });
  if (!items) return null;
  return {
    context,
    items: filterProjectScopedRecords(items, context),
  };
}
