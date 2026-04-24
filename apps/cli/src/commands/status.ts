import { connect } from "../ws-client.js";
import { emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { reportError } from "./ping.js";

// Topbar arrives via a `projection` message, not via a channel subscribe — but
// per shell-protocol.md subscribes to a channel trigger a fresh snapshot.
// Wave 1: a dedicated projection subscription convention is not fully locked
// in for the topbar; we subscribe to the project-scoped channel only after we
// see the projection if we want events. For `ema status` we just wait for
// the first `topbar` projection after hello and print it.

const PROJECTION_TIMEOUT_MS = 5_000;

interface TopbarLike {
  current_org?: { id: string; name: string };
  current_space?: { id: string; name: string };
  current_project?: { id: string; name: string };
  node_state?: string;
}

export async function runStatus(args: ParsedArgs): Promise<number> {
  const json = flagBool(args, "json");
  try {
    const c = await connect({ surface: "desktop" });
    const data = await new Promise<TopbarLike>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("timed out waiting for topbar projection")),
        PROJECTION_TIMEOUT_MS
      );
      c.onMessage((msg) => {
        if (msg.type === "projection" && (msg as { name?: string }).name === "topbar") {
          clearTimeout(timer);
          resolve((msg as { data: TopbarLike }).data);
        }
      });
      // Subscribe to the user's org channel as a nudge to emit projections.
      // Daemon may also proactively send the topbar projection after hello.
      const userId = c.hello?.accepted_device_id ?? null;
      if (userId) c.subscribe(`user.${userId}.orgs`);
    });

    if (json) {
      emitJson({
        ok: true,
        org: data.current_org ?? null,
        space: data.current_space ?? null,
        project: data.current_project ?? null,
        node_state: data.node_state ?? null,
      });
    } else {
      emitPretty(`org:     ${fmt(data.current_org)}`);
      emitPretty(`space:   ${fmt(data.current_space)}`);
      emitPretty(`project: ${fmt(data.current_project)}`);
      if (data.node_state) emitPretty(`node:    ${data.node_state}`);
    }
    c.close();
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

function fmt(x: { id: string; name: string } | undefined): string {
  if (!x) return "(none)";
  return `${x.name} (${x.id})`;
}
