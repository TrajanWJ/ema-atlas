import { connect, DaemonUnreachableError } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { runStubContract } from "./stub-contract.js";

export async function runPing(args: ParsedArgs): Promise<number> {
  if (flagBool(args, "help") || args.flags.h === true || args.positional[0] === "help") {
    return runStubContract(args, {
      noun: "ping",
      status: "available",
      usage: "Usage: ema ping [--json]",
      docRef: "packages/contracts/ipc/shell-protocol.md",
      commands: [
        { verb: "run", flags: ["json"], summary: "Handshake with the daemon and print round-trip latency." },
      ],
    });
  }
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const rtt = await c.ping();
    if (json) {
      emitJson({
        ok: true,
        rtt_ms: rtt,
        daemon_version: c.hello?.daemon_version ?? null,
        device_id: c.hello?.accepted_device_id ?? null,
      });
    } else {
      emitPretty(
        `ema ping: ${rtt}ms (daemon ${c.hello?.daemon_version ?? "?"}, ` +
          `device ${c.hello?.accepted_device_id ?? "unassigned"})`
      );
    }
    c.close();
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

export function reportError(err: unknown, json: boolean): number {
  const isUnreachable = err instanceof DaemonUnreachableError;
  const msg = err instanceof Error ? err.message : String(err);
  if (json) {
    emitJson({
      ok: false,
      error: {
        class: isUnreachable ? "unavailable" : "internal",
        message: msg,
      },
    });
  } else {
    emitError(`ema: ${msg}`);
    if (isUnreachable) {
      emitError("      Start the daemon with: bash scripts/dev-daemon.sh");
    }
  }
  return isUnreachable ? 2 : 1;
}
