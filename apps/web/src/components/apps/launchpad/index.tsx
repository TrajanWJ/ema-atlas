"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

import { type AppDef, getAppsByGroup } from "@/src/lib/app-registrations";
import { sendCommand } from "@/src/lib/ipc";
import { useReadyQueue, type ReadyQueueItem } from "@/src/projections/use-ready-queue";
import { useScope } from "@/src/projections/use-scope";
import { useVcalendarPhase } from "@/src/projections/use-vcalendar-phase";
import { useWindowStore } from "@/src/stores/window-store";
import type { AppId } from "@/src/types/window";

const FADE_EASE: [number, number, number, number] = [0.65, 0.05, 0, 1];
const HERO_RECENT_LIMIT = 4;

function openApp(id: string): void {
	useWindowStore.getState().openWindow(id as AppId);
}

function recentAppIds(
	windowMap: ReadonlyMap<string, { readonly appId: AppId; readonly zIndex: number }>,
): readonly AppId[] {
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

	const { orgName, spaceName, projectName, isLive, offline, daemonState } = useScope();
	const { top: readyTop, readyCount, blockedCount, hasProjection: queueHasProjection } = useReadyQueue();
	const { phase } = useVcalendarPhase();

	const intentLine = isLive
		? `Start surface for ${projectName}. Open any vApp or jump to the next ready work.`
		: offline
			? "Daemon offline — local mode. Some surfaces fall back to staged data until the daemon reconnects."
			: "Daemon connecting — live scope arriving shortly.";

	return (
		<div data-app="launchpad" className="lp-root">
			<header className="lp-header">
				<ScopeRail
					orgName={orgName}
					spaceName={spaceName}
					projectName={projectName}
					phase={phase}
					daemonState={daemonState}
					isLive={isLive}
					offline={offline}
				/>
				<h1 className="lp-header__title">Launchpad</h1>
				<p className="lp-header__intent">{intentLine}</p>
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

				<NextWorkCard
					top={readyTop}
					hasProjection={queueHasProjection}
					readyCount={readyCount}
					blockedCount={blockedCount}
				/>
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

function ScopeRail({
	orgName,
	spaceName,
	projectName,
	phase,
	daemonState,
	isLive,
	offline,
}: {
	readonly orgName: string;
	readonly spaceName: string;
	readonly projectName: string;
	readonly phase: string | null;
	readonly daemonState: string;
	readonly isLive: boolean;
	readonly offline: boolean;
}) {
	const stateLabel = isLive
		? "live · daemon"
		: offline
			? "offline · local"
			: daemonState === "connecting" || daemonState === "reconnecting"
				? "connecting…"
				: daemonState;
	const dotColor = isLive
		? "var(--place-success, #2DD4A8)"
		: offline
			? "var(--place-text-muted, #71717A)"
			: "var(--place-warning, #F59E0B)";

	return (
		<div
			className="lp-header__meta"
			style={{ display: "flex", flexDirection: "column", gap: 6 }}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 8,
					fontSize: "0.7rem",
					letterSpacing: "0.04em",
					color: "var(--place-text-secondary)",
				}}
			>
				<ScopeChip label="org" value={orgName} />
				<span style={{ color: "var(--place-text-muted)" }}>›</span>
				<ScopeChip label="space" value={spaceName} />
				<span style={{ color: "var(--place-text-muted)" }}>›</span>
				<ScopeChip label="project" value={projectName} />
				<span
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						marginLeft: "auto",
						fontSize: "0.62rem",
						color: "var(--place-text-tertiary)",
					}}
				>
					<span
						aria-hidden
						style={{
							width: 6,
							height: 6,
							borderRadius: "50%",
							background: dotColor,
						}}
					/>
					{stateLabel}
				</span>
			</div>
			{phase ? (
				<p
					style={{
						margin: 0,
						fontSize: "0.62rem",
						letterSpacing: "0.12em",
						textTransform: "uppercase",
						color: "var(--place-text-tertiary)",
					}}
				>
					vcalendar phase ·{" "}
					<span style={{ color: "var(--place-text-secondary)" }}>{phase}</span>
				</p>
			) : null}
		</div>
	);
}

function ScopeChip({ label, value }: { readonly label: string; readonly value: string }) {
	return (
		<span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
			<span
				style={{
					fontSize: "0.55rem",
					letterSpacing: "0.14em",
					textTransform: "uppercase",
					color: "var(--place-text-tertiary)",
				}}
			>
				{label}
			</span>
			<strong
				style={{
					fontSize: "0.78rem",
					fontWeight: 500,
					color: "var(--place-text-primary)",
				}}
			>
				{value}
			</strong>
		</span>
	);
}

function NextWorkCard({
	top,
	hasProjection,
	readyCount,
	blockedCount,
}: {
	readonly top: ReadyQueueItem | null;
	readonly hasProjection: boolean;
	readonly readyCount: number;
	readonly blockedCount: number;
}) {
	if (!hasProjection) {
		return (
			<motion.div
				className="lp-hero__resume"
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2, ease: FADE_EASE }}
				style={{ display: "flex", flexDirection: "column", gap: 6, cursor: "default" }}
			>
				<span className="lp-hero__resume-eyebrow">next work</span>
				<strong
					className="lp-hero__resume-title"
					style={{ color: "var(--place-text-secondary)" }}
				>
					daemon offline
				</strong>
				<span className="lp-hero__resume-detail">
					Connect the daemon to surface live ready work. Run <code>ema ping</code> from a terminal.
				</span>
			</motion.div>
		);
	}

	if (!top) {
		return (
			<motion.button
				type="button"
				className="lp-hero__resume"
				onClick={() => openApp("agent-work")}
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2, ease: FADE_EASE }}
			>
				<span className="lp-hero__resume-eyebrow">next work</span>
				<strong className="lp-hero__resume-title">Empty ready queue</strong>
				<span className="lp-hero__resume-detail">
					{blockedCount > 0
						? `${blockedCount} blocked · open Agent Work to triage.`
						: "No queued work in this project. Open Agent Work to capture intent."}
				</span>
			</motion.button>
		);
	}

	const queueId = top.queue_item_id ?? top.id;

	return (
		<motion.div
			className="lp-hero__resume"
			initial={{ opacity: 0, y: 4 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: FADE_EASE }}
			style={{ display: "flex", flexDirection: "column", gap: 8, cursor: "default" }}
		>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					justifyContent: "space-between",
					gap: 8,
				}}
			>
				<span className="lp-hero__resume-eyebrow">next work · ema next</span>
				<span style={{ fontSize: "0.62rem", color: "var(--place-text-tertiary)" }}>
					{readyCount} ready{blockedCount > 0 ? ` · ${blockedCount} blocked` : ""}
				</span>
			</div>
			<strong className="lp-hero__resume-title" style={{ lineHeight: 1.3 }}>
				{top.title}
			</strong>
			{top.why ? (
				<span
					className="lp-hero__resume-detail"
					style={{
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{top.why}
				</span>
			) : null}
			<div style={{ display: "flex", gap: 6, marginTop: 4 }}>
				<HeroButton variant="primary" onClick={() => openApp("agent-work")}>
					Open in Agent Work
				</HeroButton>
				<HeroButton
					variant="secondary"
					onClick={() => {
						void sendCommand("queue.block", {
							queue_item_id: queueId,
							actor: "actor:dev-console",
							blocked_reason: "blocked from launchpad",
						});
					}}
				>
					Block
				</HeroButton>
				<HeroButton
					variant="secondary"
					onClick={() => {
						void sendCommand("queue.close", {
							queue_item_id: queueId,
							actor: "actor:dev-console",
							result: "closed from launchpad",
						});
					}}
				>
					Close
				</HeroButton>
			</div>
			<span style={{ fontSize: "0.6rem", color: "var(--place-text-muted)", marginTop: 2 }}>
				{queueId}
			</span>
		</motion.div>
	);
}

function HeroButton({
	variant,
	onClick,
	children,
}: {
	readonly variant: "primary" | "secondary";
	readonly onClick: () => void;
	readonly children: React.ReactNode;
}) {
	const primary = variant === "primary";
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				padding: "0.4rem 0.7rem",
				fontSize: "0.7rem",
				borderRadius: 6,
				border: primary ? "none" : "1px solid var(--place-border-default)",
				background: primary ? "var(--place-primary-400, #2DD4A8)" : "transparent",
				color: primary ? "var(--place-bg-base, #060610)" : "var(--place-text-secondary)",
				cursor: "pointer",
				fontWeight: 500,
				letterSpacing: "0.02em",
			}}
		>
			{children}
		</button>
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
