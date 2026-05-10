import { connect } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";

export async function runProject(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "project",
      status: "available",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "create", flags: ["org", "space", "name"], required: ["org", "space", "name"], summary: "Create a project inside an organization space." },
      ],
    });
  }
  if (sub !== "create") {
    emitError(`ema project: unknown subcommand "${sub ?? ""}" (expected: create)`);
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
