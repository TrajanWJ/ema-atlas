"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { useAtlasLiveState, formatAtlasTime } from "./live-state";
import { useWindowStore } from "@/src/stores/window-store";
import type { AppId } from "@/src/types/window";
import type { AtlasLiveState, RouteLink, SourceDoc } from "@/src/lib/atlas-live";

const ROUTE_GROUPS = ["Surfaces", "Atlas", "Live state", "Web", "Tools"] as const;

function openApp(appId: AppId): void {
	useWindowStore.getState().openWindow(appId);
}

function isStale(value: string): boolean {
	return value.toLowerCase().includes("stale");
}

function groupRoutes(routes: readonly RouteLink[]) {
	return ROUTE_GROUPS.map((group) => ({
		group,
		routes: routes.filter((route) => route.group === group),
	})).filter((entry) => entry.routes.length > 0);
}

function shortLane(lane: string): string {
	if (!lane.startsWith("lane:")) return lane;
	return lane.length > 18 ? `${lane.slice(0, 15)}...` : lane;
}

export function AtlasApp() {
	const { data, loading, error } = useAtlasLiveState();
	const routeGroups = useMemo(() => groupRoutes(data?.routes ?? []), [data?.routes]);

	if (!data) {
		return (
			<AtlasFrame>
				<div className="atlas-empty">
					<strong>{loading ? "Reading Atlas state" : "Atlas state unavailable"}</strong>
					{error ? <span>{error}</span> : <span>Waiting for the file-backed project record.</span>}
				</div>
			</AtlasFrame>
		);
	}

	const activeLanes = data.lanes.filter((lane) => lane.status.includes("active"));
	const activeClaims = data.claims.filter((claim) => !isStale(claim.refreshBy));
	const staleClaims = Math.max(0, data.claims.length - activeClaims.length);
	const blueprintLive = data.blueprints.filter((doc) => doc.status !== "stub");

	return (
		<AtlasFrame>
			<header className="atlas-head">
				<div className="atlas-head__copy">
					<div className="atlas-kicker">
						<span>live project map</span>
						<span>pull / 15s</span>
					</div>
					<h1>EMA Atlas</h1>
					<p>
						File-backed project state from the root Atlas, rendered inside the EMA desktop
						contract. Desktop stays the root; this window carries the map.
					</p>
				</div>
				<div className="atlas-head__actions" aria-label="Atlas actions">
					<button type="button" onClick={() => openApp("hq")}>HQ</button>
					<button type="button" onClick={() => openApp("blueprint")}>Blueprint</button>
					<button type="button" onClick={() => openApp("cwt")}>CWT</button>
					<button type="button" onClick={() => openApp("clients")}>Clients</button>
				</div>
			</header>

			<section className="atlas-metrics" aria-label="Atlas pulse">
				<Metric label="Last pull" value={formatAtlasTime(data.generatedAt)} detail="server-read state" />
				<Metric label="Active lanes" value={activeLanes.length} detail={`${data.lanes.length} catalog rows`} />
				<Metric label="Claims" value={data.claims.length} detail={`${staleClaims} stale`} />
				<Metric label="Blueprints" value={`${blueprintLive.length}/${data.blueprints.length}`} detail="live source docs" />
				<Metric label="Routes" value={data.routes.length} detail="EMA surfaces" />
			</section>

			<div className="atlas-two">
				<Panel title="Active Claims" eyebrow="workspace">
					{data.claims.slice(0, 5).map((claim) => (
						<Row key={`${claim.owner}-${claim.lane}`} eyebrow={claim.owner} title={shortLane(claim.lane)} meta={claim.refreshBy}>
							{claim.next || claim.goal || claim.scope}
						</Row>
					))}
				</Panel>

				<Panel title="Pending Handoffs" eyebrow="handoff">
					{data.handoffs.slice(0, 5).map((handoff) => (
						<Row key={`${handoff.route}-${handoff.state}`} eyebrow={handoff.state} title={handoff.route} meta={handoff.verify}>
							{handoff.open || handoff.changed}
						</Row>
					))}
				</Panel>
			</div>

			<section className="atlas-cwt">
				<div>
					<span className="atlas-label">CWT boundary</span>
					<h2>{data.cwt.name}</h2>
					<p>
						{data.cwt.projectId} owns {data.cwt.ownership.length} current-work record
						families. Atlas links to it; CWT remains the live client/project state owner.
					</p>
				</div>
				<div className="atlas-chip-row">
					<a href={data.cwt.standaloneUrl} target="_blank" rel="noreferrer">Standalone</a>
					<a href={data.cwt.bridgeUrl} target="_blank" rel="noreferrer">EMA bridge</a>
					<button type="button" onClick={() => openApp("clients")}>Client plane</button>
				</div>
			</section>

			<div className="atlas-two atlas-two--wide">
				<Panel title="Lane Catalog" eyebrow="daemon projection">
					{data.lanes.slice(0, 8).map((lane) => (
						<Row key={lane.lane} eyebrow={lane.owner} title={`${shortLane(lane.lane)} · ${lane.project}`} meta={lane.status}>
							{lane.doneWhen}
						</Row>
					))}
				</Panel>

				<Panel title="Route Index" eyebrow="surface map">
					<div className="atlas-route-groups">
						{routeGroups.map(({ group, routes }) => (
							<div key={group}>
								<strong>{group}</strong>
								<div className="atlas-chip-row">
									{routes.slice(0, 14).map((route) => (
										<a href={route.href} key={route.href}>{route.label}</a>
									))}
								</div>
							</div>
						))}
					</div>
				</Panel>
			</div>

			<div className="atlas-three">
				<SourceColumn title="Blueprints" docs={data.blueprints} />
				<SourceColumn title="Project Docs" docs={data.projectDocs} />
				<SourceColumn title="Workspace Docs" docs={data.workspaceDocs.slice(0, 8)} />
			</div>

			<div className="atlas-two">
				<Panel title="Subprojects" eyebrow="vApp records">
					{data.subprojects.map((project) => (
						<Row key={project.href} eyebrow="subproject" title={project.name} meta={project.href}>
							{project.summary || "No summary yet."}
						</Row>
					))}
				</Panel>

				<Panel title="Local Surfaces" eyebrow="links">
					{data.localSurfaces.map((surface) => (
						<Row key={surface.href} eyebrow={surface.kind} title={surface.label} meta={surface.href}>
							{surface.note}
						</Row>
					))}
				</Panel>
			</div>
		</AtlasFrame>
	);
}

function AtlasFrame({ children }: { readonly children: ReactNode }) {
	return (
		<section className="atlas-root" data-app="atlas">
			{children}
			<AtlasStyles />
		</section>
	);
}

function Metric({
	label,
	value,
	detail,
}: {
	readonly label: string;
	readonly value: string | number;
	readonly detail: string;
}) {
	return (
		<article className="atlas-metric">
			<span>{label}</span>
			<strong>{value}</strong>
			<small>{detail}</small>
		</article>
	);
}

function Panel({
	title,
	eyebrow,
	children,
}: {
	readonly title: string;
	readonly eyebrow: string;
	readonly children: ReactNode;
}) {
	return (
		<section className="atlas-panel">
			<header>
				<span className="atlas-label">{eyebrow}</span>
				<h2>{title}</h2>
			</header>
			<div className="atlas-list">{children}</div>
		</section>
	);
}

function Row({
	eyebrow,
	title,
	meta,
	children,
}: {
	readonly eyebrow: string;
	readonly title: string;
	readonly meta?: string;
	readonly children: ReactNode;
}) {
	return (
		<article className="atlas-row">
			<div>
				<span>{eyebrow}</span>
				<strong>{title}</strong>
			</div>
			<p>{children}</p>
			{meta ? <small>{meta}</small> : null}
		</article>
	);
}

function SourceColumn({
	docs,
	title,
}: {
	readonly docs: readonly SourceDoc[];
	readonly title: string;
}) {
	return (
		<Panel title={title} eyebrow="source">
			{docs.map((doc) => (
				<Row key={doc.href} eyebrow={doc.status} title={doc.title} meta={formatAtlasTime(doc.updatedAt)}>
					{doc.summary || "No summary yet."}
				</Row>
			))}
		</Panel>
	);
}

function AtlasStyles() {
	return (
		<style>{`
			.atlas-root {
				height: 100%;
				overflow: auto;
				padding: 26px;
				color: var(--place-text-primary);
				background:
					linear-gradient(180deg, rgba(124,196,255,0.07), transparent 260px),
					var(--place-bg-primary);
			}
			.atlas-head {
				display: flex;
				justify-content: space-between;
				gap: 18px;
				align-items: flex-start;
				margin-bottom: 18px;
			}
			.atlas-head__copy {
				display: flex;
				flex-direction: column;
				gap: 8px;
				max-width: 760px;
			}
			.atlas-kicker,
			.atlas-label,
			.atlas-row span,
			.atlas-metric span {
				font-size: 0.68rem;
				text-transform: uppercase;
				letter-spacing: 0.1em;
				color: var(--place-text-tertiary);
			}
			.atlas-kicker {
				display: flex;
				gap: 8px;
				flex-wrap: wrap;
			}
			.atlas-kicker span,
			.atlas-chip-row a,
			.atlas-chip-row button,
			.atlas-head__actions button {
				border: 1px solid var(--place-border-subtle);
				border-radius: 7px;
				background: var(--place-surface-2);
				color: var(--place-text-secondary);
				padding: 5px 8px;
				text-decoration: none;
				font: inherit;
				font-size: 0.74rem;
			}
			.atlas-head h1 {
				margin: 0;
				font-size: 1.7rem;
				font-weight: 650;
			}
			.atlas-head p,
			.atlas-cwt p,
			.atlas-row p {
				margin: 0;
				color: var(--place-text-secondary);
				line-height: 1.45;
			}
			.atlas-head__actions,
			.atlas-chip-row {
				display: flex;
				flex-wrap: wrap;
				gap: 7px;
			}
			.atlas-head__actions button,
			.atlas-chip-row button {
				cursor: pointer;
			}
			.atlas-metrics,
			.atlas-three {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
				gap: 10px;
				margin-bottom: 12px;
			}
			.atlas-metric,
			.atlas-panel,
			.atlas-cwt {
				border: 1px solid var(--place-border-default);
				border-radius: 8px;
				background: color-mix(in srgb, var(--place-surface-1) 92%, transparent);
			}
			.atlas-metric {
				padding: 12px;
				display: flex;
				flex-direction: column;
				gap: 3px;
				min-height: 90px;
			}
			.atlas-metric strong {
				font-size: 1.08rem;
			}
			.atlas-metric small,
			.atlas-row small {
				color: var(--place-text-muted);
				font-size: 0.72rem;
			}
			.atlas-two {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 12px;
				margin-bottom: 12px;
			}
			.atlas-two--wide {
				grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
			}
			.atlas-panel {
				padding: 14px;
				min-width: 0;
			}
			.atlas-panel header {
				display: flex;
				flex-direction: column;
				gap: 3px;
				margin-bottom: 10px;
			}
			.atlas-panel h2,
			.atlas-cwt h2 {
				margin: 0;
				font-size: 0.98rem;
				font-weight: 650;
			}
			.atlas-list {
				display: flex;
				flex-direction: column;
				gap: 8px;
			}
			.atlas-row {
				border: 1px solid var(--place-border-subtle);
				border-radius: 7px;
				background: rgba(255,255,255,0.025);
				padding: 9px;
				display: flex;
				flex-direction: column;
				gap: 4px;
				min-width: 0;
			}
			.atlas-row div {
				display: flex;
				justify-content: space-between;
				gap: 8px;
				align-items: baseline;
			}
			.atlas-row strong {
				font-size: 0.82rem;
				overflow-wrap: anywhere;
			}
			.atlas-row p {
				font-size: 0.78rem;
				overflow-wrap: anywhere;
			}
			.atlas-cwt {
				padding: 14px;
				display: flex;
				justify-content: space-between;
				gap: 14px;
				align-items: center;
				margin-bottom: 12px;
			}
			.atlas-cwt > div:first-child {
				display: flex;
				flex-direction: column;
				gap: 5px;
			}
			.atlas-route-groups {
				display: flex;
				flex-direction: column;
				gap: 10px;
			}
			.atlas-route-groups strong {
				display: block;
				margin-bottom: 5px;
				font-size: 0.78rem;
				color: var(--place-text-primary);
			}
			.atlas-empty {
				min-height: 100%;
				display: grid;
				place-content: center;
				gap: 6px;
				text-align: center;
				color: var(--place-text-secondary);
			}
			@media (max-width: 760px) {
				.atlas-root {
					padding: 18px;
				}
				.atlas-head,
				.atlas-cwt {
					flex-direction: column;
				}
				.atlas-two,
				.atlas-two--wide {
					grid-template-columns: 1fr;
				}
			}
		`}</style>
	);
}

export default AtlasApp;
