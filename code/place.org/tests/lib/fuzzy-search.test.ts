import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "../../src/lib/fuzzy-search";

describe("fuzzyMatch", () => {
	it("matches exact substrings", () => {
		const result = fuzzyMatch("dump", "Brain Dump");
		expect(result.match).toBe(true);
		expect(result.score).toBeGreaterThan(0);
	});

	it("matches fuzzy characters in order (bd → Brain Dump)", () => {
		const result = fuzzyMatch("bd", "Brain Dump");
		expect(result.match).toBe(true);
	});

	it("returns false for no match", () => {
		const result = fuzzyMatch("xyz", "Brain Dump");
		expect(result.match).toBe(false);
		expect(result.score).toBe(0);
	});

	it("scores consecutive matches higher than scattered matches", () => {
		// "dump" matches consecutively in "Brain Dump"
		const consecutive = fuzzyMatch("dump", "Brain Dump");
		// "dmp" matches scattered in "Brain Dump"
		const scattered = fuzzyMatch("dmp", "Brain Dump");
		expect(consecutive.score).toBeGreaterThan(scattered.score);
	});

	it("returns match true with score 0 for empty query", () => {
		const result = fuzzyMatch("", "anything");
		expect(result.match).toBe(true);
		expect(result.score).toBe(0);
	});

	it("is case-insensitive", () => {
		expect(fuzzyMatch("BRAIN", "brain dump").match).toBe(true);
		expect(fuzzyMatch("brain", "Brain Dump").match).toBe(true);
	});
});
