'use client';

import { SettingsPage } from '../SettingsPage';
import { Section, SettingRow } from './shared';
import { useIpcConnection } from '@/src/lib/ipc';

const DAEMON_URL = 'ws://127.0.0.1:49555';

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

	return (
		<SettingsPage
			icon="🛰️"
			title="Daemon"
			description="Connection to the local EMA daemon. Read-only."
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
