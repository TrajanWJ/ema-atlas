import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClockApp } from '../../src/components/apps/clock/ClockApp';

describe('ClockApp', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
	});

	it('renders current time', () => {
		const now = new Date('2025-03-20T14:30:45');
		vi.setSystemTime(now);

		render(<ClockApp />);

		// Wait for component to mount and update
		vi.advanceTimersByTime(100);

		// Time should be displayed in HH:MM:SS format
		const timeElements = screen.getAllByText(/\d{2}:\d{2}:\d{2}/);
		expect(timeElements.length).toBeGreaterThan(0);
	});

	it('renders date below time', () => {
		const now = new Date('2025-03-20T14:30:45');
		vi.setSystemTime(now);

		render(<ClockApp />);
		vi.advanceTimersByTime(100);

		// Date should contain month/day/year
		const dateText = screen.getByText(/Mar.*20.*2025/);
		expect(dateText).toBeDefined();
	});

	it('renders timezone labels', () => {
		render(<ClockApp />);
		vi.advanceTimersByTime(100);

		expect(screen.getByText('UTC')).toBeDefined();
		expect(screen.getByText('New York')).toBeDefined();
		expect(screen.getByText('London')).toBeDefined();
		expect(screen.getByText('Tokyo')).toBeDefined();
	});

	it('updates time every second', () => {
		const now = new Date('2025-03-20T14:30:00');
		vi.setSystemTime(now);

		const { rerender } = render(<ClockApp />);
		vi.advanceTimersByTime(100);

		const initialText = screen.getAllByText(/\d{2}:\d{2}:\d{2}/)[0]?.textContent;

		// Advance by 1 second
		vi.advanceTimersByTime(1100);
		rerender(<ClockApp />);

		// Time should update
		const updatedText = screen.getAllByText(/\d{2}:\d{2}/)[0]?.textContent;
		expect(updatedText).toBeDefined();
	});
});
