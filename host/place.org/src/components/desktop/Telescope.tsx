'use client';

import { createElement, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useDesktopStore } from '@/src/stores/desktop-store';
import { useWindowStore } from '@/src/stores/window-store';
import { useFileStore } from '@/src/stores/file-store';
import { getAllApps } from '@/src/lib/app-registry';
import type { SearchResult } from '@/src/lib/app-registry';
import { SearchIcon, FinderIcon } from '@/src/components/icons';
import { formatFileSize } from '@/src/lib/file-utils';
import type { AppId } from '@/src/types/window';

// ── Constants ──

const MAX_PER_APP = 5;
const MAX_TOTAL = 20;
const DEBOUNCE_MS = 150;

// ── Types ──

interface GroupedResults {
	readonly appId: string;
	readonly appName: string;
	readonly appIcon: React.ReactNode;
	readonly results: readonly SearchResult[];
}

// ── Search logic ──

function searchAllApps(query: string): readonly GroupedResults[] {
	const trimmed = query.trim().toLowerCase();
	if (!trimmed) return [];

	const apps = getAllApps();
	const groups: GroupedResults[] = [];
	let total = 0;

	for (const app of apps) {
		if (!app.search || total >= MAX_TOTAL) continue;

		const results = app.search(trimmed);
		if (results.length === 0) continue;

		const remaining = MAX_TOTAL - total;
		const sliced = results.slice(0, Math.min(MAX_PER_APP, remaining));
		groups.push({
			appId: app.id,
			appName: app.name,
			appIcon: app.icon,
			results: sliced,
		});
		total += sliced.length;
	}

	return groups;
}

async function searchFiles(query: string): Promise<GroupedResults | null> {
	const trimmed = query.trim().toLowerCase();
	if (!trimmed) return null;

	const files = await useFileStore.getState().search(trimmed);
	if (files.length === 0) return null;

	const results: SearchResult[] = files.slice(0, MAX_PER_APP).map((file) => ({
		id: file.id,
		appId: 'finder',
		title: file.filename,
		subtitle: `${file.folderId} · ${formatFileSize(file.sizeBytes)}`,
	}));

	return {
		appId: 'files',
		appName: 'Files',
		appIcon: createElement(FinderIcon, { size: 20 }),
		results,
	};
}

// ── Result row ──

function TelescopeResult({
	result,
	appIcon,
	selected,
	onSelect,
	onHover,
}: {
	readonly result: SearchResult;
	readonly appIcon: React.ReactNode;
	readonly selected: boolean;
	readonly onSelect: () => void;
	readonly onHover: () => void;
}) {
	return (
		<button
			type="button"
			role="option"
			aria-selected={selected}
			className="flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-left transition-colors"
			style={{
				background: selected ? 'rgba(255,255,255,0.04)' : 'transparent',
				border: 'none',
				cursor: 'default',
				borderLeft: selected
					? '2px solid var(--place-primary-400)'
					: '2px solid transparent',
			}}
			onClick={onSelect}
			onMouseEnter={onHover}
		>
			<span
				className="flex-shrink-0 flex items-center justify-center"
				style={{ width: 20, height: 20, opacity: 0.7 }}
			>
				{appIcon}
			</span>
			<div className="flex flex-col min-w-0">
				<span
					className="truncate"
					style={{
						fontSize: '0.8rem',
						color: selected
							? 'var(--place-text-primary)'
							: 'var(--place-text-secondary)',
						fontWeight: selected ? 500 : 400,
					}}
				>
					{result.title}
				</span>
				{result.subtitle && (
					<span
						className="truncate"
						style={{
							fontSize: '0.65rem',
							color: 'var(--place-text-muted)',
						}}
					>
						{result.subtitle}
					</span>
				)}
			</div>
		</button>
	);
}

// ── Main Telescope component ──

export function Telescope() {
	const isOpen = useDesktopStore((s) => s.telescopeOpen);
	const closeTelescope = useDesktopStore((s) => s.closeTelescope);
	const openWindow = useWindowStore((s) => s.openWindow);

	const [query, setQuery] = useState('');
	const [groups, setGroups] = useState<readonly GroupedResults[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	// Build flat list of all results for keyboard navigation
	const flatResults = groups.flatMap((g) =>
		g.results.map((r) => ({ result: r, appId: g.appId, appIcon: g.appIcon })),
	);

	// Focus input when opened, reset state
	useEffect(() => {
		if (isOpen) {
			setQuery('');
			setGroups([]);
			setSelectedIndex(0);
			requestAnimationFrame(() => inputRef.current?.focus());
		}
	}, [isOpen]);

	// Debounced search
	const handleQueryChange = useCallback((value: string) => {
		setQuery(value);
		setSelectedIndex(0);

		if (debounceRef.current) clearTimeout(debounceRef.current);

		if (!value.trim()) {
			setGroups([]);
			return;
		}

		debounceRef.current = setTimeout(async () => {
			const appGroups = searchAllApps(value);
			const fileGroup = await searchFiles(value);
			setGroups(fileGroup ? [...appGroups, fileGroup] : appGroups);
		}, DEBOUNCE_MS);
	}, []);

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const activateResult = useCallback(
		(appId: string, resultId?: string) => {
			if (appId === 'files' && resultId) {
				useFileStore.getState().download(resultId);
			} else {
				openWindow(appId as AppId);
			}
			closeTelescope();
		},
		[openWindow, closeTelescope],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < flatResults.length - 1 ? prev + 1 : 0,
				);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev > 0 ? prev - 1 : flatResults.length - 1,
				);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const selected = flatResults[selectedIndex];
				if (selected) {
					activateResult(selected.appId, selected.result.id);
				}
			} else if (e.key === 'Escape') {
				e.preventDefault();
				closeTelescope();
			}
		},
		[flatResults, selectedIndex, activateResult, closeTelescope],
	);

	// Click outside to close
	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (panelRef.current?.contains(e.target as Node)) return;
			closeTelescope();
		},
		[closeTelescope],
	);

	const modal = (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 flex items-start justify-center"
					style={{ zIndex: 99999, paddingTop: '15vh' }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.12 }}
					onClick={handleBackdropClick}
				>
					{/* Backdrop */}
					<div
						className="absolute inset-0"
						style={{ background: 'rgba(0, 0, 0, 0.4)' }}
					/>

					{/* Panel */}
					<motion.div
						ref={panelRef}
						className="relative w-full rounded-[10px] overflow-hidden flex flex-col"
						style={{
							maxWidth: '500px',
							maxHeight: '60vh',
							background: 'var(--place-surface-1)',
							border: '1px solid var(--place-border-default)',
							backdropFilter: 'blur(24px)',
							WebkitBackdropFilter: 'blur(24px)',
							boxShadow:
								'0 24px 80px rgba(0,0,0,0.5)',
						}}
						initial={{ opacity: 0, scale: 0.95, y: -8 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: -8 }}
						transition={{ duration: 0.15, ease: 'easeOut' }}
					>
						{/* Input */}
						<div
							className="flex items-center gap-3 px-4 py-3"
							style={{
								borderBottom: '1px solid var(--place-border-subtle)',
							}}
						>
							<SearchIcon
								size={18}
								style={{ color: 'var(--place-text-secondary)', flexShrink: 0 }}
							/>
							<input
								ref={inputRef}
								type="text"
								value={query}
								onChange={(e) => handleQueryChange(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Search everything..."
								className="flex-1"
								style={{
									background: 'transparent',
									border: 'none',
									outline: 'none',
									fontSize: '1rem',
									color: 'var(--place-text-primary)',
									caretColor: 'var(--place-primary-400)',
								}}
							/>
							<kbd
								style={{
									fontSize: '0.6rem',
									color: 'var(--place-text-muted)',
									background: 'rgba(255,255,255,0.06)',
									padding: '2px 6px',
									borderRadius: '4px',
									border: '1px solid var(--place-border-subtle)',
								}}
							>
								ESC
							</kbd>
						</div>

						{/* Results */}
						<TelescopeResults
							query={query}
							groups={groups}
							flatResults={flatResults}
							selectedIndex={selectedIndex}
							setSelectedIndex={setSelectedIndex}
							activateResult={activateResult}
						/>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	if (typeof document === 'undefined') return null;
	return createPortal(modal, document.body);
}

// ── Results list (extracted for size) ──

function TelescopeResults({
	query,
	groups,
	flatResults,
	selectedIndex,
	setSelectedIndex,
	activateResult,
}: {
	readonly query: string;
	readonly groups: readonly GroupedResults[];
	readonly flatResults: ReadonlyArray<{
		result: SearchResult;
		appId: string;
		appIcon: React.ReactNode;
	}>;
	readonly selectedIndex: number;
	readonly setSelectedIndex: (idx: number) => void;
	readonly activateResult: (appId: string, resultId?: string) => void;
}) {
	if (!query.trim()) return null;

	if (flatResults.length === 0) {
		return (
			<div
				className="flex items-center justify-center py-8"
				style={{
					fontSize: '0.8rem',
					color: 'var(--place-text-secondary)',
				}}
			>
				No results for &apos;{query}&apos;
			</div>
		);
	}

	let globalIdx = 0;

	return (
		<div
			className="overflow-y-auto py-2"
			style={{ maxHeight: 'calc(60vh - 56px)' }}
		>
			{groups.map((group) => {
				const startIdx = globalIdx;
				const items = group.results.map((result, localIdx) => {
					const thisIdx = startIdx + localIdx;
					const row = (
						<TelescopeResult
							key={result.id}
							result={result}
							appIcon={group.appIcon}
							selected={selectedIndex === thisIdx}
							onSelect={() => activateResult(group.appId)}
							onHover={() => setSelectedIndex(thisIdx)}
						/>
					);
					return row;
				});
				globalIdx += group.results.length;

				return (
					<div key={group.appId}>
						<div
							className="px-4 pt-2 pb-1"
							style={{
								fontSize: '0.6rem',
								fontWeight: 600,
								color: 'var(--place-text-tertiary)',
								textTransform: 'uppercase',
								letterSpacing: '0.06em',
							}}
						>
							{group.appName}
						</div>
						{items}
					</div>
				);
			})}
		</div>
	);
}
