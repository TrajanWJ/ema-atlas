'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const CHART_OPTS = [
	{ value: 'line', label: 'Line' },
	{ value: 'bar', label: 'Bar' },
	{ value: 'gauge', label: 'Gauge' },
];

export function SystemMonitorSettingsPage() {
	const s = useSettingsStore((st) => st.app.systemMonitor);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="📊" title="System Monitor" description="Refresh rate, chart style, and menu bar integration">
			<div style={{ padding: '1rem' }}>
				<Section title="Display">
					<RangeSlider min={1} max={30} step={1} value={s.refreshInterval}
						onChange={(v) => set('systemMonitor', 'refreshInterval', v)}
						label="Refresh interval" showValue formatValue={(v) => `${v}s`} />
					<SettingRow label="Chart style">
						<SegmentedControl options={CHART_OPTS} value={s.chartStyle}
							onChange={(v) => set('systemMonitor', 'chartStyle', v as typeof s.chartStyle)} />
					</SettingRow>
				</Section>

				<Section title="Menu Bar">
					<ToggleWithSub enabled={s.showInMenuBar}
						onToggle={(v) => set('systemMonitor', 'showInMenuBar', v)}
						label="Show in menu bar" description="Display a compact CPU/RAM indicator in the menu bar" />
				</Section>
			</div>
		</SettingsPage>
	);
}
