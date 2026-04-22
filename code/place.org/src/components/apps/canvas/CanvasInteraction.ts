import type {
	CanvasElement,
	CanvasElementType,
	CanvasPoint,
	CanvasTool,
	Viewport,
} from "@/src/stores/canvas-store";
import { getHandlePositions } from "./CanvasRenderer";

// ----------------------------------------------------------------------------
// Drag state (ephemeral, not in Zustand)
// ----------------------------------------------------------------------------

export interface DragState {
	readonly mode:
		| "none"
		| "pan"
		| "create"
		| "move"
		| "resize"
		| "select-rect"
		| "freehand";
	readonly startScreenX: number;
	readonly startScreenY: number;
	readonly startWorldX: number;
	readonly startWorldY: number;
	readonly resizeEdge: string;
	readonly startViewport: { x: number; y: number };
	readonly startBounds: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	readonly creatingElement: CanvasElement | null;
}

export const INITIAL_DRAG: DragState = {
	mode: "none",
	startScreenX: 0,
	startScreenY: 0,
	startWorldX: 0,
	startWorldY: 0,
	resizeEdge: "",
	startViewport: { x: 0, y: 0 },
	startBounds: { x: 0, y: 0, width: 0, height: 0 },
	creatingElement: null,
};

// ----------------------------------------------------------------------------
// Coordinate transforms
// ----------------------------------------------------------------------------

export function screenToWorld(
	screenX: number,
	screenY: number,
	vp: Viewport,
): CanvasPoint {
	return {
		x: screenX / vp.zoom - vp.x,
		y: screenY / vp.zoom - vp.y,
	};
}

// ----------------------------------------------------------------------------
// Hit testing
// ----------------------------------------------------------------------------

const HANDLE_HIT_RADIUS = 6;

export function hitTestHandle(
	worldX: number,
	worldY: number,
	el: CanvasElement,
): string | null {
	const handles = getHandlePositions(el);
	for (const h of handles) {
		const dx = worldX - h.x;
		const dy = worldY - h.y;
		if (dx * dx + dy * dy < HANDLE_HIT_RADIUS * HANDLE_HIT_RADIUS) {
			return h.edge;
		}
	}
	return null;
}

export function hitTestElement(
	worldX: number,
	worldY: number,
	el: CanvasElement,
): boolean {
	if (el.type === "freehand" && el.points && el.points.length >= 2) {
		return hitTestFreehand(worldX, worldY, el.points, el.strokeWidth);
	}
	if (
		(el.type === "line" || el.type === "arrow") &&
		el.points &&
		el.points.length >= 2
	) {
		return hitTestPolyline(worldX, worldY, el.points, el.strokeWidth);
	}
	return (
		worldX >= el.x &&
		worldX <= el.x + el.width &&
		worldY >= el.y &&
		worldY <= el.y + el.height
	);
}

function hitTestFreehand(
	wx: number,
	wy: number,
	pts: readonly CanvasPoint[],
	strokeWidth: number,
): boolean {
	const threshold = Math.max(strokeWidth, 6);
	for (let i = 0; i < pts.length - 1; i++) {
		const a = pts[i];
		const b = pts[i + 1];
		if (a && b && distToSegment(wx, wy, a, b) < threshold) return true;
	}
	return false;
}

function hitTestPolyline(
	wx: number,
	wy: number,
	pts: readonly CanvasPoint[],
	strokeWidth: number,
): boolean {
	const threshold = Math.max(strokeWidth, 6);
	for (let i = 0; i < pts.length - 1; i++) {
		const a = pts[i];
		const b = pts[i + 1];
		if (a && b && distToSegment(wx, wy, a, b) < threshold) return true;
	}
	return false;
}

function distToSegment(
	px: number,
	py: number,
	a: CanvasPoint,
	b: CanvasPoint,
): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const lenSq = dx * dx + dy * dy;
	if (lenSq === 0) return Math.hypot(px - a.x, py - a.y);
	let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
	t = Math.max(0, Math.min(1, t));
	return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

// ----------------------------------------------------------------------------
// Find element at point (top-most first)
// ----------------------------------------------------------------------------

export function findElementAtPoint(
	worldX: number,
	worldY: number,
	elements: readonly CanvasElement[],
): CanvasElement | null {
	const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);
	for (const el of sorted) {
		if (el.locked) continue;
		if (hitTestElement(worldX, worldY, el)) return el;
	}
	return null;
}

// ----------------------------------------------------------------------------
// Selection rect
// ----------------------------------------------------------------------------

export function elementsInRect(
	elements: readonly CanvasElement[],
	rx: number,
	ry: number,
	rw: number,
	rh: number,
): readonly string[] {
	const left = Math.min(rx, rx + rw);
	const right = Math.max(rx, rx + rw);
	const top = Math.min(ry, ry + rh);
	const bottom = Math.max(ry, ry + rh);

	return elements
		.filter(
			(el) =>
				!el.locked &&
				el.x < right &&
				el.x + el.width > left &&
				el.y < bottom &&
				el.y + el.height > top,
		)
		.map((el) => el.id);
}

// ----------------------------------------------------------------------------
// Snapping
// ----------------------------------------------------------------------------

export function snapValue(val: number, gridSize: number): number {
	return Math.round(val / gridSize) * gridSize;
}

// ----------------------------------------------------------------------------
// New element factory
// ----------------------------------------------------------------------------

let idCounter = 0;

function genId(): string {
	idCounter++;
	return `${Date.now()}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createElement(
	type: CanvasElementType,
	x: number,
	y: number,
	defaults: {
		fill: string;
		stroke: string;
		strokeWidth: number;
		fontSize: number;
	},
	zIndex: number,
): CanvasElement {
	const now = Date.now();
	const base: CanvasElement = {
		id: genId(),
		type,
		x,
		y,
		width: 0,
		height: 0,
		rotation: 0,
		fill: defaults.fill,
		stroke: defaults.stroke,
		strokeWidth: defaults.strokeWidth,
		opacity: 1,
		zIndex,
		createdAt: now,
		updatedAt: now,
	};

	switch (type) {
		case "text":
			return {
				...base,
				fill: "transparent",
				text: "",
				fontSize: defaults.fontSize,
				fontFamily: "Inter, system-ui, sans-serif",
				width: 200,
				height: 30,
			};
		case "sticky":
			return {
				...base,
				fill: "#FBBF24",
				text: "",
				fontSize: 14,
				width: 200,
				height: 200,
			};
		case "freehand":
			return {
				...base,
				fill: "transparent",
				points: [{ x, y }],
			};
		case "line":
			return {
				...base,
				fill: "transparent",
				points: [{ x, y }],
			};
		case "arrow":
			return {
				...base,
				fill: "transparent",
				arrowHead: "arrow",
				points: [{ x, y }],
			};
		case "ellipse":
			return base;
		default:
			return base;
	}
}

// ----------------------------------------------------------------------------
// Tool → element type mapping
// ----------------------------------------------------------------------------

export function toolToElementType(tool: CanvasTool): CanvasElementType | null {
	switch (tool) {
		case "rectangle":
			return "rectangle";
		case "ellipse":
			return "ellipse";
		case "line":
			return "line";
		case "arrow":
			return "arrow";
		case "text":
			return "text";
		case "freehand":
			return "freehand";
		case "sticky":
			return "sticky";
		default:
			return null;
	}
}

// ----------------------------------------------------------------------------
// Resize logic
// ----------------------------------------------------------------------------

export function computeResize(
	edge: string,
	startEl: { x: number; y: number; width: number; height: number },
	dx: number,
	dy: number,
): { x: number; y: number; width: number; height: number } {
	let { x, y, width: w, height: h } = startEl;

	switch (edge) {
		case "tl":
			x += dx;
			y += dy;
			w -= dx;
			h -= dy;
			break;
		case "tc":
			y += dy;
			h -= dy;
			break;
		case "tr":
			y += dy;
			w += dx;
			h -= dy;
			break;
		case "mr":
			w += dx;
			break;
		case "br":
			w += dx;
			h += dy;
			break;
		case "bc":
			h += dy;
			break;
		case "bl":
			x += dx;
			w -= dx;
			h += dy;
			break;
		case "ml":
			x += dx;
			w -= dx;
			break;
	}

	// Enforce minimum size
	if (w < 5) {
		w = 5;
	}
	if (h < 5) {
		h = 5;
	}

	return { x, y, width: w, height: h };
}
