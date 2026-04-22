'use client';

import { useMemo } from 'react';
import { SettingsPage } from '../SettingsPage';
import { Section } from './shared';

const APP_VERSION = '0.1.0';

const TECH_STACK = [
	{ name: 'Next.js 15', role: 'App framework' },
	{ name: 'React 19', role: 'UI library' },
	{ name: 'TypeScript', role: 'Language' },
	{ name: 'Tailwind CSS', role: 'Styling' },
	{ name: 'Zustand', role: 'State management' },
	{ name: 'wa-sqlite', role: 'In-browser SQLite' },
	{ name: 'Motion', role: 'Animations' },
	{ name: 'Biome', role: 'Lint & format' },
];

interface Capability {
	label: string;
	check: () => boolean;
}

const CAPABILITIES: Capability[] = [
	{ label: 'Service Worker', check: () => 'serviceWorker' in navigator },
	{ label: 'WebAssembly', check: () => typeof WebAssembly !== 'undefined' },
	{ label: 'IndexedDB', check: () => typeof indexedDB !== 'undefined' },
	{ label: 'Web Locks API', check: () => 'locks' in navigator },
	{ label: 'Storage API', check: () => 'storage' in navigator },
	{ label: 'Notification API', check: () => 'Notification' in window },
	{ label: 'WakeLock API', check: () => 'wakeLock' in navigator },
	{ label: 'Pointer Events', check: () => 'PointerEvent' in window },
];

function CapabilityDot({ supported }: { supported: boolean }) {
	return (
		<span
			style={{
				display: 'inline-block',
				width: '8px',
				height: '8px',
				borderRadius: '50%',
				background: supported ? '#22c55e' : '#ef4444',
				marginRight: '6px',
				flexShrink: 0,
			}}
		/>
	);
}

export function AboutPage() {
	const caps = useMemo(() => {
		if (typeof window === 'undefined') {
			return CAPABILITIES.map((c) => ({ ...c, supported: false }));
		}
		return CAPABILITIES.map((c) => {
			try {
				return { ...c, supported: c.check() };
			} catch {
				return { ...c, supported: false };
			}
		});
	}, []);

	const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
	const nav = typeof navigator !== 'undefined' ? navigator : null;
	const navAny = nav as (Navigator & { userAgentData?: { platform?: string } }) | null;
	const platform = navAny?.userAgentData?.platform ?? navAny?.platform ?? 'Unknown';

	return (
		<SettingsPage icon="ℹ️" title="About" description="Version information and system capabilities">
			<div style={{ padding: '1rem' }}>
				<Section title="Version">
					<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span style={{ fontSize: '0.75rem', color: 'var(--place-text-secondary)' }}>place.org</span>
							<span style={{ fontSize: '0.75rem', color: 'var(--place-text-primary)', fontWeight: 600 }}>v{APP_VERSION}</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span style={{ fontSize: '0.7rem', color: 'var(--place-text-muted)' }}>Build</span>
							<span style={{ fontSize: '0.7rem', color: 'var(--place-text-tertiary)', fontFamily: 'monospace' }}>
								{typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BUILD_ID
									? process.env.NEXT_PUBLIC_BUILD_ID
									: 'development'}
							</span>
						</div>
					</div>
				</Section>

				<Section title="Tech Stack">
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '4px',
						}}
					>
						{TECH_STACK.map((t) => (
							<div
								key={t.name}
								style={{
									display: 'flex',
									flexDirection: 'column',
									padding: '6px 8px',
									borderRadius: '6px',
									background: 'var(--place-surface-2)',
									border: '1px solid var(--place-border-subtle)',
								}}
							>
								<span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--place-text-primary)' }}>
									{t.name}
								</span>
								<span style={{ fontSize: '0.6rem', color: 'var(--place-text-muted)', marginTop: '1px' }}>
									{t.role}
								</span>
							</div>
						))}
					</div>
				</Section>

				<Section title="Browser Capabilities">
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
						{caps.map((cap) => (
							<div
								key={cap.label}
								style={{
									display: 'flex',
									alignItems: 'center',
									fontSize: '0.68rem',
									color: cap.supported ? 'var(--place-text-primary)' : 'var(--place-text-muted)',
								}}
							>
								<CapabilityDot supported={cap.supported} />
								{cap.label}
							</div>
						))}
					</div>
				</Section>

				<Section title="Device">
					<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span style={{ fontSize: '0.68rem', color: 'var(--place-text-muted)' }}>Platform</span>
							<span style={{ fontSize: '0.68rem', color: 'var(--place-text-secondary)', fontFamily: 'monospace' }}>
								{platform}
							</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span style={{ fontSize: '0.68rem', color: 'var(--place-text-muted)' }}>Viewport</span>
							<span style={{ fontSize: '0.68rem', color: 'var(--place-text-secondary)', fontFamily: 'monospace' }}>
								{typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '—'}
							</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span style={{ fontSize: '0.68rem', color: 'var(--place-text-muted)' }}>DPR</span>
							<span style={{ fontSize: '0.68rem', color: 'var(--place-text-secondary)', fontFamily: 'monospace' }}>
								{typeof window !== 'undefined' ? window.devicePixelRatio : '—'}
							</span>
						</div>
					</div>
				</Section>
			</div>
		</SettingsPage>
	);
}
