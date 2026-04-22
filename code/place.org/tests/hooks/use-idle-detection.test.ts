import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIdleDetection } from "../../src/hooks/use-idle-detection";

describe("useIdleDetection", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns not idle initially", () => {
		const { result } = renderHook(() => useIdleDetection(5000));
		expect(result.current.isIdle).toBe(false);
	});

	it("returns idle after the timeout elapses", () => {
		const { result } = renderHook(() => useIdleDetection(5000));

		expect(result.current.isIdle).toBe(false);

		act(() => {
			vi.advanceTimersByTime(5001);
		});

		expect(result.current.isIdle).toBe(true);
	});

	it("does not become idle before the timeout elapses", () => {
		const { result } = renderHook(() => useIdleDetection(5000));

		act(() => {
			vi.advanceTimersByTime(4999);
		});

		expect(result.current.isIdle).toBe(false);
	});

	it("resets to not idle on mousemove activity", () => {
		const { result } = renderHook(() => useIdleDetection(5000));

		act(() => {
			vi.advanceTimersByTime(5001);
		});
		expect(result.current.isIdle).toBe(true);

		act(() => {
			window.dispatchEvent(new MouseEvent("mousemove"));
		});
		expect(result.current.isIdle).toBe(false);
	});

	it("resets to not idle on keydown activity", () => {
		const { result } = renderHook(() => useIdleDetection(5000));

		act(() => {
			vi.advanceTimersByTime(5001);
		});
		expect(result.current.isIdle).toBe(true);

		act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown"));
		});
		expect(result.current.isIdle).toBe(false);
	});

	it("resets the idle timer when activity occurs mid-countdown", () => {
		const { result } = renderHook(() => useIdleDetection(5000));

		act(() => {
			vi.advanceTimersByTime(3000);
		});
		act(() => {
			window.dispatchEvent(new MouseEvent("mousemove"));
		});
		act(() => {
			vi.advanceTimersByTime(3000);
		});

		// Only 3s since last activity, not 5s — should still not be idle
		expect(result.current.isIdle).toBe(false);

		act(() => {
			vi.advanceTimersByTime(2001);
		});
		expect(result.current.isIdle).toBe(true);
	});
});
