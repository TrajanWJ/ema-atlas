'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLauncherStore } from "@/src/stores/launcher-store";
import { useWindowStore } from "@/src/stores/window-store";
import { getAllApps } from "@/src/lib/app-registry";
import { APP_LABELS } from "@/src/lib/constants";
import type { AppId } from "@/src/types/window";
import {
	BrainIcon,
	JournalIcon,
	TargetIcon,
	CheckIcon,
	RepeatIcon,
	SearchIcon,
	TerminalIcon,
	MusicIcon,
	SettingsIcon,
	NotesIcon,
	MonitorIcon,
	FinderIcon,
	PipesIcon,
	InfoIcon,
	GlobeIcon,
} from "@/src/components/icons";

// ----------------------------------------------------------------------------
// App metadata (icons + descriptions not always in registry)
// ----------------------------------------------------------------------------

interface LauncherAppMeta {
	readonly id: AppId;
	readonly icon: React.ReactNode;
	readonly description: string;
	readonly category: Category;
}

type Category = "Productivity" | "System" | "Info" | "Other";

const APP_META: readonly LauncherAppMeta[] = [
	{ id: "brain-dump", icon: <BrainIcon size={16} />, description: "Quick-capture inbox", category: "Productivity" },
	{ id: "tasks", icon: <CheckIcon size={16} />, description: "Kanban task board", category: "Productivity" },
	{ id: "notes", icon: <NotesIcon size={16} />, description: "Markdown notes", category: "Productivity" },
	{ id: "journal", icon: <JournalIcon size={16} />, description: "Daily markdown journal", category: "Productivity" },
	{ id: "focus", icon: <TargetIcon size={16} />, description: "Pomodoro timer", category: "Productivity" },
	{ id: "habits", icon: <RepeatIcon size={16} />, description: "Streak tracker", category: "Productivity" },
	{ id: "finder", icon: <FinderIcon size={16} />, description: "Browse files across apps", category: "System" },
	{ id: "settings", icon: <SettingsIcon size={16} />, description: "Preferences", category: "System" },
	{ id: "terminal", icon: <TerminalIcon size={16} />, description: "Command line", category: "System" },
	{ id: "system-monitor", icon: <MonitorIcon size={16} />, description: "System info & stats", category: "System" },
	{ id: "pipes", icon: <PipesIcon size={16} />, description: "Automation pipelines", category: "System" },
	{ id: "about-place", icon: <InfoIcon size={16} />, description: "About this OS", category: "Info" },
	{ id: "about-trajan", icon: <GlobeIcon size={16} />, description: "About the creator", category: "Info" },
	{ id: "music", icon: <MusicIcon size={16} />, description: "Lo-fi radio", category: "Other" },
	{ id: "calculator", icon: <SettingsIcon size={16} />, description: "Calculator", category: "Other" },
	{ id: "clock", icon: <SettingsIcon size={16} />, description: "World clocks", category: "Other" },
];

const CATEGORIES: readonly Category[] = ["Productivity", "System", "Info", "Other"];

function getAppMeta(appId: string): LauncherAppMeta | undefined {
	return APP_META.find((a) => a.id === appId);
}

// ----------------------------------------------------------------------------
// Favorites row
// ----------------------------------------------------------------------------

function FavoritesRow({
	favorites,
	onLaunch,
}: {
	readonly favorites: readonly string[];
	readonly onLaunch: (id: AppId) => void;
}) {
	if (favorites.length === 0) return null;

	return (
		<div style={{ padding: "8px 12px", borderBottom: "1px solid var(--place-border-subtle)" }}>
			<div
				style={{
					fontSize: "0.6rem",
					fontWeight: 600,
					textTransform: "uppercase",
					letterSpacing: "0.05em",
					color: "var(--place-text-muted)",
					marginBottom: "6px",
				}}
			>
				Favorites
			</div>
			<div className="flex items-center gap-2">
				{favorites.slice(0, 6).map((appId) => {
					const meta = getAppMeta(appId);
					if (!meta) return null;
					return (
						<FavoriteIcon
							key={appId}
							meta={meta}
							onLaunch={onLaunch}
						/>
					);
				})}
			</div>
		</div>
	);
}

function FavoriteIcon({
	meta,
	onLaunch,
}: {
	readonly meta: LauncherAppMeta;
	readonly onLaunch: (id: AppId) => void;
}) {
	return (
		<button
			type="button"
			title={APP_LABELS[meta.id]}
			onClick={() => onLaunch(meta.id)}
			className="flex h-9 w-9 items-center justify-center rounded-lg"
			style={{
				background: "rgba(255,255,255,0.04)",
				border: "1px solid var(--place-border-subtle)",
				color: "var(--place-text-secondary)",
				cursor: "default",
				transition: "background 0.15s, color 0.15s",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.background = "rgba(255,255,255,0.08)";
				e.currentTarget.style.color = "var(--place-text-primary)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = "rgba(255,255,255,0.04)";
				e.currentTarget.style.color = "var(--place-text-secondary)";
			}}
		>
			{meta.icon}
		</button>
	);
}

// ----------------------------------------------------------------------------
// Category section
// ----------------------------------------------------------------------------

function CategorySection({
	category,
	apps,
	onLaunch,
	onContextMenu,
}: {
	readonly category: Category;
	readonly apps: readonly LauncherAppMeta[];
	readonly onLaunch: (id: AppId) => void;
	readonly onContextMenu: (e: React.MouseEvent, appId: AppId) => void;
}) {
	const [expanded, setExpanded] = useState(true);

	return (
		<div style={{ marginBottom: "2px" }}>
			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				className="flex w-full items-center gap-1.5 px-3 py-1.5"
				style={{
					background: "none",
					border: "none",
					color: "var(--place-text-muted)",
					fontSize: "0.6rem",
					fontWeight: 600,
					textTransform: "uppercase",
					letterSpacing: "0.05em",
					cursor: "default",
				}}
			>
				<span style={{
					display: "inline-block",
					transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
					transition: "transform 0.15s",
					fontSize: "0.5rem",
				}}>
					&#9660;
				</span>
				{category}
			</button>
			{expanded && (
				<div>
					{apps.map((app) => (
						<AppRow
							key={app.id}
							app={app}
							onLaunch={onLaunch}
							onContextMenu={onContextMenu}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// ----------------------------------------------------------------------------
// App row
// ----------------------------------------------------------------------------

function AppRow({
	app,
	onLaunch,
	onContextMenu,
}: {
	readonly app: LauncherAppMeta;
	readonly onLaunch: (id: AppId) => void;
	readonly onContextMenu: (e: React.MouseEvent, appId: AppId) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onLaunch(app.id)}
			onContextMenu={(e) => {
				e.preventDefault();
				onContextMenu(e, app.id);
			}}
			className="flex w-full items-center gap-2.5 px-4 py-1.5"
			style={{
				background: "transparent",
				border: "none",
				cursor: "default",
				color: "var(--place-text-secondary)",
				fontSize: "0.72rem",
				textAlign: "left",
				transition: "background 0.1s",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.background = "rgba(255,255,255,0.04)";
				e.currentTarget.style.color = "var(--place-text-primary)";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = "transparent";
				e.currentTarget.style.color = "var(--place-text-secondary)";
			}}
		>
			<span className="flex shrink-0">{app.icon}</span>
			<span className="flex flex-col gap-0">
				<span style={{ fontWeight: 500 }}>{APP_LABELS[app.id]}</span>
				<span style={{ fontSize: "0.58rem", color: "var(--place-text-muted)" }}>
					{app.description}
				</span>
			</span>
		</button>
	);
}

// ----------------------------------------------------------------------------
// Context menu for favorites toggle
// ----------------------------------------------------------------------------

function LauncherContextMenu({
	x,
	y,
	appId,
	isFavorite,
	onClose,
}: {
	readonly x: number;
	readonly y: number;
	readonly appId: AppId;
	readonly isFavorite: boolean;
	readonly onClose: () => void;
}) {
	const menuRef = useRef<HTMLDivElement>(null);
	const { addFavorite, removeFavorite } = useLauncherStore();

	useEffect(() => {
		const handleClick = (e: PointerEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		const id = setTimeout(() => {
			document.addEventListener("pointerdown", handleClick);
		}, 0);
		return () => {
			clearTimeout(id);
			document.removeEventListener("pointerdown", handleClick);
		};
	}, [onClose]);

	const handleToggle = () => {
		if (isFavorite) {
			removeFavorite(appId);
		} else {
			addFavorite(appId);
		}
		onClose();
	};

	return (
		<motion.div
			ref={menuRef}
			role="menu"
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.1 }}
			className="fixed z-[10000] min-w-[160px] rounded-lg p-1"
			style={{
				top: y,
				left: x,
				background: "var(--place-surface-1)",
				border: "1px solid var(--place-border-default)",
				backdropFilter: "blur(20px)",
				WebkitBackdropFilter: "blur(20px)",
				boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
			}}
		>
			<button
				type="button"
				onClick={handleToggle}
				className="flex w-full items-center rounded-md px-3 py-1.5 text-sm"
				style={{ color: "var(--place-text-primary)", background: "none", border: "none", cursor: "default" }}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = "rgba(255,255,255,0.04)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = "";
				}}
			>
				{isFavorite ? "Remove from Favorites" : "Add to Favorites"}
			</button>
		</motion.div>
	);
}

// ----------------------------------------------------------------------------
// Search results (flat list)
// ----------------------------------------------------------------------------

function SearchResults({
	query,
	onLaunch,
	onContextMenu,
}: {
	readonly query: string;
	readonly onLaunch: (id: AppId) => void;
	readonly onContextMenu: (e: React.MouseEvent, appId: AppId) => void;
}) {
	const lc = query.toLowerCase();
	const results = APP_META.filter(
		(a) =>
			APP_LABELS[a.id].toLowerCase().includes(lc) ||
			a.description.toLowerCase().includes(lc),
	);

	if (results.length === 0) {
		return (
			<div
				style={{
					padding: "2rem 1rem",
					textAlign: "center",
					fontSize: "0.7rem",
					color: "var(--place-text-muted)",
				}}
			>
				No matching apps
			</div>
		);
	}

	return (
		<div>
			{results.map((app) => (
				<AppRow
					key={app.id}
					app={app}
					onLaunch={onLaunch}
					onContextMenu={onContextMenu}
				/>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Main panel
// ----------------------------------------------------------------------------

export function KickoffLauncher() {
	const { isOpen, close, favorites } = useLauncherStore();
	const openWindow = useWindowStore((s) => s.openWindow);
	const [search, setSearch] = useState("");
	const [ctxMenu, setCtxMenu] = useState<{
		x: number;
		y: number;
		appId: AppId;
	} | null>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	const handleLaunch = useCallback(
		(id: AppId) => {
			openWindow(id);
			close();
		},
		[openWindow, close],
	);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent, appId: AppId) => {
			setCtxMenu({ x: e.clientX, y: e.clientY, appId });
		},
		[],
	);

	// Close on Escape
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setCtxMenu(null);
				close();
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [isOpen, close]);

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: PointerEvent) => {
			const target = e.target as Node;
			// Don't close if clicking the dock trigger button
			const trigger = document.querySelector("[data-launcher-trigger]");
			if (trigger?.contains(target)) return;
			if (panelRef.current && !panelRef.current.contains(target)) {
				close();
			}
		};
		const id = setTimeout(() => {
			document.addEventListener("pointerdown", handler);
		}, 0);
		return () => {
			clearTimeout(id);
			document.removeEventListener("pointerdown", handler);
		};
	}, [isOpen, close]);

	// Reset search when closed
	useEffect(() => {
		if (!isOpen) setSearch("");
	}, [isOpen]);

	const maxH = typeof window !== "undefined"
		? Math.min(480, window.innerHeight - 80)
		: 480;

	if (typeof document === "undefined") return null;

	const grouped = CATEGORIES.map((cat) => ({
		category: cat,
		apps: APP_META.filter((a) => a.category === cat),
	})).filter((g) => g.apps.length > 0);

	return createPortal(
		<>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						ref={panelRef}
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 20, opacity: 0 }}
						transition={{ type: "spring", stiffness: 500, damping: 30 }}
						className="glass-elevated fixed z-[9998] flex flex-col overflow-hidden rounded-2xl"
						style={{
							width: 340,
							maxHeight: maxH,
							bottom: 64,
							left: 16,
							boxShadow:
								"0 12px 48px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
						}}
					>
						{/* Search */}
						<div style={{ padding: "10px 12px 8px" }}>
							<div
								className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
								style={{
									background: "rgba(255,255,255,0.03)",
									border: "1px solid var(--place-border-subtle)",
								}}
							>
								<SearchIcon size={13} />
								<input
									type="text"
									placeholder="Search apps..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									autoFocus
									className="w-full bg-transparent outline-none"
									style={{
										color: "var(--place-text-primary)",
										fontSize: "0.72rem",
										border: "none",
									}}
								/>
							</div>
						</div>

						{/* Scrollable body */}
						<div
							className="flex-1 overflow-y-auto"
							style={{ scrollbarGutter: "stable" }}
						>
							{search.trim() ? (
								<SearchResults
									query={search.trim()}
									onLaunch={handleLaunch}
									onContextMenu={handleContextMenu}
								/>
							) : (
								<>
									<FavoritesRow
										favorites={favorites}
										onLaunch={handleLaunch}
									/>
									{grouped.map((g) => (
										<CategorySection
											key={g.category}
											category={g.category}
											apps={g.apps}
											onLaunch={handleLaunch}
											onContextMenu={handleContextMenu}
										/>
									))}
								</>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Favorites context menu */}
			<AnimatePresence>
				{ctxMenu && (
					<LauncherContextMenu
						x={ctxMenu.x}
						y={ctxMenu.y}
						appId={ctxMenu.appId}
						isFavorite={favorites.includes(ctxMenu.appId)}
						onClose={() => setCtxMenu(null)}
					/>
				)}
			</AnimatePresence>
		</>,
		document.body,
	);
}
