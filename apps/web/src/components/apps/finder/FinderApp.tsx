'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinderStore } from '@/src/stores/finder-store';
import type { VirtualFolder } from '@/src/stores/finder-store';
import type { FileEntry, FileContent } from '@/src/lib/app-registry';
import { getAllApps } from '@/src/lib/app-registry';
import { useWindowStore } from '@/src/stores/window-store';
import { useFileStore } from '@/src/stores/file-store';
import { useClipboardStore } from '@/src/stores/clipboard-store';
import { getDownloadUrl, isImageMime, formatFileSize } from '@/src/lib/file-utils';
import { createId } from '@/src/lib/id';
import type { AppId } from '@/src/types/window';

// ----------------------------------------------------------------------------
// Tab types
// ----------------------------------------------------------------------------

interface FinderTab {
	readonly id: string;
	readonly folderId: string;
	readonly label: string;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function formatDate(ts: number): string {
	if (!ts) return '';
	return new Date(ts).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});
}

function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max)}...`;
}

// ----------------------------------------------------------------------------
// Sidebar folder tree
// ----------------------------------------------------------------------------

function FolderItem({
	folder,
	depth,
	isSelected,
	hasChildren,
	isExpanded,
	onSelect,
	onToggle,
}: {
	readonly folder: VirtualFolder;
	readonly depth: number;
	readonly isSelected: boolean;
	readonly hasChildren: boolean;
	readonly isExpanded: boolean;
	readonly onSelect: (id: string) => void;
	readonly onToggle: (id: string) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onSelect(folder.id)}
			onDoubleClick={() => onToggle(folder.id)}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '0.35rem',
				width: '100%',
				padding: `0.3rem 0.5rem 0.3rem ${0.5 + depth * 0.75}rem`,
				fontSize: '0.75rem',
				border: 'none',
				background: isSelected ? 'var(--place-secondary-subtle)' : 'transparent',
				color: isSelected ? 'var(--place-secondary-400)' : 'var(--place-text-secondary)',
				cursor: 'pointer',
				textAlign: 'left',
			}}
		>
			{hasChildren && (
				<span
					onClick={(e) => {
						e.stopPropagation();
						onToggle(folder.id);
					}}
					onKeyDown={() => {}}
					role="button"
					tabIndex={-1}
					style={{
						fontSize: '0.55rem',
						width: '0.75rem',
						textAlign: 'center',
						flexShrink: 0,
						cursor: 'pointer',
						color: 'var(--place-text-secondary)',
						transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
						transition: 'transform 0.15s',
					}}
				>
					&#9654;
				</span>
			)}
			{!hasChildren && <span style={{ width: '0.75rem', flexShrink: 0 }} />}
			<span style={{ flexShrink: 0 }}>{folder.icon}</span>
			<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
				{folder.name}
			</span>
		</button>
	);
}

function FolderTree({
	selectedFolderId,
	onSelect,
}: {
	readonly selectedFolderId: string;
	readonly onSelect: (id: string) => void;
}) {
	const folders = useFinderStore((s) => s.folders);
	const getChildren = useFinderStore((s) => s.getChildren);
	const [expanded, setExpanded] = useState<Set<string>>(new Set(['home', 'apps']));

	const toggleExpand = useCallback((id: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const renderFolder = useCallback(
		(folder: VirtualFolder, depth: number): React.ReactNode => {
			const children = getChildren(folder.id);
			const hasChildren = children.length > 0;
			const isExpanded = expanded.has(folder.id);

			return (
				<div key={folder.id}>
					<FolderItem
						folder={folder}
						depth={depth}
						isSelected={selectedFolderId === folder.id}
						hasChildren={hasChildren}
						isExpanded={isExpanded}
						onSelect={onSelect}
						onToggle={toggleExpand}
					/>
					{hasChildren && isExpanded && children.map((child) => renderFolder(child, depth + 1))}
				</div>
			);
		},
		[expanded, selectedFolderId, onSelect, toggleExpand, getChildren],
	);

	const rootFolders = useMemo(() => folders.filter((f) => f.parentId === null), [folders]);

	return (
		<div
			style={{
				width: '170px',
				minWidth: '170px',
				borderRight: '1px solid var(--place-border-default)',
				overflowY: 'auto',
				padding: '0.5rem 0',
			}}
		>
			<div
				style={{
					padding: '0.25rem 0.5rem 0.5rem',
					fontSize: '0.65rem',
					fontWeight: 600,
					letterSpacing: '0.06em',
					textTransform: 'uppercase',
					color: 'var(--place-text-secondary)',
				}}
			>
				Finder
			</div>
			{rootFolders.map((folder) => renderFolder(folder, 0))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// FileRow
// ----------------------------------------------------------------------------

function FileRow({
	file,
	appName,
	isSelected,
	isCut,
	onClick,
	onContextMenu,
}: {
	readonly file: FileEntry;
	readonly appName: string;
	readonly isSelected: boolean;
	readonly isCut: boolean;
	readonly onClick: (e: React.MouseEvent) => void;
	readonly onContextMenu: (e: React.MouseEvent) => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			onContextMenu={onContextMenu}
			style={{
				display: 'grid',
				gridTemplateColumns: '1fr 60px 100px 70px',
				gap: '0.5rem',
				alignItems: 'center',
				width: '100%',
				padding: '0.4rem 0.75rem',
				fontSize: '0.75rem',
				border: 'none',
				background: isSelected ? 'var(--place-secondary-subtle)' : 'transparent',
				color: 'var(--place-text-primary)',
				cursor: 'pointer',
				textAlign: 'left',
				opacity: isCut ? 0.5 : 1,
			}}
		>
			<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
				{file.name}
			</span>
			<span style={{ color: 'var(--place-text-secondary)', fontSize: '0.7rem' }}>{file.type}</span>
			<span
				style={{
					color: 'var(--place-text-secondary)',
					fontSize: '0.7rem',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
				}}
			>
				{truncate(file.preview, 30)}
			</span>
			<span style={{ color: 'var(--place-text-secondary)', fontSize: '0.7rem', textAlign: 'right' }}>
				{formatDate(file.updatedAt)}
			</span>
		</button>
	);
}

// ----------------------------------------------------------------------------
// Detail Panel
// ----------------------------------------------------------------------------

function DetailPanel({
	content,
	appId,
	onClose,
}: {
	readonly content: FileContent;
	readonly appId: string;
	readonly onClose: () => void;
}) {
	const openWindow = useWindowStore((s) => s.openWindow);

	const handleOpenInApp = useCallback(() => {
		openWindow(appId as AppId);
	}, [openWindow, appId]);

	return (
		<motion.div
			initial={{ x: '100%' }}
			animate={{ x: 0 }}
			exit={{ x: '100%' }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			style={{
				position: 'absolute',
				top: 0,
				right: 0,
				bottom: 0,
				width: '280px',
				background: 'var(--place-base)',
				borderLeft: '1px solid var(--place-border-default)',
				display: 'flex',
				flexDirection: 'column',
				zIndex: 10,
			}}
		>
			<DetailPanelHeader name={content.entry.name} onClose={onClose} />
			<DetailPanelBody body={content.body} />
			<DetailPanelFooter entry={content.entry} onOpenInApp={handleOpenInApp} />
		</motion.div>
	);
}

function DetailPanelHeader({
	name,
	onClose,
}: {
	readonly name: string;
	readonly onClose: () => void;
}) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '0.75rem',
				borderBottom: '1px solid var(--place-border-default)',
			}}
		>
			<span
				style={{
					fontSize: '0.8rem',
					fontWeight: 600,
					color: 'var(--place-text-primary)',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
					flex: 1,
				}}
			>
				{name}
			</span>
			<button
				type="button"
				onClick={onClose}
				style={{
					border: 'none',
					background: 'transparent',
					color: 'var(--place-text-secondary)',
					cursor: 'pointer',
					fontSize: '1rem',
					padding: '0 0.25rem',
				}}
				aria-label="Close detail"
			>
				x
			</button>
		</div>
	);
}

function DetailPanelBody({ body }: { readonly body: string }) {
	return (
		<div
			style={{
				flex: 1,
				overflowY: 'auto',
				padding: '0.75rem',
				fontSize: '0.8rem',
				color: 'var(--place-text-secondary)',
				lineHeight: 1.6,
				whiteSpace: 'pre-wrap',
				wordBreak: 'break-word',
			}}
		>
			{body}
		</div>
	);
}

function DetailPanelFooter({
	entry,
	onOpenInApp,
}: {
	readonly entry: FileEntry;
	readonly onOpenInApp: () => void;
}) {
	return (
		<div style={{ padding: '0.75rem', borderTop: '1px solid var(--place-border-default)' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					fontSize: '0.7rem',
					color: 'var(--place-text-secondary)',
					marginBottom: '0.5rem',
				}}
			>
				<span>Type: {entry.type}</span>
				<span>{formatDate(entry.updatedAt)}</span>
			</div>
			<button
				type="button"
				onClick={onOpenInApp}
				style={{
					width: '100%',
					padding: '0.25rem 0.5rem',
					fontSize: '0.65rem',
					border: '1px solid var(--place-border-default)',
					borderRadius: '6px',
					background: 'transparent',
					color: 'var(--place-text-secondary)',
					cursor: 'pointer',
				}}
			>
				Open in App
			</button>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Search bar
// ----------------------------------------------------------------------------

function SearchBar({
	value,
	onChange,
}: {
	readonly value: string;
	readonly onChange: (v: string) => void;
}) {
	return (
		<div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--place-border-default)' }}>
			<input
				type="text"
				placeholder="Search files..."
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{
					width: '100%',
					padding: '0.35rem 0.5rem',
					fontSize: '0.75rem',
					border: '1px solid var(--place-border-default)',
					borderRadius: '6px',
					background: 'rgba(255,255,255,0.03)',
					color: 'var(--place-text-primary)',
					outline: 'none',
				}}
				aria-label="Search files"
			/>
		</div>
	);
}

// ----------------------------------------------------------------------------
// File list header
// ----------------------------------------------------------------------------

function FileListHeader() {
	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: '1fr 60px 100px 70px',
				gap: '0.5rem',
				padding: '0.35rem 0.75rem',
				fontSize: '0.65rem',
				fontWeight: 600,
				letterSpacing: '0.06em',
				textTransform: 'uppercase',
				color: 'var(--place-text-secondary)',
				borderBottom: '1px solid var(--place-border-default)',
			}}
		>
			<span>Name</span>
			<span>Type</span>
			<span>Preview</span>
			<span style={{ textAlign: 'right' }}>Date</span>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Breadcrumb
// ----------------------------------------------------------------------------

function Breadcrumb({
	folderId,
	onNavigate,
}: {
	readonly folderId: string;
	readonly onNavigate: (id: string) => void;
}) {
	const getFolderPath = useFinderStore((s) => s.getFolderPath);
	const path = getFolderPath(folderId);

	return (
		<div
			style={{
				padding: '0.35rem 0.75rem',
				fontSize: '0.7rem',
				color: 'var(--place-text-secondary)',
				display: 'flex',
				alignItems: 'center',
				gap: '0.25rem',
				borderBottom: '1px solid var(--place-border-default)',
			}}
		>
			{path.map((folder, i) => (
				<span key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
					{i > 0 && <span style={{ opacity: 0.5 }}>/</span>}
					<button
						type="button"
						onClick={() => onNavigate(folder.id)}
						style={{
							border: 'none',
							background: 'transparent',
							color: i === path.length - 1 ? 'var(--place-text-primary)' : 'var(--place-text-secondary)',
							cursor: 'pointer',
							fontSize: '0.7rem',
							padding: 0,
						}}
					>
						{folder.name}
					</button>
				</span>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Empty folder state
// ----------------------------------------------------------------------------

function EmptyFolderState({ folderName }: { readonly folderName: string }) {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '3rem 2rem',
				gap: '0.5rem',
			}}
		>
			<svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--place-text-ghost, rgba(255,255,255,0.15))" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
				<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
			</svg>
			<span style={{ fontSize: '0.8rem', color: 'var(--place-text-muted, rgba(255,255,255,0.25))' }}>
				{folderName} is empty
			</span>
		</div>
	);
}

// ----------------------------------------------------------------------------
// FinderApp
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Upload toolbar
// ----------------------------------------------------------------------------

function UploadBar({
	folderId,
	onUploadComplete,
}: {
	readonly folderId: string;
	readonly onUploadComplete: () => void;
}) {
	const upload = useFileStore((s) => s.upload);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);

	const handleFiles = useCallback(
		async (files: FileList | File[]) => {
			setUploading(true);
			try {
				for (const file of files) {
					await upload(file, folderId);
				}
				onUploadComplete();
			} catch (err) {
				console.error('[finder] upload failed:', err);
			} finally {
				setUploading(false);
			}
		},
		[upload, folderId, onUploadComplete],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				void handleFiles(e.target.files);
				e.target.value = '';
			}
		},
		[handleFiles],
	);

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '0.5rem',
				padding: '0.3rem 0.75rem',
				borderBottom: '1px solid var(--place-border-default)',
			}}
		>
			<input
				ref={fileInputRef}
				type="file"
				multiple
				onChange={handleInputChange}
				style={{ display: 'none' }}
			/>
			<button
				type="button"
				onClick={() => fileInputRef.current?.click()}
				disabled={uploading}
				style={{
					padding: '0.25rem 0.6rem',
					fontSize: '0.7rem',
					fontWeight: 600,
					border: '1px solid var(--place-border-strong)',
					borderRadius: '5px',
					background: 'rgba(255,255,255,0.04)',
					color: 'var(--place-text-secondary)',
					cursor: uploading ? 'wait' : 'pointer',
				}}
			>
				{uploading ? 'Uploading...' : 'Upload'}
			</button>
			<span style={{ fontSize: '0.65rem', color: 'var(--place-text-muted)' }}>
				or drag files here
			</span>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Clipboard indicator bar
// ----------------------------------------------------------------------------

function ClipboardBar({
	onPaste,
}: {
	readonly onPaste: () => void;
}) {
	const entries = useClipboardStore((s) => s.entries);
	const mode = useClipboardStore((s) => s.mode);
	const clear = useClipboardStore((s) => s.clear);

	if (entries.length === 0 || mode === null) return null;

	const label = mode === 'copy' ? 'copied' : 'cut';

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '0.5rem',
				padding: '0.25rem 0.75rem',
				borderBottom: '1px solid var(--place-border-default)',
				fontSize: '0.7rem',
				color: 'var(--place-text-secondary)',
			}}
		>
			<span>
				{entries.length} file{entries.length > 1 ? 's' : ''} {label}
			</span>
			<button
				type="button"
				onClick={onPaste}
				style={{
					padding: '0.2rem 0.5rem',
					fontSize: '0.65rem',
					fontWeight: 600,
					border: '1px solid var(--place-border-strong)',
					borderRadius: '5px',
					background: 'rgba(255,255,255,0.04)',
					color: 'var(--place-secondary-400)',
					cursor: 'pointer',
				}}
			>
				Paste Here
			</button>
			<button
				type="button"
				onClick={clear}
				style={{
					padding: '0.2rem 0.4rem',
					fontSize: '0.6rem',
					border: 'none',
					background: 'transparent',
					color: 'var(--place-text-muted)',
					cursor: 'pointer',
				}}
			>
				Clear
			</button>
		</div>
	);
}

// ----------------------------------------------------------------------------
// File context menu (right-click)
// ----------------------------------------------------------------------------

function FinderContextMenu({
	x,
	y,
	hasClipboard,
	onCopy,
	onCut,
	onPaste,
	onClose,
}: {
	readonly x: number;
	readonly y: number;
	readonly hasClipboard: boolean;
	readonly onCopy: () => void;
	readonly onCut: () => void;
	readonly onPaste: () => void;
	readonly onClose: () => void;
}) {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
		};
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('pointerdown', handleClick);
		document.addEventListener('keydown', handleEsc);
		return () => {
			document.removeEventListener('pointerdown', handleClick);
			document.removeEventListener('keydown', handleEsc);
		};
	}, [onClose]);

	const items = [
		{ label: 'Copy', shortcut: 'Ctrl+C', action: onCopy, show: true },
		{ label: 'Cut', shortcut: 'Ctrl+X', action: onCut, show: true },
		{ label: 'Paste', shortcut: 'Ctrl+V', action: onPaste, show: hasClipboard },
	];

	return (
		<div
			ref={menuRef}
			style={{
				position: 'fixed',
				left: Math.min(x, window.innerWidth - 180),
				top: Math.min(y, window.innerHeight - 120),
				width: '170px',
				background: 'var(--place-base)',
				border: '1px solid var(--place-border-strong)',
				borderRadius: '8px',
				padding: '0.25rem 0',
				zIndex: 200,
				boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
			}}
		>
			{items.filter((i) => i.show).map((item) => (
				<button
					key={item.label}
					type="button"
					onClick={item.action}
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						width: '100%',
						padding: '0.4rem 0.75rem',
						fontSize: '0.75rem',
						border: 'none',
						background: 'transparent',
						color: 'var(--place-text-primary)',
						cursor: 'pointer',
						textAlign: 'left',
					}}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLElement).style.background = 'transparent';
					}}
				>
					<span>{item.label}</span>
					<span style={{ color: 'var(--place-text-muted)', fontSize: '0.65rem' }}>
						{item.shortcut}
					</span>
				</button>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// User file operations
// ----------------------------------------------------------------------------

const USER_FILE_FOLDERS = new Set(['desktop', 'documents', 'photos']);

function isUserFileFolder(folderId: string): boolean {
	return USER_FILE_FOLDERS.has(folderId) || !folderId.startsWith('app-');
}

// ----------------------------------------------------------------------------
// Tab bar
// ----------------------------------------------------------------------------

function TabBar({
	tabs,
	activeTabId,
	onSelectTab,
	onCloseTab,
	onNewTab,
}: {
	readonly tabs: readonly FinderTab[];
	readonly activeTabId: string;
	readonly onSelectTab: (id: string) => void;
	readonly onCloseTab: (id: string) => void;
	readonly onNewTab: () => void;
}) {
	const showClose = tabs.length > 1;

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'stretch',
				height: '28px',
				minHeight: '28px',
				borderBottom: '1px solid var(--place-border-default)',
				background: 'rgba(255,255,255,0.015)',
				overflowX: 'auto',
				overflowY: 'hidden',
			}}
		>
			{tabs.map((tab) => {
				const isActive = tab.id === activeTabId;
				return (
					<button
						key={tab.id}
						type="button"
						onClick={() => onSelectTab(tab.id)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.3rem',
							padding: '0 0.6rem',
							fontSize: '0.7rem',
							border: 'none',
							borderBottom: isActive
								? '2px solid var(--place-secondary-400)'
								: '2px solid transparent',
							background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
							color: isActive
								? 'var(--place-text-primary)'
								: 'var(--place-text-secondary)',
							cursor: 'pointer',
							whiteSpace: 'nowrap',
							flexShrink: 0,
							maxWidth: '160px',
							transition: 'background 0.1s, border-color 0.15s',
						}}
					>
						<span
							style={{
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{tab.label}
						</span>
						{showClose && (
							<span
								role="button"
								tabIndex={-1}
								onClick={(e) => {
									e.stopPropagation();
									onCloseTab(tab.id);
								}}
								onKeyDown={() => {}}
								style={{
									fontSize: '0.75rem',
									lineHeight: 1,
									color: 'var(--place-text-muted)',
									cursor: 'pointer',
									padding: '0 0.1rem',
									borderRadius: '3px',
									opacity: isActive ? 0.8 : 0,
									transition: 'opacity 0.1s',
								}}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLElement).style.opacity = '1';
									(e.currentTarget as HTMLElement).style.background =
										'rgba(255,255,255,0.08)';
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLElement).style.opacity = isActive
										? '0.8'
										: '0';
									(e.currentTarget as HTMLElement).style.background =
										'transparent';
								}}
								aria-label={`Close tab ${tab.label}`}
							>
								&times;
							</span>
						)}
					</button>
				);
			})}
			<button
				type="button"
				onClick={onNewTab}
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: '28px',
					flexShrink: 0,
					border: 'none',
					borderBottom: '2px solid transparent',
					background: 'transparent',
					color: 'var(--place-text-muted)',
					cursor: 'pointer',
					fontSize: '0.85rem',
					transition: 'color 0.1s',
				}}
				onMouseEnter={(e) => {
					(e.currentTarget as HTMLElement).style.color =
						'var(--place-text-primary)';
				}}
				onMouseLeave={(e) => {
					(e.currentTarget as HTMLElement).style.color =
						'var(--place-text-muted)';
				}}
				aria-label="New tab"
			>
				+
			</button>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Tab helpers
// ----------------------------------------------------------------------------

function createTab(folderId: string, label: string): FinderTab {
	return { id: createId(), folderId, label };
}

// ----------------------------------------------------------------------------
// FinderApp
// ----------------------------------------------------------------------------

export function FinderApp() {
	const globalSelectedFolderId = useFinderStore((s) => s.selectedFolderId);
	const setSelectedFolder = useFinderStore((s) => s.setSelectedFolder);
	const getFilesForFolder = useFinderStore((s) => s.getFilesForFolder);
	const refreshAppFolders = useFinderStore((s) => s.refreshAppFolders);
	const folders = useFinderStore((s) => s.folders);

	const loadFiles = useFileStore((s) => s.loadFiles);
	const loadFolders = useFileStore((s) => s.loadFolders);
	const fileStoreFiles = useFileStore((s) => s.files);

	const clipboardEntries = useClipboardStore((s) => s.entries);
	const clipboardMode = useClipboardStore((s) => s.mode);
	const clipboardCopy = useClipboardStore((s) => s.copy);
	const clipboardCut = useClipboardStore((s) => s.cut);
	const clipboardPaste = useClipboardStore((s) => s.paste);

	const activeWindowId = useWindowStore((s) => s.activeWindowId);
	const allWindows = useWindowStore((s) => s.windows);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
	const [lastClickedFileId, setLastClickedFileId] = useState<string | null>(null);
	const [detailContent, setDetailContent] = useState<FileContent | null>(null);
	const [detailAppId, setDetailAppId] = useState<string | null>(null);
	const [dragOver, setDragOver] = useState(false);
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// ---- Tab state ----------------------------------------------------------
	const initialFolderName = useMemo(() => {
		const match = folders.find((f) => f.id === globalSelectedFolderId);
		return match?.name ?? 'Home';
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const [tabs, setTabs] = useState<readonly FinderTab[]>(() => [
		createTab(globalSelectedFolderId, initialFolderName),
	]);
	const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id ?? '');

	const activeTab = useMemo(() => {
		const found = tabs.find((t) => t.id === activeTabId);
		// tabs always has at least 1 entry — we never allow closing the last tab
		return found ?? (tabs[0] as FinderTab);
	}, [tabs, activeTabId]);

	// The active tab drives the selected folder instead of the global store
	const selectedFolderId = activeTab.folderId;

	// Keep the global finder store in sync so other components can read it
	useEffect(() => {
		setSelectedFolder(selectedFolderId);
	}, [selectedFolderId, setSelectedFolder]);

	const getFolderName = useCallback(
		(folderId: string): string => {
			const match = folders.find((f) => f.id === folderId);
			return match?.name ?? 'Folder';
		},
		[folders],
	);

	// ---- Tab actions --------------------------------------------------------
	const handleNewTab = useCallback(() => {
		const tab = createTab('home', 'Home');
		setTabs((prev) => [...prev, tab]);
		setActiveTabId(tab.id);
	}, []);

	const handleCloseTab = useCallback(
		(tabId: string) => {
			setTabs((prev) => {
				if (prev.length <= 1) return prev;
				const next = prev.filter((t) => t.id !== tabId);
				if (activeTabId === tabId) {
					const closedIdx = prev.findIndex((t) => t.id === tabId);
					const newActive = next[Math.min(closedIdx, next.length - 1)];
					if (newActive) setActiveTabId(newActive.id);
				}
				return next;
			});
		},
		[activeTabId],
	);

	const handleSelectTab = useCallback((tabId: string) => {
		setActiveTabId(tabId);
	}, []);

	/** Navigate the active tab to a different folder */
	const navigateActiveTab = useCallback(
		(folderId: string) => {
			const label = getFolderName(folderId);
			setTabs((prev) =>
				prev.map((t) =>
					t.id === activeTabId ? { ...t, folderId, label } : t,
				),
			);
		},
		[activeTabId, getFolderName],
	);

	// ---- Keyboard shortcuts (Ctrl+T / Ctrl+W) scoped to active finder ------
	const isFinderFocused = useMemo(() => {
		if (!activeWindowId) return false;
		const win = allWindows.get(activeWindowId);
		if (!win) return false;
		return win.appId === ('finder' as const);
	}, [activeWindowId, allWindows]);

	useEffect(() => {
		if (!isFinderFocused) return;

		const handleTabShortcut = (e: KeyboardEvent) => {
			const mod = e.ctrlKey || e.metaKey;
			if (!mod) return;

			if (e.key === 't') {
				e.preventDefault();
				handleNewTab();
			} else if (e.key === 'w') {
				e.preventDefault();
				if (tabs.length > 1) {
					handleCloseTab(activeTabId);
				}
			}
		};

		document.addEventListener('keydown', handleTabShortcut);
		return () => document.removeEventListener('keydown', handleTabShortcut);
	}, [isFinderFocused, handleNewTab, handleCloseTab, activeTabId, tabs.length]);

	// Set of file IDs currently in clipboard with "cut" mode
	const cutFileIds = useMemo(() => {
		if (clipboardMode !== 'cut') return new Set<string>();
		return new Set(clipboardEntries.map((e) => e.fileId));
	}, [clipboardEntries, clipboardMode]);

	// Load app folders and user folders/files on mount
	useEffect(() => {
		refreshAppFolders();
		void loadFolders();
	}, [refreshAppFolders, loadFolders]);

	// Load user files when folder changes
	useEffect(() => {
		if (isUserFileFolder(selectedFolderId)) {
			void loadFiles(selectedFolderId);
		}
	}, [selectedFolderId, loadFiles]);

	const allFiles = useMemo(
		() => getFilesForFolder(selectedFolderId),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[getFilesForFolder, selectedFolderId, fileStoreFiles],
	);

	const filteredFiles = useMemo(() => {
		if (!searchQuery) return allFiles;
		const q = searchQuery.toLowerCase();
		return allFiles.filter(
			({ file }) =>
				file.name.toLowerCase().includes(q) || file.preview.toLowerCase().includes(q),
		);
	}, [allFiles, searchQuery]);

	// Build clipboard entries from the current selection (user files only)
	const buildClipboardEntries = useCallback(() => {
		return filteredFiles
			.filter(({ file, appId }) => selectedFileIds.has(file.id) && appId === 'finder')
			.map(({ file }) => ({
				fileId: file.id,
				filename: file.name,
				sourceFolderId: selectedFolderId,
			}));
	}, [filteredFiles, selectedFileIds, selectedFolderId]);

	const handleCopy = useCallback(() => {
		const entries = buildClipboardEntries();
		if (entries.length > 0) clipboardCopy(entries);
		setContextMenu(null);
	}, [buildClipboardEntries, clipboardCopy]);

	const handleCut = useCallback(() => {
		const entries = buildClipboardEntries();
		if (entries.length > 0) clipboardCut(entries);
		setContextMenu(null);
	}, [buildClipboardEntries, clipboardCut]);

	const handlePaste = useCallback(() => {
		void clipboardPaste(selectedFolderId);
		setContextMenu(null);
	}, [clipboardPaste, selectedFolderId]);

	// Keyboard shortcuts for clipboard (scoped to this component)
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handler = (e: KeyboardEvent) => {
			// Skip if target is an input element
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

			if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;

			const key = e.key.toLowerCase();

			if (key === 'c') {
				const entries = buildClipboardEntries();
				if (entries.length > 0) {
					e.preventDefault();
					e.stopPropagation();
					clipboardCopy(entries);
				}
			} else if (key === 'x') {
				const entries = buildClipboardEntries();
				if (entries.length > 0) {
					e.preventDefault();
					e.stopPropagation();
					clipboardCut(entries);
				}
			} else if (key === 'v') {
				if (clipboardEntries.length > 0) {
					e.preventDefault();
					e.stopPropagation();
					void clipboardPaste(selectedFolderId);
				}
			}
		};

		container.addEventListener('keydown', handler);
		return () => container.removeEventListener('keydown', handler);
	}, [buildClipboardEntries, clipboardCopy, clipboardCut, clipboardPaste, clipboardEntries, selectedFolderId]);

	const handleFileClick = useCallback(
		(fileId: string, appId: string, e: React.MouseEvent) => {
			// Multi-select: Shift+click for range, Ctrl/Meta+click for toggle
			if (e.shiftKey && lastClickedFileId) {
				const ids = filteredFiles.map(({ file }) => file.id);
				const lastIdx = ids.indexOf(lastClickedFileId);
				const curIdx = ids.indexOf(fileId);
				if (lastIdx !== -1 && curIdx !== -1) {
					const start = Math.min(lastIdx, curIdx);
					const end = Math.max(lastIdx, curIdx);
					const rangeIds = ids.slice(start, end + 1);
					setSelectedFileIds((prev) => {
						const next = new Set(prev);
						for (const id of rangeIds) next.add(id);
						return next;
					});
					return;
				}
			}

			if (e.ctrlKey || e.metaKey) {
				setSelectedFileIds((prev) => {
					const next = new Set(prev);
					if (next.has(fileId)) next.delete(fileId);
					else next.add(fileId);
					return next;
				});
				setLastClickedFileId(fileId);
				return;
			}

			// Normal click: single select
			setSelectedFileIds(new Set([fileId]));
			setLastClickedFileId(fileId);

			// Show detail panel
			if (appId === 'finder') {
				const f = fileStoreFiles.find((r) => r.id === fileId);
				if (f) {
					setDetailContent({
						entry: {
							id: f.id,
							name: f.filename,
							type: f.mimeType,
							preview: `${formatFileSize(f.sizeBytes)} \u00B7 ${f.mimeType}`,
							createdAt: new Date(f.createdAt).getTime(),
							updatedAt: new Date(f.updatedAt).getTime(),
						},
						body: isImageMime(f.mimeType)
							? `[Image: ${f.filename}]`
							: `File: ${f.filename}\nSize: ${formatFileSize(f.sizeBytes)}\nType: ${f.mimeType}`,
					});
					setDetailAppId('finder');
				}
				return;
			}
			const app = getAllApps().find((a) => a.id === appId);
			const content = app?.getFile?.(fileId);
			if (content) {
				setDetailContent(content);
				setDetailAppId(appId);
			}
		},
		[fileStoreFiles, filteredFiles, lastClickedFileId],
	);

	const handleFileContextMenu = useCallback(
		(fileId: string, appId: string, e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (appId !== 'finder') return; // Only user files have clipboard ops

			// If the right-clicked file is not in selection, select it alone
			if (!selectedFileIds.has(fileId)) {
				setSelectedFileIds(new Set([fileId]));
				setLastClickedFileId(fileId);
			}

			setContextMenu({ x: e.clientX, y: e.clientY });
		},
		[selectedFileIds],
	);

	const handleCloseDetail = useCallback(() => {
		setSelectedFileIds(new Set());
		setDetailContent(null);
		setDetailAppId(null);
	}, []);

	const handleUploadComplete = useCallback(() => {
		if (isUserFileFolder(selectedFolderId)) {
			void loadFiles(selectedFolderId);
		}
	}, [selectedFolderId, loadFiles]);

	// Drag-drop from native OS
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragOver(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setDragOver(false);
	}, []);

	const handleDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setDragOver(false);

			const files = e.dataTransfer?.files;
			if (!files || files.length === 0) return;

			const upload = useFileStore.getState().upload;
			for (const file of files) {
				await upload(file, selectedFolderId);
			}
			void loadFiles(selectedFolderId);
		},
		[selectedFolderId, loadFiles],
	);

	const currentFolder = folders.find((f) => f.id === selectedFolderId);
	const showUploadBar = isUserFileFolder(selectedFolderId);
	const hasClipboard = clipboardEntries.length > 0;

	return (
		<div
			ref={containerRef}
			className="flex h-full flex-col"
			style={{
				overflow: 'hidden',
				outline: dragOver ? '2px dashed var(--place-secondary-400)' : 'none',
				outlineOffset: '-2px',
			}}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={(e) => void handleDrop(e)}
			tabIndex={-1}
		>
			<SearchBar value={searchQuery} onChange={setSearchQuery} />
			<TabBar
				tabs={tabs}
				activeTabId={activeTabId}
				onSelectTab={handleSelectTab}
				onCloseTab={handleCloseTab}
				onNewTab={handleNewTab}
			/>
			{showUploadBar && (
				<UploadBar folderId={selectedFolderId} onUploadComplete={handleUploadComplete} />
			)}
			<ClipboardBar onPaste={handlePaste} />

			<div className="flex flex-1" style={{ overflow: 'hidden', position: 'relative' }}>
				<FolderTree selectedFolderId={selectedFolderId} onSelect={navigateActiveTab} />

				<div className="flex flex-1 flex-col" style={{ overflow: 'hidden' }}>
					<Breadcrumb folderId={selectedFolderId} onNavigate={navigateActiveTab} />
					<FileListHeader />
					<div style={{ flex: 1, overflowY: 'auto' }}>
						{filteredFiles.length === 0 ? (
							searchQuery ? (
								<div
									style={{
										padding: '2rem',
										textAlign: 'center',
										fontSize: '0.8rem',
										color: 'var(--place-text-secondary)',
									}}
								>
									No files match your search.
								</div>
							) : (
								<EmptyFolderState folderName={currentFolder?.name ?? 'Folder'} />
							)
						) : (
							filteredFiles.map(({ file, appId, appName }) => (
								<FileRow
									key={`${appId}-${file.id}`}
									file={file}
									appName={appName}
									isSelected={selectedFileIds.has(file.id)}
									isCut={cutFileIds.has(file.id)}
									onClick={(e) => handleFileClick(file.id, appId, e)}
									onContextMenu={(e) => handleFileContextMenu(file.id, appId, e)}
								/>
							))
						)}
					</div>
				</div>

				<AnimatePresence>
					{detailContent && detailAppId && (
						<DetailPanel
							key="detail"
							content={detailContent}
							appId={detailAppId}
							onClose={handleCloseDetail}
						/>
					)}
				</AnimatePresence>
			</div>

			{contextMenu && (
				<FinderContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					hasClipboard={hasClipboard}
					onCopy={handleCopy}
					onCut={handleCut}
					onPaste={handlePaste}
					onClose={() => setContextMenu(null)}
				/>
			)}
		</div>
	);
}
