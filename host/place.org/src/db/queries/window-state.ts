import { getCurrentUserId } from "../../lib/current-user";
import type { DbClient } from "../client";

export interface WindowState {
	readonly id: string;
	readonly appId: string;
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
	readonly zIndex: number;
	readonly minimized: boolean;
	readonly maximized: boolean;
	readonly updatedAt: string;
}

// ----------------------------------------------------------------------------
// Row → domain mapping
// ----------------------------------------------------------------------------
function rowToWindowState(row: Record<string, unknown>): WindowState {
	return {
		id: String(row["id"]),
		appId: String(row["app_id"]),
		x: Number(row["x"]),
		y: Number(row["y"]),
		width: Number(row["width"]),
		height: Number(row["height"]),
		zIndex: Number(row["z_index"]),
		minimized: row["minimized"] === 1 || row["minimized"] === true,
		maximized: row["maximized"] === 1 || row["maximized"] === true,
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries — all scoped to current user
// ----------------------------------------------------------------------------
export async function saveWindowState(
	db: DbClient,
	state: WindowState,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO window_state (id, app_id, x, y, width, height, z_index, minimized, maximized, updated_at, user_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
		   app_id    = excluded.app_id,
		   x         = excluded.x,
		   y         = excluded.y,
		   width     = excluded.width,
		   height    = excluded.height,
		   z_index   = excluded.z_index,
		   minimized = excluded.minimized,
		   maximized = excluded.maximized,
		   updated_at = ?`,
		[
			state.id,
			state.appId,
			state.x,
			state.y,
			state.width,
			state.height,
			state.zIndex,
			state.minimized ? 1 : 0,
			state.maximized ? 1 : 0,
			now,
			userId,
			now,
		],
	);
}

export async function loadWindowStates(db: DbClient): Promise<WindowState[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM window_state WHERE user_id = ? ORDER BY z_index ASC",
		[userId],
	);
	return rows.map(rowToWindowState);
}

export async function deleteWindowState(
	db: DbClient,
	id: string,
): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM window_state WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function clearAllWindowStates(db: DbClient): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM window_state WHERE user_id = ?", [userId]);
}
