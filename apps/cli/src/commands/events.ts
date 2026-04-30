import { connect, type EventEnvelope, type SubscriptionDropped } from "../ws-client.js";
import { emitJson, emitPretty, emitError } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";

export async function runEvents(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0];
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    return runStubContract(args, {
      noun: "events",
      status: "available",
      docRef: "packages/contracts/ipc/shell-protocol.md",
      commands: [
        { verb: "tail", flags: ["family", "kind", "since", "json"], summary: "Stream daemon events line-by-line until interrupted." },
      ],
    });
  }
  if (sub !== "tail") {
    emitError(`ema events: unknown subcommand "${sub ?? ""}" (expected: tail)`);
    return 64;
  }
  const json = flagBool(args, "json");
  const family = flagString(args, "family");
  const since = flagString(args, "since");
  const kindArg = flagString(args, "kind");
  // --kind accepts a comma-separated list and/or a trailing `.*` glob.
  // Examples: --kind blueprint.* / --kind lane.opened,queue_item.added
  const kindPatterns: string[] = kindArg ? kindArg.split(",").map((s) => s.trim()).filter(Boolean) : [];

  try {
    const c = await connect({ surface: "desktop" });

    // Note: `--since <txid>` — v0 protocol has no resume-from-txid semantic
    // (shell-protocol.md, Reconnect section). We still accept the flag for
    // forward-compat and annotate the human output.
    if (since && !json) {
      emitPretty(`# --since=${since} accepted (no-op in v0; projections snapshot on subscribe)`);
    }
    if (family && !json) {
      emitPretty(`# filtering to family: ${family}`);
    }

    function matchesKind(kind: string): boolean {
      if (kindPatterns.length === 0) return true;
      return kindPatterns.some((pat) => {
        if (pat.endsWith(".*")) return kind.startsWith(pat.slice(0, -1));
        if (pat.endsWith("*")) return kind.startsWith(pat.slice(0, -1));
        return kind === pat;
      });
    }

    c.onMessage((msg) => {
      if (msg.type === "event") {
        const env = msg as EventEnvelope;
        const kind = (env.event as { kind?: string }).kind ?? "";
        if (family && !kind.startsWith(family + ".") && kind !== family) return;
        if (!matchesKind(kind)) return;
        if (json) {
          emitJson(env.event);
        } else {
          emitPretty(JSON.stringify(env.event));
        }
      } else if (msg.type === "subscription_dropped") {
        const d = msg as SubscriptionDropped;
        emitError(`# subscription dropped on ${d.channel} (${d.reason}); re-subscribing`);
        c.subscribe(d.channel);
      }
    });

    // Subscribe to every v0 project-scoped "all" channel is not possible
    // without a project id. Wave-1 fallback: subscribe to the user's org
    // channel (using device id as a stand-in) and, if we later learn a
    // project id, add that subscription.
    const device = c.hello?.accepted_device_id ?? null;
    if (device) {
      c.subscribe(`user.${device}.orgs`);
    }

    // Keep the process alive until Ctrl-C.
    await new Promise<void>((resolve) => {
      const shutdown = () => {
        c.close();
        resolve();
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    });
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}
