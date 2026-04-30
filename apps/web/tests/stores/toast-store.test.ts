import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Import after module is ready
const { useToastStore } = await import("../../src/stores/toast-store");

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function resetStore() {
	useToastStore.setState({ toasts: [] });
}

beforeEach(() => {
	vi.useFakeTimers();
	resetStore();
});

afterEach(() => {
	vi.useRealTimers();
});

// ----------------------------------------------------------------------------
// addToast
// ----------------------------------------------------------------------------

describe("addToast", () => {
	it("creates a toast with default type 'info'", () => {
		useToastStore.getState().addToast("hello");

		const { toasts } = useToastStore.getState();
		expect(toasts).toHaveLength(1);
		expect(toasts[0]?.message).toBe("hello");
		expect(toasts[0]?.type).toBe("info");
	});

	it("creates a toast with the given type", () => {
		useToastStore.getState().addToast("saved", "success");

		const toast = useToastStore.getState().toasts[0];
		expect(toast?.type).toBe("success");
	});

	it("returns the id of the new toast", () => {
		const id = useToastStore.getState().addToast("msg");
		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThan(0);
	});

	it("creates a toast with the correct message", () => {
		useToastStore.getState().addToast("important notice", "warning");
		expect(useToastStore.getState().toasts[0]?.message).toBe("important notice");
	});

	it("appends multiple toasts in order", () => {
		useToastStore.getState().addToast("first");
		useToastStore.getState().addToast("second");

		const { toasts } = useToastStore.getState();
		expect(toasts).toHaveLength(2);
		expect(toasts[0]?.message).toBe("first");
		expect(toasts[1]?.message).toBe("second");
	});
});

// ----------------------------------------------------------------------------
// removeToast
// ----------------------------------------------------------------------------

describe("removeToast", () => {
	it("removes the toast with the given id", () => {
		const id = useToastStore.getState().addToast("bye");

		useToastStore.getState().removeToast(id);

		expect(useToastStore.getState().toasts).toHaveLength(0);
	});

	it("leaves other toasts intact", () => {
		useToastStore.getState().addToast("keep");
		const removeId = useToastStore.getState().addToast("remove");

		useToastStore.getState().removeToast(removeId);

		const { toasts } = useToastStore.getState();
		expect(toasts).toHaveLength(1);
		expect(toasts[0]?.message).toBe("keep");
	});

	it("is a no-op for an unknown id", () => {
		useToastStore.getState().addToast("toast");

		useToastStore.getState().removeToast("non-existent-id");

		expect(useToastStore.getState().toasts).toHaveLength(1);
	});
});

// ----------------------------------------------------------------------------
// Auto-remove
// ----------------------------------------------------------------------------

describe("auto-remove", () => {
	it("removes a toast after its duration elapses", () => {
		useToastStore.getState().addToast("auto", "info", 3000);
		expect(useToastStore.getState().toasts).toHaveLength(1);

		vi.advanceTimersByTime(3000);

		expect(useToastStore.getState().toasts).toHaveLength(0);
	});

	it("does not remove the toast before the duration elapses", () => {
		useToastStore.getState().addToast("early", "info", 4000);

		vi.advanceTimersByTime(3999);

		expect(useToastStore.getState().toasts).toHaveLength(1);
	});

	it("uses the default 4000 ms duration when none is specified", () => {
		useToastStore.getState().addToast("default");

		vi.advanceTimersByTime(3999);
		expect(useToastStore.getState().toasts).toHaveLength(1);

		vi.advanceTimersByTime(1);
		expect(useToastStore.getState().toasts).toHaveLength(0);
	});
});
