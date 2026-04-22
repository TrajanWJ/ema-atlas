'use client';

export type HabitTab = 'today' | 'week' | 'month' | 'streaks';

const TABS: readonly { readonly id: HabitTab; readonly label: string }[] = [
	{ id: 'today', label: 'Today' },
	{ id: 'week', label: 'Week' },
	{ id: 'month', label: 'Month' },
	{ id: 'streaks', label: 'Streaks' },
];

interface HabitTabsProps {
	readonly activeTab: HabitTab;
	readonly onTabChange: (tab: HabitTab) => void;
}

export function HabitTabs({ activeTab, onTabChange }: HabitTabsProps) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				padding: '0.5rem 0.75rem',
				borderBottom: '1px solid var(--place-border-default)',
				flexShrink: 0,
			}}
		>
			<div
				style={{
					display: 'flex',
					gap: '2px',
					background: 'var(--place-surface-3)',
					borderRadius: '6px',
					padding: '2px',
				}}
			>
				{TABS.map((tab) => {
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => onTabChange(tab.id)}
							style={{
								fontSize: '0.65rem',
								padding: '0.2rem 0.5rem',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								background: isActive
									? 'var(--place-secondary-subtle)'
									: 'transparent',
								color: isActive
									? 'var(--place-secondary-400)'
									: 'var(--place-text-tertiary)',
								fontWeight: isActive ? 600 : 400,
								transition: 'background 0.15s, color 0.15s',
							}}
						>
							{tab.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}
