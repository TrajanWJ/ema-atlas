import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const WEB_ROOT = process.cwd();
const EMA_ROOT = resolve(WEB_ROOT, "../..");
const EMA_CLI = join(EMA_ROOT, "apps/cli/dist/bin.js");
const INTENTION_STORE_ROOT = join(EMA_ROOT, ".ema-dev", "intention-backfeed");
const PROSLYNC_APP = "/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final";

const CLIENT = {
	id: "client:ms-wilson",
	name: "Ms. Wilson",
	color: "#d49a6a",
} as const;

const PROSLYNC_PROJECT_ID = "project:01KR0FKC3Q028AX7DK658J8D99";

const PROSLYNC_BUILDS = [
	{
		id: "proslync-app-ios-final",
		label: "Proslync iOS app",
		role: "mobile mirror, athlete/brand/persona flows",
		path: "/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final",
		repo_url: "https://github.com/TrajanWJ/proslync-app-ios-final",
		dev_command: "npx expo start",
	},
	{
		id: "proslync-backend",
		label: "Proslync backend",
		role: "Bun/Hono/Drizzle API and product-core persistence",
		path: "/Users/trajanm4air/Desktop/Active builds/proslync-backend",
		repo_url: "https://github.com/TrajanWJ/proslync-backend-final",
		dev_command: "bun --hot src/server.ts",
	},
	{
		id: "proslync-desktop",
		label: "Proslync desktop",
		role: "AD cockpit and Brand HQ desktop surface",
		path: "/Users/trajanm4air/Desktop/Active builds/proslync-desktop",
		repo_url: "https://github.com/TrajanWJ/proslync-desktop-site-final",
		dev_command: "pnpm dev",
	},
	{
		id: "proslync-presentation-assets-final",
		label: "Presentation assets",
		role: "master plan, research capture, client-facing narrative",
		path: "/Users/trajanm4air/Desktop/Active builds/proslync-presentation-assets-final",
		repo_url: "https://github.com/TrajanWJ/proslync-presentation-assets-final",
		dev_command: null,
	},
] as const;

const PROSLYNC_SURFACES = [
	{
		id: "ad-cockpit",
		label: "AD cockpit",
		role: "buyer control room: revenue share, cap context, compliance health",
		owner: "Proslync desktop",
		build_id: "proslync-desktop",
		path: "/Users/trajanm4air/Desktop/Active builds/proslync-desktop/app/ad/page.tsx",
		local_url: "http://localhost:3021/ad",
		status: "planned",
	},
	{
		id: "brand-hq",
		label: "Brand HQ",
		role: "open deal workflow, ranked applicants, rationale and trust metadata",
		owner: "Proslync desktop",
		build_id: "proslync-desktop",
		path: "/Users/trajanm4air/Desktop/Active builds/proslync-desktop/app/brand/page.tsx",
		local_url: "http://localhost:3021/brand",
		status: "candidate",
	},
	{
		id: "nil-deal-detail",
		label: "NIL Deal Detail",
		role: "cross-role spine: packet, deliverables, review tracks, audit timeline",
		owner: "Proslync iOS app",
		build_id: "proslync-app-ios-final",
		path: "/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final/app/deal/[id].tsx",
		local_url: null,
		status: "planned",
	},
	{
		id: "nil-manager",
		label: "NIL Manager",
		role: "consent-aware review queue and approval gates",
		owner: "Proslync iOS app",
		build_id: "proslync-app-ios-final",
		path: "/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final/components/nil-manager/nil-manager-view.tsx",
		local_url: null,
		status: "candidate",
	},
	{
		id: "backend-api",
		label: "Backend API",
		role: "product-core objects, routes, seed data, trust metadata",
		owner: "Proslync backend",
		build_id: "proslync-backend",
		path: "/Users/trajanm4air/Desktop/Active builds/proslync-backend/src",
		local_url: "http://localhost:3020/api/health",
		status: "candidate",
	},
	{
		id: "master-plan",
		label: "Master plan and assets",
		role: "client story, role happiness, research and presentation proof",
		owner: "Presentation assets",
		build_id: "proslync-presentation-assets-final",
		path: "/Users/trajanm4air/Desktop/Active builds/proslync-presentation-assets-final/docs/plans/proslync-role-happiness-master-plan-2026-05-09/README.md",
		local_url: null,
		status: "live",
	},
] as const;

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
): Promise<T | null> {
	try {
		const stdout = existsSync(EMA_CLI)
			? await run(process.execPath, [EMA_CLI, ...args], PROSLYNC_APP)
			: await run("ema", args, PROSLYNC_APP);
		return JSON.parse(stdout) as T;
	} catch (error) {
		errors.push(`ema ${args.join(" ")} failed: ${error instanceof Error ? error.message : String(error)}`);
		return null;
	}
}

async function gitFact(build: (typeof PROSLYNC_BUILDS)[number]) {
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

function projectFrom(scope: WorkspaceScope | null | undefined, status: EmaStatus | null) {
	const projectId = scope?.project_id ?? PROSLYNC_PROJECT_ID;
	const spaceId = scope?.space_id ?? status?.space?.id ?? "space:01J00000000000000000000013";
	return {
		id: projectId,
		name: scope?.project_name ?? "proslync-app-ios-final",
		kind: "client",
		client_id: CLIENT.id,
		client_label: CLIENT.name,
		client_color: CLIENT.color,
		space_id: spaceId,
		project_record: scope?.project_record ?? "/Users/trajanm4air/Desktop/Projects/proslync-app-ios-final",
		active_build: scope?.active_build ?? PROSLYNC_APP,
		repo_url: "https://github.com/TrajanWJ/proslync-app-ios-final",
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
		new URL(request.url).searchParams.get("project")?.trim() || "proslync-app-ios-final";
	const errors: string[] = [];
	const [status, next, laneList, queueList, activeBuilds] = await Promise.all([
		runEmaJson<EmaStatus>(["status", "--json"], errors),
		runEmaJson<EmaNext>(["next", "--json"], errors),
		runEmaJson<EmaLaneList>(["lane", "list", "--project", projectName, "--json"], errors),
		runEmaJson<EmaQueueList>(["queue", "list", "--project", projectName, "--json"], errors),
		Promise.all(PROSLYNC_BUILDS.map((build) => gitFact(build))),
	]);

	const workspaceScope =
		laneList?.workspace_scope ?? queueList?.workspace_scope ?? status?.workspace_scope ?? null;
	const project = projectFrom(workspaceScope, status);
	const lanes = (laneList?.lanes ?? []).map((lane) => normalizeLane(lane, project.id));
	const queue = (queueList?.queue ?? []).map((item) => normalizeQueue(item, project.id));
	const health = healthFrom({
		activeBuilds,
		daemonUp: Boolean(status?.ok || laneList?.ok || queueList?.ok),
		intentionsUp: intentionProjectionAvailable(projectName),
		surfaces: PROSLYNC_SURFACES,
	});

	return Response.json(
		{
			ok: true,
			source: "ema-cli-cockpit-bridge",
			generated_at: generatedAt,
			client: CLIENT,
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
				cwd: workspaceScope?.cwd ?? PROSLYNC_APP,
				home_current_project: status?.project?.name ?? null,
				scope_warning: status?.scope_warning ?? null,
				vcalendar_phase: next?.vcalendar_phase ?? null,
				next_command: next?.next_command ?? null,
				errors,
			},
			lanes,
			queue,
			active_builds: activeBuilds,
			surfaces: PROSLYNC_SURFACES,
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

function healthFrom(input: {
	readonly activeBuilds: readonly Awaited<ReturnType<typeof gitFact>>[];
	readonly daemonUp: boolean;
	readonly intentionsUp: boolean;
	readonly surfaces: typeof PROSLYNC_SURFACES;
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
	return {
		daemon: input.daemonUp ? "up" : "down",
		web: "up",
		dirty_builds: input.activeBuilds.filter((build) => build.git_status === "dirty").length,
		no_git_builds: input.activeBuilds.filter((build) => build.git_status === "no_git").length,
		stale_records: [] as string[],
		proslync_ready: input.daemonUp && input.intentionsUp && gitFactsLoaded && desktopExplicit && input.surfaces.length >= 6,
	};
}
