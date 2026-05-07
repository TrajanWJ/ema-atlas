"use client";

import {
	useRef,
	useEffect,
	useCallback,
	useState,
	type MouseEvent as ReactMouseEvent,
	type WheelEvent as ReactWheelEvent,
} from "react";
import { useCanvasStore, type CanvasElement } from "@/src/stores/canvas-store";
import { renderCanvas } from "./CanvasRenderer";
import {
	screenToWorld,
	findElementAtPoint,
	hitTestHandle,
	elementsInRect,
	snapValue,
	createElement,
	toolToElementType,
	computeResize,
	INITIAL_DRAG,
	type DragState,
} from "./CanvasInteraction";
import { CanvasToolbar } from "./CanvasToolbar";
import { CanvasProperties } from "./CanvasProperties";
import { CanvasBottomBar } from "./CanvasBottomBar";
import { InlineTextEditor } from "./InlineTextEditor";

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

interface CanvasCoreProps {
	readonly fullPage?: boolean;
}

export function CanvasCore({ fullPage }: CanvasCoreProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<DragState>(INITIAL_DRAG);
	const rafRef = useRef<number>(0);
	const [propertiesVisible, setPropertiesVisible] = useState(true);
	const [editingTextId, setEditingTextId] = useState<string | null>(null);
	const [spaceHeld, setSpaceHeld] = useState(false);

	// Zustand selectors
	const elements = useCanvasStore((s) => s.elements);
	const selectedIds = useCanvasStore((s) => s.selectedIds);
	const tool = useCanvasStore((s) => s.tool);
	const viewport = useCanvasStore((s) => s.viewport);
	const gridVisible = useCanvasStore((s) => s.gridVisible);
	const gridSize = useCanvasStore((s) => s.gridSize);
	const snapToGrid = useCanvasStore((s) => s.snapToGrid);
	const fillColor = useCanvasStore((s) => s.fillColor);
	const strokeColor = useCanvasStore((s) => s.strokeColor);
	const strokeWidth = useCanvasStore((s) => s.strokeWidth);
	const fontSize = useCanvasStore((s) => s.fontSize);

	const addElement = useCanvasStore((s) => s.addElement);
	const updateElement = useCanvasStore((s) => s.updateElement);
	const deleteElements = useCanvasStore((s) => s.deleteElements);
	const moveElements = useCanvasStore((s) => s.moveElements);
	const resizeElement = useCanvasStore((s) => s.resizeElement);
	const selectElements = useCanvasStore((s) => s.selectElements);
	const clearSelection = useCanvasStore((s) => s.clearSelection);
	const setTool = useCanvasStore((s) => s.setTool);
	const setViewport = useCanvasStore((s) => s.setViewport);
	const pushHistory = useCanvasStore((s) => s.pushHistory);
	const undo = useCanvasStore((s) => s.undo);
	const redo = useCanvasStore((s) => s.redo);
	const duplicateSelected = useCanvasStore((s) => s.duplicateSelected);

	// Selection rect overlay
	const [selectionRect, setSelectionRect] = useState<{
		x: number;
		y: number;
		w: number;
		h: number;
	} | null>(null);

	// ------------------------------------------------------------------
	// Render loop
	// ------------------------------------------------------------------

	const renderFrame = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const store = useCanvasStore.getState();
		renderCanvas(
			ctx,
			store.elements,
			store.selectedIds,
			store.viewport,
			canvas.width,
			canvas.height,
			store.gridVisible,
			store.gridSize,
			selectionRect,
		);
	}, [selectionRect]);

	// Resize observer for canvas dimensions
	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;
		if (!container || !canvas) return;

		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				const dpr = window.devicePixelRatio || 1;
				canvas.width = width * dpr;
				canvas.height = height * dpr;
				canvas.style.width = `${width}px`;
				canvas.style.height = `${height}px`;
				const ctx = canvas.getContext("2d");
				if (ctx) ctx.scale(dpr, dpr);
			}
		});
		ro.observe(container);
		return () => ro.disconnect();
	}, []);

	// Animation frame loop
	useEffect(() => {
		let running = true;
		const loop = () => {
			if (!running) return;
			renderFrame();
			rafRef.current = requestAnimationFrame(loop);
		};
		rafRef.current = requestAnimationFrame(loop);
		return () => {
			running = false;
			cancelAnimationFrame(rafRef.current);
		};
	}, [renderFrame]);

	// ------------------------------------------------------------------
	// Keyboard shortcuts
	// ------------------------------------------------------------------

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in an input
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;

			if (e.key === " ") {
				e.preventDefault();
				setSpaceHeld(true);
				return;
			}

			if (e.ctrlKey || e.metaKey) {
				if (e.key === "z" && !e.shiftKey) {
					e.preventDefault();
					undo();
					return;
				}
				if ((e.key === "z" && e.shiftKey) || e.key === "y") {
					e.preventDefault();
					redo();
					return;
				}
				if (e.key === "d") {
					e.preventDefault();
					duplicateSelected();
					return;
				}
				return;
			}

			// Tool shortcuts (single keys)
			const toolMap: Record<string, typeof tool> = {
				v: "select",
				r: "rectangle",
				o: "ellipse",
				l: "line",
				a: "arrow",
				t: "text",
				p: "freehand",
				s: "sticky",
				e: "eraser",
				h: "hand",
			};
			const mapped = toolMap[e.key.toLowerCase()];
			if (mapped) {
				setTool(mapped);
				return;
			}

			if (e.key === "Delete" || e.key === "Backspace") {
				const ids = [...useCanvasStore.getState().selectedIds];
				if (ids.length > 0) {
					pushHistory();
					deleteElements(ids);
				}
				return;
			}

			if (e.key === "Escape") {
				clearSelection();
				setEditingTextId(null);
			}
		};

		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key === " ") setSpaceHeld(false);
		};

		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
		};
	}, [
		undo,
		redo,
		setTool,
		deleteElements,
		clearSelection,
		pushHistory,
		duplicateSelected,
	]);

	// ------------------------------------------------------------------
	// Mouse helpers
	// ------------------------------------------------------------------

	const getCanvasXY = useCallback(
		(e: ReactMouseEvent) => {
			const canvas = canvasRef.current;
			if (!canvas) return { sx: 0, sy: 0, wx: 0, wy: 0 };
			const rect = canvas.getBoundingClientRect();
			const sx = e.clientX - rect.left;
			const sy = e.clientY - rect.top;
			const { x: wx, y: wy } = screenToWorld(
				sx,
				sy,
				useCanvasStore.getState().viewport,
			);
			return { sx, sy, wx, wy };
		},
		[],
	);

	const maybeSnap = useCallback(
		(v: number) => (snapToGrid ? snapValue(v, gridSize) : v),
		[snapToGrid, gridSize],
	);

	// ------------------------------------------------------------------
	// Mouse down
	// ------------------------------------------------------------------

	const onMouseDown = useCallback(
		(e: ReactMouseEvent<HTMLCanvasElement>) => {
			e.preventDefault();
			const { sx, sy, wx, wy } = getCanvasXY(e);
			const state = useCanvasStore.getState();

			// Pan with space held or hand tool
			if (spaceHeld || state.tool === "hand") {
				dragRef.current = {
					...INITIAL_DRAG,
					mode: "pan",
					startScreenX: sx,
					startScreenY: sy,
					startViewport: { x: state.viewport.x, y: state.viewport.y },
				};
				return;
			}

			// Middle-click pan
			if (e.button === 1) {
				dragRef.current = {
					...INITIAL_DRAG,
					mode: "pan",
					startScreenX: sx,
					startScreenY: sy,
					startViewport: { x: state.viewport.x, y: state.viewport.y },
				};
				return;
			}

			// Eraser
			if (state.tool === "eraser") {
				const hit = findElementAtPoint(wx, wy, state.elements);
				if (hit) {
					pushHistory();
					deleteElements([hit.id]);
				}
				return;
			}

			// Select tool
			if (state.tool === "select") {
				// Check handle hit on selected elements
				for (const el of state.elements) {
					if (!state.selectedIds.has(el.id)) continue;
					const edge = hitTestHandle(wx, wy, el);
					if (edge) {
						pushHistory();
						dragRef.current = {
							...INITIAL_DRAG,
							mode: "resize",
							startScreenX: sx,
							startScreenY: sy,
							startWorldX: wx,
							startWorldY: wy,
							resizeEdge: edge,
							startBounds: {
								x: el.x,
								y: el.y,
								width: el.width,
								height: el.height,
							},
						};
						return;
					}
				}

				// Hit test elements
				const hit = findElementAtPoint(wx, wy, state.elements);
				if (hit) {
					// Alt+drag: duplicate
					if (e.altKey) {
						pushHistory();
						duplicateSelected();
						// Start moving the duplicated selection
						dragRef.current = {
							...INITIAL_DRAG,
							mode: "move",
							startScreenX: sx,
							startScreenY: sy,
							startWorldX: wx,
							startWorldY: wy,
						};
						return;
					}

					if (e.shiftKey) {
						const newSet = new Set(state.selectedIds);
						if (newSet.has(hit.id)) {
							newSet.delete(hit.id);
						} else {
							newSet.add(hit.id);
						}
						selectElements([...newSet]);
					} else if (!state.selectedIds.has(hit.id)) {
						selectElements([hit.id]);
					}

					// Double click on text/sticky to edit
					if (
						(hit.type === "text" || hit.type === "sticky") &&
						e.detail === 2
					) {
						setEditingTextId(hit.id);
						return;
					}

					pushHistory();
					dragRef.current = {
						...INITIAL_DRAG,
						mode: "move",
						startScreenX: sx,
						startScreenY: sy,
						startWorldX: wx,
						startWorldY: wy,
					};
					return;
				}

				// Empty space: start selection rectangle
				clearSelection();
				dragRef.current = {
					...INITIAL_DRAG,
					mode: "select-rect",
					startWorldX: wx,
					startWorldY: wy,
					startScreenX: sx,
					startScreenY: sy,
				};
				return;
			}

			// Drawing tools
			const elType = toolToElementType(state.tool);
			if (!elType) return;

			pushHistory();
			const snappedX = maybeSnap(wx);
			const snappedY = maybeSnap(wy);

			const maxZ = state.elements.length > 0
				? Math.max(...state.elements.map((el) => el.zIndex)) + 1
				: 1;

			const newEl = createElement(
				elType,
				snappedX,
				snappedY,
				{ fill: fillColor, stroke: strokeColor, strokeWidth, fontSize },
				maxZ,
			);

			if (elType === "text" || elType === "sticky") {
				addElement(newEl);
				selectElements([newEl.id]);
				if (elType === "text") setEditingTextId(newEl.id);
				setTool("select");
				return;
			}

			if (elType === "freehand") {
				addElement(newEl);
				selectElements([newEl.id]);
				dragRef.current = {
					...INITIAL_DRAG,
					mode: "freehand",
					startScreenX: sx,
					startScreenY: sy,
					startWorldX: snappedX,
					startWorldY: snappedY,
					creatingElement: newEl,
				};
				return;
			}

			addElement(newEl);
			selectElements([newEl.id]);
			dragRef.current = {
				...INITIAL_DRAG,
				mode: "create",
				startWorldX: snappedX,
				startWorldY: snappedY,
				startScreenX: sx,
				startScreenY: sy,
				creatingElement: newEl,
			};
		},
		[
			getCanvasXY,
			spaceHeld,
			pushHistory,
			deleteElements,
			selectElements,
			clearSelection,
			duplicateSelected,
			addElement,
			setTool,
			maybeSnap,
			fillColor,
			strokeColor,
			strokeWidth,
			fontSize,
		],
	);

	// ------------------------------------------------------------------
	// Mouse move
	// ------------------------------------------------------------------

	const onMouseMove = useCallback(
		(e: ReactMouseEvent<HTMLCanvasElement>) => {
			const drag = dragRef.current;
			if (drag.mode === "none") return;

			const { sx, sy, wx, wy } = getCanvasXY(e);
			const state = useCanvasStore.getState();

			switch (drag.mode) {
				case "pan": {
					const dx = (sx - drag.startScreenX) / state.viewport.zoom;
					const dy = (sy - drag.startScreenY) / state.viewport.zoom;
					setViewport({
						x: drag.startViewport.x + dx,
						y: drag.startViewport.y + dy,
					});
					break;
				}

				case "move": {
					const dx = wx - drag.startWorldX;
					const dy = wy - drag.startWorldY;
					const ids = [...state.selectedIds];
					if (ids.length > 0) {
						const snappedDx = maybeSnap(dx);
						const snappedDy = e.shiftKey
							? 0
							: maybeSnap(dy);
						const finalDx = e.shiftKey
							? (Math.abs(dx) > Math.abs(dy) ? snappedDx : 0)
							: snappedDx;
						const finalDy = e.shiftKey
							? (Math.abs(dy) > Math.abs(dx) ? maybeSnap(dy) : 0)
							: snappedDy;
						moveElements(ids, finalDx, finalDy);
						dragRef.current = {
							...drag,
							startWorldX: drag.startWorldX + finalDx,
							startWorldY: drag.startWorldY + finalDy,
						};
					}
					break;
				}

				case "resize": {
					const dx = wx - drag.startWorldX;
					const dy = wy - drag.startWorldY;
					const ids = [...state.selectedIds];
					const firstId = ids[0];
					if (ids.length === 1 && firstId) {
						const result = computeResize(
							drag.resizeEdge,
							drag.startBounds,
							dx,
							dy,
						);
						resizeElement(
							firstId,
							maybeSnap(result.x),
							maybeSnap(result.y),
							maybeSnap(result.width),
							maybeSnap(result.height),
						);
					}
					break;
				}

				case "create": {
					const el = drag.creatingElement;
					if (!el) break;
					const w = maybeSnap(wx - drag.startWorldX);
					const h = maybeSnap(wy - drag.startWorldY);
					updateElement(el.id, { width: w, height: h });
					break;
				}

				case "freehand": {
					const el = drag.creatingElement;
					if (!el) break;
					const current = state.elements.find((e2) => e2.id === el.id);
					if (!current) break;
					const pts = [...(current.points ?? []), { x: wx, y: wy }];
					updateElement(el.id, { points: pts });
					break;
				}

				case "select-rect": {
					const rw = wx - drag.startWorldX;
					const rh = wy - drag.startWorldY;
					setSelectionRect({
						x: drag.startWorldX,
						y: drag.startWorldY,
						w: rw,
						h: rh,
					});
					const ids = elementsInRect(
						state.elements,
						drag.startWorldX,
						drag.startWorldY,
						rw,
						rh,
					);
					selectElements(ids);
					break;
				}
			}
		},
		[
			getCanvasXY,
			setViewport,
			moveElements,
			resizeElement,
			updateElement,
			selectElements,
			maybeSnap,
		],
	);

	// ------------------------------------------------------------------
	// Mouse up
	// ------------------------------------------------------------------

	const onMouseUp = useCallback(
		(e: ReactMouseEvent<HTMLCanvasElement>) => {
			const drag = dragRef.current;

			if (drag.mode === "create" && drag.creatingElement) {
				// Normalize negative dimensions
				const el = useCanvasStore
					.getState()
					.elements.find((e2) => e2.id === drag.creatingElement?.id);
				if (el) {
					let { x, y, width: w, height: h } = el;
					if (w < 0) {
						x += w;
						w = -w;
					}
					if (h < 0) {
						y += h;
						h = -h;
					}
					if (w < 2 && h < 2) {
						// Too small — remove
						deleteElements([el.id]);
					} else {
						updateElement(el.id, { x, y, width: w, height: h });
					}
				}
			}

			if (drag.mode === "freehand" && drag.creatingElement) {
				// Compute bounding box for freehand
				const el = useCanvasStore
					.getState()
					.elements.find((e2) => e2.id === drag.creatingElement?.id);
				if (el?.points && el.points.length >= 2) {
					let minX = Infinity;
					let minY = Infinity;
					let maxX = -Infinity;
					let maxY = -Infinity;
					for (const p of el.points) {
						minX = Math.min(minX, p.x);
						minY = Math.min(minY, p.y);
						maxX = Math.max(maxX, p.x);
						maxY = Math.max(maxY, p.y);
					}
					updateElement(el.id, {
						x: minX,
						y: minY,
						width: maxX - minX,
						height: maxY - minY,
					});
				} else if (el) {
					deleteElements([el.id]);
				}
			}

			setSelectionRect(null);
			dragRef.current = INITIAL_DRAG;
		},
		[deleteElements, updateElement],
	);

	// ------------------------------------------------------------------
	// Wheel (zoom)
	// ------------------------------------------------------------------

	const onWheel = useCallback(
		(e: ReactWheelEvent<HTMLCanvasElement>) => {
			e.preventDefault();
			const state = useCanvasStore.getState();
			if (e.ctrlKey || e.metaKey) {
				// Zoom
				const factor = e.deltaY > 0 ? 0.9 : 1.1;
				const newZoom = Math.min(5, Math.max(0.1, state.viewport.zoom * factor));
				setViewport({ zoom: newZoom });
			} else {
				// Pan
				const dx = -e.deltaX / state.viewport.zoom;
				const dy = -e.deltaY / state.viewport.zoom;
				setViewport({
					x: state.viewport.x + dx,
					y: state.viewport.y + dy,
				});
			}
		},
		[setViewport],
	);

	// ------------------------------------------------------------------
	// Inline text editing
	// ------------------------------------------------------------------

	const editingElement = editingTextId
		? elements.find((el) => el.id === editingTextId)
		: null;

	const commitText = useCallback(
		(text: string) => {
			if (editingTextId) {
				updateElement(editingTextId, { text });
			}
			setEditingTextId(null);
		},
		[editingTextId, updateElement],
	);

	// ------------------------------------------------------------------
	// Cursor
	// ------------------------------------------------------------------

	let cursor = "crosshair";
	if (tool === "select") cursor = "default";
	if (tool === "hand" || spaceHeld) cursor = "grab";
	if (tool === "eraser") cursor = "cell";
	if (tool === "text") cursor = "text";
	if (dragRef.current.mode === "pan") cursor = "grabbing";

	// ------------------------------------------------------------------
	// Render
	// ------------------------------------------------------------------

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: fullPage ? "100dvh" : "100%",
				width: "100%",
				background: "var(--place-surface-0)",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{/* Back link for full-page mode */}
			{fullPage && (
				<div
					style={{
						position: "absolute",
						top: 8,
						left: 8,
						zIndex: 100,
					}}
				>
					<a
						href="/"
						style={{
							fontSize: 12,
							color: "var(--place-text-secondary)",
							textDecoration: "none",
							padding: "4px 8px",
							background: "var(--place-surface-1)",
							borderRadius: 6,
							border: "1px solid var(--place-border-default)",
						}}
					>
						Back to Desktop
					</a>
				</div>
			)}

			{/* Toolbar */}
			<CanvasToolbar activeTool={tool} onToolChange={setTool} />

			{/* Main area */}
			<div style={{ display: "flex", flex: 1, minHeight: 0 }}>
				{/* Canvas */}
				<div
					ref={containerRef}
					style={{
						flex: 1,
						position: "relative",
						minWidth: 0,
					}}
				>
					<canvas
						ref={canvasRef}
						onMouseDown={onMouseDown}
						onMouseMove={onMouseMove}
						onMouseUp={onMouseUp}
						onWheel={onWheel}
						onContextMenu={(e) => e.preventDefault()}
						style={{
							display: "block",
							cursor,
							touchAction: "none",
						}}
					/>
					{elements.length === 0 ? <CanvasStarterOverlay /> : null}

					{/* Inline text editor overlay */}
					{editingElement && (
						<InlineTextEditor
							element={editingElement}
							viewport={viewport}
							onCommit={commitText}
						/>
					)}
				</div>

				{/* Properties panel */}
				<CanvasProperties visible={propertiesVisible} />
			</div>

			{/* Bottom bar */}
			<CanvasBottomBar />
		</div>
	);
}

function CanvasStarterOverlay() {
	return (
		<div
			className="pointer-events-none absolute inset-0 flex items-center justify-center p-8"
			aria-hidden="true"
		>
			<div
				className="grid w-full max-w-3xl gap-3 sm:grid-cols-3"
				style={{ opacity: 0.74 }}
			>
				<SampleCanvasCard
					label="Desktop"
					lines={["Dock actions", "Window memory", "Widget states"]}
					accent="var(--place-primary-400)"
				/>
				<SampleCanvasCard
					label="Holodeck"
					lines={["Sidebar routes", "Panel samples", "Mode switch"]}
					accent="var(--place-secondary-400)"
				/>
				<SampleCanvasCard
					label="Next"
					lines={["Refine desktop", "Wire missing functions", "Promote canon"]}
					accent="var(--place-tertiary-400)"
				/>
			</div>
		</div>
	);
}

function SampleCanvasCard({
	label,
	lines,
	accent,
}: {
	readonly label: string;
	readonly lines: readonly string[];
	readonly accent: string;
}) {
	return (
		<div
			className="rounded-lg border p-4"
			style={{
				background: "rgba(14,16,23,0.68)",
				borderColor: "var(--place-border-default)",
				boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
			}}
		>
			<div className="mb-3 flex items-center gap-2">
				<span
					className="h-2.5 w-2.5 rounded-full"
					style={{ background: accent }}
				/>
				<strong
					className="text-sm"
					style={{ color: "var(--place-text-primary)" }}
				>
					{label}
				</strong>
			</div>
			<div className="flex flex-col gap-2">
				{lines.map((line) => (
					<span
						key={line}
						className="rounded px-2 py-1 text-xs"
						style={{
							background: "rgba(255,255,255,0.05)",
							color: "var(--place-text-secondary)",
						}}
					>
						{line}
					</span>
				))}
			</div>
		</div>
	);
}
