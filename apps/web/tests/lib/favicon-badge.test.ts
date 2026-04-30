import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setFaviconBadge, clearFaviconBadge } from "@/src/lib/favicon-badge";

/**
 * Mock canvas and document functions for testing
 */
describe("favicon-badge", () => {
	let originalCreateElement: typeof document.createElement;
	let originalQuerySelector: typeof document.querySelector;
	let mockCanvas: {
		toDataURL: ReturnType<typeof vi.fn>;
		getContext: ReturnType<typeof vi.fn>;
		width: number;
		height: number;
	};

	beforeEach(() => {
		// Mock canvas element and context
		mockCanvas = {
			width: 0,
			height: 0,
			getContext: vi.fn().mockReturnValue({
				fillRect: vi.fn(),
				fillText: vi.fn(),
				beginPath: vi.fn(),
				arc: vi.fn(),
				fill: vi.fn(),
			}),
			toDataURL: vi.fn().mockReturnValue("data:image/png;base64,test"),
		};

		// Mock document.createElement to return our mock canvas
		originalCreateElement = document.createElement;
		document.createElement = vi.fn((tagName) => {
			if (tagName === "canvas") {
				return mockCanvas as unknown as HTMLCanvasElement;
			}
			return originalCreateElement.call(document, tagName);
		});

		// Mock document.querySelector to return a link element
		originalQuerySelector = document.querySelector;
		document.querySelector = vi.fn((selector) => {
			if (selector === 'link[rel="icon"]') {
				return {
					href: "original.ico",
					rel: "icon",
				} as unknown as HTMLLinkElement;
			}
			return originalQuerySelector.call(document, selector);
		});
	});

	afterEach(() => {
		// Restore original functions
		document.createElement = originalCreateElement;
		document.querySelector = originalQuerySelector;
		vi.clearAllMocks();
	});

	describe("setFaviconBadge", () => {
		it("creates a canvas with correct dimensions", () => {
			setFaviconBadge(5);

			expect(mockCanvas.width).toBe(32);
			expect(mockCanvas.height).toBe(32);
		});

		it("gets 2D context from canvas", () => {
			setFaviconBadge(5);

			expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
		});

		it("converts canvas to data URL when count > 0", () => {
			setFaviconBadge(5);

			expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/png");
		});

		it("handles zero count by restoring original favicon", () => {
			// Set badge first
			setFaviconBadge(5);

			// Clear badge
			setFaviconBadge(0);

			// Should not create new canvas when clearing
			const createElementCalls = (
				document.createElement as ReturnType<typeof vi.fn>
			).mock.calls;
			const canvasCalls = createElementCalls.filter(
				([tagName]) => tagName === "canvas",
			);
			expect(canvasCalls.length).toBe(1);
		});

		it("handles negative count same as zero", () => {
			setFaviconBadge(-1);

			expect(mockCanvas.getContext).not.toHaveBeenCalled();
		});
	});

	describe("clearFaviconBadge", () => {
		it("restores original favicon", () => {
			// Set badge first
			setFaviconBadge(5);

			// Clear it
			clearFaviconBadge();

			// Should create canvas only once (for setFaviconBadge)
			const createElementCalls = (
				document.createElement as ReturnType<typeof vi.fn>
			).mock.calls;
			const canvasCalls = createElementCalls.filter(
				([tagName]) => tagName === "canvas",
			);
			expect(canvasCalls.length).toBe(1);
		});
	});
});
