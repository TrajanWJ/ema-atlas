"use client";

import { useEffect, useState } from "react";

import { AgentChat } from "../components/agent-chat";
import { selectNow } from "../data/projections";
import type { NowProjection } from "../data/types";

export function NowPage() {
	const [now, setNow] = useState<NowProjection | null>(null);

	useEffect(() => {
		let cancelled = false;
		selectNow()
			.then((value) => {
				if (cancelled) return;
				setNow(value);
			})
			.catch(() => {
				if (cancelled) return;
				setNow(null);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	if (!now) {
		return <p className="cockpit-empty">Loading NOW projection...</p>;
	}

	return (
		<div className="cockpit-now">
			<div className="cockpit-now__main">
				<header className="cockpit-page-header">
					<p className="cockpit-eyebrow">
						NOW - vCalendar phase: {now.vcalendar_phase}
					</p>
					<h1 className="cockpit-page-title">What is pressing</h1>
					<p className="cockpit-page-meta">
						{now.client_count} client{now.client_count === 1 ? "" : "s"} -{" "}
						{now.client_project_count} client project
						{now.client_project_count === 1 ? "" : "s"} - {now.personal_count} personal project
						{now.personal_count === 1 ? "" : "s"}. Brain Dump anything new at{" "}
						<span className="cockpit-mono">/capture</span>.
					</p>
				</header>

				<section>
					<h2 className="cockpit-section-title">Active lane</h2>
					{now.active_lane ? (
						<div className="cockpit-card">
							<p className="cockpit-card__title">{now.active_lane.title}</p>
							<p className="cockpit-row__why">{now.active_lane.why}</p>
							<p className="cockpit-mono cockpit-id">{now.active_lane.id}</p>
						</div>
					) : (
						<p className="cockpit-empty">
							No active lane. Open one from a project bench.
						</p>
					)}
				</section>

				<section>
					<h2 className="cockpit-section-title">
						Ready queue (top {now.ready_queue.length})
					</h2>
					{now.ready_queue.length === 0 ? (
						<p className="cockpit-empty">
							Queue is clear. Capture or pick a project from the sidebar.
						</p>
					) : (
						<ul className="cockpit-list cockpit-list--bordered">
							{now.ready_queue.map((item) => (
								<li key={item.id} className="cockpit-row">
									<div className="cockpit-row__head">
										<div className="cockpit-row__head-text">
											<p className="cockpit-row__title">{item.title}</p>
											<p className="cockpit-row__why">{item.why}</p>
											<p className="cockpit-row__meta">
												<span className="cockpit-mono">{item.id}</span>
												<span className="cockpit-mono">{item.promotion_state}</span>
											</p>
										</div>
										<span className="cockpit-priority">P{item.priority}</span>
									</div>
								</li>
							))}
						</ul>
					)}
				</section>

				<section>
					<h2 className="cockpit-section-title">
						Pending handoffs (top {now.latest_handoffs.length})
					</h2>
					{now.latest_handoffs.length === 0 ? (
						<p className="cockpit-empty">No pending handoffs.</p>
					) : (
						<ul className="cockpit-list cockpit-list--bordered">
							{now.latest_handoffs.map((handoff) => (
								<li key={handoff.id} className="cockpit-row">
									<div className="cockpit-row__head">
										<div className="cockpit-row__head-text">
											<p className="cockpit-row__title">
												{handoff.from_owner} to {handoff.to_owner}
											</p>
											<p className="cockpit-row__why">{handoff.next_move}</p>
											<p className="cockpit-row__meta">
												<span className="cockpit-mono">{handoff.id}</span>
												<span className="cockpit-mono">{handoff.state}</span>
												<span className="cockpit-mono">
													conf {handoff.envelope_confidence.toFixed(2)}
												</span>
												<span className="cockpit-mono">
													cmpl {handoff.envelope_completeness.toFixed(2)}
												</span>
												<span className="cockpit-mono">
													{handoff.envelope_provenance}
												</span>
											</p>
										</div>
										<span className="cockpit-pill">{handoff.state}</span>
									</div>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
			<AgentChat />
		</div>
	);
}
