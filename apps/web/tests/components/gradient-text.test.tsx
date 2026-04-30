import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GradientText } from '../../src/components/ui/GradientText';

describe('GradientText', () => {
	it('renders children text', () => {
		render(<GradientText>Hello World</GradientText>);

		const text = screen.getByText('Hello World');
		expect(text).toBeDefined();
		expect(text.textContent).toBe('Hello World');
	});

	it('has correct CSS class', () => {
		const { container } = render(<GradientText>Test</GradientText>);

		const span = container.querySelector('.gradient-text');
		expect(span).toBeDefined();
		expect(span?.className).toContain('gradient-text');
	});

	it('applies custom className', () => {
		const { container } = render(
			<GradientText className="text-xl font-bold">Custom</GradientText>
		);

		const span = container.querySelector('.gradient-text');
		expect(span?.className).toContain('text-xl');
		expect(span?.className).toContain('font-bold');
	});

	it('applies speed variants to animation', () => {
		const { rerender, container } = render(
			<GradientText speed="slow">Slow</GradientText>
		);

		let span = container.querySelector('.gradient-text') as HTMLElement;
		expect(span.style.animation).toContain('8s');

		rerender(<GradientText speed="normal">Normal</GradientText>);
		span = container.querySelector('.gradient-text') as HTMLElement;
		expect(span.style.animation).toContain('4s');

		rerender(<GradientText speed="fast">Fast</GradientText>);
		span = container.querySelector('.gradient-text') as HTMLElement;
		expect(span.style.animation).toContain('2s');
	});

	it('applies default animation speed', () => {
		const { container } = render(<GradientText>Default</GradientText>);

		const span = container.querySelector('.gradient-text') as HTMLElement;
		expect(span.style.animation).toContain('4s');
	});

	it('applies custom colors to gradient', () => {
		const { container } = render(
			<GradientText colors={['#ff0000', '#00ff00', '#0000ff']}>
				Custom Colors
			</GradientText>
		);

		const span = container.querySelector('.gradient-text') as HTMLElement;
		expect(span.style.background).toContain('linear-gradient');
		expect(span.style.background).toContain('rgb(255, 0, 0)');
		expect(span.style.background).toContain('rgb(0, 255, 0)');
		expect(span.style.background).toContain('rgb(0, 0, 255)');
	});

	it('applies default colors when none provided', () => {
		const { container } = render(<GradientText>Default Colors</GradientText>);

		const span = container.querySelector('.gradient-text') as HTMLElement;
		expect(span.style.background).toContain('var(--accent-blue)');
		expect(span.style.background).toContain('#b88fff');
	});

	it('sets correct CSS properties for text gradient effect', () => {
		const { container } = render(<GradientText>Text Gradient</GradientText>);

		const span = container.querySelector('.gradient-text') as HTMLElement;
		expect(span.style.backgroundSize).toContain('200%');
		expect(span.style.webkitBackgroundClip).toBe('text');
		expect(span.style.webkitTextFillColor).toBe('transparent');
		expect(span.style.backgroundClip).toBe('text');
	});
});
