"use client";

import { useEffect, useState, type ReactNode } from "react";

import { selectProjectBench } from "../data/projections";
import type {
	CockpitIntentionCard,
	CockpitIntentionsProjection,
	ProjectBench,
} from "../data/types";
import { Bench } from "./bench";

export interface ProjectBenchViewProps {
	readonly projectId: string;
	readonly defaultTab?: string;
}

export function ProjectBenchView({ projectId, defaultTab }: ProjectBenchViewProps) {
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

	const {
		project,
		lanes,
		queue,
		vcalendar_blocks,
		problems,
		campaigns,
		workspace,
		intentions,
		active_builds,
		surfaces,
		health,
	} = bench;

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
				{workspace ? (
					<p className="cockpit-page-meta">
						{workspace.source} - {workspace.daemon_authority}
						{workspace.scope_warning ? (
							<StatusPill tone="warn">scope warning</StatusPill>
						) : null}
					</p>
				) : null}
			</header>

			{workspace ? (
				<section className="cockpit-health-band" aria-label="Project health">
					<StatusPill tone={health?.daemon === "up" ? "ok" : "danger"}>
						daemon {health?.daemon ?? workspace.daemon_authority}
					</StatusPill>
					<StatusPill tone={health?.web === "up" ? "ok" : "warn"}>
						web {health?.web ?? "unknown"}
					</StatusPill>
					<StatusPill tone="neutral">builds {active_builds.length}</StatusPill>
					<StatusPill tone="neutral">surfaces {surfaces.length}</StatusPill>
					<StatusPill tone="neutral">
						intentions {intentions?.recommended_queue.length ?? 0}
					</StatusPill>
					<StatusPill tone={health?.dirty_builds ? "warn" : "neutral"}>
						dirty {health?.dirty_builds ?? 0}
					</StatusPill>
					<StatusPill tone={health?.no_git_builds ? "warn" : "neutral"}>
						no git {health?.no_git_builds ?? 0}
					</StatusPill>
					{health?.proslync_ready ? (
						<StatusPill tone="ok">Proslync ready</StatusPill>
					) : (
						<StatusPill tone="warn">needs review</StatusPill>
					)}
				</section>
			) : null}

			<Bench
				defaultTab={defaultTab ?? (workspace ? "workspace" : undefined)}
				tabs={[
					{
						id: "workspace",
						label: "Workspace",
						count: workspace ? 1 : 0,
						content: workspace ? (
							<div className="cockpit-workspace-grid">
								<section className="cockpit-workspace-panel">
									<h2 className="cockpit-section-title">EMA scope</h2>
									<MetaLine label="project record" value={workspace.project_record} />
									<MetaLine label="active build" value={workspace.active_build} />
									<MetaLine label="cwd" value={workspace.cwd} />
									<MetaLine label="resolved by" value={workspace.resolution_source} />
									<MetaLine label="home current" value={workspace.home_current_project} />
									<MetaLine label="vCalendar" value={workspace.vcalendar_phase} />
								</section>
								<section className="cockpit-workspace-panel">
									<h2 className="cockpit-section-title">Next handoff command</h2>
									<p className="cockpit-row__why">
										This is the command EMA currently recommends for the Proslync workspace.
									</p>
									<p className="cockpit-command">
										{workspace.next_command ?? "No next command available."}
									</p>
									<div className="cockpit-action-row">
										<button
											className="cockpit-button cockpit-button--control"
											type="button"
											disabled={!workspace.next_command}
											onClick={() => void copyCommand(workspace.next_command)}
										>
											Copy command
										</button>
										<button
											className="cockpit-button cockpit-button--control"
											type="button"
											onClick={() => window.location.assign("#/capture")}
										>
											Capture follow-up
										</button>
									</div>
									{workspace.scope_warning ? (
										<p className="cockpit-warning">{workspace.scope_warning}</p>
									) : null}
								</section>
							</div>
						) : (
							<p className="cockpit-empty">Live workspace projection unavailable.</p>
						),
					},
					{
						id: "intentions",
						label: "Intentions",
						count: intentions?.recommended_queue.length ?? 0,
						content: <IntentionsPanel intentions={intentions} />,
					},
					{
						id: "surfaces",
						label: "Surfaces",
						count: surfaces.length,
						content:
							surfaces.length === 0 ? (
								<p className="cockpit-empty">No product surfaces registered.</p>
							) : (
								<ul className="cockpit-list cockpit-list--bordered">
									{surfaces.map((surface) => (
										<li key={surface.id} className="cockpit-row">
											<div className="cockpit-row__head">
												<div className="cockpit-row__head-text">
													<p className="cockpit-row__title">{surface.label}</p>
													<p className="cockpit-row__why">{surface.role}</p>
												</div>
												<StatusPill tone={statusTone(surface.status)}>
													{surface.status}
												</StatusPill>
											</div>
											<p className="cockpit-row__meta">
												<span className="cockpit-mono">{surface.owner}</span>
												<span className="cockpit-mono">{surface.path}</span>
												{surface.local_url ? (
													<a className="cockpit-inline-link" href={surface.local_url}>
														{surface.local_url}
													</a>
												) : null}
											</p>
											<div className="cockpit-action-row">
												{surface.local_url ? (
													<a className="cockpit-button cockpit-button--control" href={surface.local_url}>
														Open local
													</a>
												) : null}
												<button
													className="cockpit-button cockpit-button--control"
													type="button"
													onClick={() => void copyCommand(surface.path)}
												>
													Copy path
												</button>
											</div>
										</li>
									))}
								</ul>
							),
					},
					{
						id: "builds",
						label: "Builds",
						count: active_builds.length,
						content:
							active_builds.length === 0 ? (
								<p className="cockpit-empty">No active builds registered.</p>
							) : (
								<ul className="cockpit-list cockpit-list--bordered">
									{active_builds.map((build) => (
										<li key={build.id} className="cockpit-row">
											<div className="cockpit-row__head">
												<div className="cockpit-row__head-text">
													<p className="cockpit-row__title">{build.label}</p>
													<p className="cockpit-row__why">{build.role}</p>
												</div>
												<StatusPill tone={statusTone(build.git_status)}>
													{build.git_status}
												</StatusPill>
											</div>
											<p className="cockpit-row__meta">
												<span className="cockpit-mono">{build.path}</span>
												{build.branch ? (
													<span className="cockpit-mono">branch {build.branch}</span>
												) : null}
												{build.head ? (
													<span className="cockpit-mono">HEAD {build.head}</span>
												) : null}
												{typeof build.dirty_count === "number" ? (
													<span className="cockpit-mono">
														dirty {build.dirty_count}
													</span>
												) : null}
												{build.dev_command ? (
													<span className="cockpit-mono">{build.dev_command}</span>
												) : null}
											</p>
											<div className="cockpit-action-row">
												<button
													className="cockpit-button cockpit-button--control"
													type="button"
													onClick={() => void copyCommand(build.path)}
												>
													Copy path
												</button>
												{build.dev_command ? (
													<button
														className="cockpit-button cockpit-button--control"
														type="button"
														onClick={() => void copyCommand(build.dev_command)}
													>
														Copy dev command
													</button>
												) : null}
											</div>
										</li>
									))}
								</ul>
							),
					},
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
												<StatusPill tone={statusTone(lane.status)}>{lane.status}</StatusPill>
												{lane.actor_id ? (
													<span className="cockpit-mono">{lane.actor_id}</span>
												) : null}
												{lane.next ? (
													<span className="cockpit-mono">next: {lane.next}</span>
												) : null}
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
														{item.lane_id ? (
															<span className="cockpit-mono">{item.lane_id}</span>
														) : null}
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

function IntentionsPanel({
	intentions,
}: {
	readonly intentions: CockpitIntentionsProjection | null;
}) {
	if (!intentions) {
		return (
			<div className="cockpit-stack">
				<p className="cockpit-empty">No harvested intention projection available.</p>
				<p className="cockpit-command">
					ema intention harvest --project proslync-app-ios-final --max-sources 50 --json
				</p>
			</div>
		);
	}

	const { stats } = intentions;
	return (
		<div className="cockpit-stack" data-intention-review-source="hybrid">
			<p className="cockpit-row__meta" data-intention-review-state="banner">
				<span className="cockpit-pill cockpit-pill--neutral">
					review state: file fallback (daemon handler pending)
				</span>
				<span className="cockpit-mono">
					events: intention.reviewed, intention.backfeed.{`{requested,completed,failed}`}
				</span>
			</p>
			<div className="cockpit-stat-grid">
				<IntentionStat label="sources" value={stats.sources_seen} />
				<IntentionStat label="candidates" value={stats.candidate_intents} />
				<IntentionStat label="Proslync" value={stats.proslync_relevant} />
				<IntentionStat label="lost follow-ups" value={stats.lost_followups} />
			</div>

			{intentions.top_tags.length > 0 ? (
				<p className="cockpit-row__meta">
					{intentions.top_tags.slice(0, 8).map((item) => (
						<span key={item.tag} className="cockpit-pill">
							{item.tag} {item.count}
						</span>
					))}
				</p>
			) : null}

			{intentions.recommended_queue.length === 0 ? (
				<p className="cockpit-empty">No queue-ready intentions found.</p>
			) : (
				<ul className="cockpit-list">
					{intentions.recommended_queue.slice(0, 8).map((intent) => (
						<li key={intent.id} className="cockpit-row">
							<div className="cockpit-row__head">
								<div className="cockpit-row__head-text">
									<p className="cockpit-row__title">{intent.title}</p>
									<p className="cockpit-row__why">
										{intent.evidence_ref ?? intent.source_path ?? "No evidence reference."}
									</p>
								</div>
								<span className="cockpit-priority">
									{Math.round(intent.confidence * 100)}%
								</span>
							</div>
							<p className="cockpit-row__meta">
								<span className="cockpit-mono">{intent.id}</span>
								<span className="cockpit-mono">{intent.recommended_destination}</span>
								<span className="cockpit-mono">{intent.review_state}</span>
							</p>
							<p className="cockpit-row__meta">
								{intent.tags.slice(0, 8).map((tag) => (
									<span key={tag} className="cockpit-pill">
										{tag}
									</span>
								))}
							</p>
							<p className="cockpit-command">{backfeedCommand(intent)}</p>
							<div className="cockpit-action-row">
								<button
									className="cockpit-button cockpit-button--control"
									type="button"
									onClick={() => void reviewIntent(intent, "accepted")}
								>
									Accept
								</button>
								<button
									className="cockpit-button cockpit-button--control"
									type="button"
									onClick={() => void reviewIntent(intent, "deferred")}
								>
									Defer
								</button>
								<button
									className="cockpit-button cockpit-button--control cockpit-button--danger"
									type="button"
									onClick={() => void reviewIntent(intent, "rejected")}
								>
									Reject
								</button>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function IntentionStat({
	label,
	value,
}: {
	readonly label: string;
	readonly value: number;
}) {
	return (
		<div className="cockpit-stat">
			<p className="cockpit-stat__label">{label}</p>
			<p className="cockpit-stat__value">{value}</p>
		</div>
	);
}

function backfeedCommand(intent: CockpitIntentionCard): string {
	return `ema intention backfeed --intent "${intent.id}" --destination queue --dry-run --json`;
}

async function copyCommand(value: string | null): Promise<void> {
	if (!value || typeof navigator === "undefined" || !navigator.clipboard) return;
	await navigator.clipboard.writeText(value);
}

function statusTone(status: string): "ok" | "warn" | "danger" | "neutral" {
	const normalized = status.toLowerCase();
	if (["up", "open", "live", "ready", "active", "claimed", "clean", "done"].includes(normalized)) {
		return "ok";
	}
	if (["blocked", "dirty", "staged", "candidate", "planned", "review", "unborn"].includes(normalized)) {
		return "warn";
	}
	if (["down", "missing", "no_git", "offline", "error", "failed"].includes(normalized)) {
		return "danger";
	}
	return "neutral";
}

function StatusPill({
	tone,
	children,
}: {
	readonly tone: "ok" | "warn" | "danger" | "neutral";
	readonly children: ReactNode;
}) {
	return <span className={`cockpit-pill cockpit-pill--${tone}`}>{children}</span>;
}

async function reviewIntent(
	intent: CockpitIntentionCard,
	state: "accepted" | "deferred" | "rejected",
): Promise<void> {
	await fetch("/api/cockpit/intentions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			intent_id: intent.id,
			state,
			reason: "reviewed in cockpit",
			reviewer: "actor:trajan",
		}),
	});
	window.location.reload();
}

function MetaLine({
	label,
	value,
}: {
	readonly label: string;
	readonly value: string | null;
}) {
	return (
		<p className="cockpit-meta-line">
			<span>{label}</span>
			<span className="cockpit-mono">{value ?? "not available"}</span>
		</p>
	);
}
