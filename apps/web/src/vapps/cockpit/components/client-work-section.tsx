"use client";

import { useState } from "react";

import { cockpitNavigate } from "../router";

export interface ClientWorkProject {
	readonly id: string;
	readonly name: string;
}

export interface ClientWorkClient {
	readonly id: string;
	readonly name: string;
	readonly color: string | null;
	readonly projects: readonly ClientWorkProject[];
}

export interface ClientWorkSectionProps {
	readonly clients: readonly ClientWorkClient[];
	readonly activeRoute: string;
}

export function ClientWorkSection({ clients, activeRoute }: ClientWorkSectionProps) {
	const [open, setOpen] = useState(true);
	const [openClients, setOpenClients] = useState<Record<string, boolean>>({});

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
				CLIENTS
			</button>

			{open ? (
				<ul className="cockpit-sidebar__items cockpit-sidebar__items--client-work">
					{clients.length === 0 ? (
						<li className="cockpit-sidebar__empty">no clients yet</li>
					) : null}
					{clients.map((client) => {
						const clientOpen = openClients[client.id] ?? true;
						const clientRoute = `/clients/${client.id}`;
						const clientActive = activeRoute === clientRoute;
						return (
							<li key={client.id}>
								<div className="cockpit-sidebar__client-row">
									<button
										type="button"
										onClick={() =>
											setOpenClients((state) => ({
												...state,
												[client.id]: !(state[client.id] ?? true),
											}))
										}
										className="cockpit-sidebar__caret-btn"
										aria-label={
											clientOpen
												? `Collapse ${client.name}`
												: `Expand ${client.name}`
										}
									>
										{clientOpen ? "v" : ">"}
									</button>
									<a
										href={`#${clientRoute}`}
										aria-current={clientActive ? "page" : undefined}
										className="cockpit-sidebar__row cockpit-sidebar__row--client"
										onClick={(event) => {
											event.preventDefault();
											cockpitNavigate(clientRoute);
										}}
									>
										<span
											className="cockpit-sidebar__dot"
											style={{
												background: client.color ?? "var(--place-accent-client)",
											}}
											aria-hidden
										/>
										<span className="cockpit-sidebar__label">{client.name}</span>
									</a>
								</div>
								{clientOpen ? (
									<ul className="cockpit-sidebar__nested">
										{client.projects.map((project) => {
											const projectRoute = `/clients/${client.id}/${project.id}`;
											const isActive = activeRoute === projectRoute;
											return (
												<li key={project.id}>
													<a
														href={`#${projectRoute}`}
														aria-current={isActive ? "page" : undefined}
														className="cockpit-sidebar__nested-row"
														onClick={(event) => {
															event.preventDefault();
															cockpitNavigate(projectRoute);
														}}
													>
														{project.name}
													</a>
												</li>
											);
										})}
									</ul>
								) : null}
							</li>
						);
					})}
				</ul>
			) : null}
		</section>
	);
}
