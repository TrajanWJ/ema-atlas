'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDesktopStore } from '@/src/stores/desktop-store';
import { useWindowStore } from '@/src/stores/window-store';
import { useFocusStore } from '@/src/stores/focus-store';
import { useWorkspaceStore } from '@/src/stores/workspace-store';
import { formatDate, formatTime } from '@/src/lib/time';
import { useWeather } from '@/src/hooks/use-weather';
import { useToast } from '@/src/hooks/use-toast';
import { APP_LABELS } from '@/src/lib/constants';
import { encodeWindows } from '@/src/lib/deep-links';
import { getApp } from '@/src/lib/app-registry';
import type { AppMenu } from '@/src/lib/app-registry';
import { SearchIcon } from '@/src/components/icons';
import { NotificationCenter } from './NotificationCenter';
import { ZoomControls } from './ZoomControls';
import {
	MenuBarDropdown,
	MenuItem,
	MenuDivider,
	MenuSection,
} from './MenuBarDropdown';
import { useNotificationStore } from '@/src/stores/notification-store';
import { useCapabilitiesStore } from '@/src/stores/capabilities-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { useInstallPrompt } from '@/src/hooks/use-install-prompt';
import type { AppId } from '@/src/types/window';

// ── Helpers ──

function formatMs(ms: number): string {
	const totalMinutes = Math.floor(ms / 60000);
	if (totalMinutes === 0) return '';
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	return `${minutes}m`;
}

// ── Menu bar item wrapper ──

function BarItem({
	children,
	menuRef,
	onEnter,
	active,
	title,
}: {
	readonly children: React.ReactNode;
	readonly menuRef: React.RefObject<HTMLSpanElement | null>;
	readonly onEnter: () => void;
	readonly active: boolean;
	readonly title?: string;
}) {
	return (
		<span
			ref={menuRef}
			onMouseEnter={onEnter}
			title={title}
			className="relative flex items-center px-2 py-0.5 rounded transition-colors"
			style={{
				cursor: 'default',
				fontSize: '0.75rem',
				background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
				color: active ? 'var(--place-text-primary)' : 'var(--place-text-secondary)',
			}}
		>
			{children}
		</span>
	);
}

// ── App menu item in the bar ──

function AppMenuBarItem({
	menu,
	menuKey,
	openMenu,
	handleEnter,
	toggleMenu,
	closeMenu,
}: {
	readonly menu: AppMenu;
	readonly menuKey: string;
	readonly openMenu: string | null;
	readonly handleEnter: (key: string) => void;
	readonly toggleMenu: (key: string) => void;
	readonly closeMenu: () => void;
}) {
	const anchorRef = useRef<HTMLSpanElement>(null);

	return (
		<>
			<BarItem
				menuRef={anchorRef}
				onEnter={() => handleEnter(menuKey)}
				active={openMenu === menuKey}
			>
				<span onClick={() => toggleMenu(menuKey)}>
					{menu.label}
				</span>
			</BarItem>
			<MenuBarDropdown
				isOpen={openMenu === menuKey}
				onClose={closeMenu}
				anchorRef={anchorRef}
			>
				<div className="py-1">
					{menu.items.map((item) =>
						item.separator ? (
							<MenuDivider key={`sep-${item.label}`} />
						) : (
							<MenuItem
								key={item.label}
								label={item.label}
								shortcut={item.shortcut}
								onClick={() => { item.action(); closeMenu(); }}
							/>
						),
					)}
				</div>
			</MenuBarDropdown>
		</>
	);
}

// ── User identity badge ──

function UserBadge() {
	const user = useAuthStore((s) => s.user);
	if (!user) return null;

	const initial = user.name.charAt(0).toUpperCase();

	return (
		<span
			className="flex items-center gap-1.5 rounded px-1.5 py-0.5"
			title={`Signed in as ${user.email}`}
			style={{
				fontSize: '0.65rem',
				color: 'var(--place-text-secondary)',
				cursor: 'default',
			}}
		>
			<span
				className="flex h-4 w-4 items-center justify-center rounded-full"
				style={{
					background: 'rgba(91, 156, 245, 0.2)',
					color: 'var(--place-secondary-400)',
					fontSize: '0.55rem',
					fontWeight: 700,
					lineHeight: 1,
				}}
			>
				{initial}
			</span>
			{user.name}
		</span>
	);
}

// ── Main component ──

export function AmbientBar() {
	const inboxCount = useDesktopStore((s) => s.inboxCount);
	const oneThing = useDesktopStore((s) => s.oneThing);
	const openCommandPalette = useDesktopStore((s) => s.openCommandPalette);
	const openShortcutHelp = useDesktopStore((s) => s.openShortcutHelp);
	const openTelescope = useDesktopStore((s) => s.openTelescope);
	const [now, setNow] = useState(() => new Date());
	const weather = useWeather();

	const { windows, openWindow, focusWindow, closeWindow, minimizeWindow, activeWindowId } =
		useWindowStore();
	const isRunning = useFocusStore((s) => s.isRunning);
	const elapsedMs = useFocusStore((s) => s.elapsedMs);
	const todayFocusMs = useFocusStore((s) => s.todayStats.totalFocusMs);

	const [openMenu, setOpenMenu] = useState<string | null>(null);

	const workspaceLayouts = useWorkspaceStore((s) => s.layouts);
	const workspaceSave = useWorkspaceStore((s) => s.save);
	const workspaceLoad = useWorkspaceStore((s) => s.load);
	const workspaceRemove = useWorkspaceStore((s) => s.remove);

	const unreadCount = useNotificationStore((s) => s.unreadCount);
	const wco = useCapabilitiesStore((s) => s.wco);
	const { canInstall, install: installPwa } = useInstallPrompt();

	const brandRef = useRef<HTMLSpanElement>(null);
	const processRef = useRef<HTMLSpanElement>(null);
	const workspaceRef = useRef<HTMLSpanElement>(null);
	const clockRef = useRef<HTMLSpanElement>(null);
	const bellRef = useRef<HTMLSpanElement>(null);
	const statusRef = useRef<HTMLSpanElement>(null);

	const { success: toastSuccess } = useToast();

	const [workspaceName, setWorkspaceName] = useState('');
	const [savingWorkspace, setSavingWorkspace] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const workspaceInputRef = useRef<HTMLInputElement>(null);

	// ── Focused app info ──
	const focusedAppId = useMemo(() => {
		if (!activeWindowId) return null;
		const win = windows.get(activeWindowId);
		return win?.appId ?? null;
	}, [activeWindowId, windows]);

	const focusedAppMenus = useMemo(() => {
		if (!focusedAppId) return [];
		const app = getApp(focusedAppId);
		return app?.menuBar?.menus ?? [];
	}, [focusedAppId]);

	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 30_000);
		return () => clearInterval(id);
	}, []);

	const closeMenu = useCallback(() => setOpenMenu(null), []);

	const startWorkspaceSave = useCallback(() => {
		setSavingWorkspace(true);
		setSaveError(null);
		setWorkspaceName('');
		setOpenMenu('workspaces');
		requestAnimationFrame(() => workspaceInputRef.current?.focus());
	}, []);

	const commitWorkspaceSave = useCallback(() => {
		if (!workspaceName.trim()) return;
		const result = workspaceSave(workspaceName);
		if (!result.ok) {
			setSaveError(result.reason);
			return;
		}
		setSavingWorkspace(false);
		setWorkspaceName('');
		setSaveError(null);
	}, [workspaceName, workspaceSave]);

	// Ctrl+Shift+S keyboard shortcut
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'S') {
				e.preventDefault();
				startWorkspaceSave();
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [startWorkspaceSave]);

	const handleShareDesktop = useCallback(() => {
		const url = encodeWindows(windows);
		navigator.clipboard.writeText(url).then(() => {
			toastSuccess('Desktop link copied to clipboard');
		}).catch(() => {
			// Clipboard API may fail in non-secure contexts — degrade silently
		});
		closeMenu();
	}, [windows, toastSuccess, closeMenu]);

	const handleEnter = useCallback(
		(menu: string) => {
			if (openMenu !== null) setOpenMenu(menu);
		},
		[openMenu],
	);

	const toggleMenu = useCallback(
		(menu: string) => {
			setOpenMenu((prev) => (prev === menu ? null : menu));
		},
		[],
	);

	const focusDisplay = isRunning ? formatMs(elapsedMs) : formatMs(todayFocusMs);
	const windowList = [...windows.values()];
	const openApps = windowList.filter((w) => !w.minimized);
	const minimizedApps = windowList.filter((w) => w.minimized);

	return (
		<div
			role="banner"
			className={`glass absolute top-0 left-0 right-0 z-50 flex h-10 items-center px-2${wco ? ' ambient-bar-wco' : ''}`}
		>
			{/* ── Left: Brand menu ── */}
			<BarItem
				menuRef={brandRef}
				onEnter={() => handleEnter('brand')}
				active={openMenu === 'brand'}
				title="System menu"
			>
				<span
					onClick={() => toggleMenu('brand')}
					style={{
						color: 'var(--place-secondary-400)',
						fontWeight: 600,
						letterSpacing: '0.05em',
					}}
				>
					place.org
				</span>
			</BarItem>

			<BrandDropdown
				isOpen={openMenu === 'brand'}
				anchorRef={brandRef}
				closeMenu={closeMenu}
				openWindow={openWindow}
				openTelescope={openTelescope}
				openCommandPalette={openCommandPalette}
				openShortcutHelp={openShortcutHelp}
				handleShareDesktop={handleShareDesktop}
			/>

			{/* ── Open windows as inline entries ── */}
			{windowList.length > 0 && (
				<>
					<div
						style={{
							width: '1px',
							height: '14px',
							background: 'var(--place-border-default, rgba(255,255,255,0.08))',
							margin: '0 0.15rem',
							flexShrink: 0,
						}}
					/>
					{windowList.map((w) => {
						const isFocused = w.id === activeWindowId;
						return (
							<button
								key={w.id}
								type="button"
								onClick={() => w.minimized ? focusWindow(w.id) : (isFocused ? minimizeWindow(w.id) : focusWindow(w.id))}
								style={{
									padding: '0.15rem 0.35rem',
									fontSize: '0.65rem',
									fontWeight: isFocused ? 600 : 400,
									color: isFocused
										? 'var(--place-text-primary, rgba(255,255,255,0.87))'
										: w.minimized
											? 'var(--place-text-muted, rgba(255,255,255,0.25))'
											: 'var(--place-text-secondary, rgba(255,255,255,0.6))',
									background: isFocused
										? 'rgba(255,255,255,0.06)'
										: 'transparent',
									border: 'none',
									borderRadius: '4px',
									cursor: 'default',
									whiteSpace: 'nowrap',
									transition: 'background 0.1s, color 0.1s',
									textDecoration: w.minimized ? 'line-through' : 'none',
									opacity: w.minimized ? 0.6 : 1,
								}}
							>
								{APP_LABELS[w.appId]}
							</button>
						);
					})}
				</>
			)}

			{/* ── Workspaces menu ── */}
			<BarItem
				menuRef={workspaceRef}
				onEnter={() => handleEnter('workspaces')}
				active={openMenu === 'workspaces'}
				title="Save and restore window layouts"
			>
				<span onClick={() => toggleMenu('workspaces')}>
					Workspaces
				</span>
			</BarItem>

			<WorkspacesDropdown
				isOpen={openMenu === 'workspaces'}
				anchorRef={workspaceRef}
				closeMenu={closeMenu}
				savingWorkspace={savingWorkspace}
				setSavingWorkspace={setSavingWorkspace}
				saveError={saveError}
				setSaveError={setSaveError}
				workspaceName={workspaceName}
				setWorkspaceName={setWorkspaceName}
				workspaceInputRef={workspaceInputRef}
				commitWorkspaceSave={commitWorkspaceSave}
				startWorkspaceSave={startWorkspaceSave}
				workspaceLayouts={workspaceLayouts}
				workspaceLoad={workspaceLoad}
				workspaceRemove={workspaceRemove}
			/>

			{/* ── App menus from focused app ── */}
			{focusedAppMenus.map((menu, idx) => (
				<AppMenuBarItem
					key={`${focusedAppId}-${menu.label}-${idx}`}
					menu={menu}
					menuKey={`app-menu-${idx}`}
					openMenu={openMenu}
					handleEnter={handleEnter}
					toggleMenu={toggleMenu}
					closeMenu={closeMenu}
				/>
			))}

			{/* ── One Thing ── */}
			{oneThing && (
				<span
					style={{
						color: 'var(--place-text-muted)',
						fontSize: '0.7rem',
						marginLeft: '0.5rem',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
						maxWidth: '180px',
						flex: '0 1 auto',
						
					}}
					title={oneThing}
				>
					{oneThing}
				</span>
			)}

			<span style={{ flex: 1 }} />

			{/* ── Center: Clock + Weather dropdown ── */}
			<BarItem
				menuRef={clockRef}
				onEnter={() => handleEnter('clock')}
				active={openMenu === 'clock'}
				title="Clock and weather"
			>
				<span
					onClick={() => toggleMenu('clock')}
					style={{
						position: 'absolute',
						left: '50%',
						transform: 'translateX(-50%)',
						whiteSpace: 'nowrap',
					}}
				>
					{formatDate(now)} &nbsp; {formatTime(now)}
					{!weather.error && weather.icon && (
						<> &nbsp;{weather.icon} {weather.temp}°F</>
					)}
				</span>
			</BarItem>

			<ClockDropdown
				isOpen={openMenu === 'clock'}
				anchorRef={clockRef}
				closeMenu={closeMenu}
				now={now}
				weather={weather}
				openWindow={openWindow}
			/>

			<span style={{ flex: 1 }} />

			{/* ── Telescope trigger ── */}
			<button
				type="button"
				onClick={openTelescope}
				title="Search everything (Ctrl+K)"
				className="flex items-center justify-center rounded p-1 transition-colors"
				style={{
					background: 'transparent',
					border: 'none',
					color: 'var(--place-text-secondary)',
					cursor: 'default',
				}}
				onMouseEnter={(e) => {
					(e.currentTarget as HTMLElement).style.color = 'var(--place-text-primary)';
					(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
				}}
				onMouseLeave={(e) => {
					(e.currentTarget as HTMLElement).style.color = 'var(--place-text-secondary)';
					(e.currentTarget as HTMLElement).style.background = 'transparent';
				}}
			>
				<SearchIcon size={14} />
			</button>

			{/* ── Notification bell ── */}
			<BarItem
				menuRef={bellRef}
				onEnter={() => handleEnter('notifications')}
				active={openMenu === 'notifications'}
				title="Notifications"
			>
				<span
					onClick={() => toggleMenu('notifications')}
					className="relative flex items-center"
				>
					{/* Inbox icon */}
					<svg
						width={14}
						height={14}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
						<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
					</svg>
					{unreadCount > 0 && (
						<span
							className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5"
							style={{
								background: 'var(--place-primary-400)',
								color: '#fff',
								fontSize: '0.55rem',
								fontWeight: 700,
								lineHeight: 1,
							}}
						>
							{unreadCount > 99 ? '99+' : unreadCount}
						</span>
					)}
				</span>
			</BarItem>

			<NotificationCenter
				isOpen={openMenu === 'notifications'}
				onClose={closeMenu}
				anchorRef={bellRef}
			/>

			{/* ── Install PWA button ── */}
			{canInstall && (
				<button
					type="button"
					onClick={() => { installPwa().catch(() => {}); }}
					title="Install as desktop app"
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						padding: '2px 8px',
						fontSize: '0.6rem',
						fontWeight: 600,
						letterSpacing: '0.04em',
						color: 'var(--place-primary-400, #2DD4A8)',
						background: 'var(--place-primary-subtle, rgba(13,147,115,0.10))',
						border: '1px solid var(--place-primary-border, rgba(45,212,168,0.20))',
						borderRadius: '4px',
						cursor: 'default',
						whiteSpace: 'nowrap',
						transition: 'background 0.15s',
					}}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLElement).style.background = 'var(--place-primary-glow, rgba(13,147,115,0.25))';
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLElement).style.background = 'var(--place-primary-subtle, rgba(13,147,115,0.10))';
					}}
				>
					<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
						<path d="M12 5v14" />
						<path d="M19 12l-7 7-7-7" />
					</svg>
					Install
				</button>
			)}

			{/* ── User identity ── */}
			<UserBadge />

			{/* ── Zoom controls ── */}
			<ZoomControls />

			{/* ── Right: Status dropdown ── */}
			<BarItem
				menuRef={statusRef}
				onEnter={() => handleEnter('status')}
				active={openMenu === 'status'}
				title="Focus timer, inbox, and quick actions"
			>
				<span
					onClick={() => toggleMenu('status')}
					className="flex items-center gap-2"
				>
					{focusDisplay && (
						<span
							style={{
								color: isRunning ? 'var(--place-secondary-400)' : 'var(--place-text-secondary)',
								fontSize: '0.75rem',
								fontVariantNumeric: 'tabular-nums',
								fontWeight: isRunning ? 600 : 400,
							}}
						>
							{isRunning ? '⏱ ' : ''}{focusDisplay}
						</span>
					)}
					{inboxCount > 0 && (
						<span
							style={{
								color: 'var(--place-tertiary-400)',
								fontSize: '0.75rem',
								fontWeight: 500,
							}}
						>
							{inboxCount}
						</span>
					)}
					</span>
			</BarItem>

			<StatusDropdown
				isOpen={openMenu === 'status'}
				anchorRef={statusRef}
				closeMenu={closeMenu}
				todayFocusMs={todayFocusMs}
				elapsedMs={elapsedMs}
				isRunning={isRunning}
				inboxCount={inboxCount}
				openWindow={openWindow}
			/>
		</div>
	);
}

// ── Extracted dropdown sub-components ──

function BrandDropdown({
	isOpen, anchorRef, closeMenu, openWindow,
	openTelescope, openCommandPalette, openShortcutHelp, handleShareDesktop,
}: {
	readonly isOpen: boolean;
	readonly anchorRef: React.RefObject<HTMLSpanElement | null>;
	readonly closeMenu: () => void;
	readonly openWindow: (appId: AppId) => string;
	readonly openTelescope: () => void;
	readonly openCommandPalette: () => void;
	readonly openShortcutHelp: () => void;
	readonly handleShareDesktop: () => void;
}) {
	return (
		<MenuBarDropdown isOpen={isOpen} onClose={closeMenu} anchorRef={anchorRef}>
			<div className="py-1">
				<MenuItem label="About place.org" onClick={() => { openWindow('about-place' as AppId); closeMenu(); }} />
				<MenuItem label="About Trajan" onClick={() => { openWindow('about-trajan' as AppId); closeMenu(); }} />
				<MenuDivider />
				<MenuItem label="Telescope" shortcut="Ctrl+K" onClick={() => { openTelescope(); closeMenu(); }} />
				<MenuItem label="Command Palette" onClick={() => { openCommandPalette(); closeMenu(); }} />
				<MenuItem label="Keyboard Shortcuts" shortcut="Ctrl+/" onClick={() => { openShortcutHelp(); closeMenu(); }} />
				<MenuDivider />
				<MenuItem label="Settings" onClick={() => { openWindow('settings' as AppId); closeMenu(); }} />
				<MenuDivider />
				<MenuItem label="Share Desktop" onClick={handleShareDesktop} />
				<MenuDivider />
				<MenuItem
					label="Log Out"
					danger
					onClick={() => {
						useAuthStore.getState().logout();
						window.location.reload();
					}}
				/>
			</div>
		</MenuBarDropdown>
	);
}

function ProcessesDropdown({
	isOpen, anchorRef, closeMenu, openApps, minimizedApps, windowList, focusWindow, closeWindow,
}: {
	readonly isOpen: boolean;
	readonly anchorRef: React.RefObject<HTMLSpanElement | null>;
	readonly closeMenu: () => void;
	readonly openApps: ReadonlyArray<{ id: string; appId: AppId }>;
	readonly minimizedApps: ReadonlyArray<{ id: string; appId: AppId }>;
	readonly windowList: ReadonlyArray<{ id: string; appId: AppId }>;
	readonly focusWindow: (id: string) => void;
	readonly closeWindow: (id: string) => void;
}) {
	return (
		<MenuBarDropdown isOpen={isOpen} onClose={closeMenu} anchorRef={anchorRef}>
			<div className="py-1" style={{ minWidth: '240px' }}>
				{openApps.length > 0 && (
					<>
						<MenuSection label="Running" />
						{openApps.map((w) => (
							<MenuItem key={w.id} label={APP_LABELS[w.appId]} value="active" accent onClick={() => { focusWindow(w.id); closeMenu(); }} />
						))}
					</>
				)}
				{minimizedApps.length > 0 && (
					<>
						<MenuSection label="Minimized" />
						{minimizedApps.map((w) => (
							<MenuItem key={w.id} label={APP_LABELS[w.appId]} value="hidden" onClick={() => { focusWindow(w.id); closeMenu(); }} />
						))}
					</>
				)}
				{windowList.length === 0 && (
					<div className="px-3 py-3 text-center" style={{ fontSize: '0.7rem', color: 'var(--place-text-secondary)' }}>
						No apps running
					</div>
				)}
				{windowList.length > 0 && (
					<>
						<MenuDivider />
						<MenuItem label="Close All" danger onClick={() => { windowList.forEach((w) => closeWindow(w.id)); closeMenu(); }} />
					</>
				)}
			</div>
		</MenuBarDropdown>
	);
}

function WorkspacesDropdown({
	isOpen, anchorRef, closeMenu,
	savingWorkspace, setSavingWorkspace, saveError, setSaveError,
	workspaceName, setWorkspaceName, workspaceInputRef,
	commitWorkspaceSave, startWorkspaceSave,
	workspaceLayouts, workspaceLoad, workspaceRemove,
}: {
	readonly isOpen: boolean;
	readonly anchorRef: React.RefObject<HTMLSpanElement | null>;
	readonly closeMenu: () => void;
	readonly savingWorkspace: boolean;
	readonly setSavingWorkspace: (v: boolean) => void;
	readonly saveError: string | null;
	readonly setSaveError: (v: string | null) => void;
	readonly workspaceName: string;
	readonly setWorkspaceName: (v: string) => void;
	readonly workspaceInputRef: React.RefObject<HTMLInputElement | null>;
	readonly commitWorkspaceSave: () => void;
	readonly startWorkspaceSave: () => void;
	readonly workspaceLayouts: ReadonlyArray<{ id: string; name: string; windows: ReadonlyArray<unknown> }>;
	readonly workspaceLoad: (id: string) => void;
	readonly workspaceRemove: (id: string) => void;
}) {
	return (
		<MenuBarDropdown
			isOpen={isOpen}
			onClose={() => { closeMenu(); setSavingWorkspace(false); setSaveError(null); }}
			anchorRef={anchorRef}
		>
			<div className="py-1" style={{ minWidth: '240px' }}>
				{savingWorkspace ? (
					<div className="px-3 py-1.5">
						<input
							ref={workspaceInputRef}
							type="text"
							value={workspaceName}
							onChange={(e) => setWorkspaceName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') commitWorkspaceSave();
								if (e.key === 'Escape') { setSavingWorkspace(false); setSaveError(null); }
							}}
							placeholder="Workspace name..."
							className="w-full rounded px-2 py-1"
							style={{
								fontSize: '0.75rem',
								background: 'rgba(255,255,255,0.04)',
								border: '1px solid var(--place-border-default)',
								color: 'var(--place-text-primary)',
								outline: 'none',
							}}
						/>
						{saveError && (
							<div className="mt-1" style={{ fontSize: '0.65rem', color: 'var(--place-error)' }}>
								{saveError}
							</div>
						)}
					</div>
				) : (
					<MenuItem label="Save Current" shortcut="Ctrl+Shift+S" onClick={startWorkspaceSave} />
				)}
				<MenuDivider />
				<MenuSection label="Saved Layouts" />
				{workspaceLayouts.length === 0 && (
					<div className="px-3 py-3 text-center" style={{ fontSize: '0.7rem', color: 'var(--place-text-secondary)' }}>
						No saved workspaces
					</div>
				)}
				{workspaceLayouts.map((layout) => (
					<WorkspaceRow key={layout.id} layout={layout} workspaceLoad={workspaceLoad} workspaceRemove={workspaceRemove} closeMenu={closeMenu} />
				))}
			</div>
		</MenuBarDropdown>
	);
}

function WorkspaceRow({
	layout, workspaceLoad, workspaceRemove, closeMenu,
}: {
	readonly layout: { id: string; name: string; windows: ReadonlyArray<unknown> };
	readonly workspaceLoad: (id: string) => void;
	readonly workspaceRemove: (id: string) => void;
	readonly closeMenu: () => void;
}) {
	return (
		<div
			className="flex items-center justify-between gap-1 px-3 py-1.5 transition-colors"
			style={{ fontSize: '0.75rem' }}
			onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
			onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
		>
			<button
				type="button"
				className="flex-1 text-left truncate"
				style={{ background: 'none', border: 'none', color: 'var(--place-text-primary)', cursor: 'default', fontSize: '0.75rem', padding: 0 }}
				onClick={() => { workspaceLoad(layout.id); closeMenu(); }}
				title={`${layout.windows.length} window${layout.windows.length === 1 ? '' : 's'}`}
			>
				{layout.name}
				<span className="ml-1.5" style={{ fontSize: '0.6rem', color: 'var(--place-text-secondary)' }}>
					({layout.windows.length})
				</span>
			</button>
			<button
				type="button"
				className="flex-shrink-0 rounded"
				style={{ background: 'none', border: 'none', color: 'var(--place-text-secondary)', cursor: 'default', fontSize: '0.7rem', padding: '0 4px', lineHeight: 1 }}
				onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--place-error)'; }}
				onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--place-text-secondary)'; }}
				onClick={(e) => { e.stopPropagation(); workspaceRemove(layout.id); }}
				title="Delete workspace"
			>
				✕
			</button>
		</div>
	);
}

function ClockDropdown({
	isOpen, anchorRef, closeMenu, now, weather, openWindow,
}: {
	readonly isOpen: boolean;
	readonly anchorRef: React.RefObject<HTMLSpanElement | null>;
	readonly closeMenu: () => void;
	readonly now: Date;
	readonly weather: { error: boolean; temp: number | null; icon: string; description: string };
	readonly openWindow: (appId: AppId) => string;
}) {
	return (
		<MenuBarDropdown isOpen={isOpen} onClose={closeMenu} anchorRef={anchorRef} align="center">
			<div className="py-2 px-3" style={{ minWidth: '220px' }}>
				<div className="text-center pb-2" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--place-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
					{formatTime(now)}
				</div>
				<div className="text-center pb-2" style={{ fontSize: '0.75rem', color: 'var(--place-text-secondary)' }}>
					{formatDate(now)}
				</div>
				{!weather.error && weather.temp !== null && (
					<>
						<MenuDivider />
						<div className="pt-1 flex flex-col gap-1">
							<div className="flex items-center justify-between">
								<span style={{ fontSize: '0.7rem', color: 'var(--place-text-secondary)' }}>Weather</span>
								<span style={{ fontSize: '0.85rem' }}>{weather.icon} {weather.temp}°F</span>
							</div>
							<div style={{ fontSize: '0.65rem', color: 'var(--place-text-secondary)' }}>{weather.description}</div>
						</div>
					</>
				)}
				<MenuDivider />
				<MenuItem label="Open Clock" onClick={() => { openWindow('clock' as AppId); closeMenu(); }} />
				<MenuItem label="Open Calendar" onClick={() => { openWindow('calendar' as AppId); closeMenu(); }} />
			</div>
		</MenuBarDropdown>
	);
}

function StatusDropdown({
	isOpen, anchorRef, closeMenu, todayFocusMs, elapsedMs, isRunning, inboxCount, openWindow,
}: {
	readonly isOpen: boolean;
	readonly anchorRef: React.RefObject<HTMLSpanElement | null>;
	readonly closeMenu: () => void;
	readonly todayFocusMs: number;
	readonly elapsedMs: number;
	readonly isRunning: boolean;
	readonly inboxCount: number;
	readonly openWindow: (appId: AppId) => string;
}) {
	return (
		<MenuBarDropdown isOpen={isOpen} onClose={closeMenu} anchorRef={anchorRef} align="right">
			<div className="py-1" style={{ minWidth: '220px' }}>
				<MenuSection label="Focus" />
				<MenuItem label="Today's Focus" value={formatMs(todayFocusMs) || '0m'} />
				{isRunning && <MenuItem label="Current Session" value={formatMs(elapsedMs)} accent />}
				<MenuItem label="Open Focus Timer" onClick={() => { openWindow('focus' as AppId); closeMenu(); }} />
				<MenuDivider />
				<MenuSection label="Inbox" />
				<MenuItem label="Unprocessed Items" value={`${inboxCount}`} />
				<MenuItem label="Open Brain Dump" onClick={() => { openWindow('brain-dump' as AppId); closeMenu(); }} />
				<MenuDivider />
				<MenuSection label="Quick Actions" />
				<MenuItem label="New Task" onClick={() => { openWindow('tasks' as AppId); closeMenu(); }} />
				<MenuItem label="New Journal Entry" onClick={() => { openWindow('journal' as AppId); closeMenu(); }} />
				<MenuItem
					label="Quick Capture"
					shortcut="Ctrl+Shift+C"
					onClick={() => { useDesktopStore.getState().openQuickCapture(); closeMenu(); }}
				/>
			</div>
		</MenuBarDropdown>
	);
}
