import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import {
	type ActiveBuild as RegistryActiveBuild,
	getRegistryForProject,
	type Surface as RegistrySurface,
} from "@/src/lib/project-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const WEB_ROOT = process.cwd();
const EMA_ROOT = resolve(WEB_ROOT, "../..");
const EMA_CLI = join(EMA_ROOT, "apps/cli/dist/bin.js");
const INTENTION_STORE_ROOT = join(EMA_ROOT, ".ema-dev", "intention-backfeed");
const EMA_PIDS_ROOT = join(EMA_ROOT, ".ema-dev", "pids");
const DEFAULT_PROJECT_SLUG = "proslync-app-ios-final";

type RouteBuild = {
	readonly id: string;
	readonly label: string;
	readonly role: string;
	readonly path: string;
	readonly repo_url: string | null;
	readonly dev_command: string | null;
};

type RouteSurface = {
	readonly id: string;
	readonly label: string;
	readonly role: string;
	readonly owner: string;
	readonly build_id: string;
	readonly path: string;
	readonly local_url: string | null;
	readonly status: string;
};

function buildToRouteShape(build: RegistryActiveBuild): RouteBuild {
	return {
		id: build.id,
		label: build.label,
		role: build.role,
		path: build.path,
		repo_url: build.repoUrl,
		dev_command: build.devCommand,
	};
}

function surfaceToRouteShape(surface: RegistrySurface): RouteSurface {
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

type WorkspaceScope = {
	org_id?: string | null;
	space_id?: string | null;
	project_id?: string | null;
	project_name?: string | null;
	project_record?: string | null;
	active_build?: string | null;
	resolution_source?: string | null;
	cwd?: string | null;
};

type EmaStatus = {
	ok?: boolean;
	space?: { id?: string; name?: string } | null;
	project?: { id?: string; name?: string } | null;
	workspace_scope?: WorkspaceScope | null;
	scope_warning?: string | null;
};

type EmaNext = {
	ok?: boolean;
	vcalendar_phase?: string | null;
	recommended_lane?: Record<string, unknown> | null;
	ready_queue_item?: Record<string, unknown> | null;
	next_command?: string | null;
};

type EmaLaneList = {
	ok?: boolean;
	source?: string;
	daemon_authority?: string;
	workspace_scope?: WorkspaceScope | null;
	lanes?: Record<string, unknown>[];
};

type EmaQueueList = {
	ok?: boolean;
	source?: string;
	daemon_authority?: string;
	workspace_scope?: WorkspaceScope | null;
	queue?: Record<string, unknown>[];
};

function asString(value: unknown): string | null {
	return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function run(
	command: string,
	args: readonly string[],
	cwd: string,
): Promise<string> {
	const { stdout } = await execFileAsync(command, [...args], {
		cwd,
		encoding: "utf8",
		timeout: 8_000,
		maxBuffer: 8 * 1024 * 1024,
	});
	return stdout.trim();
}

async function runEmaJson<T>(
	args: readonly string[],
	errors: string[],
	cwd: string,
): Promise<T | null> {
	try {
		const stdout = existsSync(EMA_CLI)
			? await run(process.execPath, [EMA_CLI, ...args], cwd)
			: await run("ema", args, cwd);
		return JSON.parse(stdout) as T;
	} catch (error) {
		errors.push(`ema ${args.join(" ")} failed: ${error instanceof Error ? error.message : String(error)}`);
		return null;
	}
}

async function gitFact(build: RouteBuild) {
	if (!existsSync(build.path)) {
		return {
			...build,
			branch: null,
			head: null,
			dirty_count: null,
			git_status: "missing" as const,
		};
	}
	if (!existsSync(join(build.path, ".git"))) {
		return {
			...build,
			branch: null,
			head: null,
			dirty_count: null,
			git_status: "no_git" as const,
		};
	}
	try {
		const [branch, head, status] = await Promise.all([
			run("git", ["branch", "--show-current"], build.path).catch(() => ""),
			run("git", ["rev-parse", "--short", "HEAD"], build.path).catch(() => ""),
			run("git", ["status", "--short"], build.path).catch(() => ""),
		]);
		const dirtyCount = status.split("\n").filter(Boolean).length;
		return {
			...build,
			branch: branch || null,
			head: head || null,
			dirty_count: dirtyCount,
			git_status: head ? (dirtyCount > 0 ? ("dirty" as const) : ("clean" as const)) : ("unborn" as const),
		};
	} catch {
		return {
			...build,
			branch: null,
			head: null,
			dirty_count: null,
			git_status: "unknown" as const,
		};
	}
}

function projectFrom(
	scope: WorkspaceScope | null | undefined,
	status: EmaStatus | null,
	registry: ReturnType<typeof getRegistryForProject>,
	defaultProjectSlug: string,
	defaultActiveBuildPath: string,
) {
	const projectId = scope?.project_id ?? registry?.projectId ?? "project:unresolved";
	const spaceId = scope?.space_id ?? status?.space?.id ?? "space:01J00000000000000000000013";
	const primaryRepoUrl = registry?.activeBuilds[0]?.repoUrl ?? null;
	return {
		id: projectId,
		name: scope?.project_name ?? registry?.projectSlug ?? defaultProjectSlug,
		kind: "client",
		client_id: registry?.clientId ?? null,
		client_label: registry?.clientName ?? null,
		client_color: registry?.clientColor ?? null,
		space_id: spaceId,
		project_record: scope?.project_record ?? registry?.projectRecordPath ?? null,
		active_build: scope?.active_build ?? defaultActiveBuildPath,
		repo_url: primaryRepoUrl,
		resolution_source: scope?.resolution_source ?? null,
	};
}

function normalizeLane(raw: Record<string, unknown>, projectId: string) {
	return {
		id: asString(raw.id) ?? asString(raw.lane_id) ?? "lane:unknown",
		project_id: asString(raw.project_id) ?? projectId,
		title: asString(raw.title) ?? asString(raw.name) ?? asString(raw.id) ?? "Untitled lane",
		why: asString(raw.goal) ?? asString(raw.done_when) ?? asString(raw.scope) ?? "",
		status: asString(raw.status) ?? "unknown",
		scope: asString(raw.scope),
		claim_scope: asString(raw.claim_scope),
		goal: asString(raw.goal),
		next: asString(raw.next),
		actor_id: asString(raw.actor_id),
		updated_at: asString(raw.updated_at),
	};
}

function normalizeQueue(raw: Record<string, unknown>, projectId: string) {
	const status = asString(raw.status) ?? "unknown";
	return {
		id: asString(raw.id) ?? asString(raw.queue_item_id) ?? "queue_item:unknown",
		project_id: asString(raw.project_id) ?? projectId,
		title: asString(raw.title) ?? asString(raw.name) ?? asString(raw.id) ?? "Untitled item",
		why: asString(raw.why) ?? asString(raw.blocked_reason) ?? "",
		priority: (asNumber(raw.priority) ?? (status === "ready" ? 2 : 4)) as 1 | 2 | 3 | 4 | 5,
		status,
		promotion_state: status === "closed" ? "closed" : status === "ready" ? "ready" : "proposal",
		lane_id: asString(raw.lane_id),
		done_when: asString(raw.done_when),
		updated_at: asString(raw.updated_at),
	};
}

export async function GET(request: Request) {
	const generatedAt = new Date().toISOString();
	const projectName =
		new URL(request.url).searchParams.get("project")?.trim() || DEFAULT_PROJECT_SLUG;
	const registry = getRegistryForProject(projectName) ?? getRegistryForProject(DEFAULT_PROJECT_SLUG);
	const routeBuilds: readonly RouteBuild[] = registry
		? registry.activeBuilds.map(buildToRouteShape)
		: [];
	const routeSurfaces: readonly RouteSurface[] = registry
		? registry.surfaces.map(surfaceToRouteShape)
		: [];
	// CLI calls run from the primary active build of the project so that
	// `ema` resolves the same workspace scope the cockpit is rendering for.
	const cliCwd = routeBuilds[0]?.path ?? EMA_ROOT;
	const errors: string[] = [];
	const [status, next, laneList, queueList, activeBuilds] = await Promise.all([
		runEmaJson<EmaStatus>(["status", "--json"], errors, cliCwd),
		runEmaJson<EmaNext>(["next", "--json"], errors, cliCwd),
		runEmaJson<EmaLaneList>(["lane", "list", "--project", projectName, "--json"], errors, cliCwd),
		runEmaJson<EmaQueueList>(["queue", "list", "--project", projectName, "--json"], errors, cliCwd),
		Promise.all(routeBuilds.map((build) => gitFact(build))),
	]);

	const workspaceScope =
		laneList?.workspace_scope ?? queueList?.workspace_scope ?? status?.workspace_scope ?? null;
	const project = projectFrom(workspaceScope, status, registry, projectName, cliCwd);
	const lanes = (laneList?.lanes ?? []).map((lane) => normalizeLane(lane, project.id));
	const queue = (queueList?.queue ?? []).map((item) => normalizeQueue(item, project.id));
	const runtime = readRuntimeFacts();
	const health = healthFrom({
		activeBuilds,
		daemonUp: Boolean(status?.ok || laneList?.ok || queueList?.ok),
		intentionsUp: intentionProjectionAvailable(projectName),
		surfaces: routeSurfaces,
		runtime,
	});

	return Response.json(
		{
			ok: true,
			source: "ema-cli-cockpit-bridge",
			generated_at: generatedAt,
			client: registry
				? {
						id: registry.clientId,
						name: registry.clientName,
						color: registry.clientColor,
					}
				: null,
			spaces: [
				{
					id: project.space_id,
					name: status?.space?.name ?? workspaceScope?.space_id ?? "Personal Workspace",
					kind: "default",
				},
			],
			project,
			workspace: {
				source: laneList?.source ?? queueList?.source ?? "ema-cli",
				daemon_authority:
					laneList?.daemon_authority ?? queueList?.daemon_authority ?? "canonical_events",
				generated_at: generatedAt,
				org_id: workspaceScope?.org_id ?? null,
				space_id: workspaceScope?.space_id ?? null,
				project_id: project.id,
				project_name: project.name,
				project_record: project.project_record,
				active_build: project.active_build,
				resolution_source: project.resolution_source,
				cwd: workspaceScope?.cwd ?? cliCwd,
				home_current_project: status?.project?.name ?? null,
				scope_warning: status?.scope_warning ?? null,
				vcalendar_phase: next?.vcalendar_phase ?? null,
				next_command: next?.next_command ?? null,
				errors,
			},
			lanes,
			queue,
			active_builds: activeBuilds,
			surfaces: routeSurfaces,
			health,
		},
		{
			headers: {
				"Cache-Control": "no-store",
			},
		},
	);
}

function intentionProjectionAvailable(projectName: string): boolean {
	return existsSync(join(INTENTION_STORE_ROOT, `${safeName(projectName)}.json`));
}

function safeName(value: string): string {
	return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
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
	// This route only fires when the web server is responding, so web is up by
	// tautology. A pidfile that doesn't point at this process or a live process
	// is stale.
	const webPid = readPidFile("web");
	const daemonPid = readPidFile("daemon");
	const webPidIsThis = webPid != null && webPid === process.pid;
	const webPidAlive = webPid != null && pidAlive(webPid);
	const daemonAlive = daemonPid != null && pidAlive(daemonPid);
	return {
		webUp: true,
		daemonStalePid: daemonPid != null && !daemonAlive,
		webStalePid: webPid != null && !(webPidIsThis || webPidAlive),
	};
}

function healthFrom(input: {
	readonly activeBuilds: readonly Awaited<ReturnType<typeof gitFact>>[];
	readonly daemonUp: boolean;
	readonly intentionsUp: boolean;
	readonly surfaces: readonly RouteSurface[];
	readonly runtime: RuntimeFacts;
}) {
	const gitBuilds = new Map<string, (typeof input.activeBuilds)[number]>(
		input.activeBuilds.map((build) => [build.id, build]),
	);
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
