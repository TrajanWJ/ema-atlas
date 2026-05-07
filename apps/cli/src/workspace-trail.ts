import { connect } from "./ws-client.js";
import type { ParsedArgs } from "./args.js";
import {
  filterProjectScopedRecords,
  workspaceScopeContext,
  type WorkspaceScopeContext,
} from "./commands/workspace-daemon.js";

export type WorkspaceLaneRecord = {
  readonly id: string;
  readonly lane_id?: string;
  readonly title: string;
  readonly name?: string;
  readonly status: string;
  readonly project_id?: string | null;
  readonly mission_id?: string | null;
  readonly scope?: string | null;
  readonly done_when?: string | null;
  readonly depends_on?: string | null;
  readonly actor_id?: string | null;
  readonly updated_at?: string | null;
};

export type WorkspaceQueueRecord = {
  readonly id: string;
  readonly queue_item_id?: string;
  readonly title: string;
  readonly why: string;
  readonly status: string;
  readonly project_id?: string | null;
  readonly mission_id?: string | null;
  readonly lane_id?: string | null;
  readonly done_when?: string | null;
  readonly depends_on?: string | null;
  readonly blocked_by?: string | null;
  readonly source?: string | null;
  readonly updated_at?: string | null;
};

export type RecentWorkspaceTrail = {
  readonly source: "daemon_workspace_registry" | "unavailable";
  readonly daemon_authority: "canonical_events";
  readonly lanes: WorkspaceLaneRecord[];
  readonly queue: WorkspaceQueueRecord[];
  readonly workspace_scope: WorkspaceScopeContext["scope"] | null;
  readonly all_projects: boolean;
  readonly filter: "project" | "all_projects" | "unresolved";
  readonly note: string;
  readonly error?: string;
};

export async function loadRecentWorkspaceTrail(args?: ParsedArgs): Promise<RecentWorkspaceTrail> {
  const context = args ? await workspaceScopeContext(args) : null;
  try {
    const c = await connect({ surface: "desktop" });
    let lanes: WorkspaceLaneRecord[] | null = null;
    let queue: WorkspaceQueueRecord[] | null = null;

    const result = await new Promise<{
      lanes: WorkspaceLaneRecord[];
      queue: WorkspaceQueueRecord[];
    }>((resolve) => {
      const timer = setTimeout(() => resolve({
        lanes: lanes ?? [],
        queue: queue ?? [],
      }), 1200);
      const finish = () => {
        if (lanes && queue) {
          clearTimeout(timer);
          resolve({ lanes, queue });
        }
      };
      c.onMessage((msg) => {
        if (msg.type !== "projection") return;
        const name = (msg as { name?: string }).name;
        if (name === "lane.registry") {
          const data = (msg as { data?: { lanes?: WorkspaceLaneRecord[] } }).data;
          lanes = data?.lanes ?? [];
          finish();
        }
        if (name === "queue.registry") {
          const data = (msg as { data?: { queue_items?: WorkspaceQueueRecord[] } }).data;
          queue = data?.queue_items ?? [];
          finish();
        }
      });
      const projectId =
        context && !context.allProjects && context.scope.project_id
          ? context.scope.project_id
          : null;
      c.subscribe("lane.registry", projectId ? { project_id: projectId } : undefined);
      c.subscribe("queue.registry", projectId ? { project_id: projectId } : undefined);
    });
    c.close();

    const lanesScoped = context
      ? filterProjectScopedRecords(result.lanes, context)
      : result.lanes;
    const queueScoped = context
      ? filterProjectScopedRecords(result.queue, context)
      : result.queue;

    return {
      source: "daemon_workspace_registry",
      daemon_authority: "canonical_events",
      lanes: lanesScoped,
      queue: queueScoped,
      workspace_scope: context?.scope ?? null,
      all_projects: context?.allProjects ?? true,
      filter: context?.allProjects ? "all_projects" : context?.scope.project_id ? "project" : "unresolved",
      note: context?.allProjects
        ? "Daemon lane.registry and queue.registry are shown in aggregate because --all-projects was passed."
        : "Daemon lane.registry and queue.registry were subscribed with the resolved project_id; client-side filtering remains a defensive guard.",
    };
  } catch (err) {
    return {
      source: "unavailable",
      daemon_authority: "canonical_events",
      lanes: [],
      queue: [],
      workspace_scope: context?.scope ?? null,
      all_projects: context?.allProjects ?? false,
      filter: context?.allProjects ? "all_projects" : context?.scope.project_id ? "project" : "unresolved",
      note: "Could not read daemon workspace registries; file-backed workspace projection is stale fallback context only.",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
