'use client';

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { CoolStuffCategory } from '../../data/cool-stuff';
import { COOL_STUFF } from '../../data/cool-stuff';
import { CategoryFilter } from './CategoryFilter';
import { CoolStuffCard } from './CoolStuffCard';

export function CoolStuffGrid() {
	const [activeFilter, setActiveFilter] = useState<CoolStuffCategory | 'all'>('all');

	const filtered =
		activeFilter === 'all'
			? COOL_STUFF
			: COOL_STUFF.filter((item) => item.category === activeFilter);

	return (
		<div>
			<CategoryFilter active={activeFilter} onChange={setActiveFilter} />

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(3, 1fr)',
					gap: '1rem',
					alignItems: 'start',
				}}
			>
				<AnimatePresence mode="popLayout">
					{filtered.map((item) => (
						<div
							key={item.id}
							style={{
								gridColumn: item.size === 'large' ? 'span 2' : 'span 1',
								gridRow: 'span 1',
							}}
						>
							<CoolStuffCard item={item} />
						</div>
					))}
				</AnimatePresence>
			</div>

			{filtered.length === 0 && (
				<div
					style={{
						textAlign: 'center',
						padding: '4rem 2rem',
						color: 'var(--text-secondary)',
						fontSize: '0.875rem',
					}}
				>
					Nothing here yet.
				</div>
			)}
		</div>
	);
}
