/**
 * Cockpit projection types — donor-shape-compatible mirrors of
 * `@cwt/surface-core` projection results.
 *
 * The donor projections were server-rendered against a SQLite store. EMA's
 * cockpit now treats these as local cockpit view-models backed by daemon/CLI
 * workspace projections where available, with staged data only as fallback.
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
	readonly project_record?: string | null;
	readonly active_build?: string | null;
	readonly repo_url?: string | null;
	readonly resolution_source?: string | null;
}

export interface CockpitLane {
	readonly id: string;
	readonly project_id: string;
	readonly title: string;
	readonly why: string;
	readonly status: string;
	readonly scope?: string | null;
	readonly claim_scope?: string | null;
	readonly goal?: string | null;
	readonly next?: string | null;
	readonly actor_id?: string | null;
	readonly updated_at?: string | null;
}

export interface CockpitQueueItem {
	readonly id: string;
	readonly project_id: string;
	readonly title: string;
	readonly why: string;
	readonly priority: 1 | 2 | 3 | 4 | 5;
	readonly status: string;
	readonly promotion_state: string;
	readonly lane_id?: string | null;
	readonly done_when?: string | null;
	readonly updated_at?: string | null;
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

export interface CockpitWorkspaceContext {
	readonly source: string;
	readonly daemon_authority: string;
	readonly generated_at: string;
	readonly org_id: string | null;
	readonly space_id: string | null;
	readonly project_id: string | null;
	readonly project_name: string | null;
	readonly project_record: string | null;
	readonly active_build: string | null;
	readonly resolution_source: string | null;
	readonly cwd: string | null;
	readonly home_current_project: string | null;
	readonly scope_warning: string | null;
	readonly vcalendar_phase: string | null;
	readonly next_command: string | null;
	readonly errors: readonly string[];
}

export interface CockpitActiveBuild {
	readonly id: string;
	readonly label: string;
	readonly role: string;
	readonly path: string;
	readonly repo_url: string | null;
	readonly branch: string | null;
	readonly head: string | null;
	readonly dirty_count: number | null;
	readonly git_status: "clean" | "dirty" | "no_git" | "missing" | "unknown" | "unborn";
	readonly dev_command: string | null;
}

export interface CockpitSurface {
	readonly id: string;
	readonly label: string;
	readonly role: string;
	readonly owner: string;
	readonly build_id: string;
	readonly path: string;
	readonly local_url: string | null;
	readonly status: "live" | "candidate" | "planned" | "staged" | string;
}

export interface CockpitHealth {
	readonly daemon: "up" | "down";
	readonly web: "up" | "down";
	readonly dirty_builds: number;
	readonly no_git_builds: number;
	readonly stale_records: readonly string[];
	readonly proslync_ready: boolean;
}

export interface CockpitIntentionCard {
	readonly id: string;
	readonly title: string;
	readonly raw_text?: string;
	readonly tags: readonly string[];
	readonly confidence: number;
	readonly review_state: string;
	readonly recommended_destination: string;
	readonly evidence_ref: string | null;
	readonly source_path: string | null;
	readonly source_type: string | null;
	readonly source_family: string | null;
	readonly project_hint: string | null;
	readonly occurred_at: string | null;
	readonly role: string | null;
}

export interface CockpitIntentionsProjection {
	readonly ok: boolean;
	readonly command?: string;
	readonly project?: string;
	readonly status?: string;
	readonly next?: string;
	readonly stats: {
		readonly sources_seen: number;
		readonly records_parsed: number;
		readonly candidate_intents: number;
		readonly proslync_relevant: number;
		readonly ema_relevant: number;
		readonly lost_followups: number;
		readonly duplicates_skipped: number;
	};
	readonly top_tags: readonly {
		readonly tag: string;
		readonly count: number;
	}[];
	readonly recommended_queue: readonly CockpitIntentionCard[];
}

export interface CockpitQueuePublishResult {
	readonly ok: boolean;
	readonly command?: readonly string[];
	readonly queue_id?: string;
	readonly target_project?: string;
	readonly source?: string;
	readonly error?: string;
	readonly status?: string;
	readonly result?: unknown;
}

export interface CockpitAgentPublishResult {
	readonly ok: boolean;
	readonly reply: string;
	readonly actions: readonly string[];
	readonly queue_id?: string;
	readonly error?: string;
	readonly command?: readonly string[];
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
	readonly workspace: CockpitWorkspaceContext | null;
	readonly intentions: CockpitIntentionsProjection | null;
	readonly active_builds: readonly CockpitActiveBuild[];
	readonly surfaces: readonly CockpitSurface[];
	readonly health: CockpitHealth | null;
}
