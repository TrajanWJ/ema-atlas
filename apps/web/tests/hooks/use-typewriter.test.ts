import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from '@/src/hooks/use-typewriter';

describe('useTypewriter hook', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
	});

	it('returns empty initially', () => {
		const { result } = renderHook(() => useTypewriter('hello'));
		expect(result.current.displayedText).toBe('');
		expect(result.current.isComplete).toBe(false);
	});

	it('types one character after speed interval', () => {
		const { result } = renderHook(() => useTypewriter('hello', { speed: 30 }));
		// First character fires at t=0 (initial setTimeout with 0 delay)
		act(() => {
			vi.advanceTimersByTime(0);
		});
		expect(result.current.displayedText).toBe('h');
	});

	it('returns full text after all characters typed', () => {
		const text = 'hello';
		const { result } = renderHook(() => useTypewriter(text, { speed: 30 }));

		// First char at t=0, then one per 30ms: 0 + 30*(length-1) + a bit more
		act(() => {
			vi.advanceTimersByTime(30 * text.length);
		});

		expect(result.current.displayedText).toBe(text);
		expect(result.current.isComplete).toBe(true);
	});

	it('isComplete is true when all characters are typed', () => {
		const text = 'test';
		const { result } = renderHook(() => useTypewriter(text, { speed: 30 }));

		act(() => {
			vi.advanceTimersByTime(30 * text.length);
		});

		expect(result.current.isComplete).toBe(true);
	});

	it('handles empty string', () => {
		const { result } = renderHook(() => useTypewriter('', { speed: 30 }));
		expect(result.current.displayedText).toBe('');
		expect(result.current.isComplete).toBe(true);
	});

	it('respects custom speed option', () => {
		const { result } = renderHook(() => useTypewriter('ab', { speed: 100 }));
		// First character fires immediately at t=0
		act(() => {
			vi.advanceTimersByTime(0);
		});
		expect(result.current.displayedText).toBe('a');
	});

	it('types all characters sequentially', () => {
		const text = 'abc';
		const { result } = renderHook(() => useTypewriter(text, { speed: 30 }));

		// First char at t=0
		act(() => {
			vi.advanceTimersByTime(0);
		});
		expect(result.current.displayedText).toBe('a');

		// Second char at t=30
		act(() => {
			vi.advanceTimersByTime(30);
		});
		expect(result.current.displayedText).toBe('ab');

		// Third char at t=60, then isComplete fires at t=90
		act(() => {
			vi.advanceTimersByTime(60);
		});
		expect(result.current.displayedText).toBe('abc');
		expect(result.current.isComplete).toBe(true);
	});

	it('cursor blinks at specified interval', () => {
		const { result } = renderHook(() => useTypewriter('test', { cursorBlinkSpeed: 500 }));
		const initialCursorVisible = result.current.cursorVisible;

		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(result.current.cursorVisible).toBe(!initialCursorVisible);

		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(result.current.cursorVisible).toBe(initialCursorVisible);
	});

	it('resets text when input changes', () => {
		const { result, rerender } = renderHook(
			({ text }) => useTypewriter(text, { speed: 30 }),
			{ initialProps: { text: 'hello' } }
		);

		// Advance to get 2 characters (t=0 for 'h', t=30 for 'e')
		act(() => {
			vi.advanceTimersByTime(30);
		});
		expect(result.current.displayedText).toBe('he');

		act(() => {
			rerender({ text: 'world' });
		});

		expect(result.current.displayedText).toBe('');
		expect(result.current.isComplete).toBe(false);

		act(() => {
			vi.advanceTimersByTime(30 * 5);
		});
		expect(result.current.displayedText).toBe('world');
		expect(result.current.isComplete).toBe(true);
	});
});
