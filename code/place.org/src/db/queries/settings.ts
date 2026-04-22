import { getCurrentUserId } from "../../lib/current-user";
import type { DbClient } from "../client";

/** Prefix the key with the current user ID for per-user scoping. */
function scopedKey(key: string): string {
	const userId = getCurrentUserId();
	return userId === 'guest' ? key : `${userId}:${key}`;
}

export async function getSetting(
	db: DbClient,
	key: string,
): Promise<string | null> {
	const rows = await db.query(
		"SELECT value FROM settings WHERE key = ?",
		[scopedKey(key)],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return String(rows[0]["value"]);
}

export async function setSetting(
	db: DbClient,
	key: string,
	value: string,
): Promise<void> {
	await db.exec(
		`INSERT INTO settings (key, value) VALUES (?, ?)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		[scopedKey(key), value],
	);
}
