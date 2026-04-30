'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from './shared';
import type { AppId } from '@/src/types/window';

const NOTIFICATION_POSITIONS = [
	{ id: 'top-left' as const, label: 'Top Left' },
	{ id: 'top-right' as const, label: 'Top Right' },
	{ id: 'bottom-left' as const, label: 'Bottom Left' },
	{ id: 'bottom-right' as const, label: 'Bottom Right' },
];

const APP_LIST: Array<{ id: AppId; label: string }> = [
	{ id: 'focus', label: 'Focus' },
	{ id: 'tasks', label: 'Tasks' },
	{ id: 'journal', label: 'Journal' },
	{ id: 'habits', label: 'Habits' },
	{ id: 'brain-dump', label: 'Brain Dump' },
	{ id: 'music', label: 'Music' },
];

export function NotificationsPage() {
	const notificationBadges = useSettingsStore((s) => s.notificationBadges);
	const notificationPosition = useSettingsStore((s) => s.notificationPosition);
	const notificationApps = useSettingsStore((s) => s.notificationApps);
	const setSetting = useSettingsStore((s) => s.setSetting);

	function toggleApp(appId: AppId, enabled: boolean) {
		setSetting('notificationApps', { ...notificationApps, [appId]: enabled });
	}

	return (
		<SettingsPage icon="🔔" title="Notifications" description="Control which apps can send you notifications">
			<div style={{ padding: '1rem' }}>
				<Section title="Global">
					<ToggleWithSub
						enabled={notificationBadges}
						onToggle={(v) => setSetting('notificationBadges', v)}
						label="Notification badges"
						description="Show unread count badges on dock icons"
					/>
				</Section>

				<Section title="Position">
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
						{NOTIFICATION_POSITIONS.map((pos) => (
							<button
								key={pos.id}
								type="button"
								onClick={() => setSetting('notificationPosition', pos.id)}
								style={{
									padding: '8px 6px',
									fontSize: '0.65rem',
									borderRadius: '6px',
									border: notificationPosition === pos.id
										? '1px solid var(--place-primary-400)'
										: '1px solid var(--place-border-default)',
									background: notificationPosition === pos.id
										? 'var(--place-primary-subtle)'
										: 'var(--place-surface-3)',
									color: notificationPosition === pos.id
										? 'var(--place-primary-400)'
										: 'var(--place-text-primary)',
									cursor: 'pointer',
									textAlign: 'center',
								}}
							>
								{pos.label}
							</button>
						))}
					</div>
				</Section>

				<Section title="Per-App">
					{APP_LIST.map((app) => {
						const enabled = notificationApps[app.id] !== false;
						return (
							<ToggleWithSub
								key={app.id}
								enabled={enabled}
								onToggle={(v) => toggleApp(app.id, v)}
								label={app.label}
							/>
						);
					})}
				</Section>
			</div>
		</SettingsPage>
	);
}
