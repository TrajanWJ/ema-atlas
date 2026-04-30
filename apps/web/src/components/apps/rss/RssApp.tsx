'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRssStore } from '@/src/stores/rss-store';
import type { RssFeed, RssItem } from '@/src/stores/rss-store';
import { RssIcon } from '@/src/components/icons/RssIcon';
import { ReadingView } from './ReadingView';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function formatDate(ts: number): string {
	if (!ts) return '';
	const d = new Date(ts);
	const now = new Date();
	const diff = now.getTime() - d.getTime();

	if (diff < 3_600_000) {
		const mins = Math.floor(diff / 60_000);
		return `${mins}m ago`;
	}
	if (diff < 86_400_000) {
		const hrs = Math.floor(diff / 3_600_000);
		return `${hrs}h ago`;
	}
	if (diff < 604_800_000) {
		const days = Math.floor(diff / 86_400_000);
		return `${days}d ago`;
	}
	return d.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});
}

function truncate(str: string, max: number): string {
	if (str.length <= max) return str;
	return `${str.slice(0, max)}...`;
}

// ----------------------------------------------------------------------------
// Star Icon (inline SVG)
// ----------------------------------------------------------------------------

function StarIcon({
	filled,
	size = 14,
}: {
	readonly filled: boolean;
	readonly size?: number;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={filled ? 'var(--place-accent)' : 'none'}
			stroke={filled ? 'var(--place-accent)' : 'currentColor'}
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
		</svg>
	);
}

// ----------------------------------------------------------------------------
// Feed Sidebar
// ----------------------------------------------------------------------------

function FeedSidebar({
	feeds,
	items,
	activeFeedId,
	onSelect,
	onAdd,
	onRemove,
}: {
	readonly feeds: readonly RssFeed[];
	readonly items: readonly RssItem[];
	readonly activeFeedId: string | null;
	readonly onSelect: (id: string | null) => void;
	readonly onAdd: () => void;
	readonly onRemove: (id: string) => void;
}) {
	const unreadCounts = useMemo(() => {
		const counts: Record<string, number> = { all: 0 };
		for (const item of items) {
			if (!item.read) {
				counts.all = (counts.all ?? 0) + 1;
				counts[item.feedId] = (counts[item.feedId] ?? 0) + 1;
			}
		}
		return counts;
	}, [items]);

	return (
		<div
			className="flex flex-col"
			style={{
				width: 140,
				minWidth: 140,
				borderRight: '1px solid var(--place-border)',
				background: 'var(--place-bg-secondary)',
			}}
		>
			<div
				className="flex items-center justify-between px-2 py-1.5"
				style={{
					borderBottom: '1px solid var(--place-border)',
					fontSize: '0.7rem',
					fontWeight: 600,
					color: 'var(--place-text-secondary)',
					textTransform: 'uppercase',
					letterSpacing: '0.05em',
				}}
			>
				<span>Feeds</span>
				<button
					type="button"
					onClick={onAdd}
					style={{
						background: 'none',
						border: 'none',
						color: 'var(--place-text-secondary)',
						cursor: 'pointer',
						fontSize: '1rem',
						lineHeight: 1,
						padding: '0 2px',
					}}
					title="Add feed"
				>
					+
				</button>
			</div>

			<div className="flex-1 overflow-y-auto">
				<FeedRow
					label="All Feeds"
					active={activeFeedId === null}
					unread={unreadCounts.all ?? 0}
					onClick={() => onSelect(null)}
					favicon={null}
				/>

				{feeds.map((feed) => (
					<FeedRow
						key={feed.id}
						label={feed.title}
						active={activeFeedId === feed.id}
						unread={unreadCounts[feed.id] ?? 0}
						onClick={() => onSelect(feed.id)}
						favicon={feed.favicon}
						onRemove={() => onRemove(feed.id)}
					/>
				))}
			</div>
		</div>
	);
}

function FeedRow({
	label,
	active,
	unread,
	onClick,
	favicon,
	onRemove,
}: {
	readonly label: string;
	readonly active: boolean;
	readonly unread: number;
	readonly onClick: () => void;
	readonly favicon: string | null;
	readonly onRemove?: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			onContextMenu={(e) => {
				if (!onRemove) return;
				e.preventDefault();
				onRemove();
			}}
			className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left"
			style={{
				background: active
					? 'var(--place-accent-muted, rgba(99,102,241,0.12))'
					: 'transparent',
				border: 'none',
				cursor: 'pointer',
				fontSize: '0.75rem',
				color: active
					? 'var(--place-text-primary)'
					: 'var(--place-text-secondary)',
			}}
		>
			{favicon ? (
				<img
					src={favicon}
					alt=""
					width={14}
					height={14}
					style={{ borderRadius: 2, flexShrink: 0 }}
				/>
			) : (
				<RssIcon size={14} />
			)}
			<span
				className="flex-1 truncate"
				style={{ fontWeight: active ? 600 : 400 }}
			>
				{label}
			</span>
			{unread > 0 && (
				<span
					style={{
						fontSize: '0.625rem',
						fontWeight: 600,
						color: 'var(--place-bg-primary)',
						background: 'var(--place-accent)',
						borderRadius: 999,
						padding: '0 4px',
						minWidth: 16,
						textAlign: 'center',
						lineHeight: '16px',
					}}
				>
					{unread}
				</span>
			)}
		</button>
	);
}

// ----------------------------------------------------------------------------
// Article List
// ----------------------------------------------------------------------------

function ArticleList({
	items,
	feeds,
	activeItemId,
	onSelect,
	onToggleStar,
}: {
	readonly items: readonly RssItem[];
	readonly feeds: readonly RssFeed[];
	readonly activeItemId: string | null;
	readonly onSelect: (id: string) => void;
	readonly onToggleStar: (id: string) => void;
}) {
	const feedMap = useMemo(() => {
		const map = new Map<string, RssFeed>();
		for (const f of feeds) map.set(f.id, f);
		return map;
	}, [feeds]);

	const sorted = useMemo(
		() => [...items].sort((a, b) => b.pubDate - a.pubDate),
		[items],
	);

	if (sorted.length === 0) {
		return (
			<div
				className="flex h-full items-center justify-center"
				style={{
					color: 'var(--place-text-tertiary)',
					fontSize: '0.75rem',
				}}
			>
				No articles
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto">
			{sorted.map((item) => (
				<ArticleRow
					key={item.id}
					item={item}
					feedName={feedMap.get(item.feedId)?.title ?? ''}
					active={activeItemId === item.id}
					onSelect={() => onSelect(item.id)}
					onToggleStar={() => onToggleStar(item.id)}
				/>
			))}
		</div>
	);
}

function ArticleRow({
	item,
	feedName,
	active,
	onSelect,
	onToggleStar,
}: {
	readonly item: RssItem;
	readonly feedName: string;
	readonly active: boolean;
	readonly onSelect: () => void;
	readonly onToggleStar: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className="flex w-full gap-2 px-2 py-2 text-left"
			style={{
				background: active
					? 'var(--place-accent-muted, rgba(99,102,241,0.12))'
					: 'transparent',
				border: 'none',
				borderBottom: '1px solid var(--place-border)',
				cursor: 'pointer',
			}}
		>
			{item.thumbnail && (
				<img
					src={item.thumbnail}
					alt=""
					style={{
						width: 40,
						height: 40,
						objectFit: 'cover',
						borderRadius: 4,
						flexShrink: 0,
					}}
				/>
			)}
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span
					className="truncate"
					style={{
						fontSize: '0.75rem',
						fontWeight: item.read ? 400 : 600,
						color: 'var(--place-text-primary)',
						lineHeight: 1.3,
					}}
				>
					{item.title}
				</span>
				<div
					className="flex items-center gap-1"
					style={{
						fontSize: '0.625rem',
						color: 'var(--place-text-tertiary)',
					}}
				>
					<span className="truncate">{feedName}</span>
					{item.pubDate > 0 && (
						<>
							<span>·</span>
							<span style={{ flexShrink: 0 }}>
								{formatDate(item.pubDate)}
							</span>
						</>
					)}
				</div>
				<span
					className="truncate"
					style={{
						fontSize: '0.675rem',
						color: 'var(--place-text-secondary)',
						lineHeight: 1.3,
					}}
				>
					{truncate(item.description, 80)}
				</span>
			</div>
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onToggleStar();
				}}
				style={{
					background: 'none',
					border: 'none',
					cursor: 'pointer',
					padding: 2,
					flexShrink: 0,
					color: 'var(--place-text-tertiary)',
				}}
				title={item.starred ? 'Unstar' : 'Star'}
			>
				<StarIcon filled={item.starred} />
			</button>
		</button>
	);
}

// ----------------------------------------------------------------------------
// Add Feed Input
// ----------------------------------------------------------------------------

function AddFeedInput({
	onSubmit,
	onCancel,
}: {
	readonly onSubmit: (url: string) => void;
	readonly onCancel: () => void;
}) {
	const [value, setValue] = useState('');
	const [error, setError] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSubmit = useCallback(() => {
		const trimmed = value.trim();
		if (!trimmed) {
			onCancel();
			return;
		}

		try {
			const url = new URL(trimmed);
			if (!['http:', 'https:'].includes(url.protocol)) {
				setError('Use http or https');
				return;
			}
			onSubmit(trimmed);
		} catch {
			setError('Invalid URL');
		}
	}, [value, onSubmit, onCancel]);

	return (
		<div
			className="flex flex-col gap-1 p-2"
			style={{ borderBottom: '1px solid var(--place-border)' }}
		>
			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={(e) => {
					setValue(e.target.value);
					setError('');
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter') handleSubmit();
					if (e.key === 'Escape') onCancel();
				}}
				placeholder="Feed URL..."
				style={{
					width: '100%',
					fontSize: '0.7rem',
					padding: '3px 6px',
					background: 'var(--place-bg-primary)',
					border: '1px solid var(--place-border)',
					borderRadius: 4,
					color: 'var(--place-text-primary)',
					outline: 'none',
				}}
			/>
			{error && (
				<span style={{ fontSize: '0.625rem', color: '#ef4444' }}>
					{error}
				</span>
			)}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Main App
// ----------------------------------------------------------------------------

export function RssApp() {
	const {
		feeds,
		items,
		activeFeedId,
		activeItemId,
		loading,
		loadPersistedFeeds,
		addFeed,
		removeFeed,
		refreshAll,
		toggleStar,
		setActiveFeed,
		setActiveItem,
		markAllRead,
	} = useRssStore();

	const [showAddInput, setShowAddInput] = useState(false);
	const [addError, setAddError] = useState('');
	const initialized = useRef(false);

	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;
		loadPersistedFeeds();
	}, [loadPersistedFeeds]);

	const filteredItems = useMemo(() => {
		if (activeFeedId === null) return items;
		return items.filter((i) => i.feedId === activeFeedId);
	}, [items, activeFeedId]);

	const activeItem = useMemo(
		() => items.find((i) => i.id === activeItemId) ?? null,
		[items, activeItemId],
	);

	const activeFeedName = useMemo(() => {
		if (!activeItem) return '';
		return feeds.find((f) => f.id === activeItem.feedId)?.title ?? '';
	}, [activeItem, feeds]);

	const handleAddFeed = useCallback(
		async (url: string) => {
			setAddError('');
			try {
				await addFeed(url);
				setShowAddInput(false);
			} catch (err) {
				setAddError(
					err instanceof Error ? err.message : 'Failed to add feed',
				);
			}
		},
		[addFeed],
	);

	return (
		<div
			className="flex h-full"
			style={{
				background: 'var(--place-bg-primary)',
				color: 'var(--place-text-primary)',
			}}
		>
			{/* Left Sidebar — Feeds */}
			<div
				className="flex flex-col"
				style={{
					width: 140,
					minWidth: 140,
					borderRight: '1px solid var(--place-border)',
					background: 'var(--place-bg-secondary)',
				}}
			>
				<div
					className="flex items-center justify-between px-2 py-1.5"
					style={{
						borderBottom: '1px solid var(--place-border)',
						fontSize: '0.7rem',
						fontWeight: 600,
						color: 'var(--place-text-secondary)',
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
					}}
				>
					<span>Feeds</span>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => refreshAll()}
							disabled={loading}
							style={{
								background: 'none',
								border: 'none',
								color: 'var(--place-text-secondary)',
								cursor: loading ? 'wait' : 'pointer',
								fontSize: '0.75rem',
								lineHeight: 1,
								padding: '0 2px',
								opacity: loading ? 0.5 : 1,
							}}
							title="Refresh all feeds"
						>
							&#x21bb;
						</button>
						<button
							type="button"
							onClick={() => setShowAddInput(true)}
							style={{
								background: 'none',
								border: 'none',
								color: 'var(--place-text-secondary)',
								cursor: 'pointer',
								fontSize: '1rem',
								lineHeight: 1,
								padding: '0 2px',
							}}
							title="Add feed"
						>
							+
						</button>
					</div>
				</div>

				<AnimatePresence>
					{showAddInput && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.15 }}
							style={{ overflow: 'hidden' }}
						>
							<AddFeedInput
								onSubmit={handleAddFeed}
								onCancel={() => {
									setShowAddInput(false);
									setAddError('');
								}}
							/>
							{addError && (
								<div
									className="px-2 pb-1"
									style={{
										fontSize: '0.625rem',
										color: '#ef4444',
									}}
								>
									{addError}
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>

				<div className="flex-1 overflow-y-auto">
					<FeedRow
						label="All Feeds"
						active={activeFeedId === null}
						unread={items.filter((i) => !i.read).length}
						onClick={() => setActiveFeed(null)}
						favicon={null}
					/>

					{feeds.map((feed) => (
						<FeedRow
							key={feed.id}
							label={feed.title}
							active={activeFeedId === feed.id}
							unread={
								items.filter(
									(i) => i.feedId === feed.id && !i.read,
								).length
							}
							onClick={() => setActiveFeed(feed.id)}
							favicon={feed.favicon}
							onRemove={() => removeFeed(feed.id)}
						/>
					))}
				</div>

				{/* Mark All Read button */}
				<button
					type="button"
					onClick={() => markAllRead(activeFeedId)}
					className="mx-2 mb-2 mt-1"
					style={{
						fontSize: '0.65rem',
						padding: '3px 0',
						background: 'var(--place-bg-primary)',
						border: '1px solid var(--place-border)',
						borderRadius: 4,
						color: 'var(--place-text-secondary)',
						cursor: 'pointer',
					}}
				>
					Mark All Read
				</button>
			</div>

			{/* Center — Article List */}
			<div
				className="flex flex-col"
				style={{
					width: 200,
					minWidth: 160,
					borderRight: '1px solid var(--place-border)',
				}}
			>
				<div
					className="px-2 py-1.5"
					style={{
						borderBottom: '1px solid var(--place-border)',
						fontSize: '0.7rem',
						fontWeight: 600,
						color: 'var(--place-text-secondary)',
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
					}}
				>
					{loading ? 'Loading...' : `${filteredItems.length} articles`}
				</div>
				<ArticleList
					items={filteredItems}
					feeds={feeds}
					activeItemId={activeItemId}
					onSelect={setActiveItem}
					onToggleStar={toggleStar}
				/>
			</div>

			{/* Right — Reading View */}
			<div className="flex min-w-0 flex-1 flex-col">
				<ReadingView item={activeItem} feedName={activeFeedName} />
			</div>
		</div>
	);
}
