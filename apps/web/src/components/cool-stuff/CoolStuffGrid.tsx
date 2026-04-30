'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { CoolStuffCategory, CoolStuffItem, SortMode } from '../../data/cool-stuff';
import { COOL_STUFF } from '../../data/cool-stuff';
import { CategoryFilter } from './CategoryFilter';
import { CoolStuffCard } from './CoolStuffCard';
import { FeaturedSection } from './FeaturedSection';
import { SearchInput } from './SearchInput';
import { SortButtons } from './SortButtons';

function matchesSearch(item: CoolStuffItem, query: string): boolean {
	const q = query.toLowerCase();
	return (
		item.title.toLowerCase().includes(q) ||
		item.description.toLowerCase().includes(q) ||
		item.tags.some((tag) => tag.toLowerCase().includes(q))
	);
}

function sortItems(items: readonly CoolStuffItem[], mode: SortMode): readonly CoolStuffItem[] {
	const copy = [...items];
	switch (mode) {
		case 'newest':
			return copy.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
		case 'category':
			return copy.sort((a, b) => a.category.localeCompare(b.category));
		case 'az':
			return copy.sort((a, b) => a.title.localeCompare(b.title));
	}
}

export function CoolStuffGrid() {
	const [activeFilter, setActiveFilter] = useState<CoolStuffCategory | 'all'>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [sortMode, setSortMode] = useState<SortMode>('newest');

	const featuredItems = useMemo(
		() => COOL_STUFF.filter((item) => item.featured),
		[],
	);

	const filtered = useMemo(() => {
		let result: readonly CoolStuffItem[] = COOL_STUFF;

		if (activeFilter !== 'all') {
			result = result.filter((item) => item.category === activeFilter);
		}

		if (searchQuery.trim()) {
			result = result.filter((item) => matchesSearch(item, searchQuery.trim()));
		}

		return sortItems(result, sortMode);
	}, [activeFilter, searchQuery, sortMode]);

	const showFeatured = activeFilter === 'all' && !searchQuery.trim();

	return (
		<div>
			{showFeatured ? <FeaturedSection items={featuredItems} /> : null}

			<SearchInput value={searchQuery} onChange={setSearchQuery} />

			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '0.5rem',
				}}
			>
				<CategoryFilter active={activeFilter} onChange={setActiveFilter} />
				<SortButtons active={sortMode} onChange={setSortMode} />
			</div>

			<div className="cool-stuff-grid">
				<AnimatePresence mode="popLayout">
					{filtered.map((item, i) => (
						<div
							key={item.id}
							className={item.size === 'large' ? 'cool-stuff-grid-large' : undefined}
						>
							<CoolStuffCard item={item} index={i} />
						</div>
					))}
				</AnimatePresence>
			</div>

			{filtered.length === 0 ? (
				<div
					style={{
						textAlign: 'center',
						padding: '4rem 2rem',
						color: 'var(--place-text-secondary)',
						fontSize: '0.875rem',
					}}
				>
					{searchQuery.trim()
						? `No results for "${searchQuery.trim()}"`
						: 'Nothing here yet.'}
				</div>
			) : null}

			<style>{`
				.cool-stuff-grid {
					display: grid;
					grid-template-columns: 1fr;
					gap: 1rem;
					align-items: start;
				}
				@media (min-width: 640px) {
					.cool-stuff-grid {
						grid-template-columns: repeat(2, 1fr);
					}
				}
				@media (min-width: 960px) {
					.cool-stuff-grid {
						grid-template-columns: repeat(3, 1fr);
					}
					.cool-stuff-grid-large {
						grid-column: span 2;
					}
				}
			`}</style>
		</div>
	);
}
