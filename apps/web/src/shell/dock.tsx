/**
 * Shell dock — thin re-export over place-reflection.
 *
 * Wave 2 (2026-04-24): swapped from the old ema-dock tile strip to the
 * donor-styled Dock from place-reflection. The Dock reads its state (open
 * windows, pinned apps, settings, virtual desktops) from the zustand
 * bridges in place-reflection/shell-state — no props needed here.
 *
 * RIP: place.org src/components/desktop/Dock.tsx (see
 *      place-reflection/components/dock/Dock.tsx for the full provenance).
 */

export { Dock } from "../place-reflection";
