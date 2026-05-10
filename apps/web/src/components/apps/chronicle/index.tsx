"use client";

import type {
	ChronicleActivityProjection,
	ChronicleEvent,
	ChronicleSession,
} from "@ema/surface-core/adapter";
import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useChronicleActivity } from "@/src/projections/use-chronicle-activity";

type ViewMode = "events" | "sessions";

const SOURCE_COLORS: Record<string, string> = {
	org: "#8b5cf6",
	space: "#06b6d4",
	project: "#22c55e",
	lane: "#f59e0b",
	queue_item: "#ec4899",
	blueprint: "#60a5fa",
	dispatch: "#a78bfa",
	execution: "#fb7185",
	tool: "#34d399",
	calendar_block: "#f97316",
	vcalendar: "#14b8a6",
	checkup: "#eab308",
};

export function ChronicleApp() {
	const view = useChronicleActivity();
	const projection = view.data;
	const [mode, setMode] = useState<ViewMode>("events");
	const [sourceFilter, setSourceFilter] = useState<string>("all");
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

	const filteredEvents = useMemo(
		() =>
			projection.events.filter(
				(event) => sourceFilter === "all" || event.source === sourceFilter,
			),
		[projection.events, sourceFilter],
	);
	const filteredSessions = useMemo(
		() =>
			projection.sessions.filter((session) => {
				if (sourceFilter === "all") return true;
				const latest = projection.events.find((event) => event.session_id === session.id);
				return latest?.source === sourceFilter;
			}),
		[projection.events, projection.sessions, sourceFilter],
	);
	const selectedSession = selectedSessionId
		? projection.sessions.find((session) => session.id === selectedSessionId)
		: null;
	const selectedEvents = selectedSessionId
		? projection.events.filter((event) => event.session_id === selectedSessionId)
		: [];

	return (
		<section
			data-app="chronicle"
			data-vapp-ready="1"
			className="grid h-full min-h-0 grid-cols-[220px_minmax(0,1fr)_300px] overflow-hidden"
			style={{ color: "var(--place-text-primary)" }}
		>
			<SourceRail
				projection={projection}
				offline={view.offline}
				active={sourceFilter}
				onSelect={setSourceFilter}
			/>
			<main className="flex min-h-0 flex-col overflow-hidden border-x border-white/10">
				<header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
					<div className="min-w-0">
						<p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
							daemon activity
						</p>
						<h1 className="truncate text-xl font-semibold">Chronicle</h1>
					</div>
					<div className="flex items-center gap-2">
						<ModeButton active={mode === "events"} onClick={() => setMode("events")}>
							events
						</ModeButton>
						<ModeButton active={mode === "sessions"} onClick={() => setMode("sessions")}>
							sessions
						</ModeButton>
					</div>
				</header>
				<div className="min-h-0 flex-1 overflow-auto px-4 py-3">
					{mode === "events" ? (
						<EventList events={filteredEvents} onSelect={setSelectedSessionId} />
					) : (
						<SessionList sessions={filteredSessions} onSelect={setSelectedSessionId} />
					)}
				</div>
			</main>
			<SessionPanel session={selectedSession} events={selectedEvents} />
		</section>
	);
}

function SourceRail({
	projection,
	offline,
	active,
	onSelect,
}: {
	projection: ChronicleActivityProjection;
	offline: boolean;
	active: string;
	onSelect: (source: string) => void;
}) {
	const total = projection.events.length;
	return (
		<aside className="flex min-h-0 flex-col gap-4 overflow-auto bg-black/15 px-4 py-4">
			<div>
				<p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
					Chronicle
				</p>
				<p className="mt-1 text-xs text-white/55">
					{offline ? "waiting for daemon projection" : `${total} daemon events`}
				</p>
			</div>
			<button
				type="button"
				onClick={() => onSelect("all")}
				className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm"
				style={railButtonStyle(active === "all")}
			>
				<span>all</span>
				<span className="font-mono text-xs text-white/50">{total}</span>
			</button>
			<div className="flex flex-col gap-1">
				{projection.sources.map((source) => (
					<button
						key={source.source}
						type="button"
						onClick={() => onSelect(source.source)}
						className="flex items-center justify-between rounded-md px-3 py-2 text-left text-sm"
						style={railButtonStyle(active === source.source)}
					>
						<span className="flex min-w-0 items-center gap-2">
							<span
								className="h-2 w-2 shrink-0 rounded-full"
								style={{ background: sourceColor(source.source) }}
							/>
							<span className="truncate">{source.source}</span>
						</span>
						<span className="font-mono text-xs text-white/50">{source.event_count}</span>
					</button>
				))}
			</div>
		</aside>
	);
}

function EventList({
	events,
	onSelect,
}: {
	events: ChronicleEvent[];
	onSelect: (sessionId: string) => void;
}) {
	if (events.length === 0) return <EmptyState label="No daemon events in this slice." />;
	return (
		<ol className="flex flex-col gap-1">
			{events.map((event) => (
				<li
					key={event.id}
					data-evidence-source={event.source}
					data-evidence-kind={event.kind}
				>
					<button
						type="button"
						onClick={() => onSelect(event.session_id)}
						className="grid w-full grid-cols-[88px_120px_minmax(0,1fr)_72px] items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left text-xs transition-colors hover:border-white/10 hover:bg-white/[0.04]"
					>
						<span className="font-mono text-white/45">{formatTime(event.ts)}</span>
						<span className="flex min-w-0 items-center gap-2">
							<span
								className="h-2 w-2 shrink-0 rounded-full"
								style={{ background: sourceColor(event.source) }}
							/>
							<span className="truncate capitalize">{event.source}</span>
						</span>
						<span className="min-w-0 truncate text-white/75">{event.label || event.kind}</span>
						<span className="truncate text-right font-mono text-white/35">
							{shortId(event.session_id)}
						</span>
					</button>
				</li>
			))}
		</ol>
	);
}

function SessionList({
	sessions,
	onSelect,
}: {
	sessions: ChronicleSession[];
	onSelect: (sessionId: string) => void;
}) {
	if (sessions.length === 0) return <EmptyState label="No sessions in this slice." />;
	return (
		<ol className="flex flex-col gap-1">
			{sessions.map((session) => (
				<li key={session.id}>
					<button
						type="button"
						onClick={() => onSelect(session.id)}
						className="grid w-full grid-cols-[minmax(0,1fr)_92px_88px] items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left text-xs transition-colors hover:border-white/10 hover:bg-white/[0.04]"
					>
						<span className="min-w-0">
							<span className="block truncate font-medium text-white/80">
								{shortId(session.id)}
							</span>
							<span className="block truncate text-white/40">{session.latest_kind}</span>
						</span>
						<span className="text-right font-mono text-white/55">
							{session.event_count} events
						</span>
						<span className="text-right font-mono text-white/45">
							{formatTime(session.last_event_at)}
						</span>
					</button>
				</li>
			))}
		</ol>
	);
}

function SessionPanel({
	session,
	events,
}: {
	session: ChronicleSession | null | undefined;
	events: ChronicleEvent[];
}) {
	if (!session) {
		return (
			<aside className="flex h-full items-center justify-center px-6 text-center text-xs text-white/45">
				Select an event or session to inspect its daemon replay.
			</aside>
		);
	}
	return (
		<aside className="flex min-h-0 flex-col overflow-hidden bg-black/15">
			<header className="border-b border-white/10 px-4 py-4">
				<p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
					session detail
				</p>
				<h2 className="mt-1 truncate text-sm font-semibold">{shortId(session.id)}</h2>
				<p className="mt-1 text-xs text-white/45">
					{session.event_count} events · last {formatTime(session.last_event_at)}
				</p>
			</header>
			<ol className="min-h-0 flex-1 overflow-auto px-3 py-3">
				{events.map((event) => (
					<li
						key={event.id}
						className="border-l border-white/10 pb-3 pl-3 text-xs"
						data-evidence-source={event.source}
						data-evidence-kind={event.kind}
					>
						<p className="font-mono text-white/35">{formatTime(event.ts)}</p>
						<p className="mt-1 text-white/75">{event.label || event.kind}</p>
						<p className="mt-1 font-mono text-[10px] text-white/35">{event.kind}</p>
						<EvidenceLinkRow event={event} />
					</li>
				))}
			</ol>
		</aside>
	);
}

function ModeButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="rounded-md border px-3 py-1.5 text-xs"
			style={railButtonStyle(active)}
		>
			{children}
		</button>
	);
}

function EmptyState({ label }: { label: string }) {
	return (
		<div className="flex h-full items-center justify-center text-center text-sm text-white/45">
			{label}
		</div>
	);
}

function sourceColor(source: string): string {
	return SOURCE_COLORS[source] ?? "#94a3b8";
}

function railButtonStyle(active: boolean): CSSProperties {
	return {
		background: active ? "rgba(255,255,255,0.08)" : "transparent",
		borderColor: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
		color: active ? "var(--place-text-primary)" : "var(--place-text-secondary)",
	};
}

function shortId(id: string): string {
	if (id.length <= 18) return id;
	return `${id.slice(0, 11)}...${id.slice(-4)}`;
}

function formatTime(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value || "--";
	return new Intl.DateTimeFormat(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).format(date);
}

// ---------------------------------------------------------------------------
// Sprint 5: evidence-link wiring.
//
// Each chronicle event's (source, kind) is mapped to an evidence target that
// the operator can pivot to. Real payload-keyed evidence (queue_item_id,
// dispatch_id, execution_id, blueprint_node_id) is not yet surfaced through
// `chronicle.activity` — this maps the visible source dimension to the most
// likely target vApp scope. Each link carries a `data-evidence-target`
// attribute for E2E tests; a click navigates to the target vApp scope where
// possible. Until cross-vApp routing fully resolves payload ids, the link is
// scoped to the destination vApp's index view.
// ---------------------------------------------------------------------------

type EvidenceLink = {
	kind: string;             // queue_item, lane, dispatch, execution, blueprint_node, source_file
	target_vapp: string;      // cockpit | blueprint | hq | duct-tape | finder
	href: string;             // ?vapp=...&...
	label: string;
};

function evidenceLinksForEvent(event: ChronicleEvent): EvidenceLink[] {
	const links: EvidenceLink[] = [];
	const source = event.source;
	const kind = event.kind;

	if (source === "queue_item") {
		links.push({
			kind: "queue_item",
			target_vapp: "cockpit",
			href: `?vapp=cockpit&intent=${encodeURIComponent(event.session_id)}`,
			label: "open in cockpit",
		});
	}
	if (source === "lane") {
		links.push({
			kind: "lane",
			target_vapp: "cockpit",
			href: `?vapp=cockpit&lane=${encodeURIComponent(event.session_id)}`,
			label: "open lane",
		});
	}
	if (source === "dispatch" || kind.startsWith("dispatch.")) {
		links.push({
			kind: "dispatch",
			target_vapp: "duct-tape",
			href: `?vapp=duct-tape&dispatch=${encodeURIComponent(event.session_id)}`,
			label: "view dispatch",
		});
	}
	if (source === "execution" || kind.startsWith("execution.")) {
		links.push({
			kind: "execution",
			target_vapp: "duct-tape",
			href: `?vapp=duct-tape&execution=${encodeURIComponent(event.session_id)}`,
			label: "view execution",
		});
	}
	if (source === "blueprint" || kind.startsWith("blueprint.")) {
		links.push({
			kind: "blueprint_node",
			target_vapp: "blueprint",
			href: `?vapp=blueprint&node=${encodeURIComponent(event.session_id)}`,
			label: "open in blueprint",
		});
	}
	if (event.project_id) {
		links.push({
			kind: "source_file",
			target_vapp: "finder",
			href: `?vapp=finder&project=${encodeURIComponent(event.project_id)}`,
			label: `project ${shortId(event.project_id)}`,
		});
	}
	return links;
}

function EvidenceLinkRow({ event }: { event: ChronicleEvent }) {
	const links = evidenceLinksForEvent(event);
	if (links.length === 0) {
		return (
			<p
				className="mt-1 text-[10px] text-white/30"
				data-evidence-target="none"
			>
				No linked evidence on this event.
			</p>
		);
	}
	return (
		<ul
			className="mt-1 flex flex-wrap gap-1.5"
			data-evidence-target-count={links.length}
		>
			{links.map((link) => (
				<li key={`${link.kind}:${link.href}`}>
					<a
						href={link.href}
						data-evidence-target={link.kind}
						data-evidence-target-vapp={link.target_vapp}
						className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white/65"
						style={{
							background: "rgba(255,255,255,0.04)",
							borderColor: "rgba(255,255,255,0.10)",
						}}
					>
						<span
							className="h-1.5 w-1.5 rounded-full"
							style={{ background: sourceColor(link.kind) }}
						/>
						<span>{link.kind}</span>
						<span className="text-white/40">·</span>
						<span className="normal-case tracking-normal text-white/55">
							{link.label}
						</span>
					</a>
				</li>
			))}
		</ul>
	);
}
