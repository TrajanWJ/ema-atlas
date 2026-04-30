import { create } from "zustand";
import {
	addResponsibility,
	getResponsibilities,
	updateResponsibility,
	deleteResponsibility,
	touchResponsibility,
} from "@/src/db/queries/responsibilities";
import { getDbClient } from "@/src/db/client";
import type { Responsibility, ResponsibilityCadence } from "@/src/types/responsibility";

interface ResponsibilitiesState {
	readonly responsibilities: readonly Responsibility[];
	readonly loading: boolean;
}

interface ResponsibilitiesActions {
	load(): Promise<void>;
	create(
		title: string,
		role?: string | null,
		cadence?: ResponsibilityCadence | null,
	): Promise<Responsibility>;
	update(
		id: string,
		changes: Partial<Pick<Responsibility, "title" | "description" | "role" | "cadence" | "active" | "sortOrder">>,
	): Promise<void>;
	remove(id: string): Promise<void>;
	touch(id: string): Promise<void>;
}

type ResponsibilitiesStore = ResponsibilitiesState & ResponsibilitiesActions;

export const useResponsibilitiesStore = create<ResponsibilitiesStore>((set, get) => ({
	responsibilities: [],
	loading: false,

	async load() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const responsibilities = await getResponsibilities(db);
			set({ responsibilities, loading: false });
		} catch (err) {
			console.error("[responsibilities-store] load failed:", err);
			set({ loading: false });
		}
	},

	async create(title, role, cadence) {
		const db = getDbClient();
		const r = await addResponsibility(db, title, role ?? null, cadence ?? null);
		set({ responsibilities: [r, ...get().responsibilities] });
		return r;
	},

	async update(id, changes) {
		const db = getDbClient();
		await updateResponsibility(db, id, changes);
		set({
			responsibilities: get().responsibilities.map((r) =>
				r.id === id
					? ({
							...r,
							...changes,
							updatedAt: new Date().toISOString(),
					  } as Responsibility)
					: r,
			),
		});
	},

	async remove(id) {
		const db = getDbClient();
		await deleteResponsibility(db, id);
		set({
			responsibilities: get().responsibilities.filter((r) => r.id !== id),
		});
	},

	async touch(id) {
		const db = getDbClient();
		await touchResponsibility(db, id);
		const now = new Date().toISOString();
		set({
			responsibilities: get().responsibilities.map((r) =>
				r.id === id ? ({ ...r, lastTouchedAt: now, updatedAt: now } as Responsibility) : r,
			),
		});
	},
}));

/** Returns true if responsibility is overdue by > 2× its cadence (drift). */
export function isDrifting(r: Responsibility): boolean {
	if (!r.cadence || !r.lastTouchedAt) return false;
	const now = Date.now();
	const last = new Date(r.lastTouchedAt).getTime();
	const elapsedDays = (now - last) / (1000 * 60 * 60 * 24);
	const cadenceDays: Record<ResponsibilityCadence, number> = {
		daily: 1,
		weekly: 7,
		biweekly: 14,
		monthly: 30,
		quarterly: 90,
		ongoing: Number.POSITIVE_INFINITY,
	};
	const threshold = cadenceDays[r.cadence] * 2;
	return elapsedDays > threshold;
}
