'use client';

import { motion } from 'motion/react';

// --- Section Components ---

function Header() {
	return (
		<div className="mb-6 text-center">
			<motion.h1
				className="mb-2 text-2xl font-bold"
				style={{ color: 'var(--place-text-primary)' }}
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				Welcome to place.org
			</motion.h1>
			<p
				className="text-sm leading-relaxed"
				style={{ color: 'var(--place-text-secondary)' }}
			>
				A browser-based desktop OS and personal workspace.
				Everything runs locally in your browser — no server, no
				tracking, just you and your tools.
			</p>
		</div>
	);
}

function HowItWorks() {
	const features = [
		{ icon: '🪟', title: 'Windowed Apps', desc: 'Drag, resize, minimize — just like a real desktop' },
		{ icon: '💾', title: 'Local-First SQLite', desc: 'Your data stays in-browser via WASM-powered SQLite' },
		{ icon: '⌨️', title: 'Keyboard-Driven', desc: 'Cmd+K for command palette, shortcuts for everything' },
		{ icon: '🎨', title: 'Living Design', desc: 'Glass morphism aesthetic that evolves over time' },
	] as const;

	return (
		<Section title="How It Works">
			<div className="grid grid-cols-2 gap-3">
				{features.map((f) => (
					<FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
				))}
			</div>
		</Section>
	);
}

function FeatureCard({
	icon,
	title,
	desc,
}: {
	readonly icon: string;
	readonly title: string;
	readonly desc: string;
}) {
	return (
		<div
			className="rounded-lg p-3"
			style={{
				background: 'var(--place-surface-1)',
				border: '1px solid var(--place-border-default)',
			}}
		>
			<div className="mb-1 text-lg">{icon}</div>
			<div
				className="mb-0.5 text-xs font-semibold"
				style={{ color: 'var(--place-text-primary)' }}
			>
				{title}
			</div>
			<div
				className="text-[11px] leading-snug"
				style={{ color: 'var(--place-text-secondary)' }}
			>
				{desc}
			</div>
		</div>
	);
}

function Philosophy() {
	return (
		<Section title="Philosophy">
			<p
				className="text-xs leading-relaxed"
				style={{ color: 'var(--place-text-secondary)' }}
			>
				The desktop metaphor isn't nostalgia — it's the best spatial
				interface ever designed for multitasking. Combined with
				local-first architecture, your data never leaves your browser.
				No accounts, no cloud sync, no telemetry. Just a workspace
				that respects your privacy and works offline.
			</p>
		</Section>
	);
}

const SHORTCUTS = [
	{ keys: '⌘ K', action: 'Command Palette' },
	{ keys: '⌘ J', action: 'Brain Dump' },
	{ keys: '⌘ .', action: 'Quick Capture' },
	{ keys: '⌘ /', action: 'Shortcut Help' },
	{ keys: '⌘ T', action: 'Terminal' },
	{ keys: 'Esc', action: 'Close Window' },
] as const;

function ShortcutsReference() {
	return (
		<Section title="Keyboard Shortcuts">
			<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
				{SHORTCUTS.map((s) => (
					<div key={s.keys} className="flex items-center justify-between">
						<span
							className="text-[11px]"
							style={{ color: 'var(--place-text-secondary)' }}
						>
							{s.action}
						</span>
						<kbd
							className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-mono"
							style={{
								background: 'var(--place-surface-1)',
								border: '1px solid var(--place-border-default)',
								color: 'var(--place-secondary-400)',
							}}
						>
							{s.keys}
						</kbd>
					</div>
				))}
			</div>
		</Section>
	);
}

function VersionFooter() {
	return (
		<div
			className="mt-4 pt-3 text-center text-[11px]"
			style={{
				borderTop: '1px solid var(--place-border-default)',
				color: 'var(--place-text-secondary)',
			}}
		>
			<span style={{ color: 'var(--place-secondary-400)' }}>place.org</span>
			{' '}v0.2.0 — Built with Next.js, React 19, Zustand, wa-sqlite, Motion
		</div>
	);
}

function Section({
	title,
	children,
}: {
	readonly title: string;
	readonly children: React.ReactNode;
}) {
	return (
		<div className="mb-4">
			<h2
				className="mb-2 text-xs font-semibold uppercase tracking-wider"
				style={{ color: 'var(--place-secondary-400)' }}
			>
				{title}
			</h2>
			{children}
		</div>
	);
}

// --- Main Component ---

export function AboutPlaceApp() {
	return (
		<div
			className="h-full overflow-y-auto p-5"
			style={{ color: 'var(--place-text-primary)' }}
		>
			<Header />
			<HowItWorks />
			<Philosophy />
			<ShortcutsReference />
			<VersionFooter />
		</div>
	);
}
