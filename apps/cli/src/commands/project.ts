import { connect } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";
import { projectRegistry } from "./substrate-utils.js";

export async function runProject(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "project",
      status: "available",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "create", flags: ["org", "space", "name"], required: ["org", "space", "name"], summary: "Create a project inside an organization space." },
        { verb: "registry show", flags: ["project"], summary: "Show local project registry metadata and acceptance commands." },
      ],
    });
  }
  if (sub === "registry") return registry(args);
  if (sub !== "create") {
    emitError(`ema project: unknown subcommand "${sub ?? ""}" (expected: create | registry)`);
    return 64;
  }

  const json = flagBool(args, "json");
  const orgId = flagString(args, "org");
  const spaceId = flagString(args, "space");
  const name = flagString(args, "name") ?? args.positional.slice(1).join(" ");

  if (!orgId || !spaceId || !name.trim()) {
    emitError(`ema project create: missing --org, --space, or --name`);
    emitError(`Usage: ema project create --org org:<id> --space space:<id> --name "EMA 0.0.6"`);
    return 64;
  }

  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command("project.create", {
      org_id: orgId,
      space_id: spaceId,
      name,
    });
    c.close();

    if (result.ok !== true) {
      if (json) emitJson({ ok: false, error: result.error });
      else emitError(`ema project create: ${result.error.class}: ${result.error.message}`);
      return 1;
    }

    const events = result.events ?? [];
    if (json) {
      emitJson({ ok: true, org_id: orgId, space_id: spaceId, name, events });
    } else {
      emitPretty(`created project: ${name}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

function registry(args: ParsedArgs): number {
  const verb = args.positional[1] ?? "show";
  if (verb !== "show") {
    emitError(`ema project registry: unknown subcommand "${verb}" (expected: show)`);
    return 64;
  }
  const project = flagString(args, "project") ?? args.positional[2] ?? "proslync-app-ios-final";
  const payload = projectRegistry(project);
  if (flagBool(args, "json")) emitJson(payload);
  else {
    emitPretty(`${payload.project}: ${payload.client ?? "project"}`);
    for (const build of payload.active_builds) emitPretty(`  ${build.id}: ${build.exists ? "present" : "missing"} ${build.path}`);
  }
  return 0;
}
