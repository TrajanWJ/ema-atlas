"use client";

import { useEffect, useState } from "react";

import { selectProjectBench } from "../data/projections";
import type { ProjectBench } from "../data/types";
import { Bench } from "./bench";

export interface ProjectBenchViewProps {
	readonly projectId: string;
}

export function ProjectBenchView({ projectId }: ProjectBenchViewProps) {
	const [bench, setBench] = useState<ProjectBench | null | "loading">("loading");

	useEffect(() => {
		let cancelled = false;
		setBench("loading");
		selectProjectBench(projectId)
			.then((value) => {
				if (cancelled) return;
				setBench(value);
			})
			.catch(() => {
				if (cancelled) return;
				setBench(null);
			});
		return () => {
			cancelled = true;
		};
	}, [projectId]);

	if (bench === "loading") {
		return <p className="cockpit-empty">Loading project bench...</p>;
	}
	if (!bench) {
		return (
			<p className="cockpit-empty">
				Project not found: <span className="cockpit-mono">{projectId}</span>
			</p>
		);
	}

	const { project, lanes, queue, vcalendar_blocks, problems, campaigns } = bench;

	return (
		<div className="cockpit-stack">
			<header className="cockpit-page-header">
				<p className="cockpit-eyebrow">
					{project.kind === "client"
						? project.client_label
							? `CLIENT - ${project.client_label}`
							: "CLIENT"
						: project.kind === "personal"
							? "PERSONAL"
							: "INTERNAL"}
				</p>
				<h1 className="cockpit-page-title">
					{project.client_color ? (
						<span
							className="cockpit-page-dot"
							style={{ background: project.client_color }}
							aria-hidden
						/>
					) : null}
					{project.name}
				</h1>
				<p className="cockpit-mono cockpit-id">{project.id}</p>
			</header>

			<Bench
				tabs={[
					{
						id: "lanes",
						label: "Lanes",
						count: lanes.length,
						content:
							lanes.length === 0 ? (
								<p className="cockpit-empty">No lanes yet.</p>
							) : (
								<ul className="cockpit-list">
									{lanes.map((lane) => (
										<li key={lane.id} className="cockpit-row">
											<p className="cockpit-row__title">{lane.title}</p>
											<p className="cockpit-row__why">{lane.why}</p>
											<p className="cockpit-row__meta">
												<span className="cockpit-mono">{lane.id}</span>
												<span className="cockpit-pill">{lane.status}</span>
											</p>
										</li>
									))}
								</ul>
							),
					},
					{
						id: "queue",
						label: "Queue",
						count: queue.length,
						content:
							queue.length === 0 ? (
								<p className="cockpit-empty">Queue is clear.</p>
							) : (
								<ul className="cockpit-list">
									{queue.map((item) => (
										<li key={item.id} className="cockpit-row">
											<div className="cockpit-row__head">
												<div className="cockpit-row__head-text">
													<p className="cockpit-row__title">{item.title}</p>
													<p className="cockpit-row__why">{item.why}</p>
													<p className="cockpit-row__meta">
														<span className="cockpit-mono">{item.id}</span>
														<span className="cockpit-mono">
															{item.promotion_state}
														</span>
														<span className="cockpit-mono">{item.status}</span>
													</p>
												</div>
												<span className="cockpit-priority">P{item.priority}</span>
											</div>
										</li>
									))}
								</ul>
							),
					},
					{
						id: "campaigns",
						label: "Campaigns",
						count: campaigns.length,
						content:
							campaigns.length === 0 ? (
								<p className="cockpit-empty">No campaigns.</p>
							) : (
								<ul className="cockpit-list">
									{campaigns.map((campaign) => (
										<li key={campaign.id} className="cockpit-row">
											<p className="cockpit-row__title">{campaign.title}</p>
											<p className="cockpit-row__why">{campaign.why}</p>
										</li>
									))}
								</ul>
							),
					},
					{
						id: "problems",
						label: "Problems",
						count: problems.length,
						content:
							problems.length === 0 ? (
								<p className="cockpit-empty">No open problems.</p>
							) : (
								<ul className="cockpit-list">
									{problems.map((problem) => (
										<li key={problem.id} className="cockpit-row">
											<p className="cockpit-row__title">{problem.title}</p>
											<p className="cockpit-row__why">{problem.why}</p>
										</li>
									))}
								</ul>
							),
					},
					{
						id: "vcalendar",
						label: "vCalendar",
						count: vcalendar_blocks.length,
						content:
							vcalendar_blocks.length === 0 ? (
								<p className="cockpit-empty">No scheduled blocks.</p>
							) : (
								<ul className="cockpit-list">
									{vcalendar_blocks.map((block) => (
										<li key={block.id} className="cockpit-row">
											<p className="cockpit-row__title">
												{block.phase} - {block.start_at} to {block.end_at}
											</p>
											<p className="cockpit-row__why">
												target <span className="cockpit-mono">{block.target_id}</span>
											</p>
										</li>
									))}
								</ul>
							),
					},
				]}
			/>
		</div>
	);
}
