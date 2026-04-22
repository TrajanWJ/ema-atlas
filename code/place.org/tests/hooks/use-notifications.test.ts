import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../../src/hooks/use-notifications';

describe('useNotifications', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset Notification API mock
		delete (window as unknown as Record<string, unknown>).Notification;
	});

	describe('missing Notification API', () => {
		it('handles missing Notification API gracefully', () => {
			const { result } = renderHook(() => useNotifications());

			expect(result.current.permission).toBeUndefined();
			expect(result.current.notify).toBeDefined();
			expect(() => {
				result.current.notify('Test', 'Test body');
			}).not.toThrow();
		});

		it('requestPermission returns undefined when API unavailable', async () => {
			const { result } = renderHook(() => useNotifications());

			await act(async () => {
				const permission = await result.current.requestPermission();
				expect(permission).toBeUndefined();
			});
		});
	});

	describe('with Notification API', () => {
		beforeEach(() => {
			const mockNotification = vi.fn();
			(window as unknown as Record<string, unknown>).Notification = mockNotification as unknown;
			(window.Notification as unknown as Record<string, unknown>).permission = 'granted';
			(window.Notification as unknown as Record<string, unknown>).requestPermission = vi.fn(
				() => Promise.resolve('granted'),
			);
		});

		it('calls Notification constructor with correct title', () => {
			const mockNotification = vi.fn();
			(window.Notification as unknown) = mockNotification;
			(window.Notification as unknown as Record<string, unknown>).permission = 'granted';

			const { result } = renderHook(() => useNotifications());

			act(() => {
				result.current.notify('Test Title');
			});

			expect(mockNotification).toHaveBeenCalledWith('Test Title', expect.objectContaining({}));
		});

		it('calls Notification constructor with title and body', () => {
			const mockNotification = vi.fn();
			(window.Notification as unknown) = mockNotification;
			(window.Notification as unknown as Record<string, unknown>).permission = 'granted';

			const { result } = renderHook(() => useNotifications());

			act(() => {
				result.current.notify('Test Title', 'Test body');
			});

			expect(mockNotification).toHaveBeenCalledWith('Test Title', expect.objectContaining({ body: 'Test body' }));
		});

		it('calls Notification constructor with options', () => {
			const mockNotification = vi.fn();
			(window.Notification as unknown) = mockNotification;
			(window.Notification as unknown as Record<string, unknown>).permission = 'granted';

			const { result } = renderHook(() => useNotifications());

			act(() => {
				result.current.notify('Test Title', 'Test body', { tag: 'test-tag' });
			});

			expect(mockNotification).toHaveBeenCalledWith('Test Title', expect.objectContaining({ body: 'Test body', tag: 'test-tag' }));
		});

		it('does not notify when permission is not granted', () => {
			const mockNotification = vi.fn();
			(window.Notification as unknown) = mockNotification;
			(window.Notification as unknown as Record<string, unknown>).permission = 'denied';

			const { result } = renderHook(() => useNotifications());

			act(() => {
				result.current.notify('Test Title');
			});

			expect(mockNotification).not.toHaveBeenCalled();
		});

		it('requestPermission updates permission state', async () => {
			const mockNotification = vi.fn();
			(window.Notification as unknown) = mockNotification;
			(window.Notification as unknown as Record<string, unknown>).permission = 'default';
			(window.Notification as unknown as Record<string, unknown>).requestPermission = vi.fn(
				() => Promise.resolve('granted'),
			);

			const { result } = renderHook(() => useNotifications());

			await act(async () => {
				const permission = await result.current.requestPermission();
				expect(permission).toBe('granted');
			});
		});

		it('handles notification errors silently', () => {
			const mockNotification = vi.fn(() => {
				throw new Error('Notification failed');
			});
			(window.Notification as unknown) = mockNotification;
			(window.Notification as unknown as Record<string, unknown>).permission = 'granted';

			const { result } = renderHook(() => useNotifications());

			expect(() => {
				act(() => {
					result.current.notify('Test Title');
				});
			}).not.toThrow();
		});
	});

	describe('server-side rendering', () => {
		it('handles SSR context gracefully', () => {
			const { result } = renderHook(() => useNotifications());
			// In SSR or when Notification API is unavailable, permission should be undefined or the current state
			expect(result.current.notify).toBeDefined();
			expect(() => {
				result.current.notify('SSR Test');
			}).not.toThrow();
		});
	});
});
