/**
 * Bridge for donor's `createId`. Uses crypto.randomUUID when available,
 * falls back to time-sortable prefixes for local-only keys.
 *
 * Real ULID generation for canonical entity ids lives in the daemon;
 * this helper only creates ids for local-plane records (window ids,
 * virtual-desktop ids).
 */
export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
