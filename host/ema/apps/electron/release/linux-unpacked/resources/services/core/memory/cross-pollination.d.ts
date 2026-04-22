/**
 * Cross-pollination service — records user-level facts transplanted between
 * projects with a rationale.
 *
 * Ported from the old Elixir `Ema.Memory.CrossPollination` module. This is
 * EMA's implementation of Honcho's cross-context learning: when a fact learned
 * in project A becomes relevant to project B, the applicability and the
 * rationale for it get preserved as a first-class memory entry.
 *
 * Owns: CRUD against `memory_cross_pollinations`. No routing, no MCP, no
 * filesystem — those live in sibling modules or get added later. Emits domain
 * events via `crossPollinationEvents` for other subsystems to observe.
 */
import { EventEmitter } from "node:events";
import { type CrossPollinationEntry } from "@ema/shared/schemas";
export interface RecordCrossPollinationInput {
    fact: string;
    source_project: string;
    target_project: string;
    rationale: string;
    actor_id?: string | undefined;
    confidence?: number | undefined;
    tags?: string[] | undefined;
}
export interface ListCrossPollinationFilter {
    source_project?: string | undefined;
    target_project?: string | undefined;
    limit?: number | undefined;
}
export type CrossPollinationEvent = {
    kind: "recorded";
    entry: CrossPollinationEntry;
} | {
    kind: "applied";
    entry: CrossPollinationEntry;
};
export declare const crossPollinationEvents: EventEmitter<[never]>;
export declare class CrossPollinationNotFoundError extends Error {
    readonly id: string;
    readonly code = "cross_pollination_not_found";
    constructor(id: string);
}
/** Apply DDL once per process. Safe to call repeatedly. */
export declare function initCrossPollination(): void;
/** Test-only hook: force re-init on the next call (e.g. after DROP TABLE). */
export declare function _resetCrossPollinationForTests(): void;
export declare class CrossPollinationService {
    private readonly emitter;
    constructor(emitter?: EventEmitter);
    /** Record a new cross-pollination entry. Returns the persisted row. */
    record(input: RecordCrossPollinationInput): Promise<CrossPollinationEntry>;
    /** Fetch a single entry by id. Returns null if it does not exist. */
    get(id: string): Promise<CrossPollinationEntry | null>;
    /** List entries, filterable by source/target project. Ordered newest first. */
    list(filter?: ListCrossPollinationFilter): Promise<CrossPollinationEntry[]>;
    /**
     * Find entries applicable to a target project — i.e. previously-recorded
     * transplants whose target matches. Used when hydrating project context so
     * the same fact surfaces next time the user opens project B.
     */
    findApplicableFor(targetProject: string, limit?: number): Promise<CrossPollinationEntry[]>;
    /**
     * Get the transplant history for a source project — every fact that was
     * learned here and exported elsewhere.
     */
    getHistory(sourceProject: string): Promise<CrossPollinationEntry[]>;
    /**
     * Subscribe to cross-pollination events. Returns an unsubscribe function.
     */
    subscribe(handler: (event: CrossPollinationEvent) => void): () => void;
}
/** Default singleton — mirrors blueprintEvents / service usage. */
export declare const crossPollinationService: CrossPollinationService;
//# sourceMappingURL=cross-pollination.d.ts.map