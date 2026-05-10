/**
 * Cockpit projection adapters.
 *
 * EMA's cockpit is the native client-work surface. It reads live workspace
 * state through the local cockpit projection bridge, then falls back to staged
 * donor data when the daemon or CLI is unavailable.
 *
 * Proslync project metadata (client identity, color, project id) lives in the
 * project registry at `src/lib/project-registry/`, mirrored from the CLI
 * source of truth at `apps/cli/src/project-registry/`. Do not redefine the
 * Proslync client/project here.
 */

import { Proslync } from "../../../lib/project-registry";
import type {
	ClientBench,
	ClientWorkItem,
	CockpitActiveBuild,
	CockpitCampaign,
	CockpitClient,
	CockpitHandoff,
	CockpitHealth,
	CockpitAgentPublishResult,
	CockpitIntentionsProjection,
	CockpitLane,
	CockpitProblem,
	CockpitProject,
	CockpitQueueItem,
	CockpitQueuePublishResult,
	CockpitSpace,
	CockpitSurface,
	CockpitVcalendarBlock,
	CockpitWorkspaceContext,
	NowProjection,
	ProjectBench,
	ProjectKindFilter,
} from "./types";

const SPACES: readonly CockpitSpace[] = [
	{ id: "space:01J00000000000000000000013", name: "Personal Workspace", kind: "default" },
	{ id: "space:01J00000000000000000000005", name: "EMA Studio", kind: "studio" },
];

const PROSLYNC_CLIENT: CockpitClient = {
	id: Proslync.clientId ?? "client:ms-wilson",
	name: Proslync.clientName ?? "Ms. Wilson",
	color: Proslync.clientColor,
};

const CLIENTS: readonly CockpitClient[] = [PROSLYNC_CLIENT];

const PROJECTS: readonly CockpitProject[] = [
	{
		id: "project:01KR0AAG8D004J8015N9P8A0VY",
		name: "current-work-tracker-trajan",
		kind: "internal",
		client_id: null,
		client_label: null,
		client_color: "#a78bfa",
		space_id: SPACES[0]!.id,
	},
	{
		id: "project:01KQD9RMA000Y2Z58RCSNCJNT0",
		name: "locked-in-ios-app",
		kind: "personal",
		client_id: null,
		client_label: null,
		client_color: "#7ed957",
		space_id: SPACES[0]!.id,
	},
	{
		id: Proslync.projectId,
		name: Proslync.projectSlug,
		kind: "client",
		client_id: PROSLYNC_CLIENT.id,
		client_label: PROSLYNC_CLIENT.name,
		client_color: PROSLYNC_CLIENT.color,
		space_id: SPACES[0]!.id,
	},
	{
		id: "project:proslync-backend",
		name: "proslync-backend",
		kind: "client",
		client_id: CLIENTS[0]!.id,
		client_label: CLIENTS[0]!.name,
		client_color: CLIENTS[0]!.color,
		space_id: SPACES[0]!.id,
	},
	{
		id: "project:proslync-desktop",
		name: "proslync-desktop",
		kind: "client",
		client_id: CLIENTS[0]!.id,
		client_label: CLIENTS[0]!.name,
		client_color: CLIENTS[0]!.color,
		space_id: SPACES[0]!.id,
	},
];

const STUB_LANES: readonly CockpitLane[] = [
	{
		id: "lane:01KRA0LANE000COCKPIT000PORT",
		project_id: PROJECTS[0]!.id,
		title: "Cockpit migration fallback",
		why: "Migrate donor surface so EMA owns project tracker UI.",
		status: "claimed",
	},
	{
		id: "lane:01KRA0LANE000IOS00000000FOC",
		project_id: PROJECTS[1]!.id,
		title: "Focus session UI polish",
		why: "Reduce friction during a tracked work block.",
		status: "open",
	},
	{
		id: "lane:01KRA0LANE000PROSLYNC000",
		project_id: PROJECTS[2]!.id,
		title: "Proslync cockpit readiness",
		why: "Make EMA reliable enough to coordinate Proslync implementation swarms.",
		status: "review",
	},
];

const STUB_QUEUE: readonly CockpitQueueItem[] = [
	{
		id: "queue:01KRA0QUEUE0000000000000001",
		project_id: PROJECTS[0]!.id,
		title: "Reconcile cockpit design tokens with EMA design-system",
		why: "Avoid duplicate hex constants; map to existing place-* tokens.",
		priority: 2,
		status: "open",
		promotion_state: "ready",
	},
	{
		id: "queue:01KRA0QUEUE0000000000000002",
		project_id: PROJECTS[1]!.id,
		title: "Add quick-pause keybind to Focus app",
		why: "Pausing without breaking flow needs a single chord.",
		priority: 3,
		status: "open",
		promotion_state: "proposal",
	},
	{
		id: "queue:01KRA0QUEUE0000000000000003",
		project_id: PROJECTS[2]!.id,
		title: "Link Proslync active builds into cockpit",
		why: "Proslync needs app, backend, desktop, and assets visible as one client workspace.",
		priority: 2,
		status: "open",
		promotion_state: "ready",
	},
];

const STUB_HANDOFFS: readonly CockpitHandoff[] = [
	{
		id: "handoff:01KRA0HANDOFF000000000COCK",
		project_id: PROJECTS[0]!.id,
		from_owner: "claude/cockpit-port",
		to_owner: "trajan",
		next_move: "Review cockpit shell rendering and confirm token mapping.",
		state: "pending",
		envelope_confidence: 0.78,
		envelope_completeness: 0.62,
		envelope_provenance: "claude-opus-4.7",
	},
];

const STUB_PROBLEMS: readonly CockpitProblem[] = [
	{
		id: "problem:01KRA0PROB000000000000DAEMON",
		project_id: PROJECTS[0]!.id,
		title: "Daemon workspace reads unavailable",
		why: "Cockpit is rendering staged data because live EMA projection bridge did not answer.",
	},
];

const STUB_CAMPAIGNS: readonly CockpitCampaign[] = [
	{
		id: "campaign:01KRA0CAMP000000000ABSORB",
		project_id: PROJECTS[0]!.id,
		title: "EMA absorbs cwt",
		why: "Fold cwt's surface into EMA so there is one home for project work.",
	},
];

const STUB_VCAL_BLOCKS: readonly CockpitVcalendarBlock[] = [
	{
		id: "vcal:01KRA0VCAL00000000000PLAN",
		project_id: PROJECTS[0]!.id,
		phase: "planning",
		start_at: "09:00",
		end_at: "11:00",
		target_id: STUB_LANES[0]!.id,
	},
	{
		id: "vcal:01KRA0VCAL00000000000EXEC",
		project_id: PROJECTS[0]!.id,
		phase: "execution",
		start_at: "11:00",
		end_at: "16:00",
		target_id: STUB_LANES[0]!.id,
	},
];

interface LiveCockpitProjection {
	readonly ok: boolean;
	readonly source: string;
	readonly generated_at: string;
	readonly client: CockpitClient;
	readonly spaces: readonly CockpitSpace[];
	readonly project: CockpitProject;
	readonly workspace: CockpitWorkspaceContext;
	readonly lanes: readonly CockpitLane[];
	readonly queue: readonly CockpitQueueItem[];
	readonly active_builds: readonly CockpitActiveBuild[];
	readonly surfaces: readonly CockpitSurface[];
	readonly health: CockpitHealth;
}

let liveCache: { readonly at: number; readonly value: LiveCockpitProjection | null } | null = null;
let intentionsCache: {
	readonly at: number;
	readonly value: CockpitIntentionsProjection | null;
} | null = null;

async function loadLiveProjection(): Promise<LiveCockpitProjection | null> {
	if (typeof window === "undefined") return null;
	const now = Date.now();
	if (liveCache && now - liveCache.at < 4_000) return liveCache.value;
	try {
		const response = await fetch("/api/cockpit/projection", { cache: "no-store" });
		if (!response.ok) {
			liveCache = { at: now, value: null };
			return null;
		}
		const value = (await response.json()) as LiveCockpitProjection;
		liveCache = { at: now, value: value.ok ? value : null };
		return liveCache.value;
	} catch {
		liveCache = { at: now, value: null };
		return null;
	}
}

async function loadLiveIntentions(): Promise<CockpitIntentionsProjection | null> {
	if (typeof window === "undefined") return null;
	const now = Date.now();
	if (intentionsCache && now - intentionsCache.at < 4_000) return intentionsCache.value;
	try {
		const response = await fetch("/api/cockpit/intentions", { cache: "no-store" });
		if (!response.ok) {
			intentionsCache = { at: now, value: null };
			return null;
		}
		const value = (await response.json()) as CockpitIntentionsProjection;
		intentionsCache = { at: now, value: value.ok ? value : null };
		return intentionsCache.value;
	} catch {
		intentionsCache = { at: now, value: null };
		return null;
	}
}

function projectMatches(project: CockpitProject, projectId: string): boolean {
	return project.id === projectId || project.name === projectId;
}

function clientWorkFromLive(live: LiveCockpitProjection): readonly ClientWorkItem[] {
	return [
		{
			client: live.client,
			projects: [live.project],
		},
	];
}

function liveActiveLane(live: LiveCockpitProjection): CockpitLane | null {
	return (
		live.lanes.find((lane) => lane.status === "active") ??
		live.lanes.find((lane) => lane.status === "ready") ??
		live.lanes[0] ??
		null
	);
}

function projectProblems(live: LiveCockpitProjection): readonly CockpitProblem[] {
	const problems: CockpitProblem[] = [];
	if (live.workspace.scope_warning) {
		problems.push({
			id: "problem:scope-warning",
			project_id: live.project.id,
			title: "Home-current project differs from workspace scope",
			why: live.workspace.scope_warning,
		});
	}
	for (const build of live.active_builds) {
		if (build.git_status === "dirty" || build.git_status === "no_git") {
			problems.push({
				id: `problem:${build.id}:${build.git_status}`,
				project_id: live.project.id,
				title:
					build.git_status === "no_git"
						? `${build.label} has no git checkout`
						: `${build.label} has ${build.dirty_count ?? 0} dirty file(s)`,
				why:
					build.git_status === "no_git"
						? "EMA can show and operate the active build, but cannot summarize branch/head from git."
						: "Preserve dirty worktree intent before assigning broad swarm edits.",
			});
		}
	}
	for (const error of live.workspace.errors) {
		problems.push({
			id: `problem:bridge:${problems.length + 1}`,
			project_id: live.project.id,
			title: "Cockpit projection bridge warning",
			why: error,
		});
	}
	return problems;
}

function projectCampaigns(live: LiveCockpitProjection): readonly CockpitCampaign[] {
	return [
		{
			id: "campaign:proslync-c1-backend-core",
			project_id: live.project.id,
			title: "Campaign 1 - backend product-core",
			why: "Persist marketplace objects so app and desktop surfaces can stop depending on mocks.",
		},
		{
			id: "campaign:proslync-c2-c5-buyer-story",
			project_id: live.project.id,
			title: "Campaigns 2 + 5 - Brand HQ and AD cockpit",
			why: "Make the buyer story visible: ranked applicants, revenue share, compliance health.",
		},
		{
			id: "campaign:proslync-c4-trust",
			project_id: live.project.id,
			title: "Campaign 4 - trust, consent, compliance",
			why: "Every AI/data claim carries trust metadata and human approval state.",
		},
	];
}

export async function selectNow(): Promise<NowProjection> {
	const live = await loadLiveProjection();
	if (live) {
		const readyQueue = live.queue.filter((item) => item.status === "ready").slice(0, 12);
		return {
			active_lane: liveActiveLane(live),
			ready_queue: readyQueue,
			latest_handoffs: STUB_HANDOFFS.filter((handoff) => handoff.project_id === live.project.id),
			vcalendar_phase: live.workspace.vcalendar_phase ?? "workspace orchestration",
			client_count: 1,
			client_project_count: 1,
			personal_count: 0,
		};
	}

	return {
		active_lane: STUB_LANES[0] ?? null,
		ready_queue: STUB_QUEUE,
		latest_handoffs: STUB_HANDOFFS,
		vcalendar_phase: "intake and orientation",
		client_count: CLIENTS.length,
		client_project_count: PROJECTS.filter((p) => p.kind === "client").length,
		personal_count: PROJECTS.filter((p) => p.kind === "personal").length,
	};
}

export async function selectClientWork(): Promise<readonly ClientWorkItem[]> {
	const live = await loadLiveProjection();
	if (live) return clientWorkFromLive(live);
	return CLIENTS.map((client) => ({
		client,
		projects: PROJECTS.filter((p) => p.client_id === client.id),
	}));
}

export async function selectClientBench(clientId: string): Promise<ClientBench | null> {
	const live = await loadLiveProjection();
	if (live && live.client.id === clientId) {
		return {
			client: live.client,
			projects: [live.project],
			lanes: live.lanes,
			queue: live.queue,
		};
	}

	const client = CLIENTS.find((c) => c.id === clientId);
	if (!client) return null;
	const projects = PROJECTS.filter((p) => p.client_id === client.id);
	const ids = new Set(projects.map((p) => p.id));
	return {
		client,
		projects,
		lanes: STUB_LANES.filter((l) => ids.has(l.project_id)),
		queue: STUB_QUEUE.filter((q) => ids.has(q.project_id)),
	};
}

export async function selectProjectBench(projectId: string): Promise<ProjectBench | null> {
	const [live, intentions] = await Promise.all([
		loadLiveProjection(),
		loadLiveIntentions(),
	]);
	if (live && projectMatches(live.project, projectId)) {
		return {
			project: live.project,
			lanes: live.lanes,
			queue: live.queue,
			vcalendar_blocks: [],
			problems: projectProblems(live),
			handoffs: STUB_HANDOFFS.filter((handoff) => handoff.project_id === live.project.id),
			campaigns: projectCampaigns(live),
			workspace: live.workspace,
			intentions,
			active_builds: live.active_builds,
			surfaces: live.surfaces,
			health: live.health,
		};
	}

	const project = PROJECTS.find((p) => p.id === projectId);
	if (!project) return null;
	return {
		project,
		lanes: STUB_LANES.filter((l) => l.project_id === projectId),
		queue: STUB_QUEUE.filter((q) => q.project_id === projectId),
		vcalendar_blocks: STUB_VCAL_BLOCKS.filter((b) => b.project_id === projectId),
		problems: STUB_PROBLEMS.filter((p) => p.project_id === projectId),
		handoffs: STUB_HANDOFFS.filter((h) => h.project_id === projectId),
		campaigns: STUB_CAMPAIGNS.filter((c) => c.project_id === projectId),
		workspace: null,
		intentions: null,
		active_builds: [],
		surfaces: [],
		health: null,
	};
}

export async function selectProjectsByKind(
	kind: ProjectKindFilter,
): Promise<readonly CockpitProject[]> {
	const live = await loadLiveProjection();
	if (live) {
		const projects = [live.project];
		if (kind === "all") return projects;
		return projects.filter((p) => p.kind === kind);
	}
	if (kind === "all") return PROJECTS;
	return PROJECTS.filter((p) => p.kind === kind);
}

export async function selectSpaces(): Promise<readonly CockpitSpace[]> {
	const live = await loadLiveProjection();
	if (live) return live.spaces;
	return SPACES;
}

export async function publishQueueCapture(input: {
	readonly project_id: string;
	readonly title: string;
	readonly why: string;
	readonly done_when: string;
	readonly source: string;
	readonly priority: 1 | 2 | 3 | 4 | 5;
	readonly tags: string;
}): Promise<CockpitQueuePublishResult> {
	if (typeof window === "undefined") {
		return {
			ok: false,
			status: "browser_only",
			error: "Queue capture writes are only available from the cockpit browser surface.",
		};
	}
	try {
		const response = await fetch("/api/cockpit/queue", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
		const result = (await response.json()) as CockpitQueuePublishResult;
		if (response.ok && result.ok) return result;
		return {
			...result,
			ok: false,
			status: result.status ?? `http_${response.status}`,
			error: result.error ?? `queue capture failed with HTTP ${response.status}`,
		};
	} catch (error) {
		return {
			ok: false,
			status: "queue_capture_request_failed",
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function publishAgentMessage(message: string): Promise<CockpitAgentPublishResult> {
	const lower = message.toLowerCase();
	const parsed = parseAgentQueueMessage(message);
	const capture = await publishQueueCapture({
		project_id: "proslync-app-ios-final",
		title: parsed.title,
		why: parsed.why,
		done_when: parsed.done_when,
		source: "cockpit-agent-chat",
		priority: lower.includes("urgent") || lower.includes("today") ? 2 : 3,
		tags: parsed.tags,
	});

	if (!capture.ok) {
		return {
			ok: false,
			reply: `Queue write failed: ${capture.error ?? capture.status ?? "unknown error"}`,
			actions: capture.command ? [`failed command: ${capture.command.join(" ")}`] : [],
			error: capture.error,
			command: capture.command,
		};
	}

	return {
		ok: true,
		reply: `Captured as ${capture.queue_id}.`,
		actions: [
			"ema queue add --project proslync-app-ios-final --source cockpit-agent-chat --json",
		],
		queue_id: capture.queue_id,
		command: capture.command,
	};
}

function parseAgentQueueMessage(message: string): {
	readonly title: string;
	readonly why: string;
	readonly done_when: string;
	readonly tags: string;
} {
	const trimmed = message.trim();
	const withoutPrefix = trimmed.replace(/^queue:\s*/i, "");
	const parts = withoutPrefix.split("|").map((part) => part.trim()).filter(Boolean);
	const titlePart = parts[0] ?? trimmed;
	const whyPart = parts.find((part) => /^why:/i.test(part));
	const donePart = parts.find((part) => /^(done|done_when|done when):/i.test(part));
	const tagsPart = parts.find((part) => /^tags?:/i.test(part));
	const title = titlePart.replace(/^title:\s*/i, "").slice(0, 200);
	const why =
		whyPart?.replace(/^why:\s*/i, "") ??
		`Cockpit agent chat capture: ${trimmed}`;
	const done_when =
		donePart?.replace(/^(done|done_when|done when):\s*/i, "") ??
		"Reviewed in Proslync cockpit and either promoted into a lane, merged into an existing queue item, or closed with a reason.";
	const tags = tagsPart?.replace(/^tags?:\s*/i, "") ?? "cockpit-agent-chat";
	return {
		title: title || "Cockpit agent chat capture",
		why,
		done_when,
		tags,
	};
}
