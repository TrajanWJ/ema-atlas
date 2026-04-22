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
import { type GacCard, type GacCategory, type GacOption, type GacPriority, type GacResultAction, type GacStatus } from "@ema/shared/schemas";
import { type GacTransitionRecord } from "./state-machine.js";
export interface CreateGacCardInput {
    title: string;
    question: string;
    options: GacOption[];
    category: GacCategory;
    priority: GacPriority;
    author: string;
    id?: string | undefined;
    tags?: string[] | undefined;
    connections?: GacCard["connections"] | undefined;
    context?: GacCard["context"] | undefined;
}
export interface AnswerGacCardInput {
    selected: string | null;
    freeform?: string | undefined;
    answered_by: string;
    reason?: string | undefined;
    result_action?: GacResultAction | undefined;
}
export interface DeferGacCardInput {
    actor: string;
    reason: string;
    blocker_id?: string | undefined;
}
export interface PromoteGacCardInput {
    actor: string;
    reason: string;
    blocker_id: string;
}
export type BlueprintEvent = {
    type: "gac:created";
    card: GacCard;
} | {
    type: "gac:answered";
    card: GacCard;
} | {
    type: "gac:deferred";
    card: GacCard;
} | {
    type: "gac:promoted";
    card: GacCard;
};
export declare const blueprintEvents: EventEmitter<[never]>;
export declare class GacNotFoundError extends Error {
    readonly id: string;
    readonly code = "gac_not_found";
    constructor(id: string);
}
export declare function initBlueprint(): void;
export interface ListGacCardsFilter {
    status?: GacStatus | undefined;
    category?: GacCategory | undefined;
    priority?: GacPriority | undefined;
}
export declare function listGacCards(filter?: ListGacCardsFilter): GacCard[];
export declare function getGacCard(id: string): GacCard | null;
export declare function listGacTransitions(cardId: string): GacTransitionRecord[];
export declare function createGacCard(input: CreateGacCardInput): GacCard;
export declare function answerGacCard(id: string, input: AnswerGacCardInput): GacCard;
export declare function deferGacCard(id: string, input: DeferGacCardInput): GacCard;
export declare function promoteGacCard(id: string, input: PromoteGacCardInput): GacCard;
/**
 * Upsert a card loaded from the filesystem layer. Bypasses the "create"
 * mint/validate path so already-existing ids (GAC-001 etc.) survive a
 * cold-boot reindex.
 */
export declare function upsertGacCardFromSource(card: GacCard, sourcePath: string): GacCard;
/** Soft-delete by source path — used when a card.md file is removed. */
export declare function softDeleteBySourcePath(sourcePath: string): number;
//# sourceMappingURL=service.d.ts.map