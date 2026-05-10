// `ema doctor` — self-diagnostic. Subscribes to every projection the
// daemon exposes, summarises canonical state, reports gap counts.
//
// Run after a change to know if cohesion is intact.

import type { ParsedArgs } from "../args.js";
import { flagBool } from "../args.js";
import { connect, type ProjectionEnvelope } from "../ws-client.js";
import { emitJson, emitPretty } from "../output.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";
import { buildReadiness, type ReadinessBlocker } from "./readiness.js";

interface DoctorReport {
	ok: boolean;
	health_ok: boolean;
	readiness_ok: boolean;
	daemon: string;
	canonical_phase: string | null;
	blueprint: {
		documents: number;
		sections: number;
		gac_cards: number;
		blockers: number;
		aspirations: number;
		decisions: number;
	};
	intent_graph: {
		nodes: number;
		edges: number;
	};
	workspace: {
		lanes: number;
		queue_items: number;
		open_lanes: number;
	};
	gaps: {
		total: number;
		open: number;
		closed: number;
		by_alley: Record<string, { open: number; closed: number }>;
	};
	subsystems: Array<{ id: string; status: "ok" | "partial" | "missing"; note: string }>;
	roadmap_gaps: Array<{ id: string; status: "partial" | "missing"; note: string }>;
	blocking_failures: Array<{ id: string; message: string }>;
	readiness_blockers: ReadinessBlocker[];
}

async function readChannel<T>(channel: string, timeoutMs: number): Promise<T | null> {
	try {
		const c = await connect({ surface: "desktop" });
		const data = await new Promise<T | null>((resolve) => {
			const timer = setTimeout(() => resolve(null), timeoutMs);
			c.onMessage((msg) => {
				const env = msg as ProjectionEnvelope;
				if (env.type === "projection" && env.name === channel) {
					clearTimeout(timer);
					resolve(env.data as T);
				}
			});
			c.subscribe(channel);
		});
		c.close();
		return data;
	} catch {
		return null;
	}
}

interface BlueprintProj {
	documents: Array<{ id: string; sections: Array<{ id: string }> }>;
}

interface PlannerProj {
	gac_cards?: unknown[];
	blockers?: unknown[];
	aspirations?: unknown[];
	decisions?: unknown[];
}

interface IntentGraphProj {
	nodes?: unknown[];
	edges?: unknown[];
}

interface VcalState {
	current_phase?: string | null;
}

interface LaneRegistry {
	lanes?: Array<{ id: string; title: string; status: string }>;
}

interface QueueRegistry {
	queue_items?: Array<{ id: string; status: string }>;
}

const ALLEY_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"];

function alleyOf(title: string): string | null {
	const m = title.match(/^\[W4-gap\]\s+([A-Z])\.\d+/);
	return m ? m[1] : null;
}

function emoji(status: "ok" | "partial" | "missing"): string {
	if (status === "ok") return "+";
	if (status === "partial") return "~";
	return "!";
}

export async function runDoctor(args: ParsedArgs): Promise<number> {
	if (flagBool(args, "help") || args.flags.h === true || args.positional[0] === "help") {
		return runStubContract(args, {
			noun: "doctor",
			status: "available",
			usage: "Usage: ema doctor [--strict] [--json]",
			docRef: "docs/cli/agent-workspace.md",
			commands: [
				{ verb: "run", flags: ["strict", "json"], summary: "Check daemon health separately from execution readiness blockers." },
			],
		});
	}
	const json = flagBool(args, "json");
	const strict = flagBool(args, "strict");
	try {
		const [bp, planner, graph, vcal, laneReg, queueReg] = await Promise.all([
			readChannel<BlueprintProj>("blueprint.sections", 1500),
			readChannel<PlannerProj>("blueprint.planner", 1500),
			readChannel<IntentGraphProj>("intent_graph", 2500),
			readChannel<VcalState>("vcalendar.state", 1500),
			readChannel<LaneRegistry>("lane.registry", 1500),
			readChannel<QueueRegistry>("queue.registry", 1500),
		]);

		const docs = bp?.documents ?? [];
		const sectionCount = docs.reduce((n, d) => n + (d.sections?.length ?? 0), 0);

		const lanes = laneReg?.lanes ?? [];
		const gapLanes = lanes.filter((l) => l.title.startsWith("[W4-gap]"));
		const gapsByAlley: Record<string, { open: number; closed: number }> = {};
		for (const a of ALLEY_LETTERS) gapsByAlley[a] = { open: 0, closed: 0 };
		let gapsOpen = 0;
		let gapsClosed = 0;
		for (const l of gapLanes) {
			const a = alleyOf(l.title);
			if (!a) continue;
			const isClosed = l.status === "done" || l.status === "closed";
			if (isClosed) {
				gapsClosed += 1;
				gapsByAlley[a].closed += 1;
			} else {
				gapsOpen += 1;
				gapsByAlley[a].open += 1;
			}
		}

		const subsystems: DoctorReport["subsystems"] = [
			{ id: "T1.1 workspace-lifecycle-writers", status: "ok", note: "lane + queue lifecycles wired end-to-end" },
			{ id: "T1.2 blueprint-planner-ipc-cli", status: "partial", note: "6 of 12 ops in IPC; 6 missing (C.1)" },
			{ id: "T1.3 vcalendar-daemon-record", status: "ok", note: "phase canonical via vcalendar.state projection" },
			{ id: "T2.1 cross-ref-fields", status: "ok", note: "blueprint_section_id / gac_id / decision_id on lane.opened + queue_item.added" },
			{ id: "T2.2 atlas-decisions-bridge", status: "partial", note: "one-way import done; live re-import on edit pending (C.3)" },
			{ id: "T2.3 web-blueprint-surface", status: "partial", note: "Blueprint vApp live; 5 EMA vApp stubs not wired (F.1-5)" },
			{ id: "T2.4 intent-graph-projection", status: "ok", note: "nodes + edges joined across all 8 kinds" },
			{ id: "T2.5 phase-aware-tick", status: "ok", note: "tick reads canonical phase + blocks + checkups_due" },
			{ id: "T3.1 soft-phase-enforcement", status: "partial", note: "lane.open wired; 12 other ops pending (A.1)" },
			{ id: "T3.2 auto-checkup-tick", status: "partial", note: "v1 on-demand IPC + CLI; periodic actor pending (D.1)" },
			{ id: "T3.3 auto-grow-agent", status: "ok", note: "package builds; detector tests pass" },
			{ id: "promote-to-proposal", status: "ok", note: "blueprint.section.promote emits proposal.drafted + mirror" },
			{
				id: "skills-wiki-runtime",
				status: "partial",
				note: "doc-registry-backed ema wiki resolver live; skill catalog + web vApp catalog still pending (H.1, H.2)",
			},
			{ id: "replication-writers", status: "missing", note: "ADR 17/18; not implemented (I.2)" },
			{ id: "incidents-projection", status: "missing", note: "incident.noted lands but no aggregator (O.2)" },
		];

		const phase = (vcal?.current_phase ?? null) || null;
		const projectionFailures: DoctorReport["blocking_failures"] = [];
		const allProjectionReadsTimedOut = [bp, planner, graph, vcal, laneReg, queueReg].every((value) => value === null);
		if (allProjectionReadsTimedOut) {
			projectionFailures.push({ id: "daemon.websocket", message: "no daemon projections received before timeout" });
		}
		if (!vcal) projectionFailures.push({ id: "vcalendar.state", message: "missing vcalendar.state projection" });
		if (!laneReg) projectionFailures.push({ id: "lane.registry", message: "missing lane.registry projection" });
		if (!queueReg) projectionFailures.push({ id: "queue.registry", message: "missing queue.registry projection" });
		const roadmapGaps = subsystems
			.filter((s): s is { id: string; status: "partial" | "missing"; note: string } => s.status === "partial" || s.status === "missing")
			.map((s) => ({ id: s.id, status: s.status, note: s.note }));
		const readiness = await buildReadiness(args);
		const healthOk = projectionFailures.length === 0;
		const readinessOk = healthOk && readiness.report.blockers.length === 0;

		const report: DoctorReport = {
			ok: healthOk,
			health_ok: healthOk,
			readiness_ok: readinessOk,
			daemon: "ws://127.0.0.1:49555",
			canonical_phase: phase,
			blueprint: {
				documents: docs.length,
				sections: sectionCount,
				gac_cards: planner?.gac_cards?.length ?? 0,
				blockers: planner?.blockers?.length ?? 0,
				aspirations: planner?.aspirations?.length ?? 0,
				decisions: planner?.decisions?.length ?? 0,
			},
			intent_graph: {
				nodes: graph?.nodes?.length ?? 0,
				edges: graph?.edges?.length ?? 0,
			},
			workspace: {
				lanes: lanes.length,
				queue_items: queueReg?.queue_items?.length ?? 0,
				open_lanes: lanes.filter((l) => l.status !== "done" && l.status !== "closed").length,
			},
			gaps: {
				total: gapLanes.length,
				open: gapsOpen,
				closed: gapsClosed,
				by_alley: gapsByAlley,
			},
			subsystems,
			roadmap_gaps: roadmapGaps,
			blocking_failures: projectionFailures,
			readiness_blockers: readiness.report.blockers,
		};

		if (json) {
			emitJson(report);
			return strict ? (readinessOk ? 0 : 1) : (healthOk ? 0 : 1);
		}

		emitPretty(`# ema doctor`);
		emitPretty(`daemon:           ${report.daemon}`);
		emitPretty(`canonical phase:  ${report.canonical_phase ?? "(unset)"}`);
		emitPretty("");
		emitPretty(`blueprint:        ${report.blueprint.documents} docs · ${report.blueprint.sections} sections · ${report.blueprint.gac_cards} GAC · ${report.blueprint.blockers} blockers · ${report.blueprint.aspirations} aspirations · ${report.blueprint.decisions} decisions`);
		emitPretty(`workspace:        ${report.workspace.lanes} lanes (${report.workspace.open_lanes} open) · ${report.workspace.queue_items} queue items`);
		emitPretty(`intent graph:     ${report.intent_graph.nodes} nodes · ${report.intent_graph.edges} edges`);
		emitPretty("");
		emitPretty(`gaps (W4):        ${report.gaps.open} open · ${report.gaps.closed} closed · ${report.gaps.total} total`);
		emitPretty(`by alley:         ${ALLEY_LETTERS.map((a) => `${a}:${gapsByAlley[a].open}/${gapsByAlley[a].open + gapsByAlley[a].closed}`).join("  ")}`);
		emitPretty("");
		emitPretty(`subsystems:`);
		for (const s of subsystems) {
			emitPretty(`  [${emoji(s.status)}] ${s.id.padEnd(38)} ${s.note}`);
		}
		emitPretty("");
		if (projectionFailures.length > 0) {
			emitPretty("blocking failures:");
			for (const failure of projectionFailures) emitPretty(`  - ${failure.id}: ${failure.message}`);
			emitPretty("");
		}
		if (report.readiness_blockers.length > 0) {
			emitPretty("readiness blockers:");
			for (const blocker of report.readiness_blockers) emitPretty(`  - ${blocker.id}: ${blocker.reason}`);
			emitPretty("");
		}
		emitPretty(`health:           ${healthOk ? "ok" : "blocked"}`);
		emitPretty(`readiness:        ${readinessOk ? "ok" : "execution blockers remain"}`);
		if (!strict && report.readiness_blockers.length > 0) emitPretty("strict mode:      `ema doctor --strict` exits nonzero while readiness blockers remain");
		return strict ? (readinessOk ? 0 : 1) : (healthOk ? 0 : 1);
	} catch (err) {
		return reportError(err, json);
	}
}
