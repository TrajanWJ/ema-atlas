import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
	detectAspirations,
	detectBlockers,
	detectDecisions,
	detectGacs,
} from "./detectors.js";

describe("detectors", () => {
	it("matches aspiration patterns", () => {
		const text = "Eventually EMA should auto-promote chat aspirations.";
		const out = detectAspirations(text);
		assert.equal(out.length, 1);
		assert.equal(out[0]?.pattern, "aspiration");
	});

	it("does not match unrelated lines as aspirations", () => {
		const text = "EMA shipped a feature today.";
		assert.equal(detectAspirations(text).length, 0);
	});

	it("matches DECIDED: decisions", () => {
		const text = "DECIDED: ship cohesion plan tier 3 this session.";
		const out = detectDecisions(text);
		assert.equal(out.length, 1);
		assert.equal(out[0]?.pattern, "decision");
	});

	it("does not match unrelated lines as decisions", () => {
		assert.equal(detectDecisions("Some prose with no marker.").length, 0);
	});

	it("matches GAC: questions ending in ?", () => {
		const text = "GAC: should the grower ever auto-promote a GAC card?";
		const out = detectGacs(text);
		assert.equal(out.length, 1);
		assert.equal(out[0]?.pattern, "gac");
	});

	it("does not match GAC without trailing ?", () => {
		assert.equal(detectGacs("GAC: some open thought").length, 0);
	});

	it("matches BLOCKED: blockers", () => {
		const text = "BLOCKED: waiting on a daemon-side decision.";
		const out = detectBlockers(text);
		assert.equal(out.length, 1);
		assert.equal(out[0]?.pattern, "blocker");
	});

	it("does not match unrelated lines as blockers", () => {
		assert.equal(detectBlockers("nothing blocked here.").length, 0);
	});
});
