import { existsSync } from "node:fs";
import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { withDaemonWorkspaceRecords, workspaceSummary } from "../workspace-state.js";
import { loadRecentWorkspaceTrail } from "../workspace-trail.js";
import { DEFAULT_ACTOR, readProjection } from "./workspace-daemon.js";

type NamedProjection = {
	readonly name: string;
	readonly status: "available" | "empty" | "pending_daemon_projection";
	readonly count?: number;
};

const HERMES_ACTOR = "actor:hermes";
const DOCS = [
	"README.md",
	"Projects/README.md",
	"Projects/EMA/project.md",
	"Projects/EMA/PROJECT-MAP.md",
	"Projects/EMA/builds/BUILD-MANIFEST.md",
	"Projects/EMA/atlas/README.md",
	"Projects/EMA/subprojects/agent-workspace-vapp/blueprint/02-agent-cli-operating-contract.md",
	"Active builds/README.md",
	"Active builds/EMA-0.0.5/README.md",
	"Active builds/EMA-0.0.5/docs/cli/agent-workspace.md",
];

export async function runHermes(args: ParsedArgs): Promise<number> {
	const verb = args.positional[0] ?? "orient";
	if (flagBool(args, "help") || args.flags.h === true || verb === "help") return runHermesHelp(args);
	if (verb === "orient" || verb === "status") return runHermesOrient(args, verb);
	if (verb === "plan") return runHermesPlan(args);
	if (verb === "sweep") return runHermesSweep(args);
	if (verb === "dispatch") return runHermesDispatch(args);
	if (verb === "handoff" || verb === "audit") return runHermesPending(args, verb);
	emitError(`ema hermes: unknown subcommand "${verb}" (expected: orient | status | plan | dispatch | sweep | handoff | audit)`);
	return 64;
}

function runHermesHelp(args: ParsedArgs): number {
	const commands = [
		{ verb: "orient", summary: "Build the canonical Hermes resume packet from live workspace state." },
		{ verb: "status", summary: "Alias of orient with the same swarm-lead projection." },
		{ verb: "plan", summary: "Propose the next orchestration plan from lanes, queue, risks, and providers." },
		{ verb: "dispatch", summary: "Describe or seed a Harness Glue dispatch from the Hermes plan." },
		{ verb: "sweep", summary: "Find lost threads and format queue-ready follow-up records." },
		{ verb: "handoff", summary: "Show the handoff contract for Hermes-led work." },
		{ verb: "audit", summary: "Show auditable event/projection rails for Hermes work." },
	];
	if (flagBool(args, "json")) {
		emitJson({ noun: "hermes", status: "daemon_projection_seed", commands, projection: "hermes.orchestrator" });
		return 0;
	}
	emitPretty("ema hermes — durable swarm lead controls");
	emitPretty("status: daemon projection seed; projection: hermes.orchestrator");
	for (const command of commands) emitPretty(`  ${command.verb.padEnd(10)} ${command.summary}`);
	return 0;
}

async function runHermesOrient(args: ParsedArgs, verb: string): Promise<number> {
	const json = flagBool(args, "json");
	const actor = flagString(args, "actor") ?? HERMES_ACTOR;
	const daemonRecent = await loadRecentWorkspaceTrail(args);
	const summary = withDaemonWorkspaceRecords(workspaceSummary(), {
		lanes: daemonRecent.lanes.map((lane) => ({
			id: lane.id,
			title: lane.title,
			type: "daemon_lane",
			status: lane.status,
			path: `daemon://lane.registry/${lane.id}`,
		})),
		queue: daemonRecent.queue.map((item) => ({
			id: item.id,
			title: item.title,
			type: "daemon_queue_item",
			status: item.status,
			path: `daemon://queue.registry/${item.id}`,
		})),
	});
	const handoffs = await readProjection(args, {
		name: "handoff.registry",
		pick: (data) => (Array.isArray(data.handoffs) ? data.handoffs : []),
	}) ?? [];
	const reports = await readProjection(args, {
		name: "agent.reports",
		pick: (data) => (Array.isArray(data.reports) ? data.reports : []),
	}) ?? [];
	const activeLane = daemonRecent.lanes.find((lane) => lane.actor_id === actor && lane.status !== "done")
		?? daemonRecent.lanes.find((lane) => lane.actor_id === DEFAULT_ACTOR && lane.title.toLowerCase().includes("hermes") && lane.status !== "done")
		?? null;
	const recommendedLane = activeLane ?? daemonRecent.lanes.find((lane) => lane.status === "ready" && !lane.actor_id) ?? daemonRecent.lanes.find((lane) => lane.status === "idea" && !lane.actor_id) ?? null;
	const blockedWork = daemonRecent.queue.filter((item) => item.status === "blocked");
	const activeRisks = [
		...blockedWork.map((item) => ({ id: item.id, title: item.title, blocked_by: item.blocked_by ?? null })),
		...(daemonRecent.error ? [{ id: "daemon.workspace.read", title: "Workspace registries unavailable", blocked_by: daemonRecent.error }] : []),
	];
	const projections: NamedProjection[] = [
		{ name: "hermes.orchestrator", status: "available", count: 1 },
		{ name: "lane.registry", status: daemonRecent.lanes.length > 0 ? "available" : "empty", count: daemonRecent.lanes.length },
		{ name: "queue.registry", status: daemonRecent.queue.length > 0 ? "available" : "empty", count: daemonRecent.queue.length },
		{ name: "dispatch.registry", status: "pending_daemon_projection" },
		{ name: "execution.registry", status: "pending_daemon_projection" },
		{ name: "tool.timeline", status: "pending_daemon_projection" },
		{ name: "chronicle.activity", status: "pending_daemon_projection" },
	];
	const resumePacket = {
		docs_read: DOCS.map((doc) => ({ path: doc, present: existsSync(`${summary.root}/${doc}`) })),
		dirty_tree: { status: "not_computed", command: "git status --short" },
		daemon_projections: projections,
		open_lanes: daemonRecent.lanes.filter((lane) => lane.status !== "done").slice(0, 8),
		queue: daemonRecent.queue.filter((item) => item.status !== "closed").slice(0, 8),
		blockers: blockedWork,
		blueprint_planner: { projection: "blueprint.planner", status: "available_via_blueprint_cli_or_pending_projection" },
		wiki_hits: { status: "not_queried", command: "ema wiki search --query <topic> --json" },
		active_dispatches: [],
		chronicle_recent_events: { projection: "chronicle.activity", status: "pending_daemon_projection" },
		peer_status: { rail: "ssh", status: "local_only_until_peer_registry" },
		dev_server_status: { status: "not_checked", commands: ["ema status --json", "pnpm cli status --json"] },
		recommended_lane: recommendedLane,
		active_risks: activeRisks,
		blocked_work: blockedWork,
		verification_state: {
			required: ["pnpm --filter @ema/cli typecheck", "pnpm --filter @ema/cli build", "node tooling/hermes-harness-cli-smoke.mjs"],
			latest_reports: reports.slice(0, 3),
		},
		next_actions: nextActions(recommendedLane?.id ?? null, blockedWork.length),
	};
	if (json) {
		emitJson({
			ok: true,
			command: `hermes ${verb}`,
			actor,
			projection: "hermes.orchestrator",
			workspace: summary,
			daemon_recent: daemonRecent,
			resume_packet: resumePacket,
			handoffs,
		});
		return 0;
	}
	emitPretty("hermes orchestrator");
	emitPretty(`actor: ${actor}`);
	emitPretty(`recommended lane: ${recommendedLane?.id ?? "(none)"}`);
	for (const action of resumePacket.next_actions) emitPretty(`  - ${action}`);
	return 0;
}

async function runHermesPlan(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const daemonRecent = await loadRecentWorkspaceTrail(args);
	const lane = flagString(args, "lane") ?? daemonRecent.lanes.find((candidate) => candidate.actor_id === HERMES_ACTOR && candidate.status !== "done")?.id ?? daemonRecent.lanes.find((candidate) => candidate.status !== "done")?.id ?? null;
	const plan = {
		goal: "Coordinate EMA work through Hermes while every action remains auditable through workspace and dispatch events.",
		lane,
		dispatches: [
			{ provider: "simulated", lane, cwd: "Active builds/EMA-0.0.5", purpose: "prove Harness Glue event normalization" },
			{ provider: "codex", lane, cwd: "Active builds/EMA-0.0.5", purpose: "future PTY adapter implementation", status: "planned" },
			{ provider: "claude-code", lane, cwd: "Active builds/EMA-0.0.5", purpose: "future PTY adapter implementation", status: "planned" },
		],
		verification: ["ema hermes orient --json", "ema harness providers --json", "ema harness dispatch --provider simulated --json", "ema peer doctor --json"],
		risks: daemonRecent.queue.filter((item) => item.status === "blocked").map((item) => item.title),
	};
	if (json) emitJson({ ok: true, command: "hermes plan", projection: "hermes.orchestrator", plan });
	else {
		emitPretty("hermes plan");
		for (const dispatch of plan.dispatches) emitPretty(`  - ${dispatch.provider}: ${dispatch.purpose}`);
	}
	return 0;
}

async function runHermesSweep(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const daemonRecent = await loadRecentWorkspaceTrail(args);
	const staleLanes = daemonRecent.lanes.filter((lane) => !lane.actor_id && lane.status !== "done").slice(0, 5);
	const lostThreads = staleLanes.map((lane) => ({
		title: `Resume or retire lane: ${lane.title}`,
		why: "Hermes sweep found an unowned non-done lane that can become lost work.",
		depends_on: lane.depends_on ?? null,
		blocked_by: null,
		done_when: lane.done_when ?? "lane is claimed, closed, or converted into a queue item with an owner",
		source: `hermes.sweep:${lane.id}`,
		lane_id: lane.id,
	}));
	const sweep = { lost_threads: lostThreads, queue_command: "ema queue add --title <title> --why <why> --done-when <done_when> --source <source> --json" };
	if (json) emitJson({ ok: true, command: "hermes sweep", projection: "hermes.orchestrator", sweep });
	else {
		emitPretty(`lost threads: ${lostThreads.length}`);
		for (const thread of lostThreads) emitPretty(`  - ${thread.title}`);
	}
	return 0;
}

function runHermesDispatch(args: ParsedArgs): number {
	const provider = flagString(args, "provider") ?? "simulated";
	const lane = flagString(args, "lane") ?? null;
	const prompt = flagString(args, "prompt") ?? "Hermes planned dispatch";
	const dispatch = {
		provider,
		lane,
		prompt,
		next_cli: `ema harness dispatch --provider ${provider}${lane ? ` --lane ${lane}` : ""} --prompt "${prompt}" --json`,
	};
	if (flagBool(args, "json")) emitJson({ ok: true, command: "hermes dispatch", projection: "hermes.orchestrator", dispatch });
	else emitPretty(dispatch.next_cli);
	return 0;
}

function runHermesPending(args: ParsedArgs, verb: string): number {
	const payload = {
		ok: true,
		command: `hermes ${verb}`,
		status: "pending_daemon_writer",
		projection: "hermes.orchestrator",
		note: "Hermes handoff/audit grammar is reserved; canonical writes should flow through handoff/agent/harness events.",
	};
	if (flagBool(args, "json")) emitJson(payload);
	else emitPretty(payload.note);
	return 0;
}

function nextActions(lane: string | null, blockedCount: number): string[] {
	if (lane) {
		return [
			`ema lane show --lane ${lane} --json`,
			"ema harness providers --json",
			"ema harness dispatch --provider simulated --lane <lane> --cwd \"Active builds/EMA-0.0.5\" --prompt \"prove Harness Glue\" --json",
		];
	}
	if (blockedCount > 0) return ["ema hermes sweep --json", "ema queue list --status blocked --json", "ema problem --help"];
	return ["ema lane list --json", "ema hermes plan --json", "ema vcalendar tick --json"];
}
