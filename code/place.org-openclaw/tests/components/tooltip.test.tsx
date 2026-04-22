import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Tooltip } from '../../src/components/ui/Tooltip';

describe('Tooltip', () => {
	it('renders trigger element', () => {
		render(
			<Tooltip content="Test tooltip">
				<button>Hover me</button>
			</Tooltip>
		);
		expect(screen.getByText('Hover me')).toBeDefined();
	});

	it('is hidden by default', () => {
		render(
			<Tooltip content="Test tooltip">
				<button>Hover me</button>
			</Tooltip>
		);
		expect(screen.queryByText('Test tooltip')).toBeNull();
	});

	it('shows tooltip content on hover after delay', async () => {
		render(
			<Tooltip content="Test tooltip" delay={100}>
				<button>Hover me</button>
			</Tooltip>
		);

		const button = screen.getByText('Hover me');
		fireEvent.mouseEnter(button);

		// Before delay, tooltip should not be visible
		expect(screen.queryByText('Test tooltip')).toBeNull();

		// After delay, tooltip should be visible
		await waitFor(
			() => {
				expect(screen.getByText('Test tooltip')).toBeDefined();
			},
			{ timeout: 500 }
		);
	});

	it('hides tooltip on mouse leave', async () => {
		render(
			<Tooltip content="Test tooltip" delay={0}>
				<button>Hover me</button>
			</Tooltip>
		);

		const button = screen.getByText('Hover me');
		fireEvent.mouseEnter(button);

		await waitFor(
			() => {
				expect(screen.getByText('Test tooltip')).toBeDefined();
			},
			{ timeout: 500 }
		);

		fireEvent.mouseLeave(button);

		await waitFor(
			() => {
				expect(screen.queryByText('Test tooltip')).toBeNull();
			},
			{ timeout: 500 }
		);
	});

	it('respects custom delay prop', async () => {
		const { rerender } = render(
			<Tooltip content="Test tooltip" delay={200}>
				<button>Hover me</button>
			</Tooltip>
		);

		const button = screen.getByText('Hover me');
		fireEvent.mouseEnter(button);

		// Initially not visible
		expect(screen.queryByText('Test tooltip')).toBeNull();

		// After delay, should be visible
		await waitFor(
			() => {
				expect(screen.getByText('Test tooltip')).toBeDefined();
			},
			{ timeout: 500 }
		);
	});

	it('cancels timeout if mouse leaves before delay completes', async () => {
		render(
			<Tooltip content="Test tooltip" delay={500}>
				<button>Hover me</button>
			</Tooltip>
		);

		const button = screen.getByText('Hover me');
		fireEvent.mouseEnter(button);

		// Immediately leave before delay completes
		setTimeout(() => {
			fireEvent.mouseLeave(button);
		}, 100);

		// Wait a bit longer than the original delay would have been
		await new Promise((resolve) => setTimeout(resolve, 600));

		// Tooltip should not appear
		expect(screen.queryByText('Test tooltip')).toBeNull();
	});

	it('applies glass styling class', async () => {
		render(
			<Tooltip content="Test tooltip" delay={0}>
				<button>Hover me</button>
			</Tooltip>
		);

		const button = screen.getByText('Hover me');
		fireEvent.mouseEnter(button);

		await waitFor(
			() => {
				const tooltip = screen.getByText('Test tooltip');
				const container = tooltip.closest('[class*="glass"]');
				expect(container).toBeDefined();
				expect(container?.className).toContain('glass');
			},
			{ timeout: 500 }
		);
	});
});
