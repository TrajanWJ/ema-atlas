import type {
	CanvasElement,
	CanvasPoint,
	Viewport,
} from "@/src/stores/canvas-store";

// ----------------------------------------------------------------------------
// Grid
// ----------------------------------------------------------------------------

export function drawGrid(
	ctx: CanvasRenderingContext2D,
	vp: Viewport,
	canvasW: number,
	canvasH: number,
	gridSize: number,
): void {
	const dotRadius = 1;
	const step = gridSize * vp.zoom;
	if (step < 4) return; // too dense

	const offsetX = (vp.x * vp.zoom) % step;
	const offsetY = (vp.y * vp.zoom) % step;

	ctx.fillStyle = "rgba(255,255,255,0.12)";
	for (let x = offsetX; x < canvasW; x += step) {
		for (let y = offsetY; y < canvasH; y += step) {
			ctx.beginPath();
			ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

// ----------------------------------------------------------------------------
// Viewport transform helpers
// ----------------------------------------------------------------------------

export function applyViewport(
	ctx: CanvasRenderingContext2D,
	vp: Viewport,
): void {
	ctx.setTransform(vp.zoom, 0, 0, vp.zoom, vp.x * vp.zoom, vp.y * vp.zoom);
}

export function resetTransform(ctx: CanvasRenderingContext2D): void {
	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ----------------------------------------------------------------------------
// Element drawing
// ----------------------------------------------------------------------------

function applyRotation(
	ctx: CanvasRenderingContext2D,
	el: CanvasElement,
): void {
	if (el.rotation === 0) return;
	const cx = el.x + el.width / 2;
	const cy = el.y + el.height / 2;
	ctx.translate(cx, cy);
	ctx.rotate((el.rotation * Math.PI) / 180);
	ctx.translate(-cx, -cy);
}

function drawRectangle(
	ctx: CanvasRenderingContext2D,
	el: CanvasElement,
): void {
	const r = el.cornerRadius ?? 0;
	ctx.beginPath();
	if (r > 0) {
		ctx.roundRect(el.x, el.y, el.width, el.height, r);
	} else {
		ctx.rect(el.x, el.y, el.width, el.height);
	}
	if (el.fill !== "transparent" && el.fill !== "none") {
		ctx.fillStyle = el.fill;
		ctx.globalAlpha = el.opacity;
		ctx.fill();
	}
	if (el.strokeWidth > 0) {
		ctx.strokeStyle = el.stroke;
		ctx.lineWidth = el.strokeWidth;
		ctx.globalAlpha = el.opacity;
		ctx.stroke();
	}
}

function drawEllipse(
	ctx: CanvasRenderingContext2D,
	el: CanvasElement,
): void {
	const cx = el.x + el.width / 2;
	const cy = el.y + el.height / 2;
	ctx.beginPath();
	ctx.ellipse(cx, cy, Math.abs(el.width / 2), Math.abs(el.height / 2), 0, 0, Math.PI * 2);
	if (el.fill !== "transparent" && el.fill !== "none") {
		ctx.fillStyle = el.fill;
		ctx.globalAlpha = el.opacity;
		ctx.fill();
	}
	if (el.strokeWidth > 0) {
		ctx.strokeStyle = el.stroke;
		ctx.lineWidth = el.strokeWidth;
		ctx.globalAlpha = el.opacity;
		ctx.stroke();
	}
}

function drawArrowhead(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	angle: number,
	size: number,
	style: string,
): void {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.beginPath();
	if (style === "triangle") {
		ctx.moveTo(0, 0);
		ctx.lineTo(-size, -size / 2);
		ctx.lineTo(-size, size / 2);
		ctx.closePath();
		ctx.fill();
	} else {
		ctx.moveTo(-size, -size / 2);
		ctx.lineTo(0, 0);
		ctx.lineTo(-size, size / 2);
		ctx.stroke();
	}
	ctx.restore();
}

function drawLine(
	ctx: CanvasRenderingContext2D,
	el: CanvasElement,
): void {
	const pts = el.points;
	if (!pts || pts.length < 2) {
		// Fallback: draw from top-left to bottom-right
		ctx.beginPath();
		ctx.moveTo(el.x, el.y);
		ctx.lineTo(el.x + el.width, el.y + el.height);
		ctx.strokeStyle = el.stroke;
		ctx.lineWidth = el.strokeWidth;
		ctx.globalAlpha = el.opacity;
		ctx.stroke();
		return;
	}
	const p0 = pts[0];
	if (!p0) return;
	ctx.beginPath();
	ctx.moveTo(p0.x, p0.y);
	for (let i = 1; i < pts.length; i++) {
		const pt = pts[i];
		if (pt) ctx.lineTo(pt.x, pt.y);
	}
	ctx.strokeStyle = el.stroke;
	ctx.lineWidth = el.strokeWidth;
	ctx.globalAlpha = el.opacity;
	ctx.stroke();

	if (el.type === "arrow" && el.arrowHead !== "none" && pts.length >= 2) {
		const last = pts[pts.length - 1];
		const prev = pts[pts.length - 2];
		if (last && prev) {
			const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
			ctx.fillStyle = el.stroke;
			drawArrowhead(ctx, last.x, last.y, angle, 12, el.arrowHead ?? "arrow");
		}
	}
}

function drawFreehand(
	ctx: CanvasRenderingContext2D,
	el: CanvasElement,
): void {
	const pts = el.points;
	if (!pts || pts.length < 2) return;
	const first = pts[0];
	if (!first) return;
	ctx.beginPath();
	ctx.moveTo(first.x, first.y);
	for (let i = 1; i < pts.length - 1; i++) {
		const curr = pts[i];
		const next = pts[i + 1];
		if (!curr || !next) continue;
		const midX = (curr.x + next.x) / 2;
		const midY = (curr.y + next.y) / 2;
		ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
	}
	const lastPt = pts[pts.length - 1];
	if (lastPt) ctx.lineTo(lastPt.x, lastPt.y);
	ctx.strokeStyle = el.stroke;
	ctx.lineWidth = el.strokeWidth;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.globalAlpha = el.opacity;
	ctx.stroke();
}

function wrapText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number,
): void {
	const words = text.split(" ");
	let line = "";
	let currentY = y;
	for (const word of words) {
		const testLine = line ? `${line} ${word}` : word;
		const metrics = ctx.measureText(testLine);
		if (metrics.width > maxWidth && line) {
			ctx.fillText(line, x, currentY);
			line = word;
			currentY += lineHeight;
		} else {
			line = testLine;
		}
	}
	ctx.fillText(line, x, currentY);
}

function drawText(
	ctx: CanvasRenderingContext2D,
	el: CanvasElement,
): void {
	const size = el.fontSize ?? 16;
	const family = el.fontFamily ?? "Inter, system-ui, sans-serif";
	ctx.font = `${size}px ${family}`;
	ctx.fillStyle = el.stroke;
	ctx.globalAlpha = el.opacity;
	ctx.textBaseline = "top";
	const text = el.text ?? "";
	wrapText(ctx, text, el.x + 4, el.y + 4, el.width - 8, size * 1.3);
}

function drawSticky(
	ctx: CanvasRenderingContext2D,
	el: CanvasElement,
): void {
	const r = 6;
	ctx.beginPath();
	ctx.roundRect(el.x, el.y, el.width, el.height, r);
	ctx.fillStyle = el.fill || "#FBBF24";
	ctx.globalAlpha = el.opacity;
	ctx.fill();
	ctx.strokeStyle = "rgba(0,0,0,0.15)";
	ctx.lineWidth = 1;
	ctx.stroke();

	// Draw text inside
	if (el.text) {
		const size = el.fontSize ?? 14;
		ctx.font = `${size}px Inter, system-ui, sans-serif`;
		ctx.fillStyle = "#1a1a2e";
		ctx.textBaseline = "top";
		wrapText(ctx, el.text, el.x + 8, el.y + 8, el.width - 16, size * 1.3);
	}
}

export function drawElement(
	ctx: CanvasRenderingContext2D,
	el: CanvasElement,
): void {
	ctx.save();
	applyRotation(ctx, el);

	switch (el.type) {
		case "rectangle":
			drawRectangle(ctx, el);
			break;
		case "ellipse":
			drawEllipse(ctx, el);
			break;
		case "line":
		case "arrow":
			drawLine(ctx, el);
			break;
		case "freehand":
			drawFreehand(ctx, el);
			break;
		case "text":
			drawText(ctx, el);
			break;
		case "sticky":
			drawSticky(ctx, el);
			break;
		default:
			drawRectangle(ctx, el);
	}

	ctx.restore();
	ctx.globalAlpha = 1;
}

// ----------------------------------------------------------------------------
// Selection handles
// ----------------------------------------------------------------------------

const HANDLE_SIZE = 8;

export function drawSelectionHandles(
	ctx: CanvasRenderingContext2D,
	el: CanvasElement,
): void {
	const { x, y, width: w, height: h } = el;
	// Border
	ctx.strokeStyle = "#4A90D9";
	ctx.lineWidth = 1.5;
	ctx.setLineDash([]);
	ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);

	// Handles
	const handles = getHandlePositions(el);
	ctx.fillStyle = "#fff";
	ctx.strokeStyle = "#4A90D9";
	ctx.lineWidth = 1.5;
	for (const handle of handles) {
		ctx.fillRect(
			handle.x - HANDLE_SIZE / 2,
			handle.y - HANDLE_SIZE / 2,
			HANDLE_SIZE,
			HANDLE_SIZE,
		);
		ctx.strokeRect(
			handle.x - HANDLE_SIZE / 2,
			handle.y - HANDLE_SIZE / 2,
			HANDLE_SIZE,
			HANDLE_SIZE,
		);
	}
}

export interface HandlePosition {
	readonly x: number;
	readonly y: number;
	readonly cursor: string;
	readonly edge: string;
}

export function getHandlePositions(el: CanvasElement): readonly HandlePosition[] {
	const { x, y, width: w, height: h } = el;
	return [
		{ x, y, cursor: "nwse-resize", edge: "tl" },
		{ x: x + w / 2, y, cursor: "ns-resize", edge: "tc" },
		{ x: x + w, y, cursor: "nesw-resize", edge: "tr" },
		{ x: x + w, y: y + h / 2, cursor: "ew-resize", edge: "mr" },
		{ x: x + w, y: y + h, cursor: "nwse-resize", edge: "br" },
		{ x: x + w / 2, y: y + h, cursor: "ns-resize", edge: "bc" },
		{ x, y: y + h, cursor: "nesw-resize", edge: "bl" },
		{ x, y: y + h / 2, cursor: "ew-resize", edge: "ml" },
	];
}

// ----------------------------------------------------------------------------
// Selection rectangle
// ----------------------------------------------------------------------------

export function drawSelectionRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
): void {
	ctx.fillStyle = "rgba(74, 144, 217, 0.08)";
	ctx.fillRect(x, y, w, h);
	ctx.strokeStyle = "rgba(74, 144, 217, 0.5)";
	ctx.lineWidth = 1;
	ctx.setLineDash([4, 4]);
	ctx.strokeRect(x, y, w, h);
	ctx.setLineDash([]);
}

// ----------------------------------------------------------------------------
// Full render
// ----------------------------------------------------------------------------

export function renderCanvas(
	ctx: CanvasRenderingContext2D,
	elements: readonly CanvasElement[],
	selectedIds: ReadonlySet<string>,
	viewport: Viewport,
	canvasW: number,
	canvasH: number,
	gridVisible: boolean,
	gridSize: number,
	selectionRect: { x: number; y: number; w: number; h: number } | null,
): void {
	// Clear
	resetTransform(ctx);
	ctx.clearRect(0, 0, canvasW, canvasH);
	ctx.fillStyle = "#0d0d1a";
	ctx.fillRect(0, 0, canvasW, canvasH);

	// Grid (in screen space)
	if (gridVisible) {
		drawGrid(ctx, viewport, canvasW, canvasH, gridSize);
	}

	// Apply viewport
	applyViewport(ctx, viewport);

	// Sort by zIndex
	const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

	// Draw elements
	for (const el of sorted) {
		drawElement(ctx, el);
	}

	// Draw selection handles
	for (const el of sorted) {
		if (selectedIds.has(el.id)) {
			drawSelectionHandles(ctx, el);
		}
	}

	// Selection rectangle (in world space)
	if (selectionRect) {
		drawSelectionRect(
			ctx,
			selectionRect.x,
			selectionRect.y,
			selectionRect.w,
			selectionRect.h,
		);
	}

	resetTransform(ctx);
}

// ----------------------------------------------------------------------------
// Export helpers
// ----------------------------------------------------------------------------

export function renderToPNG(
	elements: readonly CanvasElement[],
): Promise<Blob | null> {
	if (elements.length === 0) return Promise.resolve(null);

	const padding = 40;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const el of elements) {
		minX = Math.min(minX, el.x);
		minY = Math.min(minY, el.y);
		maxX = Math.max(maxX, el.x + el.width);
		maxY = Math.max(maxY, el.y + el.height);
	}

	const w = maxX - minX + padding * 2;
	const h = maxY - minY + padding * 2;

	const offscreen = document.createElement("canvas");
	offscreen.width = w;
	offscreen.height = h;
	const ctx = offscreen.getContext("2d");
	if (!ctx) return Promise.resolve(null);

	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, w, h);
	ctx.translate(-minX + padding, -minY + padding);

	const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
	for (const el of sorted) {
		drawElement(ctx, el);
	}

	return new Promise((resolve) => {
		offscreen.toBlob((blob) => resolve(blob), "image/png");
	});
}

export function renderToSVG(elements: readonly CanvasElement[]): string {
	if (elements.length === 0) return "<svg></svg>";

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const el of elements) {
		minX = Math.min(minX, el.x);
		minY = Math.min(minY, el.y);
		maxX = Math.max(maxX, el.x + el.width);
		maxY = Math.max(maxY, el.y + el.height);
	}
	const pad = 20;
	const w = maxX - minX + pad * 2;
	const h = maxY - minY + pad * 2;

	const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
	let body = "";

	for (const el of sorted) {
		const rx = el.x - minX + pad;
		const ry = el.y - minY + pad;
		const fill = el.fill === "transparent" || el.fill === "none" ? "none" : el.fill;
		const stroke = el.stroke;
		const sw = el.strokeWidth;
		const op = el.opacity;

		switch (el.type) {
			case "rectangle":
				body += `<rect x="${rx}" y="${ry}" width="${el.width}" height="${el.height}" rx="${el.cornerRadius ?? 0}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" />\n`;
				break;
			case "ellipse":
				body += `<ellipse cx="${rx + el.width / 2}" cy="${ry + el.height / 2}" rx="${Math.abs(el.width / 2)}" ry="${Math.abs(el.height / 2)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" />\n`;
				break;
			case "text":
			case "sticky":
				body += `<rect x="${rx}" y="${ry}" width="${el.width}" height="${el.height}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" />\n`;
				if (el.text) {
					body += `<text x="${rx + 8}" y="${ry + 20}" font-size="${el.fontSize ?? 14}" fill="${el.type === "sticky" ? "#1a1a2e" : stroke}">${escapeXml(el.text)}</text>\n`;
				}
				break;
			case "freehand": {
				if (!el.points || el.points.length < 2) break;
				const d = pointsToPath(el.points);
				body += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" stroke-linecap="round" />\n`;
				break;
			}
			case "line":
			case "arrow": {
				if (el.points && el.points.length >= 2) {
					const d = pointsToPath(el.points);
					body += `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" />\n`;
				} else {
					body += `<line x1="${rx}" y1="${ry}" x2="${rx + el.width}" y2="${ry + el.height}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" />\n`;
				}
				break;
			}
			default:
				body += `<rect x="${rx}" y="${ry}" width="${el.width}" height="${el.height}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" />\n`;
		}
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n${body}</svg>`;
}

function pointsToPath(pts: readonly CanvasPoint[]): string {
	const first = pts[0];
	if (!first) return "";
	let d = `M${first.x} ${first.y}`;
	for (let i = 1; i < pts.length; i++) {
		const pt = pts[i];
		if (pt) d += ` L${pt.x} ${pt.y}`;
	}
	return d;
}

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
