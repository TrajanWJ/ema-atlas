'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { ColorPicker } from '../controls/ColorPicker';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { PresetCards } from '../controls/PresetCards';
import { COLOR_PRESETS } from '@/src/lib/color-presets';
import { Section, SettingRow } from './shared';

const COLOR_MODE_OPTIONS = [
	{ value: 'dark', label: 'Dark' },
	{ value: 'light', label: 'Light' },
	{ value: 'auto', label: 'Auto' },
];

const CONTRAST_OPTIONS = [
	{ value: 'standard', label: 'Standard' },
	{ value: 'increased', label: 'Increased' },
	{ value: 'high', label: 'High' },
];

export function ColorsPage() {
	const primaryColor = useSettingsStore((s) => s.primaryColor);
	const accentColor = useSettingsStore((s) => s.accentColor);
	const autoPrimaryFromWallpaper = useSettingsStore((s) => s.autoPrimaryFromWallpaper);
	const colorMode = useSettingsStore((s) => s.colorMode);
	const contrast = useSettingsStore((s) => s.contrast);
	const setSetting = useSettingsStore((s) => s.setSetting);

	const activePresetId = COLOR_PRESETS.find(
		(p) => p.primary === primaryColor && p.accent === accentColor,
	)?.id;

	const presets = COLOR_PRESETS.map((p) => ({
		id: p.id,
		name: p.name,
		preview: (
			<div style={{ display: 'flex', gap: '4px' }}>
				<div style={{ width: 20, height: 20, borderRadius: '50%', background: p.primary }} />
				<div style={{ width: 20, height: 20, borderRadius: '50%', background: p.accent }} />
			</div>
		),
	}));

	function handlePresetSelect(id: string) {
		const preset = COLOR_PRESETS.find((p) => p.id === id);
		if (!preset) return;
		setSetting('primaryColor', preset.primary);
		setSetting('accentColor', preset.accent);
	}

	return (
		<SettingsPage icon="🎨" title="Colors" description="Customize the color scheme of your workspace">
			<div style={{ padding: '1rem' }}>
				<Section title="Primary Color">
					<ColorPicker value={primaryColor} onChange={(v) => setSetting('primaryColor', v)} />
				</Section>

				<Section title="Accent Color">
					<ColorPicker value={accentColor} onChange={(v) => setSetting('accentColor', v)} />
				</Section>

				<Section title="Auto-Extract">
					<ToggleWithSub
						enabled={autoPrimaryFromWallpaper}
						onToggle={(v) => setSetting('autoPrimaryFromWallpaper', v)}
						label="Extract color from wallpaper"
						description="Automatically derive primary color from your current wallpaper"
					/>
				</Section>

				<Section title="Color Mode">
					<SegmentedControl
						options={COLOR_MODE_OPTIONS}
						value={colorMode}
						onChange={(v) => setSetting('colorMode', v as typeof colorMode)}
					/>
				</Section>

				<Section title="Contrast">
					<SegmentedControl
						options={CONTRAST_OPTIONS}
						value={contrast}
						onChange={(v) => setSetting('contrast', v as typeof contrast)}
					/>
				</Section>

				<Section title="Color Presets">
					<PresetCards
						presets={presets}
						activeId={activePresetId}
						onSelect={handlePresetSelect}
					/>
				</Section>
			</div>
		</SettingsPage>
	);
}
