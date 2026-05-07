import { connect } from "../ws-client.js";
import { emitJson, emitPretty } from "../output.js";
import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { resolveWorkspaceScope } from "../workspace-scope.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";

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
  if (flagBool(args, "help") || args.flags.h === true || args.positional[0] === "help") {
    return runStubContract(args, {
      noun: "status",
      status: "available",
      usage: "Usage: ema status [--project <name-or-id>] [--all-projects] [--json]",
      docRef: "docs/cli/agent-workspace.md",
      commands: [
        { verb: "show", flags: ["project", "all-projects", "json"], summary: "Print home-current topbar selection plus resolved workspace scope." },
      ],
    });
  }
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

    const workspaceScope = await resolveWorkspaceScope({ args });
    const homeCurrent = {
      source: "topbar_projection",
      org: data.current_org ?? null,
      space: data.current_space ?? null,
      project: data.current_project ?? null,
      node_state: data.node_state ?? null,
    };
    const scopeWarning =
      homeCurrent.project?.id &&
      workspaceScope.project_id &&
      homeCurrent.project.id !== workspaceScope.project_id
        ? `home_current project ${homeCurrent.project.name} (${homeCurrent.project.id}) differs from workspace_scope project ${workspaceScope.project_name ?? "(unnamed)"} (${workspaceScope.project_id}); workspace commands use workspace_scope unless --project overrides it.`
        : null;

    if (json) {
      emitJson({
        ok: true,
        org: data.current_org ?? null,
        space: data.current_space ?? null,
        project: data.current_project ?? null,
        node_state: data.node_state ?? null,
        home_current: homeCurrent,
        workspace_scope: workspaceScope,
        scope_warning: scopeWarning,
        scope_note:
          "org/space/project are the daemon topbar home_current selection; workspace_scope is the flag/env/cwd-resolved project scope used by workspace commands.",
      });
    } else {
      emitPretty("# home current (topbar projection)");
      emitPretty(`org:     ${fmt(data.current_org)}`);
      emitPretty(`space:   ${fmt(data.current_space)}`);
      emitPretty(`project: ${fmt(data.current_project)}`);
      if (data.node_state) emitPretty(`node:    ${data.node_state}`);
      emitPretty("");
      emitPretty("# workspace scope (flags/env/cwd resolver)");
      emitPretty(`project: ${workspaceScope.project_name ?? "(unresolved)"} (${workspaceScope.project_id ?? "no id"})`);
      emitPretty(`source:  ${workspaceScope.resolution_source}`);
      emitPretty(`cwd:     ${workspaceScope.cwd}`);
      if (scopeWarning) emitPretty(`warning: ${scopeWarning}`);
      if (workspaceScope.note) emitPretty(`note:    ${workspaceScope.note}`);
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
