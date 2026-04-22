'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const MODE_OPTS = [
	{ value: 'basic', label: 'Basic' },
	{ value: 'scientific', label: 'Scientific' },
	{ value: 'programmer', label: 'Programmer' },
];

export function CalculatorSettingsPage() {
	const s = useSettingsStore((st) => st.app.calculator);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="🔢" title="Calculator" description="Default mode and number display preferences">
			<div style={{ padding: '1rem' }}>
				<Section title="Mode">
					<SettingRow label="Default mode">
						<SegmentedControl options={MODE_OPTS} value={s.defaultMode}
							onChange={(v) => set('calculator', 'defaultMode', v as typeof s.defaultMode)} />
					</SettingRow>
				</Section>

				<Section title="Display">
					<ToggleWithSub enabled={s.thousandsSeparator}
						onToggle={(v) => set('calculator', 'thousandsSeparator', v)}
						label="Thousands separator" description="Show commas in large numbers (e.g. 1,000,000)" />
					<RangeSlider min={0} max={10} step={1} value={s.decimalPlaces}
						onChange={(v) => set('calculator', 'decimalPlaces', v)}
						label="Decimal places" showValue formatValue={(v) => `${v}`} />
					<ToggleWithSub enabled={s.showHistory}
						onToggle={(v) => set('calculator', 'showHistory', v)}
						label="Show history" description="Display a calculation history panel" />
				</Section>
			</div>
		</SettingsPage>
	);
}
