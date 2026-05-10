"use client";

// Duct Tape vApp — the visible runtime substrate behind Harness Glue.
//
// Sprint 6 first slice: a UI-only shell that subscribes to the four
// daemon projections (`dispatch.registry`, `execution.registry`,
// `tool.timeline`, plus the existing `chronicle.activity`) and a
// static provider connector list. Registration into
// `apps/web/src/lib/app-registrations.ts` lands in Sprint 8.
//
// The component intentionally avoids editorial chrome — it is a
// honest readout of what the daemon canonical event log says is
// currently dispatching, executing, calling tools, and writing
// chronicle activity.

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import { useProjection, useIpcConnection } from "@/src/lib/ipc";

const PROVIDER_CONNECTORS: ProviderConnector[] = [
	{ id: "simulated", status: "ready", source: "ema-cli" },
	{ id: "codex", status: "adapter_available", source: "duct-tape-onion-harness" },
	{ id: "claude-code", status: "unsupported_provider_adapter", source: "duct-tape-onion-harness" },
	{ id: "hermes", status: "unsupported_provider_adapter", source: "future-hermes" },
];

type ProviderConnector = {
	id: string;
	status: "ready" | "adapter_available" | "unsupported_provider_adapter";
	source: string;
};

type DispatchRow = {
	id: string;
	status: string | null;
	provider: string | null;
	intent: string | null;
	prompt_hash: string | null;
	lane_id: string | null;
	intent_id: string | null;
	actor_id: string | null;
	started_at: string | null;
	ended_at: string | null;
	outcome: string | null;
	updated_at: string | null;
};

type ExecutionRow = {
	id: string;
	status: string | null;
	dispatch_id: string | null;
	provider: string | null;
	kind: string | null;
	name: string | null;
	started_at: string | null;
	completed_at: string | null;
	exit_code: string | null;
	duration_ms: string | null;
	error_class: string | null;
	error_message: string | null;
	updated_at: string | null;
};

type ToolRow = {
	id: string;
	execution_id: string | null;
	tool_name: string | null;
	provider: string | null;
	server_name: string | null;
	capability: string | null;
	status: string | null;
	started_at: string | null;
	completed_at: string | null;
	result_summary: string | null;
	error_class: string | null;
	error_message: string | null;
};

type ChronicleEvent = {
	id: string;
	kind: string;
	source: string;
	ts: string;
	actor: string;
	label: string;
};

type DispatchProjection = { source: string; dispatches: DispatchRow[] };
type ExecutionProjection = { source: string; executions: ExecutionRow[] };
type ToolProjection = { source: string; tools: ToolRow[] };
type ChronicleProjection = { source: string; events: ChronicleEvent[] };

export function DuctTapeApp() {
	const connection = useIpcConnection();
	const dispatchData = useProjection<DispatchProjection>("dispatch.registry");
	const executionData = useProjection<ExecutionProjection>("execution.registry");
	const toolData = useProjection<ToolProjection>("tool.timeline");
	const chronicleData = useProjection<ChronicleProjection>("chronicle.activity");

	const dispatches = useMemo(() => dispatchData?.dispatches ?? [], [dispatchData]);
	const executions = useMemo(() => executionData?.executions ?? [], [executionData]);
	const tools = useMemo(() => toolData?.tools ?? [], [toolData]);
	const chronicle = useMemo(() => chronicleData?.events ?? [], [chronicleData]);

	const ready = connection === "open";

	return (
		<section
			data-app="duct-tape"
			data-vapp-ready={ready ? "live" : "offline"}
			className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
			style={{ color: "var(--place-text-primary)" }}
		>
			<header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
				<div className="min-w-0">
					<p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
						runtime substrate
					</p>
					<h1 className="truncate text-xl font-semibold">Duct Tape</h1>
				</div>
				<div className="flex items-center gap-3 text-[11px] text-white/55">
					<span data-testid="duct-tape-conn">{ready ? "daemon · live" : `daemon · ${connection}`}</span>
				</div>
			</header>
			<div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-px overflow-hidden bg-white/5">
				<Panel title="Provider connectors" testId="duct-tape-providers">
					<ProviderList connectors={PROVIDER_CONNECTORS} />
				</Panel>
				<Panel title="Active dispatches" testId="duct-tape-dispatches" count={dispatches.length}>
					<DispatchList rows={dispatches} />
				</Panel>
				<Panel title="Executions" testId="duct-tape-executions" count={executions.length}>
					<ExecutionList rows={executions} />
				</Panel>
				<Panel title="Tool timeline" testId="duct-tape-tools" count={tools.length}>
					<ToolList rows={tools} />
				</Panel>
				<Panel title="Chronicle activity" testId="duct-tape-chronicle" count={chronicle.length} fullRow>
					<ChronicleList events={chronicle} />
				</Panel>
			</div>
		</section>
	);
}

function Panel({
	title,
	testId,
	count,
	fullRow,
	children,
}: {
	title: string;
	testId: string;
	count?: number;
	fullRow?: boolean;
	children: ReactNode;
}) {
	const style: CSSProperties = {
		background: "var(--place-surface-base, rgba(0,0,0,0.25))",
	};
	const className = `flex min-h-0 flex-col overflow-hidden${fullRow ? " col-span-2" : ""}`;
	return (
		<section data-testid={testId} className={className} style={style}>
			<header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
				<h2 className="text-[10px] uppercase tracking-[0.18em] text-white/55">{title}</h2>
				{typeof count === "number" ? (
					<span className="font-mono text-[10px] text-white/40">{count}</span>
				) : null}
			</header>
			<div className="min-h-0 flex-1 overflow-auto px-3 py-2">{children}</div>
		</section>
	);
}

function ProviderList({ connectors }: { connectors: ProviderConnector[] }) {
	return (
		<ul className="flex flex-col gap-1">
			{connectors.map((connector) => (
				<li
					key={connector.id}
					className="flex items-center justify-between rounded-md border border-white/5 bg-black/15 px-3 py-2 text-xs"
				>
					<span className="flex min-w-0 items-center gap-2">
						<span
							className="h-2 w-2 shrink-0 rounded-full"
							style={{ background: connectorColor(connector.status) }}
						/>
						<span className="truncate font-medium text-white/80">{connector.id}</span>
					</span>
					<span className="font-mono text-[10px] text-white/45">{connector.status}</span>
				</li>
			))}
		</ul>
	);
}

function DispatchList({ rows }: { rows: DispatchRow[] }) {
	if (rows.length === 0) return <Empty label="No dispatches yet." />;
	return (
		<ol className="flex flex-col gap-1">
			{rows.slice(-40).reverse().map((row) => (
				<li
					key={row.id}
					className="grid grid-cols-[minmax(0,1fr)_70px_90px] items-center gap-3 rounded-md border border-transparent px-3 py-2 text-xs hover:border-white/10 hover:bg-white/[0.04]"
				>
					<span className="min-w-0 truncate" title={row.id}>
						<span className="block truncate font-medium text-white/80">{row.id}</span>
						<span className="block truncate text-white/45">{row.intent ?? row.provider ?? ""}</span>
					</span>
					<span className="truncate font-mono text-[10px] text-white/55">{row.provider ?? "—"}</span>
					<span className="truncate font-mono text-[10px] text-white/55">{row.status ?? "—"}</span>
				</li>
			))}
		</ol>
	);
}

function ExecutionList({ rows }: { rows: ExecutionRow[] }) {
	if (rows.length === 0) return <Empty label="No executions yet." />;
	return (
		<ol className="flex flex-col gap-1">
			{rows.slice(-40).reverse().map((row) => (
				<li
					key={row.id}
					className="grid grid-cols-[minmax(0,1fr)_70px_90px] items-center gap-3 rounded-md border border-transparent px-3 py-2 text-xs hover:border-white/10 hover:bg-white/[0.04]"
				>
					<span className="min-w-0 truncate" title={row.id}>
						<span className="block truncate font-medium text-white/80">{row.id}</span>
						<span className="block truncate text-white/45">{row.name ?? row.dispatch_id ?? ""}</span>
					</span>
					<span className="truncate font-mono text-[10px] text-white/55">{row.provider ?? "—"}</span>
					<span className="truncate font-mono text-[10px] text-white/55">{row.status ?? "—"}</span>
				</li>
			))}
		</ol>
	);
}

function ToolList({ rows }: { rows: ToolRow[] }) {
	if (rows.length === 0) return <Empty label="No tool calls yet." />;
	return (
		<ol className="flex flex-col gap-1">
			{rows.slice(-60).reverse().map((row) => (
				<li
					key={row.id}
					className="grid grid-cols-[140px_minmax(0,1fr)_80px] items-center gap-3 rounded-md border border-transparent px-3 py-2 text-xs hover:border-white/10 hover:bg-white/[0.04]"
				>
					<span className="truncate font-mono text-[10px] text-white/45" title={row.tool_name ?? ""}>
						{row.tool_name ?? "—"}
					</span>
					<span className="min-w-0 truncate text-white/75">
						{row.result_summary || row.error_message || row.execution_id || ""}
					</span>
					<span className="truncate text-right font-mono text-[10px] text-white/55">
						{row.status ?? "—"}
					</span>
				</li>
			))}
		</ol>
	);
}

function ChronicleList({ events }: { events: ChronicleEvent[] }) {
	if (events.length === 0) return <Empty label="No chronicle activity yet." />;
	return (
		<ol className="flex flex-col gap-1">
			{events.slice(0, 60).map((event) => (
				<li
					key={event.id}
					className="grid grid-cols-[80px_140px_minmax(0,1fr)_120px] items-center gap-3 rounded-md border border-transparent px-3 py-2 text-xs"
				>
					<span className="font-mono text-[10px] text-white/45">{formatTime(event.ts)}</span>
					<span className="truncate font-mono text-[10px] text-white/55">{event.kind}</span>
					<span className="min-w-0 truncate text-white/70">{event.label || event.kind}</span>
					<span className="truncate text-right font-mono text-[10px] text-white/45">{event.actor}</span>
				</li>
			))}
		</ol>
	);
}

function Empty({ label }: { label: string }) {
	return <div className="px-3 py-6 text-xs text-white/45">{label}</div>;
}

function connectorColor(status: ProviderConnector["status"]): string {
	if (status === "ready") return "#22c55e";
	if (status === "adapter_available") return "#facc15";
	return "#94a3b8";
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

export default DuctTapeApp;
