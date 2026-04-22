'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const FORMAT_OPTS = [
	{ value: 'markdown', label: 'Markdown' },
	{ value: 'plaintext', label: 'Plain' },
];
const FONT_OPTS = [
	{ value: 'system', label: 'System' },
	{ value: 'mono', label: 'Mono' },
	{ value: 'serif', label: 'Serif' },
];

export function NotesSettingsPage() {
	const s = useSettingsStore((st) => st.app.notes);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="📝" title="Notes" description="Auto-save, formatting, and editor preferences">
			<div style={{ padding: '1rem' }}>
				<Section title="Auto-Save">
					<ToggleWithSub enabled={s.autoSave}
						onToggle={(v) => set('notes', 'autoSave', v)}
						label="Auto-save" description="Save notes automatically while typing">
						<RangeSlider min={1} max={30} step={1} value={s.autoSaveInterval}
							onChange={(v) => set('notes', 'autoSaveInterval', v)}
							label="Interval" showValue formatValue={(v) => `${v}s`} />
					</ToggleWithSub>
				</Section>

				<Section title="Editor">
					<SettingRow label="Default format">
						<SegmentedControl options={FORMAT_OPTS} value={s.defaultFormat}
							onChange={(v) => set('notes', 'defaultFormat', v as typeof s.defaultFormat)} />
					</SettingRow>
					<SettingRow label="Font">
						<SegmentedControl options={FONT_OPTS} value={s.font}
							onChange={(v) => set('notes', 'font', v)} />
					</SettingRow>
					<ToggleWithSub enabled={s.wordWrap}
						onToggle={(v) => set('notes', 'wordWrap', v)}
						label="Word wrap" description="Wrap long lines at the editor edge" />
					<ToggleWithSub enabled={s.lineNumbers}
						onToggle={(v) => set('notes', 'lineNumbers', v)}
						label="Line numbers" description="Show line numbers in the gutter" />
				</Section>
			</div>
		</SettingsPage>
	);
}
