"use client";

import { useState, type ReactNode } from "react";

import { cockpitNavigate } from "../router";

export interface SidebarItem {
	readonly route: string;
	readonly label: string;
	readonly icon?: ReactNode;
	readonly dot?: string;
}

export interface SidebarSectionProps {
	readonly title: string;
	readonly items: readonly SidebarItem[];
	readonly defaultOpen?: boolean;
	readonly emptyHint?: string;
	readonly activeRoute: string;
}

export function SidebarSection({
	title,
	items,
	defaultOpen = true,
	emptyHint,
	activeRoute,
}: SidebarSectionProps) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<section className="cockpit-sidebar__section">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className="cockpit-sidebar__section-head"
				aria-expanded={open}
			>
				<span className="cockpit-sidebar__caret" aria-hidden>
					{open ? "v" : ">"}
				</span>
				{title}
			</button>
			{open ? (
				<ul className="cockpit-sidebar__items">
					{items.length === 0 && emptyHint ? (
						<li className="cockpit-sidebar__empty">{emptyHint}</li>
					) : null}
					{items.map((item) => {
						const isActive = activeRoute === item.route;
						return (
							<li key={item.route}>
								<a
									href={`#${item.route}`}
									aria-current={isActive ? "page" : undefined}
									className="cockpit-sidebar__row"
									onClick={(event) => {
										event.preventDefault();
										cockpitNavigate(item.route);
									}}
								>
									{item.dot ? (
										<span
											className="cockpit-sidebar__dot"
											style={{ background: item.dot }}
											aria-hidden
										/>
									) : null}
									{item.icon ? (
										<span className="cockpit-sidebar__icon" aria-hidden>
											{item.icon}
										</span>
									) : null}
									<span className="cockpit-sidebar__label">{item.label}</span>
								</a>
							</li>
						);
					})}
				</ul>
			) : null}
		</section>
	);
}
