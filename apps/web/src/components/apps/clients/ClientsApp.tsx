"use client";

import { useAtlasLiveState, formatAtlasTime } from "@/src/components/apps/atlas/live-state";
import { useWindowStore } from "@/src/stores/window-store";

export function ClientsApp() {
	const { data, loading, error } = useAtlasLiveState();

	return (
		<section className="clients-root" data-app="clients">
			<header className="clients-head">
				<div>
					<p className="clients-eyebrow">client pointer plane</p>
					<h1>Clients</h1>
					<p>
						Client truth stays in Current Work Tracker. EMA keeps the pointer, launch
						targets, and ownership boundary visible.
					</p>
				</div>
				<div className="clients-actions">
					<button type="button" onClick={() => useWindowStore.getState().openWindow("cwt")}>
						Open CWT
					</button>
					<button type="button" onClick={() => useWindowStore.getState().openWindow("atlas")}>
						Atlas
					</button>
				</div>
			</header>

			{data ? (
				<>
					<section className="clients-bridge">
						<div>
							<span>Project</span>
							<strong>{data.cwt.projectId}</strong>
							<p>{data.cwt.projectRecord}</p>
						</div>
						<div>
							<span>Active build</span>
							<strong>{data.cwt.name}</strong>
							<p>{data.cwt.activeBuild}</p>
						</div>
						<div>
							<span>Last Atlas pull</span>
							<strong>{formatAtlasTime(data.generatedAt)}</strong>
							<p>CWT bridge route: {data.cwt.bridgeUrl}</p>
						</div>
					</section>

					<section className="clients-panel">
						<header>
							<span>CWT owns</span>
							<h2>{data.cwt.ownership.length} record families</h2>
						</header>
						<div className="clients-chip-grid">
							{data.cwt.ownership.map((family) => (
								<span key={family}>{family}</span>
							))}
						</div>
					</section>

					<section className="clients-panel">
						<header>
							<span>Launch targets</span>
							<h2>Boundary-preserving routes</h2>
						</header>
						<div className="clients-link-grid">
							<a href={data.cwt.standaloneUrl} target="_blank" rel="noreferrer">
								<strong>Standalone CWT</strong>
								<small>{data.cwt.standaloneUrl}</small>
							</a>
							<a href={data.cwt.bridgeUrl} target="_blank" rel="noreferrer">
								<strong>EMA CWT bridge</strong>
								<small>{data.cwt.bridgeUrl}</small>
							</a>
							<a href="/cwt">
								<strong>EMA vApp route</strong>
								<small>/cwt</small>
							</a>
						</div>
					</section>
				</>
			) : (
				<div className="clients-empty">
					<strong>{loading ? "Reading CWT boundary" : "CWT boundary unavailable"}</strong>
					<span>{error ?? "Waiting for Atlas live state."}</span>
				</div>
			)}

			<ClientsStyles />
		</section>
	);
}

function ClientsStyles() {
	return (
		<style>{`
			.clients-root {
				height: 100%;
				overflow: auto;
				padding: 26px;
				color: var(--place-text-primary);
				background:
					linear-gradient(180deg, rgba(157,224,181,0.07), transparent 240px),
					var(--place-bg-primary);
			}
			.clients-head {
				display: flex;
				justify-content: space-between;
				gap: 18px;
				align-items: flex-start;
				margin-bottom: 16px;
			}
			.clients-head h1 {
				margin: 0;
				font-size: 1.55rem;
				font-weight: 650;
			}
			.clients-head p,
			.clients-bridge p {
				margin: 0;
				color: var(--place-text-secondary);
				line-height: 1.45;
			}
			.clients-eyebrow,
			.clients-bridge span,
			.clients-panel header span {
				margin: 0 0 5px;
				display: block;
				font-size: 0.68rem;
				text-transform: uppercase;
				letter-spacing: 0.1em;
				color: var(--place-text-tertiary);
			}
			.clients-actions,
			.clients-chip-grid,
			.clients-link-grid {
				display: flex;
				flex-wrap: wrap;
				gap: 8px;
			}
			.clients-actions button,
			.clients-chip-grid span,
			.clients-link-grid a {
				border: 1px solid var(--place-border-subtle);
				border-radius: 7px;
				background: var(--place-surface-2);
				color: var(--place-text-secondary);
				padding: 7px 9px;
				text-decoration: none;
				font: inherit;
				font-size: 0.78rem;
			}
			.clients-actions button {
				cursor: pointer;
			}
			.clients-bridge {
				display: grid;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				gap: 10px;
				margin-bottom: 12px;
			}
			.clients-bridge > div,
			.clients-panel {
				border: 1px solid var(--place-border-default);
				border-radius: 8px;
				background: color-mix(in srgb, var(--place-surface-1) 92%, transparent);
				padding: 14px;
				min-width: 0;
			}
			.clients-bridge strong,
			.clients-link-grid strong {
				display: block;
				font-size: 0.88rem;
				overflow-wrap: anywhere;
			}
			.clients-bridge p,
			.clients-link-grid small {
				font-size: 0.74rem;
				color: var(--place-text-muted);
				overflow-wrap: anywhere;
			}
			.clients-panel {
				margin-bottom: 12px;
			}
			.clients-panel h2 {
				margin: 0 0 10px;
				font-size: 0.98rem;
				font-weight: 650;
			}
			.clients-link-grid {
				display: grid;
				grid-template-columns: repeat(3, minmax(0, 1fr));
			}
			.clients-link-grid a {
				display: flex;
				flex-direction: column;
				gap: 4px;
				padding: 10px;
			}
			.clients-empty {
				min-height: 50%;
				display: grid;
				place-content: center;
				gap: 6px;
				text-align: center;
				color: var(--place-text-secondary);
			}
			@media (max-width: 820px) {
				.clients-head {
					flex-direction: column;
				}
				.clients-bridge,
				.clients-link-grid {
					grid-template-columns: 1fr;
				}
			}
		`}</style>
	);
}

export default ClientsApp;
