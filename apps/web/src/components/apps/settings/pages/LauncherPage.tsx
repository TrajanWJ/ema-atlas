'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from './shared';

const LAUNCHER_STYLE_OPTIONS = [
	{ value: 'spotlight', label: 'Spotlight' },
	{ value: 'fullscreen', label: 'Fullscreen' },
];

export function LauncherPage() {
	const launcherStyle = useSettingsStore((s) => s.launcherStyle);
	const launcherRecentCount = useSettingsStore((s) => s.launcherRecentCount);
	const launcherGridColumns = useSettingsStore((s) => s.launcherGridColumns);
	const launcherShowCategories = useSettingsStore((s) => s.launcherShowCategories);
	const setSetting = useSettingsStore((s) => s.setSetting);

	return (
		<SettingsPage icon="🚀" title="Launcher" description="Customize the app launcher appearance and behavior">
			<div style={{ padding: '1rem' }}>
				<Section title="Style">
					<SegmentedControl
						options={LAUNCHER_STYLE_OPTIONS}
						value={launcherStyle}
						onChange={(v) => setSetting('launcherStyle', v as typeof launcherStyle)}
					/>
				</Section>

				<Section title="Options">
					<RangeSlider
						min={0}
						max={8}
						step={1}
						value={launcherRecentCount}
						onChange={(v) => setSetting('launcherRecentCount', v)}
						showValue
						formatValue={(v) => (v === 0 ? 'Off' : String(v))}
						label="Recent apps shown"
					/>

					{launcherStyle === 'fullscreen' && (
						<RangeSlider
							min={3}
							max={8}
							step={1}
							value={launcherGridColumns}
							onChange={(v) => setSetting('launcherGridColumns', v)}
							showValue
							label="Grid columns"
						/>
					)}

					<ToggleWithSub
						enabled={launcherShowCategories}
						onToggle={(v) => setSetting('launcherShowCategories', v)}
						label="Show categories"
						description="Group apps by category in the launcher"
					/>
				</Section>
			</div>
		</SettingsPage>
	);
}
