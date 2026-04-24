// Entry point for the `ema` binary.
//
// Dispatch is intentionally hand-rolled: stdlib-first, zero runtime-cost
// framework, and the grammar lives next to docs/cli/see-agent-work.md.

import { parseArgs } from "./args.js";
import { emitError } from "./output.js";
import { runHelp } from "./commands/help.js";
import { runPing } from "./commands/ping.js";
import { runStatus } from "./commands/status.js";
import { runEvents } from "./commands/events.js";
import { runSwarm } from "./commands/swarm.js";
import { runOrg } from "./commands/org.js";
import { runProject } from "./commands/project.js";

async function main(): Promise<number> {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);

  switch (cmd) {
    case undefined:
    case "help":
    case "--help":
    case "-h":
      return runHelp(args);
    case "ping":
      return runPing(args);
    case "status":
      return runStatus(args);
    case "events":
      return runEvents(args);
    case "org":
      return runOrg(args);
    case "project":
      return runProject(args);
    case "swarm":
      return runSwarm(args);
    default:
      emitError(`ema: unknown command "${cmd}"`);
      emitError(`Run "ema help" to list commands.`);
      return 64;
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    emitError(`ema: internal error: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    process.exit(1);
  }
);
