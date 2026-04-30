'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const VIEW_OPTS = [
	{ value: 'grid', label: 'Grid' },
	{ value: 'list', label: 'List' },
	{ value: 'columns', label: 'Columns' },
];
const THUMB_OPTS = [
	{ value: 'small', label: 'S' },
	{ value: 'medium', label: 'M' },
	{ value: 'large', label: 'L' },
	{ value: 'xlarge', label: 'XL' },
];
const SORT_OPTIONS = ['name', 'date', 'size', 'type'];

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

export function FinderSettingsPage() {
	const s = useSettingsStore((st) => st.app.finder);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="📂" title="Finder" description="Default view, thumbnail size, and file display options">
			<div style={{ padding: '1rem' }}>
				<Section title="Display">
					<SettingRow label="Default view">
						<SegmentedControl options={VIEW_OPTS} value={s.defaultView}
							onChange={(v) => set('finder', 'defaultView', v as typeof s.defaultView)} />
					</SettingRow>
					<SettingRow label="Thumbnail size">
						<SegmentedControl options={THUMB_OPTS} value={s.thumbnailSize}
							onChange={(v) => set('finder', 'thumbnailSize', v as typeof s.thumbnailSize)} />
					</SettingRow>
				</Section>

				<Section title="Files">
					<ToggleWithSub enabled={s.showHidden}
						onToggle={(v) => set('finder', 'showHidden', v)}
						label="Show hidden files" description="Display files and folders starting with a dot" />
					<SettingRow label="Sort by">
						<select value={s.sortBy}
							onChange={(e) => set('finder', 'sortBy', e.target.value as typeof s.sortBy)}
							style={SELECT_STYLE}>
							{SORT_OPTIONS.map((opt) => (
								<option key={opt} value={opt}>
									{opt.charAt(0).toUpperCase() + opt.slice(1)}
								</option>
							))}
						</select>
					</SettingRow>
					<ToggleWithSub enabled={s.previewPanel}
						onToggle={(v) => set('finder', 'previewPanel', v)}
						label="Preview panel" description="Show file preview in a side panel" />
				</Section>
			</div>
		</SettingsPage>
	);
}
