'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { PresetCards } from '../controls/PresetCards';
import { Section } from './shared';

interface GlassPreset {
	id: string;
	name: string;
	intensity: number;
	blur: number;
	tint: number;
	saturation: number;
}

const GLASS_PRESETS: GlassPreset[] = [
	{ id: 'frosted', name: 'Frosted', intensity: 1.5, blur: 20, tint: 0.1, saturation: 1.2 },
	{ id: 'crystal', name: 'Crystal', intensity: 0.8, blur: 12, tint: 0.03, saturation: 1.5 },
	{ id: 'smoky', name: 'Smoky', intensity: 2.0, blur: 30, tint: 0.25, saturation: 0.8 },
	{ id: 'transparent', name: 'Clear', intensity: 0.3, blur: 4, tint: 0.01, saturation: 1.0 },
	{ id: 'neon', name: 'Neon', intensity: 1.8, blur: 16, tint: 0.15, saturation: 2.0 },
];

const INTENSITY_TICKS = [
	{ value: 0, label: '0' },
	{ value: 0.5, label: '0.5' },
	{ value: 1, label: '1' },
	{ value: 1.5, label: '1.5' },
	{ value: 2, label: '2' },
	{ value: 3, label: '3' },
];

export function GlassPage() {
	const glassIntensity = useSettingsStore((s) => s.glassIntensity);
	const blurAmount = useSettingsStore((s) => s.blurAmount);
	const glassTint = useSettingsStore((s) => s.glassTint);
	const glassSaturation = useSettingsStore((s) => s.glassSaturation);
	const setSetting = useSettingsStore((s) => s.setSetting);

	const blurValue = blurAmount ?? 0;

	const activePresetId = GLASS_PRESETS.find(
		(p) =>
			p.intensity === glassIntensity &&
			p.blur === blurValue &&
			p.tint === glassTint &&
			p.saturation === glassSaturation,
	)?.id;

	const presets = GLASS_PRESETS.map((p) => ({
		id: p.id,
		name: p.name,
		preview: (
			<div
				style={{
					width: '52px',
					height: '36px',
					borderRadius: '4px',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: 'linear-gradient(135deg, #6366f1, #ec4899)',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						backdropFilter: `blur(${p.blur / 4}px)`,
						WebkitBackdropFilter: `blur(${p.blur / 4}px)`,
						background: `rgba(255,255,255,${p.tint * 0.5})`,
					}}
				/>
			</div>
		),
	}));

	function handlePresetSelect(id: string) {
		const preset = GLASS_PRESETS.find((p) => p.id === id);
		if (!preset) return;
		setSetting('glassIntensity', preset.intensity);
		setSetting('blurAmount', preset.blur);
		setSetting('glassTint', preset.tint);
		setSetting('glassSaturation', preset.saturation);
	}

	return (
		<SettingsPage icon="✨" title="Glass & Blur" description="Fine-tune the glassmorphism appearance of surfaces">
			<div style={{ padding: '1rem' }}>
				<Section title="Glass Controls">
					<RangeSlider
						min={0}
						max={3}
						step={0.1}
						value={glassIntensity}
						onChange={(v) => setSetting('glassIntensity', v)}
						ticks={INTENSITY_TICKS}
						showValue
						formatValue={(v) => v.toFixed(1)}
						label="Glass Intensity"
					/>
					<RangeSlider
						min={0}
						max={40}
						step={1}
						value={blurValue}
						onChange={(v) => setSetting('blurAmount', v)}
						showValue
						formatValue={(v) => `${v}px`}
						label="Blur Amount"
					/>
					<RangeSlider
						min={0}
						max={0.5}
						step={0.01}
						value={glassTint}
						onChange={(v) => setSetting('glassTint', v)}
						showValue
						formatValue={(v) => v.toFixed(2)}
						label="Glass Tint"
					/>
					<RangeSlider
						min={0.5}
						max={2.0}
						step={0.05}
						value={glassSaturation}
						onChange={(v) => setSetting('glassSaturation', v)}
						showValue
						formatValue={(v) => v.toFixed(2)}
						label="Saturation"
					/>
				</Section>

				<Section title="Presets">
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
