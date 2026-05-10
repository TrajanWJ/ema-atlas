import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { getRegistryForProject, type ActiveBuild, type ProjectRegistryEntry, type Surface } from "../project-registry/index.js";
import { DESKTOP_ROOT } from "../workspace-state.js";
import { resolveWorkspaceScope, type WorkspaceScope } from "../workspace-scope.js";
import { loadIntentionProjection } from "./intention.js";
import { readProjectionBatch, renderEmaCommand } from "./workspace-daemon.js";

const execFileAsync = promisify(execFile);
const INTENTION_STORE_ROOT = join(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", ".ema-dev", "intention-backfeed");
const EMA_PIDS_ROOT = join(DESKTOP_ROOT, "Active builds", "EMA-0.0.6", ".ema-dev", "pids");

type LaneRecord = {
  readonly id: string;
  readonly lane_id?: string;
  readonly title?: string;
  readonly name?: string;
  readonly status?: string;
  readonly project_id?: string | null;
  readonly scope?: string | null;
  readonly goal?: string | null;
  readonly next?: string | null;
  readonly actor_id?: string | null;
  readonly updated_at?: string | null;
};

type QueueRecord = {
  readonly id: string;
  readonly queue_item_id?: string;
  readonly title?: string;
  readonly name?: string;
  readonly why?: string;
  readonly status?: string;
  readonly project_id?: string | null;
  readonly lane_id?: string | null;
  readonly done_when?: string | null;
  readonly updated_at?: string | null;
};

type TopbarProjection = {
  readonly current_project?: { readonly id?: string; readonly name?: string } | null;
};

type CockpitClient = {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
};

type CockpitBuild = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly path: string;
  readonly repo_url: string | null;
  readonly branch: string | null;
  readonly head: string | null;
  readonly dirty_count: number | null;
  readonly git_status: "clean" | "dirty" | "unborn" | "no_git" | "missing" | "unknown";
  readonly dev_command: string | null;
};

type CockpitSurface = {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly owner: string;
  readonly build_id: string;
  readonly path: string;
  readonly local_url: string | null;
  readonly status: string;
};

type CockpitHealth = {
  readonly daemon: "up" | "down";
  readonly web: "up" | "down";
  readonly dirty_builds: number;
  readonly no_git_builds: number;
  readonly stale_records: readonly string[];
  readonly proslync_ready: boolean;
};

type CockpitProjection = {
  readonly ok: true;
  readonly command: "cockpit.projection";
  readonly source: "ema-cockpit-cli";
  readonly generated_at: string;
  readonly client: CockpitClient | null;
  readonly project: {
    readonly id: string | null;
    readonly name: string | null;
    readonly kind: "client" | "personal" | "internal" | "unresolved";
    readonly project_record: string | null;
    readonly active_build: string | null;
    readonly resolution_source: string;
  };
  readonly workspace: {
    readonly workspace_scope: WorkspaceScope;
    readonly home_current_project: string | null;
    readonly scope_warning: string | null;
    readonly cockpit_url: string | null;
  };
  readonly counts: {
    readonly lanes: number;
    readonly active_lanes: number;
    readonly ready_lanes: number;
    readonly queue: number;
    readonly ready_queue: number;
    readonly blocked_queue: number;
    readonly builds: number;
    readonly surfaces: number;
  };
  readonly lanes: readonly LaneRecord[];
  readonly queue: readonly QueueRecord[];
  readonly active_builds: readonly CockpitBuild[];
  readonly surfaces: readonly CockpitSurface[];
  readonly health: CockpitHealth;
};

export async function runCockpit(args: ParsedArgs): Promise<number> {
  const sub = args.positional[0] ?? "summary";
  if (flagBool(args, "help") || args.flags.h === true || sub === "help") {
    printHelp();
    return 0;
  }

  if (!["summary", "projection", "workpack", "builds", "surfaces", "lanes", "queue", "intentions", "open"].includes(sub)) {
    emitError(`ema cockpit: unknown subcommand "${sub}"`);
    emitError("Usage: ema cockpit [summary|projection|workpack|builds|surfaces|lanes|queue|intentions|open] [--project <name>] [--json]");
    return 64;
  }

  const json = flagBool(args, "json");

  if (sub === "intentions") {
    const intentions = await loadIntentionProjection(args);
    const payload = {
      ok: true,
      command: "cockpit.intentions",
      project: intentions.project,
      stats: intentions.stats,
      top_tags: intentions.top_tags,
      recommended_queue: intentions.recommended_queue,
    };
    if (json) emitJson(payload);
    else printIntentions(payload);
    return 0;
  }

  if (sub === "workpack") {
    const workpackProjection = await loadCockpitProjection(args, { includeTopbar: false });
    const payload = {
      ok: true,
      command: "cockpit.workpack" as const,
      generated_at: new Date().toISOString(),
      project: workpackProjection.project,
      client: workpackProjection.client,
      health: workpackProjection.health,
      agent_work: agentWorkpackFor(workpackProjection),
    };
    if (json) emitJson(payload);
    else printWorkpack(payload);
    return 0;
  }

  const projection = await loadCockpitProjection(args);

  if (sub === "projection") {
    emitJson(projection);
    return 0;
  }
  if (sub === "builds") {
    if (json) emitJson({ ok: true, command: "cockpit.builds", builds: projection.active_builds });
    else printBuilds(projection.active_builds);
    return 0;
  }
  if (sub === "surfaces") {
    if (json) emitJson({ ok: true, command: "cockpit.surfaces", surfaces: projection.surfaces });
    else printSurfaces(projection.surfaces);
    return 0;
  }
  if (sub === "lanes") {
    if (json) emitJson({ ok: true, command: "cockpit.lanes", lanes: projection.lanes });
    else printLanes(projection.lanes);
    return 0;
  }
  if (sub === "queue") {
    if (json) emitJson({ ok: true, command: "cockpit.queue", queue: projection.queue });
    else printQueue(projection.queue);
    return 0;
  }
  if (sub === "open") {
    if (json) emitJson({ ok: true, command: "cockpit.open", url: projection.workspace.cockpit_url });
    else emitPretty(projection.workspace.cockpit_url ?? "No cockpit URL: workspace project is unresolved.");
    return 0;
  }

  if (json) emitJson(projection);
  else printSummary(projection);
  return 0;
}

async function loadCockpitProjection(
  args: ParsedArgs,
  options: { readonly includeTopbar?: boolean } = {},
): Promise<CockpitProjection> {
  const scope = await resolveWorkspaceScope({ args });
  const includeTopbar = options.includeTopbar ?? true;
  const projectionSpecs = [
    {
      name: "lane.registry",
      pick: (data: Record<string, unknown>) => toRecords<LaneRecord>(data.lanes),
    },
    {
      name: "queue.registry",
      pick: (data: Record<string, unknown>) => toRecords<QueueRecord>(data.queue_items),
    },
    ...(includeTopbar
      ? [{
        name: "topbar",
        pick: (data: Record<string, unknown>) => data as TopbarProjection,
      }]
      : []),
  ] as const;
  const [laneProjection, queueProjection, topbar = null] = await readProjectionBatch(args, projectionSpecs) as [
    LaneRecord[] | null,
    QueueRecord[] | null,
    TopbarProjection | null,
  ];

  const projectId = scope.project_id;
  const lanes = filterProject(laneProjection ?? [], projectId);
  const queue = filterProject(queueProjection ?? [], projectId);
  const registry = registryForScope(scope);
  const client = clientFromRegistry(registry);
  const activeBuilds = await discoverBuilds(scope, registry);
  const surfaces = surfacesFromRegistry(registry);
  const runtime = readRuntimeFacts();
  const health = healthFor({
    activeBuilds,
    daemonUp: laneProjection != null || queueProjection != null,
    intentionsUp: intentionProjectionAvailable(scope),
    surfaces,
    runtime,
  });
  const cockpitUrl = cockpitUrlFor(scope, client);
  const homeCurrentProject = topbar?.current_project?.name ?? null;
  const scopeWarning =
    homeCurrentProject && scope.project_name && homeCurrentProject !== scope.project_name
      ? `home_current project ${homeCurrentProject} differs from workspace_scope project ${scope.project_name}; workspace commands use workspace_scope unless --project overrides it.`
      : null;

  return {
    ok: true,
    command: "cockpit.projection",
    source: "ema-cockpit-cli",
    generated_at: new Date().toISOString(),
    client,
    project: {
      id: scope.project_id,
      name: scope.project_name,
      kind: scope.project_id ? (client ? "client" : "personal") : "unresolved",
      project_record: scope.project_record,
      active_build: scope.active_build,
      resolution_source: scope.resolution_source,
    },
    workspace: {
      workspace_scope: scope,
      home_current_project: homeCurrentProject,
      scope_warning: scopeWarning,
      cockpit_url: cockpitUrl,
    },
    counts: {
      lanes: lanes.length,
      active_lanes: lanes.filter((lane) => lane.status === "active").length,
      ready_lanes: lanes.filter((lane) => lane.status === "ready").length,
      queue: queue.length,
      ready_queue: queue.filter((item) => item.status === "ready").length,
      blocked_queue: queue.filter((item) => item.status === "blocked").length,
      builds: activeBuilds.length,
      surfaces: surfaces.length,
    },
    lanes,
    queue,
    active_builds: activeBuilds,
    surfaces,
    health,
  };
}

function printHelp(): void {
  emitPretty("ema cockpit — client/project cockpit over daemon workspace state");
  emitPretty("");
  emitPretty("Usage:");
  emitPretty("  ema cockpit summary [--project <name>] [--json]");
  emitPretty("  ema cockpit projection [--project <name>] --json");
  emitPretty("  ema cockpit workpack [--project <name>] [--json]");
  emitPretty("  ema cockpit builds [--project <name>] [--json]");
  emitPretty("  ema cockpit surfaces [--project <name>] [--json]");
  emitPretty("  ema cockpit lanes [--project <name>] [--json]");
  emitPretty("  ema cockpit queue [--project <name>] [--json]");
  emitPretty("  ema cockpit intentions [--project <name>] [--json]");
  emitPretty("  ema cockpit open [--project <name>] [--json]");
}

function printWorkpack(payload: {
  readonly project: CockpitProjection["project"];
  readonly health: CockpitHealth;
  readonly agent_work: ReturnType<typeof agentWorkpackFor>;
}): void {
  emitPretty(`${payload.project.name ?? "(unresolved project)"} workpack`);
  emitPretty(`health: daemon ${payload.health.daemon}, web ${payload.health.web}, ready ${payload.health.proslync_ready}`);
  emitPretty("");
  emitPretty("kickoff:");
  for (const command of payload.agent_work.kickoff_commands) emitPretty(`  ${command}`);
  emitPretty("");
  emitPretty("verification:");
  for (const command of payload.agent_work.verification_commands) emitPretty(`  ${command}`);
  if (payload.agent_work.hazards.length > 0) {
    emitPretty("");
    emitPretty("hazards:");
    for (const hazard of payload.agent_work.hazards) emitPretty(`  ${hazard}`);
  }
}

function printSummary(projection: CockpitProjection): void {
  const clientPrefix = projection.client ? `${projection.client.name} / ` : "";
  emitPretty(`${clientPrefix}${projection.project.name ?? "(unresolved project)"}`);
  emitPretty(`project: ${projection.project.id ?? "(none)"}`);
  emitPretty(`record:  ${projection.project.project_record ?? "(none)"}`);
  emitPretty(`build:   ${projection.project.active_build ?? "(none)"}`);
  emitPretty(`scope:   ${projection.project.resolution_source}`);
  if (projection.workspace.scope_warning) emitPretty(`[warn] ${projection.workspace.scope_warning}`);
  emitPretty("");
  emitPretty(
    `lanes: ${projection.counts.lanes} (${projection.counts.active_lanes} active, ${projection.counts.ready_lanes} ready)`,
  );
  emitPretty(
    `queue: ${projection.counts.queue} (${projection.counts.ready_queue} ready, ${projection.counts.blocked_queue} blocked)`,
  );
  emitPretty(`builds: ${projection.counts.builds}`);
  emitPretty(`surfaces: ${projection.counts.surfaces}`);
  emitPretty(
    `health: daemon ${projection.health.daemon}, web ${projection.health.web}, Proslync ${projection.health.proslync_ready ? "ready" : "needs review"}`,
  );
  if (projection.workspace.cockpit_url) emitPretty(`url: ${projection.workspace.cockpit_url}`);
}

function printBuilds(builds: readonly CockpitBuild[]): void {
  if (builds.length === 0) {
    emitPretty("No active builds discovered for this project.");
    return;
  }
  for (const build of builds) {
    const git = [
      build.git_status,
      build.branch ? `branch ${build.branch}` : null,
      build.head ? `HEAD ${build.head}` : null,
      typeof build.dirty_count === "number" ? `dirty ${build.dirty_count}` : null,
    ].filter(Boolean).join(" · ");
    emitPretty(`${build.label}`);
    emitPretty(`  ${build.path}`);
    emitPretty(`  ${git}`);
    if (build.dev_command) emitPretty(`  dev: ${build.dev_command}`);
  }
}

function printSurfaces(surfaces: readonly CockpitSurface[]): void {
  if (surfaces.length === 0) {
    emitPretty("No cockpit surfaces registered for this project.");
    return;
  }
  for (const surface of surfaces) {
    emitPretty(`${surface.label} [${surface.status}]`);
    emitPretty(`  ${surface.role}`);
    emitPretty(`  owner: ${surface.owner}`);
    emitPretty(`  path: ${surface.path}`);
    if (surface.local_url) emitPretty(`  url: ${surface.local_url}`);
  }
}

function printLanes(lanes: readonly LaneRecord[]): void {
  if (lanes.length === 0) {
    emitPretty("No lanes found for this project.");
    return;
  }
  for (const lane of lanes) {
    emitPretty(`${lane.id} [${lane.status ?? "unknown"}] ${lane.title ?? lane.name ?? "(untitled lane)"}`);
    if (lane.actor_id) emitPretty(`  actor: ${lane.actor_id}`);
    if (lane.scope) emitPretty(`  scope: ${lane.scope}`);
    if (lane.next) emitPretty(`  next: ${lane.next}`);
  }
}

function printQueue(queue: readonly QueueRecord[]): void {
  if (queue.length === 0) {
    emitPretty("No queue items found for this project.");
    return;
  }
  for (const item of queue) {
    emitPretty(`${item.id} [${item.status ?? "unknown"}] ${item.title ?? item.name ?? "(untitled queue item)"}`);
    if (item.lane_id) emitPretty(`  lane: ${item.lane_id}`);
    if (item.why) emitPretty(`  why: ${item.why}`);
    if (item.done_when) emitPretty(`  done: ${item.done_when}`);
  }
}

function printIntentions(payload: {
  readonly project: string | null;
  readonly stats: { readonly candidate_intents: number; readonly proslync_relevant: number; readonly lost_followups: number };
  readonly recommended_queue: readonly { readonly id: string; readonly title: string; readonly tags: readonly string[]; readonly evidence_ref: string }[];
}): void {
  emitPretty(`${payload.project ?? "(unresolved project)"} intentions`);
  emitPretty(`candidates: ${payload.stats.candidate_intents}`);
  emitPretty(`proslync: ${payload.stats.proslync_relevant}`);
  emitPretty(`lost followups: ${payload.stats.lost_followups}`);
  if (payload.recommended_queue.length === 0) {
    emitPretty("recommended queue: (none)");
    return;
  }
  emitPretty("recommended queue:");
  for (const item of payload.recommended_queue.slice(0, 10)) {
    emitPretty(`  ${item.id} ${item.title}`);
    emitPretty(`    tags: ${item.tags.join(", ")}`);
    emitPretty(`    evidence: ${item.evidence_ref}`);
  }
}

function toRecords<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function filterProject<T extends { readonly project_id?: string | null }>(
  records: readonly T[],
  projectId: string | null,
): T[] {
  if (!projectId) return [...records];
  return records.filter((record) => record.project_id == null || record.project_id === projectId);
}

function registryForScope(scope: WorkspaceScope): ProjectRegistryEntry | null {
  return getRegistryForProject(scope.project_name) ?? getRegistryForProject(scope.project_id);
}

function clientFromRegistry(registry: ProjectRegistryEntry | null): CockpitClient | null {
  if (!registry || !registry.clientId || !registry.clientName) return null;
  return { id: registry.clientId, name: registry.clientName, color: registry.clientColor };
}

function surfacesFromRegistry(registry: ProjectRegistryEntry | null): CockpitSurface[] {
  if (!registry) return [];
  return registry.surfaces.map((surface) => surfaceToCockpit(surface));
}

function surfaceToCockpit(surface: Surface): CockpitSurface {
  return {
    id: surface.id,
    label: surface.label,
    role: surface.role,
    owner: surface.owner,
    build_id: surface.buildId,
    path: surface.path,
    local_url: surface.localUrl,
    status: surface.status,
  };
}

async function discoverBuilds(scope: WorkspaceScope, registry: ProjectRegistryEntry | null): Promise<CockpitBuild[]> {
  // Index registry builds by absolute path so scope.active_build (when present
  // on disk) is treated as the same build entry as the registry, not a
  // duplicate keyed by basename.
  const registryByPath = new Map<string, ActiveBuild>();
  if (registry) {
    for (const build of registry.activeBuilds) registryByPath.set(build.path, build);
  }
  const paths = new Set<string>();
  for (const path of registryByPath.keys()) paths.add(path);
  if (scope.active_build) paths.add(scope.active_build);
  const sorted = [...paths].sort();
  return await Promise.all(sorted.map((path) => gitFact(path, registryByPath.get(path) ?? null)));
}

function intentionProjectionAvailable(scope: WorkspaceScope): boolean {
  const project = scope.project_name ?? "unresolved";
  return existsSync(join(INTENTION_STORE_ROOT, `${safeName(project)}.json`));
}

async function gitFact(path: string, registryBuild: ActiveBuild | null): Promise<CockpitBuild> {
  const id = registryBuild?.id ?? basename(path);
  const base = {
    id,
    label: registryBuild?.label ?? id,
    role: registryBuild?.role ?? "active build",
    path,
    repo_url: registryBuild?.repoUrl ?? null,
    dev_command: registryBuild?.devCommand ?? null,
  };
  if (!existsSync(path)) {
    return { ...base, branch: null, head: null, dirty_count: null, git_status: "missing" };
  }
  if (!existsSync(join(path, ".git"))) {
    return { ...base, branch: null, head: null, dirty_count: null, git_status: "no_git" };
  }
  const [branch, head, status] = await Promise.all([
    run("git", ["branch", "--show-current"], path).catch(() => ""),
    run("git", ["rev-parse", "--short", "HEAD"], path).catch(() => ""),
    run("git", ["status", "--short"], path).catch(() => ""),
  ]);
  const dirtyCount = status.split("\n").filter(Boolean).length;
  return {
    ...base,
    branch: branch || null,
    head: head || null,
    dirty_count: dirtyCount,
    git_status: head ? (dirtyCount > 0 ? "dirty" : "clean") : "unborn",
  };
}

async function run(command: string, args: readonly string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync(command, [...args], {
    cwd,
    encoding: "utf8",
    timeout: 8_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return stdout.trim();
}

type RuntimeFacts = {
  readonly webUp: boolean;
  readonly daemonStalePid: boolean;
  readonly webStalePid: boolean;
};

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function readPidFile(name: string): number | null {
  const path = join(EMA_PIDS_ROOT, `${name}.pid`);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8").trim();
    if (!raw) return null;
    const pid = Number(raw);
    return Number.isFinite(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function readRuntimeFacts(): RuntimeFacts {
  const webPid = readPidFile("web");
  const daemonPid = readPidFile("daemon");
  const webAlive = webPid != null && pidAlive(webPid);
  const daemonAlive = daemonPid != null && pidAlive(daemonPid);
  return {
    webUp: webAlive,
    daemonStalePid: daemonPid != null && !daemonAlive,
    webStalePid: webPid != null && !webAlive,
  };
}

function healthFor(input: {
  readonly activeBuilds: readonly CockpitBuild[];
  readonly daemonUp: boolean;
  readonly intentionsUp: boolean;
  readonly surfaces: readonly CockpitSurface[];
  readonly runtime: RuntimeFacts;
}): CockpitHealth {
  const gitBuilds = new Map(input.activeBuilds.map((build) => [build.id, build]));
  const gitFactsLoaded = ["proslync-app-ios-final", "proslync-backend", "proslync-presentation-assets-final"].every((id) => {
    const status = gitBuilds.get(id)?.git_status;
    return status != null && status !== "missing" && status !== "unknown" && status !== "no_git";
  });
  const desktopStatus = gitBuilds.get("proslync-desktop")?.git_status;
  const desktopExplicit = desktopStatus != null && desktopStatus !== "missing" && desktopStatus !== "unknown";
  const staleRecords: string[] = [];
  if (input.runtime.daemonStalePid) staleRecords.push("daemon.pid points to a process that is not running");
  if (input.runtime.webStalePid) staleRecords.push("web.pid points to a process that is not running");
  return {
    daemon: input.daemonUp ? "up" : "down",
    web: input.runtime.webUp ? "up" : "down",
    dirty_builds: input.activeBuilds.filter((build) => build.git_status === "dirty").length,
    no_git_builds: input.activeBuilds.filter((build) => build.git_status === "no_git").length,
    stale_records: staleRecords,
    proslync_ready:
      input.daemonUp &&
      input.intentionsUp &&
      input.runtime.webUp &&
      gitFactsLoaded &&
      desktopExplicit &&
      input.surfaces.length >= 6,
  };
}

function cockpitUrlFor(scope: WorkspaceScope, client: CockpitClient | null): string | null {
  if (!scope.project_id) return null;
  if (client) {
    return `http://localhost:5173/cockpit#/clients/${client.id}/${scope.project_id}`;
  }
  return `http://localhost:5173/cockpit#/personal/${scope.project_id}`;
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function agentWorkpackFor(projection: CockpitProjection) {
  const dirtyBuilds = projection.active_builds.filter((build) => build.git_status === "dirty");
  const unstableBuilds = projection.active_builds.filter((build) => build.git_status === "no_git" || build.git_status === "unborn" || build.git_status === "unknown" || build.git_status === "missing");
  const activeOrReadyLane = projection.lanes.find((lane) => lane.status === "active") ?? projection.lanes.find((lane) => lane.status === "ready") ?? projection.lanes[0] ?? null;
  const readyQueue = projection.queue.filter((item) => item.status === "ready").slice(0, 8);
  const projectName = projection.project.name ?? "proslync-app-ios-final";
  const claimCommand = activeOrReadyLane
    ? renderEmaCommand(["lane", "claim", "--project", projectName, "--lane", activeOrReadyLane.id, "--actor", "actor:codex", "--scope", "<paths>", "--goal", "<goal>", "--next", "<next step>"])
    : renderEmaCommand(["lane", "open", "--project", projectName, "--title", "<slice title>", "--scope", "<paths>", "--done-when", "<done criteria>"]);

  return {
    mode: "multi-repo-agent-work",
    project_name: projectName,
    client_name: projection.client?.name ?? null,
    cockpit_url: projection.workspace.cockpit_url,
    active_lane: activeOrReadyLane,
    ready_queue: readyQueue,
    builds: projection.active_builds.map((build) => ({
      id: build.id,
      path: build.path,
      role: build.role,
      git_status: build.git_status,
      branch: build.branch,
      head: build.head,
      dirty_count: build.dirty_count,
      dev_command: build.dev_command,
    })),
    surfaces: projection.surfaces.map((surface) => ({
      id: surface.id,
      owner: surface.owner,
      build_id: surface.build_id,
      path: surface.path,
      status: surface.status,
      local_url: surface.local_url,
    })),
    kickoff_commands: [
      renderEmaCommand(["cockpit", "projection", "--project", projectName, "--json"]),
      renderEmaCommand(["cockpit", "intentions", "--project", projectName, "--json"]),
      claimCommand,
    ],
    verification_commands: [
      "pnpm --filter @ema/cli typecheck",
      "pnpm build:cli",
      "pnpm --dir apps/web exec tsc --noEmit",
      `ema cockpit workpack --project ${projectName} --json`,
    ],
    hazards: [
      ...dirtyBuilds.map((build) => `${build.id} has ${build.dirty_count ?? 0} dirty file(s); inspect before assigning broad writes.`),
      ...unstableBuilds.map((build) => `${build.id} git status is ${build.git_status}; treat branch/head as unavailable.`),
      ...(projection.health.proslync_ready ? [] : ["Project health is not ready; inspect daemon/web/intentions/build facts before swarm kickoff."]),
    ],
    handoff_contract: {
      before_editing: "Read the active build docs and claim a daemon lane with exact path scope.",
      during_work: "Keep writes scoped by build and surface; do not reset or clean dirty worktrees.",
      after_work: "Run verification commands, update lane/queue, and record evidence in the cockpit or release report.",
    },
  };
}
