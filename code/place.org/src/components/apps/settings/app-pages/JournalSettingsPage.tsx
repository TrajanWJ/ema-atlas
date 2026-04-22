'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const MODE_OPTS = [
	{ value: 'write', label: 'Write' },
	{ value: 'split', label: 'Split' },
	{ value: 'preview', label: 'Preview' },
];
const FONT_OPTS = [
	{ value: 'system', label: 'System' },
	{ value: 'serif', label: 'Serif' },
	{ value: 'mono', label: 'Mono' },
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

export function JournalSettingsPage() {
	const s = useSettingsStore((st) => st.app.journal);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="📓" title="Journal" description="Editor mode, templates, and daily writing reminders">
			<div style={{ padding: '1rem' }}>
				<Section title="Editor">
					<SettingRow label="Default mode">
						<SegmentedControl options={MODE_OPTS} value={s.defaultMode}
							onChange={(v) => set('journal', 'defaultMode', v as typeof s.defaultMode)} />
					</SettingRow>
					<SettingRow label="Font">
						<SegmentedControl options={FONT_OPTS} value={s.font}
							onChange={(v) => set('journal', 'font', v as typeof s.font)} />
					</SettingRow>
					<ToggleWithSub enabled={s.spellCheck}
						onToggle={(v) => set('journal', 'spellCheck', v)}
						label="Spell check" description="Underline spelling errors while writing" />
				</Section>

				<Section title="Daily Template">
					<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
						<div style={{ fontSize: '0.75rem', color: 'var(--place-text-primary)' }}>Template</div>
						<textarea
							value={s.template}
							onChange={(e) => set('journal', 'template', e.target.value)}
							rows={5}
							style={{
								...INPUT_STYLE,
								width: '100%',
								resize: 'vertical',
								fontFamily: 'monospace',
								lineHeight: 1.5,
							}}
							placeholder="## Today's entry&#10;&#10;**One thing:** &#10;&#10;**Notes:**"
						/>
					</div>
					<ToggleWithSub enabled={s.showMoodPicker}
						onToggle={(v) => set('journal', 'showMoodPicker', v)}
						label="Show mood picker" description="Display mood tracker at the top of each entry" />
					<ToggleWithSub enabled={s.showOneThing}
						onToggle={(v) => set('journal', 'showOneThing', v)}
						label="Show one thing" description="Prompt for your single most important task today" />
				</Section>

				<Section title="Reminders">
					<ToggleWithSub enabled={s.reminder}
						onToggle={(v) => set('journal', 'reminder', v)}
						label="Daily reminder" description="Remind you to write in your journal each day">
						<SettingRow label="Reminder time">
							<input
								type="time"
								value={s.reminderTime}
								onChange={(e) => set('journal', 'reminderTime', e.target.value)}
								style={INPUT_STYLE}
							/>
						</SettingRow>
					</ToggleWithSub>
				</Section>
			</div>
		</SettingsPage>
	);
}
