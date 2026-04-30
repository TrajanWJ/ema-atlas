// `ema gap` — dogfooding namespace: list / show / claim / close gaps.
// "Gap" is just a lane whose title starts with `[W4-gap]`. The roadmap
// is canonical in lane.registry; this file is the convenience layer.

import type { ParsedArgs } from "../args.js";
import { flagBool, flagString } from "../args.js";
import { connect, type ProjectionEnvelope } from "../ws-client.js";
import { emitError, emitJson, emitPretty } from "../output.js";
import { reportError } from "./ping.js";
import { runStubContract } from "./stub-contract.js";

const W4_PREFIX = "[W4-gap]";
const DEFAULT_ORG = "org:01J00000000000000000000001";
const DEFAULT_ACTOR = "actor:dev-console";

interface LaneRecord {
	id: string;
	lane_id?: string;
	title: string;
	status: string;
	scope?: string | null;
	done_when?: string | null;
	actor_id?: string | null;
	linked_blueprint?: { section_id?: string | null; gac_id?: string | null; decision_id?: string | null } | null;
	updated_at?: string | null;
}

export async function runGap(args: ParsedArgs): Promise<number> {
	const verb = args.positional[0];
	if (flagBool(args, "help") || args.flags.h === true || verb === "help") {
		return runStubContract(args, {
			noun: "gap",
			status: "available",
			docRef: "docs/cli/agent-workspace-cli-improvement-map.md",
			commands: [
				{ verb: "list", flags: ["alley", "status", "json"], summary: "List W4 gap lanes from lane.registry." },
				{ verb: "show", flags: ["ref", "lane", "id", "json"], summary: "Show a W4 gap by ref or lane id." },
				{ verb: "claim", flags: ["ref", "lane", "actor", "scope", "goal", "next"], summary: "Claim a gap lane." },
				{ verb: "close", flags: ["ref", "lane", "reason", "verify"], summary: "Close a gap lane." },
			],
		});
	}
	if (verb === "list" || verb === undefined) return runList(args);
	if (verb === "show") return runShow(args);
	if (verb === "claim") return runClaim(args);
	if (verb === "close") return runClose(args);
	emitError(`ema gap: unknown subcommand "${verb}" (expected: list | show | claim | close)`);
	return 64;
}

async function readLanes(): Promise<LaneRecord[]> {
	const c = await connect({ surface: "desktop" });
	const lanes = await new Promise<LaneRecord[]>((resolve) => {
		const timer = setTimeout(() => resolve([]), 1500);
		c.onMessage((msg) => {
			const env = msg as ProjectionEnvelope;
			if (env.type === "projection" && env.name === "lane.registry") {
				clearTimeout(timer);
				const data = env.data as { lanes?: LaneRecord[] } | undefined;
				resolve(data?.lanes ?? []);
			}
		});
		c.subscribe("lane.registry");
	});
	c.close();
	return lanes;
}

function alleyOf(title: string): string | null {
	const match = title.match(/^\[W4-gap\]\s+([A-Z])\.(\d+)/);
	return match ? match[1] : null;
}

function refOf(title: string): string | null {
	const match = title.match(/^\[W4-gap\]\s+([A-Z]\.\d+)/);
	return match ? match[1] : null;
}

async function runList(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const alley = flagString(args, "alley");
	const status = flagString(args, "status");
	try {
		const lanes = await readLanes();
		const gaps = lanes.filter((l) => l.title.startsWith(W4_PREFIX));
		const filtered = gaps.filter((l) => {
			if (alley && alleyOf(l.title) !== alley.toUpperCase()) return false;
			if (status && l.status !== status) return false;
			return true;
		});
		if (json) {
			emitJson({
				ok: true,
				source: "lane.registry",
				filter: { alley: alley ?? null, status: status ?? null },
				gaps: filtered.map((l) => ({
					id: l.id,
					ref: refOf(l.title),
					title: l.title,
					status: l.status,
					done_when: l.done_when ?? null,
					blueprint_section_id: l.linked_blueprint?.section_id ?? null,
				})),
			});
			return 0;
		}
		emitPretty(`# gaps  (source: lane.registry)`);
		emitPretty(`${filtered.length} of ${gaps.length} (filtered: alley=${alley ?? "*"} status=${status ?? "*"})`);
		const open = filtered.filter((l) => l.status !== "done" && l.status !== "closed");
		const done = filtered.filter((l) => l.status === "done" || l.status === "closed");
		emitPretty("");
		emitPretty(`open (${open.length}):`);
		for (const l of open) {
			const ref = refOf(l.title) ?? "?";
			const summary = l.title.replace(W4_PREFIX, "").trim().replace(/^[A-Z]\.\d+\s+/, "");
			emitPretty(`  ${ref.padEnd(5)} [${l.status.padEnd(8)}] ${summary.slice(0, 76)}`);
		}
		if (done.length > 0) {
			emitPretty("");
			emitPretty(`closed (${done.length}):`);
			for (const l of done) {
				const ref = refOf(l.title) ?? "?";
				emitPretty(`  ${ref.padEnd(5)} ✓ ${l.title.replace(W4_PREFIX, "").trim().slice(0, 76)}`);
			}
		}
		return 0;
	} catch (err) {
		return reportError(err, json);
	}
}

async function runShow(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const ref = args.positional[1] ?? flagString(args, "ref");
	const id = flagString(args, "lane") ?? flagString(args, "id");
	if (!ref && !id) {
		emitError(`ema gap show: pass either a positional ref (e.g. A.1) or --lane <id>`);
		return 64;
	}
	try {
		const lanes = await readLanes();
		const gaps = lanes.filter((l) => l.title.startsWith(W4_PREFIX));
		const lane = gaps.find((l) => {
			if (id) return l.id === id;
			return refOf(l.title) === ref?.toUpperCase();
		});
		if (!lane) {
			emitError(`ema gap show: no gap matching ${ref ?? id}`);
			return 1;
		}
		if (json) {
			emitJson({ ok: true, gap: lane });
			return 0;
		}
		emitPretty(`# gap ${refOf(lane.title) ?? "?"}`);
		emitPretty(`title: ${lane.title}`);
		emitPretty(`id: ${lane.id}`);
		emitPretty(`status: ${lane.status}`);
		emitPretty(`actor: ${lane.actor_id ?? "—"}`);
		emitPretty(`done_when: ${lane.done_when ?? "—"}`);
		emitPretty(`scope: ${lane.scope ?? "—"}`);
		const link = lane.linked_blueprint;
		if (link) {
			const lines = [
				link.section_id ? `section=${link.section_id}` : null,
				link.gac_id ? `gac=${link.gac_id}` : null,
				link.decision_id ? `decision=${link.decision_id}` : null,
			].filter(Boolean);
			if (lines.length > 0) emitPretty(`linked_blueprint: ${lines.join("  ·  ")}`);
		}
		emitPretty(`updated_at: ${lane.updated_at ?? "—"}`);
		return 0;
	} catch (err) {
		return reportError(err, json);
	}
}

async function runClaim(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const ref = args.positional[1] ?? flagString(args, "ref");
	const id = flagString(args, "lane");
	if (!ref && !id) {
		emitError(`ema gap claim: pass either positional ref (e.g. A.1) or --lane <id>`);
		return 64;
	}
	try {
		const lanes = await readLanes();
		const lane = lanes.find((l) => {
			if (id) return l.id === id;
			return l.title.startsWith(W4_PREFIX) && refOf(l.title) === ref?.toUpperCase();
		});
		if (!lane) {
			emitError(`ema gap claim: no matching gap`);
			return 1;
		}
		const c = await connect({ surface: "desktop" });
		const result = await c.command("lane.claim", {
			org_id: flagString(args, "org") ?? DEFAULT_ORG,
			actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
			lane_id: lane.id,
			scope: flagString(args, "scope") ?? lane.scope ?? "ship the gap",
			goal: flagString(args, "goal") ?? `close ${refOf(lane.title) ?? ""}`,
			next: flagString(args, "next") ?? "see lane.done_when",
		});
		c.close();
		if (result.ok !== true) {
			if (json) emitJson({ ok: false, error: result.error });
			else emitError(`ema gap claim: ${result.error.class}: ${result.error.message}`);
			return 1;
		}
		if (json) emitJson({ ok: true, lane_id: lane.id, ref: refOf(lane.title) });
		else emitPretty(`claimed ${refOf(lane.title) ?? lane.id}`);
		return 0;
	} catch (err) {
		return reportError(err, json);
	}
}

async function runClose(args: ParsedArgs): Promise<number> {
	const json = flagBool(args, "json");
	const ref = args.positional[1] ?? flagString(args, "ref");
	const id = flagString(args, "lane");
	const verify = flagString(args, "verify") ?? "shipped";
	if (!ref && !id) {
		emitError(`ema gap close: pass either positional ref (e.g. A.1) or --lane <id>`);
		return 64;
	}
	try {
		const lanes = await readLanes();
		const lane = lanes.find((l) => {
			if (id) return l.id === id;
			return l.title.startsWith(W4_PREFIX) && refOf(l.title) === ref?.toUpperCase();
		});
		if (!lane) {
			emitError(`ema gap close: no matching gap`);
			return 1;
		}
		const c = await connect({ surface: "desktop" });
		const result = await c.command("lane.close", {
			org_id: flagString(args, "org") ?? DEFAULT_ORG,
			actor_id: flagString(args, "actor") ?? DEFAULT_ACTOR,
			lane_id: lane.id,
			reason: flagString(args, "reason") ?? "shipped",
			verify,
		});
		c.close();
		if (result.ok !== true) {
			if (json) emitJson({ ok: false, error: result.error });
			else emitError(`ema gap close: ${result.error.class}: ${result.error.message}`);
			return 1;
		}
		if (json) emitJson({ ok: true, lane_id: lane.id, ref: refOf(lane.title), verify });
		else emitPretty(`closed ${refOf(lane.title) ?? lane.id}  (verify: ${verify})`);
		return 0;
	} catch (err) {
		return reportError(err, json);
	}
}
