"use client";

import { useEffect, useState } from "react";

import { selectNow, selectProjectsByKind } from "../data/projections";
import type { CockpitProject, NowProjection } from "../data/types";

export function TlAboutPage() {
	const [now, setNow] = useState<NowProjection | null>(null);
	const [all, setAll] = useState<readonly CockpitProject[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		Promise.all([selectNow(), selectProjectsByKind("all")])
			.then(([nextNow, projects]) => {
				if (cancelled) return;
				setNow(nextNow);
				setAll(projects);
			})
			.catch(() => {
				if (cancelled) return;
				setNow(null);
				setAll([]);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	if (!now || !all) {
		return <p className="cockpit-empty">Loading task layer...</p>;
	}

	return (
		<div className="cockpit-stack">
			<header className="cockpit-page-header">
				<p className="cockpit-eyebrow">TASK LAYER</p>
				<h1 className="cockpit-page-title">tl about</h1>
				<p className="cockpit-page-meta">
					Compact summary mirroring{" "}
					<span className="cockpit-mono">ema tl about --summary</span>.
				</p>
			</header>

			<section className="cockpit-stat-grid">
				<Stat label="Projects" value={all.length} />
				<Stat label="Clients" value={now.client_count} />
				<Stat label="Personal" value={now.personal_count} />
				<Stat label="Ready queue" value={now.ready_queue.length} />
			</section>

			<section>
				<h2 className="cockpit-section-title">Projects</h2>
				<ul className="cockpit-list cockpit-list--bordered">
					{all.map((project) => (
						<li key={project.id} className="cockpit-tl-row">
							<span className="cockpit-tl-row__name">
								<span
									className="cockpit-tl-row__dot"
									style={{
										background: project.client_color ?? "var(--place-text-tertiary)",
									}}
									aria-hidden
								/>
								{project.client_label ?? project.name}
							</span>
							<span className="cockpit-mono cockpit-tl-row__kind">{project.kind}</span>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}

function Stat({ label, value }: { readonly label: string; readonly value: number }) {
	return (
		<div className="cockpit-stat">
			<p className="cockpit-stat__label">{label}</p>
			<p className="cockpit-stat__value">{value}</p>
		</div>
	);
}
