"use client";

import { useState } from "react";
import { useIpcConnection, useProjection, sendCommand } from "@/src/lib/ipc";

// ----------------------------------------------------------------------------
// Projection types — match the daemon emit shapes from
// `apps/daemon/src/ema_sqlite_helpers.erl#blueprint_projection_json` and
// `blueprint_planner_projection_json` and `intent_graph_projection_json`.
// ----------------------------------------------------------------------------

interface SectionRow {
	id: string;
	section_id: string;
	document_id: string;
	parent_section_id: string | null;
	title: string;
	position: number;
	status: string;
}

interface DocumentRow {
	id: string;
	document_id: string;
	title: string;
	project_id: string | null;
	status: string;
	sections: SectionRow[];
}

interface SectionsProjection {
	source: string;
	documents: DocumentRow[];
}

interface GacRow {
	id: string;
	gac_id: string;
	category: string | null;
	priority: string | null;
	question: string | null;
	status: string;
	selected: string | null;
	result_action: string | null;
}

interface BlockerRow {
	id: string;
	blocker_id: string;
	category: string | null;
	priority: string | null;
	title: string | null;
	description: string | null;
	resolve_by: string | null;
	status: string;
}

interface AspirationRow {
	id: string;
	aspiration_id: string;
	title: string | null;
	timeframe: string | null;
	source_type: string | null;
	status: string;
}

interface DecisionRow {
	id: string;
	decision_id: string;
	title: string | null;
	body: string | null;
	supersedes: string | null;
	superseded_by: string | null;
	status: string;
}

interface PlannerProjection {
	source: string;
	gac_cards: GacRow[];
	blockers: BlockerRow[];
	aspirations: AspirationRow[];
	decisions: DecisionRow[];
}

interface GraphNode {
	id: string;
	kind: string;
	title: string | null;
	status: string | null;
}

interface GraphEdge {
	from: string;
	to: string;
	relation: string;
	via: string;
}

interface IntentGraphProjection {
	source: string;
	nodes: GraphNode[];
	edges: GraphEdge[];
}

// ----------------------------------------------------------------------------
// Tab model
// ----------------------------------------------------------------------------

type BlueprintTab = "doc-tree" | "gac" | "blockers" | "aspirations" | "decisions" | "graph";

const TABS: ReadonlyArray<{ id: BlueprintTab; label: string }> = [
	{ id: "doc-tree", label: "Doc Tree" },
	{ id: "gac", label: "GAC Queue" },
	{ id: "blockers", label: "Blockers" },
	{ id: "aspirations", label: "Aspirations" },
	{ id: "decisions", label: "Decisions" },
	{ id: "graph", label: "Intent Graph" },
];

// ----------------------------------------------------------------------------
// Shared style atoms — token-driven, no raw hex.
// ----------------------------------------------------------------------------

const containerStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	height: "100%",
	color: "var(--place-text-primary, rgba(255,255,255,0.87))",
	fontSize: "0.85rem",
};

const headerStyle: React.CSSProperties = {
	padding: "0.5rem 0.75rem",
	borderBottom: "1px solid rgba(255,255,255,0.06)",
	display: "flex",
	flexDirection: "column",
	gap: "0.5rem",
};

const tabsStyle: React.CSSProperties = {
	display: "flex",
	gap: "0.25rem",
	flexWrap: "wrap",
};

function tabStyle(active: boolean): React.CSSProperties {
	return {
		padding: "0.25rem 0.625rem",
		borderRadius: "0.375rem",
		fontSize: "0.78rem",
		background: active ? "rgba(255,255,255,0.08)" : "transparent",
		color: active
			? "var(--place-text-primary, rgba(255,255,255,0.92))"
			: "var(--place-text-secondary, rgba(255,255,255,0.55))",
		border: "1px solid rgba(255,255,255,0.06)",
		cursor: "pointer",
	};
}

const bodyStyle: React.CSSProperties = {
	flex: 1,
	overflowY: "auto",
	padding: "0.625rem 0.75rem",
};

const cardStyle: React.CSSProperties = {
	padding: "0.5rem 0.625rem",
	borderRadius: "0.5rem",
	background: "rgba(255,255,255,0.03)",
	border: "1px solid rgba(255,255,255,0.06)",
	marginBottom: "0.5rem",
	display: "flex",
	flexDirection: "column",
	gap: "0.25rem",
};

const subtleStyle: React.CSSProperties = {
	color: "var(--place-text-secondary, rgba(255,255,255,0.55))",
	fontSize: "0.72rem",
};

const buttonStyle: React.CSSProperties = {
	padding: "0.25rem 0.5rem",
	borderRadius: "0.25rem",
	fontSize: "0.72rem",
	background: "rgba(255,255,255,0.06)",
	color: "var(--place-text-primary, rgba(255,255,255,0.87))",
	border: "1px solid rgba(255,255,255,0.06)",
	cursor: "pointer",
};

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

const DEFAULT_ORG = "org:01J00000000000000000000001";

export function BlueprintApp() {
	const [tab, setTab] = useState<BlueprintTab>("doc-tree");
	const connection = useIpcConnection();
	const sections = useProjection<SectionsProjection>("blueprint.sections");
	const planner = useProjection<PlannerProjection>("blueprint.planner");
	const graph = useProjection<IntentGraphProjection>("intent_graph");

	return (
		<div style={containerStyle}>
			<div style={headerStyle}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<strong style={{ fontSize: "0.95rem" }}>Blueprint</strong>
					<span style={subtleStyle}>{`daemon: ${connection}`}</span>
				</div>
				<div style={tabsStyle}>
					{TABS.map((t) => (
						<button
							key={t.id}
							type="button"
							onClick={() => setTab(t.id)}
							style={tabStyle(tab === t.id)}
						>
							{t.label}
						</button>
					))}
				</div>
			</div>
			<div style={bodyStyle}>
				{tab === "doc-tree" && <DocTree sections={sections} />}
				{tab === "gac" && <GacQueue cards={planner?.gac_cards ?? null} />}
				{tab === "blockers" && <BlockerList blockers={planner?.blockers ?? null} />}
				{tab === "aspirations" && <AspirationList aspirations={planner?.aspirations ?? null} />}
				{tab === "decisions" && <DecisionsLog decisions={planner?.decisions ?? null} />}
				{tab === "graph" && <IntentGraphView graph={graph} />}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Doc Tree
// ----------------------------------------------------------------------------

function DocTree({ sections }: { readonly sections: SectionsProjection | null }) {
	if (!sections) return <Empty hint="Connecting to daemon…" />;
	const docs = sections.documents ?? [];
	if (docs.length === 0) return <Empty hint="No blueprint documents yet." />;
	return (
		<>
			<div style={subtleStyle}>{`source: ${sections.source}  ·  ${docs.length} doc(s)`}</div>
			{docs.map((doc) => (
				<div key={doc.id} style={cardStyle}>
					<div style={{ display: "flex", justifyContent: "space-between" }}>
						<strong>{doc.title || "(untitled)"}</strong>
						<span style={subtleStyle}>{`${doc.sections?.length ?? 0} sec(s)`}</span>
					</div>
					{doc.sections?.map((sec) => (
						<div
							key={sec.id}
							style={{
								paddingLeft: sec.parent_section_id ? "1rem" : "0",
								fontSize: "0.78rem",
								color: "var(--place-text-secondary, rgba(255,255,255,0.7))",
							}}
						>
							{`${sec.position}. ${sec.title || "(untitled)"}`}
						</div>
					))}
				</div>
			))}
		</>
	);
}

// ----------------------------------------------------------------------------
// GAC Queue with variant picker
// ----------------------------------------------------------------------------

const GAC_OPTIONS: ReadonlyArray<{ key: string; label: string; result: string }> = [
	{ key: "A", label: "A — promote to canon", result: "create_canon" },
	{ key: "B", label: "B — open as intent", result: "create_intent" },
	{ key: "C", label: "C — update node", result: "update_node" },
	{ key: "D", label: "D — defer to blocker", result: "defer_to_blocker" },
];

function GacQueue({ cards }: { readonly cards: GacRow[] | null }) {
	const [busy, setBusy] = useState<string | null>(null);
	if (!cards) return <Empty hint="Connecting to daemon…" />;
	if (cards.length === 0) return <Empty hint="No open GAC cards." />;
	return (
		<>
			<div style={subtleStyle}>{`${cards.length} card(s)`}</div>
			{cards.map((card) => (
				<div key={card.id} style={cardStyle}>
					<div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
						<strong>{card.question ?? "(no question)"}</strong>
						<span style={subtleStyle}>{`${card.category ?? "?"} · ${card.priority ?? "?"} · ${card.status}`}</span>
					</div>
					{card.status !== "answered" && card.status !== "promoted" && (
						<div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
							{GAC_OPTIONS.map((opt) => (
								<button
									key={opt.key}
									type="button"
									disabled={busy === card.id}
									style={{ ...buttonStyle, opacity: busy === card.id ? 0.5 : 1 }}
									onClick={async () => {
										setBusy(card.id);
										await sendCommand("blueprint.gac.answer", {
											org_id: DEFAULT_ORG,
											actor_id: "actor:dev-console",
											gac_id: card.id,
											selected: opt.key,
											result_action: opt.result,
										});
										setBusy(null);
									}}
								>
									{opt.label}
								</button>
							))}
						</div>
					)}
					{card.status === "answered" && (
						<div style={subtleStyle}>{`answered: ${card.selected ?? "?"} → ${card.result_action ?? "?"}`}</div>
					)}
				</div>
			))}
		</>
	);
}

// ----------------------------------------------------------------------------
// Blockers
// ----------------------------------------------------------------------------

function BlockerList({ blockers }: { readonly blockers: BlockerRow[] | null }) {
	const [busy, setBusy] = useState<string | null>(null);
	if (!blockers) return <Empty hint="Connecting to daemon…" />;
	if (blockers.length === 0) return <Empty hint="Nothing blocked." />;
	return (
		<>
			<div style={subtleStyle}>{`${blockers.length} blocker(s)`}</div>
			{blockers.map((b) => (
				<div key={b.id} style={cardStyle}>
					<div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
						<strong>{b.title ?? "(no title)"}</strong>
						<span style={subtleStyle}>{`${b.category ?? "?"} · ${b.priority ?? "?"} · ${b.status}`}</span>
					</div>
					{b.description && <div style={{ fontSize: "0.78rem" }}>{b.description}</div>}
					{b.status === "open" && (
						<button
							type="button"
							disabled={busy === b.id}
							style={{ ...buttonStyle, alignSelf: "flex-start", opacity: busy === b.id ? 0.5 : 1 }}
							onClick={async () => {
								setBusy(b.id);
								await sendCommand("blueprint.blocker.resolve", {
									org_id: DEFAULT_ORG,
									actor_id: "actor:dev-console",
									blocker_id: b.id,
									reason: "resolved via Blueprint vApp",
								});
								setBusy(null);
							}}
						>
							Resolve
						</button>
					)}
				</div>
			))}
		</>
	);
}

// ----------------------------------------------------------------------------
// Aspirations
// ----------------------------------------------------------------------------

function AspirationList({ aspirations }: { readonly aspirations: AspirationRow[] | null }) {
	if (!aspirations) return <Empty hint="Connecting to daemon…" />;
	if (aspirations.length === 0) return <Empty hint="No captured aspirations." />;
	return (
		<>
			<div style={subtleStyle}>{`${aspirations.length} aspiration(s)`}</div>
			{aspirations.map((a) => (
				<div key={a.id} style={cardStyle}>
					<div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
						<strong>{a.title ?? "(no title)"}</strong>
						<span style={subtleStyle}>{`${a.timeframe ?? "?"} · ${a.source_type ?? "?"} · ${a.status}`}</span>
					</div>
				</div>
			))}
		</>
	);
}

// ----------------------------------------------------------------------------
// Decisions log (with supersedes chain)
// ----------------------------------------------------------------------------

function DecisionsLog({ decisions }: { readonly decisions: DecisionRow[] | null }) {
	if (!decisions) return <Empty hint="Connecting to daemon…" />;
	if (decisions.length === 0) return <Empty hint="No locked decisions." />;
	const byId = new Map<string, DecisionRow>();
	for (const d of decisions) byId.set(d.id, d);
	return (
		<>
			<div style={subtleStyle}>{`${decisions.length} decision(s)`}</div>
			{decisions.map((d) => {
				const supersedes = d.supersedes ? byId.get(d.supersedes) : null;
				return (
					<div key={d.id} style={cardStyle}>
						<div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
							<strong>{d.title ?? "(no title)"}</strong>
							<span style={subtleStyle}>{d.status}</span>
						</div>
						{d.body && <div style={{ fontSize: "0.78rem" }}>{d.body}</div>}
						{supersedes && (
							<div style={subtleStyle}>{`supersedes: ${supersedes.title ?? supersedes.id}`}</div>
						)}
						{d.superseded_by && (
							<div style={subtleStyle}>{`superseded by: ${d.superseded_by}`}</div>
						)}
					</div>
				);
			})}
		</>
	);
}

// ----------------------------------------------------------------------------
// Intent Graph — grouped list view (force-directed deferred)
// ----------------------------------------------------------------------------

function IntentGraphView({ graph }: { readonly graph: IntentGraphProjection | null }) {
	if (!graph) return <Empty hint="Connecting to daemon…" />;
	const byKind = new Map<string, GraphNode[]>();
	for (const n of graph.nodes ?? []) {
		const list = byKind.get(n.kind) ?? [];
		list.push(n);
		byKind.set(n.kind, list);
	}
	const byRelation = new Map<string, number>();
	for (const e of graph.edges ?? []) {
		byRelation.set(e.relation, (byRelation.get(e.relation) ?? 0) + 1);
	}
	return (
		<>
			<div style={subtleStyle}>
				{`${(graph.nodes ?? []).length} node(s)  ·  ${(graph.edges ?? []).length} edge(s)`}
			</div>
			<div style={cardStyle}>
				<strong>By kind</strong>
				{[...byKind.entries()]
					.sort()
					.map(([kind, nodes]) => (
						<div key={kind} style={{ display: "flex", gap: "0.5rem" }}>
							<span style={subtleStyle}>{kind.padEnd(12)}</span>
							<span>{nodes.length}</span>
						</div>
					))}
			</div>
			<div style={cardStyle}>
				<strong>By relation</strong>
				{[...byRelation.entries()]
					.sort()
					.map(([rel, count]) => (
						<div key={rel} style={{ display: "flex", gap: "0.5rem" }}>
							<span style={subtleStyle}>{rel.padEnd(14)}</span>
							<span>{count}</span>
						</div>
					))}
			</div>
		</>
	);
}

// ----------------------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------------------

function Empty({ hint }: { readonly hint: string }) {
	return (
		<div
			style={{
				...subtleStyle,
				padding: "1rem",
				textAlign: "center",
			}}
		>
			{hint}
		</div>
	);
}
