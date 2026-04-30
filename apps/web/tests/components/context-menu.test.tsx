import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Stub motion/react so animations don't interfere with jsdom rendering
vi.mock("motion/react", () => ({
	AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
	motion: {
		div: ({
			children,
			...props
		}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
			<div {...props}>{children}</div>
		),
	},
}));

import { ContextMenu } from "../../src/components/desktop/ContextMenu";
import { useWindowStore } from "../../src/stores/window-store";
import { useSettingsStore } from "../../src/stores/settings-store";

const DEFAULT_POSITION = { x: 100, y: 100 };

beforeEach(() => {
	useWindowStore.setState({
		windows: new Map(),
		zCounter: 0,
		activeWindowId: null,
	});
	useSettingsStore.setState({ soundEnabled: true });
});

describe("ContextMenu", () => {
	it("renders all menu items when open", () => {
		const onClose = vi.fn();
		render(
			<ContextMenu isOpen position={DEFAULT_POSITION} onClose={onClose} />,
		);

		expect(screen.getByText("New Brain Dump")).toBeDefined();
		expect(screen.getByText("Open Journal")).toBeDefined();
		expect(screen.getByText("Start Focus")).toBeDefined();
		expect(screen.getByText("Mute Sound")).toBeDefined();
		expect(screen.getByText("Change Wallpaper")).toBeDefined();
		expect(screen.getByText("About place.org")).toBeDefined();
	});

	it("does not render when closed", () => {
		render(
			<ContextMenu
				isOpen={false}
				position={DEFAULT_POSITION}
				onClose={vi.fn()}
			/>,
		);

		expect(screen.queryByText("New Brain Dump")).toBeNull();
	});

	it("opens brain-dump window when New Brain Dump is clicked", () => {
		const onClose = vi.fn();
		render(
			<ContextMenu isOpen position={DEFAULT_POSITION} onClose={onClose} />,
		);

		fireEvent.click(screen.getByText("New Brain Dump"));

		const { windows } = useWindowStore.getState();
		const brainDumpWindows = [...windows.values()].filter(
			(w) => w.appId === "brain-dump",
		);
		expect(brainDumpWindows).toHaveLength(1);
	});

	it("opens journal window when Open Journal is clicked", () => {
		const onClose = vi.fn();
		render(
			<ContextMenu isOpen position={DEFAULT_POSITION} onClose={onClose} />,
		);

		fireEvent.click(screen.getByText("Open Journal"));

		const { windows } = useWindowStore.getState();
		const journalWindows = [...windows.values()].filter(
			(w) => w.appId === "journal",
		);
		expect(journalWindows).toHaveLength(1);
	});

	it("opens focus window when Start Focus is clicked", () => {
		const onClose = vi.fn();
		render(
			<ContextMenu isOpen position={DEFAULT_POSITION} onClose={onClose} />,
		);

		fireEvent.click(screen.getByText("Start Focus"));

		const { windows } = useWindowStore.getState();
		const focusWindows = [...windows.values()].filter(
			(w) => w.appId === "focus",
		);
		expect(focusWindows).toHaveLength(1);
	});

	it("toggles soundEnabled when Toggle Sound is clicked", () => {
		const onClose = vi.fn();
		render(
			<ContextMenu isOpen position={DEFAULT_POSITION} onClose={onClose} />,
		);

		fireEvent.click(screen.getByText("Mute Sound"));

		expect(useSettingsStore.getState().soundEnabled).toBe(false);
	});

	it("shows Unmute Sound label when sound is already disabled", () => {
		useSettingsStore.setState({ soundEnabled: false });
		render(
			<ContextMenu isOpen position={DEFAULT_POSITION} onClose={vi.fn()} />,
		);

		expect(screen.getByText("Unmute Sound")).toBeDefined();
	});

	it("calls onClose after a menu item is clicked", () => {
		const onClose = vi.fn();
		render(
			<ContextMenu isOpen position={DEFAULT_POSITION} onClose={onClose} />,
		);

		fireEvent.click(screen.getByText("New Brain Dump"));

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("calls onClose when Esc is pressed", () => {
		const onClose = vi.fn();
		render(
			<ContextMenu isOpen position={DEFAULT_POSITION} onClose={onClose} />,
		);

		fireEvent.keyDown(document, { key: "Escape" });

		expect(onClose).toHaveBeenCalledOnce();
	});

	it("does not call onClose on Esc when menu is closed", () => {
		const onClose = vi.fn();
		render(
			<ContextMenu
				isOpen={false}
				position={DEFAULT_POSITION}
				onClose={onClose}
			/>,
		);

		fireEvent.keyDown(document, { key: "Escape" });

		expect(onClose).not.toHaveBeenCalled();
	});

	it("has role menu with accessible label", () => {
		render(
			<ContextMenu isOpen position={DEFAULT_POSITION} onClose={vi.fn()} />,
		);

		expect(screen.getByRole("menu")).toBeDefined();
	});
});
