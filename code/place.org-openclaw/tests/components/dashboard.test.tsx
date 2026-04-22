import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
const mockSetOneThing = vi.fn();
const mockSetDesktopOneThing = vi.fn();
const mockLoadToday = vi.fn().mockResolvedValue(undefined);

const dashboardState = {
	oneThing: "",
	todayFocusMs: 0,
	todayDumpsProcessed: 0,
	journalWritten: false,
	loadToday: mockLoadToday,
	setOneThing: mockSetOneThing,
};

vi.mock("../../src/stores/dashboard-store", () => ({
	useDashboardStore: (selector: (s: typeof dashboardState) => unknown) =>
		selector(dashboardState),
}));

vi.mock("../../src/stores/desktop-store", () => ({
	useDesktopStore: (selector: (s: { setOneThing: typeof mockSetDesktopOneThing }) => unknown) =>
		selector({ setOneThing: mockSetDesktopOneThing }),
}));

import { OneThingWidget } from "../../src/components/apps/dashboard/OneThingWidget";
import { MetricsPanel } from "../../src/components/apps/dashboard/MetricsPanel";

// ----------------------------------------------------------------------------
// OneThingWidget tests
// ----------------------------------------------------------------------------
describe("OneThingWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		dashboardState.oneThing = "";
	});

	it("renders the ONE thing prompt", () => {
		render(<OneThingWidget />);
		expect(screen.getByText(/one thing/i)).toBeDefined();
	});

	it("renders a textarea", () => {
		render(<OneThingWidget />);
		expect(screen.getByRole("textbox")).toBeDefined();
	});

	it("calls setOneThing when text changes", () => {
		render(<OneThingWidget />);
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "ship it" } });
		expect(mockSetOneThing).toHaveBeenCalledWith("ship it");
	});

	it("also updates desktop store on change", () => {
		render(<OneThingWidget />);
		fireEvent.change(screen.getByRole("textbox"), { target: { value: "deep work" } });
		expect(mockSetDesktopOneThing).toHaveBeenCalledWith("deep work");
	});

	it("displays current oneThing value", () => {
		dashboardState.oneThing = "finish the feature";
		render(<OneThingWidget />);
		const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
		expect(textarea.value).toBe("finish the feature");
	});
});

// ----------------------------------------------------------------------------
// MetricsPanel tests
// ----------------------------------------------------------------------------
describe("MetricsPanel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		dashboardState.todayFocusMs = 0;
		dashboardState.todayDumpsProcessed = 0;
		dashboardState.journalWritten = false;
	});

	it("renders focus time metric", () => {
		render(<MetricsPanel />);
		expect(screen.getByText("Focus Time")).toBeDefined();
	});

	it("renders dumps processed metric", () => {
		render(<MetricsPanel />);
		expect(screen.getByText("Dumps Processed")).toBeDefined();
	});

	it("renders journal status metric", () => {
		render(<MetricsPanel />);
		expect(screen.getByText("Journal")).toBeDefined();
	});

	it("shows 'not yet' when journal not written", () => {
		dashboardState.journalWritten = false;
		render(<MetricsPanel />);
		expect(screen.getByText("not yet")).toBeDefined();
	});

	it("shows check mark when journal written", () => {
		dashboardState.journalWritten = true;
		render(<MetricsPanel />);
		expect(screen.getByText("✓ written")).toBeDefined();
	});

	it("formats focus time in minutes", () => {
		dashboardState.todayFocusMs = 90 * 60 * 1000; // 90 minutes
		render(<MetricsPanel />);
		expect(screen.getByText("1h 30m")).toBeDefined();
	});
});
