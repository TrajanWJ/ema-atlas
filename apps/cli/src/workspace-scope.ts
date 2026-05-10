// Project / space scope resolver shared by every workspace-facing CLI command.
//
// Contract: docs/architecture/19-project-scoped-agent-workspaces.md.
//
// Resolution order:
//   1. Explicit flags  (--project, --space, --org)
//   2. Env vars        (EMA_PROJECT, EMA_SPACE, EMA_ORG)
//   3. cwd inference   (Projects/<name>, Projects/<name>/builds/<v>, Active builds/<build>)
//   4. Daemon current  (topbar projection)
//   5. Unresolved      — surfaced honestly; no implicit agent-workspace-vapp fallback.

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { join, relative, resolve as resolvePath, sep } from "node:path";
import type { ParsedArgs } from "./args.js";
import { flagString } from "./args.js";
import { connect } from "./ws-client.js";
import { DESKTOP_ROOT } from "./workspace-state.js";

const PROJECTS_DIR = join(DESKTOP_ROOT, "Projects");
const ACTIVE_BUILDS_DIR = join(DESKTOP_ROOT, "Active builds");
const DAEMON_PROJECTION_TIMEOUT_MS = 1500;

export type ResolutionSource =
  | "flag"
  | "env"
  | "cwd-project"
  | "cwd-build"
  | "cwd-active-build"
  | "daemon-current"
  | "unresolved";

export interface WorkspaceScope {
  readonly org_id: string | null;
  readonly space_id: string | null;
  readonly project_id: string | null;
  readonly project_name: string | null;
  readonly project_record: string | null;
  readonly active_build: string | null;
  readonly build_version: string | null;
  readonly build_record: string | null;
  readonly resolution_source: ResolutionSource;
  readonly cwd: string;
  readonly note: string | null;
}

export interface ResolveOptions {
  readonly args?: ParsedArgs;
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
}

interface DaemonProject {
  readonly id: string;
  readonly name: string;
  readonly org_id: string;
  readonly space_id: string;
  readonly local_path: string;
  readonly active_build?: string;
  readonly materialization_status: string;
}

interface DaemonTopbar {
  readonly current_org: { id: string; name: string } | null;
  readonly current_space: { id: string; name: string } | null;
  readonly current_project: { id: string; name: string } | null;
}

export async function resolveWorkspaceScope(opts: ResolveOptions = {}): Promise<WorkspaceScope> {
  const cwd = canonicalCwd(opts.cwd ?? process.cwd());
  const env = opts.env ?? process.env;
  const projects = mergeProjects(await loadDaemonProjects(), loadFileProjects());

  const flagProject = opts.args ? flagString(opts.args, "project") : undefined;
  const flagSpace = opts.args ? flagString(opts.args, "space") : undefined;
  const flagOrg = opts.args ? flagString(opts.args, "org") : undefined;

  const fromFlag = pickProject(projects, flagProject);
  if (flagProject && fromFlag) {
    return decorate(fromFlag, "flag", cwd, { spaceOverride: flagSpace, orgOverride: flagOrg });
  }
  if (flagProject && !fromFlag) {
    return unresolved(cwd, `--project "${flagProject}" did not match any daemon project record`);
  }

  const envProject = env.EMA_PROJECT;
  const fromEnv = pickProject(projects, envProject);
  if (envProject && fromEnv) {
    return decorate(fromEnv, "env", cwd, {
      spaceOverride: env.EMA_SPACE,
      orgOverride: env.EMA_ORG,
    });
  }
  if (envProject && !fromEnv) {
    return unresolved(cwd, `EMA_PROJECT="${envProject}" did not match any daemon project record`);
  }

  const cwdHit = inferFromCwd(cwd, projects);
  if (cwdHit) return cwdHit;

  const topbar = await loadDaemonTopbar();
  if (topbar?.current_project) {
    const match = pickProject(projects, topbar.current_project.id) ?? pickProject(projects, topbar.current_project.name);
    if (match) {
      return decorate(match, "daemon-current", cwd, {
        spaceOverride: topbar.current_space?.id,
        orgOverride: topbar.current_org?.id,
      });
    }
  }

  return unresolved(cwd, "no project resolved from flags, env, cwd, or daemon current project");
}

function canonicalCwd(raw: string): string {
  try {
    return realpathSync(raw);
  } catch {
    return resolvePath(raw);
  }
}

function decorate(
  project: DaemonProject,
  source: ResolutionSource,
  cwd: string,
  overrides: { spaceOverride?: string; orgOverride?: string },
): WorkspaceScope {
  const projectRecord = project.local_path && project.local_path.length > 0
    ? project.local_path
    : join(PROJECTS_DIR, project.name);
  const { activeBuild, buildVersion, buildRecord } = inferBuildPaths(project.name, projectRecord, cwd, project.active_build);
  return {
    org_id: nullIfEmpty(overrides.orgOverride ?? project.org_id),
    space_id: nullIfEmpty(overrides.spaceOverride ?? project.space_id),
    project_id: nullIfEmpty(project.id),
    project_name: project.name,
    project_record: projectRecord,
    active_build: activeBuild,
    build_version: buildVersion,
    build_record: buildRecord,
    resolution_source: source,
    cwd,
    note: null,
  };
}

function unresolved(cwd: string, why: string): WorkspaceScope {
  return {
    org_id: null,
    space_id: null,
    project_id: null,
    project_name: null,
    project_record: null,
    active_build: null,
    build_version: null,
    build_record: null,
    resolution_source: "unresolved",
    cwd,
    note: `${why}. Pass --project <name> or set EMA_PROJECT, or run from inside Projects/<name>/ or Active builds/<build>/.`,
  };
}

function pickProject(projects: DaemonProject[], needle: string | undefined): DaemonProject | null {
  if (!needle) return null;
  const lower = needle.toLowerCase();
  // Prefer an exact id match, then exact name (case-insensitive), then path match.
  return (
    projects.find((p) => p.id === needle) ??
    projects.find((p) => p.name.toLowerCase() === lower) ??
    projects.find((p) => p.local_path === needle) ??
    null
  );
}

function inferFromCwd(cwd: string, projects: DaemonProject[]): WorkspaceScope | null {
  // Match against daemon-tracked local_path first — most authoritative.
  const byLocalPath = projects
    .filter((p) => p.local_path && p.local_path.length > 0)
    .map((p) => ({ p, prefix: ensureTrailingSep(p.local_path) }))
    .filter(({ prefix }) => cwd === stripTrailingSep(prefix) || cwd.startsWith(prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (byLocalPath) {
    const project = byLocalPath.p;
    const projectRecord = project.local_path;
    const buildVersion = inferBuildVersionUnderProject(projectRecord, cwd);
    const buildRecord = buildVersion ? join(projectRecord, "builds", buildVersion) : null;
    return {
      org_id: nullIfEmpty(project.org_id),
      space_id: nullIfEmpty(project.space_id),
      project_id: nullIfEmpty(project.id),
      project_name: project.name,
      project_record: projectRecord,
      active_build: project.active_build ?? matchActiveBuildPath(project.name) ?? null,
      build_version: buildVersion,
      build_record: buildRecord,
      resolution_source: buildVersion ? "cwd-build" : "cwd-project",
      cwd,
      note: null,
    };
  }

  const byActiveBuild = projects
    .filter((p) => p.active_build && p.active_build.length > 0)
    .map((p) => ({ p, prefix: ensureTrailingSep(canonicalMaybe(p.active_build ?? "")) }))
    .filter(({ prefix }) => cwd === stripTrailingSep(prefix) || cwd.startsWith(prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (byActiveBuild) {
    const project = byActiveBuild.p;
    const projectRecord = project.local_path && project.local_path.length > 0
      ? project.local_path
      : join(PROJECTS_DIR, project.name);
    return {
      org_id: nullIfEmpty(project.org_id),
      space_id: nullIfEmpty(project.space_id),
      project_id: nullIfEmpty(project.id),
      project_name: project.name,
      project_record: projectRecord,
      active_build: canonicalMaybe(project.active_build ?? ""),
      build_version: null,
      build_record: null,
      resolution_source: "cwd-active-build",
      cwd,
      note: null,
    };
  }

  // Active builds inference: cwd may be /Desktop/Active builds/<build>/...
  const activePrefix = ensureTrailingSep(ACTIVE_BUILDS_DIR);
  if (cwd.startsWith(activePrefix) || cwd === ACTIVE_BUILDS_DIR) {
    const rel = cwd === ACTIVE_BUILDS_DIR ? "" : relative(ACTIVE_BUILDS_DIR, cwd);
    const buildName = rel.split(sep)[0] ?? "";
    if (buildName) {
      const { projectName, version } = parseBuildName(buildName);
      const project = pickProject(projects, projectName);
      if (project) {
        const projectRecord = project.local_path && project.local_path.length > 0
          ? project.local_path
          : join(PROJECTS_DIR, project.name);
        const activeBuild = join(ACTIVE_BUILDS_DIR, buildName);
        const buildRecord = version ? join(projectRecord, "builds", version) : null;
        return {
          org_id: nullIfEmpty(project.org_id),
          space_id: nullIfEmpty(project.space_id),
          project_id: nullIfEmpty(project.id),
          project_name: project.name,
          project_record: projectRecord,
          active_build: activeBuild,
          build_version: version,
          build_record: buildRecord,
          resolution_source: "cwd-active-build",
          cwd,
          note: null,
        };
      }
    }
  }

  return null;
}

function nullIfEmpty(value: string | undefined | null): string | null {
  return value && value.length > 0 ? value : null;
}

function inferBuildPaths(
  projectName: string,
  projectRecord: string,
  cwd: string,
  configuredActiveBuild?: string,
): { activeBuild: string | null; buildVersion: string | null; buildRecord: string | null } {
  const configured = configuredActiveBuild ? canonicalMaybe(configuredActiveBuild) : null;
  if (configured && (cwd === configured || cwd.startsWith(ensureTrailingSep(configured)))) {
    return {
      activeBuild: configured,
      buildVersion: null,
      buildRecord: null,
    };
  }
  const activePrefix = ensureTrailingSep(ACTIVE_BUILDS_DIR);
  if (cwd.startsWith(activePrefix)) {
    const buildName = relative(ACTIVE_BUILDS_DIR, cwd).split(sep)[0] ?? "";
    if (buildName) {
      const parsed = parseBuildName(buildName);
      if (sameProjectName(parsed.projectName, projectName)) {
        const activeBuild = join(ACTIVE_BUILDS_DIR, buildName);
        return {
          activeBuild,
          buildVersion: parsed.version,
          buildRecord: parsed.version ? join(projectRecord, "builds", parsed.version) : null,
        };
      }
    }
  }
  const buildVersion = inferBuildVersionUnderProject(projectRecord, cwd);
  return {
    activeBuild: configured ?? matchActiveBuildPath(projectName),
    buildVersion,
    buildRecord: buildVersion ? join(projectRecord, "builds", buildVersion) : null,
  };
}

function canonicalMaybe(raw: string): string {
  const clean = raw.replaceAll("\\ ", " ");
  try {
    return realpathSync(clean);
  } catch {
    return resolvePath(clean);
  }
}

function inferBuildVersionUnderProject(projectRecord: string, cwd: string): string | null {
  const buildsRoot = ensureTrailingSep(join(projectRecord, "builds"));
  if (!cwd.startsWith(buildsRoot)) return null;
  const rest = relative(join(projectRecord, "builds"), cwd);
  return rest.split(sep)[0] ?? null;
}

function matchActiveBuildPath(projectName: string): string | null {
  if (!existsSync(ACTIVE_BUILDS_DIR)) return null;
  const exact = join(ACTIVE_BUILDS_DIR, projectName);
  if (existsSync(exact) && isDirectory(exact)) return exact;
  try {
    const entries = readdirSync(ACTIVE_BUILDS_DIR);
    const prefixed = entries.find((name) => name.startsWith(`${projectName}-`));
    return prefixed ? join(ACTIVE_BUILDS_DIR, prefixed) : null;
  } catch {
    return null;
  }
}

function parseBuildName(buildName: string): { projectName: string; version: string | null } {
  // Convention: "<project>-<version>" where version starts with a digit.
  // Examples: "EMA-0.0.6" -> ("EMA", "0.0.6"); "life-manager" -> ("life-manager", null).
  const match = buildName.match(/^(.*)-(\d[\w.\-+]*)$/);
  if (match) return { projectName: match[1] ?? buildName, version: match[2] ?? null };
  return { projectName: buildName, version: null };
}

function sameProjectName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function ensureTrailingSep(path: string): string {
  return path.endsWith(sep) ? path : `${path}${sep}`;
}

function stripTrailingSep(path: string): string {
  return path.endsWith(sep) ? path.slice(0, -1) : path;
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

async function loadDaemonProjects(): Promise<DaemonProject[]> {
  try {
    const c = await connect({ surface: "desktop" });
    const projects = await new Promise<DaemonProject[]>((resolve) => {
      const timer = setTimeout(() => resolve([]), DAEMON_PROJECTION_TIMEOUT_MS);
      c.onMessage((msg) => {
        if (msg.type !== "projection") return;
        if ((msg as { name?: string }).name !== "project.filesystem_status") return;
        clearTimeout(timer);
        const data = (msg as { data?: { projects?: unknown[] } }).data;
        resolve(((data?.projects as unknown[] | undefined) ?? []).map(toDaemonProject));
      });
      c.subscribe("project.filesystem_status");
    });
    c.close();
    return projects;
  } catch {
    return [];
  }
}

function loadFileProjects(): DaemonProject[] {
  if (!existsSync(PROJECTS_DIR)) return [];
  const projectPaths = [
    ...projectRecordPaths(PROJECTS_DIR),
    ...projectRecordPaths(join(PROJECTS_DIR, "EMA", "subprojects")),
  ];
  return projectPaths.map(readFileProject).filter((project): project is DaemonProject => project !== null);
}

function projectRecordPaths(root: string): string[] {
  if (!existsSync(root)) return [];
  try {
    return readdirSync(root)
      .map((name) => join(root, name))
      .filter((path) => isDirectory(path) && existsSync(join(path, "project.md")));
  } catch {
    return [];
  }
}

function readFileProject(path: string): DaemonProject | null {
  try {
    const raw = readFileSync(join(path, "project.md"), "utf8");
    const meta = parseProjectMetadata(raw);
    const name = meta.name ?? path.split(sep).pop() ?? "";
    if (!name) return null;
    return {
      id: meta.project_id ?? "",
      name,
      org_id: meta.org_id ?? "",
      space_id: meta.space_id ?? "",
      local_path: path,
      active_build: meta.active_build ? resolveMetadataPath(path, meta.active_build) : undefined,
      materialization_status: meta.status ?? "file_record",
    };
  } catch {
    return null;
  }
}

export function parseProjectMetadata(raw: string): Record<string, string> {
  return {
    ...parseMarkdownFields(raw),
    ...parseFrontmatter(raw),
  };
}

function mergeProjects(daemon: DaemonProject[], fileProjects: DaemonProject[]): DaemonProject[] {
  const merged = new Map<string, DaemonProject>();
  for (const project of fileProjects) {
    merged.set(projectKey(project), project);
  }
  for (const project of daemon) {
    const existing = merged.get(projectKey(project));
    const orgId = preferTypedId(project.org_id, existing?.org_id, "org:");
    const spaceId = preferTypedId(project.space_id, existing?.space_id, "space:");
    merged.set(projectKey(project), {
      ...existing,
      ...project,
      id: project.id || existing?.id || "",
      org_id: orgId,
      space_id: spaceId,
      local_path: project.local_path || existing?.local_path || "",
      active_build: project.active_build || existing?.active_build,
      materialization_status: project.materialization_status || existing?.materialization_status || "",
    });
  }
  return [...merged.values()];
}

function preferTypedId(primary: string, fallback: string | undefined, prefix: string): string {
  if (primary.startsWith(prefix)) return primary;
  if (fallback?.startsWith(prefix)) return fallback;
  return primary || fallback || "";
}

function resolveMetadataPath(projectRecord: string, raw: string): string {
  const clean = raw.replaceAll("\\ ", " ");
  if (clean.startsWith("/")) return canonicalMaybe(clean);
  return canonicalMaybe(join(projectRecord, clean));
}

function projectKey(project: DaemonProject): string {
  return project.id || project.name.toLowerCase() || project.local_path;
}

function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^(?:\s*<!--[\s\S]*?-->\s*)*---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const out: Record<string, string> = {};
  for (const line of (match[1] ?? "").split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) out[key] = value.replace(/^["']|["']$/g, "");
  }
  return out;
}

function parseMarkdownFields(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*-\s*([a-zA-Z0-9_]+):\s*`?([^`]+?)`?\s*$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2]?.trim();
    if (key && value) out[key] = value;
  }
  return out;
}

async function loadDaemonTopbar(): Promise<DaemonTopbar | null> {
  try {
    const c = await connect({ surface: "desktop" });
    const topbar = await new Promise<DaemonTopbar | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), DAEMON_PROJECTION_TIMEOUT_MS);
      c.onMessage((msg) => {
        if (msg.type !== "projection") return;
        if ((msg as { name?: string }).name !== "topbar") return;
        clearTimeout(timer);
        const d = (msg as { data?: Record<string, unknown> }).data ?? {};
        resolve({
          current_org: pickIdName(d.current_org),
          current_space: pickIdName(d.current_space),
          current_project: pickIdName(d.current_project),
        });
      });
      const userId = c.hello?.accepted_device_id;
      if (userId) c.subscribe(`user.${userId}.orgs`);
    });
    c.close();
    return topbar;
  } catch {
    return null;
  }
}

function toDaemonProject(raw: unknown): DaemonProject {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: stringOr(r.project_id, "") || stringOr(r.id, ""),
    name: stringOr(r.name, ""),
    org_id: stringOr(r.org_id, ""),
    space_id: stringOr(r.space_id, ""),
    local_path: stringOr(r.local_path, ""),
    materialization_status: stringOr(r.status, "") || stringOr(r.materialization_status, ""),
  };
}

function pickIdName(raw: unknown): { id: string; name: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : null;
  const name = typeof r.name === "string" ? r.name : null;
  if (!id || !name) return null;
  return { id, name };
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}
