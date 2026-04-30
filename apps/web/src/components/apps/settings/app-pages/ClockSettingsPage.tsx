'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const FORMAT_OPTS = [{ value: '12h', label: '12h' }, { value: '24h', label: '24h' }];
const STYLE_OPTS = [
	{ value: 'digital', label: 'Digital' },
	{ value: 'analog', label: 'Analog' },
	{ value: 'minimal', label: 'Minimal' },
];

export function ClockSettingsPage() {
	const s = useSettingsStore((st) => st.app.clock);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="🕐" title="Clock" description="Display format, style, and world clocks">
			<div style={{ padding: '1rem' }}>
				<Section title="Display">
					<SettingRow label="Time format">
						<SegmentedControl options={FORMAT_OPTS} value={s.format}
							onChange={(v) => set('clock', 'format', v as typeof s.format)} />
					</SettingRow>
					<ToggleWithSub enabled={s.showSeconds}
						onToggle={(v) => set('clock', 'showSeconds', v)}
						label="Show seconds" description="Display seconds in the time readout" />
					<SettingRow label="Style">
						<SegmentedControl options={STYLE_OPTS} value={s.style}
							onChange={(v) => set('clock', 'style', v as typeof s.style)} />
					</SettingRow>
				</Section>

				<Section title="World Clocks">
					{s.worldClocks.length === 0 ? (
						<div style={{ fontSize: '0.72rem', color: 'var(--place-text-muted)', padding: '0.25rem 0' }}>
							No world clocks configured.
						</div>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
							{s.worldClocks.map((wc) => (
								<div key={wc.zone} style={{
									display: 'flex',
									justifyContent: 'space-between',
									fontSize: '0.75rem',
									color: 'var(--place-text-primary)',
									padding: '4px 0',
									borderBottom: '1px solid var(--place-border-subtle)',
								}}>
									<span>{wc.label}</span>
									<span style={{ color: 'var(--place-text-muted)' }}>{wc.zone}</span>
								</div>
							))}
						</div>
					)}
					<button
						type="button"
						style={{
							marginTop: '0.5rem',
							fontSize: '0.72rem',
							padding: '5px 12px',
							borderRadius: '6px',
							border: '1px solid var(--place-border-default)',
							background: 'var(--place-surface-3)',
							color: 'var(--place-text-primary)',
							cursor: 'pointer',
						}}
						onClick={() => {
							const zone = prompt('Time zone (e.g. America/New_York)');
							const label = zone ? prompt('Label') ?? zone : null;
							if (zone && label) {
								set('clock', 'worldClocks', [...s.worldClocks, { zone, label }]);
							}
						}}
					>
						+ Add Zone
					</button>
				</Section>
			</div>
		</SettingsPage>
	);
}
