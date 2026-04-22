// Canvas node positioning and identification

export interface CanvasNode {
	readonly id: string;
	readonly type: "trigger" | "action";
	readonly appId: string;
	readonly itemId: string; // eventType or actionId
	readonly label: string;
	readonly appName: string;
	readonly color: string;
	x: number;
	y: number;
}

export interface Wire {
	readonly fromNodeId: string;
	readonly toNodeId: string;
}

export interface DragItem {
	readonly type: "trigger" | "action";
	readonly appId: string;
	readonly itemId: string;
	readonly label: string;
	readonly appName: string;
	readonly color: string;
}
