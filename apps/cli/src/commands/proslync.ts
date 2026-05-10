import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { dbStatus, projectRegistry } from "./substrate-utils.js";
import { buildReadiness } from "./readiness.js";

export async function runProslync(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "bootstrap";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help(args);
  if (verb !== "bootstrap") {
    emitError(`ema proslync: unknown subcommand "${verb}" (expected: bootstrap)`);
    return 64;
  }
  const scopedArgs = {
    ...args,
    flags: { ...args.flags, project: args.flags.project ?? "proslync-app-ios-final" },
  };
  const readiness = await buildReadiness(scopedArgs);
  const capability = readiness.capability;
  const required = ["lane", "queue", "agent", "harness", "intention", "db", "artifact", "execution"];
  const capabilityFailures = capability.capabilities.filter((item) =>
    required.includes(item.id) && (item.state === "missing" || item.state === "stubbed" || item.state === "roundtrip-failed" || item.state === "unsupported-provider-adapter")
  );
  const failures = [...readiness.report.blockers, ...capabilityFailures];
  const payload = {
    ok: readiness.report.proslync_execution_ready,
    command: "proslync.bootstrap",
    source: "proslync_acceptance_workpack",
    project: projectRegistry("proslync-app-ios-final"),
    database: dbStatus(),
    capability,
    readiness: readiness.report,
    blockers: readiness.report.blockers,
    capability_failures: capabilityFailures,
    failures,
    next_safe_commands: [
      "ema cockpit workpack --project proslync-app-ios-final --json",
      "ema lane list --project proslync-app-ios-final --json",
      "ema queue list --project proslync-app-ios-final --json",
      "ema intention list --project proslync-app-ios-final --state accepted --json",
      "ema execution list --project proslync-app-ios-final --json",
    ],
  };
  if (flagBool(args, "json")) emitJson(payload);
  else {
    emitPretty(`Proslync bootstrap: ${payload.ok ? "ready" : "blocked"}`);
    for (const command of payload.next_safe_commands) emitPretty(`  ${command}`);
  }
  return payload.ok ? 0 : 1;
}

function help(args: ParsedArgs): number {
  const commands = [{ verb: "bootstrap", summary: "Return Proslync-first acceptance workpack readiness." }];
  if (flagBool(args, "json")) emitJson({ noun: "proslync", status: "available", commands });
  else emitPretty("ema proslync bootstrap [--json]");
  return 0;
}
