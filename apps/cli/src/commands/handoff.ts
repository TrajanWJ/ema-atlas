import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { DEFAULT_ACTOR, DEFAULT_ORG, filterProjectScopedRecords, readProjection, sendWorkspaceCommand, workspaceScopeContext } from "./workspace-daemon.js";
import { runStubContract } from "./stub-contract.js";

type Handoff = { id: string; handoff_id?: string; status?: string; project_id?: string | null; from?: string | null; to?: string | null; needed?: string | null };

export async function runHandoff(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runHandoffHelp(args);
  if (verb === "request") return requestHandoff(args);
  if (verb === "accept") return changeHandoff(args, "handoff.accept", "accepted");
  if (verb === "reject") return changeHandoff(args, "handoff.reject", "rejected");
  if (verb === "complete") return changeHandoff(args, "handoff.complete", "completed");
  return listHandoffs(args);
}

function runHandoffHelp(args: ParsedArgs): number {
  return runStubContract(args, {
    noun: "handoff",
    status: "available",
    docRef: "docs/cli/agent-workspace.md",
    commands: [
      { verb: "request", flags: ["from", "to", "needed", "context", "source", "verify", "depends-on"], required: ["from", "to", "needed"], summary: "Record a transfer contract between actors, lanes, or execution rails." },
      { verb: "list", flags: ["project", "all-projects", "json"], summary: "List handoffs in scope." },
      { verb: "accept", flags: ["handoff", "reason"], required: ["handoff"], summary: "Accept a requested handoff." },
      { verb: "reject", flags: ["handoff", "reason"], required: ["handoff"], summary: "Reject a requested handoff with a reason." },
      { verb: "complete", flags: ["handoff", "outcome", "verify"], required: ["handoff"], summary: "Mark a handoff complete." },
    ],
  });
}

async function requestHandoff(args: ParsedArgs): Promise<number> {
  const from = flagString(args, "from");
  const to = flagString(args, "to");
  const needed = flagString(args, "needed");
  if (!from || !to || !needed) {
    emitError("ema handoff request: --from, --to, and --needed are required");
    return 64;
  }
  return sendWorkspaceCommand(args, "handoff.request", {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? from,
    project_id: flagString(args, "project") ?? null,
    from,
    to,
    needed,
    context: flagString(args, "context") ?? null,
    source: flagString(args, "source") ?? null,
    verify: flagString(args, "verify") ?? null,
    depends_on: flagString(args, "depends-on") ?? null,
  }, { human: `requested handoff from ${from} to ${to}`, resourceLabel: "handoff" });
}

async function changeHandoff(args: ParsedArgs, op: string, label: string): Promise<number> {
  const handoff = flagString(args, "handoff");
  if (!handoff) {
    emitError(`ema handoff ${args.positional[0] ?? "change"}: --handoff is required`);
    return 64;
  }
  return sendWorkspaceCommand(args, op, {
    org_id: flagString(args, "org") ?? DEFAULT_ORG,
    actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
    handoff_id: handoff,
    reason: flagString(args, "reason") ?? null,
    outcome: flagString(args, "outcome") ?? null,
    verify: flagString(args, "verify") ?? null,
  }, { human: `${label} handoff ${handoff}` });
}

async function listHandoffs(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const context = await workspaceScopeContext(args);
  const raw = await readProjection(args, {
    name: "handoff.registry",
    pick: (data) => (data.handoffs as Handoff[] | undefined) ?? [],
  });
  if (!raw) return 1;
  const handoffs = filterProjectScopedRecords(raw, context);
  if (json) emitJson({ ok: true, source: "handoff.registry", handoffs });
  else {
    emitPretty("# handoffs");
    if (handoffs.length === 0) emitPretty("  (none)");
    for (const handoff of handoffs) emitPretty(`  ${handoff.id} [${handoff.status ?? "unknown"}] ${handoff.from ?? "?"} -> ${handoff.to ?? "?"}: ${handoff.needed ?? ""}`);
  }
  return 0;
}
