import { useMemo } from 'react';
import type { SnapZoneType } from "@/src/types/snap-zones";

const SNAP_THRESHOLD = 20;
const TOP_BAR = 40;   // top bar height
const DOCK_AREA = 60; // dock height + margin
const PADDING = 8;    // gap from edges

export interface SnapZoneDetectionInput {
	readonly x: number;
	readonly y: number;
	readonly viewportWidth?: number;
	readonly viewportHeight?: number;
}

export interface SnapZoneInfo {
	readonly zone: SnapZoneType | null;
	readonly bounds: SnapZoneBounds | null;
}

export interface SnapZoneBounds {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

function detectSnapZoneInternal(
	input: SnapZoneDetectionInput,
): SnapZoneType | null {
	const vw = input.viewportWidth ?? window.innerWidth;
	const vh = input.viewportHeight ?? window.innerHeight;

	const nearLeft = input.x < SNAP_THRESHOLD;
	const nearRight = input.x > vw - SNAP_THRESHOLD;
	const nearTop = input.y < SNAP_THRESHOLD;
	const nearBottom = input.y > vh - SNAP_THRESHOLD;

	if (nearTop && nearLeft) return "top-left-quarter";
	if (nearTop && nearRight) return "top-right-quarter";
	if (nearBottom && nearLeft) return "bottom-left-quarter";
	if (nearBottom && nearRight) return "bottom-right-quarter";
	if (nearLeft) return "left-half";
	if (nearRight) return "right-half";
	if (nearTop) return "top-half";
	if (nearBottom) return "bottom-half";
	return null;
}

export function useSnapZones(
	input: SnapZoneDetectionInput,
): SnapZoneInfo {
	const zone = useMemo(() => detectSnapZoneInternal(input), [input]);
	const vw = input.viewportWidth ?? window.innerWidth;
	const vh = input.viewportHeight ?? window.innerHeight;
	const bounds = zone ? calculateZoneBounds(zone, vw, vh) : null;
	return { zone, bounds };
}

export function detectSnapZone(input: SnapZoneDetectionInput): SnapZoneType | null {
	return detectSnapZoneInternal(input);
}

/** Usable area = viewport minus top bar and dock, with padding */
function usableArea(vw: number, vh: number) {
	return {
		x: PADDING,
		y: TOP_BAR + PADDING,
		w: vw - PADDING * 2,
		h: vh - TOP_BAR - DOCK_AREA - PADDING,
	};
}

function calculateZoneBounds(
	zone: SnapZoneType,
	vw: number,
	vh: number,
): SnapZoneBounds {
	const area = usableArea(vw, vh);
	const halfW = Math.floor(area.w / 2) - PADDING / 2;
	const halfH = Math.floor(area.h / 2) - PADDING / 2;

	switch (zone) {
		case "left-half":
			return { x: area.x, y: area.y, width: halfW, height: area.h };
		case "right-half":
			return { x: area.x + halfW + PADDING, y: area.y, width: halfW, height: area.h };
		case "top-half":
			return { x: area.x, y: area.y, width: area.w, height: halfH };
		case "bottom-half":
			return { x: area.x, y: area.y + halfH + PADDING, width: area.w, height: halfH };
		case "top-left-quarter":
			return { x: area.x, y: area.y, width: halfW, height: halfH };
		case "top-right-quarter":
			return { x: area.x + halfW + PADDING, y: area.y, width: halfW, height: halfH };
		case "bottom-left-quarter":
			return { x: area.x, y: area.y + halfH + PADDING, width: halfW, height: halfH };
		case "bottom-right-quarter":
			return { x: area.x + halfW + PADDING, y: area.y + halfH + PADDING, width: halfW, height: halfH };
	}
}

export function getWindowPositionForZone(
	zone: SnapZoneType,
	viewportWidth: number,
	viewportHeight: number,
): { x: number; y: number; width: number; height: number } {
	return calculateZoneBounds(zone, viewportWidth, viewportHeight);
}
