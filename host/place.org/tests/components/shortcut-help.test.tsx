import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShortcutHelp } from "../../src/components/desktop/ShortcutHelp";
import { useDesktopStore } from "../../src/stores/desktop-store";

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
		shortcutHelpOpen: false,
	});
});

describe("ShortcutHelp", () => {
	it("does not render when closed", () => {
		render(<ShortcutHelp />);
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("renders when open", () => {
		useDesktopStore.setState({ shortcutHelpOpen: true });
		render(<ShortcutHelp />);
		expect(screen.getByRole("dialog")).toBeDefined();
		expect(screen.getByText("Keyboard Shortcuts")).toBeDefined();
	});

	it("displays all shortcut categories", () => {
		useDesktopStore.setState({ shortcutHelpOpen: true });
		render(<ShortcutHelp />);
		expect(screen.getByText("Apps")).toBeDefined();
		expect(screen.getByText("Windows")).toBeDefined();
		expect(screen.getByText("Navigation")).toBeDefined();
	});

	it("displays all app shortcuts with correct descriptions", () => {
		useDesktopStore.setState({ shortcutHelpOpen: true });
		render(<ShortcutHelp />);
		expect(screen.getByText("Brain Dump")).toBeDefined();
		expect(screen.getByText("Journal")).toBeDefined();
		expect(screen.getByText("Focus Timer")).toBeDefined();
		expect(screen.getByText("Tasks")).toBeDefined();
		expect(screen.getByText("Dashboard")).toBeDefined();
	});

	it("displays all window shortcuts with correct descriptions", () => {
		useDesktopStore.setState({ shortcutHelpOpen: true });
		render(<ShortcutHelp />);
		expect(screen.getByText("Minimize Window")).toBeDefined();
		expect(screen.getByText("Close Window")).toBeDefined();
		expect(screen.getByText("Maximize Window")).toBeDefined();
	});

	it("displays all navigation shortcuts with correct descriptions", () => {
		useDesktopStore.setState({ shortcutHelpOpen: true });
		render(<ShortcutHelp />);
		expect(screen.getByText("Command Palette")).toBeDefined();
		expect(screen.getByText("Quick Capture")).toBeDefined();
		expect(screen.getByText("Keyboard Help")).toBeDefined();
	});

	it("displays correct key combos for shortcuts", () => {
		useDesktopStore.setState({ shortcutHelpOpen: true });
		const { container } = render(<ShortcutHelp />);
		// Check for kbd elements with key combos
		const kbds = container.querySelectorAll("kbd");
		const kbdTexts = Array.from(kbds).map((kbd) => kbd.textContent);
		expect(kbdTexts).toContain("Ctrl");
		expect(kbdTexts).toContain("Shift");
		expect(kbdTexts).toContain("B"); // From Ctrl+Shift+B
		expect(kbdTexts).toContain("Esc"); // From Esc shortcut
	});

	it("closes on Escape key", () => {
		useDesktopStore.setState({ shortcutHelpOpen: true });
		render(<ShortcutHelp />);
		const dialog = screen.getByRole("dialog");
		fireEvent.keyDown(dialog, { key: "Escape" });
		expect(useDesktopStore.getState().shortcutHelpOpen).toBe(false);
	});

	it("closes when clicking outside", () => {
		useDesktopStore.setState({ shortcutHelpOpen: true });
		render(<ShortcutHelp />);
		const overlay = screen.getByRole("dialog");
		fireEvent.click(overlay);
		expect(useDesktopStore.getState().shortcutHelpOpen).toBe(false);
	});
});
