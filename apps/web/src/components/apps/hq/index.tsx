"use client";

/**
 * HQ — operational control room.
 *
 * Reads `hq.pulse` via `useHqPulse()` (with mock fallback owned by Sub A),
 * routes surface buttons through `useWindowStore.openWindow()`, and reads
 * scope from the central `EMA_SCOPE` constant. All canon mutation flows
 * through the daemon — HQ is read-only by design.
 */

import { useMemo } from "react";
import { motion } from "motion/react";
import {
	EMA_SCOPE,
	MOCK_PROJECTION_LABEL,
	agentWorkLaneSummary,
	eventTrail,
	hqProjection,
} from "@/src/app/mock-projections";
import { useHqPulse } from "@/src/projections/use-hq-pulse";
import { useProjection } from "@/src/lib/ipc";
import { useWindowStore } from "@/src/stores/window-store";
import type { AppId } from "@/src/types/window";

type EventTrailProjection = {
	events: Array<{ id: string; kind: string; label: string; ts: string }>;
};

type HqTrailEvent = {
	readonly id?: string;
	readonly time: string;
	readonly surface: string;
	readonly action: string;
};

type SurfaceLink = {
	readonly id: AppId;
	readonly eyebrow: string;
	readonly label: string;
	readonly status: string;
};

// Surface switchboard — the eight canonical EMA vApps. Buttons open the
// corresponding window through the central window store.
const SURFACE_LINKS: readonly SurfaceLink[] = [
	{ id: "hq", eyebrow: "control room", label: "HQ", status: "live" },
	{ id: "atlas", eyebrow: "project map", label: "Atlas", status: "live" },
	{ id: "cwt", eyebrow: "central tracker", label: "Current Work", status: "bridge" },
	{ id: "clients", eyebrow: "boundary", label: "Clients", status: "pointer" },
	{ id: "blueprint", eyebrow: "system map", label: "Blueprint", status: "live" },
	{ id: "git-ema", eyebrow: "connectors", label: "git-ema", status: "live" },
	{ id: "agent-work", eyebrow: "swarm + lanes", label: "Agent Work", status: "live" },
	{ id: "wiki", eyebrow: "doctrine", label: "Wiki", status: "live" },
	{ id: "launchpad", eyebrow: "all surfaces", label: "Launchpad", status: "live" },
	{ id: "settings", eyebrow: "workspace + daemon", label: "Settings", status: "live" },
	{ id: "finder", eyebrow: "files", label: "Finder", status: "live" },
];

const MOTION_EASE = "var(--place-ease-smooth)";

export function HqApp() {
	const realEventTrail = useProjection<EventTrailProjection>("event_trail");
	const trail: HqTrailEvent[] = useMemo(() => {
		if (realEventTrail) {
			return realEventTrail.events.map((event) => ({
				id: event.id,
				time: event.ts.slice(11, 16) || event.ts,
				surface: event.kind,
				action: event.label,
			}));
		}
		return eventTrail.map((event) => ({
			time: event.time,
			surface: event.surface,
			action: event.action,
		}));
	}, [realEventTrail]);
	const trailIsReal = realEventTrail != null;

	// `hq.pulse` shape: Sub A guarantees a non-null projection (mock or live).
	// When live the daemon returns the typed shape; the mock fallback uses the
	// staged `hqProjection`. We tolerate both via duck-typed reads.
	const hqPulse = useHqPulse();
	const pulse = hqPulse.data?.pulse ?? hqProjection.pulse;
	const controls = hqPulse.data?.controls ?? hqProjection.controls;

	const openWindow = useWindowStore((s) => s.openWindow);
	const scopeLabel = `${EMA_SCOPE.orgName} · ${EMA_SCOPE.spaceName} · ${EMA_SCOPE.projectName}`;

	return (
		<motion.section
			className="flex h-full w-full flex-col gap-6 overflow-y-auto p-8"
			data-app="hq"
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.65, 0.05, 0, 1] }}
			style={{ color: "var(--place-text-primary)" }}
		>
			<header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex flex-col gap-2">
					<span
						className="text-xs uppercase tracking-wider"
						style={{ color: "var(--place-secondary-400)" }}
					>
						EMA · {scopeLabel}
					</span>
					<h1 className="text-2xl font-semibold">Daemon-owned. Local-first. Yours.</h1>
					<p
						className="max-w-prose text-sm leading-relaxed"
						style={{ color: "var(--place-text-secondary)" }}
					>
						One workspace. The daemon owns truth. Surfaces are disposable. Open a vApp.
						Get to work.
					</p>
				</div>
				<aside
					aria-label="Projection notice"
					className="flex max-w-sm flex-col gap-2 rounded-lg border p-4 text-sm"
					style={{
						background: "var(--place-surface-1)",
						borderColor: "var(--place-border-default)",
					}}
				>
					<span
						className="self-start rounded px-2 py-0.5 text-xs uppercase tracking-wide"
						style={{
							background: "var(--place-primary-subtle)",
							color: "var(--place-primary-400)",
						}}
					>
						{MOCK_PROJECTION_LABEL}
					</span>
					<strong style={{ color: "var(--place-tertiary-400)" }}>
						Operator path is live.
					</strong>
					<p style={{ color: "var(--place-text-secondary)" }}>
						Make a project. Attach a source. Invite a collaborator. Register this machine.
						That is the loop.
					</p>
				</aside>
			</header>

			<section
				aria-label="HQ pulse"
				className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
			>
				{pulse.map((item) => (
					<article
						key={item.label}
						className="flex flex-col gap-1 rounded-lg border p-3"
						style={{
							background: "var(--place-surface-1)",
							borderColor: "var(--place-border-default)",
						}}
					>
						<span
							className="text-xs uppercase tracking-wide"
							style={{ color: "var(--place-text-tertiary)" }}
						>
							{item.label}
						</span>
						<strong className="text-lg">{item.value}</strong>
						{item.detail ? (
							<p
								className="text-xs leading-relaxed"
								style={{ color: "var(--place-text-muted)" }}
							>
								{item.detail}
							</p>
						) : null}
					</article>
				))}
			</section>

			<div className="grid gap-3 lg:grid-cols-3">
				<section
					className="flex flex-col gap-3 rounded-lg border p-4 lg:col-span-2"
					style={{
						background: "var(--place-surface-1)",
						borderColor: "var(--place-border-default)",
					}}
				>
					<div className="flex items-start justify-between gap-2">
						<div className="flex flex-col">
							<span
								className="text-xs uppercase tracking-wide"
								style={{ color: "var(--place-text-tertiary)" }}
							>
								workspace switchboard
							</span>
							<h2 className="text-base font-semibold">Surface switchboard</h2>
						</div>
						<span
							className="rounded px-2 py-0.5 text-xs"
							style={{
								background: "var(--place-secondary-subtle)",
								color: "var(--place-secondary-400)",
							}}
						>
							local shell
						</span>
					</div>
					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{SURFACE_LINKS.map((surface) => (
							<button
								key={surface.id}
								type="button"
								onClick={() => openWindow(surface.id)}
								className="flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors"
								data-status={surface.status}
								style={{
									background: "var(--place-surface-2)",
									borderColor: "var(--place-border-subtle)",
									color: "var(--place-text-primary)",
									transitionTimingFunction: MOTION_EASE,
									transitionDuration: "180ms",
								}}
							>
								<span
									className="text-xs uppercase tracking-wide"
									style={{ color: "var(--place-text-tertiary)" }}
								>
									{surface.eyebrow}
								</span>
								<strong className="text-sm">{surface.label}</strong>
								<small style={{ color: "var(--place-text-muted)" }}>
									{surface.status}
								</small>
							</button>
						))}
					</div>
				</section>

				<section
					className="flex flex-col gap-3 rounded-lg border p-4"
					style={{
						background: "var(--place-surface-1)",
						borderColor: "var(--place-border-default)",
					}}
				>
					<div className="flex flex-col">
						<span
							className="text-xs uppercase tracking-wide"
							style={{ color: "var(--place-text-tertiary)" }}
						>
							control stack
						</span>
						<h2 className="text-base font-semibold">Next actions</h2>
					</div>
					<div className="flex flex-col gap-2">
						{controls.map((control) => (
							<button
								key={control.label}
								type="button"
								className="flex flex-col items-start gap-0.5 rounded-md border p-2 text-left"
								style={{
									background: "var(--place-surface-2)",
									borderColor: "var(--place-border-subtle)",
									color: "var(--place-text-primary)",
								}}
							>
								<span className="text-sm font-medium">{control.label}</span>
								<strong
									className="text-xs uppercase tracking-wide"
									style={{ color: "var(--place-secondary-400)" }}
								>
									{control.state}
								</strong>
								{control.detail ? (
									<small style={{ color: "var(--place-text-muted)" }}>
										{control.detail}
									</small>
								) : null}
							</button>
						))}
					</div>
				</section>
			</div>

			<div className="grid gap-3 lg:grid-cols-2">
				<section
					className="flex flex-col gap-3 rounded-lg border p-4"
					style={{
						background: "var(--place-surface-1)",
						borderColor: "var(--place-border-default)",
					}}
				>
					<div className="flex items-start justify-between">
						<div className="flex flex-col">
							<span
								className="text-xs uppercase tracking-wide"
								style={{ color: "var(--place-text-tertiary)" }}
							>
								see agent work
							</span>
							<h2 className="text-base font-semibold">Lane status</h2>
						</div>
						<button
							type="button"
							onClick={() => openWindow("agent-work")}
							className="text-xs underline-offset-2 hover:underline"
							style={{ color: "var(--place-secondary-400)" }}
						>
							open lane
						</button>
					</div>
					<div className="flex flex-col gap-2">
						{agentWorkLaneSummary.map((lane) => (
							<article
								key={lane.id}
								className="flex flex-col gap-1 rounded-md border p-2"
								data-lane-status={lane.status}
								style={{
									background: "var(--place-surface-2)",
									borderColor: "var(--place-border-subtle)",
								}}
							>
								<span
									className="text-xs"
									style={{ color: "var(--place-text-tertiary)" }}
								>
									{lane.owner_kind} · {lane.owner_label}
								</span>
								<strong className="text-sm">{lane.title}</strong>
								<div className="flex items-center gap-2 text-xs">
									<span
										className="rounded px-1.5 py-0.5 uppercase tracking-wide"
										style={{
											background: "var(--place-primary-subtle)",
											color: "var(--place-primary-400)",
										}}
									>
										{lane.status}
									</span>
									<code
										className="truncate"
										style={{
											fontFamily: "var(--place-font-mono, monospace)",
											color: "var(--place-text-muted)",
										}}
									>
										{lane.cli}
									</code>
								</div>
							</article>
						))}
					</div>
				</section>

				<section
					className="flex flex-col gap-3 rounded-lg border p-4"
					style={{
						background: "var(--place-surface-1)",
						borderColor: "var(--place-border-default)",
					}}
				>
					<div className="flex flex-col">
						<span
							className="text-xs uppercase tracking-wide"
							style={{ color: "var(--place-text-tertiary)" }}
						>
							event trail
						</span>
						<h2 className="text-base font-semibold">
							{trailIsReal ? "Daemon event trail" : "Local projection trail"}
						</h2>
					</div>
					<ol className="flex flex-col gap-2">
						{trail.map((event, index) => (
							<li
								key={event.id ?? `${event.time}-${event.action}-${index}`}
								className="flex items-baseline gap-2 text-xs"
							>
								<time
									className="w-12 shrink-0 font-mono"
									style={{ color: "var(--place-text-muted)" }}
								>
									{event.time}
								</time>
								<strong style={{ color: "var(--place-secondary-400)" }}>
									{event.surface}
								</strong>
								<span style={{ color: "var(--place-text-secondary)" }}>
									{event.action}
								</span>
							</li>
						))}
					</ol>
				</section>
			</div>
		</motion.section>
	);
}

export default HqApp;
