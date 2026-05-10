import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { DEFAULT_ACTOR, DEFAULT_ORG, filterProjectScopedRecords, readProjection, sendWorkspaceCommand, workspaceScopeContext } from "./workspace-daemon.js";
import { runStubContract } from "./stub-contract.js";

const DOC_REF = "docs/cli/see-agent-work.md";

type Swarm = {
  id: string;
  swarm_id?: string;
  title?: string;
  status?: string;
  project_id?: string | null;
  campaign_id?: string | null;
  reason?: string | null;
  result?: string | null;
};

type ScopeClaim = {
  id: string;
  claim_id?: string;
  actor_id?: string | null;
  owner_id?: string | null;
  owner_kind?: string | null;
  project_id?: string | null;
  path?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

export async function runSwarm(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runSwarmHelp(args);
  if (verb === "create") return createSwarm(args);
  if (verb === "scope-claim") return scopeClaim(args);
  if (verb === "scope-registry" || verb === "scope") return listScopeClaims(args);
  if (verb === "start") return changeSwarm(args, "swarm.start", "started");
  if (verb === "pause") return changeSwarm(args, "swarm.pause", "paused");
  if (verb === "stop") return changeSwarm(args, "swarm.stop", "stopped");
  if (verb === "report") return reportSwarm(args);
  if (verb === "status") return showSwarm(args);
  if (verb === "show") return showSwarm(args);
  return listSwarms(args);
}

function runSwarmHelp(args: ParsedArgs): number {
  return runStubContract(args, {
    noun: "swarm",
    status: "available",
    docRef: DOC_REF,
    commands: [
      { verb: "create", flags: ["name", "project", "mission", "campaign"], required: ["name"], summary: "Create a coordinated swarm under the resolved workspace scope." },
      { verb: "list", flags: ["project", "all-projects", "json"], summary: "List swarms in the resolved workspace scope." },
      { verb: "show", flags: ["swarm"], required: ["swarm"], summary: "Show one swarm from swarm.registry." },
      { verb: "status", flags: ["swarm"], required: ["swarm"], summary: "Show current status for a swarm (alias of show)." },
      { verb: "start", flags: ["swarm"], required: ["swarm"], summary: "Move a swarm to started." },
      { verb: "pause", flags: ["swarm", "reason"], required: ["swarm"], summary: "Pause a swarm with an optional reason." },
      { verb: "stop", flags: ["swarm", "reason"], required: ["swarm"], summary: "Stop a swarm with an optional reason." },
      { verb: "report", flags: ["swarm", "summary"], required: ["swarm"], summary: "Append a swarm report event with an optional summary." },
      { verb: "scope-claim", flags: ["path", "scope", "swarm", "project"], required: ["path"], summary: "Claim an edit path through daemon-enforced scope.registry overlap checks." },
      { verb: "scope-registry", flags: ["project", "all-projects", "json"], summary: "List active edit path claims from scope.registry." },
    ],
  });
}

async function createSwarm(args: ParsedArgs): Promise<number> {
  const name = flagString(args, "name") ?? flagString(args, "title");
  if (!name) {
    emitError("ema swarm create: --name is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "swarm.create", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    name,
    title: name,
    project_id: flagString(args, "project") ?? null,
    mission_id: flagString(args, "mission") ?? null,
    campaign_id: flagString(args, "campaign") ?? null,
  }, { human: `created swarm "${name}"`, resourceLabel: "swarm" });
}

async function changeSwarm(args: ParsedArgs, op: string, label: string): Promise<number> {
  const swarm = flagString(args, "swarm");
  if (!swarm) {
    emitError(`ema swarm ${args.positional[0] ?? "change"}: --swarm is required`);
    return 64;
  }
  return sendWorkspaceCommand(args, op, {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    swarm_id: swarm,
    reason: flagString(args, "reason") ?? null,
  }, { human: `${label} swarm ${swarm}` });
}

async function reportSwarm(args: ParsedArgs): Promise<number> {
  const swarm = flagString(args, "swarm");
  if (!swarm) {
    emitError("ema swarm report: --swarm is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "swarm.report", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    swarm_id: swarm,
    body: flagString(args, "summary") ?? flagString(args, "body") ?? null,
  }, { human: `recorded swarm report for ${swarm}`, resourceLabel: "swarm_report" });
}

async function scopeClaim(args: ParsedArgs): Promise<number> {
  const path = flagString(args, "path") ?? flagString(args, "scope");
  if (!path) {
    emitError("ema swarm scope-claim: --path is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "swarm.scope_claim", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    swarm_id: flagString(args, "swarm") ?? null,
    project_id: flagString(args, "project") ?? null,
    scope: path,
  }, { human: `claimed edit scope ${path}`, resourceLabel: "scope_claim" });
}

async function listScopeClaims(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const context = await workspaceScopeContext(args);
  const claims = await readProjection(args, {
    name: "scope.registry",
    pick: (data) => (data.claims as ScopeClaim[] | undefined) ?? [],
  });
  if (!claims) return 1;
  const scoped = filterProjectScopedRecords(claims, context);
  if (json) emitJson({ ok: true, source: "scope.registry", claims: scoped });
  else {
    emitPretty("# scope claims");
    if (scoped.length === 0) emitPretty("  (none)");
    for (const claim of scoped) {
      emitPretty(`  ${claim.id} [${claim.status ?? "unknown"}] ${claim.path ?? ""}`);
      if (claim.actor_id) emitPretty(`    actor: ${claim.actor_id}`);
      if (claim.owner_id) emitPretty(`    owner: ${claim.owner_kind ?? "owner"} ${claim.owner_id}`);
    }
  }
  return 0;
}

async function listSwarms(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const swarms = await loadSwarms(args);
  if (!swarms) return 1;
  if (json) emitJson({ ok: true, source: "swarm.registry", swarms });
  else {
    emitPretty("# swarms");
    if (swarms.length === 0) emitPretty("  (none)");
    for (const swarm of swarms) emitPretty(`  ${swarm.id} [${swarm.status ?? "unknown"}] ${swarm.title ?? ""}`);
  }
  return 0;
}

async function showSwarm(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const id = flagString(args, "swarm");
  if (!id) {
    emitError("ema swarm show: --swarm is required");
    return 64;
  }
  const swarms = await loadSwarms(args);
  if (!swarms) return 1;
  const swarm = swarms.find((item) => item.id === id || item.swarm_id === id) ?? null;
  if (json) emitJson({ ok: true, source: "swarm.registry", swarm });
  else if (swarm) emitPretty(JSON.stringify(swarm, null, 2));
  else emitPretty(`swarm not found: ${id}`);
  return swarm ? 0 : 1;
}

async function loadSwarms(args: ParsedArgs): Promise<Swarm[] | null> {
  const context = await workspaceScopeContext(args);
  const items = await readProjection(args, {
    name: "swarm.registry",
    pick: (data) => (data.swarms as Swarm[] | undefined) ?? [],
  });
  if (!items) return null;
  return filterProjectScopedRecords(items, context);
}
