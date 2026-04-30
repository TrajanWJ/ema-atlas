// ---------------------------------------------------------------------------
// Undo Stack Protocol
// Apps wire into this to support reversible actions across the desktop.
// ---------------------------------------------------------------------------

export interface ReversibleAction {
	readonly id: string;
	readonly appId: string;
	readonly description: string;
	readonly execute: () => void;
	readonly reverse: () => void;
	readonly timestamp: number;
}

export interface UndoStack {
	push(action: ReversibleAction): void;
	undo(): ReversibleAction | null;
	redo(): ReversibleAction | null;
	readonly canUndo: boolean;
	readonly canRedo: boolean;
	readonly history: readonly ReversibleAction[];
}

const MAX_STACK_SIZE = 50;

class UndoStackImpl implements UndoStack {
	private undoItems: ReversibleAction[] = [];
	private redoItems: ReversibleAction[] = [];

	get canUndo(): boolean {
		return this.undoItems.length > 0;
	}

	get canRedo(): boolean {
		return this.redoItems.length > 0;
	}

	get history(): readonly ReversibleAction[] {
		return this.undoItems;
	}

	push(action: ReversibleAction): void {
		this.undoItems.push(action);
		// Trim oldest entries when exceeding max
		if (this.undoItems.length > MAX_STACK_SIZE) {
			this.undoItems = this.undoItems.slice(-MAX_STACK_SIZE);
		}
		// Any new action invalidates the redo branch
		this.redoItems = [];
	}

	undo(): ReversibleAction | null {
		const action = this.undoItems.pop();
		if (!action) return null;

		action.reverse();
		this.redoItems.push(action);
		return action;
	}

	redo(): ReversibleAction | null {
		const action = this.redoItems.pop();
		if (!action) return null;

		action.execute();
		this.undoItems.push(action);
		return action;
	}
}

/** Singleton undo stack shared across the entire desktop. */
export const undoStack: UndoStack = new UndoStackImpl();
