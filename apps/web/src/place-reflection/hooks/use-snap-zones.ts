/**
 * Snap-zone detection — pure functions + a tiny hook the donor
 * Window + SnapZones components consume.
 *
 * The zone layout (donor default):
 *   - top-{left,right}-quarter when cursor is in the top 30% of viewport
 *     near the left/right edge (≤20% from that edge)
 *   - bottom-{left,right}-quarter mirrors in the bottom 30%
 *   - left-half / right-half when cursor is near the side edges mid-row
 *   - top-half / bottom-half when cursor is near the top/bottom edges mid-col
 *   - no zone otherwise
 *
 * Workspace-plane only: snap does not write anything to the daemon.
 *
 * RIP: place.org src/hooks/use-snap-zones.ts (inferred shape — donor
 *      file missing from the snapshot; reconstructed from SnapZones.tsx
 *      and Window.tsx usage).
 */

import type { SnapZoneBounds, SnapZoneType } from "../types/snap-zones";

const EDGE_THRESHOLD = 0.2;
const QUARTER_VERTICAL = 0.3;
const TOPBAR_HEIGHT = 40;
const DOCK_HEIGHT = 56;

export interface SnapZoneDetectionInput {
  readonly x: number;
  readonly y: number;
  readonly viewportWidth?: number;
  readonly viewportHeight?: number;
}

export function detectSnapZone(input: SnapZoneDetectionInput): SnapZoneType | null {
  const vw = input.viewportWidth ?? (typeof window !== "undefined" ? window.innerWidth : 0);
  const vh = input.viewportHeight ?? (typeof window !== "undefined" ? window.innerHeight : 0);
  if (vw === 0 || vh === 0) return null;

  const nx = input.x / vw;
  const ny = input.y / vh;

  const nearLeft = nx <= EDGE_THRESHOLD;
  const nearRight = nx >= 1 - EDGE_THRESHOLD;
  const nearTop = ny <= EDGE_THRESHOLD;
  const nearBottom = ny >= 1 - EDGE_THRESHOLD;

  if (nearLeft && ny <= QUARTER_VERTICAL) return "top-left-quarter";
  if (nearRight && ny <= QUARTER_VERTICAL) return "top-right-quarter";
  if (nearLeft && ny >= 1 - QUARTER_VERTICAL) return "bottom-left-quarter";
  if (nearRight && ny >= 1 - QUARTER_VERTICAL) return "bottom-right-quarter";

  if (nearLeft) return "left-half";
  if (nearRight) return "right-half";
  if (nearTop) return "top-half";
  if (nearBottom) return "bottom-half";

  return null;
}

export function getWindowPositionForZone(
  zone: SnapZoneType,
  viewportWidth: number,
  viewportHeight: number,
): SnapZoneBounds {
  const usableTop = TOPBAR_HEIGHT;
  const usableBottom = viewportHeight - DOCK_HEIGHT;
  const usableHeight = usableBottom - usableTop;
  const halfW = Math.floor(viewportWidth / 2);
  const halfH = Math.floor(usableHeight / 2);

  switch (zone) {
    case "left-half":
      return { x: 0, y: usableTop, width: halfW, height: usableHeight };
    case "right-half":
      return { x: halfW, y: usableTop, width: viewportWidth - halfW, height: usableHeight };
    case "top-half":
      return { x: 0, y: usableTop, width: viewportWidth, height: halfH };
    case "bottom-half":
      return {
        x: 0,
        y: usableTop + halfH,
        width: viewportWidth,
        height: usableHeight - halfH,
      };
    case "top-left-quarter":
      return { x: 0, y: usableTop, width: halfW, height: halfH };
    case "top-right-quarter":
      return { x: halfW, y: usableTop, width: viewportWidth - halfW, height: halfH };
    case "bottom-left-quarter":
      return { x: 0, y: usableTop + halfH, width: halfW, height: usableHeight - halfH };
    case "bottom-right-quarter":
      return {
        x: halfW,
        y: usableTop + halfH,
        width: viewportWidth - halfW,
        height: usableHeight - halfH,
      };
  }
}

export interface SnapZoneHookResult {
  readonly zone: SnapZoneType | null;
  readonly bounds: SnapZoneBounds | null;
}

export function useSnapZones(input: SnapZoneDetectionInput): SnapZoneHookResult {
  const vw = input.viewportWidth ?? (typeof window !== "undefined" ? window.innerWidth : 0);
  const vh = input.viewportHeight ?? (typeof window !== "undefined" ? window.innerHeight : 0);
  const zone = detectSnapZone({ ...input, viewportWidth: vw, viewportHeight: vh });
  const bounds = zone ? getWindowPositionForZone(zone, vw, vh) : null;
  return { zone, bounds };
}
