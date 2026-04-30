#!/usr/bin/env node
// Seed every "not done" inventory item as a canonical lane in the
// daemon's `lane.registry` projection. Each lane is cross-referenced to
// its alley's blueprint section via `--blueprint-section`, so the
// intent graph (`ema blueprint graph view`) shows the work-against-the-doc.
//
// Idempotent: scans `lane.registry` and skips any title we've already
// emitted (W4-gap titles are deterministic).
//
// Usage:  node tooling/seed-wave-4-gaps.mjs

import { execFileSync } from "node:child_process";

const ORG = process.env.EMA_ORG_ID ?? "org:01J00000000000000000000001";
const ACTOR = process.env.EMA_ACTOR_ID ?? "actor:dev-console";

// Pull alley → section_id from the most recent roadmap doc.
function loadSectionMap() {
	const out = execFileSync(
		"node",
		["apps/cli/dist/bin.js", "blueprint", "list", "--json"],
		{ encoding: "utf8" },
	);
	const data = JSON.parse(out);
	const doc = (data.documents ?? []).find(
		(d) => d.title === "EMA Wave 4 — Self-bootstrapping",
	);
	if (!doc) {
		throw new Error(
			"Wave-4 doc not found. Run `node tooling/seed-wave-4-roadmap.mjs` first.",
		);
	}
	const map = {};
	for (const sec of doc.sections ?? []) {
		const letter = (sec.title ?? "").trim().slice(0, 1);
		if (/^[A-Z]$/.test(letter)) map[letter] = sec.id;
	}
	return map;
}

// Open lanes (active alleys → existing IDs)
function listLanes() {
	const out = execFileSync(
		"node",
		["apps/cli/dist/bin.js", "lane", "list", "--json"],
		{ encoding: "utf8" },
	);
	const data = JSON.parse(out);
	return Array.isArray(data.lanes) ? data.lanes : [];
}

function laneCli(laneArgs) {
	const out = execFileSync("node", ["apps/cli/dist/bin.js", "lane", ...laneArgs], {
		encoding: "utf8",
	});
	return JSON.parse(out);
}

function ensureLane({ alley, ref, summary, scope, doneWhen, sectionId }) {
	const title = `[W4-gap] ${alley}.${ref} ${summary}`;
	const lanes = listLanes();
	const found = lanes.find((l) => l.title === title);
	if (found) {
		console.log(`= ${title.slice(0, 80)}...`);
		return found.id;
	}
	const args = [
		"open",
		"--org",
		ORG,
		"--actor",
		ACTOR,
		"--title",
		title,
		"--scope",
		scope,
		"--done-when",
		doneWhen,
		"--cadence",
		"weekly",
		"--blueprint-section",
		sectionId,
		"--json",
	];
	const r = laneCli(args);
	if (r.ok !== true) throw new Error(`lane open failed: ${title}: ${JSON.stringify(r)}`);
	console.log(`+ ${r.resource}  ${title.slice(0, 70)}`);
	return r.resource;
}

const GAPS = [
	// A — Workspace
	{ alley: "A", ref: "1", summary: "Soft phase enforcement on remaining 12 ops", scope: "ema_shell_ipc.gleam handlers for lane.{claim,move,block,release,close} + queue.* + blueprint.* + vcalendar.*", doneWhen: "all canonical write ops route through emit_phase_warning_if_needed; warning field populated when out-of-phase" },
	{ alley: "A", ref: "2", summary: "Eat our own dog food: capture follow-ups via ema queue add", scope: "behavioral; nothing to compile", doneWhen: "queue.registry shows 5+ open queue items captured during a session" },
	{ alley: "A", ref: "3", summary: "Delete stale apps/cli/src/commands/problem 2.ts file", scope: "apps/cli/src/commands/", doneWhen: "file removed, build green" },
	{ alley: "A", ref: "4", summary: "Multi-org support: surface org_id per lane in lane_registry projection", scope: "apps/daemon/src/ema_sqlite_helpers.erl#apply_lane_event + lane_registry_json + auto_checkup_due_lanes", doneWhen: "lane registry rows include org_id; auto-checkup uses per-lane org" },
	{ alley: "A", ref: "5", summary: "Add ema lane show <id> with claims/blocks/checkups history", scope: "apps/cli/src/commands/lane.ts + new lane_history_projection", doneWhen: "ema lane show prints full lifecycle for one lane" },
	{ alley: "A", ref: "6", summary: "Surface mission/campaign/handoff/problem registries in CLI + web", scope: "ema mission/campaign/handoff/problem list — call corresponding registry projections", doneWhen: "each subsystem has a `list --json` reading its registry" },
	{ alley: "A", ref: "7", summary: "ema agent report grammar — make --lane requirement obvious in --help", scope: "apps/cli/src/commands/agent.ts", doneWhen: "--help lists --lane as required" },

	// B — Blueprint structural
	{ alley: "B", ref: "1", summary: "Wire blueprint.comment.{added,resolved} writers + IPC + CLI", scope: "apps/daemon/src/ema_blueprint/, apps/cli/src/commands/blueprint.ts", doneWhen: "ema blueprint comment add/resolve works end-to-end with idempotent projection" },
	{ alley: "B", ref: "2", summary: "Mirror writer for blueprint.attachment.{linked,unlinked}", scope: "apps/daemon/src/ema_attachments/, apps/daemon/src/ema_blueprint/, ema_shell_ipc.gleam", doneWhen: "attachment.linked emits blueprint.attachment.linked mirror per ADR 06" },
	{ alley: "B", ref: "3", summary: "Per-section BEAM collab room (each blueprint_sec gets its own ema_collab document)", scope: "apps/daemon/src/ema_collab/", doneWhen: "ema_collab supports multiple keyed documents; tests prove no cross-talk" },
	{ alley: "B", ref: "4", summary: "ema blueprint section edit --prose <file|->", scope: "apps/cli/src/commands/blueprint.ts + collab.document.replace IPC op", doneWhen: "writing prose from CLI persists via ema_collab and surfaces in collab.document projection" },

	// C — Blueprint planner
	{ alley: "C", ref: "1", summary: "Wire 6 missing planner IPC ops: gac.{defer,promote}, blocker.promote, aspiration.{promote,archive}, decision.supersede", scope: "apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam", doneWhen: "all 12 planner_nodes.gleam writers reachable from CLI" },
	{ alley: "C", ref: "2", summary: "GAC options[] array — A/B/C/D variant pickers persisted canonically", scope: "ema_blueprint planner_nodes.gleam (gac_create options_json), CLI gac create --options, web Blueprint vApp gac queue", doneWhen: "creating a GAC card with --options results in canonical options array surfaced via projection" },
	{ alley: "C", ref: "3", summary: "Atlas decisions re-import on file-watch", scope: "tooling/import-atlas-decisions.mjs (extend with --watch)", doneWhen: "editing an atlas markdown decision while watcher runs emits a new blueprint.decision.locked event with supersedes" },

	// D — vcalendar
	{ alley: "D", ref: "1", summary: "Periodic gleam_otp actor for auto-checkup (T3.2 v2)", scope: "apps/daemon/src/ema_swarm_coordination/checkup_scheduler.gleam (new) + supervisor wiring", doneWhen: "no cron required; checkups emit autonomously every 60s" },
	{ alley: "D", ref: "2", summary: "Phase persistence test — daemon restart preserves current_phase", scope: "apps/daemon/test/ema_daemon_test.gleam", doneWhen: "Gleam test verifies phase replay across simulated restart" },
	{ alley: "D", ref: "3", summary: "calendar_block.move overlap validation", scope: "apps/daemon/src/ema_vcalendar/ema_vcalendar.gleam#move_block", doneWhen: "writer rejects overlapping blocks for same actor" },
	{ alley: "D", ref: "4", summary: "vcalendar tick boundary countdown surface", scope: "apps/cli/src/commands/vcalendar.ts + apps/web Blueprint phase widget", doneWhen: "tick output includes 'X minutes until <next phase>'" },

	// E — Auto-grow Blueprint agent
	{ alley: "E", ref: "1", summary: "Subscribe to chat.message / brain-dump events once those land in catalog", scope: "apps/agent-blueprint-grower/src/main.ts", doneWhen: "agent observes user prose channels, not just event_trail" },
	{ alley: "E", ref: "2", summary: "Persistent fingerprint store (sqlite or filesystem)", scope: "apps/agent-blueprint-grower/src/dedup.ts (new)", doneWhen: "dedup survives agent restart" },
	{ alley: "E", ref: "3", summary: "Canonical actor.created event for actor:agent:blueprint-grower", scope: "first_boot.gleam or new agent-bootstrap writer", doneWhen: "actor identity for the grower is canonical, not just free-text" },
	{ alley: "E", ref: "4", summary: "ema events inject for local agent testing", scope: "apps/cli/src/commands/events.ts", doneWhen: "ema events inject --kind chat.message --payload <json> emits to bus" },

	// F — Web Blueprint surface (place-port)
	{ alley: "F", ref: "1", summary: "Wire HQ vApp to topbar + vcalendar.state projections", scope: "apps/web/src/components/apps/hq/index.tsx", doneWhen: "HQ shows live phase + scope + recent events from daemon" },
	{ alley: "F", ref: "2", summary: "Wire git-ema vApp to git_ema.user_connectors + git_ema.attachments", scope: "apps/web/src/components/apps/git-ema/index.tsx", doneWhen: "git-ema lists connectors + attachments live" },
	{ alley: "F", ref: "3", summary: "Wire agent-work vApp to see_agent_work + lane.registry", scope: "apps/web/src/components/apps/agent-work/index.tsx", doneWhen: "agent-work shows active lanes + agent reports" },
	{ alley: "F", ref: "4", summary: "Wire launchpad vApp to space.installed_vapps", scope: "apps/web/src/components/apps/launchpad/index.tsx", doneWhen: "launchpad lists installed vApps with launch buttons" },
	{ alley: "F", ref: "5", summary: "Wire wiki vApp to file/document store", scope: "apps/web/src/components/apps/wiki/index.tsx", doneWhen: "wiki renders markdown content with search" },
	{ alley: "F", ref: "6", summary: "Force-directed intent graph visualization in Blueprint vApp", scope: "apps/web/src/components/apps/blueprint/index.tsx (Intent Graph tab)", doneWhen: "graph tab renders nodes/edges with force layout" },
	{ alley: "F", ref: "7", summary: "GAC variant picker maps each option to distinct result_action", scope: "apps/web/src/components/apps/blueprint/index.tsx (GacQueue)", doneWhen: "A→create_canon, B→create_intent, C→update_node, D→defer_to_blocker" },
	{ alley: "F", ref: "8", summary: "URL deep-links: ?bp_tab=gac, ?bp_doc=<id>", scope: "apps/web/src/lib/url-nav.ts + Blueprint vApp", doneWhen: "deep-links open the right tab/doc" },
	{ alley: "F", ref: "9", summary: "Retire apps/web.pre-port-backup-20260429-060300/", scope: "filesystem cleanup", doneWhen: "backup folder moved to Projects/EMA/atlas/archive/ or deleted" },

	// G — Phase-aware tick
	{ alley: "G", ref: "1", summary: "Daemon-down end-to-end test for vcalendar tick fallback", scope: "apps/cli/src/commands/vcalendar.ts + tooling smoke test", doneWhen: "tick smoke test exercises both source paths" },

	// H — Skills + Wiki catalog runtime
	{ alley: "H", ref: "1", summary: "ema skill list/show/load CLI subcommands", scope: "apps/cli/src/commands/skill.ts (new) + Projects/EMA/skills/ scan", doneWhen: "skills can be discovered + loaded via CLI" },
	{ alley: "H", ref: "2", summary: "Wiki vApp renders skill catalog", scope: "apps/web/src/components/apps/wiki/index.tsx", doneWhen: "wiki shows skills with allowed_cli + body" },
	{ alley: "H", ref: "3", summary: "Demo: chat message → GAC card via grower + skill", scope: "apps/agent-blueprint-grower + skills + ema gac", doneWhen: "end-to-end demo recorded" },

	// I — Daemon supervision / process model
	{ alley: "I", ref: "1", summary: "Add supervised periodic actor child to supervisor.gleam", scope: "apps/daemon/src/ema_daemon/supervisor.gleam", doneWhen: "checkup_scheduler is a real OTP child" },
	{ alley: "I", ref: "2", summary: "Replication writers (ADR 17/18 implementation)", scope: "apps/daemon/src/ema_replication/, packages/contracts/events/replication.md", doneWhen: "P2P fan-out writes canonical events" },
	{ alley: "I", ref: "3", summary: "Bus throughput / fan-out latency telemetry", scope: "apps/daemon/src/ema_daemon/bus.gleam", doneWhen: "bus.metrics projection reports msg/s + p99 fan-out" },

	// J — Gleam tests
	{ alley: "J", ref: "1", summary: "Targeted writer tests for promote-to-proposal, mission/handoff/campaign, T3.1 phase enforcement, T3.2 auto-checkup, atlas import idempotency", scope: "apps/daemon/test/ema_daemon_test.gleam", doneWhen: "test count rises from 35 to 50+; each subsystem has at least one happy + one error-path test" },

	// K — Web E2E
	{ alley: "K", ref: "1", summary: "Run full E2E suite against new Blueprint vApp", scope: "apps/web/tests/e2e/", doneWhen: "themes/vapps/url-nav/a11y all green for blueprint route" },
	{ alley: "K", ref: "2", summary: "A11y audit on Blueprint vApp", scope: "apps/web/tests/e2e/a11y.spec.ts", doneWhen: "axe finds zero serious/critical issues on /?vapp=blueprint" },

	// L — Pre-existing repo debt
	{ alley: "L", ref: "1", summary: "Audit place-port references to place-reflection/ and shell/vapp-registry", scope: "apps/web/src/", doneWhen: "all donor-stale imports either fixed or removed" },
	{ alley: "L", ref: "2", summary: "Verify @ema/surface-core adapter namespace shift didn't break consumers", scope: "packages/surface-core/, apps/desktop/", doneWhen: "all consumers explicitly import from `adapter.X` if needed" },
	{ alley: "L", ref: "3", summary: "Sweep for remaining broken donor paths in apps/web/src/", scope: "apps/web/src/projections, apps/web/src/lib", doneWhen: "fresh tsc --noEmit returns 0 errors in apps/web/" },

	// M — Documentation
	{ alley: "M", ref: "1", summary: "Top-level cohesion overview doc (narrative tying ADRs 06–13 together)", scope: "docs/architecture/EMA-COHESION.md (new)", doneWhen: "new agent can read one doc and understand the operating loop" },
	{ alley: "M", ref: "2", summary: "Wave-4 handoff record", scope: "Projects/EMA/atlas/intent/handoffs/2026-04-29-wave-4-self-bootstrapping.md", doneWhen: "handoff written referencing this canonical event log" },
	{ alley: "M", ref: "3", summary: "Update docs/orchestration/STATUS.md with T1+T2+T3+W3+W4 ship state", scope: "docs/orchestration/STATUS.md", doneWhen: "STATUS reflects current canonical reality" },
	{ alley: "M", ref: "4", summary: "Maintain docs/changelog.md per CLAUDE.md convention", scope: "docs/changelog.md", doneWhen: "changelog entry per shipped slice" },
	{ alley: "M", ref: "5", summary: "ADR for T3.1 soft phase enforcement + T3.2 v1 on-demand checkup tick", scope: "docs/architecture/", doneWhen: "ADRs 19+20 written" },

	// N — Static-page retirement
	{ alley: "N", ref: "1", summary: "Retire localhost:3005 explainer (PID 41603)", scope: "/tmp/ema-desktop-explainer/, OS process", doneWhen: "page redirects to localhost:5173/?vapp=blueprint OR is shut down" },

	// O — Cross-cutting
	{ alley: "O", ref: "1", summary: "CLI surfaces warning field on all writer commands", scope: "apps/cli/src/commands/*.ts (send() helpers)", doneWhen: "running a write op out-of-phase prints [warn] line" },
	{ alley: "O", ref: "2", summary: "incident.noted projection (incidents.list)", scope: "apps/daemon/src/ema_sqlite_helpers.erl + bus + CLI", doneWhen: "ema incidents list shows recent phase_violation incidents" },
	{ alley: "O", ref: "3", summary: "ema incidents resolve writer for incident.resolved event", scope: "apps/daemon/src/ema_swarm_coordination/ + CLI", doneWhen: "ema incidents resolve <id> emits incident.resolved" },
];

async function main() {
	const sectionMap = loadSectionMap();
	if (Object.keys(sectionMap).length < 15) {
		throw new Error(
			`Expected 15 alley sections; found ${Object.keys(sectionMap).length}. Re-run seed-wave-4-roadmap.mjs.`,
		);
	}
	let created = 0;
	let skipped = 0;
	for (const gap of GAPS) {
		const sectionId = sectionMap[gap.alley];
		if (!sectionId) {
			console.warn(`! no section for alley ${gap.alley}, skipping ${gap.ref}`);
			continue;
		}
		const lanesBefore = listLanes().length;
		ensureLane({
			alley: gap.alley,
			ref: gap.ref,
			summary: gap.summary,
			scope: gap.scope,
			doneWhen: gap.doneWhen,
			sectionId,
		});
		const lanesAfter = listLanes().length;
		if (lanesAfter > lanesBefore) created += 1;
		else skipped += 1;
	}
	console.log("");
	console.log(`seed-wave-4-gaps: ${created} new lanes · ${skipped} already-present · ${GAPS.length} total gap items.`);
}

main().catch((err) => {
	console.error("seed-wave-4-gaps failed:", err.message ?? err);
	process.exit(1);
});
