/**
 * Executions service — business logic for the executions subservice.
 *
 * Owns:
 *   - CRUD over the `executions` table (the schema defined in
 *     `./executions.schema.ts`, layered on top of the base table in
 *     `services/persistence/db.ts`).
 *   - Append-only phase transition log via `execution_phase_transitions`.
 *   - Per-step checkpoint journal stored as a JSON column on each row.
 *
 * Does NOT own:
 *   - Filesystem reflection of intent folders (Phase 2 — see AGENT-RUNTIME.md).
 *   - Real tmux/pty session recording (Phase 2 — deferred).
 *   - Routing or MCP registration (sibling modules).
 *
 * Follows the Blueprint service pattern: typed errors, an EventEmitter for
 * domain events, and no imports from other `services/core/*` subservices.
 * Real tmux/pty session recording is explicitly out of scope in this file.
 */
import { EventEmitter } from "node:events";
import type { ActorPhase, ExecutionStatus, Intent } from "@ema/shared/schemas";
import type { IntentPhase } from "../intents/state-machine.js";
import { type ExecutionPhaseTransitionRecord } from "./state-machine.js";
type DbRow = Record<string, unknown>;
export interface ExecutionStep {
    label: string;
    note?: string | undefined;
    at: string;
    extra?: Record<string, unknown> | undefined;
}
export interface ExecutionRecord {
    id: string;
    title: string;
    objective: string | null;
    mode: string;
    status: ExecutionStatus;
    project_slug: string | null;
    intent_slug: string | null;
    intent_path: string | null;
    result_summary: string | null;
    result_path: string | null;
    requires_approval: boolean;
    brain_dump_item_id: string | null;
    proposal_id: string | null;
    completed_at: string | null;
    inserted_at: string;
    updated_at: string;
    space_id: string | null;
    progress_log_path: string | null;
    step_journal: ExecutionStep[];
    reflexion_context: string | null;
    current_phase: ActorPhase | null;
    archived_at: string | null;
}
export interface CreateExecutionInput {
    title: string;
    objective?: string | null;
    mode?: string | null;
    status?: ExecutionStatus | string | null;
    requires_approval?: boolean | null;
    brain_dump_item_id?: string | null;
    project_slug?: string | null;
    intent_slug?: string | null;
    intent_path?: string | null;
    proposal_id?: string | null;
    space_id?: string | null;
}
export interface CreateExecutionFromIntentInput {
    title?: string | null;
    objective?: string | null;
    mode?: string | null;
    status?: ExecutionStatus | string | null;
    requires_approval?: boolean | null;
    project_slug?: string | null;
    space_id?: string | null;
}
export interface CreateExecutionFromProposalInput {
    proposal_id: string;
    intent_slug: string;
    title?: string | null;
    objective?: string | null;
    mode?: string | null;
    status?: ExecutionStatus | string | null;
    requires_approval?: boolean | null;
    project_slug?: string | null;
    space_id?: string | null;
}
export interface RecordExecutionResultInput {
    result_path: string;
    result_summary?: string | null;
    intent_status?: Intent["status"] | null;
    intent_phase?: IntentPhase | null;
    intent_event?: string | null;
}
export interface CompleteExecutionInput {
    result_summary?: string | null;
    result_path?: string | null;
    intent_status?: Intent["status"] | null;
    intent_phase?: IntentPhase | null;
    intent_event?: string | null;
}
export interface ListExecutionsFilter {
    status?: ExecutionStatus | undefined;
    mode?: string | undefined;
    intent_slug?: string | undefined;
    project_slug?: string | undefined;
    includeArchived?: boolean | undefined;
}
export type ExecutionEvent = {
    type: "execution:created";
    execution: ExecutionRecord;
} | {
    type: "execution:updated";
    execution: ExecutionRecord;
} | {
    type: "execution:completed";
    execution: ExecutionRecord;
} | {
    type: "execution:archived";
    execution: ExecutionRecord;
} | {
    type: "execution:phase_transitioned";
    execution: ExecutionRecord;
    transition: ExecutionPhaseTransitionRecord;
} | {
    type: "execution:step_appended";
    execution: ExecutionRecord;
    step: ExecutionStep;
};
export declare const executionsEvents: EventEmitter<[never]>;
export declare class ExecutionNotFoundError extends Error {
    readonly id: string;
    readonly code = "execution_not_found";
    constructor(id: string);
}
export declare function initExecutions(): void;
/** For hermetic tests that swap the database between runs. */
export declare function __resetExecutionsInit(): void;
/**
 * Row → `ExecutionRecord`. Exported so `reflexion.ts` can reuse it without a
 * circular dependency on the full service surface.
 */
export declare function mapExecutionRow(row: DbRow | undefined): ExecutionRecord | null;
export declare function listExecutions(filter?: ListExecutionsFilter): ExecutionRecord[];
export declare function getExecution(id: string): ExecutionRecord | null;
export declare function createExecution(input: CreateExecutionInput): ExecutionRecord;
export declare function createExecutionFromIntent(intentSlug: string, input?: CreateExecutionFromIntentInput): ExecutionRecord;
export declare function createExecutionFromProposal(input: CreateExecutionFromProposalInput): ExecutionRecord;
export declare function approveExecution(id: string): ExecutionRecord | null;
export declare function cancelExecution(id: string): ExecutionRecord | null;
export declare function completeExecution(id: string, input?: CompleteExecutionInput): ExecutionRecord | null;
export declare function updateExecutionStatus(id: string, status: ExecutionStatus, input?: {
    result_summary?: string | null;
    result_path?: string | null;
}): ExecutionRecord;
export declare function recordExecutionResult(id: string, input: RecordExecutionResultInput): ExecutionRecord;
export declare function archiveExecution(id: string): ExecutionRecord;
export interface TransitionPhaseInput {
    to: ActorPhase;
    reason: string;
    summary?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}
export declare function transitionPhase(id: string, input: TransitionPhaseInput): {
    execution: ExecutionRecord;
    transition: ExecutionPhaseTransitionRecord;
};
export declare function listPhaseTransitions(id: string): ExecutionPhaseTransitionRecord[];
export declare function appendStep(id: string, step: Omit<ExecutionStep, "at"> & {
    at?: string;
}): ExecutionRecord;
export declare function getStepJournal(id: string): ExecutionStep[];
export {};
//# sourceMappingURL=executions.service.d.ts.map