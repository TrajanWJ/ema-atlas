/**
 * Suggestion registry.
 *
 * UI renders <SuggestionSlot for="<name>" /> in various places. At render
 * time, all suggesters registered for that slot are invoked. Each may return
 * a Suggestion or null.
 *
 * Today: rule-based suggesters only (no AI). Later: AI-backed suggesters get
 * registered here and render into the same slots with zero UI changes.
 */

import type { DbClient } from "@/src/db/client";

export interface Suggestion {
	readonly text: string;
	readonly action?: {
		readonly label: string;
		readonly handler: () => void | Promise<void>;
	};
	readonly tone?: "info" | "nudge" | "warning";
}

export type Suggester = (db: DbClient, slot: string) => Promise<Suggestion | null>;

const registry = new Map<string, Suggester[]>();

export function registerSuggester(slot: string, suggester: Suggester): void {
	const list = registry.get(slot) ?? [];
	list.push(suggester);
	registry.set(slot, list);
}

export async function runSuggesters(
	db: DbClient,
	slot: string,
): Promise<readonly Suggestion[]> {
	const list = registry.get(slot) ?? [];
	const results = await Promise.all(
		list.map((s) =>
			s(db, slot).catch((e) => {
				console.error(`[suggesters] ${slot} failed:`, e);
				return null;
			}),
		),
	);
	return results.filter((r): r is Suggestion => r !== null);
}

export function listSuggesterSlots(): readonly string[] {
	return Array.from(registry.keys());
}
