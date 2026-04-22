'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section, SettingRow } from '../pages/shared';

const VIEW_OPTS = [{ value: 'list', label: 'List' }, { value: 'kanban', label: 'Kanban' }];
const COMPLETED_OPTS = [
	{ value: 'show', label: 'Show' },
	{ value: 'fade', label: 'Fade' },
	{ value: 'hide', label: 'Hide' },
];
const QUICK_ADD_OPTS = [{ value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }];
const SORT_OPTIONS = ['manual', 'priority', 'due-date', 'created', 'alphabetical'];

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

export function TasksSettingsPage() {
	const s = useSettingsStore((st) => st.app.tasks);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="✅" title="Tasks" description="View preferences and task management behavior">
			<div style={{ padding: '1rem' }}>
				<Section title="Display">
					<SettingRow label="Default view">
						<SegmentedControl options={VIEW_OPTS} value={s.defaultView}
							onChange={(v) => set('tasks', 'defaultView', v as typeof s.defaultView)} />
					</SettingRow>
					<SettingRow label="Completed tasks">
						<SegmentedControl options={COMPLETED_OPTS} value={s.completedBehavior}
							onChange={(v) => set('tasks', 'completedBehavior', v as typeof s.completedBehavior)} />
					</SettingRow>
					<SettingRow label="Sort order">
						<select value={s.sortOrder}
							onChange={(e) => set('tasks', 'sortOrder', e.target.value as typeof s.sortOrder)}
							style={SELECT_STYLE}>
							{SORT_OPTIONS.map((opt) => (
								<option key={opt} value={opt}>
									{opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}
								</option>
							))}
						</select>
					</SettingRow>
					<ToggleWithSub enabled={s.showSubtaskProgress}
						onToggle={(v) => set('tasks', 'showSubtaskProgress', v)}
						label="Show subtask progress" description="Display progress bars on tasks with subtasks" />
				</Section>

				<Section title="Behavior">
					<ToggleWithSub enabled={s.confirmDelete}
						onToggle={(v) => set('tasks', 'confirmDelete', v)}
						label="Confirm delete" description="Ask for confirmation before deleting tasks" />
					<ToggleWithSub enabled={s.autoArchive}
						onToggle={(v) => set('tasks', 'autoArchive', v)}
						label="Auto-archive completed" description="Move completed tasks to archive automatically">
						<RangeSlider min={1} max={30} step={1} value={s.autoArchiveDays}
							onChange={(v) => set('tasks', 'autoArchiveDays', v)}
							label="After days" showValue formatValue={(v) => `${v}d`} />
					</ToggleWithSub>
					<SettingRow label="Quick add position">
						<SegmentedControl options={QUICK_ADD_OPTS} value={s.quickAddPosition}
							onChange={(v) => set('tasks', 'quickAddPosition', v as typeof s.quickAddPosition)} />
					</SettingRow>
				</Section>
			</div>
		</SettingsPage>
	);
}
