import { create } from "zustand";
import { getDbClient } from "@/src/db/client";
import { eventBus } from "@/src/lib/event-bus";
import type { AppEvent } from "@/src/lib/event-bus";
import { todayLocal } from "@/src/lib/date-utils";
import { formatEvent } from "@/src/lib/flux-formatter";
import {
	addFluxEntry,
	getFluxEntriesForDate,
} from "@/src/db/queries/flux";
import type { FluxDbEntry } from "@/src/db/queries/flux";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface FluxEntry {
	readonly id: string;
	readonly type: "auto" | "manual";
	readonly timestamp: number;
	readonly appId?: string;
	readonly eventType?: string;
	readonly content: string;
	readonly metadata?: Record<string, unknown>;
}

interface FluxState {
	readonly currentDate: string;
	readonly entries: readonly FluxEntry[];
	readonly loading: boolean;
	readonly subscribed: boolean;
}

interface FluxActions {
	loadDate(date: string): Promise<void>;
	setCurrentDate(date: string): Promise<void>;
	subscribe(): () => void;
	addAutoEntry(event: AppEvent): void;
}

type FluxStore = FluxState & FluxActions;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function dbEntryToFlux(entry: FluxDbEntry): FluxEntry {
	return {
		id: entry.id,
		type: "auto",
		timestamp: entry.timestamp,
		appId: entry.appId,
		eventType: entry.eventType,
		content: entry.content,
		metadata: entry.metadata ? parseMetadata(entry.metadata) : undefined,
	};
}

function parseMetadata(raw: string): Record<string, unknown> | undefined {
	try {
		return JSON.parse(raw) as Record<string, unknown>;
	} catch {
		return undefined;
	}
}

function dateFromTimestamp(ts: number): string {
	const d = new Date(ts);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useFluxStore = create<FluxStore>((set, get) => ({
	currentDate: todayLocal(),
	entries: [],
	loading: false,
	subscribed: false,

	async loadDate(date) {
		set({ loading: true });
		try {
			const db = getDbClient();
			const dbEntries = await getFluxEntriesForDate(db, date);
			const fluxEntries = dbEntries.map(dbEntryToFlux);
			set({ entries: fluxEntries, currentDate: date });
		} finally {
			set({ loading: false });
		}
	},

	async setCurrentDate(date) {
		await get().loadDate(date);
	},

	subscribe() {
		if (get().subscribed) return () => {};

		set({ subscribed: true });

		const unsubscribe = eventBus.on("*", (event) => {
			get().addAutoEntry(event);
		});

		return () => {
			unsubscribe();
			set({ subscribed: false });
		};
	},

	addAutoEntry(event) {
		const formatted = formatEvent(event);
		if (formatted.skip) return;

		const entryDate = dateFromTimestamp(event.timestamp);
		const { currentDate } = get();

		// Persist to DB (fire and forget)
		const db = getDbClient();
		void addFluxEntry(db, {
			date: entryDate,
			appId: event.appId,
			eventType: event.eventType,
			content: formatted.content,
			metadata: JSON.stringify(event.payload),
			timestamp: event.timestamp,
		});

		// Only add to current view if it's today's date
		if (entryDate !== currentDate) return;

		const newEntry: FluxEntry = {
			id: event.id,
			type: "auto",
			timestamp: event.timestamp,
			appId: event.appId,
			eventType: event.eventType,
			content: formatted.content,
			metadata: event.payload,
		};

		set((state) => ({
			entries: [...state.entries, newEntry],
		}));
	},
}));
