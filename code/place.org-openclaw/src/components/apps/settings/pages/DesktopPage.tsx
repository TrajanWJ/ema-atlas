'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from './shared';

const SORT_ORDER_OPTIONS = [
	{ value: 'manual', label: 'Manual' },
	{ value: 'alphabetical', label: 'A–Z' },
	{ value: 'type', label: 'Type' },
	{ value: 'recent', label: 'Recent' },
];

export function DesktopPage() {
	const showDesktopIcons = useSettingsStore((s) => s.showDesktopIcons);
	const desktopIconSize = useSettingsStore((s) => s.desktopIconSize);
	const desktopGridSpacing = useSettingsStore((s) => s.desktopGridSpacing);
	const desktopSortOrder = useSettingsStore((s) => s.desktopSortOrder);
	const virtualDesktopsEnabled = useSettingsStore((s) => s.virtualDesktopsEnabled);
	const setSetting = useSettingsStore((s) => s.setSetting);

	return (
		<SettingsPage icon="🖥️" title="Desktop" description="Configure icons, grid layout, and virtual desktops">
			<div style={{ padding: '1rem' }}>
				<Section title="Icons">
					<ToggleWithSub
						enabled={showDesktopIcons}
						onToggle={(v) => setSetting('showDesktopIcons', v)}
						label="Show desktop icons"
						description="Display app icons on the desktop surface"
					/>

					<RangeSlider
						min={32}
						max={72}
						step={4}
						value={desktopIconSize}
						onChange={(v) => setSetting('desktopIconSize', v)}
						showValue
						formatValue={(v) => `${v}px`}
						label="Icon size"
					/>

					<RangeSlider
						min={60}
						max={120}
						step={5}
						value={desktopGridSpacing}
						onChange={(v) => setSetting('desktopGridSpacing', v)}
						showValue
						formatValue={(v) => `${v}px`}
						label="Grid spacing"
					/>
				</Section>

				<Section title="Sort">
					<SettingRow label="Sort order">
						<SegmentedControl
							options={SORT_ORDER_OPTIONS}
							value={desktopSortOrder}
							onChange={(v) => setSetting('desktopSortOrder', v as typeof desktopSortOrder)}
						/>
					</SettingRow>
				</Section>

				<Section title="Virtual Desktops">
					<ToggleWithSub
						enabled={virtualDesktopsEnabled}
						onToggle={(v) => setSetting('virtualDesktopsEnabled', v)}
						label="Enable virtual desktops"
						description="Use multiple desktop spaces to organize your work"
					/>
				</Section>
			</div>
		</SettingsPage>
	);
}
