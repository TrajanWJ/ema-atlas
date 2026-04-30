'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { Section, SettingRow } from './shared';

const FONT_SIZE_TICKS = [
	{ value: 12, label: '12' },
	{ value: 14, label: '14' },
	{ value: 16, label: '16' },
	{ value: 18, label: '18' },
	{ value: 20, label: '20' },
];

const FONT_FAMILIES = [
	'system-ui',
	'Inter',
	'JetBrains Mono',
	'IBM Plex Sans',
	'Space Grotesk',
];

const FONT_WEIGHT_OPTIONS = [
	{ value: '300', label: 'Light' },
	{ value: '400', label: 'Regular' },
	{ value: '500', label: 'Medium' },
];

const LINE_SPACING_OPTIONS = [
	{ value: 'compact', label: 'Compact' },
	{ value: 'comfortable', label: 'Comfortable' },
	{ value: 'spacious', label: 'Spacious' },
];

export function TypographyPage() {
	const fontSize = useSettingsStore((s) => s.fontSize);
	const fontFamily = useSettingsStore((s) => s.fontFamily);
	const fontWeight = useSettingsStore((s) => s.fontWeight);
	const lineSpacing = useSettingsStore((s) => s.lineSpacing);
	const setSetting = useSettingsStore((s) => s.setSetting);

	const lineHeightMap = { compact: 1.4, comfortable: 1.6, spacious: 1.9 };
	const previewLineHeight = lineHeightMap[lineSpacing];

	return (
		<SettingsPage icon="🔤" title="Typography" description="Configure fonts and text rendering preferences">
			<div style={{ padding: '1rem' }}>
				<Section title="Font Size">
					<RangeSlider
						min={12}
						max={20}
						step={1}
						value={fontSize}
						onChange={(v) => setSetting('fontSize', v)}
						ticks={FONT_SIZE_TICKS}
						showValue
						formatValue={(v) => `${v}px`}
					/>
				</Section>

				<Section title="Font Family">
					<select
						value={fontFamily}
						onChange={(e) => setSetting('fontFamily', e.target.value)}
						style={{
							width: '100%',
							fontSize: '0.75rem',
							padding: '6px 8px',
							borderRadius: '6px',
							border: '1px solid var(--place-border-default)',
							background: 'var(--place-surface-2)',
							color: 'var(--place-text-primary)',
							outline: 'none',
							cursor: 'pointer',
						}}
					>
						{FONT_FAMILIES.map((f) => (
							<option key={f} value={f} style={{ fontFamily: f }}>
								{f}
							</option>
						))}
					</select>
				</Section>

				<Section title="Font Weight">
					<SegmentedControl
						options={FONT_WEIGHT_OPTIONS}
						value={String(fontWeight)}
						onChange={(v) => setSetting('fontWeight', Number(v) as typeof fontWeight)}
					/>
				</Section>

				<Section title="Line Spacing">
					<SegmentedControl
						options={LINE_SPACING_OPTIONS}
						value={lineSpacing}
						onChange={(v) => setSetting('lineSpacing', v as typeof lineSpacing)}
					/>
				</Section>

				<Section title="Preview">
					<div
						style={{
							padding: '12px 14px',
							borderRadius: '8px',
							border: '1px solid var(--place-border-default)',
							background: 'var(--place-surface-2)',
							fontFamily,
							fontSize: `${fontSize}px`,
							fontWeight,
							lineHeight: previewLineHeight,
							color: 'var(--place-text-primary)',
						}}
					>
						<div style={{ fontWeight: 600, marginBottom: '4px' }}>The quick brown fox</div>
						<div>
							jumps over the lazy dog. Typography shapes how you perceive and interact with
							your workspace every day.
						</div>
					</div>
				</Section>
			</div>
		</SettingsPage>
	);
}
