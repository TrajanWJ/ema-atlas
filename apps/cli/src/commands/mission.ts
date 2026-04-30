import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { DEFAULT_ACTOR, DEFAULT_ORG, filterProjectScopedRecords, readProjection, sendWorkspaceCommand, workspaceScopeContext } from "./workspace-daemon.js";
import { runStubContract } from "./stub-contract.js";

type Mission = { id: string; mission_id?: string; title?: string; status?: string; project_id?: string | null; campaign_id?: string | null };

export async function runMission(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runMissionHelp(args);
  if (verb === "create") return createMission(args);
  if (verb === "start") return changeMission(args, "mission.start", "started");
  if (verb === "pause") return changeMission(args, "mission.pause", "paused");
  if (verb === "complete") return changeMission(args, "mission.complete", "completed");
  if (verb === "show") return showMission(args);
  return listMissions(args);
}

function runMissionHelp(args: ParsedArgs): number {
  return runStubContract(args, {
    noun: "mission",
    status: "available",
    docRef: "docs/cli/agent-workspace.md",
    commands: [
      { verb: "create", flags: ["campaign", "title", "project", "depends-on", "done-when"], required: ["title"], summary: "Create a goal-oriented bundle, optionally under a campaign." },
      { verb: "list", flags: ["project", "campaign", "all-projects", "json"], summary: "List missions in the resolved workspace scope." },
      { verb: "show", flags: ["mission"], required: ["mission"], summary: "Show one mission from mission.registry." },
      { verb: "start", flags: ["mission", "reason"], required: ["mission"], summary: "Move a mission to started." },
      { verb: "pause", flags: ["mission", "reason"], required: ["mission"], summary: "Pause a mission." },
      { verb: "complete", flags: ["mission", "result", "verify"], required: ["mission"], summary: "Complete a mission with result and verification notes." },
    ],
  });
}

async function createMission(args: ParsedArgs): Promise<number> {
  const title = flagString(args, "title");
  if (!title) {
    emitError("ema mission create: --title is required");
    return 64;
  }
  return sendWorkspaceCommand(args, "mission.create", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    campaign_id: flagString(args, "campaign") ?? null,
    title,
    project_id: flagString(args, "project") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
    done_when: flagString(args, "done-when") ?? null,
  }, { human: `created mission "${title}"`, resourceLabel: "mission" });
}

async function changeMission(args: ParsedArgs, op: string, label: string): Promise<number> {
  const mission = flagString(args, "mission");
  if (!mission) {
    emitError(`ema mission ${args.positional[0] ?? "change"}: --mission is required`);
    return 64;
  }
  return sendWorkspaceCommand(args, op, {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    mission_id: mission,
    reason: flagString(args, "reason") ?? null,
    result: flagString(args, "result") ?? null,
    verify: flagString(args, "verify") ?? null,
  }, { human: `${label} mission ${mission}` });
}

async function listMissions(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const missions = await loadMissions(args);
  if (!missions) return 1;
  if (json) emitJson({ ok: true, source: "mission.registry", missions });
  else {
    emitPretty("# missions");
    if (missions.length === 0) emitPretty("  (none)");
    for (const mission of missions) emitPretty(`  ${mission.id} [${mission.status ?? "unknown"}] ${mission.title ?? ""}`);
  }
  return 0;
}

async function showMission(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const id = flagString(args, "mission");
  if (!id) {
    emitError("ema mission show: --mission is required");
    return 64;
  }
  const missions = await loadMissions(args);
  if (!missions) return 1;
  const mission = missions.find((item) => item.id === id || item.mission_id === id) ?? null;
  if (json) emitJson({ ok: true, source: "mission.registry", mission });
  else if (mission) emitPretty(JSON.stringify(mission, null, 2));
  else emitPretty(`mission not found: ${id}`);
  return mission ? 0 : 1;
}

async function loadMissions(args: ParsedArgs): Promise<Mission[] | null> {
  const context = await workspaceScopeContext(args);
  const items = await readProjection(args, {
    name: "mission.registry",
    pick: (data) => (data.missions as Mission[] | undefined) ?? [],
  });
  if (!items) return null;
  return filterProjectScopedRecords(items, context);
}
