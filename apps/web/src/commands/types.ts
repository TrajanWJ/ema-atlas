/**
 * Command layer types.
 *
 * Every write operation in place.org goes through a command. A command is a
 * pure, typed function of the shape:
 *
 *   async function doThing(db, params): Promise<CommandResult<T>>
 *
 * Commands are the single entry point for ALL writes — UI stores call them,
 * the future CLI will call them, and the future agent API will call them.
 * Commands emit typed events on the bus so observers (UI, AI later) can react.
 *
 * Rules:
 *   - Validate input at the command boundary (Zod or manual).
 *   - Never write to the DB from UI components or stores directly — always
 *     through commands.
 *   - Return CommandResult<T> — a standard shape.
 *   - Emit at least one event on success.
 */

import type { DbClient } from "@/src/db/client";

/** Standard command return shape. */
export type CommandResult<T> =
	| { readonly ok: true; readonly data: T }
	| { readonly ok: false; readonly error: string; readonly details?: unknown };

/** Convenience: a command is an async function that returns a CommandResult. */
export type Command<Params, Out> = (
	db: DbClient,
	params: Params,
) => Promise<CommandResult<Out>>;

export function ok<T>(data: T): CommandResult<T> {
	return { ok: true, data };
}

export function err(error: string, details?: unknown): CommandResult<never> {
	return { ok: false, error, details };
}

/**
 * Run a command and surface errors to a logger. UI call sites use this
 * wrapper so they don't have to remember the CommandResult pattern everywhere.
 * Returns the data or null on failure.
 */
export async function runCommand<Params, Out>(
	command: Command<Params, Out>,
	db: DbClient,
	params: Params,
): Promise<Out | null> {
	try {
		const result = await command(db, params);
		if (result.ok) return result.data;
		console.error(`[command] ${command.name} failed:`, result.error, result.details);
		return null;
	} catch (e) {
		console.error(`[command] ${command.name} threw:`, e);
		return null;
	}
}
