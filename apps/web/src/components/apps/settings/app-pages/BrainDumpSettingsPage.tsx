'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { KeyRecorder } from '../controls/KeyRecorder';
import { Section, SettingRow } from '../pages/shared';

const VIEW_OPTS = [{ value: 'queue', label: 'Queue' }, { value: 'kanban', label: 'Kanban' }];
const SEND_TO_OPTS = ['tasks', 'notes', 'journal', 'ask'];

const SELECT_STYLE = {
	fontSize: '0.75rem',
	padding: '6px 8px',
	borderRadius: '6px',
	border: '1px solid var(--place-border-default)',
	background: 'var(--place-surface-2)',
	color: 'var(--place-text-primary)',
	outline: 'none',
	cursor: 'pointer',
} as const;

export function BrainDumpSettingsPage() {
	const s = useSettingsStore((st) => st.app.brainDump);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="🧠" title="Brain Dump" description="Capture shortcuts and processing defaults">
			<div style={{ padding: '1rem' }}>
				<Section title="Display">
					<SettingRow label="Default view">
						<SegmentedControl options={VIEW_OPTS} value={s.defaultView}
							onChange={(v) => set('brainDump', 'defaultView', v as typeof s.defaultView)} />
					</SettingRow>
				</Section>

				<Section title="Capture">
					<SettingRow label="Quick capture shortcut">
						<KeyRecorder value={s.quickCaptureShortcut}
							onChange={(v) => set('brainDump', 'quickCaptureShortcut', v)} />
					</SettingRow>
					<ToggleWithSub enabled={s.autoCategorize}
						onToggle={(v) => set('brainDump', 'autoCategorize', v)}
						label="Auto-categorize" description="Automatically tag and categorize captured items" />
					<ToggleWithSub enabled={s.captureSound}
						onToggle={(v) => set('brainDump', 'captureSound', v)}
						label="Capture sound" description="Play a sound when an item is captured" />
				</Section>

				<Section title="Processing">
					<SettingRow label="Default send to">
						<select value={s.sendToDefault}
							onChange={(e) => set('brainDump', 'sendToDefault', e.target.value)}
							style={SELECT_STYLE}>
							{SEND_TO_OPTS.map((opt) => (
								<option key={opt} value={opt}>
									{opt.charAt(0).toUpperCase() + opt.slice(1)}
								</option>
							))}
						</select>
					</SettingRow>
				</Section>
			</div>
		</SettingsPage>
	);
}
