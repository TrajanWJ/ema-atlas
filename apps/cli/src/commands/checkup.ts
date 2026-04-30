import { connect } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";

const DEFAULT_ORG = "org:01J00000000000000000000001";
const DEFAULT_ACTOR = "actor:dev-console";

export async function runCheckup(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "checkup",
      status: "available",
      docRef: "docs/cli/see-agent-work.md",
      commands: [
        { verb: "schedule", flags: ["lane", "cadence", "actor"], required: ["lane", "cadence"], summary: "Schedule a cadence-based lane checkup." },
        { verb: "complete", flags: ["checkup", "result", "actor"], required: ["checkup", "result"], summary: "Mark a scheduled checkup complete." },
      ],
    });
  }
  switch (sub) {
    case "schedule":
      return runSchedule(args);
    case "complete":
      return runComplete(args);
    default:
      emitError(
        `ema checkup: unknown subcommand "${sub ?? ""}" ` +
          `(expected: schedule | complete)`
      );
      emitError(`See docs/cli/see-agent-work.md §vCalendar for grammar.`);
      return 64;
  }
}

async function runSchedule(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const org = flagString(args, "org") ?? DEFAULT_ORG;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const lane = flagString(args, "lane");
  const cadence = flagString(args, "cadence");

  if (!lane || !cadence) {
    emitError(`ema checkup schedule: --lane and --cadence are required`);
    emitError(
      `Usage: ema checkup schedule --lane lane:<id> --cadence daily`
    );
    return 64;
  }

  return await send("checkup.schedule", {
    org_id: org,
    actor_id: actor,
    lane_id: lane,
    cadence,
  }, {
    json,
    human: `scheduled ${cadence} checkup on ${lane}`,
    resourceLabel: "checkup",
  });
}

async function runComplete(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  const org = flagString(args, "org") ?? DEFAULT_ORG;
  const actor = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const checkupId = flagString(args, "checkup");
  const result = flagString(args, "result");

  if (!checkupId || !result) {
    emitError(`ema checkup complete: --checkup and --result are required`);
    emitError(
      `Usage: ema checkup complete --checkup checkup:<id> --result "Ready for review"`
    );
    return 64;
  }

  return await send("checkup.complete", {
    org_id: org,
    actor_id: actor,
    checkup_id: checkupId,
    result,
  }, { json, human: `completed ${checkupId}: ${result}` });
}

async function send(
  op: string,
  argsObj: Record<string, unknown>,
  out: { json: boolean; human: string; resourceLabel?: string }
): Promise<number> {
  try {
    const c = await connect({ surface: "desktop" });
    const res = await c.command(op, argsObj);
    c.close();

    if (res.ok !== true) {
      if (out.json) emitJson({ ok: false, error: res.error });
      else emitError(`ema ${op}: ${res.error.class}: ${res.error.message}`);
      return 1;
    }

    const events = res.events ?? [];
    const resource = typeof res.resource === "string" ? res.resource : null;
    if (out.json) emitJson({ ok: true, op, args: argsObj, events, resource });
    else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "created"}: ${resource}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, out.json);
  }
}
