'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const FONTS = [
	'JetBrains Mono',
	'Fira Code',
	'Source Code Pro',
	'Cascadia Code',
	'System Mono',
];
const COLOR_SCHEMES = ['default', 'dracula', 'monokai', 'solarized', 'nord', 'onedark'];
const CURSOR_OPTS = [
	{ value: 'block', label: 'Block' },
	{ value: 'underline', label: 'Line' },
	{ value: 'bar', label: 'Bar' },
];

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

export function TerminalSettingsPage() {
	const s = useSettingsStore((st) => st.app.terminal);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="💻" title="Terminal" description="Font, color scheme, cursor, and history settings">
			<div style={{ padding: '1rem' }}>
				<Section title="Font">
					<SettingRow label="Font family">
						<select value={s.font}
							onChange={(e) => set('terminal', 'font', e.target.value)}
							style={SELECT_STYLE}>
							{FONTS.map((f) => (
								<option key={f} value={f}>{f}</option>
							))}
						</select>
					</SettingRow>
					<RangeSlider min={10} max={20} step={1} value={s.fontSize}
						onChange={(v) => set('terminal', 'fontSize', v)}
						label="Font size" showValue formatValue={(v) => `${v}px`} />
				</Section>

				<Section title="Colors">
					<SettingRow label="Color scheme">
						<select value={s.colorScheme}
							onChange={(e) => set('terminal', 'colorScheme', e.target.value)}
							style={SELECT_STYLE}>
							{COLOR_SCHEMES.map((scheme) => (
								<option key={scheme} value={scheme}>
									{scheme.charAt(0).toUpperCase() + scheme.slice(1)}
								</option>
							))}
						</select>
					</SettingRow>
				</Section>

				<Section title="Cursor">
					<SettingRow label="Cursor style">
						<SegmentedControl options={CURSOR_OPTS} value={s.cursorStyle}
							onChange={(v) => set('terminal', 'cursorStyle', v as typeof s.cursorStyle)} />
					</SettingRow>
					<ToggleWithSub enabled={s.cursorBlink}
						onToggle={(v) => set('terminal', 'cursorBlink', v)}
						label="Cursor blink" description="Animate cursor blinking" />
				</Section>

				<Section title="History">
					<RangeSlider min={100} max={10000} step={100} value={s.scrollback}
						onChange={(v) => set('terminal', 'scrollback', v)}
						label="Scrollback lines" showValue formatValue={(v) => v.toLocaleString()} />
				</Section>
			</div>
		</SettingsPage>
	);
}
