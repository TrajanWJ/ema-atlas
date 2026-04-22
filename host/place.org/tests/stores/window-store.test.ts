import { describe, it, expect, beforeEach } from "vitest";
import { useWindowStore } from "../../src/stores/window-store";

// Reset store between tests
beforeEach(() => {
	useWindowStore.setState({
		windows: new Map(),
		zCounter: 0,
		activeWindowId: null,
	});
});

describe("openWindow", () => {
	it("creates a window with default position for the given appId", () => {
		const id = useWindowStore.getState().openWindow("brain-dump");
		const { windows } = useWindowStore.getState();

		expect(windows.has(id)).toBe(true);
		const win = windows.get(id);
		expect(win?.appId).toBe("brain-dump");
		expect(win?.minimized).toBe(false);
		expect(win?.maximized).toBe(false);
		expect(win?.position.width).toBeGreaterThan(0);
		expect(win?.position.height).toBeGreaterThan(0);
	});

	it("accepts a custom position", () => {
		const id = useWindowStore.getState().openWindow("tasks", { x: 300, y: 200, width: 700, height: 500 });
		const win = useWindowStore.getState().windows.get(id);

		expect(win?.position).toEqual({ x: 300, y: 200, width: 700, height: 500 });
	});

	it("sets the new window as active", () => {
		const id = useWindowStore.getState().openWindow("journal");
		expect(useWindowStore.getState().activeWindowId).toBe(id);
	});

	it("increments zCounter on each open", () => {
		useWindowStore.getState().openWindow("focus");
		useWindowStore.getState().openWindow("tasks");

		expect(useWindowStore.getState().zCounter).toBe(2);
	});

	it("assigns zIndex equal to zCounter at time of open", () => {
		const id1 = useWindowStore.getState().openWindow("focus");
		const id2 = useWindowStore.getState().openWindow("tasks");

		const w1 = useWindowStore.getState().windows.get(id1);
		const w2 = useWindowStore.getState().windows.get(id2);
		expect(w1?.zIndex).toBe(1);
		expect(w2?.zIndex).toBe(2);
	});
});

describe("closeWindow", () => {
	it("removes the window from the map", () => {
		const id = useWindowStore.getState().openWindow("terminal");
		useWindowStore.getState().closeWindow(id);
		expect(useWindowStore.getState().windows.has(id)).toBe(false);
	});

	it("clears activeWindowId when the active window is closed", () => {
		const id = useWindowStore.getState().openWindow("terminal");
		useWindowStore.getState().closeWindow(id);
		expect(useWindowStore.getState().activeWindowId).toBeNull();
	});

	it("does not clear activeWindowId when a non-active window is closed", () => {
		const id1 = useWindowStore.getState().openWindow("terminal");
		const id2 = useWindowStore.getState().openWindow("settings");
		// id2 is now active
		useWindowStore.getState().closeWindow(id1);
		expect(useWindowStore.getState().activeWindowId).toBe(id2);
	});

	it("is a no-op for unknown ids", () => {
		useWindowStore.getState().openWindow("terminal");
		const before = useWindowStore.getState().windows.size;
		useWindowStore.getState().closeWindow("nonexistent");
		expect(useWindowStore.getState().windows.size).toBe(before);
	});
});

describe("focusWindow", () => {
	it("updates zIndex to the new zCounter value", () => {
		const id = useWindowStore.getState().openWindow("notes");
		const zBefore = useWindowStore.getState().windows.get(id)?.zIndex ?? 0;

		useWindowStore.getState().openWindow("habits"); // bump zCounter
		useWindowStore.getState().focusWindow(id);

		const zAfter = useWindowStore.getState().windows.get(id)?.zIndex ?? 0;
		expect(zAfter).toBeGreaterThan(zBefore);
	});

	it("sets the window as active", () => {
		const id1 = useWindowStore.getState().openWindow("notes");
		const id2 = useWindowStore.getState().openWindow("habits");
		useWindowStore.getState().focusWindow(id1);
		expect(useWindowStore.getState().activeWindowId).toBe(id1);
		// suppress unused var warning
		void id2;
	});

	it("un-minimizes a minimized window when focused", () => {
		const id = useWindowStore.getState().openWindow("calendar");
		useWindowStore.getState().minimizeWindow(id);
		expect(useWindowStore.getState().windows.get(id)?.minimized).toBe(true);

		useWindowStore.getState().focusWindow(id);
		expect(useWindowStore.getState().windows.get(id)?.minimized).toBe(false);
	});
});

describe("minimizeWindow", () => {
	it("sets minimized to true", () => {
		const id = useWindowStore.getState().openWindow("calendar");
		useWindowStore.getState().minimizeWindow(id);
		expect(useWindowStore.getState().windows.get(id)?.minimized).toBe(true);
	});

	it("clears activeWindowId when the active window is minimized", () => {
		const id = useWindowStore.getState().openWindow("calendar");
		useWindowStore.getState().minimizeWindow(id);
		expect(useWindowStore.getState().activeWindowId).toBeNull();
	});

	it("does not clear activeWindowId when a non-active window is minimized", () => {
		const id1 = useWindowStore.getState().openWindow("calendar");
		const id2 = useWindowStore.getState().openWindow("focus");
		// id2 is active
		useWindowStore.getState().minimizeWindow(id1);
		expect(useWindowStore.getState().activeWindowId).toBe(id2);
	});
});

describe("maximizeWindow", () => {
	it("toggles maximized to true", () => {
		const id = useWindowStore.getState().openWindow("journal");
		useWindowStore.getState().maximizeWindow(id);
		expect(useWindowStore.getState().windows.get(id)?.maximized).toBe(true);
	});

	it("toggles maximized back to false on second call", () => {
		const id = useWindowStore.getState().openWindow("journal");
		useWindowStore.getState().maximizeWindow(id);
		useWindowStore.getState().maximizeWindow(id);
		expect(useWindowStore.getState().windows.get(id)?.maximized).toBe(false);
	});
});

describe("restoreWindow", () => {
	it("sets minimized and maximized to false", () => {
		const id = useWindowStore.getState().openWindow("tasks");
		useWindowStore.getState().maximizeWindow(id);
		useWindowStore.getState().minimizeWindow(id);

		useWindowStore.getState().restoreWindow(id);

		const win = useWindowStore.getState().windows.get(id);
		expect(win?.minimized).toBe(false);
		expect(win?.maximized).toBe(false);
	});

	it("sets the window as active", () => {
		const id = useWindowStore.getState().openWindow("tasks");
		useWindowStore.getState().minimizeWindow(id);
		useWindowStore.getState().restoreWindow(id);
		expect(useWindowStore.getState().activeWindowId).toBe(id);
	});

	it("assigns a new zIndex higher than before", () => {
		const id = useWindowStore.getState().openWindow("tasks");
		const zBefore = useWindowStore.getState().windows.get(id)?.zIndex ?? 0;
		useWindowStore.getState().minimizeWindow(id);
		useWindowStore.getState().restoreWindow(id);
		const zAfter = useWindowStore.getState().windows.get(id)?.zIndex ?? 0;
		expect(zAfter).toBeGreaterThan(zBefore);
	});
});

describe("moveWindow", () => {
	it("updates position x and y", () => {
		const id = useWindowStore.getState().openWindow("brain-dump");
		useWindowStore.getState().moveWindow(id, 400, 300);

		const pos = useWindowStore.getState().windows.get(id)?.position;
		expect(pos?.x).toBe(400);
		expect(pos?.y).toBe(300);
	});

	it("does not change width or height", () => {
		const id = useWindowStore.getState().openWindow("brain-dump");
		const { width, height } = useWindowStore.getState().windows.get(id)?.position ?? { width: 0, height: 0 };

		useWindowStore.getState().moveWindow(id, 50, 50);
		const pos = useWindowStore.getState().windows.get(id)?.position;
		expect(pos?.width).toBe(width);
		expect(pos?.height).toBe(height);
	});
});

describe("resizeWindow", () => {
	it("updates position width and height", () => {
		const id = useWindowStore.getState().openWindow("notes");
		useWindowStore.getState().resizeWindow(id, 900, 700);

		const pos = useWindowStore.getState().windows.get(id)?.position;
		expect(pos?.width).toBe(900);
		expect(pos?.height).toBe(700);
	});

	it("does not change x or y", () => {
		const id = useWindowStore.getState().openWindow("notes");
		const { x, y } = useWindowStore.getState().windows.get(id)?.position ?? { x: 0, y: 0 };

		useWindowStore.getState().resizeWindow(id, 200, 200);
		const pos = useWindowStore.getState().windows.get(id)?.position;
		expect(pos?.x).toBe(x);
		expect(pos?.y).toBe(y);
	});
});

describe("getWindowsByApp", () => {
	it("returns windows matching the given appId", () => {
		useWindowStore.getState().openWindow("terminal");
		useWindowStore.getState().openWindow("terminal");
		useWindowStore.getState().openWindow("settings");

		const terminalWindows = useWindowStore.getState().getWindowsByApp("terminal");
		expect(terminalWindows).toHaveLength(2);
		for (const w of terminalWindows) {
			expect(w.appId).toBe("terminal");
		}
	});

	it("returns empty array when no windows match", () => {
		useWindowStore.getState().openWindow("terminal");
		const result = useWindowStore.getState().getWindowsByApp("habits");
		expect(result).toEqual([]);
	});
});
