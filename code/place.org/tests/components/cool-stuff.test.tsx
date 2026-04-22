import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// motion/react uses layout animations that rely on browser APIs not available in jsdom
vi.mock('motion/react', () => ({
	motion: {
		a: ({ children, ...props }: React.HTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => (
			<a {...props}>{children}</a>
		),
		button: ({
			children,
			whileHover: _wh,
			whileTap: _wt,
			...props
		}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
			children?: React.ReactNode;
			whileHover?: unknown;
			whileTap?: unknown;
		}) => <button {...props}>{children}</button>,
		span: ({ children, layoutId: _li, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode; layoutId?: string }) => (
			<span {...props}>{children}</span>
		),
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { CoolStuffCard } from '../../src/components/cool-stuff/CoolStuffCard';
import { CategoryFilter } from '../../src/components/cool-stuff/CategoryFilter';
import { CoolStuffGrid } from '../../src/components/cool-stuff/CoolStuffGrid';
import { COOL_STUFF } from '../../src/data/cool-stuff';

// ---------------------------------------------------------------------------
// CoolStuffCard
// ---------------------------------------------------------------------------
describe('CoolStuffCard', () => {
	const item = COOL_STUFF[0];

	it('renders the title', () => {
		if (!item) throw new Error('No item');
		render(<CoolStuffCard item={item} />);
		expect(screen.getByText(item.title)).toBeDefined();
	});

	it('renders the description', () => {
		if (!item) throw new Error('No item');
		render(<CoolStuffCard item={item} />);
		expect(screen.getByText(item.description)).toBeDefined();
	});

	it('links to the correct URL', () => {
		if (!item) throw new Error('No item');
		render(<CoolStuffCard item={item} />);
		const link = screen.getByRole('link');
		expect(link.getAttribute('href')).toBe(item.url);
	});

	it('opens in a new tab', () => {
		if (!item) throw new Error('No item');
		render(<CoolStuffCard item={item} />);
		const link = screen.getByRole('link');
		expect(link.getAttribute('target')).toBe('_blank');
	});

	it('renders the category tag', () => {
		if (!item) throw new Error('No item');
		render(<CoolStuffCard item={item} />);
		expect(screen.getByText('Sites')).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// CategoryFilter
// ---------------------------------------------------------------------------
describe('CategoryFilter', () => {
	it('renders All filter button', () => {
		render(<CategoryFilter active="all" onChange={() => {}} />);
		expect(screen.getByRole('button', { name: /all/i })).toBeDefined();
	});

	it('renders all category buttons', () => {
		render(<CategoryFilter active="all" onChange={() => {}} />);
		expect(screen.getByRole('button', { name: /tools/i })).toBeDefined();
		expect(screen.getByRole('button', { name: /sites/i })).toBeDefined();
		expect(screen.getByRole('button', { name: /articles/i })).toBeDefined();
		expect(screen.getByRole('button', { name: /experiments/i })).toBeDefined();
		expect(screen.getByRole('button', { name: /resources/i })).toBeDefined();
	});

	it('marks the active filter as pressed', () => {
		render(<CategoryFilter active="tools" onChange={() => {}} />);
		const toolsBtn = screen.getByRole('button', { name: /tools/i });
		expect(toolsBtn.getAttribute('aria-pressed')).toBe('true');
	});

	it('calls onChange when a filter is clicked', () => {
		const onChange = vi.fn();
		render(<CategoryFilter active="all" onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: /tools/i }));
		expect(onChange).toHaveBeenCalledWith('tools');
	});

	it('calls onChange with "all" when All is clicked', () => {
		const onChange = vi.fn();
		render(<CategoryFilter active="tools" onChange={onChange} />);
		fireEvent.click(screen.getByRole('button', { name: /all/i }));
		expect(onChange).toHaveBeenCalledWith('all');
	});
});

// ---------------------------------------------------------------------------
// CoolStuffGrid
// ---------------------------------------------------------------------------
describe('CoolStuffGrid', () => {
	it('renders all items by default', () => {
		render(<CoolStuffGrid />);
		for (const item of COOL_STUFF) {
			expect(screen.getByText(item.title)).toBeDefined();
		}
	});

	it('filters items when a category is selected', () => {
		render(<CoolStuffGrid />);
		fireEvent.click(screen.getByRole('button', { name: /tools/i }));

		const toolItems = COOL_STUFF.filter((i) => i.category === 'tools');
		const nonToolItems = COOL_STUFF.filter((i) => i.category !== 'tools');

		for (const item of toolItems) {
			expect(screen.getByText(item.title)).toBeDefined();
		}

		for (const item of nonToolItems) {
			expect(screen.queryByText(item.title)).toBeNull();
		}
	});

	it('shows all items again when All is clicked', () => {
		render(<CoolStuffGrid />);
		fireEvent.click(screen.getByRole('button', { name: /experiments/i }));
		fireEvent.click(screen.getByRole('button', { name: /all/i }));

		for (const item of COOL_STUFF) {
			expect(screen.getByText(item.title)).toBeDefined();
		}
	});

	it('shows all card titles and descriptions', () => {
		render(<CoolStuffGrid />);
		for (const item of COOL_STUFF) {
			expect(screen.getByText(item.description)).toBeDefined();
		}
	});
});
