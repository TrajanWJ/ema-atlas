/**
 * Snap-zone types — shape donor SnapZones component and the
 * `use-snap-zones` hook consume. Windows can snap to halves or quarters.
 *
 * RIP: place.org src/types/snap-zones.ts
 */

export type SnapZoneType =
  | "left-half"
  | "right-half"
  | "top-half"
  | "bottom-half"
  | "top-left-quarter"
  | "top-right-quarter"
  | "bottom-left-quarter"
  | "bottom-right-quarter";

export interface SnapZoneBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
