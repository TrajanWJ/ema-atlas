#!/usr/bin/env node
// Seed the Wave-4 self-bootstrapping roadmap as canonical Blueprint
// events. One document, 15 sections (one per "not done" alley A–O).
// The roadmap *is* the canonical event log — no markdown plan to rot.
//
// Idempotent: scans `blueprint.sections` for matching titles; skips
// existing entries.
//
// Usage:  node tooling/seed-wave-4-roadmap.mjs

import { execFileSync } from "node:child_process";

const PROJECT = process.env.EMA_PROJECT_ID ?? "project:01J00000000000000000000006";
const ORG = process.env.EMA_ORG_ID ?? "org:01J00000000000000000000001";
const ACTOR = process.env.EMA_ACTOR_ID ?? "actor:dev-console";
const DOC_TITLE = "EMA Wave 4 — Self-bootstrapping";

const ALLEYS = [
	{ letter: "A", title: "A. Workspace coordination" },
	{ letter: "B", title: "B. Blueprint structural plane" },
	{ letter: "C", title: "C. Blueprint planner plane" },
	{ letter: "D", title: "D. vcalendar (phase, blocks, checkups)" },
	{ letter: "E", title: "E. Auto-grow Blueprint agent" },
	{ letter: "F", title: "F. Web Blueprint surface (place-port)" },
	{ letter: "G", title: "G. Phase-aware tick" },
	{ letter: "H", title: "H. Skills + Wiki catalog runtime" },
	{ letter: "I", title: "I. Daemon supervision / process model" },
	{ letter: "J", title: "J. Gleam tests gap-fill" },
	{ letter: "K", title: "K. Web E2E coverage" },
	{ letter: "L", title: "L. Pre-existing repo debt" },
	{ letter: "M", title: "M. Documentation" },
	{ letter: "N", title: "N. Static-page retirement" },
	{ letter: "O", title: "O. Cross-cutting (warning surfacing, incidents, telemetry)" },
];

function cli(args) {
	const out = execFileSync("node", ["apps/cli/dist/bin.js", "blueprint", ...args], {
		encoding: "utf8",
	});
	return JSON.parse(out);
}

function listDocuments() {
	const r = cli(["list", "--json"]);
	return Array.isArray(r.documents) ? r.documents : [];
}

function ensureDocument() {
	const docs = listDocuments();
	const found = docs.find((d) => d.title === DOC_TITLE);
	if (found) {
		console.log(`= document exists: ${found.id}  "${DOC_TITLE}"`);
		return { id: found.id, sections: Array.isArray(found.sections) ? found.sections : [] };
	}
	const r = cli([
		"document",
		"create",
		"--org",
		ORG,
		"--actor",
		ACTOR,
		"--project",
		PROJECT,
		"--title",
		DOC_TITLE,
		"--json",
	]);
	if (r.ok !== true) throw new Error(`document create failed: ${JSON.stringify(r)}`);
	console.log(`+ document created: ${r.resource}  "${DOC_TITLE}"`);
	return { id: r.resource, sections: [] };
}

function ensureSection(documentId, existingSections, title, position) {
	const found = existingSections.find((s) => s.title === title);
	if (found) {
		console.log(`  = section exists: ${found.id}  "${title}"`);
		return found.id;
	}
	const r = cli([
		"section",
		"add",
		"--org",
		ORG,
		"--actor",
		ACTOR,
		"--document",
		documentId,
		"--title",
		title,
		"--position",
		String(position),
		"--json",
	]);
	if (r.ok !== true) throw new Error(`section add failed: "${title}": ${JSON.stringify(r)}`);
	console.log(`  + section added at pos ${position}: ${r.resource}  "${title}"`);
	return r.resource;
}

function refreshDocSections(documentId) {
	const docs = listDocuments();
	const doc = docs.find((d) => d.id === documentId);
	return Array.isArray(doc?.sections) ? doc.sections : [];
}

async function main() {
	const { id: docId, sections } = ensureDocument();
	let live = sections.slice();
	const sectionIds = {};
	for (let i = 0; i < ALLEYS.length; i += 1) {
		const alley = ALLEYS[i];
		const id = ensureSection(docId, live, alley.title, i);
		sectionIds[alley.letter] = id;
		live = refreshDocSections(docId);
	}
	console.log("");
	console.log(
		`seed-wave-4-roadmap: doc=${docId}  ${Object.keys(sectionIds).length} alley sections seeded.`,
	);
	console.log("section_ids:");
	for (const [letter, id] of Object.entries(sectionIds)) {
		console.log(`  ${letter}: ${id}`);
	}
	// Emit a JSON line that seed-wave-4-gaps.mjs can ingest from stdin.
	console.log("");
	console.log(`__W4_DOC_ID__=${docId}`);
	console.log(`__W4_SECTION_IDS__=${JSON.stringify(sectionIds)}`);
}

main().catch((err) => {
	console.error("seed-wave-4-roadmap failed:", err.message ?? err);
	process.exit(1);
});
