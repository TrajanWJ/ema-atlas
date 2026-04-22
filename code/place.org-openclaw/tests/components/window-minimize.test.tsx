import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Window } from "../../src/components/window-manager/Window";
import { useWindowStore } from "../../src/stores/window-store";
import type { ProcessWindow } from "../../src/types/window";

// Mock useSound hook
vi.mock("../../src/hooks/use-sound", () => ({
	useSound: () => ({
		playOpen: vi.fn(),
		playClose: vi.fn(),
	}),
}));

// Mock react-rnd
vi.mock("react-rnd", () => ({
	Rnd: ({ children }: { readonly children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock SnapZones
vi.mock("../../src/components/window-manager/SnapZones", () => ({
	SnapZones: () => null,
}));

// Mock WindowTitleBar
vi.mock("../../src/components/window-manager/WindowTitleBar", () => ({
	WindowTitleBar: ({ appName }: { readonly appName: string }) => (
		<div role="region" aria-label="window-title-bar">
			{appName}
		</div>
	),
}));

describe("Window minimize animation", () => {
	beforeEach(() => {
		// Reset window store before each test
		useWindowStore.setState({
			windows: new Map(),
			zCounter: 0,
			activeWindowId: null,
		});
	});

	it("renders window when not minimized", () => {
		const window: ProcessWindow = {
			id: "test-1",
			appId: "brain-dump",
			position: { x: 100, y: 100, width: 400, height: 300 },
			zIndex: 1,
			minimized: false,
			maximized: false,
		};

		render(
			<Window win={window}>
				<div>Test Content</div>
			</Window>,
		);

		expect(screen.getByText("Test Content")).toBeDefined();
	});

	it("does not render window when minimized", async () => {
		const window: ProcessWindow = {
			id: "test-2",
			appId: "journal",
			position: { x: 200, y: 150, width: 500, height: 400 },
			zIndex: 2,
			minimized: true,
			maximized: false,
		};

		const { container } = render(
			<Window win={window}>
				<div>Minimized Content</div>
			</Window>,
		);

		await waitFor(() => {
			// Content should not be in the document when minimized
			expect(screen.queryByText("Minimized Content")).toBeNull();
		});

		// Container should still exist but be empty of window content
		expect(container).toBeDefined();
	});

	it("renders maximized window when not minimized", () => {
		const window: ProcessWindow = {
			id: "test-3",
			appId: "terminal",
			position: { x: 0, y: 0, width: 800, height: 600 },
			zIndex: 3,
			minimized: false,
			maximized: true,
		};

		render(
			<Window win={window}>
				<div>Maximized Content</div>
			</Window>,
		);

		expect(screen.getByText("Maximized Content")).toBeDefined();
	});

	it("does not render maximized window when minimized", async () => {
		const window: ProcessWindow = {
			id: "test-4",
			appId: "focus",
			position: { x: 0, y: 0, width: 800, height: 600 },
			zIndex: 4,
			minimized: true,
			maximized: true,
		};

		render(
			<Window win={window}>
				<div>Maximized Minimized Content</div>
			</Window>,
		);

		await waitFor(() => {
			// Content should not be in the document when minimized
			expect(screen.queryByText("Maximized Minimized Content")).toBeNull();
		});
	});
});
