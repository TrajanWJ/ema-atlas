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
import { nanoid } from "nanoid";
import { crossPollinationEntrySchema, } from "@ema/shared/schemas";
import { getDb } from "../../persistence/db.js";
import { applyCrossPollinationDdl } from "./cross-pollination.schema.js";
export const crossPollinationEvents = new EventEmitter();
export class CrossPollinationNotFoundError extends Error {
    id;
    code = "cross_pollination_not_found";
    constructor(id) {
        super(`cross_pollination_not_found: ${id}`);
        this.id = id;
        this.name = "CrossPollinationNotFoundError";
    }
}
let initialised = false;
/** Apply DDL once per process. Safe to call repeatedly. */
export function initCrossPollination() {
    if (initialised)
        return;
    applyCrossPollinationDdl(getDb());
    initialised = true;
}
/** Test-only hook: force re-init on the next call (e.g. after DROP TABLE). */
export function _resetCrossPollinationForTests() {
    initialised = false;
}
// -- (de)serialisation helpers --------------------------------------------
function encodeTags(tags) {
    return JSON.stringify(tags);
}
function decodeTags(raw) {
    if (typeof raw !== "string" || raw.length === 0)
        return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.filter((t) => typeof t === "string")
            : [];
    }
    catch {
        return [];
    }
}
function mapRow(row) {
    if (!row)
        return null;
    const candidate = {
        id: String(row.id),
        fact: String(row.fact),
        source_project: String(row.source_project),
        target_project: String(row.target_project),
        rationale: String(row.rationale),
        applied_at: String(row.applied_at),
        tags: decodeTags(row.tags),
    };
    if (typeof row.actor_id === "string" && row.actor_id.length > 0) {
        candidate.actor_id = row.actor_id;
    }
    if (typeof row.confidence === "number") {
        candidate.confidence = row.confidence;
    }
    const parsed = crossPollinationEntrySchema.safeParse(candidate);
    if (!parsed.success)
        return null;
    return parsed.data;
}
function nowIso() {
    return new Date().toISOString();
}
// -- service ---------------------------------------------------------------
export class CrossPollinationService {
    emitter;
    constructor(emitter = crossPollinationEvents) {
        initCrossPollination();
        this.emitter = emitter;
    }
    /** Record a new cross-pollination entry. Returns the persisted row. */
    async record(input) {
        initCrossPollination();
        const db = getDb();
        const candidate = {
            id: nanoid(),
            fact: input.fact,
            source_project: input.source_project,
            target_project: input.target_project,
            rationale: input.rationale,
            applied_at: nowIso(),
            tags: input.tags ?? [],
        };
        if (input.actor_id !== undefined)
            candidate.actor_id = input.actor_id;
        if (input.confidence !== undefined)
            candidate.confidence = input.confidence;
        const parsed = crossPollinationEntrySchema.parse(candidate);
        db.prepare(`INSERT INTO memory_cross_pollinations (
         id, fact, source_project, target_project, rationale, applied_at,
         actor_id, confidence, tags
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(parsed.id, parsed.fact, parsed.source_project, parsed.target_project, parsed.rationale, parsed.applied_at, parsed.actor_id ?? null, parsed.confidence ?? null, encodeTags(parsed.tags));
        const event = { kind: "recorded", entry: parsed };
        this.emitter.emit("cross-pollination", event);
        return parsed;
    }
    /** Fetch a single entry by id. Returns null if it does not exist. */
    async get(id) {
        initCrossPollination();
        const db = getDb();
        const row = db
            .prepare("SELECT * FROM memory_cross_pollinations WHERE id = ?")
            .get(id);
        return mapRow(row);
    }
    /** List entries, filterable by source/target project. Ordered newest first. */
    async list(filter = {}) {
        initCrossPollination();
        const db = getDb();
        const clauses = [];
        const params = [];
        if (filter.source_project) {
            clauses.push("source_project = ?");
            params.push(filter.source_project);
        }
        if (filter.target_project) {
            clauses.push("target_project = ?");
            params.push(filter.target_project);
        }
        const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
        const limit = typeof filter.limit === "number" && filter.limit > 0 ? filter.limit : 100;
        const rows = db
            .prepare(`SELECT * FROM memory_cross_pollinations ${whereSql} ORDER BY applied_at DESC LIMIT ?`)
            .all(...params, limit);
        return rows
            .map((row) => mapRow(row))
            .filter((e) => e !== null);
    }
    /**
     * Find entries applicable to a target project — i.e. previously-recorded
     * transplants whose target matches. Used when hydrating project context so
     * the same fact surfaces next time the user opens project B.
     */
    async findApplicableFor(targetProject, limit = 50) {
        return this.list({ target_project: targetProject, limit });
    }
    /**
     * Get the transplant history for a source project — every fact that was
     * learned here and exported elsewhere.
     */
    async getHistory(sourceProject) {
        return this.list({ source_project: sourceProject });
    }
    /**
     * Subscribe to cross-pollination events. Returns an unsubscribe function.
     */
    subscribe(handler) {
        const listener = (event) => handler(event);
        this.emitter.on("cross-pollination", listener);
        return () => {
            this.emitter.off("cross-pollination", listener);
        };
    }
}
/** Default singleton — mirrors blueprintEvents / service usage. */
export const crossPollinationService = new CrossPollinationService();
//# sourceMappingURL=cross-pollination.js.map