import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Toast as ToastData } from "../../src/stores/toast-store";

// ----------------------------------------------------------------------------
// Mock the toast store so tests are isolated from real state
// ----------------------------------------------------------------------------

const mockRemoveToast = vi.fn();

vi.mock("../../src/stores/toast-store", () => ({
	useToastStore: (selector: (s: { removeToast: typeof mockRemoveToast }) => unknown) =>
		selector({ removeToast: mockRemoveToast }),
}));

// Import component after mock is registered
const { Toast } = await import("../../src/components/ui/Toast");

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeToast(overrides?: Partial<ToastData>): ToastData {
	return {
		id: "toast-1",
		message: "Test message",
		type: "info",
		duration: 4000,
		createdAt: Date.now(),
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("Toast", () => {
	it("renders the message", () => {
		render(<Toast toast={makeToast({ message: "Hello there" })} />);
		expect(screen.getByText("Hello there")).toBeDefined();
	});

	it("renders the dismiss button", () => {
		render(<Toast toast={makeToast()} />);
		expect(screen.getByRole("button", { name: /dismiss/i })).toBeDefined();
	});

	it("calls removeToast with the correct id on dismiss", () => {
		render(<Toast toast={makeToast({ id: "abc-123" })} />);

		fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

		expect(mockRemoveToast).toHaveBeenCalledOnce();
		expect(mockRemoveToast).toHaveBeenCalledWith("abc-123");
	});

	it("has role='alert' for accessibility", () => {
		render(<Toast toast={makeToast()} />);
		expect(screen.getByRole("alert")).toBeDefined();
	});

	it("renders an info toast without crashing", () => {
		render(<Toast toast={makeToast({ type: "info" })} />);
		expect(screen.getByRole("alert")).toBeDefined();
	});

	it("renders a success toast without crashing", () => {
		render(<Toast toast={makeToast({ type: "success", message: "Done!" })} />);
		expect(screen.getByText("Done!")).toBeDefined();
	});

	it("renders a warning toast without crashing", () => {
		render(<Toast toast={makeToast({ type: "warning", message: "Watch out" })} />);
		expect(screen.getByText("Watch out")).toBeDefined();
	});

	it("renders an error toast without crashing", () => {
		render(<Toast toast={makeToast({ type: "error", message: "Failed" })} />);
		expect(screen.getByText("Failed")).toBeDefined();
	});
});
