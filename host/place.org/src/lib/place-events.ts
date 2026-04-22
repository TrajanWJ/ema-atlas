/**
 * Typed place.org event catalog.
 *
 * Every command emits one of these on success. AI observers (later) and UI
 * observers (today) subscribe to the same stream. Adding a new command = add
 * a new event variant here first.
 *
 * This is a catalog layered on top of the existing `event-bus.ts` helper.
 * The legacy bus still accepts free-form {appId, eventType, payload} events;
 * this file just gives you compile-time safety for the ones commands emit.
 */

export type PlaceEvent =
	// Right Now
	| { readonly kind: "right_now.changed"; readonly previous: string | null; readonly next: string; readonly stateId: string }

	// Loops
	| { readonly kind: "loop.opened"; readonly loopId: string; readonly title: string; readonly weight: number }
	| { readonly kind: "loop.closed"; readonly loopId: string; readonly title: string; readonly weight: number }
	| { readonly kind: "loop.updated"; readonly loopId: string }

	// Feel Check
	| { readonly kind: "feel.checked"; readonly emoji: string; readonly note: string | null }

	// Stuck / Avoiding
	| { readonly kind: "stuck.logged"; readonly stuckId: string; readonly text: string }
	| { readonly kind: "stuck.resolved"; readonly stuckId: string }
	| { readonly kind: "avoiding.logged"; readonly id: string; readonly text: string }
	| { readonly kind: "avoiding.resolved"; readonly id: string }

	// One-Word
	| { readonly kind: "one_word.set"; readonly date: string; readonly word: string }

	// Decisions
	| { readonly kind: "decision.logged"; readonly id: string; readonly title: string }
	| { readonly kind: "decision.outcome"; readonly id: string; readonly outcome: string }

	// Learning Log
	| { readonly kind: "learning.logged"; readonly id: string; readonly topic: string | null }

	// Open Questions
	| { readonly kind: "question.opened"; readonly id: string; readonly text: string }
	| { readonly kind: "question.answered"; readonly id: string }

	// Contacts
	| { readonly kind: "contact.touched"; readonly id: string; readonly name: string }

	// Morning Intent / Evening Close
	| { readonly kind: "morning_intent.set"; readonly date: string; readonly text: string }
	| { readonly kind: "evening_close.set"; readonly date: string; readonly text: string }

	// Wellness
	| { readonly kind: "wellness.pinged"; readonly kind_: "water" | "movement" | "meal" }

	// Week Turn
	| { readonly kind: "week_turn.set"; readonly weekStart: string };

/**
 * Subscriber interface. AI observers will implement this; today only Flux
 * + the Ledger + suggesters subscribe.
 */
export type PlaceEventSubscriber = (event: PlaceEvent) => void;

const subscribers = new Set<PlaceEventSubscriber>();

export function subscribeToPlaceEvents(fn: PlaceEventSubscriber): () => void {
	subscribers.add(fn);
	return () => subscribers.delete(fn);
}

export function emitPlaceEvent(event: PlaceEvent): void {
	for (const fn of subscribers) {
		try {
			fn(event);
		} catch (e) {
			console.error("[place-events] subscriber failed:", e);
		}
	}
}
