'use client';

import { useEffect, useState } from 'react';

// ── Platform detection ──

type Platform = 'macos-arm' | 'macos-intel' | 'windows' | 'linux' | 'unknown';

function detectPlatform(): Platform {
	if (typeof navigator === 'undefined') return 'unknown';
	const ua = navigator.userAgent.toLowerCase();
	const pd = (navigator as unknown as Record<string, unknown>).userAgentData as
		| { platform?: string }
		| undefined;
	const platform = pd?.platform?.toLowerCase() ?? '';

	if (ua.includes('mac') || platform.includes('mac')) {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl');
		const ext = gl?.getExtension('WEBGL_debug_renderer_info');
		const renderer = ext
			? String(gl!.getParameter(ext.UNMASKED_RENDERER_WEBGL)).toLowerCase()
			: '';
		return renderer.includes('apple') ? 'macos-arm' : 'macos-intel';
	}
	if (ua.includes('win') || platform.includes('win')) return 'windows';
	if (ua.includes('linux')) return 'linux';
	return 'unknown';
}

// ── Constants ──

const REPO = 'TrajanWJ/place-companion';
const RELEASES_URL = `https://github.com/${REPO}/releases`;

interface PlatformInfo {
	readonly label: string;
	readonly icon: string;
	readonly filename: string;
	readonly steps: readonly string[];
	readonly note?: string;
}

const PLATFORMS: Record<Exclude<Platform, 'unknown'>, PlatformInfo> = {
	'macos-arm': {
		label: 'macOS (Apple Silicon)',
		icon: '\uF8FF',
		filename: 'place-companion_aarch64.dmg',
		steps: [
			'Open the DMG and drag to Applications',
			'On macOS Sequoia (15+): open System Settings > Privacy & Security, scroll down, click "Open Anyway" next to place-companion, then confirm',
			'On older macOS: right-click the app, click "Open", then "Open" again',
			'A menu bar icon appears — the companion runs silently in the background with no dock icon',
		],
		note: 'This is a one-time setup. macOS blocks apps from unidentified developers by default — the companion is open source and safe.',
	},
	'macos-intel': {
		label: 'macOS (Intel)',
		icon: '\uF8FF',
		filename: 'place-companion_x64.dmg',
		steps: [
			'Open the DMG and drag to Applications',
			'On macOS Sequoia (15+): open System Settings > Privacy & Security, scroll down, click "Open Anyway" next to place-companion, then confirm',
			'On older macOS: right-click the app, click "Open", then "Open" again',
			'A menu bar icon appears — the companion runs silently in the background with no dock icon',
		],
		note: 'This is a one-time setup. macOS blocks apps from unidentified developers by default — the companion is open source and safe.',
	},
	windows: {
		label: 'Windows 10/11',
		icon: '⊞',
		filename: 'place-companion_x64-setup.exe',
		steps: [
			'Run the installer — if SmartScreen appears, click "More info" then "Run anyway"',
			'A system tray icon appears (click the ^ arrow in the taskbar to find it)',
			'The companion auto-starts on boot and runs silently in the background',
		],
		note: 'Windows Firewall may prompt for network access — allow it. The companion only listens on localhost (never connects to the internet). Windows Defender may briefly flag the installer as "not commonly downloaded" — this is normal for new open-source apps.',
	},
	linux: {
		label: 'Linux',
		icon: '🐧',
		filename: 'place-companion_amd64.AppImage',
		steps: [
			'Download, then: chmod +x place-companion_*.AppImage && ./place-companion_*.AppImage',
			'A system tray icon appears (GNOME users: install the AppIndicator extension)',
			'To auto-start: add to your desktop environment\'s startup applications',
		],
		note: 'Requires WebKitGTK 4.1 (Ubuntu 22.04+, Fedora 36+). Transparency needs a compositor (KWin, Mutter, picom). On Wayland, dragging works on GNOME and KDE. Tiling WMs may need manual configuration for tray and autostart.',
	},
};

// ── Components ──

function FeatureCard({ icon, title, desc }: { readonly icon: string; readonly title: string; readonly desc: string }) {
	return (
		<div
			style={{
				padding: '20px',
				borderRadius: '12px',
				background: 'rgba(255,255,255,0.02)',
				border: '1px solid rgba(255,255,255,0.05)',
				textAlign: 'center',
			}}
		>
			<div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
			<div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
				{title}
			</div>
			<div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
				{desc}
			</div>
		</div>
	);
}

function DownloadButton({ info, primary }: { readonly info: PlatformInfo; readonly primary: boolean }) {
	return (
		<a
			href={`${RELEASES_URL}/latest`}
			target="_blank"
			rel="noopener noreferrer"
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '14px',
				padding: primary ? '18px 28px' : '14px 20px',
				borderRadius: '12px',
				background: primary
					? 'linear-gradient(135deg, rgba(45,212,168,0.12), rgba(96,165,250,0.12))'
					: 'rgba(255,255,255,0.025)',
				border: `1px solid ${primary ? 'rgba(45,212,168,0.25)' : 'rgba(255,255,255,0.06)'}`,
				textDecoration: 'none',
				color: 'inherit',
				transition: 'border-color 0.2s, background 0.2s',
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.borderColor = primary ? 'rgba(45,212,168,0.5)' : 'rgba(255,255,255,0.12)';
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.borderColor = primary ? 'rgba(45,212,168,0.25)' : 'rgba(255,255,255,0.06)';
			}}
		>
			<span style={{ fontSize: primary ? '24px' : '18px', flexShrink: 0 }}>{info.icon}</span>
			<div style={{ minWidth: 0 }}>
				<div style={{
					fontSize: primary ? '1rem' : '0.85rem',
					fontWeight: 600,
					color: primary ? 'rgba(45,212,168,0.9)' : 'rgba(255,255,255,0.7)',
				}}>
					{primary ? `Download for ${info.label}` : info.label}
				</div>
				<div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
					{info.filename}
				</div>
			</div>
		</a>
	);
}

function InstallSteps({ info }: { readonly info: PlatformInfo }) {
	return (
		<div style={{
			background: 'rgba(255,255,255,0.02)',
			border: '1px solid rgba(255,255,255,0.05)',
			borderRadius: '12px',
			padding: '20px 24px',
			marginTop: '16px',
		}}>
			<h3 style={{
				fontSize: '0.75rem',
				fontWeight: 600,
				color: 'rgba(255,255,255,0.45)',
				textTransform: 'uppercase',
				letterSpacing: '0.05em',
				margin: '0 0 12px',
			}}>
				Setup
			</h3>
			<ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
				{info.steps.map((step) => (
					<li key={step} style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
						{step}
					</li>
				))}
			</ol>
			{info.note && (
				<p style={{
					fontSize: '0.75rem',
					color: 'rgba(255,200,50,0.55)',
					marginTop: '14px',
					marginBottom: 0,
					lineHeight: 1.5,
					borderTop: '1px solid rgba(255,255,255,0.04)',
					paddingTop: '12px',
				}}>
					{info.note}
				</p>
			)}
		</div>
	);
}

// ── Main ──

export function CompanionDownload() {
	const [platform, setPlatform] = useState<Platform>('unknown');

	useEffect(() => {
		setPlatform(detectPlatform());
	}, []);

	const detected = platform !== 'unknown' ? PLATFORMS[platform] : null;
	const otherPlatforms = Object.entries(PLATFORMS).filter(([key]) => key !== platform);

	return (
		<div style={{ maxWidth: '640px', margin: '0 auto', padding: '60px 24px 120px' }}>

			{/* Hero */}
			<div style={{ textAlign: 'center', marginBottom: '48px' }}>
				<div style={{
					width: '64px',
					height: '64px',
					borderRadius: '16px',
					background: 'linear-gradient(135deg, rgba(45,212,168,0.15), rgba(96,165,250,0.15))',
					border: '1px solid rgba(45,212,168,0.12)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					margin: '0 auto 20px',
					fontSize: '28px',
				}}>
					&#xf0c8;
				</div>
				<h1 style={{
					fontSize: '1.8rem',
					fontWeight: 700,
					color: 'rgba(255,255,255,0.9)',
					margin: '0 0 10px',
					letterSpacing: '-0.02em',
				}}>
					place.org Companion
				</h1>
				<p style={{
					fontSize: '1rem',
					color: 'rgba(255,255,255,0.4)',
					margin: 0,
					lineHeight: 1.6,
					maxWidth: '440px',
					marginLeft: 'auto',
					marginRight: 'auto',
				}}>
					Pop out virtual apps as real transparent windows on your desktop.
					Works with any browser.
				</p>
			</div>

			{/* Features */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '48px' }}>
				<FeatureCard
					icon="&#x2728;"
					title="Transparent windows"
					desc="Glass effect with your desktop showing through"
				/>
				<FeatureCard
					icon="&#x1f4a4;"
					title="Runs silently"
					desc="Tiny tray icon, auto-starts, ~5 MB idle memory"
				/>
				<FeatureCard
					icon="&#x1f310;"
					title="Any browser"
					desc="Chrome, Firefox, Safari, Edge — all supported"
				/>
			</div>

			{/* How it works */}
			<div style={{
				background: 'rgba(255,255,255,0.02)',
				border: '1px solid rgba(255,255,255,0.05)',
				borderRadius: '12px',
				padding: '24px',
				marginBottom: '40px',
			}}>
				<h2 style={{
					fontSize: '0.8rem',
					fontWeight: 600,
					color: 'rgba(255,255,255,0.45)',
					textTransform: 'uppercase',
					letterSpacing: '0.05em',
					margin: '0 0 16px',
				}}>
					How it works
				</h2>
				<div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
					{[
						{ num: '1', text: 'Install the companion app. It starts as a system tray icon and auto-launches on boot.' },
						{ num: '2', text: 'Open place.org in any browser. The site detects the companion automatically.' },
						{ num: '3', text: 'Drag any window past the browser edge. It becomes a transparent native window on your real desktop.' },
					].map((s) => (
						<div key={s.num} style={{ flex: 1 }}>
							<div style={{
								width: '24px',
								height: '24px',
								borderRadius: '8px',
								background: 'rgba(45,212,168,0.1)',
								border: '1px solid rgba(45,212,168,0.15)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '0.7rem',
								fontWeight: 700,
								color: 'rgba(45,212,168,0.8)',
								marginBottom: '8px',
							}}>
								{s.num}
							</div>
							<p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
								{s.text}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* Primary download */}
			{detected && (
				<div style={{ marginBottom: '32px' }}>
					<DownloadButton info={detected} primary />
					<InstallSteps info={detected} />
				</div>
			)}

			{/* Other platforms */}
			<div style={{ marginTop: '36px' }}>
				<h2 style={{
					fontSize: '0.75rem',
					fontWeight: 600,
					color: 'rgba(255,255,255,0.3)',
					textTransform: 'uppercase',
					letterSpacing: '0.05em',
					marginBottom: '10px',
				}}>
					{detected ? 'Other platforms' : 'Download'}
				</h2>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
					{(detected ? otherPlatforms : Object.entries(PLATFORMS)).map(
						([key, info]) => <DownloadButton key={key} info={info} primary={!detected} />,
					)}
				</div>
			</div>

			{/* Technical details */}
			<div style={{
				marginTop: '48px',
				padding: '20px 24px',
				borderRadius: '12px',
				background: 'rgba(255,255,255,0.015)',
				border: '1px solid rgba(255,255,255,0.04)',
			}}>
				<h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>
					Technical details
				</h3>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '0.75rem' }}>
					{[
						['Built with', 'Tauri v2 (Rust)'],
						['Install size', '~5 MB'],
						['Memory usage', '~50 MB idle'],
						['Network', 'Localhost only (no internet)'],
						['Auto-start', 'Yes, on all platforms'],
						['Open source', 'MIT license'],
					].map(([label, value]) => (
						<div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
							<span style={{ color: 'rgba(255,255,255,0.55)' }}>{value}</span>
						</div>
					))}
				</div>
				<div style={{ display: 'flex', gap: '16px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
					<a href={`https://github.com/${REPO}`} target="_blank" rel="noopener noreferrer"
						style={{ fontSize: '0.75rem', color: 'rgba(96,165,250,0.65)', textDecoration: 'none' }}>
						Source code
					</a>
					<a href={RELEASES_URL} target="_blank" rel="noopener noreferrer"
						style={{ fontSize: '0.75rem', color: 'rgba(96,165,250,0.65)', textDecoration: 'none' }}>
						All releases
					</a>
				</div>
			</div>

			{/* Footer note */}
			<p style={{
				textAlign: 'center',
				fontSize: '0.7rem',
				color: 'rgba(255,255,255,0.2)',
				marginTop: '32px',
				lineHeight: 1.5,
			}}>
				The companion is completely optional — place.org works fully without it.
				<br />
				It just upgrades popout windows from browser popups to transparent native windows.
			</p>
		</div>
	);
}
