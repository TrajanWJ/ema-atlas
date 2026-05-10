import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { connect } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { reportError } from "./ping.js";
import { resolveWorkspaceScope, type WorkspaceScope } from "../workspace-scope.js";

export const DEFAULT_ORG = "org:01J00000000000000000000001";
export const DEFAULT_ACTOR = "actor:dev-console";

export interface ProjectionWait<T> {
  name: string;
  pick(data: Record<string, unknown>): T;
}

export interface WorkspaceScopeContext {
  scope: WorkspaceScope;
  allProjects: boolean;
}

export type ProjectScopedRecord = {
  readonly project_id?: string | null;
};

export async function workspaceScopeContext(args: ParsedArgs): Promise<WorkspaceScopeContext> {
  return {
    scope: await resolveWorkspaceScope({ args }),
    allProjects: flagBool(args, "all-projects"),
  };
}

export function shellArg(value: string): string {
  return /^[A-Za-z0-9_./:@%+=,-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\"'\"'")}'`;
}

export function workspaceScopeFlagParts(
  scope: WorkspaceScope | null | undefined,
  allProjects = false,
): string[] {
  if (allProjects) return ["--all-projects"];
  const project = scope?.project_name ?? scope?.project_id ?? null;
  return project ? ["--project", project] : [];
}

export function renderEmaCommand(parts: readonly string[]): string {
  return ["ema", ...parts].map(shellArg).join(" ");
}

export function renderScopedEmaCommand(
  context: WorkspaceScopeContext | { scope: WorkspaceScope | null | undefined; allProjects?: boolean },
  parts: readonly string[],
): string {
  const scopeParts = workspaceScopeFlagParts(context.scope, context.allProjects ?? false);
  const firstFlag = parts.findIndex((part) => part.startsWith("--"));
  const insertAt = firstFlag === -1 ? parts.length : firstFlag;
  return renderEmaCommand([
    ...parts.slice(0, insertAt),
    ...scopeParts,
    ...parts.slice(insertAt),
  ]);
}

export function filterProjectScopedRecords<T extends ProjectScopedRecord>(
  records: readonly T[],
  context: WorkspaceScopeContext,
): T[] {
  if (context.allProjects) return [...records];
  const projectId = context.scope.project_id;
  if (!projectId) return [];
  return records.filter((record) => record.project_id === projectId);
}

function withResolvedWorkspaceScope(
  argsObj: Record<string, unknown>,
  context: WorkspaceScopeContext,
): Record<string, unknown> {
  if (context.allProjects) return argsObj;
  const scoped = { ...argsObj };
  if ("org_id" in scoped && context.scope.org_id) scoped.org_id = context.scope.org_id;
  if ("space_id" in scoped && context.scope.space_id) scoped.space_id = context.scope.space_id;
  if ("project_id" in scoped && context.scope.project_id) scoped.project_id = context.scope.project_id;
  return scoped;
}

export async function sendWorkspaceCommand(
  args: ParsedArgs,
  op: string,
  argsObj: Record<string, unknown>,
  out: { human: string; resourceLabel?: string },
): Promise<number> {
  const json = flagBool(args, "json");
  try {
    const scopeContext = await workspaceScopeContext(args);
    const c = await connect({ surface: "desktop" });
    const result = await c.command(op, withResolvedWorkspaceScope(argsObj, scopeContext));
    c.close();

    if (result.ok !== true) {
      if (json) {
        emitJson({
          ok: false,
          command: op,
          op,
          source: "daemon_command",
          daemon_authority: "canonical_events",
          events: [],
          resource: null,
          workspace_scope: scopeContext.scope,
          all_projects: scopeContext.allProjects,
          error: result.error,
          blocked_by: result.error?.class === "not_found" ? "missing_resource" : undefined,
        });
      }
      else emitError(`ema ${op}: ${result.error.class}: ${result.error.message}`);
      return 1;
    }

    const events = result.events ?? [];
    const resource = typeof result.resource === "string" ? result.resource : null;
    const warning = (result as { warning?: { class?: string; message?: string } }).warning ?? null;
    if (json) {
      emitJson({
        ok: true,
        command: op,
        op,
        source: "daemon_command",
        daemon_authority: "canonical_events",
        events,
        resource,
        warning,
        workspace_scope: scopeContext.scope,
        all_projects: scopeContext.allProjects,
      });
    }
    else {
      emitPretty(out.human);
      if (resource) emitPretty(`${out.resourceLabel ?? "resource"}: ${resource}`);
      emitPretty(`events: ${events.join(", ") || "(none returned)"}`);
      if (warning?.message) emitPretty(`[warn] ${warning.class ?? "warning"}: ${warning.message}`);
    }
    return 0;
  } catch (err) {
    return reportError(err, json);
  }
}

export async function readProjection<T>(
  args: ParsedArgs,
  spec: ProjectionWait<T>,
): Promise<T | null> {
  const json = flagBool(args, "json");
  try {
    const scopeContext = await workspaceScopeContext(args);
    const projectId =
      !scopeContext.allProjects && scopeContext.scope.project_id
        ? scopeContext.scope.project_id
        : null;
    const c = await connect({ surface: "desktop" });
    const value = await new Promise<T>((resolve) => {
      const timer = setTimeout(() => resolve(spec.pick({})), 1200);
      c.onMessage((msg) => {
        if (msg.type === "projection" && (msg as { name?: string }).name === spec.name) {
          clearTimeout(timer);
          resolve(spec.pick((msg as { data?: Record<string, unknown> }).data ?? {}));
        }
      });
      c.subscribe(spec.name, projectId ? { project_id: projectId } : undefined);
    });
    c.close();
    return value;
  } catch (err) {
    await reportError(err, json);
    return null;
  }
}

export async function readProjectionBatch(
  args: ParsedArgs,
  specs: readonly ProjectionWait<unknown>[],
  timeoutMs = 1200,
): Promise<unknown[]> {
  const json = flagBool(args, "json");
  if (specs.length === 0) return [];
  try {
    const scopeContext = await workspaceScopeContext(args);
    const projectId =
      !scopeContext.allProjects && scopeContext.scope.project_id
        ? scopeContext.scope.project_id
        : null;
    const c = await connect({ surface: "desktop" });
    const values = new Map<string, unknown>();
    const wanted = new Set(specs.map((spec) => spec.name));
    const result = await new Promise<unknown[]>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve(specs.map((spec) => values.has(spec.name) ? values.get(spec.name) : spec.pick({})));
      };
      const timer = setTimeout(finish, timeoutMs);
      c.onMessage((msg) => {
        const name = (msg as { name?: string }).name;
        if (msg.type !== "projection" || !name || !wanted.has(name) || values.has(name)) return;
        const spec = specs.find((candidate) => candidate.name === name);
        if (!spec) return;
        values.set(name, spec.pick((msg as { data?: Record<string, unknown> }).data ?? {}));
        if (values.size === wanted.size) {
          clearTimeout(timer);
          finish();
        }
      });
      for (const spec of specs) {
        c.subscribe(spec.name, projectId ? { project_id: projectId } : undefined);
      }
    });
    c.close();
    return result;
  } catch (err) {
    await reportError(err, json);
    return specs.map((spec) => spec.pick({}));
  }
}

export function requireFlag(value: string | undefined, message: string): string {
  if (!value) throw new Error(message);
  return value;
}
