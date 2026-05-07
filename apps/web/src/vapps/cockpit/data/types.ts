/**
 * Cockpit projection types — donor-shape-compatible mirrors of
 * `@cwt/surface-core` projection results.
 *
 * The donor projections are server-rendered against a SQLite store. In Slice 4
 * we only port the shapes and stub the data; Slice 5 wires the real
 * daemon WebSocket reads. The TODO markers below name where the wires go.
 */

export type ProjectKind = "client" | "personal" | "internal";
export type ProjectKindFilter = ProjectKind | "all";

export interface CockpitClient {
	readonly id: string;
	readonly name: string;
	readonly color: string | null;
}

export interface CockpitProject {
	readonly id: string;
	readonly name: string;
	readonly kind: ProjectKind;
	readonly client_id: string | null;
	readonly client_label: string | null;
	readonly client_color: string | null;
	readonly space_id: string;
}

export interface CockpitLane {
	readonly id: string;
	readonly project_id: string;
	readonly title: string;
	readonly why: string;
	readonly status: "open" | "claimed" | "review" | "complete" | "blocked";
}

export interface CockpitQueueItem {
	readonly id: string;
	readonly project_id: string;
	readonly title: string;
	readonly why: string;
	readonly priority: 1 | 2 | 3 | 4 | 5;
	readonly status: "open" | "in_progress" | "blocked" | "done";
	readonly promotion_state: "proposal" | "ready" | "promoted";
}

export interface CockpitHandoff {
	readonly id: string;
	readonly project_id: string;
	readonly from_owner: string;
	readonly to_owner: string;
	readonly next_move: string;
	readonly state: "pending" | "accepted" | "rejected" | "complete";
	readonly envelope_confidence: number;
	readonly envelope_completeness: number;
	readonly envelope_provenance: string;
}

export interface CockpitProblem {
	readonly id: string;
	readonly project_id: string;
	readonly title: string;
	readonly why: string;
}

export interface CockpitCampaign {
	readonly id: string;
	readonly project_id: string;
	readonly title: string;
	readonly why: string;
}

export interface CockpitVcalendarBlock {
	readonly id: string;
	readonly project_id: string;
	readonly phase: string;
	readonly start_at: string;
	readonly end_at: string;
	readonly target_id: string;
}

export interface CockpitSpace {
	readonly id: string;
	readonly name: string;
	readonly kind: string;
}

export interface NowProjection {
	readonly active_lane: CockpitLane | null;
	readonly ready_queue: readonly CockpitQueueItem[];
	readonly latest_handoffs: readonly CockpitHandoff[];
	readonly vcalendar_phase: string;
	readonly client_count: number;
	readonly client_project_count: number;
	readonly personal_count: number;
}

export interface ClientWorkItem {
	readonly client: CockpitClient;
	readonly projects: readonly CockpitProject[];
}

export interface ClientBench {
	readonly client: CockpitClient;
	readonly projects: readonly CockpitProject[];
	readonly lanes: readonly CockpitLane[];
	readonly queue: readonly CockpitQueueItem[];
}

export interface ProjectBench {
	readonly project: CockpitProject;
	readonly lanes: readonly CockpitLane[];
	readonly queue: readonly CockpitQueueItem[];
	readonly vcalendar_blocks: readonly CockpitVcalendarBlock[];
	readonly problems: readonly CockpitProblem[];
	readonly handoffs: readonly CockpitHandoff[];
	readonly campaigns: readonly CockpitCampaign[];
}
