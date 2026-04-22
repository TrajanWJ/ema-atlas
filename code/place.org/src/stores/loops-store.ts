import { create } from "zustand";
import { getDbClient } from "@/src/db/client";
import { getLoops } from "@/src/db/queries/loops";
import {
	openLoop as openLoopCmd,
	closeLoop as closeLoopCmd,
	reopenLoop as reopenLoopCmd,
	updateLoop as updateLoopCmd,
	deleteLoop as deleteLoopCmd,
} from "@/src/commands/loops";
import { runCommand } from "@/src/commands/types";
import type { Loop } from "@/src/types/loop";

interface LoopsState {
	readonly loops: readonly Loop[];
	readonly loading: boolean;
}

interface LoopsActions {
	load(): Promise<void>;
	open(title: string, waitingOn?: string | null, weight?: number, projectId?: string | null): Promise<void>;
	close(id: string): Promise<void>;
	reopen(id: string): Promise<void>;
	update(id: string, fields: Partial<Pick<Loop, "title" | "waitingOn" | "weight" | "projectId">>): Promise<void>;
	remove(id: string): Promise<void>;
}

type LoopsStore = LoopsState & LoopsActions;

export const useLoopsStore = create<LoopsStore>((set, get) => ({
	loops: [],
	loading: false,

	async load() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const loops = await getLoops(db);
			set({ loops, loading: false });
		} catch (err) {
			console.error("[loops-store] load failed:", err);
			set({ loading: false });
		}
	},

	async open(title, waitingOn, weight, projectId) {
		const db = getDbClient();
		const created = await runCommand(openLoopCmd, db, {
			title,
			waitingOn: waitingOn ?? null,
			weight: weight ?? 2,
			projectId: projectId ?? null,
		});
		if (created) {
			set({ loops: [created, ...get().loops] });
		}
	},

	async close(id) {
		const db = getDbClient();
		await runCommand(closeLoopCmd, db, { id });
		await get().load();
	},

	async reopen(id) {
		const db = getDbClient();
		await runCommand(reopenLoopCmd, db, { id });
		await get().load();
	},

	async update(id, fields) {
		const db = getDbClient();
		await runCommand(updateLoopCmd, db, { id, ...fields });
		await get().load();
	},

	async remove(id) {
		const db = getDbClient();
		await runCommand(deleteLoopCmd, db, { id });
		set({ loops: get().loops.filter((l) => l.id !== id) });
	},
}));
