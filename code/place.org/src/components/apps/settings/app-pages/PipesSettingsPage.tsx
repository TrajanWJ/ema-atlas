'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { Section } from '../pages/shared';

export function PipesSettingsPage() {
	const s = useSettingsStore((st) => st.app.pipes);
	const set = useSettingsStore((st) => st.setAppSetting);

	return (
		<SettingsPage icon="🔧" title="Pipes" description="Pipeline execution, debugging, and notification settings">
			<div style={{ padding: '1rem' }}>
				<Section title="Execution">
					<ToggleWithSub enabled={s.autoRun}
						onToggle={(v) => set('pipes', 'autoRun', v)}
						label="Auto-run" description="Execute pipelines automatically when inputs change" />
					<ToggleWithSub enabled={s.debugMode}
						onToggle={(v) => set('pipes', 'debugMode', v)}
						label="Debug mode" description="Show step-by-step execution details and logs" />
					<RangeSlider min={5} max={120} step={5} value={s.maxExecutionTime}
						onChange={(v) => set('pipes', 'maxExecutionTime', v)}
						label="Max execution time" showValue formatValue={(v) => `${v}s`} />
				</Section>

				<Section title="Notifications">
					<ToggleWithSub enabled={s.notifyOnComplete}
						onToggle={(v) => set('pipes', 'notifyOnComplete', v)}
						label="Notify on complete" description="Send a notification when a pipeline finishes running" />
				</Section>
			</div>
		</SettingsPage>
	);
}
