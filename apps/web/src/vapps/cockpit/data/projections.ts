/**
 * Cockpit projection stubs.
 *
 * In Slice 4 these return canned placeholder data so the UI renders. In Slice 5
 * each `selectXxx` will be replaced by a daemon WebSocket subscription
 * (TODO: wire to `apps/daemon` projection events). Until then the read API
 * mirrors the donor's `@cwt/surface-core` shape so component code does not
 * have to change when real reads land.
 *
 * Donor mapping:
 *   selectNow              -> @cwt/surface-core selectNow
 *   selectClientWork       -> @cwt/surface-core selectClientWork
 *   selectClientBench      -> @cwt/surface-core selectClientBench
 *   selectProjectBench     -> @cwt/surface-core selectProjectBench
 *   selectProjectsByKind   -> @cwt/surface-core selectProjectsByKind
 *   selectSpaces           -> @cwt/surface-core selectSpaces
 */

import type {
	ClientBench,
	ClientWorkItem,
	CockpitProject,
	CockpitSpace,
	NowProjection,
	ProjectBench,
	ProjectKindFilter,
} from "./types";

const SPACES: readonly CockpitSpace[] = [
	{ id: "space:01J00000000000000000000013", name: "Personal Workspace", kind: "default" },
	{ id: "space:01J00000000000000000000005", name: "EMA Studio", kind: "studio" },
];

const CLIENTS = [
	{ id: "client:01KRA00000000000000000ACME", name: "Acme Holdings", color: "#5b8def" },
	{ id: "client:01KRA00000000000000000BAKR", name: "Baker Labs", color: "#f5a524" },
] as const;

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
		id: "project:01KRA0PROJ000ACME000PORTAL",
		name: "Acme client portal refresh",
		kind: "client",
		client_id: CLIENTS[0].id,
		client_label: CLIENTS[0].name,
		client_color: CLIENTS[0].color,
		space_id: SPACES[0]!.id,
	},
	{
		id: "project:01KRA0PROJ000ACME000DATAR",
		name: "Acme data-room migration",
		kind: "client",
		client_id: CLIENTS[0].id,
		client_label: CLIENTS[0].name,
		client_color: CLIENTS[0].color,
		space_id: SPACES[0]!.id,
	},
	{
		id: "project:01KRA0PROJ000BAKR000WBSITE",
		name: "Baker Labs static site",
		kind: "client",
		client_id: CLIENTS[1].id,
		client_label: CLIENTS[1].name,
		client_color: CLIENTS[1].color,
		space_id: SPACES[0]!.id,
	},
];

const STUB_LANES = [
	{
		id: "lane:01KRA0LANE000COCKPIT000PORT",
		project_id: PROJECTS[0]!.id,
		title: "Slice 4 — port cwt web into EMA cockpit vApp",
		why: "Migrate donor surface so EMA owns project tracker UI.",
		status: "claimed" as const,
	},
	{
		id: "lane:01KRA0LANE000IOS00000000FOC",
		project_id: PROJECTS[1]!.id,
		title: "Focus session UI polish",
		why: "Reduce friction during a tracked work block.",
		status: "open" as const,
	},
	{
		id: "lane:01KRA0LANE000ACME000PORTAL",
		project_id: PROJECTS[2]!.id,
		title: "Acme portal — auth provider",
		why: "Pick OIDC vs custom auth before sprint kickoff.",
		status: "review" as const,
	},
];

const STUB_QUEUE = [
	{
		id: "queue:01KRA0QUEUE0000000000000001",
		project_id: PROJECTS[0]!.id,
		title: "Reconcile cockpit design tokens with EMA design-system",
		why: "Avoid duplicate hex constants; map to existing place-* tokens.",
		priority: 2 as const,
		status: "open" as const,
		promotion_state: "ready" as const,
	},
	{
		id: "queue:01KRA0QUEUE0000000000000002",
		project_id: PROJECTS[1]!.id,
		title: "Add quick-pause keybind to Focus app",
		why: "Pausing without breaking flow needs a single chord.",
		priority: 3 as const,
		status: "open" as const,
		promotion_state: "proposal" as const,
	},
	{
		id: "queue:01KRA0QUEUE0000000000000003",
		project_id: PROJECTS[2]!.id,
		title: "Document Acme auth decision",
		why: "Lock the choice in writing before the sprint.",
		priority: 2 as const,
		status: "open" as const,
		promotion_state: "ready" as const,
	},
	{
		id: "queue:01KRA0QUEUE0000000000000004",
		project_id: PROJECTS[3]!.id,
		title: "Audit Acme data-room migration scope",
		why: "Confirm what is in scope for v1 versus v1.1.",
		priority: 3 as const,
		status: "open" as const,
		promotion_state: "proposal" as const,
	},
	{
		id: "queue:01KRA0QUEUE0000000000000005",
		project_id: PROJECTS[4]!.id,
		title: "Baker Labs — placeholder favicon",
		why: "Anonymous tab is breaking brand trust.",
		priority: 4 as const,
		status: "open" as const,
		promotion_state: "proposal" as const,
	},
];

const STUB_HANDOFFS = [
	{
		id: "handoff:01KRA0HANDOFF000000000COCK",
		project_id: PROJECTS[0]!.id,
		from_owner: "claude/cockpit-port",
		to_owner: "trajan",
		next_move: "Review cockpit shell rendering and confirm token mapping.",
		state: "pending" as const,
		envelope_confidence: 0.78,
		envelope_completeness: 0.62,
		envelope_provenance: "claude-opus-4.7",
	},
	{
		id: "handoff:01KRA0HANDOFF000000000ACME",
		project_id: PROJECTS[2]!.id,
		from_owner: "trajan",
		to_owner: "acme/account-rep",
		next_move: "Confirm OIDC vendor preference before Friday.",
		state: "pending" as const,
		envelope_confidence: 0.81,
		envelope_completeness: 0.74,
		envelope_provenance: "human-write",
	},
];

const STUB_PROBLEMS = [
	{
		id: "problem:01KRA0PROB000000000000DAEMON",
		project_id: PROJECTS[0]!.id,
		title: "Daemon WebSocket reads not yet wired",
		why: "Slice 4 stubs projections so UI ships without daemon dependency.",
	},
];

const STUB_CAMPAIGNS = [
	{
		id: "campaign:01KRA0CAMP000000000ABSORB",
		project_id: PROJECTS[0]!.id,
		title: "EMA absorbs cwt",
		why: "Fold cwt's surface into EMA so there is one home for project work.",
	},
];

const STUB_VCAL_BLOCKS = [
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

// TODO(slice-5): wire to daemon WebSocket projection feed.
export async function selectNow(): Promise<NowProjection> {
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

// TODO(slice-5): wire to daemon WebSocket projection feed.
export async function selectClientWork(): Promise<readonly ClientWorkItem[]> {
	return CLIENTS.map((client) => ({
		client,
		projects: PROJECTS.filter((p) => p.client_id === client.id),
	}));
}

// TODO(slice-5): wire to daemon WebSocket projection feed.
export async function selectClientBench(clientId: string): Promise<ClientBench | null> {
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

// TODO(slice-5): wire to daemon WebSocket projection feed.
export async function selectProjectBench(projectId: string): Promise<ProjectBench | null> {
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
	};
}

// TODO(slice-5): wire to daemon WebSocket projection feed.
export async function selectProjectsByKind(
	kind: ProjectKindFilter,
): Promise<readonly CockpitProject[]> {
	if (kind === "all") return PROJECTS;
	return PROJECTS.filter((p) => p.kind === kind);
}

// TODO(slice-5): wire to daemon WebSocket projection feed.
export async function selectSpaces(): Promise<readonly CockpitSpace[]> {
	return SPACES;
}

// TODO(slice-5): wire to daemon command IPC.
export async function publishQueueCapture(input: {
	readonly project_id: string;
	readonly title: string;
	readonly why: string;
	readonly done_when: string;
	readonly source: string;
	readonly priority: 1 | 2 | 3 | 4 | 5;
	readonly tags: string;
}): Promise<{ readonly ok: true; readonly queue_id: string }> {
	const id = `queue:01KRA0CAPTURE${Date.now().toString(36).toUpperCase().padStart(13, "0")}`;
	if (typeof window !== "undefined") {
		// eslint-disable-next-line no-console
		console.info("[cockpit] would publish queue.captured", { id, ...input });
	}
	return { ok: true, queue_id: id };
}

// TODO(slice-5): wire to daemon agent command IPC.
export async function publishAgentMessage(message: string): Promise<{
	readonly ok: true;
	readonly reply: string;
	readonly actions: readonly string[];
}> {
	if (typeof window !== "undefined") {
		// eslint-disable-next-line no-console
		console.info("[cockpit] would publish agent.message", { message });
	}
	const lower = message.toLowerCase();
	if (lower.startsWith("queue:")) {
		return {
			ok: true,
			reply: "Captured (stubbed). Real daemon publish wires in Slice 5.",
			actions: ["stub: queue.captured"],
		};
	}
	if (lower.includes("first day")) {
		return {
			ok: true,
			reply: [
				"First-day operating shape:",
				"1. Capture every live obligation as a queue item.",
				"2. Tag each item to one project: client, personal, or internal.",
				"3. Pick one lane only after the queue has enough context to rank.",
				"4. Promote to EMA only when why, done_when, source, and blockers are present.",
			].join("\n"),
			actions: ["stub: returned guidance"],
		};
	}
	return {
		ok: true,
		reply: [
			"Cockpit agent grammar (stubbed in Slice 4):",
			"queue: Title | why: ... | done: ...",
			"first day",
		].join("\n"),
		actions: ["stub: showed grammar"],
	};
}
