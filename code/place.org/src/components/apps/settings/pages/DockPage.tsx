'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from './shared';

const DOCK_SIZE_OPTIONS = [
	{ value: 'small', label: 'S' },
	{ value: 'medium', label: 'M' },
	{ value: 'large', label: 'L' },
];

const POSITION_OPTS = [
	{ id: 'bottom' as const, label: 'Bottom' },
	{ id: 'left' as const, label: 'Left' },
	{ id: 'right' as const, label: 'Right' },
];

export function DockPage() {
	const dockPosition = useSettingsStore((s) => s.dockPosition);
	const dockSize = useSettingsStore((s) => s.dockSize);
	const dockSpacing = useSettingsStore((s) => s.dockSpacing);
	const dockMagnification = useSettingsStore((s) => s.dockMagnification);
	const dockMagnificationScale = useSettingsStore((s) => s.dockMagnificationScale);
	const dockAutoHide = useSettingsStore((s) => s.dockAutoHide);
	const dockShowLabels = useSettingsStore((s) => s.dockShowLabels);
	const dockRunningIndicators = useSettingsStore((s) => s.dockRunningIndicators);
	const setSetting = useSettingsStore((s) => s.setSetting);

	return (
		<SettingsPage icon="⬇️" title="Dock" description="Configure dock layout, size, and behavior">
			<div style={{ padding: '1rem' }}>
				<Section title="Layout">
					{/* Visual position selector */}
					<SettingRow label="Position">
						<div style={{ display: 'flex', gap: '6px' }}>
							{POSITION_OPTS.map((opt) => (
								<button
									key={opt.id}
									type="button"
									onClick={() => setSetting('dockPosition', opt.id)}
									style={{
										padding: '4px 10px',
										fontSize: '0.65rem',
										borderRadius: '5px',
										border: dockPosition === opt.id
											? '1px solid var(--place-primary-400)'
											: '1px solid var(--place-border-default)',
										background: dockPosition === opt.id
											? 'var(--place-primary-subtle)'
											: 'var(--place-surface-3)',
										color: dockPosition === opt.id
											? 'var(--place-primary-400)'
											: 'var(--place-text-primary)',
										cursor: 'pointer',
									}}
								>
									{opt.label}
								</button>
							))}
						</div>
					</SettingRow>

					<SettingRow label="Size">
						<SegmentedControl
							options={DOCK_SIZE_OPTIONS}
							value={dockSize}
							onChange={(v) => setSetting('dockSize', v as typeof dockSize)}
						/>
					</SettingRow>

					<RangeSlider
						min={2}
						max={12}
						step={1}
						value={dockSpacing}
						onChange={(v) => setSetting('dockSpacing', v)}
						showValue
						formatValue={(v) => `${v}px`}
						label="Icon Spacing"
					/>
				</Section>

				<Section title="Behavior">
					<ToggleWithSub
						enabled={dockMagnification}
						onToggle={(v) => setSetting('dockMagnification', v)}
						label="Magnification"
						description="Enlarge icons on hover"
					>
						<RangeSlider
							min={1.0}
							max={2.5}
							step={0.1}
							value={dockMagnificationScale}
							onChange={(v) => setSetting('dockMagnificationScale', v)}
							showValue
							formatValue={(v) => `${v.toFixed(1)}×`}
							label="Scale"
						/>
					</ToggleWithSub>

					<ToggleWithSub
						enabled={dockAutoHide}
						onToggle={(v) => setSetting('dockAutoHide', v)}
						label="Auto-hide"
						description="Hide dock when not in use"
					/>

					<ToggleWithSub
						enabled={dockShowLabels}
						onToggle={(v) => setSetting('dockShowLabels', v)}
						label="Show labels"
						description="Display app names below icons"
					/>

					<ToggleWithSub
						enabled={dockRunningIndicators}
						onToggle={(v) => setSetting('dockRunningIndicators', v)}
						label="Running indicators"
						description="Show dots for open apps"
					/>
				</Section>
			</div>
		</SettingsPage>
	);
}
