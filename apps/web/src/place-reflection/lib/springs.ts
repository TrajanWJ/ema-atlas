/**
 * Bridge for donor's animation springs. Re-exports or re-declares the
 * donor's spring tokens; EMA's design-system package doesn't yet have an
 * equivalent, so we mirror donor values verbatim.
 *
 * RIP: place.org
 */

import type { Transition } from "motion";

export const SPRINGS = {
  soft: { type: "spring" as const, stiffness: 180, damping: 20 },
  medium: { type: "spring" as const, stiffness: 300, damping: 26 },
  snappy: { type: "spring" as const, stiffness: 500, damping: 32 },
  bouncy: { type: "spring" as const, stiffness: 260, damping: 14 },
  default: { type: "spring" as const, stiffness: 300, damping: 26 },
} as const;

export type SpringName = keyof typeof SPRINGS;

/**
 * getTransition(spring, reducedMotion?) — returns a motion transition
 * object. `spring` may be a named spring (string key) or a raw Transition
 * object (matching donor's call sites, which pass `SPRINGS.bouncy` directly).
 * If `reducedMotion` is true, collapse to a near-instant easeOut.
 */
export function getTransition(
  spring: SpringName | Transition,
  reducedMotion = false,
): Transition {
  if (reducedMotion) {
    return { duration: 0.05, ease: "easeOut" };
  }
  if (typeof spring === "string") {
    return SPRINGS[spring];
  }
  return spring;
}
