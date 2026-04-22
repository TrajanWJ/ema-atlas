import { createId } from "../../lib/id";
import type { Review, ReviewType } from "../../types/review";
import type { DbClient } from "../client";

// ----------------------------------------------------------------------------
// Row → domain mapping
// ----------------------------------------------------------------------------

function rowToReview(row: Record<string, unknown>): Review {
	return {
		id: String(row["id"]),
		type: (row["type"] as ReviewType) ?? "weekly",
		date: String(row["date"]),
		wins: row["wins"] != null ? String(row["wins"]) : null,
		challenges: row["challenges"] != null ? String(row["challenges"]) : null,
		lessons: row["lessons"] != null ? String(row["lessons"]) : null,
		nextOneThing: row["next_one_thing"] != null ? String(row["next_one_thing"]) : null,
		content: row["content"] != null ? String(row["content"]) : null,
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

// ----------------------------------------------------------------------------
// Queries
// ----------------------------------------------------------------------------

export async function createReview(
	db: DbClient,
	type: ReviewType,
	date: string,
): Promise<Review> {
	const id = createId();
	const now = new Date().toISOString();
	await db.exec(
		`INSERT INTO reviews (id, type, date, wins, challenges, lessons, next_one_thing, content, created_at, updated_at)
		 VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?)`,
		[id, type, date, now, now],
	);
	return {
		id,
		type,
		date,
		wins: null,
		challenges: null,
		lessons: null,
		nextOneThing: null,
		content: null,
		createdAt: now,
		updatedAt: now,
	};
}

export async function saveReview(
	db: DbClient,
	review: Review,
): Promise<Review> {
	const now = new Date().toISOString();
	const updated: Review = { ...review, updatedAt: now };
	await db.exec(
		`INSERT INTO reviews (id, type, date, wins, challenges, lessons, next_one_thing, content, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
			wins = excluded.wins,
			challenges = excluded.challenges,
			lessons = excluded.lessons,
			next_one_thing = excluded.next_one_thing,
			content = excluded.content,
			updated_at = excluded.updated_at`,
		[
			updated.id,
			updated.type,
			updated.date,
			updated.wins,
			updated.challenges,
			updated.lessons,
			updated.nextOneThing,
			updated.content,
			updated.createdAt,
			updated.updatedAt,
		],
	);
	return updated;
}

export async function getReview(
	db: DbClient,
	id: string,
): Promise<Review | null> {
	const rows = await db.query("SELECT * FROM reviews WHERE id = ?", [id]);
	if (rows.length === 0 || rows[0] === undefined) return null;
	return rowToReview(rows[0]);
}

export async function listReviews(
	db: DbClient,
	type?: ReviewType,
	limit = 20,
): Promise<Review[]> {
	if (type !== undefined) {
		const rows = await db.query(
			"SELECT * FROM reviews WHERE type = ? ORDER BY date DESC LIMIT ?",
			[type, limit],
		);
		return rows.map(rowToReview);
	}
	const rows = await db.query(
		"SELECT * FROM reviews ORDER BY date DESC LIMIT ?",
		[limit],
	);
	return rows.map(rowToReview);
}
