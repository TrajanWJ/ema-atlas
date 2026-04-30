import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageTransition } from '../../src/components/ui/PageTransition';

describe('PageTransition', () => {
	it('renders children', () => {
		render(
			<PageTransition>
				<p>Hello transition</p>
			</PageTransition>,
		);

		expect(screen.getByText('Hello transition')).toBeDefined();
	});

	it('has motion wrapper (renders as div via motion.div)', () => {
		const { container } = render(
			<PageTransition>
				<span>content</span>
			</PageTransition>,
		);

		const wrapper = container.firstElementChild;
		expect(wrapper).toBeDefined();
		expect(wrapper?.tagName.toLowerCase()).toBe('div');
	});

	it('passes className to the motion wrapper', () => {
		const { container } = render(
			<PageTransition className="my-custom-class">
				<span>styled</span>
			</PageTransition>,
		);

		const wrapper = container.firstElementChild;
		expect(wrapper?.className).toContain('my-custom-class');
	});
});
