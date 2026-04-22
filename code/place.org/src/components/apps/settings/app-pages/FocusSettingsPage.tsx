'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const COMPLETE_SOUNDS = ['bell', 'chime', 'gong', 'digital', 'birds', 'none'];

const SELECT_STYLE = {
	width: '100%',
	fontSize: '0.75rem',
	padding: '6px 8px',
	borderRadius: '6px',
	border: '1px solid var(--place-border-default)',
	background: 'var(--place-surface-2)',
	color: 'var(--place-text-primary)',
	outline: 'none',
	cursor: 'pointer',
} as const;

export function FocusSettingsPage() {
	const s = useSettingsStore((st) => st.app.focus);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="🎯" title="Focus" description="Timer durations, sounds, and focus behavior">
			<div style={{ padding: '1rem' }}>
				<Section title="Timer Defaults">
					<RangeSlider min={5} max={120} step={1} value={s.defaultDuration}
						onChange={(v) => set('focus', 'defaultDuration', v)}
						label="Default duration" showValue formatValue={(v) => `${v}m`} />
					<RangeSlider min={1} max={30} step={1} value={s.defaultBreak}
						onChange={(v) => set('focus', 'defaultBreak', v)}
						label="Short break" showValue formatValue={(v) => `${v}m`} />
					<RangeSlider min={5} max={60} step={1} value={s.longBreak}
						onChange={(v) => set('focus', 'longBreak', v)}
						label="Long break" showValue formatValue={(v) => `${v}m`} />
					<RangeSlider min={2} max={8} step={1} value={s.sessionsBeforeLongBreak}
						onChange={(v) => set('focus', 'sessionsBeforeLongBreak', v)}
						label="Sessions before long break" showValue formatValue={(v) => `${v}`} />
				</Section>

				<Section title="Behavior">
					<ToggleWithSub enabled={s.autoStartBreaks}
						onToggle={(v) => set('focus', 'autoStartBreaks', v)}
						label="Auto-start breaks" description="Begin breaks automatically after each session" />
					<ToggleWithSub enabled={s.autoStartFocus}
						onToggle={(v) => set('focus', 'autoStartFocus', v)}
						label="Auto-start focus" description="Begin next session automatically after breaks" />
					<ToggleWithSub enabled={s.keepAwake}
						onToggle={(v) => set('focus', 'keepAwake', v)}
						label="Keep screen awake" description="Prevent display sleep during focus sessions" />
					<ToggleWithSub enabled={s.dimOtherWindows}
						onToggle={(v) => set('focus', 'dimOtherWindows', v)}
						label="Dim other windows" description="Reduce opacity of windows not in focus">
						<RangeSlider min={0.3} max={0.8} step={0.05} value={s.dimOpacity}
							onChange={(v) => set('focus', 'dimOpacity', v)}
							label="Dim opacity" showValue formatValue={(v) => `${Math.round(v * 100)}%`} />
					</ToggleWithSub>
				</Section>

				<Section title="Sounds">
					<SettingRow label="Completion sound">
						<select value={s.completeSound} onChange={(e) => set('focus', 'completeSound', e.target.value)}
							style={{ ...SELECT_STYLE, width: 'auto' }}>
							{COMPLETE_SOUNDS.map((snd) => (
								<option key={snd} value={snd}>{snd.charAt(0).toUpperCase() + snd.slice(1)}</option>
							))}
						</select>
					</SettingRow>
					<ToggleWithSub enabled={s.tickSound}
						onToggle={(v) => set('focus', 'tickSound', v)}
						label="Tick sound" description="Play a ticking sound during sessions">
						<RangeSlider min={0} max={1} step={0.05} value={s.tickVolume}
							onChange={(v) => set('focus', 'tickVolume', v)}
							label="Tick volume" showValue formatValue={(v) => `${Math.round(v * 100)}%`} />
					</ToggleWithSub>
				</Section>

				<Section title="Integrations">
					<ToggleWithSub enabled={s.linkTask}
						onToggle={(v) => set('focus', 'linkTask', v)}
						label="Link to task" description="Associate focus sessions with a task" />
					<ToggleWithSub enabled={s.autoJournal}
						onToggle={(v) => set('focus', 'autoJournal', v)}
						label="Auto journal" description="Create a journal entry at end of each session" />
				</Section>
			</div>
		</SettingsPage>
	);
}
