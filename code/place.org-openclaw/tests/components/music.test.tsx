import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MusicApp } from '../../src/components/apps/music/MusicApp';
import { StationSelector } from '../../src/components/apps/music/StationSelector';
import { STATIONS } from '../../src/lib/music-stations';

// Minimal HTMLMediaElement stub
beforeEach(() => {
	Object.defineProperty(HTMLMediaElement.prototype, 'play', {
		configurable: true,
		writable: true,
		value: vi.fn().mockResolvedValue(undefined),
	});
	Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
		configurable: true,
		writable: true,
		value: vi.fn(),
	});

	// Stub AudioContext — not available in jsdom
	(globalThis as Record<string, unknown>).AudioContext = vi.fn().mockImplementation(() => ({
		state: 'running',
		createAnalyser: vi.fn(() => ({
			fftSize: 64,
			smoothingTimeConstant: 0.8,
			connect: vi.fn(),
			disconnect: vi.fn(),
			getByteFrequencyData: vi.fn(),
		})),
		createMediaElementSource: vi.fn(() => ({
			connect: vi.fn(),
			disconnect: vi.fn(),
		})),
		resume: vi.fn().mockResolvedValue(undefined),
		close: vi.fn().mockResolvedValue(undefined),
		destination: {},
	}));
});

describe('MusicApp', () => {
	it('renders the initial station name', () => {
		render(<MusicApp />);
		// Station name appears both in header and station selector button
		const elements = screen.getAllByText(STATIONS[0].name);
		expect(elements.length).toBeGreaterThan(0);
	});

	it('renders a play button initially', () => {
		render(<MusicApp />);
		const btn = screen.getByRole('button', { name: /play/i });
		expect(btn).toBeDefined();
	});

	it('play button label changes to Pause after click', async () => {
		render(<MusicApp />);
		const btn = screen.getByRole('button', { name: /play/i });
		await act(async () => {
			fireEvent.click(btn);
		});
		expect(screen.getByRole('button', { name: /pause/i })).toBeDefined();
	});

	it('play button reverts to Play after second click', async () => {
		render(<MusicApp />);
		const btn = screen.getByRole('button', { name: /play/i });
		await act(async () => {
			fireEvent.click(btn);
		});
		const pauseBtn = screen.getByRole('button', { name: /pause/i });
		await act(async () => {
			fireEvent.click(pauseBtn);
		});
		expect(screen.getByRole('button', { name: /play/i })).toBeDefined();
	});

	it('renders volume slider', () => {
		render(<MusicApp />);
		expect(screen.getByRole('slider', { name: /volume/i })).toBeDefined();
	});
});

describe('StationSelector', () => {
	it('renders all stations', () => {
		render(
			<StationSelector
				currentStation={STATIONS[0]}
				onSelect={vi.fn()}
			/>,
		);
		for (const station of STATIONS) {
			expect(screen.getByRole('button', { name: station.name })).toBeDefined();
		}
	});

	it('marks the current station as pressed', () => {
		render(
			<StationSelector
				currentStation={STATIONS[0]}
				onSelect={vi.fn()}
			/>,
		);
		const activeBtn = screen.getByRole('button', { name: STATIONS[0].name });
		expect(activeBtn.getAttribute('aria-pressed')).toBe('true');
	});

	it('calls onSelect when a different station is clicked', () => {
		const onSelect = vi.fn();
		render(
			<StationSelector
				currentStation={STATIONS[0]}
				onSelect={onSelect}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: STATIONS[1].name }));
		expect(onSelect).toHaveBeenCalledWith(STATIONS[1]);
	});
});
