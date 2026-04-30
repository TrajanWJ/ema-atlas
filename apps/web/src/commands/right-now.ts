import type { DbClient } from "@/src/db/client";
import { getCurrentState, insertState, clearCurrentState } from "@/src/db/queries/right-now";
import { emitPlaceEvent } from "@/src/lib/place-events";
import { ok, err } from "./types";
import type { Command } from "./types";
import type { RightNowState } from "@/src/types/right-now";

export interface SetRightNowParams {
	readonly text: string;
}

export const setRightNow: Command<SetRightNowParams, RightNowState> = async (db, params) => {
	const text = params.text.trim();
	if (!text) return err("right_now text is empty");

	const previous = await getCurrentState(db);
	const next = await insertState(db, text);

	emitPlaceEvent({
		kind: "right_now.changed",
		previous: previous?.text ?? null,
		next: text,
		stateId: next.id,
	});

	return ok(next);
};

export const clearRightNow: Command<Record<string, never>, null> = async (db) => {
	const previous = await getCurrentState(db);
	if (!previous) return ok(null);
	await clearCurrentState(db);
	emitPlaceEvent({
		kind: "right_now.changed",
		previous: previous.text,
		next: "",
		stateId: "",
	});
	return ok(null);
};
