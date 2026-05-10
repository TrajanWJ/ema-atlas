'use client';

import { SettingsPage } from '../SettingsPage';
import { Section, SettingRow } from './shared';
import { useIpcConnection } from '@/src/lib/ipc';
import { useEffect, useState } from 'react';

const DAEMON_URL = 'ws://127.0.0.1:49555';

type RuntimeReport = {
	readonly ok?: boolean;
	readonly app?: { readonly path?: string; readonly exists?: boolean };
	readonly static_bundle?: {
		readonly path?: string;
		readonly exists?: boolean;
		readonly popout_parity?: boolean;
	};
	readonly listeners?: {
		readonly daemon?: readonly unknown[];
		readonly web?: readonly unknown[];
		readonly companion?: readonly unknown[];
	};
	readonly stale_pidfiles?: {
		readonly daemon?: boolean;
		readonly web?: boolean;
	};
	readonly health?: {
		readonly daemon?: string;
		readonly web?: string;
		readonly companion?: string;
		readonly installed_app?: string;
	};
};

const STATE_COLORS: Record<string, string> = {
	idle: 'var(--place-text-muted)',
	connecting: 'var(--place-tertiary-400)',
	open: 'var(--place-primary-400)',
	offline: 'var(--place-secondary-400)',
	reconnecting: 'var(--place-tertiary-400)',
};

const STATE_DOTS: Record<string, string> = {
	idle: 'var(--place-text-muted)',
	connecting: 'var(--place-tertiary-400)',
	open: 'var(--place-primary-400)',
	offline: 'var(--place-secondary-400)',
	reconnecting: 'var(--place-tertiary-400)',
};

/**
 * Daemon settings — read-only view of the EMA daemon connection. The URL
 * is fixed in dev (`ws://127.0.0.1:49555`); the dot reflects the current
 * `useIpcConnection()` state.
 */
export function DaemonPage() {
	const state = useIpcConnection();
	const [report, setReport] = useState<RuntimeReport | null>(null);
	const [reportError, setReportError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetch('/api/runtime/report', { cache: 'no-store' })
			.then((response) => {
				if (!response.ok) throw new Error(`runtime report returned ${response.status}`);
				return response.json() as Promise<RuntimeReport>;
			})
			.then((next) => {
				if (!cancelled) setReport(next);
			})
			.catch((error: unknown) => {
				if (!cancelled) setReportError(error instanceof Error ? error.message : String(error));
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const tracks = buildRuntimeTracks(report, state);

	return (
		<SettingsPage
			icon="🛰️"
			title="Daemon"
			description="Runtime, daemon, companion, static bundle, and install health."
		>
			<div style={{ padding: '1rem' }}>
				<Section title="Connection">
					<SettingRow label="URL" description="Local daemon WebSocket endpoint">
						<span
							style={{
								fontSize: '0.7rem',
								color: 'var(--place-text-secondary)',
								fontFamily: 'monospace',
							}}
						>
							{DAEMON_URL}
						</span>
					</SettingRow>
					<SettingRow label="State">
						<span
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.4rem',
								fontSize: '0.72rem',
								color: STATE_COLORS[state] ?? 'var(--place-text-primary)',
								fontWeight: 500,
								textTransform: 'capitalize',
							}}
						>
							<span
								style={{
									width: '8px',
									height: '8px',
									borderRadius: '50%',
									background: STATE_DOTS[state] ?? 'var(--place-text-muted)',
									boxShadow:
										state === 'open'
											? '0 0 6px var(--place-primary-400)'
											: 'none',
								}}
							/>
							{state}
						</span>
					</SettingRow>
				</Section>

				<Section title="Runtime tracks">
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
							gap: '0.75rem',
						}}
					>
						{tracks.map((track) => (
							<div
								key={track.id}
								style={{
									border: '1px solid var(--place-border-default)',
									borderRadius: 10,
									padding: '0.75rem',
									background: 'var(--place-surface-2)',
									display: 'flex',
									flexDirection: 'column',
									gap: '0.35rem',
								}}
							>
								<strong style={{ fontSize: '0.75rem' }}>{track.id} · {track.label}</strong>
								<span
									style={{
										fontSize: '0.68rem',
										color: track.status === 'pass'
											? 'var(--place-success)'
											: track.status === 'warn'
												? 'var(--place-secondary-400)'
												: 'var(--place-error)',
									}}
								>
									{track.status}
								</span>
								<span style={{ fontSize: '0.68rem', color: 'var(--place-text-secondary)' }}>
									{track.evidence}
								</span>
								<code style={{ fontSize: '0.62rem', color: 'var(--place-text-muted)' }}>
									{track.next}
								</code>
							</div>
						))}
					</div>
					{reportError ? (
						<p style={{ color: 'var(--place-error)', fontSize: '0.68rem' }}>
							Runtime report unavailable: {reportError}
						</p>
					) : null}
				</Section>

				<Section title="Notes">
					<div
						style={{
							fontSize: '0.68rem',
							color: 'var(--place-text-muted)',
							lineHeight: 1.5,
						}}
					>
						Surfaces never embed truth. The daemon owns canon and pushes
						projections. If the dot is red the daemon is unreachable — surfaces
						fall back to staged projections so chrome keeps rendering.
					</div>
				</Section>
			</div>
		</SettingsPage>
	);
}

function buildRuntimeTracks(report: RuntimeReport | null, state: string) {
	const daemonUp = state === 'open' || report?.health?.daemon === 'up';
	const webUp = report?.health?.web === 'up';
	const staticReady = report?.static_bundle?.exists === true && report.static_bundle.popout_parity === true;
	const appPresent = report?.app?.exists === true;
	const stalePidfiles = report?.stale_pidfiles?.daemon === true || report?.stale_pidfiles?.web === true;
	return [
		{
			id: 'S1',
			label: 'Runtime Control Plane',
			status: daemonUp && webUp && !stalePidfiles ? 'pass' : 'warn',
			evidence: `daemon ${report?.health?.daemon ?? state}; web ${report?.health?.web ?? 'unknown'}`,
			next: 'pnpm runtime:report',
		},
		{
			id: 'S2',
			label: 'Static/Tauri Parity',
			status: staticReady && appPresent ? 'pass' : 'warn',
			evidence: `static ${report?.static_bundle?.exists ? 'present' : 'missing'}; popouts ${report?.static_bundle?.popout_parity ? 'ready' : 'missing'}`,
			next: 'pnpm build:web-static',
		},
		{
			id: 'S3',
			label: 'Settings System Center',
			status: report ? 'pass' : 'warn',
			evidence: report ? 'runtime report loaded in Settings' : 'waiting for report',
			next: 'curl http://localhost:5173/api/runtime/report',
		},
		{
			id: 'S4',
			label: 'Projection/API Health',
			status: daemonUp ? 'pass' : 'warn',
			evidence: `IPC ${state}`,
			next: 'ema cockpit projection --project proslync-app-ios-final --json',
		},
		{
			id: 'S5',
			label: 'Artifact Hygiene',
			status: stalePidfiles ? 'warn' : 'pass',
			evidence: stalePidfiles ? 'stale pidfile detected' : 'pidfiles match listeners or are absent',
			next: 'bash scripts/stop-ema-dev.sh',
		},
	] as const;
}
