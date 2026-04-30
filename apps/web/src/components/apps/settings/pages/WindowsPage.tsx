'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { MiniPreview } from '../controls/MiniPreview';
import { Section, SettingRow } from './shared';

const TITLE_BAR_OPTIONS = [
	{ value: 'default', label: 'Default' },
	{ value: 'compact', label: 'Compact' },
	{ value: 'hidden', label: 'Hidden' },
];

const DBL_CLICK_OPTIONS = [
	{ value: 'maximize', label: 'Maximize' },
	{ value: 'minimize', label: 'Minimize' },
	{ value: 'shade', label: 'Shade' },
];

export function WindowsPage() {
	const windowCornerRadius = useSettingsStore((s) => s.windowCornerRadius);
	const windowShadows = useSettingsStore((s) => s.windowShadows);
	const inactiveWindowOpacity = useSettingsStore((s) => s.inactiveWindowOpacity);
	const snapZones = useSettingsStore((s) => s.snapZones);
	const titleBarStyle = useSettingsStore((s) => s.titleBarStyle);
	const doubleClickTitleBar = useSettingsStore((s) => s.doubleClickTitleBar);
	const windowAnimations = useSettingsStore((s) => s.windowAnimations);
	const setSetting = useSettingsStore((s) => s.setSetting);

	return (
		<SettingsPage icon="🪟" title="Windows" description="Adjust window appearance and interactive behavior">
			<div style={{ padding: '1rem' }}>
				<Section title="Appearance">
					<SettingRow label="Corner Radius" description="Rounded corners on all windows">
						<MiniPreview type="window" />
					</SettingRow>
					<RangeSlider
						min={0}
						max={28}
						step={1}
						value={windowCornerRadius}
						onChange={(v) => {
							setSetting('windowCornerRadius', v);
							document.documentElement.style.setProperty('--place-window-radius', `${v}px`);
						}}
						showValue
						formatValue={(v) => `${v}px`}
					/>

					<ToggleWithSub
						enabled={windowShadows}
						onToggle={(v) => setSetting('windowShadows', v)}
						label="Window shadows"
						description="Drop shadow beneath windows"
					/>

					<RangeSlider
						min={0.5}
						max={1.0}
						step={0.05}
						value={inactiveWindowOpacity}
						onChange={(v) => setSetting('inactiveWindowOpacity', v)}
						showValue
						formatValue={(v) => `${Math.round(v * 100)}%`}
						label="Inactive window opacity"
					/>
				</Section>

				<Section title="Behavior">
					<ToggleWithSub
						enabled={snapZones}
						onToggle={(v) => setSetting('snapZones', v)}
						label="Snap zones"
						description="Snap windows to screen edges and corners"
					/>

					<SettingRow label="Title bar style">
						<SegmentedControl
							options={TITLE_BAR_OPTIONS}
							value={titleBarStyle}
							onChange={(v) => setSetting('titleBarStyle', v as typeof titleBarStyle)}
						/>
					</SettingRow>

					<SettingRow label="Double-click title bar">
						<SegmentedControl
							options={DBL_CLICK_OPTIONS}
							value={doubleClickTitleBar}
							onChange={(v) => setSetting('doubleClickTitleBar', v as typeof doubleClickTitleBar)}
						/>
					</SettingRow>

					<ToggleWithSub
						enabled={windowAnimations}
						onToggle={(v) => setSetting('windowAnimations', v)}
						label="Window animations"
						description="Animate open, close, and minimize"
					/>
				</Section>
			</div>
		</SettingsPage>
	);
}
