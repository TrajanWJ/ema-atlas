'use client';

type SidebarItem = {
	id: string;
	label: string;
	icon: string;
};

type SidebarGroup = {
	title: string;
	items: SidebarItem[];
};

const SIDEBAR_GROUPS: SidebarGroup[] = [
	{
		title: 'Look & Feel',
		items: [
			{ id: 'colors', label: 'Colors', icon: '🎨' },
			{ id: 'wallpaper', label: 'Wallpaper', icon: '🖼️' },
			{ id: 'glass', label: 'Glass & Blur', icon: '✨' },
			{ id: 'typography', label: 'Typography', icon: '🔤' },
			{ id: 'animations', label: 'Animations', icon: '🎬' },
			{ id: 'themes', label: 'Themes', icon: '🌙' },
		],
	},
	{
		title: 'Desktop',
		items: [
			{ id: 'dock', label: 'Dock', icon: '⬇️' },
			{ id: 'windows', label: 'Windows', icon: '🪟' },
			{ id: 'desktop', label: 'Desktop', icon: '🖥️' },
			{ id: 'launcher', label: 'Launcher', icon: '🚀' },
		],
	},
	{
		title: 'System',
		items: [
			{ id: 'sound', label: 'Sound', icon: '🔊' },
			{ id: 'notifications', label: 'Notifications', icon: '🔔' },
			{ id: 'data', label: 'Data & Storage', icon: '💾' },
			{ id: 'about', label: 'About', icon: 'ℹ️' },
		],
	},
	{
		title: 'EMA',
		items: [
			{ id: 'workspace', label: 'Workspace', icon: '🏢' },
			{ id: 'daemon', label: 'Daemon', icon: '🛰️' },
			{ id: 'identity', label: 'Identity', icon: '🔑' },
		],
	},
	{
		title: 'App Settings',
		items: [
			{ id: 'app-focus', label: 'Focus', icon: '🎯' },
			{ id: 'app-tasks', label: 'Tasks', icon: '✅' },
			{ id: 'app-journal', label: 'Journal', icon: '📓' },
			{ id: 'app-habits', label: 'Habits', icon: '🔁' },
			{ id: 'app-braindump', label: 'Brain Dump', icon: '🧠' },
			{ id: 'app-notes', label: 'Notes', icon: '📝' },
			{ id: 'app-music', label: 'Music', icon: '🎵' },
			{ id: 'app-terminal', label: 'Terminal', icon: '💻' },
			{ id: 'app-finder', label: 'Finder', icon: '📂' },
			{ id: 'app-calculator', label: 'Calculator', icon: '🔢' },
			{ id: 'app-clock', label: 'Clock', icon: '🕐' },
			{ id: 'app-sysmon', label: 'System Monitor', icon: '📊' },
			{ id: 'app-pipes', label: 'Pipes', icon: '🔗' },
		],
	},
];

type Props = {
	activePage: string;
	onNavigate: (pageId: string) => void;
};

export function SettingsSidebar({ activePage, onNavigate }: Props) {
	return (
		<div
			style={{
				width: '200px',
				flexShrink: 0,
				overflowY: 'auto',
				borderRight: '1px solid var(--place-border-default)',
				padding: '0.5rem 0',
				display: 'flex',
				flexDirection: 'column',
				gap: '0.25rem',
			}}
		>
			{SIDEBAR_GROUPS.map((group) => (
				<div key={group.title} style={{ marginBottom: '0.25rem' }}>
					<div
						style={{
							fontSize: '0.6rem',
							fontWeight: 600,
							textTransform: 'uppercase',
							letterSpacing: '0.08em',
							color: 'var(--place-text-tertiary)',
							padding: '0.4rem 0.75rem 0.2rem',
						}}
					>
						{group.title}
					</div>
					{group.items.map((item) => {
						const isActive = activePage === item.id;
						return (
							<button
								key={item.id}
								type="button"
								onClick={() => onNavigate(item.id)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.4rem',
									width: '100%',
									padding: '0.3rem 0.75rem',
									fontSize: '0.72rem',
									border: 'none',
									borderRadius: '0',
									background: isActive
										? 'var(--place-secondary-subtle)'
										: 'transparent',
									color: isActive
										? 'var(--place-secondary-400)'
										: 'var(--place-text-secondary)',
									fontWeight: isActive ? 600 : 400,
									cursor: 'pointer',
									textAlign: 'left',
									transition: 'background 0.1s, color 0.1s',
								}}
							>
								<span style={{ fontSize: '0.8rem', lineHeight: 1 }}>
									{item.icon}
								</span>
								<span>{item.label}</span>
							</button>
						);
					})}
				</div>
			))}
		</div>
	);
}
