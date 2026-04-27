/**
 * Shell window frame — thin re-export over place-reflection.
 *
 * Wave 3 (2026-04-24): swapped from the hand-rolled WindowFrame that
 * took individual geometry props to the donor-styled `Window` from
 * place-reflection. The Window reads state (position, zIndex, maximized,
 * active) from the place-reflection window-store-bridge — it only needs
 * a `win: ProcessWindow` object and its rendered body as children.
 *
 * RIP: place.org src/components/window-manager/Window.tsx (see
 *      place-reflection/components/window/Window.tsx for provenance).
 */

export { Window as WindowFrame } from "../place-reflection";
