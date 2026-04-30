'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from './shared';

const SOUND_PACKS = ['default', 'minimal', 'nature', 'retro', 'none'];

export function SoundPage() {
	const soundEnabled = useSettingsStore((s) => s.soundEnabled);
	const masterVolume = useSettingsStore((s) => s.masterVolume);
	const volumeUI = useSettingsStore((s) => s.volumeUI);
	const volumeNotifications = useSettingsStore((s) => s.volumeNotifications);
	const volumeMusic = useSettingsStore((s) => s.volumeMusic);
	const soundPack = useSettingsStore((s) => s.soundPack);
	const setSetting = useSettingsStore((s) => s.setSetting);

	return (
		<SettingsPage icon="🔊" title="Sound" description="Configure system sounds and volume levels">
			<div style={{ padding: '1rem' }}>
				<Section title="Master">
					<ToggleWithSub
						enabled={soundEnabled}
						onToggle={(v) => setSetting('soundEnabled', v)}
						label="System sounds"
						description="Enable all interface and notification sounds"
					/>

					<RangeSlider
						min={0}
						max={1}
						step={0.01}
						value={masterVolume}
						onChange={(v) => setSetting('masterVolume', v)}
						showValue
						formatValue={(v) => `${Math.round(v * 100)}%`}
						label="Master volume"
					/>
				</Section>

				<Section title="Categories">
					<RangeSlider
						min={0}
						max={1}
						step={0.01}
						value={volumeUI}
						onChange={(v) => setSetting('volumeUI', v)}
						showValue
						formatValue={(v) => `${Math.round(v * 100)}%`}
						label="Interface sounds"
					/>
					<RangeSlider
						min={0}
						max={1}
						step={0.01}
						value={volumeNotifications}
						onChange={(v) => setSetting('volumeNotifications', v)}
						showValue
						formatValue={(v) => `${Math.round(v * 100)}%`}
						label="Notifications"
					/>
					<RangeSlider
						min={0}
						max={1}
						step={0.01}
						value={volumeMusic}
						onChange={(v) => setSetting('volumeMusic', v)}
						showValue
						formatValue={(v) => `${Math.round(v * 100)}%`}
						label="Music"
					/>
				</Section>

				<Section title="Sound Pack">
					<select
						value={soundPack}
						onChange={(e) => setSetting('soundPack', e.target.value)}
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
						{SOUND_PACKS.map((pack) => (
							<option key={pack} value={pack}>
								{pack.charAt(0).toUpperCase() + pack.slice(1)}
							</option>
						))}
					</select>
				</Section>
			</div>
		</SettingsPage>
	);
}
