import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireConfetti } from '@/src/lib/confetti';

describe('fireConfetti', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		document.body.innerHTML = '';
	});

	afterEach(() => {
		vi.useRealTimers();
		document.body.innerHTML = '';
		const styles = document.querySelectorAll('style[data-confetti]');
		styles.forEach((style) => style.remove());
	});

	it('creates DOM elements for particles', () => {
		fireConfetti({ particleCount: 10 });

		const particles = document.querySelectorAll('.confetti-particle');
		expect(particles.length).toBe(10);
	});

	it('creates elements with random colors from accent palette', () => {
		fireConfetti({ particleCount: 20 });

		const particles = document.querySelectorAll('.confetti-particle');
		const bgColors = Array.from(particles).map((p) =>
			window.getComputedStyle(p).backgroundColor
		);

		// Check that we have at least one particle and all have a backgroundColor set
		expect(bgColors.length).toBeGreaterThan(0);
		bgColors.forEach((color) => {
			expect(color).toBeTruthy();
			expect(['rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(168, 85, 247)', 'rgb(245, 158, 11)']).toContain(color);
		});
	});

	it('removes particles after animation completes', () => {
		fireConfetti({ particleCount: 10, duration: 100 });

		expect(document.querySelectorAll('.confetti-particle').length).toBe(10);

		vi.advanceTimersByTime(150);

		expect(document.querySelectorAll('.confetti-particle').length).toBe(0);
	});

	it('uses default particle count of 65 when not specified', () => {
		fireConfetti();

		const particles = document.querySelectorAll('.confetti-particle');
		expect(particles.length).toBe(65);
	});

	it('uses default duration of 2000ms when not specified', () => {
		fireConfetti({ particleCount: 5 });

		expect(document.querySelectorAll('.confetti-particle').length).toBe(5);

		vi.advanceTimersByTime(1999);
		expect(document.querySelectorAll('.confetti-particle').length).toBe(5);

		vi.advanceTimersByTime(2);
		expect(document.querySelectorAll('.confetti-particle').length).toBe(0);
	});

	it('handles document not being available', () => {
		const originalDocument = global.document;
		Object.defineProperty(global, 'document', {
			value: undefined,
			writable: true,
		});

		expect(() => fireConfetti()).not.toThrow();

		Object.defineProperty(global, 'document', {
			value: originalDocument,
			writable: true,
		});
	});

	it('applies animation styles to particles', () => {
		fireConfetti({ particleCount: 1, duration: 500 });

		const particle = document.querySelector('.confetti-particle');
		expect(particle).toHaveStyle('animation: confetti-fall 0.5s ease-in forwards');
	});

	it('positions particles at center bottom of viewport', () => {
		const centerX = window.innerWidth / 2;
		const bottomY = window.innerHeight;

		fireConfetti({ particleCount: 3 });

		const particles = document.querySelectorAll('.confetti-particle');
		particles.forEach((particle) => {
			expect(particle).toHaveStyle(`left: ${centerX}px`);
			expect(particle).toHaveStyle(`top: ${bottomY}px`);
		});
	});

	it('creates both circular and rectangular particles', () => {
		fireConfetti({ particleCount: 100 });

		const particles = document.querySelectorAll('.confetti-particle');
		const circles = Array.from(particles).filter(
			(p) => window.getComputedStyle(p).borderRadius === '50%'
		);
		const rectangles = Array.from(particles).filter(
			(p) => window.getComputedStyle(p).borderRadius !== '50%'
		);

		expect(circles.length).toBeGreaterThan(0);
		expect(rectangles.length).toBeGreaterThan(0);
	});
});
