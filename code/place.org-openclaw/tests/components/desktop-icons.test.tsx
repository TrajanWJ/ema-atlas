import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DesktopIconLayer } from "../../src/components/desktop/DesktopIconLayer";
import { DesktopIcon } from "../../src/components/desktop/DesktopIcon";
import { useDesktopIconsStore } from "../../src/stores/desktop-icons-store";
import { useWindowStore } from "../../src/stores/window-store";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
}));

// ----------------------------------------------------------------------------
// Setup
// ----------------------------------------------------------------------------

beforeEach(() => {
	useWindowStore.setState({
		windows: new Map(),
		zCounter: 0,
		activeWindowId: null,
	});
	// Reset to default store state (with DEFAULT_ICONS)
	useDesktopIconsStore.setState({
		icons: [
			{
				id: "icon-brain-dump",
				label: "Brain Dump",
				icon: "🧠",
				action: { type: "app", appId: "brain-dump" },
				x: 0,
				y: 0,
			},
			{
				id: "icon-journal",
				label: "Journal",
				icon: "📔",
				action: { type: "app", appId: "journal" },
				x: 0,
				y: 90,
			},
			{
				id: "icon-focus",
				label: "Focus Timer",
				icon: "🎯",
				action: { type: "app", appId: "focus" },
				x: 0,
				y: 180,
			},
			{
				id: "icon-portfolio",
				label: "Portfolio",
				icon: "🌐",
				action: { type: "url", url: "/portfolio" },
				x: 0,
				y: 270,
			},
			{
				id: "icon-about",
				label: "About",
				icon: "👤",
				action: { type: "url", url: "/about" },
				x: 0,
				y: 360,
			},
		],
		selectedId: null,
	} as unknown as Parameters<typeof useDesktopIconsStore.setState>[0]);
});

// ----------------------------------------------------------------------------
// DesktopIconLayer — integration
// ----------------------------------------------------------------------------

describe("DesktopIconLayer", () => {
	it("renders all default desktop icons", () => {
		render(<DesktopIconLayer />);
		expect(screen.getByLabelText("Brain Dump")).toBeDefined();
		expect(screen.getByLabelText("Journal")).toBeDefined();
		expect(screen.getByLabelText("Focus Timer")).toBeDefined();
		expect(screen.getByLabelText("Portfolio")).toBeDefined();
		expect(screen.getByLabelText("About")).toBeDefined();
	});

	it("deselects all icons when clicking the background", () => {
		useDesktopIconsStore.setState({ selectedId: "icon-brain-dump" } as unknown as Parameters<typeof useDesktopIconsStore.setState>[0]);
		const { container } = render(<DesktopIconLayer />);

		// Click on the layer div itself (background), not on any icon
		const layer = container.firstChild as HTMLElement;
		fireEvent.click(layer);

		expect(useDesktopIconsStore.getState().selectedId).toBeNull();
	});
});

// ----------------------------------------------------------------------------
// DesktopIcon — unit
// ----------------------------------------------------------------------------

describe("DesktopIcon", () => {
	it("renders with emoji and label", () => {
		const iconData = {
			id: "icon-brain-dump",
			label: "Brain Dump",
			icon: "🧠",
			action: { type: "app" as const, appId: "brain-dump" },
			x: 0,
			y: 0,
		};
		render(<DesktopIcon icon={iconData} />);
		expect(screen.getByLabelText("Brain Dump")).toBeDefined();
		expect(screen.getByText("🧠")).toBeDefined();
		expect(screen.getByText("Brain Dump")).toBeDefined();
	});

	it("double-click on app icon opens a window", () => {
		const iconData = {
			id: "icon-brain-dump",
			label: "Brain Dump",
			icon: "🧠",
			action: { type: "app" as const, appId: "brain-dump" },
			x: 0,
			y: 0,
		};
		render(<DesktopIcon icon={iconData} />);
		fireEvent.dblClick(screen.getByLabelText("Brain Dump"));

		const { windows } = useWindowStore.getState();
		const brainDumpWindows = [...windows.values()].filter(
			(w) => w.appId === "brain-dump",
		);
		expect(brainDumpWindows).toHaveLength(1);
	});

	it("double-click on url icon navigates (calls window.open)", () => {
		const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
		const iconData = {
			id: "icon-portfolio",
			label: "Portfolio",
			icon: "🌐",
			action: { type: "url" as const, url: "/portfolio" },
			x: 0,
			y: 0,
		};
		render(<DesktopIcon icon={iconData} />);
		fireEvent.dblClick(screen.getByLabelText("Portfolio"));
		expect(openSpy).toHaveBeenCalledWith("/portfolio", "_self");
		openSpy.mockRestore();
	});

	it("single-click selects the icon", () => {
		const iconData = {
			id: "icon-journal",
			label: "Journal",
			icon: "📔",
			action: { type: "app" as const, appId: "journal" },
			x: 0,
			y: 0,
		};
		render(<DesktopIcon icon={iconData} />);
		fireEvent.click(screen.getByLabelText("Journal"));
		expect(useDesktopIconsStore.getState().selectedId).toBe("icon-journal");
	});

	it("shows selected state with aria-pressed", () => {
		useDesktopIconsStore.setState({ selectedId: "icon-brain-dump" } as unknown as Parameters<typeof useDesktopIconsStore.setState>[0]);
		const iconData = {
			id: "icon-brain-dump",
			label: "Brain Dump",
			icon: "🧠",
			action: { type: "app" as const, appId: "brain-dump" },
			x: 0,
			y: 0,
		};
		render(<DesktopIcon icon={iconData} />);
		const el = screen.getByLabelText("Brain Dump");
		expect(el.getAttribute("aria-pressed")).toBe("true");
	});
});
