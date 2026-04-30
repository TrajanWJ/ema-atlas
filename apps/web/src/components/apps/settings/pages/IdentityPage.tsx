'use client';

import { useMemo } from 'react';
import { SettingsPage } from '../SettingsPage';
import { Section, SettingRow } from './shared';

const HOSTNAME_PLACEHOLDER = 'this machine';

function pickBrowserLabel(ua: string): string {
	if (/Edg\//.test(ua)) return 'Edge';
	if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
	if (/Firefox\//.test(ua)) return 'Firefox';
	if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
	return 'Unknown browser';
}

function pickPlatform(): string {
	if (typeof navigator === 'undefined') return 'Unknown';
	const navAny = navigator as Navigator & {
		userAgentData?: { platform?: string };
	};
	return navAny.userAgentData?.platform ?? navAny.platform ?? 'Unknown';
}

/**
 * Identity settings — machine identity for this surface session. Read-only
 * placeholder until the daemon owns device identity (see `device.registry`
 * projection, Wave II).
 */
export function IdentityPage() {
	const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
	const platform = useMemo(pickPlatform, []);
	const browser = useMemo(() => (ua ? pickBrowserLabel(ua) : 'Unknown'), [ua]);
	const uaShort = ua.length > 80 ? `${ua.slice(0, 80)}…` : ua;

	return (
		<SettingsPage
			icon="🔑"
			title="Identity"
			description="Machine identity for this surface session. Read-only."
		>
			<div style={{ padding: '1rem' }}>
				<Section title="Machine">
					<SettingRow label="Hostname">
						<span
							style={{
								fontSize: '0.72rem',
								color: 'var(--place-text-secondary)',
								fontFamily: 'monospace',
							}}
						>
							{HOSTNAME_PLACEHOLDER}
						</span>
					</SettingRow>
					<SettingRow label="Platform">
						<span
							style={{
								fontSize: '0.72rem',
								color: 'var(--place-text-secondary)',
								fontFamily: 'monospace',
							}}
						>
							{platform}
						</span>
					</SettingRow>
					<SettingRow label="Browser">
						<span
							style={{
								fontSize: '0.72rem',
								color: 'var(--place-text-secondary)',
								fontFamily: 'monospace',
							}}
						>
							{browser}
						</span>
					</SettingRow>
				</Section>

				<Section title="User agent">
					<div
						style={{
							fontSize: '0.65rem',
							color: 'var(--place-text-muted)',
							fontFamily: 'monospace',
							lineHeight: 1.5,
							wordBreak: 'break-all',
						}}
					>
						{uaShort || '—'}
					</div>
				</Section>

				<Section title="Notes">
					<div
						style={{
							fontSize: '0.68rem',
							color: 'var(--place-text-muted)',
							lineHeight: 1.5,
						}}
					>
						Real device identity lives in the daemon `device.registry`
						projection. Wave II wires registration, peer trust, and invites.
					</div>
				</Section>
			</div>
		</SettingsPage>
	);
}
