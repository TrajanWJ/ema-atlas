'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	Rocket,
	Brain,
	ClipboardList,
	Crown,
	Compass,
	Bot,
	MessagesSquare,
	BookMarked,
	BookOpen,
	GitBranch,
	LampDesk,
	Frame,
	Wrench,
	User,
	Users,
	Sparkles,
	Settings,
	type LucideIcon,
} from 'lucide-react';

type NavItem = {
	href: string;
	label: string;
	icon: LucideIcon;
};

type NavGroup = {
	label: string;
	items: ReadonlyArray<NavItem>;
};

const NAV_GROUPS: ReadonlyArray<NavGroup> = [
	{
		label: 'Workspace',
		items: [
			{ href: '/launchpad', label: 'Launchpad', icon: Rocket },
			{ href: '/atlas', label: 'Atlas', icon: BookOpen },
			{ href: '/cwt', label: 'Current Work', icon: ClipboardList },
			{ href: '/clients', label: 'Clients', icon: Users },
			{ href: '/brain-dump', label: 'Brain Dump', icon: Brain },
			{ href: '/hq', label: 'HQ', icon: Crown },
			{ href: '/blueprint', label: 'Blueprint', icon: Compass },
			{ href: '/agent-work', label: 'Agent Work', icon: Bot },
			{ href: '/threads', label: 'Threads', icon: MessagesSquare },
			{ href: '/wiki', label: 'Wiki', icon: BookMarked },
			{ href: '/chronicle', label: 'Chronicle', icon: BookOpen },
			{ href: '/git-ema', label: 'Git EMA', icon: GitBranch },
			{ href: '/place-tools', label: 'Place Tools', icon: Wrench },
		],
	},
	{
		label: 'Surfaces',
		items: [
			{ href: '/desk', label: 'Desk', icon: LampDesk },
			{ href: '/canvas', label: 'Canvas', icon: Frame },
		],
	},
	{
		label: 'Web',
		items: [
			{ href: '/portfolio', label: 'Portfolio', icon: User },
			{ href: '/cool-stuff', label: 'Cool Stuff', icon: Sparkles },
		],
	},
];

const FOOTER_ITEMS: ReadonlyArray<NavItem> = [
	{ href: '/settings', label: 'Settings', icon: Settings },
];

const COLLAPSED_W = 56;
const EXPANDED_W = 224;

function isActive(pathname: string, href: string): boolean {
	if (href === '/') return pathname === '/';
	return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
	item,
	expanded,
	active,
}: {
	item: NavItem;
	expanded: boolean;
	active: boolean;
}) {
	const Icon = item.icon;
	return (
		<Link
			href={item.href}
			aria-label={item.label}
			aria-current={active ? 'page' : undefined}
			title={expanded ? undefined : item.label}
			className="group relative flex items-center gap-3 mx-2 my-0.5 h-9 rounded-lg overflow-hidden outline-none transition-colors duration-200"
			style={{
				color: active
					? 'var(--place-text-primary)'
					: 'var(--place-text-secondary)',
				background: active
					? 'var(--place-primary-subtle)'
					: 'transparent',
				border: active
					? '1px solid var(--place-primary-border)'
					: '1px solid transparent',
				boxShadow: active
					? '0 0 16px var(--place-primary-glow)'
					: undefined,
			}}
		>
			{/* Active accent rail */}
			<span
				aria-hidden="true"
				className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200"
				style={{
					height: active ? '60%' : '0%',
					background: 'var(--place-primary-400)',
				}}
			/>
			<span
				className="flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:text-[var(--place-text-primary)]"
				style={{ width: COLLAPSED_W - 16, height: 36 }}
			>
				<Icon
					size={18}
					strokeWidth={1.75}
					aria-hidden="true"
				/>
			</span>
			<span
				className="text-[13px] font-medium tracking-tight whitespace-nowrap transition-opacity duration-200 group-hover:text-[var(--place-text-primary)]"
				style={{
					opacity: expanded ? 1 : 0,
					pointerEvents: expanded ? 'auto' : 'none',
				}}
			>
				{item.label}
			</span>
		</Link>
	);
}

export function Sidebar() {
	const pathname = usePathname() ?? '/';
	const [expanded, setExpanded] = useState(false);

	// Holodeck navigation is a mode-specific rail; desktop and popouts stand alone.
	if (pathname === '/' || pathname.startsWith('/popout')) return null;

	return (
		<aside
			aria-label="Holodeck navigation"
			onMouseEnter={() => setExpanded(true)}
			onMouseLeave={() => setExpanded(false)}
			onFocus={() => setExpanded(true)}
			onBlur={(e) => {
				// Collapse only when focus leaves the sidebar entirely.
				if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
					setExpanded(false);
				}
			}}
			className="glass fixed left-2 top-2 bottom-2 z-[60] flex flex-col rounded-2xl select-none"
			style={{
				width: expanded ? EXPANDED_W : COLLAPSED_W,
				transition:
					'width 220ms var(--place-ease-smooth, cubic-bezier(0.65,0.05,0,1))',
				borderColor: 'var(--place-border-default)',
			}}
		>
			{/* Brand */}
			<div
				className="flex items-center gap-3 h-12 mx-2 mt-2 mb-1 px-1 rounded-lg overflow-hidden"
				style={{ color: 'var(--place-text-primary)' }}
			>
				<span
					className="flex items-center justify-center shrink-0"
					style={{ width: COLLAPSED_W - 16, height: 36 }}
				>
					<span
						className="flex items-center justify-center w-7 h-7 rounded-md font-semibold text-[13px] tracking-tight"
						style={{
							background:
								'linear-gradient(135deg, var(--place-primary-500), var(--place-secondary-500))',
							color: '#fff',
							boxShadow: '0 4px 14px var(--place-primary-glow)',
						}}
						aria-hidden="true"
					>
						E
					</span>
				</span>
				<span
					className="text-[13px] font-semibold tracking-wide whitespace-nowrap transition-opacity duration-200"
					style={{
						opacity: expanded ? 1 : 0,
						pointerEvents: expanded ? 'auto' : 'none',
						fontFamily:
							'var(--font-cinzel), var(--place-font-sans)',
					}}
				>
					Holodeck
				</span>
			</div>

			{/* Divider */}
			<div
				aria-hidden="true"
				className="mx-3 mb-1 h-px"
				style={{ background: 'var(--place-border-subtle)' }}
			/>

			{/* Scrollable nav body */}
			<nav className="flex-1 overflow-y-auto overflow-x-hidden py-1">
				{NAV_GROUPS.map((group, gi) => (
					<div key={group.label} className="mb-1">
						<div
							className="h-5 mx-3 mb-0.5 flex items-center text-[10px] uppercase tracking-[0.14em] whitespace-nowrap transition-opacity duration-200"
							style={{
								opacity: expanded ? 0.7 : 0,
								color: 'var(--place-text-tertiary)',
							}}
							aria-hidden={!expanded}
						>
							{group.label}
						</div>
						<ul>
							{group.items.map((item) => (
								<li key={item.href}>
									<NavLink
										item={item}
										expanded={expanded}
										active={isActive(pathname, item.href)}
									/>
								</li>
							))}
						</ul>
						{gi < NAV_GROUPS.length - 1 ? (
							<div
								aria-hidden="true"
								className="mx-3 my-1 h-px"
								style={{
									background: 'var(--place-border-subtle)',
								}}
							/>
						) : null}
					</div>
				))}
			</nav>

			{/* Footer */}
			<div
				className="border-t pt-1 pb-2"
				style={{ borderColor: 'var(--place-border-subtle)' }}
			>
				<ul>
					{FOOTER_ITEMS.map((item) => (
						<li key={item.href}>
							<NavLink
								item={item}
								expanded={expanded}
								active={isActive(pathname, item.href)}
							/>
						</li>
					))}
				</ul>
			</div>
		</aside>
	);
}
