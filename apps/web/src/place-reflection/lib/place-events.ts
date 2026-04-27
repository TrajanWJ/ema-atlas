/**
 * Bridge for donor's `subscribeToPlaceEvents`. In Place, this is a
 * window-level pub/sub for UX events (window opened, notification
 * posted, etc). In EMA we route it to the IPC event stream when a
 * project channel is subscribed, and back-fill with a local in-memory
 * bus for local-only affordances (window open/close animations, toast
 * notifications) that don't hit the daemon.
 *
 * Wire protocol: subscribers receive a `PlaceEvent` envelope regardless
 * of whether it came from the daemon or a local emit.
 */

export type PlaceEvent = {
  readonly type: string;
  readonly at: number;
  readonly payload?: Record<string, unknown>;
  readonly source: "local" | "daemon";
};

type Listener = (event: PlaceEvent) => void;

const listeners = new Set<Listener>();

export function subscribeToPlaceEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitPlaceEvent(
  type: string,
  payload?: Record<string, unknown>,
  source: PlaceEvent["source"] = "local",
): void {
  const event: PlaceEvent = { type, at: Date.now(), payload, source };
  for (const listener of listeners) {
    listener(event);
  }
}
