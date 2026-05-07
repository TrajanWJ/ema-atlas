import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";

const execFileAsync = promisify(execFile);

export async function runRecovery(args: ParsedArgs): Promise<number> {
  const verb = args.positional[0] ?? "scan";
  if (flagBool(args, "help") || args.flags.h === true || verb === "help") {
    return runHelp(args);
  }
  if (verb === "scan") return runScan(args);
  emitError(`ema recovery: unknown subcommand "${verb}" (expected: scan)`);
  return 64;
}

function runHelp(args: ParsedArgs): number {
  const commands = [
    { verb: "scan", summary: "Read-only desktop-wide donor/lost-work scan." },
  ];
  if (flagBool(args, "json")) {
    emitJson({ noun: "recovery", commands, policy: "donor projects are read-only" });
    return 0;
  }
  emitPretty("ema recovery - read-only donor and lost-work recovery tools");
  for (const command of commands) emitPretty(`  ${command.verb.padEnd(12)} ${command.summary}`);
  emitPretty("");
  emitPretty("Usage: ema recovery scan [--json] [--limit 250] [--max-depth 8] [--kind stale-queue] [--confidence high]");
  return 0;
}

async function runScan(args: ParsedArgs): Promise<number> {
  const script = "tooling/recovery/desktop-recovery-scan.mjs";
  const argv = [script];
  if (flagBool(args, "json")) argv.push("--json");
  const limit = flagString(args, "limit");
  const maxDepth = flagString(args, "max-depth");
  const source = flagString(args, "source");
  const kind = flagString(args, "kind");
  const confidence = flagString(args, "confidence");
  if (limit) argv.push("--limit", limit);
  if (maxDepth) argv.push("--max-depth", maxDepth);
  if (source) argv.push("--source", source);
  if (kind) argv.push("--kind", kind);
  if (confidence) argv.push("--confidence", confidence);
  try {
    const { stdout } = await execFileAsync("node", argv, {
      cwd: process.cwd(),
      maxBuffer: 20 * 1024 * 1024,
    });
    process.stdout.write(stdout);
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emitError(`ema recovery scan failed: ${message}`);
    return 1;
  }
}
