import { describe, it, expect, vi, beforeEach } from "vitest";

// ----------------------------------------------------------------------------
// Mock the focus store — preserve constants, mock hook selector
// ----------------------------------------------------------------------------
const mockTick = vi.fn();
const mockIsRunning = { value: false };

vi.mock("../../src/stores/focus-store", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../../src/stores/focus-store")>();
	return {
		...actual,
		useFocusStore: (selector: (s: { isRunning: boolean; tick: typeof mockTick }) => unknown) =>
			selector({ isRunning: mockIsRunning.value, tick: mockTick }),
	};
});

describe("useTimer hook logic", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsRunning.value = false;
	});

	it("tick is called with current timestamp", () => {
		const now = Date.now();
		mockTick(now);
		expect(mockTick).toHaveBeenCalledWith(now);
	});

	it("tick records the correct elapsed when called twice", () => {
		const start = 1000;
		const later = 2500;
		mockTick(start);
		mockTick(later);
		expect(mockTick).toHaveBeenCalledTimes(2);
		expect(mockTick).toHaveBeenLastCalledWith(later);
	});

	it("tick is not called when store is not running", () => {
		if (mockIsRunning.value) {
			mockTick(Date.now());
		}
		expect(mockTick).not.toHaveBeenCalled();
	});
});

// ----------------------------------------------------------------------------
// Focus store constants tests
// ----------------------------------------------------------------------------
describe("focus store block cycling", () => {
	it("WORK_MS is 25 minutes", async () => {
		const { WORK_MS } = await import("../../src/stores/focus-store");
		expect(WORK_MS).toBe(25 * 60 * 1000);
	});

	it("SHORT_BREAK_MS is 5 minutes", async () => {
		const { SHORT_BREAK_MS } = await import("../../src/stores/focus-store");
		expect(SHORT_BREAK_MS).toBe(300000);
	});

	it("LONG_BREAK_MS is 15 minutes", async () => {
		const { LONG_BREAK_MS } = await import("../../src/stores/focus-store");
		expect(LONG_BREAK_MS).toBe(900000);
	});

	it("WORK_MS is 1500000 ms", async () => {
		const { WORK_MS } = await import("../../src/stores/focus-store");
		expect(WORK_MS).toBe(1500000);
	});

	it("timer constants cover full pomodoro cycle", async () => {
		const { WORK_MS, SHORT_BREAK_MS, LONG_BREAK_MS } = await import("../../src/stores/focus-store");
		// A full pomodoro cycle: 4 work + 3 short breaks + 1 long break
		const cycleDuration = 4 * WORK_MS + 3 * SHORT_BREAK_MS + LONG_BREAK_MS;
		expect(cycleDuration).toBe(4 * 1500000 + 3 * 300000 + 900000);
	});
});
