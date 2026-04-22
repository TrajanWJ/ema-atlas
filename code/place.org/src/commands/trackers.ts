/**
 * Commands for the tracker family. Each command validates input, writes via
 * a query function, emits a typed event, and returns a CommandResult.
 */

import type { DbClient } from "@/src/db/client";
import * as q from "@/src/db/queries/trackers";
import { emitPlaceEvent } from "@/src/lib/place-events";
import { ok, err } from "./types";
import type { Command } from "./types";
import type {
	FeelCheck,
	Stuck,
	AvoidingItem,
	OneWord,
	Decision,
	LearningEntry,
	OpenQuestion,
	ContactTouch,
	MorningIntent,
	EveningClose,
	WellnessPing,
	WellnessKind,
	WeekTurn,
} from "@/src/types/trackers";

// ---------- Feel ----------

export const logFeel: Command<{ emoji: string; note?: string | null }, FeelCheck> = async (db, params) => {
	if (!params.emoji.trim()) return err("feel emoji is empty");
	const out = await q.insertFeelCheck(db, params.emoji, params.note ?? null);
	emitPlaceEvent({ kind: "feel.checked", emoji: out.emoji, note: out.note });
	return ok(out);
};

// ---------- Stuck ----------

export const logStuck: Command<{ text: string }, Stuck> = async (db, params) => {
	const text = params.text.trim();
	if (!text) return err("stuck text is empty");
	const out = await q.insertStuck(db, text);
	emitPlaceEvent({ kind: "stuck.logged", stuckId: out.id, text });
	return ok(out);
};

export const resolveStuck: Command<{ id: string }, null> = async (db, params) => {
	await q.resolveStuck(db, params.id);
	emitPlaceEvent({ kind: "stuck.resolved", stuckId: params.id });
	return ok(null);
};

export const deleteStuck: Command<{ id: string }, null> = async (db, params) => {
	await q.deleteStuck(db, params.id);
	return ok(null);
};

// ---------- Avoiding ----------

export const logAvoiding: Command<{ text: string }, AvoidingItem> = async (db, params) => {
	const text = params.text.trim();
	if (!text) return err("avoiding text is empty");
	const out = await q.insertAvoiding(db, text);
	emitPlaceEvent({ kind: "avoiding.logged", id: out.id, text });
	return ok(out);
};

export const resolveAvoiding: Command<{ id: string }, null> = async (db, params) => {
	await q.resolveAvoiding(db, params.id);
	emitPlaceEvent({ kind: "avoiding.resolved", id: params.id });
	return ok(null);
};

export const deleteAvoiding: Command<{ id: string }, null> = async (db, params) => {
	await q.deleteAvoiding(db, params.id);
	return ok(null);
};

// ---------- One Word ----------

export const setOneWord: Command<{ word: string }, OneWord> = async (db, params) => {
	const word = params.word.trim();
	if (!word) return err("one_word is empty");
	const out = await q.setOneWord(db, word);
	emitPlaceEvent({ kind: "one_word.set", date: out.date, word });
	return ok(out);
};

// ---------- Decisions ----------

export interface LogDecisionParams {
	readonly title: string;
	readonly choice?: string | null;
	readonly why?: string | null;
	readonly reversible?: boolean;
	readonly projectId?: string | null;
}

export const logDecision: Command<LogDecisionParams, Decision> = async (db, params) => {
	const title = params.title.trim();
	if (!title) return err("decision title is empty");
	const out = await q.insertDecision(
		db,
		title,
		params.choice?.trim() || null,
		params.why?.trim() || null,
		params.reversible ?? true,
		params.projectId ?? null,
	);
	emitPlaceEvent({ kind: "decision.logged", id: out.id, title });
	return ok(out);
};

export const setDecisionOutcome: Command<{ id: string; outcome: string }, null> = async (db, params) => {
	await q.setDecisionOutcome(db, params.id, params.outcome);
	emitPlaceEvent({ kind: "decision.outcome", id: params.id, outcome: params.outcome });
	return ok(null);
};

export const deleteDecision: Command<{ id: string }, null> = async (db, params) => {
	await q.deleteDecision(db, params.id);
	return ok(null);
};

// ---------- Learning ----------

export const logLearning: Command<{ text: string; topic?: string | null; source?: string | null }, LearningEntry> = async (db, params) => {
	const text = params.text.trim();
	if (!text) return err("learning text is empty");
	const out = await q.insertLearning(db, text, params.topic ?? null, params.source ?? null);
	emitPlaceEvent({ kind: "learning.logged", id: out.id, topic: out.topic });
	return ok(out);
};

export const deleteLearning: Command<{ id: string }, null> = async (db, params) => {
	await q.deleteLearning(db, params.id);
	return ok(null);
};

// ---------- Open Questions ----------

export const openQuestion: Command<{ text: string }, OpenQuestion> = async (db, params) => {
	const text = params.text.trim();
	if (!text) return err("question text is empty");
	const out = await q.insertQuestion(db, text);
	emitPlaceEvent({ kind: "question.opened", id: out.id, text });
	return ok(out);
};

export const answerQuestion: Command<{ id: string; answer: string }, null> = async (db, params) => {
	const answer = params.answer.trim();
	if (!answer) return err("answer is empty");
	await q.answerQuestion(db, params.id, answer);
	emitPlaceEvent({ kind: "question.answered", id: params.id });
	return ok(null);
};

export const deleteQuestion: Command<{ id: string }, null> = async (db, params) => {
	await q.deleteQuestion(db, params.id);
	return ok(null);
};

// ---------- Contacts ----------

export const logContactTouch: Command<{ name: string; oneWord?: string | null; channel?: string | null }, ContactTouch> = async (db, params) => {
	const name = params.name.trim();
	if (!name) return err("contact name is empty");
	const out = await q.insertContactTouch(db, name, params.oneWord ?? null, params.channel ?? null);
	emitPlaceEvent({ kind: "contact.touched", id: out.id, name });
	return ok(out);
};

export const deleteContactTouch: Command<{ id: string }, null> = async (db, params) => {
	await q.deleteContactTouch(db, params.id);
	return ok(null);
};

// ---------- Morning Intent ----------

export const setMorningIntent: Command<{ text: string }, MorningIntent> = async (db, params) => {
	const text = params.text.trim();
	if (!text) return err("morning intent is empty");
	const out = await q.setMorningIntent(db, text);
	emitPlaceEvent({ kind: "morning_intent.set", date: out.date, text });
	return ok(out);
};

export const setMorningIntentSatisfied: Command<{ satisfied: boolean }, null> = async (db, params) => {
	await q.setMorningIntentSatisfied(db, params.satisfied);
	return ok(null);
};

// ---------- Evening Close ----------

export const setEveningClose: Command<{ text: string; autoDraft?: boolean }, EveningClose> = async (db, params) => {
	const text = params.text.trim();
	if (!text) return err("evening close is empty");
	const out = await q.setEveningClose(db, text, params.autoDraft ?? false);
	emitPlaceEvent({ kind: "evening_close.set", date: out.date, text });
	return ok(out);
};

// ---------- Wellness ----------

export const pingWellness: Command<{ kind: WellnessKind }, WellnessPing> = async (db, params) => {
	const out = await q.insertWellnessPing(db, params.kind);
	emitPlaceEvent({ kind: "wellness.pinged", kind_: params.kind });
	return ok(out);
};

// ---------- Week Turn ----------

export const setWeekTurn: Command<{ lastThree: readonly string[]; nextThree: readonly string[] }, WeekTurn> = async (db, params) => {
	const out = await q.setWeekTurn(db, params.lastThree, params.nextThree);
	emitPlaceEvent({ kind: "week_turn.set", weekStart: out.weekStart });
	return ok(out);
};
