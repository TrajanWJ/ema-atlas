import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { capabilityReport } from "./capability.js";
import { projectRegistry } from "./substrate-utils.js";

export async function runBootstrap(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "status";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") return help(args);
  if (verb !== "status") {
    emitError(`ema bootstrap: unknown subcommand "${verb}" (expected: status)`);
    return 64;
  }
  const capability = await capabilityReport(args);
  const required = ["lane", "queue", "agent", "harness", "intention", "db", "artifact", "execution"];
  const failures = capability.capabilities.filter((item) =>
    required.includes(item.id) && (item.state === "missing" || item.state === "stubbed" || item.state === "roundtrip-failed" || item.state === "unsupported-provider-adapter")
  );
  const project = projectRegistry(capability.workspace_scope.project_name ?? "proslync-app-ios-final");
  const payload = {
    ok: capability.ok && failures.length === 0,
    command: "bootstrap.status",
    source: "cli_bootstrap_gate",
    project,
    capability,
    required,
    failures,
    next_safe_commands: [
      "ema status --json",
      "ema agent orient --project proslync-app-ios-final --json",
      "ema capability assert --required lane,queue,agent,harness,intention,db,artifact,execution --project proslync-app-ios-final --json",
      "ema db status --json",
      "ema execution list --project proslync-app-ios-final --json",
      "ema cockpit workpack --project proslync-app-ios-final --json",
    ],
  };
  if (flagBool(args, "json")) emitJson(payload);
  else {
    emitPretty(`bootstrap: ${payload.ok ? "ready" : "blocked"}`);
    if (failures.length) emitPretty(`failures: ${failures.map((item) => `${item.id}:${item.state}`).join(", ")}`);
    for (const command of payload.next_safe_commands) emitPretty(`  ${command}`);
  }
  return payload.ok ? 0 : 1;
}

function help(args: ParsedArgs): number {
  const commands = [{ verb: "status", summary: "Run the fast CLI/daemon/data readiness gate." }];
  if (flagBool(args, "json")) emitJson({ noun: "bootstrap", status: "available", commands });
  else emitPretty("ema bootstrap status --project proslync-app-ios-final [--json]");
  return 0;
}
