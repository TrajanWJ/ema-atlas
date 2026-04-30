'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { userKey } from '@/src/lib/user-storage';
import { useWindowStore } from '@/src/stores/window-store';
import { useStickyStore } from '@/src/stores/sticky-store';
import { useVirtualDesktopStore } from '@/src/stores/virtual-desktop-store';
import { useFileStore } from '@/src/stores/file-store';
import { useClipboardStore } from '@/src/stores/clipboard-store';
import { formatFileSize, getFileTypeLabel, isImageMime } from '@/src/lib/file-utils';
import {
	BrainIcon,
	JournalIcon,
	TargetIcon,
	CheckIcon,
	RepeatIcon,
	TerminalIcon,
	MusicIcon,
	SettingsIcon,
	InfoIcon,
	UserIcon,
	NotesIcon,
	FluxIcon,
	TimeBlockerIcon,
	ZapIcon,
	MonitorIcon,
	FinderIcon,
	PipesIcon,
	PhotosIcon,
	DocumentIcon,
	FolderIcon,
	CanvasIcon,
	RssIcon,
	ChartIcon,
	HomeIcon,
} from '@/src/components/icons';
import type { AppId } from '@/src/types/window';
import type { FileRow } from '@/src/db/queries/files';
import { APP_LABELS } from '@/src/lib/constants';
import { DesktopIcon } from './DesktopIcon';
import { DesktopIconContextMenu } from './DesktopIconContextMenu';

// ── Types ──

export interface IconData {
	readonly id: string;
	readonly appId: AppId | 'folder';
	readonly label: string;
	readonly description: string;
	readonly icon: React.ReactNode;
	readonly type?: 'app' | 'folder';
	readonly children?: readonly string[];
	x: number;
	y: number;
}

const GRID = 90;
const SNAP_THRESHOLD = 12;
const DRAG_THRESHOLD = 4;
const FOLDER_MERGE_DISTANCE = 40;
const STORAGE_KEY = 'place-desktop-icon-positions';
const FOLDER_STORAGE_KEY = 'place-desktop-folders';

export function maybeSnap(v: number): number {
	const nearest = Math.round(v / GRID) * GRID;
	return Math.abs(v - nearest) <= SNAP_THRESHOLD ? nearest : v;
}

// ── Persistence ──

function loadPositions(): Record<string, { x: number; y: number }> {
	try {
		const raw = localStorage.getItem(userKey(STORAGE_KEY));
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function savePositions(icons: readonly IconData[]): void {
	const positions: Record<string, { x: number; y: number }> = {};
	for (const icon of icons) {
		positions[icon.id] = { x: icon.x, y: icon.y };
	}
	try {
		localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(positions));
	} catch { /* quota */ }
}

interface FolderRecord {
	readonly id: string;
	readonly label: string;
	readonly children: readonly string[];
	readonly x: number;
	readonly y: number;
}

function loadFolders(): FolderRecord[] {
	try {
		const raw = localStorage.getItem(userKey(FOLDER_STORAGE_KEY));
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveFolders(icons: readonly IconData[]): void {
	const folders: FolderRecord[] = icons
		.filter((i) => i.type === 'folder')
		.map((i) => ({
			id: i.id,
			label: i.label,
			children: i.children ?? [],
			x: i.x,
			y: i.y,
		}));
	try {
		localStorage.setItem(userKey(FOLDER_STORAGE_KEY), JSON.stringify(folders));
	} catch { /* quota */ }
}

const APP_ICON_MAP: Record<AppId, React.ReactNode> = {
	'brain-dump': <BrainIcon size={24} />,
	tasks: <CheckIcon size={24} />,
	journal: <JournalIcon size={24} />,
	habits: <RepeatIcon size={24} />,
	notes: <NotesIcon size={24} />,
	focus: <TargetIcon size={24} />,
	terminal: <TerminalIcon size={24} />,
	music: <MusicIcon size={24} />,
	calculator: <ZapIcon size={24} />,
	clock: <TimeBlockerIcon size={24} />,
	settings: <SettingsIcon size={24} />,
	calendar: <FluxIcon size={24} />,
	'about-place': <InfoIcon size={24} />,
	'about-trajan': <UserIcon size={24} />,
	'system-monitor': <MonitorIcon size={24} />,
	finder: <FinderIcon size={24} />,
	photos: <PhotosIcon size={24} />,
	pipes: <PipesIcon size={24} />,
	documents: <DocumentIcon size={24} />,
	canvas: <CanvasIcon size={24} />,
	rss: <RssIcon size={24} />,
	projects: <CheckIcon size={24} />,
	responsibilities: <TargetIcon size={24} />,
	ideas: <ZapIcon size={24} />,
	loops: <RepeatIcon size={24} />,
	stuck: <BrainIcon size={24} />,
	avoiding: <BrainIcon size={24} />,
	decisions: <CheckIcon size={24} />,
	learning: <InfoIcon size={24} />,
	questions: <InfoIcon size={24} />,
	contacts: <UserIcon size={24} />,
	plate: <TargetIcon size={24} />,
	rewind: <RepeatIcon size={24} />,
	blueprint: <DocumentIcon size={24} />,
	// EMA additions
	hq: <ChartIcon size={24} />,
	"git-ema": <FolderIcon size={24} />,
	"agent-work": <TargetIcon size={24} />,
	chronicle: <ZapIcon size={24} />,
	launchpad: <HomeIcon size={24} />,
	wiki: <NotesIcon size={24} />,
	threads: <BrainIcon size={24} />,
	"place-tools": <FolderIcon size={24} />,
};

const APP_DESCRIPTIONS: Record<AppId, string> = {
	'brain-dump': 'Quick-capture inbox for thoughts and ideas',
	tasks: 'Priority-based task manager',
	journal: 'Daily markdown journal with mood tracking',
	habits: 'Track daily habits with streaks',
	notes: 'Markdown notes with search and autosave',
	focus: 'Pomodoro timer with ambient sounds',
	terminal: 'Built-in command line',
	music: 'Lo-fi radio and ambient sounds',
	calculator: 'Quick calculations',
	clock: 'World clocks and time zones',
	settings: 'System preferences',
	calendar: 'Calendar and scheduling',
	'about-place': 'How this browser OS works',
	'about-trajan': 'The person behind the projects',
	'system-monitor': 'CPU, memory, and process stats',
	finder: 'Browse files across all apps',
	photos: 'Photo gallery with lightbox viewer',
	pipes: 'Visual node-based workflows',
	documents: 'View and manage documents',
	canvas: 'Infinite whiteboard and drawing canvas',
	rss: 'RSS feed reader with multiple sources',
	projects: 'Group tasks, notes, and captures by project',
	responsibilities: 'Areas of ongoing accountability',
	ideas: 'Ideas bucket — captures not yet tasks',
	loops: 'Open loops taking mental space',
	stuck: 'What am I stuck on right now',
	avoiding: 'Honesty-first: what I am avoiding',
	decisions: 'Lightweight decision log with why + outcome',
	learning: 'What did I learn today',
	questions: 'Open questions I do not yet have answers to',
	contacts: 'People I talked to and when',
	plate: 'Everything currently on your plate, visualized',
	rewind: 'Auto-drafted weekly review',
	blueprint: 'EMA Blueprint — sections, GAC cards, decisions, intent graph',
	// EMA additions
	hq: 'EMA · operations control room',
	"git-ema": 'Connectors, repos, attachments — daemon-owned',
	"agent-work": 'Lanes, missions, queues, vcalendar',
	chronicle: 'Daemon event stream, sessions, and replay',
	launchpad: 'Start surface — open a project, switch a space',
	wiki: 'Durable doctrine, notes, reference memory',
	threads: 'Project chat — coordination stream with the team',
	"place-tools": 'place.org personal-productivity surfaces',
};

/** Grid layout: fill columns top-to-bottom, then move right */
const DESKTOP_APP_ORDER: readonly AppId[] = [
	// Column 1 — core EF
	'brain-dump', 'tasks', 'projects', 'responsibilities',
	// Column 2 — trackers
	'loops', 'stuck', 'avoiding', 'ideas',
	// Column 3 — reflective
	'journal', 'habits', 'notes', 'learning',
	// Column 4 — meta
	'decisions', 'questions', 'contacts', 'plate',
	// Column 5 — time / utilities
	'rewind', 'focus', 'terminal', 'music',
	// Column 6 — system
	'calculator', 'clock', 'settings', 'calendar',
	// Column 7 — system+info
	'system-monitor', 'finder', 'pipes', 'about-place',
	// Column 8 — overflow
	'about-trajan', 'rss',
];

const COLUMN_HEIGHT = 4; // icons per column before wrapping
const GRID_START_X = 20;
const GRID_START_Y = 60;

function makeDefaultIcons(saved: Record<string, { x: number; y: number }>): IconData[] {
	return DESKTOP_APP_ORDER.map((appId, index) => {
		const col = Math.floor(index / COLUMN_HEIGHT);
		const row = index % COLUMN_HEIGHT;
		const defaultX = GRID_START_X + col * GRID;
		const defaultY = GRID_START_Y + row * GRID;

		return {
			id: appId,
			appId,
			label: APP_LABELS[appId],
			description: APP_DESCRIPTIONS[appId],
			icon: APP_ICON_MAP[appId],
			type: 'app' as const,
			x: saved[appId]?.x ?? defaultX,
			y: saved[appId]?.y ?? defaultY,
		};
	});
}

function makeIcons(): IconData[] {
	const saved = loadPositions();
	const defaults = makeDefaultIcons(saved);
	const folders = loadFolders();

	// Collect IDs that are inside folders
	const folderChildIds = new Set(folders.flatMap((f) => f.children));

	// Filter out default icons that are inside a folder
	const visibleDefaults = defaults.filter((d) => !folderChildIds.has(d.id));

	// Add folder icons
	const folderIcons: IconData[] = folders.map((f) => ({
		id: f.id,
		appId: 'folder' as const,
		label: f.label,
		description: `Folder with ${f.children.length} items`,
		icon: <FolderIcon size={24} />,
		type: 'folder' as const,
		children: f.children,
		x: saved[f.id]?.x ?? f.x,
		y: saved[f.id]?.y ?? f.y,
	}));

	return [...visibleDefaults, ...folderIcons];
}

// ── File icon helpers ──

const SVG_PROPS = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const DOC_BASE = <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></>;

function FileTypeIcon({ mimeType }: { readonly mimeType: string }) {
	if (isImageMime(mimeType)) {
		return <svg {...SVG_PROPS}><rect x={3} y={3} width={18} height={18} rx={2} /><circle cx={8.5} cy={8.5} r={1.5} /><path d="m21 15-5-5L5 21" /></svg>;
	}
	if (mimeType.startsWith('text/') || mimeType === 'application/pdf') {
		return <svg {...SVG_PROPS}>{DOC_BASE}<path d="M16 13H8M16 17H8M10 9H8" /></svg>;
	}
	return <svg {...SVG_PROPS}>{DOC_BASE}</svg>;
}

function fileRowToIcon(
	file: FileRow,
	index: number,
	appIconCount: number,
	saved: Record<string, { x: number; y: number }>,
): IconData {
	const id = `file-${file.id}`;
	const totalIndex = appIconCount + index;
	const col = Math.floor(totalIndex / COLUMN_HEIGHT);
	const row = totalIndex % COLUMN_HEIGHT;
	return {
		id,
		appId: 'finder' as AppId,
		label: file.filename,
		description: `${formatFileSize(file.sizeBytes)} \u00B7 ${getFileTypeLabel(file.mimeType)}`,
		icon: <FileTypeIcon mimeType={file.mimeType} />,
		type: 'app',
		x: saved[id]?.x ?? GRID_START_X + col * GRID,
		y: saved[id]?.y ?? GRID_START_Y + row * GRID,
	};
}

// ── File context menu ──

function FileContextMenu({
	x,
	y,
	onClose,
	onDownload,
	onRename,
	onDelete,
	onOpenFinder,
}: {
	readonly x: number;
	readonly y: number;
	readonly onClose: () => void;
	readonly onDownload: () => void;
	readonly onRename: () => void;
	readonly onDelete: () => void;
	readonly onOpenFinder: () => void;
}) {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
		};
		const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		document.addEventListener('pointerdown', handler);
		document.addEventListener('keydown', esc);
		return () => {
			document.removeEventListener('pointerdown', handler);
			document.removeEventListener('keydown', esc);
		};
	}, [onClose]);

	const items = [
		{ label: 'Download', action: onDownload, danger: false },
		{ label: 'Rename', action: onRename, danger: false },
		{ label: 'Open in Finder', action: onOpenFinder, danger: false },
		{ label: 'Delete', action: onDelete, danger: true },
	];

	return (
		<div
			ref={menuRef}
			style={{
				position: 'fixed',
				left: Math.min(x, window.innerWidth - 160),
				top: Math.min(y, window.innerHeight - 160),
				width: '150px',
				background: 'var(--place-base)',
				border: '1px solid var(--place-border-strong)',
				borderRadius: '8px',
				padding: '0.25rem 0',
				zIndex: 200,
				boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
			}}
		>
			{items.map((item) => (
				<button
					key={item.label}
					type="button"
					onClick={item.action}
					style={{
						display: 'block',
						width: '100%',
						padding: '0.4rem 0.75rem',
						fontSize: '0.75rem',
						border: 'none',
						background: 'transparent',
						color: item.danger ? 'var(--place-error)' : 'var(--place-text-primary)',
						cursor: 'pointer',
						textAlign: 'left',
					}}
					onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
					onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
				>
					{item.label}
				</button>
			))}
		</div>
	);
}

// ── Desktop Shortcuts ──

export function DesktopShortcuts() {
	const openWindow = useWindowStore((s) => s.openWindow);
	const addNote = useStickyStore((s) => s.addNote);
	const addDesktop = useVirtualDesktopStore((s) => s.addDesktop);
	const desktopCount = useVirtualDesktopStore((s) => s.desktops.length);
	const fileStoreFiles = useFileStore((s) => s.files);
	const [icons, setIcons] = useState<IconData[]>(makeIcons);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [selectRect, setSelectRect] = useState<{
		x: number; y: number; w: number; h: number;
	} | null>(null);
	const [snapGhosts, setSnapGhosts] = useState<
		ReadonlyArray<{ id: string; x: number; y: number }>
	>([]);
	const [draggingIds, setDraggingIds] = useState<Set<string>>(new Set());
	const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
	const [contextMenu, setContextMenu] = useState<{
		x: number; y: number;
	} | null>(null);

	const dragState = useRef<{
		iconId: string;
		startX: number;
		startY: number;
		origins: Map<string, { x: number; y: number }>;
		dragStarted: boolean;
	} | null>(null);

	const selectStart = useRef<{ x: number; y: number } | null>(null);
	const layerRef = useRef<HTMLDivElement>(null);

	// Double-click on icon opens app, expands folder, or downloads file
	const handleIconDoubleClick = useCallback(
		(icon: IconData) => {
			if (icon.type === 'folder') {
				setExpandedFolder((prev) => (prev === icon.id ? null : icon.id));
			} else if (icon.id.startsWith('file-')) {
				useFileStore.getState().download(icon.id.slice(5));
			} else if (icon.appId !== 'folder') {
				openWindow(icon.appId);
			}
		},
		[openWindow],
	);

	// Double-click on empty area creates sticky
	const handleBgDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target.closest('[data-icon]')) return;
			addNote(e.clientX - 100, e.clientY - 75);
		},
		[addNote],
	);

	// Right-click context menu (desktop bg or file icons)
	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		const target = e.target as HTMLElement;
		const iconEl = target.closest('[data-icon]') as HTMLElement | null;

		if (iconEl) {
			// Use data-icon-id attribute for reliable icon identification
			const iconId = (iconEl as HTMLElement).dataset.iconId;
			if (iconId && iconId.startsWith('file-')) {
				// File icon — show file context menu
				setFileContextMenu({
					x: e.clientX,
					y: e.clientY,
					fileId: iconId.slice(5),
					iconId,
				});
				return;
			}
			// App or folder icon — show the standard desktop context menu
		}

		// Empty desktop background or app icon — show desktop menu
		setContextMenu({ x: e.clientX, y: e.clientY });
	}, []);

	const closeContextMenu = useCallback(() => setContextMenu(null), []);

	const handleNewFolder = useCallback(() => {
		if (!contextMenu) return;
		const folderId = `folder-${Date.now()}`;
		const newFolder: IconData = {
			id: folderId,
			appId: 'folder',
			label: 'New Folder',
			description: 'Empty folder',
			icon: <FolderIcon size={24} />,
			type: 'folder',
			children: [],
			x: contextMenu.x - 36,
			y: contextMenu.y - 36,
		};
		setIcons((prev) => {
			const next = [...prev, newFolder];
			savePositions(next);
			saveFolders(next);
			return next;
		});
		closeContextMenu();
	}, [contextMenu, closeContextMenu]);

	const handleNewSticky = useCallback(() => {
		if (!contextMenu) return;
		addNote(contextMenu.x - 100, contextMenu.y - 75);
		closeContextMenu();
	}, [contextMenu, addNote, closeContextMenu]);

	const handleChangeWallpaper = useCallback(() => {
		openWindow('settings');
		closeContextMenu();
	}, [openWindow, closeContextMenu]);

	const handleAddDesktop = useCallback(() => {
		addDesktop();
		closeContextMenu();
	}, [addDesktop, closeContextMenu]);

	// ── Icon drag ──

	const handleIconPointerDown = useCallback(
		(e: React.PointerEvent, iconId: string) => {
			e.stopPropagation();
			e.preventDefault();
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

			if (e.shiftKey) {
				setSelected((prev) => {
					const next = new Set(prev);
					next.has(iconId) ? next.delete(iconId) : next.add(iconId);
					return next;
				});
			} else if (!selected.has(iconId)) {
				setSelected(new Set([iconId]));
			}

			const dragging = selected.has(iconId) ? selected : new Set([iconId]);
			const origins = new Map<string, { x: number; y: number }>();
			for (const icon of icons) {
				if (dragging.has(icon.id)) {
					origins.set(icon.id, { x: icon.x, y: icon.y });
				}
			}

			dragState.current = {
				iconId,
				startX: e.clientX,
				startY: e.clientY,
				origins,
				dragStarted: false,
			};
		},
		[icons, selected],
	);

	const handleIconPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!dragState.current) return;
			const dx = e.clientX - dragState.current.startX;
			const dy = e.clientY - dragState.current.startY;

			// Drag threshold — don't start until 4px movement
			if (!dragState.current.dragStarted) {
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < DRAG_THRESHOLD) return;
				dragState.current.dragStarted = true;
				setDraggingIds(new Set(dragState.current.origins.keys()));
			}

			// Compute snap ghosts OUTSIDE setIcons
			const ghosts: Array<{ id: string; x: number; y: number }> = [];
			for (const [id, origin] of dragState.current.origins) {
				const nx = origin.x + dx;
				const ny = origin.y + dy;
				const sx = maybeSnap(nx);
				const sy = maybeSnap(ny);
				if (sx !== nx || sy !== ny) {
					ghosts.push({ id, x: sx, y: sy });
				}
			}
			setSnapGhosts(ghosts);

			setIcons((prev) =>
				prev.map((icon) => {
					const origin = dragState.current?.origins.get(icon.id);
					if (!origin) return icon;
					return { ...icon, x: origin.x + dx, y: origin.y + dy };
				}),
			);
		},
		[],
	);

	const handleIconPointerUp = useCallback(() => {
		if (!dragState.current) return;
		const wasDragging = dragState.current.dragStarted;

		if (wasDragging) {
			setIcons((prev) => {
				const result = mergeOverlappingIcons(prev, dragState.current);
				savePositions(result);
				saveFolders(result);
				return result;
			});
		}

		dragState.current = null;
		setSnapGhosts([]);
		setDraggingIds(new Set());
	}, []);

	// ── Rectangle select ──

	const handleBgPointerDown = useCallback((e: React.PointerEvent) => {
		if (e.button !== 0) return;
		const target = e.target as HTMLElement;
		if (target.closest('[data-icon]')) return;

		if (!e.shiftKey) setSelected(new Set());

		const rect = layerRef.current?.getBoundingClientRect();
		if (!rect) return;
		selectStart.current = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}, []);

	const handleBgPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!selectStart.current) return;
			const rect = layerRef.current?.getBoundingClientRect();
			if (!rect) return;
			const cx = e.clientX - rect.left;
			const cy = e.clientY - rect.top;
			const x = Math.min(selectStart.current.x, cx);
			const y = Math.min(selectStart.current.y, cy);
			const w = Math.abs(cx - selectStart.current.x);
			const h = Math.abs(cy - selectStart.current.y);
			setSelectRect({ x, y, w, h });

			const newSelected = new Set<string>();
			for (const icon of icons) {
				const ix = icon.x + 36;
				const iy = icon.y + 36;
				if (ix >= x && ix <= x + w && iy >= y && iy <= y + h) {
					newSelected.add(icon.id);
				}
			}
			setSelected(newSelected);
		},
		[icons],
	);

	const handleBgPointerUp = useCallback(() => {
		selectStart.current = null;
		setSelectRect(null);
	}, []);

	// Load desktop files on mount
	useEffect(() => {
		void useFileStore.getState().loadFiles('desktop');
	}, []);

	// Sync file icons when fileStoreFiles changes
	useEffect(() => {
		setIcons((prev) => {
			const withoutFiles = prev.filter((i) => !i.id.startsWith('file-'));
			const saved = loadPositions();
			const fileIcons = fileStoreFiles
				.filter((f) => f.folderId === 'desktop')
				.map((f, i) => fileRowToIcon(f, i, withoutFiles.length, saved));
			const next = [...withoutFiles, ...fileIcons];
			savePositions(next);
			return next;
		});
	}, [fileStoreFiles]);

	// Close expanded folder on outside click
	useEffect(() => {
		if (!expandedFolder) return;
		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest('[data-folder-expanded]')) {
				setExpandedFolder(null);
			}
		};
		document.addEventListener('pointerdown', handleClick);
		return () => document.removeEventListener('pointerdown', handleClick);
	}, [expandedFolder]);

	// Ctrl+V → paste clipboard files onto desktop
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
			if (e.key.toLowerCase() !== 'v') return;

			// Skip if target is an input or inside a window
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
			if (target.closest('[data-window]')) return;

			const clipboard = useClipboardStore.getState();
			if (clipboard.entries.length === 0) return;

			e.preventDefault();
			void clipboard.paste('desktop').then(() => {
				void useFileStore.getState().loadFiles('desktop');
			});
		};

		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

	// Native file drop → upload to desktop folder
	const handleNativeDragOver = useCallback((e: React.DragEvent) => {
		if (e.dataTransfer.types.includes('Files')) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		}
	}, []);

	const handleNativeDrop = useCallback((e: React.DragEvent) => {
		if (!e.dataTransfer.files.length) return;
		e.preventDefault();
		const files = Array.from(e.dataTransfer.files);
		const store = useFileStore.getState();
		void Promise.all(files.map((f) => store.upload(f, 'desktop'))).then(() => {
			void store.loadFiles('desktop');
		});
	}, []);

	// File-icon context menu state
	const [fileContextMenu, setFileContextMenu] = useState<{
		x: number; y: number; fileId: string; iconId: string;
	} | null>(null);

	const handleFileDownload = useCallback(() => {
		if (!fileContextMenu) return;
		useFileStore.getState().download(fileContextMenu.fileId);
		setFileContextMenu(null);
	}, [fileContextMenu]);

	const handleFileRename = useCallback(() => {
		if (!fileContextMenu) return;
		const name = window.prompt('Rename file:');
		if (name) {
			void useFileStore.getState().renameFile(fileContextMenu.fileId, name).then(() => {
				void useFileStore.getState().loadFiles('desktop');
			});
		}
		setFileContextMenu(null);
	}, [fileContextMenu]);

	const handleFileDelete = useCallback(() => {
		if (!fileContextMenu) return;
		void useFileStore.getState().deleteFile(fileContextMenu.fileId).then(() => {
			void useFileStore.getState().loadFiles('desktop');
		});
		setFileContextMenu(null);
	}, [fileContextMenu]);

	const handleFileOpenFinder = useCallback(() => {
		openWindow('finder');
		setFileContextMenu(null);
	}, [openWindow]);

	// Find expanded folder data
	const expandedFolderData = expandedFolder
		? icons.find((i) => i.id === expandedFolder)
		: null;

	return (
		<div
			ref={layerRef}
			aria-label="Desktop shortcuts"
			onPointerDown={handleBgPointerDown}
			onPointerMove={handleBgPointerMove}
			onPointerUp={handleBgPointerUp}
			onDoubleClick={handleBgDoubleClick}
			onContextMenu={handleContextMenu}
			onDragOver={handleNativeDragOver}
			onDrop={handleNativeDrop}
			style={{
				position: 'absolute',
				inset: 0,
				zIndex: 5,
			}}
		>
			{icons.map((icon) => (
				<DesktopIcon
					key={icon.id}
					icon={icon}
					isSelected={selected.has(icon.id)}
					isDragging={draggingIds.has(icon.id)}
					onPointerDown={(e) => handleIconPointerDown(e, icon.id)}
					onPointerMove={handleIconPointerMove}
					onPointerUp={handleIconPointerUp}
					onDoubleClick={() => handleIconDoubleClick(icon)}
				/>
			))}

			{/* Snap ghost previews */}
			{snapGhosts.map((g) => (
				<div
					key={`ghost-${g.id}`}
					style={{
						position: 'absolute',
						left: g.x,
						top: g.y,
						width: 72,
						height: 82,
						borderRadius: 10,
						border: '1px dashed rgba(45, 212, 168, 0.3)',
						background: 'rgba(45, 212, 168, 0.04)',
						pointerEvents: 'none',
						transition: 'left 0.08s ease, top 0.08s ease',
					}}
				/>
			))}

			{/* Selection rectangle */}
			{selectRect && selectRect.w > 4 && selectRect.h > 4 && (
				<div
					style={{
						position: 'absolute',
						left: selectRect.x,
						top: selectRect.y,
						width: selectRect.w,
						height: selectRect.h,
						border: '1px solid rgba(45, 212, 168, 0.4)',
						background: 'rgba(45, 212, 168, 0.06)',
						borderRadius: 2,
						pointerEvents: 'none',
					}}
				/>
			)}

			{/* Expanded folder dropdown */}
			{expandedFolderData && (
				<FolderExpanded
					folder={expandedFolderData}
					allIcons={makeDefaultIcons(loadPositions())}
					onOpenApp={(appId) => {
						if (appId !== 'folder') openWindow(appId);
					}}
				/>
			)}

			{/* Desktop context menu */}
			{contextMenu && (
				<DesktopIconContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					onClose={closeContextMenu}
					onNewFolder={handleNewFolder}
					onNewSticky={handleNewSticky}
					onChangeWallpaper={handleChangeWallpaper}
					onAddDesktop={desktopCount < 8 ? handleAddDesktop : undefined}
				/>
			)}

			{/* File icon context menu */}
			{fileContextMenu && (
				<FileContextMenu
					x={fileContextMenu.x}
					y={fileContextMenu.y}
					onClose={() => setFileContextMenu(null)}
					onDownload={handleFileDownload}
					onRename={handleFileRename}
					onDelete={handleFileDelete}
					onOpenFinder={handleFileOpenFinder}
				/>
			)}
		</div>
	);
}

// ── Folder overlap detection and merge ──

function mergeOverlappingIcons(
	icons: IconData[],
	drag: {
		iconId: string;
		origins: Map<string, { x: number; y: number }>;
	} | null,
): IconData[] {
	if (!drag) return snapAll(icons);

	const draggedIds = new Set(drag.origins.keys());
	if (draggedIds.size !== 1) return snapAll(icons);

	const draggedId = [...draggedIds][0];
	const dragged = icons.find((i) => i.id === draggedId);
	if (!dragged) return snapAll(icons);

	const dragCx = dragged.x + 36;
	const dragCy = dragged.y + 41;

	// Find a non-dragged icon that overlaps
	const target = icons.find((i) => {
		if (i.id === draggedId) return false;
		const cx = i.x + 36;
		const cy = i.y + 41;
		const dist = Math.sqrt((dragCx - cx) ** 2 + (dragCy - cy) ** 2);
		return dist < FOLDER_MERGE_DISTANCE;
	});

	if (!target) return snapAll(icons);

	// Merge into folder
	if (target.type === 'folder') {
		return snapAll(mergeIntoExistingFolder(icons, target, dragged));
	}
	return snapAll(createNewFolder(icons, target, dragged));
}

function mergeIntoExistingFolder(
	icons: IconData[],
	folder: IconData,
	dragged: IconData,
): IconData[] {
	return icons
		.filter((i) => i.id !== dragged.id)
		.map((i) => {
			if (i.id !== folder.id) return i;
			const children = [...(i.children ?? []), dragged.id];
			return {
				...i,
				children,
				description: `Folder with ${children.length} items`,
			};
		});
}

function createNewFolder(
	icons: IconData[],
	target: IconData,
	dragged: IconData,
): IconData[] {
	const folderId = `folder-${Date.now()}`;
	const folder: IconData = {
		id: folderId,
		appId: 'folder',
		label: 'New Folder',
		description: 'Folder with 2 items',
		icon: <FolderIcon size={24} />,
		type: 'folder',
		children: [target.id, dragged.id],
		x: target.x,
		y: target.y,
	};
	return icons
		.filter((i) => i.id !== target.id && i.id !== dragged.id)
		.concat(folder);
}

function snapAll(icons: IconData[]): IconData[] {
	return icons.map((icon) => ({
		...icon,
		x: maybeSnap(icon.x),
		y: maybeSnap(icon.y),
	}));
}

// ── Folder expanded view ──

function FolderExpanded({
	folder,
	allIcons,
	onOpenApp,
}: {
	readonly folder: IconData;
	readonly allIcons: IconData[];
	readonly onOpenApp: (appId: AppId | 'folder') => void;
}) {
	const childIcons = (folder.children ?? [])
		.map((cid) => allIcons.find((i) => i.id === cid))
		.filter(Boolean) as IconData[];

	return (
		<div
			data-folder-expanded
			style={{
				position: 'absolute',
				left: folder.x,
				top: folder.y + 90,
				minWidth: 160,
				padding: 8,
				borderRadius: 10,
				background: 'rgba(20, 20, 30, 0.9)',
				border: '1px solid rgba(255,255,255,0.1)',
				backdropFilter: 'blur(20px)',
				zIndex: 200,
			}}
		>
			{childIcons.length === 0 && (
				<div style={{
					color: 'var(--place-text-secondary)',
					fontSize: 11,
					padding: '4px 8px',
				}}>
					Empty folder
				</div>
			)}
			{childIcons.map((child) => (
				<button
					key={child.id}
					type="button"
					onClick={() => onOpenApp(child.appId)}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						width: '100%',
						padding: '6px 8px',
						borderRadius: 6,
						border: 'none',
						background: 'transparent',
						color: 'var(--place-text-primary, #fff)',
						fontSize: 12,
						cursor: 'default',
						textAlign: 'left',
					}}
					onMouseEnter={(e) => {
						(e.currentTarget).style.background = 'rgba(255,255,255,0.08)';
					}}
					onMouseLeave={(e) => {
						(e.currentTarget).style.background = 'transparent';
					}}
				>
					<span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						{child.icon}
					</span>
					<span>{child.label}</span>
				</button>
			))}
		</div>
	);
}
