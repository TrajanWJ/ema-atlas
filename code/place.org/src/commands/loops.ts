import type { DbClient } from "@/src/db/client";
import {
	insertLoop,
	closeLoopRow,
	reopenLoopRow,
	updateLoopRow,
	deleteLoopRow,
} from "@/src/db/queries/loops";
import { emitPlaceEvent } from "@/src/lib/place-events";
import { ok, err } from "./types";
import type { Command } from "./types";
import type { Loop } from "@/src/types/loop";

export interface OpenLoopParams {
	readonly title: string;
	readonly waitingOn?: string | null;
	readonly weight?: number;
	readonly projectId?: string | null;
}

export const openLoop: Command<OpenLoopParams, Loop> = async (db, params) => {
	const title = params.title.trim();
	if (!title) return err("loop title is empty");
	const weight = Math.max(1, Math.min(5, params.weight ?? 2));
	const loop = await insertLoop(
		db,
		title,
		params.waitingOn?.trim() || null,
		weight,
		params.projectId ?? null,
	);
	emitPlaceEvent({ kind: "loop.opened", loopId: loop.id, title, weight });
	return ok(loop);
};

export interface CloseLoopParams {
	readonly id: string;
}

export const closeLoop: Command<CloseLoopParams, null> = async (db, params) => {
	await closeLoopRow(db, params.id);
	emitPlaceEvent({ kind: "loop.closed", loopId: params.id, title: "", weight: 0 });
	return ok(null);
};

export const reopenLoop: Command<CloseLoopParams, null> = async (db, params) => {
	await reopenLoopRow(db, params.id);
	emitPlaceEvent({ kind: "loop.updated", loopId: params.id });
	return ok(null);
};

export interface UpdateLoopParams {
	readonly id: string;
	readonly title?: string;
	readonly waitingOn?: string | null;
	readonly weight?: number;
	readonly projectId?: string | null;
}

export const updateLoop: Command<UpdateLoopParams, null> = async (db, params) => {
	const { id, ...fields } = params;
	await updateLoopRow(db, id, fields);
	emitPlaceEvent({ kind: "loop.updated", loopId: id });
	return ok(null);
};

export const deleteLoop: Command<{ id: string }, null> = async (db, params) => {
	await deleteLoopRow(db, params.id);
	emitPlaceEvent({ kind: "loop.updated", loopId: params.id });
	return ok(null);
};
