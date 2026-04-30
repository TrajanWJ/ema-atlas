"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

import { EMA_SCOPE, MOCK_PROJECTION_LABEL } from "@/src/app/mock-projections";
import {
	type AppDef,
	getAppsByGroup,
} from "@/src/lib/app-registrations";
import { useWindowStore } from "@/src/stores/window-store";
import type { AppId } from "@/src/types/window";

const FADE_EASE: [number, number, number, number] = [0.65, 0.05, 0, 1];
const HERO_RECENT_LIMIT = 4;

function openApp(id: string): void {
	useWindowStore.getState().openWindow(id as AppId);
}

function recentAppIds(windowMap: ReadonlyMap<string, { readonly appId: AppId; readonly zIndex: number }>): readonly AppId[] {
	const sorted = [...windowMap.values()].sort((a, b) => b.zIndex - a.zIndex);
	const seen = new Set<AppId>();
	const out: AppId[] = [];
	for (const window of sorted) {
		if (seen.has(window.appId)) continue;
		seen.add(window.appId);
		out.push(window.appId);
		if (out.length >= HERO_RECENT_LIMIT) break;
	}
	return out;
}

export function LaunchpadApp() {
	const windows = useWindowStore((state) => state.windows);
	const emaApps = useMemo(() => getAppsByGroup("ema"), []);
	const placeApps = useMemo(() => getAppsByGroup("place-tools"), []);
	const recents = useMemo(() => recentAppIds(windows), [windows]);
	const recentApps = useMemo(() => {
		const all: readonly AppDef[] = [...emaApps, ...placeApps];
		const lookup = new Map(all.map((app) => [app.id, app] as const));
		return recents
			.map((id) => lookup.get(id))
			.filter((app): app is AppDef => Boolean(app));
	}, [recents, emaApps, placeApps]);

	return (
		<div data-app="launchpad" className="lp-root">
			<header className="lp-header">
				<div className="lp-header__meta">
					<p className="lp-header__eyebrow">vDesktop launch surface</p>
					<span className="lp-pill" data-state="staged">
						{MOCK_PROJECTION_LABEL}
					</span>
				</div>
				<h1 className="lp-header__title">Launchpad</h1>
				<p className="lp-header__intent">
					Start surface for {EMA_SCOPE.projectName}. Open any vApp or resume
					Blueprint where you left off.
				</p>
			</header>

			<section className="lp-hero" aria-label="Recent and resume">
				<div className="lp-hero__recents">
					<p className="lp-section__eyebrow">recent</p>
					<div className="lp-hero__recent-row">
						{recentApps.length === 0 ? (
							<p className="lp-hero__empty">No recently opened vApps yet.</p>
						) : (
							recentApps.map((app) => (
								<LaunchpadTile key={app.id} app={app} onOpen={() => openApp(app.id)} />
							))
						)}
					</div>
				</div>

				<motion.button
					type="button"
					className="lp-hero__resume"
					onClick={() => openApp("blueprint")}
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2, ease: FADE_EASE }}
				>
					<span className="lp-hero__resume-eyebrow">resume</span>
					<strong className="lp-hero__resume-title">Blueprint</strong>
					<span className="lp-hero__resume-detail">
						{EMA_SCOPE.spaceName} · {EMA_SCOPE.projectName}
					</span>
				</motion.button>
			</section>

			<section className="lp-group" aria-label="EMA Workspace">
				<header className="lp-group__head">
					<p className="lp-section__eyebrow">section 1</p>
					<h2 className="lp-group__title">EMA Workspace</h2>
				</header>
				<div className="lp-grid">
					{emaApps.map((app) => (
						<LaunchpadTile key={app.id} app={app} onOpen={() => openApp(app.id)} />
					))}
				</div>
			</section>

			<section className="lp-group" aria-label="Place Tools">
				<header className="lp-group__head">
					<p className="lp-section__eyebrow">section 2</p>
					<h2 className="lp-group__title">Place Tools</h2>
				</header>
				<div className="lp-grid">
					{placeApps.map((app) => (
						<LaunchpadTile key={app.id} app={app} onOpen={() => openApp(app.id)} />
					))}
				</div>
			</section>
		</div>
	);
}

function LaunchpadTile({
	app,
	onOpen,
}: {
	readonly app: AppDef;
	readonly onOpen: () => void;
}) {
	return (
		<motion.button
			type="button"
			className="lp-tile"
			onClick={onOpen}
			whileHover={{ y: -2 }}
			transition={{ duration: 0.15, ease: FADE_EASE }}
		>
			<span className="lp-tile__icon" aria-hidden>
				{app.icon}
			</span>
			<strong className="lp-tile__name">{app.name}</strong>
		</motion.button>
	);
}

export default LaunchpadApp;
