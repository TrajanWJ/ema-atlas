'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const VIEW_OPTS = [
	{ value: 'daily', label: 'Daily' },
	{ value: 'week', label: 'Week' },
	{ value: 'month', label: 'Month' },
	{ value: 'streaks', label: 'Streaks' },
];
const WEEK_START_OPTS = [
	{ value: 'monday', label: 'Monday' },
	{ value: 'sunday', label: 'Sunday' },
];

const INPUT_STYLE = {
	fontSize: '0.75rem',
	padding: '4px 8px',
	borderRadius: '6px',
	border: '1px solid var(--place-border-default)',
	background: 'var(--place-surface-2)',
	color: 'var(--place-text-primary)',
	outline: 'none',
} as const;

export function HabitsSettingsPage() {
	const s = useSettingsStore((st) => st.app.habits);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="🔁" title="Habits" description="View preferences, streaks, and reset timing">
			<div style={{ padding: '1rem' }}>
				<Section title="Display">
					<SettingRow label="Default view">
						<SegmentedControl options={VIEW_OPTS} value={s.defaultView}
							onChange={(v) => set('habits', 'defaultView', v as typeof s.defaultView)} />
					</SettingRow>
					<SettingRow label="Week starts on">
						<SegmentedControl options={WEEK_START_OPTS} value={s.weekStart}
							onChange={(v) => set('habits', 'weekStart', v as typeof s.weekStart)} />
					</SettingRow>
					<ToggleWithSub enabled={s.streakAnimations}
						onToggle={(v) => set('habits', 'streakAnimations', v)}
						label="Streak animations" description="Play animations when streaks are extended" />
				</Section>

				<Section title="Behavior">
					<SettingRow label="Day resets at">
						<input
							type="time"
							value={s.dayResetTime}
							onChange={(e) => set('habits', 'dayResetTime', e.target.value)}
							style={INPUT_STYLE}
						/>
					</SettingRow>
					<ToggleWithSub enabled={s.allowBackfill}
						onToggle={(v) => set('habits', 'allowBackfill', v)}
						label="Allow backfill" description="Let you check off habits for past days" />
					<ToggleWithSub enabled={s.reminder}
						onToggle={(v) => set('habits', 'reminder', v)}
						label="Daily reminder" description="Remind you to log habits each day">
						<SettingRow label="Reminder time">
							<input
								type="time"
								value={s.reminderTime}
								onChange={(e) => set('habits', 'reminderTime', e.target.value)}
								style={INPUT_STYLE}
							/>
						</SettingRow>
					</ToggleWithSub>
				</Section>
			</div>
		</SettingsPage>
	);
}
