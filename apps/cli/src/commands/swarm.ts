import { emitJson, emitPretty, emitError } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { runStubContract } from "./stub-contract.js";

// Wave 1: these commands print a documented-not-implemented note and exit 0.
// Grammar mirrors docs/cli/see-agent-work.md (Swarm Commands section).

const DOC_REF = "docs/cli/see-agent-work.md";

export async function runSwarm(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0];
  const json = flagBool(args, "json");
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "swarm",
      status: "stubbed_projection_seed",
      docRef: DOC_REF,
      commands: [
        { verb: "list", flags: ["project"], summary: "List swarms for a project." },
        { verb: "show", flags: ["swarm"], summary: "Show one swarm." },
        { verb: "start", flags: ["swarm"], summary: "Start a swarm when the backend writer exists." },
        { verb: "pause", flags: ["swarm"], summary: "Pause a swarm when the backend writer exists." },
        { verb: "stop", flags: ["swarm"], summary: "Stop a swarm when the backend writer exists." },
        { verb: "status", flags: ["swarm"], summary: "Show swarm status from the current projection seed." },
        { verb: "report", flags: ["swarm"], summary: "Generate a swarm report from available state." },
      ],
    });
  }

  switch (sub) {
    case "list":
      return stub("swarm list", { project: flagString(args, "project") ?? null }, json);
    case "show":
      return stub("swarm show", { swarm: flagString(args, "swarm") ?? null }, json);
    case "start":
    case "pause":
    case "stop":
    case "status":
    case "report":
      return stub(`swarm ${sub}`, { swarm: flagString(args, "swarm") ?? null }, json);
    default:
      emitError(
        `ema swarm: unknown subcommand "${sub ?? ""}" ` +
          `(expected: list | show | start | pause | stop | status | report)`
      );
      emitError(`See ${DOC_REF} for the full grammar.`);
      return 64;
  }
}

function stub(name: string, args: Record<string, unknown>, json: boolean): number {
  const note = `not yet implemented; command grammar defined in ${DOC_REF}`;
  if (json) {
    emitJson({ ok: true, command: name, args, note });
  } else {
    emitPretty(`ema ${name}: ${note}`);
    for (const [k, v] of Object.entries(args)) {
      if (v !== null && v !== undefined) emitPretty(`  --${k} ${String(v)}`);
    }
  }
  return 0;
}
