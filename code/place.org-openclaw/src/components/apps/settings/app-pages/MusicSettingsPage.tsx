'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const VISUALIZER_OPTS = [
	{ value: 'bars', label: 'Bars' },
	{ value: 'wave', label: 'Wave' },
	{ value: 'circular', label: 'Circle' },
	{ value: 'none', label: 'None' },
];

const INPUT_STYLE = {
	fontSize: '0.75rem',
	padding: '4px 8px',
	borderRadius: '6px',
	border: '1px solid var(--place-border-default)',
	background: 'var(--place-surface-2)',
	color: 'var(--place-text-primary)',
	outline: 'none',
	width: '160px',
} as const;

export function MusicSettingsPage() {
	const s = useSettingsStore((st) => st.app.music);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="🎵" title="Music" description="Playback defaults, focus integration, and visualizer">
			<div style={{ padding: '1rem' }}>
				<Section title="Playback">
					<SettingRow label="Default station">
						<input
							type="text"
							value={s.defaultStation}
							onChange={(e) => set('music', 'defaultStation', e.target.value)}
							placeholder="Station name or URL"
							style={INPUT_STYLE}
						/>
					</SettingRow>
					<ToggleWithSub enabled={s.crossfade}
						onToggle={(v) => set('music', 'crossfade', v)}
						label="Crossfade" description="Blend between tracks instead of cutting abruptly">
						<RangeSlider min={1} max={5} step={0.5} value={s.crossfadeDuration}
							onChange={(v) => set('music', 'crossfadeDuration', v)}
							label="Duration" showValue formatValue={(v) => `${v}s`} />
					</ToggleWithSub>
				</Section>

				<Section title="Focus Integration">
					<ToggleWithSub enabled={s.autoPlayOnFocus}
						onToggle={(v) => set('music', 'autoPlayOnFocus', v)}
						label="Auto-play on focus" description="Start music when a focus session begins" />
					<ToggleWithSub enabled={s.pauseOnBreak}
						onToggle={(v) => set('music', 'pauseOnBreak', v)}
						label="Pause on break" description="Pause music during break intervals" />
				</Section>

				<Section title="Visual">
					<SettingRow label="Visualizer">
						<SegmentedControl options={VISUALIZER_OPTS} value={s.visualizer}
							onChange={(v) => set('music', 'visualizer', v as typeof s.visualizer)} />
					</SettingRow>
				</Section>
			</div>
		</SettingsPage>
	);
}
