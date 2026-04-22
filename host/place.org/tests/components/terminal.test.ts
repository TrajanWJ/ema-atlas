import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the inbox store import used by commands.ts
vi.mock("../../src/stores/inbox-store", () => ({
	useInboxStore: vi.fn(),
}));

import { COMMANDS } from "../../src/components/apps/terminal/commands";

describe("Terminal commands", () => {
	describe("help", () => {
		it("returns an array of strings", () => {
			const result = COMMANDS["help"]?.([]);
			expect(Array.isArray(result)).toBe(true);
		});

		it("lists /dump command", () => {
			const result = COMMANDS["help"]?.([]) as string[];
			expect(result.join("\n")).toContain("/dump");
		});

		it("lists /focus command", () => {
			const result = COMMANDS["help"]?.([]) as string[];
			expect(result.join("\n")).toContain("/focus");
		});

		it("lists echo command", () => {
			const result = COMMANDS["help"]?.([]) as string[];
			expect(result.join("\n")).toContain("echo");
		});

		it("lists cowsay command", () => {
			const result = COMMANDS["help"]?.([]) as string[];
			expect(result.join("\n")).toContain("cowsay");
		});
	});

	describe("echo", () => {
		it("echoes back the args joined by space", () => {
			const result = COMMANDS["echo"]?.(["hello", "world"]);
			expect(result).toBe("hello world");
		});

		it("returns empty string with no args", () => {
			const result = COMMANDS["echo"]?.([]);
			expect(result).toBe("");
		});

		it("echoes a single word", () => {
			const result = COMMANDS["echo"]?.(["test"]);
			expect(result).toBe("test");
		});
	});

	describe("cowsay", () => {
		it("returns an array of strings", () => {
			const result = COMMANDS["cowsay"]?.(["hello"]);
			expect(Array.isArray(result)).toBe(true);
		});

		it("output contains the input text", () => {
			const result = COMMANDS["cowsay"]?.(["moo"]) as string[];
			expect(result.join("\n")).toContain("moo");
		});

		it("includes the cow ASCII art", () => {
			const result = COMMANDS["cowsay"]?.(["test"]) as string[];
			const joined = result.join("\n");
			expect(joined).toContain("^__^");
		});

		it("defaults to 'moo' with no args", () => {
			const result = COMMANDS["cowsay"]?.([]) as string[];
			expect(result.join("\n")).toContain("moo");
		});
	});

	describe("whoami", () => {
		it("returns trajan@place.org", () => {
			const result = COMMANDS["whoami"]?.([]);
			expect(result).toBe("trajan@place.org");
		});
	});

	describe("date", () => {
		it("returns a non-empty string", () => {
			const result = COMMANDS["date"]?.([]);
			expect(typeof result).toBe("string");
			expect((result as string).length).toBeGreaterThan(0);
		});
	});

	describe("uptime", () => {
		it("returns a string containing 'up'", () => {
			const result = COMMANDS["uptime"]?.([]) as string;
			expect(result).toContain("up");
		});
	});
});
