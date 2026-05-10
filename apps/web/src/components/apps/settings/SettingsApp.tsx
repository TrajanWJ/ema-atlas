'use client';

import { useState } from 'react';
import type { ComponentType } from 'react';
import { SettingsSidebar } from './SettingsSidebar';
import { ColorsPage } from './pages/ColorsPage';
import { WallpaperPage } from './pages/WallpaperPage';
import { GlassPage } from './pages/GlassPage';
import { TypographyPage } from './pages/TypographyPage';
import { AnimationsPage } from './pages/AnimationsPage';
import { ThemesPage } from './pages/ThemesPage';
import { DockPage } from './pages/DockPage';
import { WindowsPage } from './pages/WindowsPage';
import { DesktopPage } from './pages/DesktopPage';
import { LauncherPage } from './pages/LauncherPage';
import { SoundPage } from './pages/SoundPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { DataPage } from './pages/DataPage';
import { AboutPage } from './pages/AboutPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { DaemonPage } from './pages/DaemonPage';
import { IdentityPage } from './pages/IdentityPage';
import { FocusSettingsPage } from './app-pages/FocusSettingsPage';
import { TasksSettingsPage } from './app-pages/TasksSettingsPage';
import { JournalSettingsPage } from './app-pages/JournalSettingsPage';
import { HabitsSettingsPage } from './app-pages/HabitsSettingsPage';
import { BrainDumpSettingsPage } from './app-pages/BrainDumpSettingsPage';
import { NotesSettingsPage } from './app-pages/NotesSettingsPage';
import { MusicSettingsPage } from './app-pages/MusicSettingsPage';
import { TerminalSettingsPage } from './app-pages/TerminalSettingsPage';
import { FinderSettingsPage } from './app-pages/FinderSettingsPage';
import { CalculatorSettingsPage } from './app-pages/CalculatorSettingsPage';
import { ClockSettingsPage } from './app-pages/ClockSettingsPage';
import { SystemMonitorSettingsPage } from './app-pages/SystemMonitorSettingsPage';
import { PipesSettingsPage } from './app-pages/PipesSettingsPage';

const PAGE_MAP: Record<string, { icon: string; title: string }> = {
	colors: { icon: '🎨', title: 'Colors' },
	wallpaper: { icon: '🖼️', title: 'Wallpaper' },
	glass: { icon: '✨', title: 'Glass & Blur' },
	typography: { icon: '🔤', title: 'Typography' },
	animations: { icon: '🎬', title: 'Animations' },
	themes: { icon: '🌙', title: 'Themes' },
	dock: { icon: '⬇️', title: 'Dock' },
	windows: { icon: '🪟', title: 'Windows' },
	desktop: { icon: '🖥️', title: 'Desktop' },
	launcher: { icon: '🚀', title: 'Launcher' },
	sound: { icon: '🔊', title: 'Sound' },
	notifications: { icon: '🔔', title: 'Notifications' },
	data: { icon: '💾', title: 'Data & Storage' },
	about: { icon: 'ℹ️', title: 'About' },
	workspace: { icon: '🏢', title: 'Workspace' },
	daemon: { icon: '🛰️', title: 'Daemon' },
	identity: { icon: '🔑', title: 'Identity' },
	'app-focus': { icon: '🎯', title: 'Focus' },
	'app-tasks': { icon: '✅', title: 'Tasks' },
	'app-journal': { icon: '📓', title: 'Journal' },
	'app-habits': { icon: '🔁', title: 'Habits' },
	'app-braindump': { icon: '🧠', title: 'Brain Dump' },
	'app-notes': { icon: '📝', title: 'Notes' },
	'app-music': { icon: '🎵', title: 'Music' },
	'app-terminal': { icon: '💻', title: 'Terminal' },
	'app-finder': { icon: '📂', title: 'Finder' },
	'app-calculator': { icon: '🔢', title: 'Calculator' },
	'app-clock': { icon: '🕐', title: 'Clock' },
	'app-sysmon': { icon: '📊', title: 'System Monitor' },
	'app-pipes': { icon: '🔗', title: 'Pipes' },
};

const PAGE_COMPONENTS: Record<string, ComponentType> = {
	colors: ColorsPage,
	wallpaper: WallpaperPage,
	glass: GlassPage,
	typography: TypographyPage,
	animations: AnimationsPage,
	themes: ThemesPage,
	dock: DockPage,
	windows: WindowsPage,
	desktop: DesktopPage,
	launcher: LauncherPage,
	sound: SoundPage,
	notifications: NotificationsPage,
	data: DataPage,
	about: AboutPage,
	workspace: WorkspacePage,
	daemon: DaemonPage,
	identity: IdentityPage,
	'app-focus': FocusSettingsPage,
	'app-tasks': TasksSettingsPage,
	'app-journal': JournalSettingsPage,
	'app-habits': HabitsSettingsPage,
	'app-braindump': BrainDumpSettingsPage,
	'app-notes': NotesSettingsPage,
	'app-music': MusicSettingsPage,
	'app-terminal': TerminalSettingsPage,
	'app-finder': FinderSettingsPage,
	'app-calculator': CalculatorSettingsPage,
	'app-clock': ClockSettingsPage,
	'app-sysmon': SystemMonitorSettingsPage,
	'app-pipes': PipesSettingsPage,
};

export function SettingsApp() {
	const [activePage, setActivePage] = useState('colors');

	const PageComponent = PAGE_COMPONENTS[activePage];

	return (
		<div data-app="settings" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			{/* Live preview strip */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '0.4rem',
					padding: '0.25rem 0.75rem',
					borderBottom: '1px solid var(--place-border-default)',
					background: 'var(--place-surface-2)',
					flexShrink: 0,
				}}
			>
				<span
					style={{
						width: '6px',
						height: '6px',
						borderRadius: '50%',
						background: '#22c55e',
						flexShrink: 0,
						animation: 'pulse 2s ease-in-out infinite',
					}}
				/>
				<span
					style={{
						fontSize: '0.62rem',
						color: 'var(--place-text-muted)',
						letterSpacing: '0.02em',
					}}
				>
					Live Preview — Changes apply instantly
				</span>
			</div>

			{/* Main layout: sidebar + detail */}
			<div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
				<SettingsSidebar
					activePage={activePage}
					onNavigate={setActivePage}
				/>
				<div style={{ flex: 1, overflowY: 'auto' }}>
					{PageComponent && <PageComponent />}
				</div>
			</div>
		</div>
	);
}
