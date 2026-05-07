"use client";

import { useEffect, useState } from "react";

import { selectClientBench } from "../data/projections";
import type { ClientBench } from "../data/types";
import { cockpitNavigate } from "../router";
import { ProjectBenchView } from "./project-bench-view";

export interface ClientBenchViewProps {
	readonly clientId: string;
}

type LoadState =
	| { readonly status: "loading" }
	| { readonly status: "missing" }
	| { readonly status: "ok"; readonly bench: ClientBench };

export function ClientBenchView({ clientId }: ClientBenchViewProps) {
	const [state, setState] = useState<LoadState>({ status: "loading" });

	useEffect(() => {
		let cancelled = false;
		setState({ status: "loading" });
		selectClientBench(clientId)
			.then((bench) => {
				if (cancelled) return;
				if (!bench) {
					setState({ status: "missing" });
					return;
				}
				setState({ status: "ok", bench });
			})
			.catch(() => {
				if (cancelled) return;
				setState({ status: "missing" });
			});
		return () => {
			cancelled = true;
		};
	}, [clientId]);

	if (state.status === "loading") {
		return <p className="cockpit-empty">Loading client bench...</p>;
	}

	if (state.status === "missing") {
		// Donor falls back to a project bench if the id resolves to a project.
		return <ProjectBenchView projectId={clientId} />;
	}

	const { bench } = state;
	const projectById = new Map(bench.projects.map((project) => [project.id, project]));
	const openQueue = bench.queue.filter((item) => item.status === "open").slice(0, 12);
	const activeLanes = bench.lanes.filter(
		(lane) => lane.status === "open" || lane.status === "claimed",
	);

	return (
		<div className="cockpit-stack">
			<header className="cockpit-page-header">
				<p className="cockpit-eyebrow">CLIENT</p>
				<h1 className="cockpit-page-title">
					<span
						className="cockpit-page-dot"
						style={{ background: bench.client.color ?? "var(--place-accent-client)" }}
						aria-hidden
					/>
					{bench.client.name}
				</h1>
				<p className="cockpit-page-meta">
					{bench.projects.length} project{bench.projects.length === 1 ? "" : "s"} -{" "}
					{activeLanes.length} active lane{activeLanes.length === 1 ? "" : "s"} -{" "}
					{openQueue.length} ready queue item{openQueue.length === 1 ? "" : "s"}
				</p>
			</header>

			<section>
				<h2 className="cockpit-section-title">Projects</h2>
				<div className="cockpit-grid">
					{bench.projects.map((project) => {
						const route = `/clients/${bench.client.id}/${project.id}`;
						return (
							<a
								key={project.id}
								href={`#${route}`}
								onClick={(event) => {
									event.preventDefault();
									cockpitNavigate(route);
								}}
								className="cockpit-card"
							>
								<p className="cockpit-card__title">{project.name}</p>
								<p className="cockpit-mono cockpit-id">{project.id}</p>
							</a>
						);
					})}
				</div>
			</section>

			<section>
				<h2 className="cockpit-section-title">Ready queue</h2>
				{openQueue.length === 0 ? (
					<p className="cockpit-empty">No open queue items.</p>
				) : (
					<ul className="cockpit-list cockpit-list--bordered">
						{openQueue.map((item) => {
							const project = projectById.get(item.project_id);
							return (
								<li key={item.id} className="cockpit-row">
									<div className="cockpit-row__head">
										<div className="cockpit-row__head-text">
											<p className="cockpit-row__title">{item.title}</p>
											<p className="cockpit-row__why">
												{project?.name ?? item.project_id}
											</p>
											<p className="cockpit-row__meta">
												<span className="cockpit-mono">{item.id}</span>
												<span className="cockpit-mono">{item.promotion_state}</span>
											</p>
										</div>
										<span className="cockpit-priority">P{item.priority}</span>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</section>
		</div>
	);
}
