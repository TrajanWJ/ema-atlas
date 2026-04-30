"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

import { getAppsByGroup } from "@/src/lib/app-registry";
import { useWindowStore } from "@/src/stores/window-store";
import type { AppId } from "@/src/types/window";

const FADE_EASE: [number, number, number, number] = [0.65, 0.05, 0, 1];

export function PlaceToolsApp() {
	const apps = useMemo(() => getAppsByGroup("place-tools"), []);

	return (
		<div data-app="place-tools" className="pt-root">
			<header className="pt-header">
				<p className="pt-eyebrow">place.org tools</p>
				<h1 className="pt-title">Place Tools</h1>
				<p className="pt-intent">
					{apps.length} personal-productivity surfaces from the place.org base.
					Click any tile to open it as a window.
				</p>
			</header>

			<div className="pt-grid" role="grid">
				{apps.map((app, index) => (
					<motion.button
						key={app.id}
						type="button"
						role="gridcell"
						className="pt-tile glass"
						onClick={() => {
							useWindowStore.getState().openWindow(app.id as AppId);
						}}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.18,
							delay: Math.min(index, 18) * 0.012,
							ease: FADE_EASE,
						}}
						whileHover={{ y: -2 }}
					>
						<span className="pt-tile__icon" aria-hidden>
							{app.icon}
						</span>
						<strong className="pt-tile__name">{app.name}</strong>
					</motion.button>
				))}
			</div>

			<style>{`
				.pt-root {
					height: 100%;
					padding: 24px 28px 28px;
					overflow: auto;
					color: var(--place-text-primary);
					display: flex;
					flex-direction: column;
					gap: 20px;
				}
				.pt-header { display: flex; flex-direction: column; gap: 4px; }
				.pt-eyebrow {
					font-size: 0.7rem;
					letter-spacing: 0.08em;
					text-transform: uppercase;
					color: var(--place-text-secondary);
					margin: 0;
				}
				.pt-title {
					margin: 0;
					font-size: 1.5rem;
					font-weight: 600;
					letter-spacing: -0.01em;
				}
				.pt-intent {
					margin: 0;
					font-size: 0.85rem;
					color: var(--place-text-secondary);
					max-width: 56ch;
				}
				.pt-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
					gap: 12px;
				}
				.pt-tile {
					all: unset;
					cursor: default;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					gap: 8px;
					padding: 14px 8px;
					border-radius: 10px;
					transition: background 0.15s, border-color 0.15s;
					border: 1px solid var(--place-border-default);
					background: rgba(255,255,255,0.02);
				}
				.pt-tile:hover {
					background: rgba(255,255,255,0.05);
					border-color: var(--place-border-strong);
				}
				.pt-tile__icon {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 32px;
					height: 32px;
					color: var(--place-text-primary);
				}
				.pt-tile__name {
					font-size: 0.72rem;
					font-weight: 500;
					text-align: center;
					color: var(--place-text-primary);
				}
			`}</style>
		</div>
	);
}

export default PlaceToolsApp;
