'use client';

import { motion } from 'motion/react';
import type { CoolStuffCategory } from '../../data/cool-stuff';
import { CATEGORY_COLORS, ALL_CATEGORIES } from '../../data/cool-stuff';

interface CategoryFilterProps {
	readonly active: CoolStuffCategory | 'all';
	readonly onChange: (category: CoolStuffCategory | 'all') => void;
}

const FILTER_LABELS: Record<CoolStuffCategory | 'all', string> = {
	all: 'All',
	tools: 'Tools',
	sites: 'Sites',
	articles: 'Articles',
	experiments: 'Experiments',
	resources: 'Resources',
};

const ALL_FILTERS: readonly (CoolStuffCategory | 'all')[] = ['all', ...ALL_CATEGORIES];

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
	return (
		<div
			role="group"
			aria-label="Filter by category"
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				gap: '0.5rem',
				marginBottom: '0',
			}}
		>
			{ALL_FILTERS.map((category) => {
				const isActive = active === category;
				const color = category === 'all' ? 'var(--place-secondary-400)' : CATEGORY_COLORS[category];

				return (
					<motion.button
						key={category}
						onClick={() => onChange(category)}
						whileHover={{ scale: 1.04 }}
						whileTap={{ scale: 0.97 }}
						style={{
							position: 'relative',
							padding: '0.375rem 0.875rem',
							borderRadius: '2rem',
							fontSize: '0.8125rem',
							fontWeight: 500,
							cursor: 'pointer',
							border: `1px solid ${isActive ? color : 'var(--place-border-default)'}`,
							backgroundColor: isActive ? `${color}20` : 'transparent',
							color: isActive ? color : 'var(--place-text-secondary)',
							transition: 'color 0.15s, border-color 0.15s, background-color 0.15s',
							outline: 'none',
						}}
						aria-pressed={isActive}
					>
						{isActive && (
							<motion.span
								layoutId="filter-active-bg"
								style={{
									position: 'absolute',
									inset: 0,
									borderRadius: '2rem',
									backgroundColor: `${color}15`,
								}}
								transition={{ duration: 0.2, ease: [0.65, 0.05, 0, 1] }}
							/>
						)}
						<span style={{ position: 'relative' }}>{FILTER_LABELS[category]}</span>
					</motion.button>
				);
			})}
		</div>
	);
}
