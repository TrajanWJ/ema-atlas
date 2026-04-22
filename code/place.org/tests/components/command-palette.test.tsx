import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "../../src/components/desktop/CommandPalette";
import { useDesktopStore } from "../../src/stores/desktop-store";
import { useWindowStore } from "../../src/stores/window-store";
import { useInboxStore } from "../../src/stores/inbox-store";

// motion/react AnimatePresence needs to render children immediately in tests
vi.mock("motion/react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("motion/react")>();
	return {
		...actual,
		AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
		motion: {
			div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
				<div {...props}>{children}</div>
			),
		},
	};
});

beforeEach(() => {
	useDesktopStore.setState({
		commandPaletteOpen: false,
	});
	useWindowStore.setState({
		windows: new Map(),
		zCounter: 0,
		activeWindowId: null,
	});
	useInboxStore.setState({
		items: [],
		loading: false,
	});
});

describe("CommandPalette", () => {
	it("does not render when closed", () => {
		render(<CommandPalette />);
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("renders when open", () => {
		useDesktopStore.setState({ commandPaletteOpen: true });
		render(<CommandPalette />);
		expect(screen.getByRole("dialog")).toBeDefined();
		expect(screen.getByPlaceholderText("Search apps, entries, commands…")).toBeDefined();
	});

	it("shows default results when query is empty", () => {
		useDesktopStore.setState({ commandPaletteOpen: true });
		render(<CommandPalette />);
		expect(screen.getByText("Brain Dump")).toBeDefined();
		expect(screen.getByText("Journal")).toBeDefined();
	});

	it("filters results on query input", () => {
		useDesktopStore.setState({ commandPaletteOpen: true });
		render(<CommandPalette />);
		const input = screen.getByRole("combobox");
		fireEvent.change(input, { target: { value: "jour" } });
		expect(screen.getByText("Journal")).toBeDefined();
		expect(screen.queryByText("Dashboard")).toBeNull();
	});

	it("shows no results message when nothing matches", () => {
		useDesktopStore.setState({ commandPaletteOpen: true });
		render(<CommandPalette />);
		const input = screen.getByRole("combobox");
		fireEvent.change(input, { target: { value: "xyznothing" } });
		expect(screen.getByText(/No results for/)).toBeDefined();
	});

	it("closes on Escape key", () => {
		useDesktopStore.setState({ commandPaletteOpen: true });
		render(<CommandPalette />);
		const input = screen.getByRole("combobox");
		fireEvent.keyDown(input, { key: "Escape" });
		expect(useDesktopStore.getState().commandPaletteOpen).toBe(false);
	});

	it("activates selected result on Enter and closes palette", () => {
		useDesktopStore.setState({ commandPaletteOpen: true });
		render(<CommandPalette />);
		const input = screen.getByRole("combobox");
		// First result (Brain Dump) is selected by default
		fireEvent.keyDown(input, { key: "Enter" });
		expect(useDesktopStore.getState().commandPaletteOpen).toBe(false);
	});

	it("navigates results with arrow keys", () => {
		useDesktopStore.setState({ commandPaletteOpen: true });
		render(<CommandPalette />);
		const input = screen.getByRole("combobox");
		fireEvent.keyDown(input, { key: "ArrowDown" });
		// Second item (Journal) should now be selected (aria-selected)
		const options = screen.getAllByRole("option");
		expect(options[1]?.getAttribute("aria-selected")).toBe("true");
	});
});
