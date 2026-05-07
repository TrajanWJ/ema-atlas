import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { connect, type Client, type CommandResult } from "../ws-client.js";
import { DEFAULT_ACTOR, DEFAULT_ORG } from "./workspace-daemon.js";

const CWT_SOURCE_PREFIX = "cwt.shared_files:";

type CwtManifest = {
  generated_at?: string;
  counts?: Record<string, number | undefined>;
};

type RecordIndex = {
  records?: Array<{ id: string; path: string }>;
};

type CwtProject = {
  id?: string;
  org_id?: string;
  space_id?: string;
  name?: string;
  title?: string;
  kind?: string;
  status?: string;
  repo_url?: string | null;
  git_remote?: string | null;
  local_path?: string | null;
  default_branch?: string | null;
  tombstone?: boolean;
};

type CwtLane = {
  id?: string;
  org_id?: string;
  project_id?: string | null;
  mission_id?: string | null;
  title?: string;
  why?: string;
  done_when?: string;
  scope_json?: string | null;
  depends_on?: string | null;
  status?: string;
  tags?: string | null;
  local_daemon_mirror_id?: string | null;
  tombstone?: boolean;
};

type CwtQueue = {
  id?: string;
  org_id?: string;
  project_id?: string | null;
  lane_id?: string | null;
  title?: string;
  why?: string;
  done_when?: string;
  depends_on?: string | null;
  depends_on_json?: string | null;
  blocked_by?: string | null;
  blocked_by_json?: string | null;
  source?: string | null;
  priority?: number | null;
  status?: string;
  local_daemon_mirror_id?: string | null;
  tombstone?: boolean;
};

type CwtProblem = {
  id?: string;
  org_id?: string;
  project_id?: string | null;
  lane_id?: string | null;
  title?: string;
  why?: string;
  source?: string | null;
  status?: string;
  local_daemon_mirror_id?: string | null;
  tombstone?: boolean;
};

type DaemonProject = {
  id?: string;
  project_id?: string;
  name?: string;
  org_id?: string;
  space_id?: string;
};

type DaemonRecord = {
  id?: string;
  lane_id?: string;
  queue_item_id?: string;
  problem_id?: string;
  source?: string | null;
  scope?: string | null;
};

type Snapshot = {
  projects: CwtProject[];
  lanes: CwtLane[];
  queue: CwtQueue[];
  problems: CwtProblem[];
};

type Family = "lane" | "queue_item" | "problem";

type ImportResult = {
  family: Family;
  cwt_id: string | null;
  title: string;
  status: "imported" | "skipped" | "failed";
  daemon_id: string | null;
  events: string[];
  project_id?: string | null;
  reason?: string;
};

type ProjectResolution =
  | { ok: true; project_id: string | null; org_id: string | null }
  | { ok: false; reason: string };

type ProjectResolver = (projectId: string | null | undefined) => ProjectResolution;

export async function runCwtIngestWriter(
  args: ParsedArgs,
  root: string,
  manifest: CwtManifest,
): Promise<number> {
  const json = flagBool(args, "json");
  const dryRun = flagBool(args, "dry-run");
  const only = onlyFilter(args);
  const snapshot = await readSnapshot(root, only);

  if (dryRun) return emitDryRun(json, root, manifest, snapshot);
  return commit(args, root, manifest, snapshot, only);
}

function emitDryRun(
  json: boolean,
  root: string,
  manifest: CwtManifest,
  snapshot: Snapshot,
): number {
  const result = {
    ok: true,
    source: "cwt.shared_files",
    mode: "dry_run",
    root,
    generated_at: manifest.generated_at ?? null,
    counts: manifest.counts ?? {},
    project_storage: projectStoragePolicy(),
    candidates: {
      projects: snapshot.projects.map((project) => ({
        cwt_id: project.id ?? null,
        name: project.name ?? project.title ?? "(untitled project)",
        kind: project.kind ?? "project",
        status: project.status ?? "active",
        git: {
          target_driver: "git_worktree",
          versioning: "git",
          remote: project.git_remote ?? project.repo_url ?? null,
          default_branch: project.default_branch ?? "main",
          local_path: project.local_path ?? null,
        },
      })),
      lanes: snapshot.lanes.map((lane) => ({
        cwt_id: lane.id ?? null,
        title: lane.title ?? "(untitled lane)",
        status: lane.status ?? "open",
        project_id: lane.project_id ?? null,
        source_marker: lane.id ? marker(lane.id) : null,
      })),
      queue_items: snapshot.queue.map((item) => ({
        cwt_id: item.id ?? null,
        title: item.title ?? "(untitled)",
        why: item.why ?? "",
        done_when: item.done_when ?? "",
        project_id: item.project_id ?? null,
        priority: item.priority ?? null,
        source: item.id ? sourceWithMarker(item.id, item.source) : item.source ?? "cwt.shared_files",
      })),
      problems: snapshot.problems.map((problem) => ({
        cwt_id: problem.id ?? null,
        title: problem.title ?? "(untitled problem)",
        why: problem.why ?? "",
        project_id: problem.project_id ?? null,
        source_marker: problem.id ? marker(problem.id) : null,
      })),
    },
    promotion_boundary: "preview_only",
  };

  if (json) emitJson(result);
  else {
    emitPretty("CWT ingest dry-run");
    emitPretty(`root: ${root}`);
    emitPretty(`lane candidates: ${snapshot.lanes.length}`);
    emitPretty(`queue candidates: ${snapshot.queue.length}`);
    emitPretty(`problem candidates: ${snapshot.problems.length}`);
  }
  return 0;
}

async function commit(
  args: ParsedArgs,
  root: string,
  manifest: CwtManifest,
  snapshot: Snapshot,
  only: Set<string> | null,
): Promise<number> {
  const json = flagBool(args, "json");
  const actorId = flagString(args, "actor") ?? DEFAULT_ACTOR;
  const results: ImportResult[] = [];
  const laneMirror = new Map<string, string>();
  let client: Client | null = null;

  try {
    client = await connect({ surface: "desktop" });
    const daemonProjects = await readProjection<DaemonProject[]>(client, "project.filesystem_status", "projects");
    const daemonLanes = await readProjection<DaemonRecord[]>(client, "lane.registry", "lanes");
    const daemonQueue = await readProjection<DaemonRecord[]>(client, "queue.registry", "queue_items");
    const daemonProblems = await readProjection<DaemonRecord[]>(client, "problem.graph", "problems");
    const resolveProject = makeProjectResolver(snapshot.projects, daemonProjects);

    for (const lane of snapshot.lanes) {
      const result = await importLane(client, lane, resolveProject, actorId, daemonLanes);
      results.push(result);
      if (lane.id && result.daemon_id) laneMirror.set(lane.id, result.daemon_id);
      if (result.status === "imported" && result.daemon_id) {
        daemonLanes.push({ id: result.daemon_id, lane_id: result.daemon_id, scope: marker(lane.id ?? "") });
      }
    }

    for (const item of snapshot.queue) {
      const result = await importQueue(client, item, resolveProject, actorId, daemonQueue, laneMirror);
      results.push(result);
      if (result.status === "imported" && result.daemon_id) {
        daemonQueue.push({ id: result.daemon_id, queue_item_id: result.daemon_id, source: marker(item.id ?? "") });
      }
    }

    for (const problem of snapshot.problems) {
      const result = await importProblem(client, problem, resolveProject, actorId, daemonProblems, laneMirror);
      results.push(result);
      if (result.status === "imported" && result.daemon_id) {
        daemonProblems.push({ id: result.daemon_id, problem_id: result.daemon_id, source: marker(problem.id ?? "") });
      }
    }
  } catch (err) {
    const result = {
      ok: false,
      source: "cwt.shared_files",
      mode: "commit",
      root,
      generated_at: manifest.generated_at ?? null,
      error: err instanceof Error ? err.message : String(err),
      results,
    };
    if (json) emitJson(result);
    else emitError(result.error);
    return 1;
  } finally {
    client?.close();
  }

  const summary = summarize(results);
  const failures = results.filter((result) => result.status === "failed");
  const output = {
    ok: failures.length === 0,
    source: "cwt.shared_files",
    mode: "commit",
    root,
    generated_at: manifest.generated_at ?? null,
    daemon_authority: "canonical_events",
    filter: { all: flagBool(args, "all"), only: only ? [...only] : null },
    summary,
    results,
    promotion_boundary: "daemon_command_writer",
  };

  if (json) emitJson(output);
  else {
    emitPretty("CWT ingest commit");
    emitPretty(`imported: ${summary.imported}`);
    emitPretty(`skipped: ${summary.skipped}`);
    emitPretty(`failed: ${summary.failed}`);
    for (const failure of failures.slice(0, 8)) {
      emitPretty(`  [failed] ${failure.family} ${failure.cwt_id ?? "(no id)"}: ${failure.reason ?? "unknown"}`);
    }
  }
  return failures.length === 0 ? 0 : 1;
}

async function importLane(
  client: Client,
  lane: CwtLane,
  resolveProject: ProjectResolver,
  actorId: string,
  daemonLanes: DaemonRecord[],
): Promise<ImportResult> {
  const cwtId = lane.id ?? null;
  const title = lane.title ?? "(untitled lane)";
  if (!cwtId) return failed("lane", cwtId, title, "missing cwt id");
  const existing = findMirrored(daemonLanes, cwtId, (record) => record.scope);
  if (existing) return skipped("lane", cwtId, title, daemonId(existing));
  if (lane.local_daemon_mirror_id) return skipped("lane", cwtId, title, lane.local_daemon_mirror_id);
  const project = resolveProject(lane.project_id);
  if (!project.ok) return failed("lane", cwtId, title, project.reason);
  const result = await commandOrFailure(client, "lane.open", {
    org_id: lane.org_id ?? project.org_id ?? DEFAULT_ORG,
    actor_id: actorId,
    name: title,
    project_id: project.project_id,
    mission_id: lane.mission_id ?? null,
    scope: laneScope(lane),
    done_when: lane.done_when ?? lane.why ?? null,
    depends_on: lane.depends_on ?? null,
  }, "lane", cwtId, title, project.project_id);
  if (isImportResult(result)) return result;
  return commandResult("lane", cwtId, title, project.project_id, result);
}

async function importQueue(
  client: Client,
  item: CwtQueue,
  resolveProject: ProjectResolver,
  actorId: string,
  daemonQueue: DaemonRecord[],
  laneMirror: Map<string, string>,
): Promise<ImportResult> {
  const cwtId = item.id ?? null;
  const title = item.title ?? "(untitled queue item)";
  if (!cwtId) return failed("queue_item", cwtId, title, "missing cwt id");
  if (!item.why?.trim()) return failed("queue_item", cwtId, title, "missing why");
  if (!item.done_when?.trim()) return failed("queue_item", cwtId, title, "missing done_when");
  const existing = findMirrored(daemonQueue, cwtId, (record) => record.source);
  if (existing) return skipped("queue_item", cwtId, title, daemonId(existing));
  if (item.local_daemon_mirror_id) return skipped("queue_item", cwtId, title, item.local_daemon_mirror_id);
  const project = resolveProject(item.project_id);
  if (!project.ok) return failed("queue_item", cwtId, title, project.reason);
  const result = await commandOrFailure(client, "queue.add", {
    org_id: item.org_id ?? project.org_id ?? DEFAULT_ORG,
    actor_id: actorId,
    name: title,
    reason: item.why,
    project_id: project.project_id,
    mission_id: null,
    lane_id: item.lane_id ? laneMirror.get(item.lane_id) ?? null : null,
    depends_on: firstJsonString(item.depends_on_json) ?? item.depends_on ?? null,
    blocked_by: firstJsonString(item.blocked_by_json) ?? item.blocked_by ?? null,
    done_when: item.done_when,
    source: sourceWithMarker(cwtId, item.source),
  }, "queue_item", cwtId, title, project.project_id);
  if (isImportResult(result)) return result;
  return commandResult("queue_item", cwtId, title, project.project_id, result);
}

async function importProblem(
  client: Client,
  problem: CwtProblem,
  resolveProject: ProjectResolver,
  actorId: string,
  daemonProblems: DaemonRecord[],
  laneMirror: Map<string, string>,
): Promise<ImportResult> {
  const cwtId = problem.id ?? null;
  const title = problem.title ?? "(untitled problem)";
  if (!cwtId) return failed("problem", cwtId, title, "missing cwt id");
  const existing = findMirrored(daemonProblems, cwtId, (record) => record.source);
  if (existing) return skipped("problem", cwtId, title, daemonId(existing));
  if (problem.local_daemon_mirror_id) return skipped("problem", cwtId, title, problem.local_daemon_mirror_id);
  const project = resolveProject(problem.project_id);
  if (!project.ok) return failed("problem", cwtId, title, project.reason);
  const result = await commandOrFailure(client, "problem.log", {
    org_id: problem.org_id ?? project.org_id ?? DEFAULT_ORG,
    actor_id: actorId,
    title,
    project_id: project.project_id,
    lane_id: problem.lane_id ? laneMirror.get(problem.lane_id) ?? null : null,
    cause: problem.why ?? null,
    source: sourceWithMarker(cwtId, problem.source),
  }, "problem", cwtId, title, project.project_id);
  if (isImportResult(result)) return result;
  return commandResult("problem", cwtId, title, project.project_id, result);
}

async function commandOrFailure(
  client: Client,
  op: string,
  args: Record<string, unknown>,
  family: Family,
  cwtId: string,
  title: string,
  projectId: string | null,
): Promise<CommandResult | ImportResult> {
  try {
    return await client.command(op, args);
  } catch (err) {
    return failed(family, cwtId, title, err instanceof Error ? err.message : String(err), projectId);
  }
}

function commandResult(
  family: Family,
  cwtId: string,
  title: string,
  projectId: string | null,
  result: CommandResult,
): ImportResult {
  if (result.ok !== true) {
    return failed(family, cwtId, title, `${result.error.class}: ${result.error.message}`, projectId);
  }
  return {
    family,
    cwt_id: cwtId,
    title,
    status: "imported",
    daemon_id: typeof result.resource === "string" ? result.resource : null,
    events: result.events ?? [],
    project_id: projectId,
  };
}

function makeProjectResolver(cwtProjects: CwtProject[], daemonProjects: DaemonProject[]): ProjectResolver {
  const daemonById = new Map<string, DaemonProject>();
  const daemonByName = new Map<string, DaemonProject>();
  for (const project of daemonProjects) {
    const id = project.project_id ?? project.id;
    if (id) daemonById.set(id, project);
    if (project.name) daemonByName.set(project.name.toLowerCase(), project);
  }
  const cwtById = new Map(cwtProjects.flatMap((project) => project.id ? [[project.id, project] as const] : []));

  return (projectId) => {
    if (!projectId) return { ok: true, project_id: null, org_id: null };
    const exact = daemonById.get(projectId);
    if (exact) return { ok: true, project_id: projectId, org_id: exact.org_id ?? null };
    const cwtProject = cwtById.get(projectId);
    const byName = cwtProject?.name ? daemonByName.get(cwtProject.name.toLowerCase()) : null;
    if (byName) return { ok: true, project_id: byName.project_id ?? byName.id ?? projectId, org_id: byName.org_id ?? cwtProject?.org_id ?? null };
    return { ok: false, reason: `daemon project not found for ${projectId}; run project seeding/materialization before importing this record` };
  };
}

async function readSnapshot(root: string, only: Set<string> | null): Promise<Snapshot> {
  return {
    projects: await readRecords<CwtProject>(root, "projects", null),
    lanes: await readRecords<CwtLane>(root, "lanes", only),
    queue: await readRecords<CwtQueue>(root, "queue", only),
    problems: await readRecords<CwtProblem>(root, "problems", only),
  };
}

async function readRecords<T extends { id?: string; status?: string; tombstone?: boolean }>(
  root: string,
  dir: string,
  only: Set<string> | null,
): Promise<T[]> {
  const index = await readJson<RecordIndex>(join(root, "records", dir, "index.json"));
  const rows: T[] = [];
  for (const ref of index?.records ?? []) {
    const row = await readJson<T>(join(root, ref.path));
    if (!row || !isOpen(row)) continue;
    if (only && (!row.id || !only.has(row.id))) continue;
    rows.push(row);
  }
  return rows;
}

async function readProjection<T>(client: Client, name: string, key: string): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve([] as T), 1500);
    client.onMessage((msg) => {
      if (msg.type !== "projection" || (msg as { name?: string }).name !== name) return;
      clearTimeout(timer);
      const data = (msg as { data?: Record<string, unknown> }).data ?? {};
      resolve((data[key] ?? []) as T);
    });
    client.subscribe(name);
  });
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function isOpen(row: { status?: string; tombstone?: boolean }): boolean {
  if (row.tombstone) return false;
  return !["done", "dropped", "closed", "archived"].includes(row.status ?? "");
}

function skipped(family: Family, cwtId: string | null, title: string, daemonId: string | null): ImportResult {
  return { family, cwt_id: cwtId, title, status: "skipped", daemon_id: daemonId, events: [], reason: "already mirrored" };
}

function failed(family: Family, cwtId: string | null, title: string, reason: string, projectId: string | null = null): ImportResult {
  return { family, cwt_id: cwtId, title, status: "failed", daemon_id: null, events: [], project_id: projectId, reason };
}

function summarize(results: ImportResult[]) {
  return {
    imported: results.filter((result) => result.status === "imported").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    failed: results.filter((result) => result.status === "failed").length,
    lanes: summarizeFamily(results, "lane"),
    queue_items: summarizeFamily(results, "queue_item"),
    problems: summarizeFamily(results, "problem"),
  };
}

function summarizeFamily(results: ImportResult[], family: Family) {
  const scoped = results.filter((result) => result.family === family);
  return {
    imported: scoped.filter((result) => result.status === "imported").length,
    skipped: scoped.filter((result) => result.status === "skipped").length,
    failed: scoped.filter((result) => result.status === "failed").length,
  };
}

function findMirrored<T>(records: T[], cwtId: string, pick: (record: T) => string | null | undefined): T | null {
  const source = marker(cwtId);
  return records.find((record) => pick(record)?.includes(source)) ?? null;
}

function daemonId(record: DaemonRecord): string | null {
  return record.id ?? record.lane_id ?? record.queue_item_id ?? record.problem_id ?? null;
}

function isImportResult(value: CommandResult | ImportResult): value is ImportResult {
  return typeof (value as ImportResult).family === "string" && "cwt_id" in value;
}

function onlyFilter(args: ParsedArgs): Set<string> | null {
  const raw = flagString(args, "only");
  if (!raw) return null;
  const ids = raw.split(",").map((id) => id.trim()).filter(Boolean);
  return ids.length > 0 ? new Set(ids) : null;
}

function marker(id: string): string {
  return `${CWT_SOURCE_PREFIX}${id}`;
}

function sourceWithMarker(id: string, source: string | null | undefined): string {
  const sourceMarker = marker(id);
  if (!source?.trim()) return sourceMarker;
  if (source.includes(sourceMarker)) return source;
  return `${sourceMarker} | ${source}`;
}

function laneScope(lane: CwtLane): string {
  return [
    lane.id ? marker(lane.id) : null,
    parseScopeJson(lane.scope_json ?? undefined),
    lane.why,
    lane.tags ? `tags=${lane.tags}` : null,
  ].filter((part): part is string => Boolean(part && part.trim())).join(" | ")
    || "Imported from CWT shared-files projection.";
}

function parseScopeJson(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === "string").join(", ");
  } catch {
    return raw;
  }
  return raw;
}

function firstJsonString(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.find((item): item is string => typeof item === "string" && item.length > 0) ?? null;
  } catch {
    return raw.trim() || null;
  }
  return null;
}

function projectStoragePolicy() {
  return {
    driver: "git_worktree",
    versioning: "git",
    target_policy: "project_git_repo",
  };
}
