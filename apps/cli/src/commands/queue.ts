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

const QUEUE_COMMANDS: StubCommand[] = [
  {
    verb: "add",
    flags: ["title", "project", "mission", "lane", "depends-on", "blocked-by", "why", "done-when", "source"],
    required: ["title", "why"],
    summary: "Log follow-up work discovered during execution, with dependency and done-when fields.",
  },
  {
    verb: "list",
    flags: ["project", "mission", "lane", "status", "all-projects"],
    summary: "List queued follow-ups and dependency blockers.",
  },
  {
    verb: "show",
    flags: ["project", "all-projects", "queue-item", "id"],
    required: ["queue-item or id"],
    summary: "Show a queue item, its dependencies, evidence, and ready condition.",
  },
  {
    verb: "ready",
    flags: ["queue-item", "reason"],
    required: ["queue-item"],
    summary: "Mark a queue item ready after dependencies clear.",
  },
  {
    verb: "block",
    flags: ["queue-item", "blocked-by", "reason"],
    required: ["queue-item", "blocked-by"],
    summary: "Record why a queue item cannot run yet.",
  },
  {
    verb: "close",
    flags: ["queue-item", "result", "verify"],
    required: ["queue-item"],
    summary: "Close a queue item with result and verification notes.",
  },
];

const QUEUE_STUB_OPTS = {
  noun: "queue",
  status: "available",
  docRef: DOC_REF,
  commands: QUEUE_COMMANDS,
};

type QueueRecord = {
  id: string;
  queue_item_id?: string;
  title: string;
  why: string;
  project_id?: string | null;
  mission_id?: string | null;
  status: string;
  lane_id?: string | null;
  depends_on?: string | null;
  blocked_by?: string | null;
  updated_at?: string | null;
};

type QueueLoadResult = {
  context: WorkspaceScopeContext;
  items: QueueRecord[];
};

export async function runQueue(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  const helpExit = maybeRunVerbHelp(args, QUEUE_STUB_OPTS);
  if (helpExit !== null) return helpExit;
  if (verb === "add") return runAdd(args);
  if (verb === "list") return runRecentList(args);
  if (verb === "show") return runShow(args);
  if (verb === "ready") return runReady(args);
  if (verb === "block") return runBlock(args);
  if (verb === "close") return runClose(args);

  return runStubContract(args, QUEUE_STUB_OPTS);
}

async function runAdd(args: ParsedArgs): Promise<number> {
  const title = flagString(args, "title");
  const why = flagString(args, "why");
  if (!title || !why) {
    emitError("ema queue add: --title and --why are required");
    return 64;
  }

  return sendWorkspaceCommand(args, "queue.add", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    name: title,
    reason: why,
    project_id: flagString(args, "project") ?? null,
    mission_id: flagString(args, "mission") ?? null,
    lane_id: flagString(args, "lane") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
    blocked_by: flagString(args, "blocked-by") ?? null,
    done_when: flagString(args, "done-when") ?? null,
    source: flagString(args, "source") ?? null,
    section_id: flagString(args, "blueprint-section") ?? null,
    gac_id: flagString(args, "blueprint-gac") ?? null,
    decision_id: flagString(args, "blueprint-decision") ?? null,
  }, {
    human: `queued "${title}"`,
    resourceLabel: "queue_item",
  });
}

async function runReady(args: ParsedArgs): Promise<number> {
  const item = flagString(args, "queue-item");
  if (!item) {
    emitError("ema queue ready: --queue-item is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "queue.ready", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    queue_item_id: item,
    reason: flagString(args, "reason") ?? null,
  }, { human: `marked queue item ready ${item}` });
}

async function runBlock(args: ParsedArgs): Promise<number> {
  const item = flagString(args, "queue-item");
  const blockedBy = flagString(args, "blocked-by");
  if (!item || !blockedBy) {
    emitError("ema queue block: --queue-item and --blocked-by are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "queue.block", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    queue_item_id: item,
    blocked_by: blockedBy,
    reason: flagString(args, "reason") ?? null,
  }, { human: `blocked queue item ${item}` });
}

async function runClose(args: ParsedArgs): Promise<number> {
  const item = flagString(args, "queue-item");
  if (!item) {
    emitError("ema queue close: --queue-item is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "queue.close", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    project_id: flagString(args, "project") ?? null,
    queue_item_id: item,
    result: flagString(args, "result") ?? null,
    verify: flagString(args, "verify") ?? null,
  }, { human: `closed queue item ${item}` });
}

async function runShow(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const itemId = queueShowItemId(args);
  if (!itemId) {
    emitError("ema queue show: --queue-item or --id is required");
    return 64;
  }
  const queue = await loadQueue(args);
  if (!queue) return 1;
  const item = queue.items.find((record) => record.id === itemId || record.queue_item_id === itemId) ?? null;
  if (json) {
    emitJson({
      ok: item !== null,
      source: "queue.registry",
      daemon_authority: "canonical_events",
      workspace_scope: queue.context.scope,
      all_projects: queue.context.allProjects,
      filter: queue.context.allProjects ? "all_projects" : "project",
      queue_item: item,
      error: item ? null : {
        class: "not_found",
        message: `queue item not found in resolved workspace scope: ${itemId}`,
      },
    });
  }
  else if (!item) emitPretty(`queue item not found: ${itemId}`);
  else emitPretty(JSON.stringify(item, null, 2));
  return item ? 0 : 1;
}

export function queueShowItemId(args: ParsedArgs): string | undefined {
  return flagString(args, "queue-item") ?? flagString(args, "id") ?? positionalShowId(args, "show");
}

function positionalShowId(args: ParsedArgs, verb: string): string | undefined {
  const offset = args.positional[0] === verb ? 1 : args.positional[1] === verb ? 2 : -1;
  return offset >= 0 ? args.positional[offset] : undefined;
}

async function runRecentList(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const queue = await loadQueue(args);
  if (!queue) return 1;
  const activeFilters = listFilters(args);
  const items = filterQueue(queue.items, activeFilters);
  if (json) {
    emitJson({
      ok: true,
      source: "queue.registry",
      daemon_authority: "canonical_events",
      workspace_scope: queue.context.scope,
      all_projects: queue.context.allProjects,
      filter: queue.context.allProjects ? "all_projects" : "project",
      filters: activeFilters,
      queue: items,
    });
  } else {
    emitPretty("# queue");
    if (activeFilters.length > 0) {
      emitPretty(`filters: ${activeFilters.map((f) => `${f.key}=${f.value}`).join(" ")}`);
    }
    if (items.length === 0) emitPretty("  (none)");
    for (const item of items) {
      const lane = item.lane_id ? ` lane=${item.lane_id}` : "";
      const mission = item.mission_id ? ` mission=${item.mission_id}` : "";
      const blocked = item.blocked_by ? ` blocked_by=${item.blocked_by}` : "";
      emitPretty(`  ${item.id} [${item.status}] ${item.title}${lane}${mission}${blocked}`);
    }
  }
  return 0;
}

type ListFilter = { key: "status" | "mission" | "lane"; value: string };

function listFilters(args: ParsedArgs): ListFilter[] {
  return [
    ["status", flagString(args, "status")],
    ["mission", flagString(args, "mission")],
    ["lane", flagString(args, "lane")],
  ].flatMap(([key, value]) =>
    value ? [{ key: key as ListFilter["key"], value }] : [],
  );
}

function filterQueue(items: QueueRecord[], filters: ListFilter[]): QueueRecord[] {
  if (filters.length === 0) return items;
  return items.filter((item) =>
    filters.every((filter) => {
      if (filter.key === "status") return item.status === filter.value;
      if (filter.key === "mission") return item.mission_id === filter.value;
      return item.lane_id === filter.value;
    }),
  );
}

async function loadQueue(args: ParsedArgs): Promise<QueueLoadResult | null> {
  const context = await workspaceScopeContext(args);
  const items = await readProjection(args, {
    name: "queue.registry",
    pick: (data) => (data.queue_items as QueueRecord[] | undefined) ?? [],
  });
  if (!items) return null;
  return {
    context,
    items: filterProjectScopedRecords(items, context),
  };
}
