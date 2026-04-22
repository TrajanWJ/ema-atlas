'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from './shared';

const BG_ANIMATION_OPTIONS = [
	{ value: 'none', label: 'None' },
	{ value: 'dots-connect', label: 'Dots' },
	{ value: 'particles', label: 'Particles' },
	{ value: 'waves', label: 'Waves' },
];

const TRANSITION_OPTIONS = [
	{ value: 'scale', label: 'Scale' },
	{ value: 'fade', label: 'Fade' },
	{ value: 'slide', label: 'Slide' },
	{ value: 'flip', label: 'Flip' },
];

const BOOT_SPEED_OPTIONS = [
	{ value: 'normal', label: 'Normal' },
	{ value: 'fast', label: 'Fast' },
	{ value: 'instant', label: 'Instant' },
];

const REDUCED_MOTION_OPTIONS = [
	{ value: 'system', label: 'System' },
	{ value: 'false', label: 'Full' },
	{ value: 'true', label: 'Reduced' },
];

export function AnimationsPage() {
	const bgAnimation = useSettingsStore((s) => s.bgAnimation);
	const bgAnimationSpeed = useSettingsStore((s) => s.bgAnimationSpeed);
	const bgAnimationInteractive = useSettingsStore((s) => s.bgAnimationInteractive);
	const windowTransitionStyle = useSettingsStore((s) => s.windowTransitionStyle);
	const reducedMotion = useSettingsStore((s) => s.reducedMotion);
	const bootAnimation = useSettingsStore((s) => s.bootAnimation);
	const bootSpeed = useSettingsStore((s) => s.bootSpeed);
	const setSetting = useSettingsStore((s) => s.setSetting);

	const reducedMotionStr = String(reducedMotion);

	return (
		<SettingsPage icon="🎬" title="Animations" description="Control motion and animation preferences">
			<div style={{ padding: '1rem' }}>
				<Section title="Background Animation">
					<SettingRow label="Style">
						<SegmentedControl
							options={BG_ANIMATION_OPTIONS}
							value={bgAnimation}
							onChange={(v) => setSetting('bgAnimation', v)}
						/>
					</SettingRow>
					<RangeSlider
						min={0.1}
						max={2}
						step={0.1}
						value={bgAnimationSpeed}
						onChange={(v) => setSetting('bgAnimationSpeed', v)}
						showValue
						formatValue={(v) => `${v.toFixed(1)}×`}
						label="Speed"
					/>
					<ToggleWithSub
						enabled={bgAnimationInteractive}
						onToggle={(v) => setSetting('bgAnimationInteractive', v)}
						label="Interactive"
						description="React to mouse movement and touch"
					/>
				</Section>

				<Section title="Window Transitions">
					<SegmentedControl
						options={TRANSITION_OPTIONS}
						value={windowTransitionStyle}
						onChange={(v) => setSetting('windowTransitionStyle', v as typeof windowTransitionStyle)}
					/>
				</Section>

				<Section title="Motion">
					<SettingRow label="Reduced Motion" description="Override system reduced-motion preference">
						<SegmentedControl
							options={REDUCED_MOTION_OPTIONS}
							value={reducedMotionStr}
							onChange={(v) => {
								if (v === 'system') setSetting('reducedMotion', 'system');
								else setSetting('reducedMotion', v === 'true');
							}}
						/>
					</SettingRow>
					<ToggleWithSub
						enabled={bootAnimation}
						onToggle={(v) => setSetting('bootAnimation', v)}
						label="Boot animation"
						description="Show animated boot sequence on launch"
					>
						<SettingRow label="Boot speed">
							<SegmentedControl
								options={BOOT_SPEED_OPTIONS}
								value={bootSpeed}
								onChange={(v) => setSetting('bootSpeed', v as typeof bootSpeed)}
							/>
						</SettingRow>
					</ToggleWithSub>
				</Section>
			</div>
		</SettingsPage>
	);
}
