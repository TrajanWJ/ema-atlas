import { connect } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";

export async function runSpace(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "space",
      status: "available",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "create", flags: ["org", "name"], required: ["org", "name"], summary: "Create a space inside an organization." },
      ],
    });
  }
  if (sub !== "create") {
    emitError(`ema space: unknown subcommand "${sub ?? ""}" (expected: create)`);
    return 64;
  }

  const json = flagBool(args, "json");
  const orgId = flagString(args, "org");
  const name = flagString(args, "name") ?? args.positional.slice(1).join(" ");

  if (!orgId || !name.trim()) {
    emitError(`ema space create: missing --org or --name`);
    emitError(`Usage: ema space create --org org:<id> --name "App Work"`);
    return 64;
  }

  try {
    const c = await connect({ surface: "desktop" });
    const result = await c.command("space.create", {
      org_id: orgId,
      name,
    });
    c.close();

    if (result.ok !== true) {
      if (json) emitJson({ ok: false, error: result.error });
      else emitError(`ema space create: ${result.error.class}: ${result.error.message}`);
      return 1;
    }

    const events = result.events ?? [];
    if (json) {
      emitJson({ ok: true, org_id: orgId, name, events });
    } else {
      emitPretty(`created space: ${name}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
