/**
 * Queries for the tracker family (Feel, Stuck, Avoiding, OneWord, Decision,
 * Learning, OpenQuestion, Contact, MorningIntent, EveningClose, WellnessPing,
 * WeekTurn).
 *
 * All share the same idiom: createId + ISO timestamp + user_id scoping.
 */

import { createId } from "../../lib/id";
import { getCurrentUserId } from "../../lib/current-user";
import type {
	FeelCheck,
	Stuck,
	StuckState,
	AvoidingItem,
	AvoidingState,
	OneWord,
	Decision,
	LearningEntry,
	OpenQuestion,
	OpenQuestionState,
	ContactTouch,
	MorningIntent,
	EveningClose,
	WellnessKind,
	WellnessPing,
	WeekTurn,
} from "../../types/trackers";
import type { DbClient } from "../client";

function todayLocal(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mondayOf(date: Date): string {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day; // back to Monday
	d.setDate(d.getDate() + diff);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseJsonArray(raw: unknown): readonly string[] {
	if (raw == null) return [];
	try {
		const parsed = JSON.parse(String(raw));
		return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
	} catch {
		return [];
	}
}

// ---------- Feel Checks ----------

export async function insertFeelCheck(
	db: DbClient,
	emoji: string,
	note: string | null = null,
): Promise<FeelCheck> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO feel_checks (id, user_id, emoji, note, at, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		[id, userId, emoji, note, now, now],
	);
	return { id, emoji, note, at: now };
}

export async function getRecentFeelChecks(db: DbClient, limit: number = 30): Promise<FeelCheck[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM feel_checks WHERE user_id = ? ORDER BY at DESC LIMIT ?",
		[userId, limit],
	);
	return rows.map((r) => ({
		id: String(r["id"]),
		emoji: String(r["emoji"]),
		note: r["note"] != null ? String(r["note"]) : null,
		at: String(r["at"]),
	}));
}

// ---------- Stucks ----------

function rowToStuck(row: Record<string, unknown>): Stuck {
	return {
		id: String(row["id"]),
		text: String(row["text"]),
		state: (row["state"] as StuckState) ?? "open",
		resolvedAt: row["resolved_at"] != null ? String(row["resolved_at"]) : null,
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

export async function insertStuck(db: DbClient, text: string): Promise<Stuck> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO stucks (id, user_id, text, state, resolved_at, created_at, updated_at)
		 VALUES (?, ?, ?, 'open', NULL, ?, ?)`,
		[id, userId, text, now, now],
	);
	return { id, text, state: "open", resolvedAt: null, createdAt: now, updatedAt: now };
}

export async function getStucks(db: DbClient, state?: StuckState): Promise<Stuck[]> {
	const userId = getCurrentUserId();
	if (state) {
		const rows = await db.query(
			"SELECT * FROM stucks WHERE user_id = ? AND state = ? ORDER BY created_at DESC",
			[userId, state],
		);
		return rows.map(rowToStuck);
	}
	const rows = await db.query(
		"SELECT * FROM stucks WHERE user_id = ? ORDER BY state ASC, created_at DESC",
		[userId],
	);
	return rows.map(rowToStuck);
}

export async function resolveStuck(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE stucks SET state = 'resolved', resolved_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[now, now, id, userId],
	);
}

export async function deleteStuck(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM stucks WHERE id = ? AND user_id = ?", [id, userId]);
}

// ---------- Avoiding ----------

function rowToAvoiding(row: Record<string, unknown>): AvoidingItem {
	return {
		id: String(row["id"]),
		text: String(row["text"]),
		state: (row["state"] as AvoidingState) ?? "active",
		resolvedAt: row["resolved_at"] != null ? String(row["resolved_at"]) : null,
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

export async function insertAvoiding(db: DbClient, text: string): Promise<AvoidingItem> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO avoiding_items (id, user_id, text, state, resolved_at, created_at, updated_at)
		 VALUES (?, ?, ?, 'active', NULL, ?, ?)`,
		[id, userId, text, now, now],
	);
	return { id, text, state: "active", resolvedAt: null, createdAt: now, updatedAt: now };
}

export async function getAvoidingItems(db: DbClient, state?: AvoidingState): Promise<AvoidingItem[]> {
	const userId = getCurrentUserId();
	if (state) {
		const rows = await db.query(
			"SELECT * FROM avoiding_items WHERE user_id = ? AND state = ? ORDER BY created_at DESC",
			[userId, state],
		);
		return rows.map(rowToAvoiding);
	}
	const rows = await db.query(
		"SELECT * FROM avoiding_items WHERE user_id = ? ORDER BY state ASC, created_at DESC",
		[userId],
	);
	return rows.map(rowToAvoiding);
}

export async function resolveAvoiding(db: DbClient, id: string): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE avoiding_items SET state = 'resolved', resolved_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[now, now, id, userId],
	);
}

export async function deleteAvoiding(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM avoiding_items WHERE id = ? AND user_id = ?", [id, userId]);
}

// ---------- One Word ----------

export async function getOneWord(db: DbClient, date: string = todayLocal()): Promise<OneWord | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM one_words WHERE user_id = ? AND date = ? LIMIT 1",
		[userId, date],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	const r = rows[0];
	return { date: String(r["date"]), word: String(r["word"]), updatedAt: String(r["updated_at"]) };
}

export async function setOneWord(
	db: DbClient,
	word: string,
	date: string = todayLocal(),
): Promise<OneWord> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO one_words (user_id, date, word, updated_at)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(user_id, date) DO UPDATE SET word = excluded.word, updated_at = excluded.updated_at`,
		[userId, date, word, now],
	);
	return { date, word, updatedAt: now };
}

// ---------- Decisions ----------

function rowToDecision(row: Record<string, unknown>): Decision {
	return {
		id: String(row["id"]),
		title: String(row["title"]),
		choice: row["choice"] != null ? String(row["choice"]) : null,
		why: row["why"] != null ? String(row["why"]) : null,
		reversible: row["reversible"] === 1 || row["reversible"] === true,
		projectId: row["project_id"] != null ? String(row["project_id"]) : null,
		decidedAt: String(row["decided_at"]),
		outcome: row["outcome"] != null ? String(row["outcome"]) : null,
		outcomeAt: row["outcome_at"] != null ? String(row["outcome_at"]) : null,
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

export async function insertDecision(
	db: DbClient,
	title: string,
	choice: string | null,
	why: string | null,
	reversible: boolean,
	projectId: string | null = null,
): Promise<Decision> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO decisions (id, user_id, title, choice, why, reversible, project_id, decided_at, outcome, outcome_at, annotations, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`,
		[id, userId, title, choice, why, reversible ? 1 : 0, projectId, now, now, now],
	);
	return {
		id,
		title,
		choice,
		why,
		reversible,
		projectId,
		decidedAt: now,
		outcome: null,
		outcomeAt: null,
		createdAt: now,
		updatedAt: now,
	};
}

export async function getDecisions(db: DbClient, limit: number = 100): Promise<Decision[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM decisions WHERE user_id = ? ORDER BY decided_at DESC LIMIT ?",
		[userId, limit],
	);
	return rows.map(rowToDecision);
}

export async function setDecisionOutcome(
	db: DbClient,
	id: string,
	outcome: string,
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE decisions SET outcome = ?, outcome_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[outcome, now, now, id, userId],
	);
}

export async function deleteDecision(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM decisions WHERE id = ? AND user_id = ?", [id, userId]);
}

// ---------- Learning Log ----------

export async function insertLearning(
	db: DbClient,
	text: string,
	topic: string | null = null,
	source: string | null = null,
): Promise<LearningEntry> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO learning_log (id, user_id, text, topic, source, at, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[id, userId, text, topic, source, now, now],
	);
	return { id, text, topic, source, at: now };
}

export async function getLearning(db: DbClient, limit: number = 100): Promise<LearningEntry[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM learning_log WHERE user_id = ? ORDER BY at DESC LIMIT ?",
		[userId, limit],
	);
	return rows.map((r) => ({
		id: String(r["id"]),
		text: String(r["text"]),
		topic: r["topic"] != null ? String(r["topic"]) : null,
		source: r["source"] != null ? String(r["source"]) : null,
		at: String(r["at"]),
	}));
}

export async function deleteLearning(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM learning_log WHERE id = ? AND user_id = ?", [id, userId]);
}

// ---------- Open Questions ----------

function rowToQuestion(row: Record<string, unknown>): OpenQuestion {
	return {
		id: String(row["id"]),
		text: String(row["text"]),
		state: (row["state"] as OpenQuestionState) ?? "open",
		answer: row["answer"] != null ? String(row["answer"]) : null,
		answeredAt: row["answered_at"] != null ? String(row["answered_at"]) : null,
		createdAt: String(row["created_at"]),
		updatedAt: String(row["updated_at"]),
	};
}

export async function insertQuestion(db: DbClient, text: string): Promise<OpenQuestion> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO open_questions (id, user_id, text, state, answer, answered_at, created_at, updated_at)
		 VALUES (?, ?, ?, 'open', NULL, NULL, ?, ?)`,
		[id, userId, text, now, now],
	);
	return {
		id,
		text,
		state: "open",
		answer: null,
		answeredAt: null,
		createdAt: now,
		updatedAt: now,
	};
}

export async function getQuestions(db: DbClient, state?: OpenQuestionState): Promise<OpenQuestion[]> {
	const userId = getCurrentUserId();
	if (state) {
		const rows = await db.query(
			"SELECT * FROM open_questions WHERE user_id = ? AND state = ? ORDER BY created_at DESC",
			[userId, state],
		);
		return rows.map(rowToQuestion);
	}
	const rows = await db.query(
		"SELECT * FROM open_questions WHERE user_id = ? ORDER BY state ASC, created_at DESC",
		[userId],
	);
	return rows.map(rowToQuestion);
}

export async function answerQuestion(db: DbClient, id: string, answer: string): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		"UPDATE open_questions SET state = 'answered', answer = ?, answered_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
		[answer, now, now, id, userId],
	);
}

export async function deleteQuestion(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM open_questions WHERE id = ? AND user_id = ?", [id, userId]);
}

// ---------- Contacts ----------

export async function insertContactTouch(
	db: DbClient,
	name: string,
	oneWord: string | null = null,
	channel: string | null = null,
): Promise<ContactTouch> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO contact_touches (id, user_id, name, one_word, channel, at, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[id, userId, name, oneWord, channel, now, now],
	);
	return { id, name, oneWord, channel, at: now };
}

export async function getContactTouches(db: DbClient, limit: number = 200): Promise<ContactTouch[]> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM contact_touches WHERE user_id = ? ORDER BY at DESC LIMIT ?",
		[userId, limit],
	);
	return rows.map((r) => ({
		id: String(r["id"]),
		name: String(r["name"]),
		oneWord: r["one_word"] != null ? String(r["one_word"]) : null,
		channel: r["channel"] != null ? String(r["channel"]) : null,
		at: String(r["at"]),
	}));
}

export async function deleteContactTouch(db: DbClient, id: string): Promise<void> {
	const userId = getCurrentUserId();
	await db.exec("DELETE FROM contact_touches WHERE id = ? AND user_id = ?", [id, userId]);
}

// ---------- Morning Intent ----------

export async function getMorningIntent(db: DbClient, date: string = todayLocal()): Promise<MorningIntent | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM morning_intents WHERE user_id = ? AND date = ? LIMIT 1",
		[userId, date],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	const r = rows[0];
	return {
		date: String(r["date"]),
		text: String(r["text"]),
		satisfied: r["satisfied"] == null ? null : r["satisfied"] === 1,
		updatedAt: String(r["updated_at"]),
	};
}

export async function setMorningIntent(
	db: DbClient,
	text: string,
	date: string = todayLocal(),
): Promise<MorningIntent> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO morning_intents (user_id, date, text, satisfied, created_at, updated_at)
		 VALUES (?, ?, ?, NULL, ?, ?)
		 ON CONFLICT(user_id, date) DO UPDATE SET text = excluded.text, updated_at = excluded.updated_at`,
		[userId, date, text, now, now],
	);
	return { date, text, satisfied: null, updatedAt: now };
}

export async function setMorningIntentSatisfied(
	db: DbClient,
	satisfied: boolean,
	date: string = todayLocal(),
): Promise<void> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`UPDATE morning_intents SET satisfied = ?, updated_at = ?
		  WHERE user_id = ? AND date = ?`,
		[satisfied ? 1 : 0, now, userId, date],
	);
}

// ---------- Evening Close ----------

export async function getEveningClose(db: DbClient, date: string = todayLocal()): Promise<EveningClose | null> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		"SELECT * FROM evening_closes WHERE user_id = ? AND date = ? LIMIT 1",
		[userId, date],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	const r = rows[0];
	return {
		date: String(r["date"]),
		text: String(r["text"]),
		autoDraft: r["auto_draft"] === 1,
		updatedAt: String(r["updated_at"]),
	};
}

export async function setEveningClose(
	db: DbClient,
	text: string,
	autoDraft: boolean = false,
	date: string = todayLocal(),
): Promise<EveningClose> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO evening_closes (user_id, date, text, auto_draft, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)
		 ON CONFLICT(user_id, date) DO UPDATE SET text = excluded.text, auto_draft = excluded.auto_draft, updated_at = excluded.updated_at`,
		[userId, date, text, autoDraft ? 1 : 0, now, now],
	);
	return { date, text, autoDraft, updatedAt: now };
}

// ---------- Wellness Pings ----------

export async function insertWellnessPing(db: DbClient, kind: WellnessKind): Promise<WellnessPing> {
	const id = createId();
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	await db.exec(
		`INSERT INTO wellness_pings (id, user_id, kind, at, created_at)
		 VALUES (?, ?, ?, ?, ?)`,
		[id, userId, kind, now, now],
	);
	return { id, kind, at: now };
}

export async function getWellnessCountsToday(
	db: DbClient,
	date: string = todayLocal(),
): Promise<Record<WellnessKind, number>> {
	const userId = getCurrentUserId();
	const rows = await db.query(
		`SELECT kind, COUNT(*) AS count FROM wellness_pings
		  WHERE user_id = ? AND at >= ? AND at < ?
		  GROUP BY kind`,
		[userId, `${date}T00:00:00.000Z`, `${date}T23:59:59.999Z`],
	);
	const out: Record<WellnessKind, number> = { water: 0, movement: 0, meal: 0 };
	for (const r of rows) {
		const kind = String(r["kind"]) as WellnessKind;
		if (kind === "water" || kind === "movement" || kind === "meal") {
			out[kind] = Number(r["count"] ?? 0);
		}
	}
	return out;
}

// ---------- Week Turn ----------

export async function getCurrentWeekTurn(db: DbClient): Promise<WeekTurn | null> {
	const userId = getCurrentUserId();
	const weekStart = mondayOf(new Date());
	const rows = await db.query(
		"SELECT * FROM week_turns WHERE user_id = ? AND week_start = ? LIMIT 1",
		[userId, weekStart],
	);
	if (rows.length === 0 || rows[0] === undefined) return null;
	const r = rows[0];
	return {
		weekStart: String(r["week_start"]),
		lastThree: parseJsonArray(r["last_three"]),
		nextThree: parseJsonArray(r["next_three"]),
		updatedAt: String(r["updated_at"]),
	};
}

export async function setWeekTurn(
	db: DbClient,
	lastThree: readonly string[],
	nextThree: readonly string[],
): Promise<WeekTurn> {
	const now = new Date().toISOString();
	const userId = getCurrentUserId();
	const weekStart = mondayOf(new Date());
	await db.exec(
		`INSERT INTO week_turns (user_id, week_start, last_three, next_three, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)
		 ON CONFLICT(user_id, week_start) DO UPDATE SET
		   last_three = excluded.last_three,
		   next_three = excluded.next_three,
		   updated_at = excluded.updated_at`,
		[userId, weekStart, JSON.stringify(lastThree), JSON.stringify(nextThree), now, now],
	);
	return { weekStart, lastThree, nextThree, updatedAt: now };
}
