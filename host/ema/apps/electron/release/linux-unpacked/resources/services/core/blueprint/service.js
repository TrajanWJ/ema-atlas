/**
 * Blueprint service — business logic for the GAC queue.
 *
 * Owns: CRUD + state-machine enforcement against the `gac_cards` and
 * `gac_transitions` tables. No routing, no filesystem, no MCP — those live
 * in sibling modules and call into this one.
 *
 * Emits domain events via `blueprintEvents` for other subsystems to observe.
 * Follows the dependency-minimal pattern — no import of Composer, Pipes, or
 * Visibility.
 */
import { EventEmitter } from "node:events";
import { nanoid } from "nanoid";
import { gacCardSchema, } from "@ema/shared/schemas";
import { getDb } from "../../persistence/db.js";
import { applyBlueprintDdl } from "./schema.js";
import { assertTransition, } from "./state-machine.js";
export const blueprintEvents = new EventEmitter();
export class GacNotFoundError extends Error {
    id;
    code = "gac_not_found";
    constructor(id) {
        super(`GAC card not found: ${id}`);
        this.id = id;
        this.name = "GacNotFoundError";
    }
}
let initialised = false;
export function initBlueprint() {
    if (initialised)
        return;
    applyBlueprintDdl(getDb());
    initialised = true;
}
// -- (de)serialisation helpers --------------------------------------------
function encode(value) {
    return JSON.stringify(value);
}
function decode(raw, fallback) {
    if (typeof raw !== "string" || raw.length === 0)
        return fallback;
    try {
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function mapRow(row) {
    if (!row)
        return null;
    if (row.deleted_at)
        return null;
    const candidate = {
        id: String(row.id),
        type: "gac_card",
        layer: "intents",
        title: String(row.title),
        status: String(row.status),
        created: String(row.created_at),
        updated: String(row.updated_at),
        ...(typeof row.answered_at === "string"
            ? { answered_at: row.answered_at }
            : {}),
        ...(typeof row.answered_by === "string"
            ? { answered_by: row.answered_by }
            : {}),
        author: String(row.author),
        category: String(row.category),
        priority: String(row.priority),
        question: String(row.question),
        options: decode(row.options, []),
        ...(typeof row.answer === "string" && row.answer.length > 0
            ? { answer: decode(row.answer, undefined) }
            : {}),
        ...(typeof row.result_action === "string" && row.result_action.length > 0
            ? {
                result_action: decode(row.result_action, undefined),
            }
            : {}),
        connections: decode(row.connections, []),
        ...(typeof row.context === "string" && row.context.length > 0
            ? { context: decode(row.context, undefined) }
            : {}),
        tags: decode(row.tags, []),
    };
    const parsed = gacCardSchema.safeParse(candidate);
    if (!parsed.success)
        return null;
    return parsed.data;
}
export function listGacCards(filter = {}) {
    initBlueprint();
    const db = getDb();
    const clauses = ["deleted_at IS NULL"];
    const params = [];
    if (filter.status) {
        clauses.push("status = ?");
        params.push(filter.status);
    }
    if (filter.category) {
        clauses.push("category = ?");
        params.push(filter.category);
    }
    if (filter.priority) {
        clauses.push("priority = ?");
        params.push(filter.priority);
    }
    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = db
        .prepare(`SELECT * FROM gac_cards ${whereSql} ORDER BY created_at DESC`)
        .all(...params);
    return rows.map((row) => mapRow(row)).filter((c) => c !== null);
}
export function getGacCard(id) {
    initBlueprint();
    const db = getDb();
    const row = db.prepare("SELECT * FROM gac_cards WHERE id = ?").get(id);
    return mapRow(row);
}
export function listGacTransitions(cardId) {
    initBlueprint();
    const db = getDb();
    const rows = db
        .prepare("SELECT * FROM gac_transitions WHERE card_id = ? ORDER BY happened_at ASC")
        .all(cardId);
    return rows.map((row) => ({
        id: String(row.id),
        card_id: String(row.card_id),
        from_status: String(row.from_status),
        to_status: String(row.to_status),
        actor: String(row.actor),
        reason: typeof row.reason === "string" ? row.reason : null,
        happened_at: String(row.happened_at),
    }));
}
// -- id minting -----------------------------------------------------------
function nextGacId() {
    initBlueprint();
    const db = getDb();
    const row = db
        .prepare("SELECT id FROM gac_cards WHERE id GLOB 'GAC-[0-9]*' ORDER BY id DESC LIMIT 1")
        .get();
    const current = row && typeof row.id === "string" ? row.id : "GAC-000";
    const numericPart = current.replace(/^GAC-/u, "");
    const parsed = Number.parseInt(numericPart, 10);
    const next = Number.isFinite(parsed) ? parsed + 1 : 1;
    return `GAC-${String(next).padStart(3, "0")}`;
}
// -- mutations ------------------------------------------------------------
function nowIso() {
    return new Date().toISOString();
}
function appendTransition(cardId, from, to, actor, reason) {
    const db = getDb();
    db.prepare(`INSERT INTO gac_transitions (id, card_id, from_status, to_status, actor, reason, happened_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`).run(nanoid(), cardId, from, to, actor, reason, nowIso());
}
export function createGacCard(input) {
    initBlueprint();
    const db = getDb();
    const id = input.id ?? nextGacId();
    const now = nowIso();
    const candidate = {
        id,
        type: "gac_card",
        layer: "intents",
        title: input.title,
        status: "pending",
        created: now,
        updated: now,
        author: input.author,
        category: input.category,
        priority: input.priority,
        question: input.question,
        options: input.options,
        connections: input.connections ?? [],
        ...(input.context ? { context: input.context } : {}),
        tags: input.tags ?? [],
    };
    const parsed = gacCardSchema.parse(candidate);
    db.prepare(`INSERT INTO gac_cards (
       id, type, layer, title, status, category, priority, author, question,
       options, answer, result_action, connections, context, tags,
       source_path, deleted_at, created_at, updated_at, answered_at, answered_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL, NULL, ?, ?, NULL, NULL)`).run(parsed.id, parsed.type, parsed.layer, parsed.title, parsed.status, parsed.category, parsed.priority, parsed.author, parsed.question, encode(parsed.options), encode(parsed.connections), parsed.context ? encode(parsed.context) : null, encode(parsed.tags), parsed.created, parsed.updated);
    appendTransition(parsed.id, "pending", "pending", input.author, "created");
    const emitted = { type: "gac:created", card: parsed };
    blueprintEvents.emit("gac:created", emitted);
    return parsed;
}
function requireCard(id) {
    const existing = getGacCard(id);
    if (!existing)
        throw new GacNotFoundError(id);
    return existing;
}
export function answerGacCard(id, input) {
    initBlueprint();
    const existing = requireCard(id);
    assertTransition(existing.status, "answered");
    const now = nowIso();
    const answer = {
        selected: input.selected,
        ...(input.freeform !== undefined ? { freeform: input.freeform } : {}),
        answered_by: input.answered_by,
        answered_at: now,
    };
    const db = getDb();
    db.prepare(`UPDATE gac_cards
        SET status = 'answered',
            answer = ?,
            result_action = ?,
            answered_at = ?,
            answered_by = ?,
            updated_at = ?
      WHERE id = ?`).run(encode(answer), input.result_action ? encode(input.result_action) : null, now, input.answered_by, now, id);
    appendTransition(id, existing.status, "answered", input.answered_by, input.reason ?? null);
    const updated = requireCard(id);
    const emitted = { type: "gac:answered", card: updated };
    blueprintEvents.emit("gac:answered", emitted);
    return updated;
}
export function deferGacCard(id, input) {
    initBlueprint();
    const existing = requireCard(id);
    assertTransition(existing.status, "deferred");
    const now = nowIso();
    const resultAction = {
        type: "defer_to_blocker",
        ...(input.blocker_id ? { target: input.blocker_id } : {}),
    };
    const db = getDb();
    db.prepare(`UPDATE gac_cards
        SET status = 'deferred',
            result_action = ?,
            updated_at = ?
      WHERE id = ?`).run(encode(resultAction), now, id);
    appendTransition(id, existing.status, "deferred", input.actor, input.reason);
    const updated = requireCard(id);
    const emitted = { type: "gac:deferred", card: updated };
    blueprintEvents.emit("gac:deferred", emitted);
    return updated;
}
export function promoteGacCard(id, input) {
    initBlueprint();
    const existing = requireCard(id);
    assertTransition(existing.status, "promoted");
    const now = nowIso();
    const resultAction = {
        type: "defer_to_blocker",
        target: input.blocker_id,
    };
    const db = getDb();
    db.prepare(`UPDATE gac_cards
        SET status = 'promoted',
            result_action = ?,
            updated_at = ?
      WHERE id = ?`).run(encode(resultAction), now, id);
    appendTransition(id, existing.status, "promoted", input.actor, input.reason);
    const updated = requireCard(id);
    const emitted = { type: "gac:promoted", card: updated };
    blueprintEvents.emit("gac:promoted", emitted);
    return updated;
}
// -- filesystem-sync hooks ------------------------------------------------
/**
 * Upsert a card loaded from the filesystem layer. Bypasses the "create"
 * mint/validate path so already-existing ids (GAC-001 etc.) survive a
 * cold-boot reindex.
 */
export function upsertGacCardFromSource(card, sourcePath) {
    initBlueprint();
    const parsed = gacCardSchema.parse(card);
    const db = getDb();
    db.prepare(`INSERT INTO gac_cards (
       id, type, layer, title, status, category, priority, author, question,
       options, answer, result_action, connections, context, tags,
       source_path, deleted_at, created_at, updated_at, answered_at, answered_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       status = excluded.status,
       category = excluded.category,
       priority = excluded.priority,
       author = excluded.author,
       question = excluded.question,
       options = excluded.options,
       answer = excluded.answer,
       result_action = excluded.result_action,
       connections = excluded.connections,
       context = excluded.context,
       tags = excluded.tags,
       source_path = excluded.source_path,
       deleted_at = NULL,
       updated_at = excluded.updated_at,
       answered_at = excluded.answered_at,
       answered_by = excluded.answered_by`).run(parsed.id, parsed.type, parsed.layer, parsed.title, parsed.status, parsed.category, parsed.priority, parsed.author, parsed.question, encode(parsed.options), parsed.answer ? encode(parsed.answer) : null, parsed.result_action ? encode(parsed.result_action) : null, encode(parsed.connections), parsed.context ? encode(parsed.context) : null, encode(parsed.tags), sourcePath, parsed.created, parsed.updated, parsed.answered_at ?? null, parsed.answered_by ?? null);
    return parsed;
}
/** Soft-delete by source path — used when a card.md file is removed. */
export function softDeleteBySourcePath(sourcePath) {
    initBlueprint();
    const db = getDb();
    const now = nowIso();
    const result = db
        .prepare("UPDATE gac_cards SET deleted_at = ?, updated_at = ? WHERE source_path = ? AND deleted_at IS NULL")
        .run(now, now, sourcePath);
    return result.changes;
}
//# sourceMappingURL=service.js.map