import { describe, it, expect } from 'vitest';
import { detectSnapZone, getWindowPositionForZone } from '@/src/hooks/use-snap-zones';

describe('snap zones', () => {
	const viewportWidth = 1920;
	const viewportHeight = 1080;

	describe('zone detection with detectSnapZone', () => {
		it('detects left-half when cursor is near left edge', () => {
			const zone = detectSnapZone({
				x: 10,
				y: 500,
				viewportWidth,
				viewportHeight,
			});
			expect(zone).toBe('left-half');
		});

		it('detects right-half when cursor is near right edge', () => {
			const zone = detectSnapZone({
				x: 1910,
				y: 500,
				viewportWidth,
				viewportHeight,
			});
			expect(zone).toBe('right-half');
		});

		it('detects top-half when cursor is near top edge', () => {
			const zone = detectSnapZone({
				x: 960,
				y: 10,
				viewportWidth,
				viewportHeight,
			});
			expect(zone).toBe('top-half');
		});

		it('detects bottom-half when cursor is near bottom edge', () => {
			const zone = detectSnapZone({
				x: 960,
				y: 1070,
				viewportWidth,
				viewportHeight,
			});
			expect(zone).toBe('bottom-half');
		});

		it('detects top-left-quarter when cursor is near top-left corner', () => {
			const zone = detectSnapZone({
				x: 10,
				y: 10,
				viewportWidth,
				viewportHeight,
			});
			expect(zone).toBe('top-left-quarter');
		});

		it('detects top-right-quarter when cursor is near top-right corner', () => {
			const zone = detectSnapZone({
				x: 1910,
				y: 10,
				viewportWidth,
				viewportHeight,
			});
			expect(zone).toBe('top-right-quarter');
		});

		it('detects bottom-left-quarter when cursor is near bottom-left corner', () => {
			const zone = detectSnapZone({
				x: 10,
				y: 1070,
				viewportWidth,
				viewportHeight,
			});
			expect(zone).toBe('bottom-left-quarter');
		});

		it('detects bottom-right-quarter when cursor is near bottom-right corner', () => {
			const zone = detectSnapZone({
				x: 1910,
				y: 1070,
				viewportWidth,
				viewportHeight,
			});
			expect(zone).toBe('bottom-right-quarter');
		});

		it('returns null when cursor is in center (no snap zone)', () => {
			const zone = detectSnapZone({
				x: 960,
				y: 540,
				viewportWidth,
				viewportHeight,
			});
			expect(zone).toBeNull();
		});
	});

	describe('getWindowPositionForZone', () => {
		it('returns correct position for left-half zone', () => {
			const pos = getWindowPositionForZone('left-half', viewportWidth, viewportHeight);
			expect(pos).toEqual({
				x: 0,
				y: 0,
				width: 960,
				height: 1080,
			});
		});

		it('returns correct position for right-half zone', () => {
			const pos = getWindowPositionForZone('right-half', viewportWidth, viewportHeight);
			expect(pos).toEqual({
				x: 960,
				y: 0,
				width: 960,
				height: 1080,
			});
		});

		it('returns correct position for top-left-quarter zone', () => {
			const pos = getWindowPositionForZone('top-left-quarter', viewportWidth, viewportHeight);
			expect(pos).toEqual({
				x: 0,
				y: 0,
				width: 960,
				height: 540,
			});
		});

		it('returns correct position for bottom-right-quarter zone', () => {
			const pos = getWindowPositionForZone('bottom-right-quarter', viewportWidth, viewportHeight);
			expect(pos).toEqual({
				x: 960,
				y: 540,
				width: 960,
				height: 540,
			});
		});
	});
});
