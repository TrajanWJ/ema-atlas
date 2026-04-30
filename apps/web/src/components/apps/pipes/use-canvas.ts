import { useCallback, useState } from "react";
import { createId } from "@/src/lib/id";
import type { CanvasNode, Wire, DragItem } from "./types";

// ----------------------------------------------------------------------------
// Hook: manages canvas nodes, wires, and wiring state
// ----------------------------------------------------------------------------

interface CanvasState {
	readonly nodes: readonly CanvasNode[];
	readonly wires: readonly Wire[];
	readonly wiringFrom: string | null;
}

interface CanvasActions {
	addNode(item: DragItem, x: number, y: number): string;
	removeNode(id: string): void;
	moveNode(id: string, x: number, y: number): void;
	startWiring(nodeId: string): void;
	completeWiring(nodeId: string): boolean;
	cancelWiring(): void;
	removeWire(fromId: string, toId: string): void;
	clearAll(): void;
	loadFromPipe(
		nodes: readonly CanvasNode[],
		wires: readonly Wire[],
	): void;
}

export function useCanvas(): CanvasState & CanvasActions {
	const [nodes, setNodes] = useState<readonly CanvasNode[]>([]);
	const [wires, setWires] = useState<readonly Wire[]>([]);
	const [wiringFrom, setWiringFrom] = useState<string | null>(null);

	const addNode = useCallback(
		(item: DragItem, x: number, y: number): string => {
			const id = createId();
			const node: CanvasNode = {
				id,
				type: item.type,
				appId: item.appId,
				itemId: item.itemId,
				label: item.label,
				appName: item.appName,
				color: item.color,
				x,
				y,
			};
			setNodes((prev) => [...prev, node]);
			return id;
		},
		[],
	);

	const removeNode = useCallback((id: string) => {
		setNodes((prev) => prev.filter((n) => n.id !== id));
		setWires((prev) =>
			prev.filter((w) => w.fromNodeId !== id && w.toNodeId !== id),
		);
	}, []);

	const moveNode = useCallback((id: string, x: number, y: number) => {
		setNodes((prev) =>
			prev.map((n) => (n.id === id ? { ...n, x, y } : n)),
		);
	}, []);

	const startWiring = useCallback((nodeId: string) => {
		setWiringFrom(nodeId);
	}, []);

	const completeWiring = useCallback(
		(nodeId: string): boolean => {
			if (!wiringFrom || wiringFrom === nodeId) {
				setWiringFrom(null);
				return false;
			}
			const fromNode = nodes.find((n) => n.id === wiringFrom);
			const toNode = nodes.find((n) => n.id === nodeId);
			if (!fromNode || !toNode) {
				setWiringFrom(null);
				return false;
			}
			// Only allow trigger -> action wiring
			if (fromNode.type !== "trigger" || toNode.type !== "action") {
				setWiringFrom(null);
				return false;
			}
			// No duplicate wires
			const exists = wires.some(
				(w) => w.fromNodeId === wiringFrom && w.toNodeId === nodeId,
			);
			if (!exists) {
				setWires((prev) => [
					...prev,
					{ fromNodeId: wiringFrom, toNodeId: nodeId },
				]);
			}
			setWiringFrom(null);
			return true;
		},
		[wiringFrom, nodes, wires],
	);

	const cancelWiring = useCallback(() => {
		setWiringFrom(null);
	}, []);

	const removeWire = useCallback((fromId: string, toId: string) => {
		setWires((prev) =>
			prev.filter(
				(w) => !(w.fromNodeId === fromId && w.toNodeId === toId),
			),
		);
	}, []);

	const clearAll = useCallback(() => {
		setNodes([]);
		setWires([]);
		setWiringFrom(null);
	}, []);

	const loadFromPipe = useCallback(
		(newNodes: readonly CanvasNode[], newWires: readonly Wire[]) => {
			setNodes(newNodes);
			setWires(newWires);
			setWiringFrom(null);
		},
		[],
	);

	return {
		nodes,
		wires,
		wiringFrom,
		addNode,
		removeNode,
		moveNode,
		startWiring,
		completeWiring,
		cancelWiring,
		removeWire,
		clearAll,
		loadFromPipe,
	};
}
