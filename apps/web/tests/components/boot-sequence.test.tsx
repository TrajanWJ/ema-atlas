import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { BootSequence } from "../../src/components/boot/BootSequence";

// Mock the DB client so the test doesn't try to spin up a worker
vi.mock("../../src/db/client", () => ({
	getDbClient: () => ({
		init: vi.fn().mockResolvedValue(undefined),
	}),
}));

// Mock inbox queries
vi.mock("../../src/db/queries/inbox", () => {
	const mockGetUnprocessedCount = vi.fn();
	mockGetUnprocessedCount.mockResolvedValue(3);
	return {
		getUnprocessedCount: mockGetUnprocessedCount,
	};
});

afterEach(() => {
	vi.useRealTimers();
});

describe("BootSequence", () => {
	it("renders the boot container without crashing", () => {
		const onComplete = vi.fn();
		const { container } = render(<BootSequence onComplete={onComplete} />);
		// The outer container should be present
		expect(container.firstChild).not.toBeNull();
	});

	it("renders the inner line container", () => {
		const onComplete = vi.fn();
		const { container } = render(<BootSequence onComplete={onComplete} />);
		// Should have a flex column container for lines
		const flexCol = container.querySelector(".flex.flex-col");
		expect(flexCol).not.toBeNull();
	});

	it("renders without crashing when boot lines are shown", async () => {
		const onComplete = vi.fn();

		const { container } = render(<BootSequence onComplete={onComplete} />);

		// Verify container renders with monospace font
		const mainDiv = container.firstChild as HTMLElement;
		expect(mainDiv).toBeDefined();
		expect(mainDiv.style.fontFamily).toBe("monospace");

		// Wait a bit for async operations
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Component should still be mounted
		expect(container.firstChild).not.toBeNull();
	});

	it("does not call onComplete before DB ready", () => {
		vi.useFakeTimers();
		const onComplete = vi.fn();
		render(<BootSequence onComplete={onComplete} />);
		// No timers advanced — onComplete should not have fired
		expect(onComplete).not.toHaveBeenCalled();
	});
});
