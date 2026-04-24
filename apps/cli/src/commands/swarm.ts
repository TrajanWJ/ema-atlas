import { emitJson, emitPretty, emitError } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";

// Wave 1: these commands print a documented-not-implemented note and exit 0.
// Grammar mirrors docs/cli/see-agent-work.md (Swarm Commands section).

const DOC_REF = "docs/cli/see-agent-work.md";

export async function runSwarm(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0];
  const json = flagBool(args, "json");

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
