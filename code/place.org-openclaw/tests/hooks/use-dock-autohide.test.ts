import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDockAutohide } from '../../src/hooks/use-dock-autohide';
import { useWindowStore } from '../../src/stores/window-store';

// Mock the window store
vi.mock('../../src/stores/window-store', () => ({
	useWindowStore: vi.fn(),
}));

describe('useDockAutohide', () => {
	let innerHeightSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		innerHeightSpy = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(768);
	});

	afterEach(() => {
		innerHeightSpy.mockRestore();
	});

	it('returns hidden=false when no windows are maximized', () => {
		const mockUseWindowStore = useWindowStore as unknown as ReturnType<typeof vi.fn>;
		mockUseWindowStore.mockReturnValue(new Map());

		const { result } = renderHook(() => useDockAutohide());
		expect(result.current.isHidden).toBe(false);
	});

	it('returns hidden=true when a window is maximized and mouse is not in bottom 10px', async () => {
		const mockUseWindowStore = useWindowStore as unknown as ReturnType<typeof vi.fn>;
		const mockWindow = {
			id: 'test-window',
			appId: 'brain-dump' as const,
			position: { x: 0, y: 0, width: 800, height: 600 },
			zIndex: 1,
			minimized: false,
			maximized: true,
		};
		const windows = new Map([['test-window', mockWindow]]);
		mockUseWindowStore.mockReturnValue(windows);

		const { result } = renderHook(() => useDockAutohide());

		// Simulate mouse move away from bottom (middle of screen)
		act(() => {
			window.dispatchEvent(
				new MouseEvent('mousemove', {
					clientX: 500,
					clientY: 400,
				}),
			);
		});

		await waitFor(() => {
			expect(result.current.isHidden).toBe(true);
		});
	});

	it('returns hidden=false when mouse is in bottom 10px and window is maximized', async () => {
		const mockUseWindowStore = useWindowStore as unknown as ReturnType<typeof vi.fn>;
		const mockWindow = {
			id: 'test-window',
			appId: 'brain-dump' as const,
			position: { x: 0, y: 0, width: 800, height: 600 },
			zIndex: 1,
			minimized: false,
			maximized: true,
		};
		const windows = new Map([['test-window', mockWindow]]);
		mockUseWindowStore.mockReturnValue(windows);

		const { result } = renderHook(() => useDockAutohide());

		// Simulate mouse move to bottom 10px
		// Set clientY to 760 (innerHeight - 8 = 768 - 8 = 760)
		act(() => {
			window.dispatchEvent(
				new MouseEvent('mousemove', {
					clientX: 500,
					clientY: 760,
				}),
			);
		});

		await waitFor(() => {
			expect(result.current.isHidden).toBe(false);
		});
	});

	it('returns hidden=false when no windows are maximized regardless of mouse position', async () => {
		const mockUseWindowStore = useWindowStore as unknown as ReturnType<typeof vi.fn>;
		const mockWindow = {
			id: 'test-window',
			appId: 'brain-dump' as const,
			position: { x: 0, y: 0, width: 800, height: 600 },
			zIndex: 1,
			minimized: false,
			maximized: false,
		};
		const windows = new Map([['test-window', mockWindow]]);
		mockUseWindowStore.mockReturnValue(windows);

		const { result } = renderHook(() => useDockAutohide());

		// Simulate mouse move anywhere
		act(() => {
			window.dispatchEvent(
				new MouseEvent('mousemove', {
					clientX: 500,
					clientY: 300,
				}),
			);
		});

		await waitFor(() => {
			expect(result.current.isHidden).toBe(false);
		});
	});
});
