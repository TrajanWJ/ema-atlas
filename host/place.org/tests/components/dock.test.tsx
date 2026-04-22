import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dock } from "../../src/components/desktop/Dock";
import { useWindowStore } from "../../src/stores/window-store";

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { animate?: unknown; transition?: unknown }) => {
			const { animate: _animate, transition: _transition, ...rest } = props as Record<string, unknown>;
			return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
		},
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
}));

beforeEach(() => {
	useWindowStore.setState({
		windows: new Map(),
		zCounter: 0,
		activeWindowId: null,
	});
});

describe("Dock", () => {
	it("renders all dock app icons", () => {
		render(<Dock />);
		expect(screen.getByLabelText("Brain Dump")).toBeDefined();
		expect(screen.getByLabelText("Journal")).toBeDefined();
		expect(screen.getByLabelText("Focus")).toBeDefined();
		expect(screen.getByLabelText("Tasks")).toBeDefined();
		expect(screen.getByLabelText("Dashboard")).toBeDefined();
		expect(screen.getByLabelText("Terminal")).toBeDefined();
	});

	it("has role toolbar", () => {
		render(<Dock />);
		expect(screen.getByRole("toolbar")).toBeDefined();
	});

	it("opens a window when an icon is clicked", () => {
		render(<Dock />);
		fireEvent.click(screen.getByLabelText("Brain Dump"));
		const { windows } = useWindowStore.getState();
		const brainDumpWindows = [...windows.values()].filter(
			(w) => w.appId === "brain-dump",
		);
		expect(brainDumpWindows).toHaveLength(1);
	});

	it("focuses an existing window when its icon is clicked again", () => {
		// Open brain-dump first
		const id = useWindowStore.getState().openWindow("brain-dump");
		// Lose focus by opening another
		useWindowStore.getState().openWindow("journal");

		render(<Dock />);
		fireEvent.click(screen.getByLabelText("Brain Dump"));

		const { activeWindowId } = useWindowStore.getState();
		expect(activeWindowId).toBe(id);
	});

	it("minimizes focused window when its icon is clicked", () => {
		const id = useWindowStore.getState().openWindow("brain-dump");
		// id is now active
		render(<Dock />);
		fireEvent.click(screen.getByLabelText("Brain Dump"));

		const win = useWindowStore.getState().windows.get(id);
		expect(win?.minimized).toBe(true);
	});

	it("renders page link icons", () => {
		render(<Dock />);
		expect(screen.getByLabelText("Portfolio")).toBeDefined();
		expect(screen.getByLabelText("Cool Stuff")).toBeDefined();
		expect(screen.getByLabelText("About")).toBeDefined();
		expect(screen.getByLabelText("Community")).toBeDefined();
	});

	it("renders separator between apps and pages", () => {
		const { container } = render(<Dock />);
		const separator = container.querySelector('[aria-hidden="true"]');
		expect(separator).toBeDefined();
		expect(separator?.className).toContain("w-px");
	});

	it("renders settings icon", () => {
		render(<Dock />);
		expect(screen.getByLabelText("Settings")).toBeDefined();
	});
});
