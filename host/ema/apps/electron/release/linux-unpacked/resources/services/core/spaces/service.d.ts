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
import { type Space, type SpaceMember } from "@ema/shared/schemas";
import { type SpaceStatus, type SpaceTransitionRecord } from "./state-machine.js";
/**
 * Runtime shape of a Space row. The canonical `Space` type from
 * `shared/schemas/spaces.ts` does not carry a `status` field (the schema is
 * a storage contract; lifecycle is a service concern). We surface `status`
 * separately so callers can filter on it without parsing the schema.
 */
export interface SpaceRecord extends Space {
    status: SpaceStatus;
    archived_at: string | null;
}
export interface CreateSpaceInput {
    name: string;
    slug: string;
    description?: string | null;
    members?: SpaceMember[];
    settings?: Record<string, unknown>;
    actor: string;
    activate?: boolean;
    id?: string;
}
export interface ArchiveSpaceInput {
    actor: string;
    reason?: string | undefined;
}
export interface AddMemberInput {
    actor: string;
    member: SpaceMember;
}
export interface RemoveMemberInput {
    actor: string;
    actor_id: string;
}
export type SpacesEvent = {
    type: "space:created";
    space: SpaceRecord;
} | {
    type: "space:archived";
    space: SpaceRecord;
} | {
    type: "space:member_added";
    space: SpaceRecord;
    member: SpaceMember;
} | {
    type: "space:member_removed";
    space: SpaceRecord;
    actor_id: string;
};
export declare const spacesEvents: EventEmitter<[never]>;
export declare class SpaceNotFoundError extends Error {
    readonly ref: string;
    readonly code = "space_not_found";
    constructor(ref: string);
}
export declare class SpaceSlugTakenError extends Error {
    readonly slug: string;
    readonly code = "space_slug_taken";
    constructor(slug: string);
}
export declare class SpaceMemberExistsError extends Error {
    readonly spaceId: string;
    readonly actorId: string;
    readonly code = "space_member_exists";
    constructor(spaceId: string, actorId: string);
}
export declare class SpaceMemberMissingError extends Error {
    readonly spaceId: string;
    readonly actorId: string;
    readonly code = "space_member_missing";
    constructor(spaceId: string, actorId: string);
}
export declare class InvalidSpaceMutationError extends Error {
    readonly spaceId: string;
    readonly code: string;
    constructor(spaceId: string, code: string, message: string);
}
export declare function initSpaces(): void;
export interface ListSpacesFilter {
    status?: SpaceStatus | undefined;
    include_archived?: boolean | undefined;
}
export declare function listSpaces(filter?: ListSpacesFilter): SpaceRecord[];
/**
 * Lookup by id OR slug. Slug is the preferred public handle; id is the
 * stable primary key. Both resolve here so route handlers don't have to
 * branch on which identifier the caller supplied.
 */
export declare function getSpace(ref: string): SpaceRecord | null;
export declare function listTransitions(spaceId: string): SpaceTransitionRecord[];
export declare function createSpace(input: CreateSpaceInput): SpaceRecord;
export declare function archiveSpace(ref: string, input: ArchiveSpaceInput): SpaceRecord;
export declare function addMember(ref: string, input: AddMemberInput): SpaceRecord;
export declare function removeMember(ref: string, input: RemoveMemberInput): SpaceRecord;
/**
 * Idempotent. On first init, ensure the default `personal` space exists so a
 * cold-boot daemon always serves at least one space. Calling this repeatedly
 * is safe: existing rows are untouched.
 */
export declare function seedDefaultSpace(): SpaceRecord;
//# sourceMappingURL=service.d.ts.map