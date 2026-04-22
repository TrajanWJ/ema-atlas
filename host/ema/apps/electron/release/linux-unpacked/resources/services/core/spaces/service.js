/**
 * Spaces service — business logic for the flat space namespace.
 *
 * Owns: CRUD + member management + state-machine enforcement against the
 * `spaces` and `space_transitions` tables. No routing, no MCP — those live in
 * sibling modules.
 *
 * GAC-007 decision: this service ships the FLAT variant per recommendation
 * [D] (defer with flat MVP). No `parent_space_id` column exists. When v2
 * nesting lands it will add a column via migration — call sites here stay
 * untouched. See `shared/schemas/spaces.ts` for the canon justification.
 *
 * Emits domain events via `spacesEvents`:
 *   - `space:created`
 *   - `space:archived`
 *   - `space:member_added`
 *   - `space:member_removed`
 *
 * Dependency-minimal: no imports from other `services/core/*` subservices.
 */
import { EventEmitter } from "node:events";
import { nanoid } from "nanoid";
import { spaceMemberSchema, spaceSchema, } from "@ema/shared/schemas";
import { getDb } from "../../persistence/db.js";
import { applySpacesDdl } from "./schema.js";
import { assertTransition, } from "./state-machine.js";
export const spacesEvents = new EventEmitter();
export class SpaceNotFoundError extends Error {
    ref;
    code = "space_not_found";
    constructor(ref) {
        super(`Space not found: ${ref}`);
        this.ref = ref;
        this.name = "SpaceNotFoundError";
    }
}
export class SpaceSlugTakenError extends Error {
    slug;
    code = "space_slug_taken";
    constructor(slug) {
        super(`Space slug already in use: ${slug}`);
        this.slug = slug;
        this.name = "SpaceSlugTakenError";
    }
}
export class SpaceMemberExistsError extends Error {
    spaceId;
    actorId;
    code = "space_member_exists";
    constructor(spaceId, actorId) {
        super(`Actor ${actorId} is already a member of ${spaceId}`);
        this.spaceId = spaceId;
        this.actorId = actorId;
        this.name = "SpaceMemberExistsError";
    }
}
export class SpaceMemberMissingError extends Error {
    spaceId;
    actorId;
    code = "space_member_missing";
    constructor(spaceId, actorId) {
        super(`Actor ${actorId} is not a member of ${spaceId}`);
        this.spaceId = spaceId;
        this.actorId = actorId;
        this.name = "SpaceMemberMissingError";
    }
}
export class InvalidSpaceMutationError extends Error {
    spaceId;
    code;
    constructor(spaceId, code, message) {
        super(message);
        this.spaceId = spaceId;
        this.code = code;
        this.name = "InvalidSpaceMutationError";
    }
}
let initialised = false;
export function initSpaces() {
    if (initialised)
        return;
    applySpacesDdl(getDb());
    initialised = true;
    seedDefaultSpace();
}
// -- (de)serialisation ----------------------------------------------------
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
    const members = decode(row.members, []).map((m) => spaceMemberSchema.parse(m));
    const candidate = {
        id: String(row.id),
        slug: String(row.slug),
        name: String(row.name),
        description: typeof row.description === "string" ? row.description : null,
        members,
        settings: decode(row.settings, {}),
        inserted_at: String(row.inserted_at),
        updated_at: String(row.updated_at),
    };
    const parsed = spaceSchema.safeParse(candidate);
    if (!parsed.success)
        return null;
    const status = String(row.status);
    return {
        ...parsed.data,
        status,
        archived_at: typeof row.archived_at === "string" ? row.archived_at : null,
    };
}
export function listSpaces(filter = {}) {
    initSpaces();
    const db = getDb();
    const clauses = [];
    const params = [];
    if (filter.status) {
        clauses.push("status = ?");
        params.push(filter.status);
    }
    else if (!filter.include_archived) {
        clauses.push("status != 'archived'");
    }
    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = db
        .prepare(`SELECT * FROM spaces ${whereSql} ORDER BY inserted_at ASC`)
        .all(...params);
    return rows
        .map((row) => mapRow(row))
        .filter((s) => s !== null);
}
/**
 * Lookup by id OR slug. Slug is the preferred public handle; id is the
 * stable primary key. Both resolve here so route handlers don't have to
 * branch on which identifier the caller supplied.
 */
export function getSpace(ref) {
    initSpaces();
    const db = getDb();
    const row = db
        .prepare("SELECT * FROM spaces WHERE id = ? OR slug = ? LIMIT 1")
        .get(ref, ref);
    return mapRow(row);
}
export function listTransitions(spaceId) {
    initSpaces();
    const db = getDb();
    const rows = db
        .prepare("SELECT * FROM space_transitions WHERE space_id = ? ORDER BY happened_at ASC")
        .all(spaceId);
    return rows.map((row) => ({
        id: String(row.id),
        space_id: String(row.space_id),
        from_status: String(row.from_status),
        to_status: String(row.to_status),
        actor: String(row.actor),
        reason: typeof row.reason === "string" ? row.reason : null,
        happened_at: String(row.happened_at),
    }));
}
// -- helpers --------------------------------------------------------------
function nowIso() {
    return new Date().toISOString();
}
function appendTransition(spaceId, from, to, actor, reason) {
    const db = getDb();
    db.prepare(`INSERT INTO space_transitions (id, space_id, from_status, to_status, actor, reason, happened_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`).run(nanoid(), spaceId, from, to, actor, reason, nowIso());
}
function requireSpace(ref) {
    const existing = getSpace(ref);
    if (!existing)
        throw new SpaceNotFoundError(ref);
    return existing;
}
function slugTaken(slug) {
    const db = getDb();
    const row = db
        .prepare("SELECT 1 FROM spaces WHERE slug = ? LIMIT 1")
        .get(slug);
    return row !== undefined;
}
// -- mutations ------------------------------------------------------------
export function createSpace(input) {
    initSpaces();
    const db = getDb();
    if (slugTaken(input.slug)) {
        throw new SpaceSlugTakenError(input.slug);
    }
    const id = input.id ?? `space_${nanoid(12)}`;
    const now = nowIso();
    const activate = input.activate ?? true;
    const status = activate ? "active" : "draft";
    const members = (input.members ?? []).map((m) => spaceMemberSchema.parse(m));
    const candidate = {
        id,
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        members,
        settings: input.settings ?? {},
        inserted_at: now,
        updated_at: now,
    };
    const parsed = spaceSchema.parse(candidate);
    db.prepare(`INSERT INTO spaces (
       id, slug, name, description, status, members, settings,
       archived_at, inserted_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`).run(parsed.id, parsed.slug, parsed.name, parsed.description, status, encode(parsed.members), encode(parsed.settings), parsed.inserted_at, parsed.updated_at);
    // First audit row: draft -> status. Even "created-as-active" spaces pass
    // through draft at t=0 so the transition log is complete.
    appendTransition(parsed.id, "draft", status, input.actor, "created");
    const record = requireSpace(parsed.id);
    const emitted = { type: "space:created", space: record };
    spacesEvents.emit("space:created", emitted);
    return record;
}
export function archiveSpace(ref, input) {
    initSpaces();
    const existing = requireSpace(ref);
    assertTransition(existing.status, "archived");
    const now = nowIso();
    const db = getDb();
    db.prepare(`UPDATE spaces
        SET status = 'archived',
            archived_at = ?,
            updated_at = ?
      WHERE id = ?`).run(now, now, existing.id);
    appendTransition(existing.id, existing.status, "archived", input.actor, input.reason ?? null);
    const record = requireSpace(existing.id);
    const emitted = { type: "space:archived", space: record };
    spacesEvents.emit("space:archived", emitted);
    return record;
}
export function addMember(ref, input) {
    initSpaces();
    const existing = requireSpace(ref);
    if (existing.status === "archived") {
        // Archived spaces are frozen. Voice register: directive, no apology.
        throw new InvalidSpaceMutationError(existing.id, "space_archived", "archived spaces reject membership changes");
    }
    const parsedMember = spaceMemberSchema.parse(input.member);
    if (existing.members.some((m) => m.actor_id === parsedMember.actor_id)) {
        throw new SpaceMemberExistsError(existing.id, parsedMember.actor_id);
    }
    const nextMembers = [...existing.members, parsedMember];
    const now = nowIso();
    const db = getDb();
    db.prepare("UPDATE spaces SET members = ?, updated_at = ? WHERE id = ?").run(encode(nextMembers), now, existing.id);
    const record = requireSpace(existing.id);
    const emitted = {
        type: "space:member_added",
        space: record,
        member: parsedMember,
    };
    spacesEvents.emit("space:member_added", emitted);
    return record;
}
export function removeMember(ref, input) {
    initSpaces();
    const existing = requireSpace(ref);
    if (existing.status === "archived") {
        throw new InvalidSpaceMutationError(existing.id, "space_archived", "archived spaces reject membership changes");
    }
    const exists = existing.members.some((m) => m.actor_id === input.actor_id);
    if (!exists) {
        throw new SpaceMemberMissingError(existing.id, input.actor_id);
    }
    const nextMembers = existing.members.filter((m) => m.actor_id !== input.actor_id);
    const now = nowIso();
    const db = getDb();
    db.prepare("UPDATE spaces SET members = ?, updated_at = ? WHERE id = ?").run(encode(nextMembers), now, existing.id);
    const record = requireSpace(existing.id);
    const emitted = {
        type: "space:member_removed",
        space: record,
        actor_id: input.actor_id,
    };
    spacesEvents.emit("space:member_removed", emitted);
    return record;
}
// -- bootstrap seed -------------------------------------------------------
/**
 * Idempotent. On first init, ensure the default `personal` space exists so a
 * cold-boot daemon always serves at least one space. Calling this repeatedly
 * is safe: existing rows are untouched.
 */
export function seedDefaultSpace() {
    const db = getDb();
    const existingRow = db
        .prepare("SELECT * FROM spaces WHERE slug = ?")
        .get("personal");
    if (existingRow) {
        const mapped = mapRow(existingRow);
        if (mapped)
            return mapped;
    }
    return createSpace({
        slug: "personal",
        name: "Personal",
        description: "Default personal space. Seeded on first boot.",
        actor: "system:bootstrap",
        activate: true,
    });
}
//# sourceMappingURL=service.js.map