/**
 * Consolidated store for the tracker family. One store, many slices. Each
 * slice is independent — removing one app means removing its slice + UI.
 */

import { create } from "zustand";
import { getDbClient } from "@/src/db/client";
import * as q from "@/src/db/queries/trackers";
import * as c from "@/src/commands/trackers";
import { runCommand } from "@/src/commands/types";
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
	WellnessKind,
	WeekTurn,
} from "@/src/types/trackers";

interface TrackersState {
	feels: readonly FeelCheck[];
	stucks: readonly Stuck[];
	avoiding: readonly AvoidingItem[];
	oneWord: OneWord | null;
	decisions: readonly Decision[];
	learning: readonly LearningEntry[];
	questions: readonly OpenQuestion[];
	contacts: readonly ContactTouch[];
	morningIntent: MorningIntent | null;
	eveningClose: EveningClose | null;
	wellness: Record<WellnessKind, number>;
	weekTurn: WeekTurn | null;
	loading: boolean;
}

interface TrackersActions {
	loadAll(): Promise<void>;

	logFeel(emoji: string, note?: string | null): Promise<void>;

	logStuck(text: string): Promise<void>;
	resolveStuck(id: string): Promise<void>;
	deleteStuck(id: string): Promise<void>;

	logAvoiding(text: string): Promise<void>;
	resolveAvoiding(id: string): Promise<void>;
	deleteAvoiding(id: string): Promise<void>;

	setOneWord(word: string): Promise<void>;

	logDecision(params: {
		title: string;
		choice?: string | null;
		why?: string | null;
		reversible?: boolean;
		projectId?: string | null;
	}): Promise<void>;
	setDecisionOutcome(id: string, outcome: string): Promise<void>;
	deleteDecision(id: string): Promise<void>;

	logLearning(text: string, topic?: string | null, source?: string | null): Promise<void>;
	deleteLearning(id: string): Promise<void>;

	openQuestion(text: string): Promise<void>;
	answerQuestion(id: string, answer: string): Promise<void>;
	deleteQuestion(id: string): Promise<void>;

	logContactTouch(name: string, oneWord?: string | null, channel?: string | null): Promise<void>;
	deleteContactTouch(id: string): Promise<void>;

	setMorningIntent(text: string): Promise<void>;
	setMorningIntentSatisfied(satisfied: boolean): Promise<void>;

	setEveningClose(text: string, autoDraft?: boolean): Promise<void>;

	pingWellness(kind: WellnessKind): Promise<void>;

	setWeekTurn(lastThree: readonly string[], nextThree: readonly string[]): Promise<void>;
}

type TrackersStore = TrackersState & TrackersActions;

export const useTrackersStore = create<TrackersStore>((set, get) => ({
	feels: [],
	stucks: [],
	avoiding: [],
	oneWord: null,
	decisions: [],
	learning: [],
	questions: [],
	contacts: [],
	morningIntent: null,
	eveningClose: null,
	wellness: { water: 0, movement: 0, meal: 0 },
	weekTurn: null,
	loading: false,

	async loadAll() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const [
				feels,
				stucks,
				avoiding,
				oneWord,
				decisions,
				learning,
				questions,
				contacts,
				morningIntent,
				eveningClose,
				wellness,
				weekTurn,
			] = await Promise.all([
				q.getRecentFeelChecks(db, 30),
				q.getStucks(db),
				q.getAvoidingItems(db),
				q.getOneWord(db),
				q.getDecisions(db),
				q.getLearning(db),
				q.getQuestions(db),
				q.getContactTouches(db),
				q.getMorningIntent(db),
				q.getEveningClose(db),
				q.getWellnessCountsToday(db),
				q.getCurrentWeekTurn(db),
			]);
			set({
				feels,
				stucks,
				avoiding,
				oneWord,
				decisions,
				learning,
				questions,
				contacts,
				morningIntent,
				eveningClose,
				wellness,
				weekTurn,
				loading: false,
			});
		} catch (err) {
			console.error("[trackers-store] loadAll failed:", err);
			set({ loading: false });
		}
	},

	async logFeel(emoji, note) {
		const db = getDbClient();
		await runCommand(c.logFeel, db, { emoji, note: note ?? null });
		const feels = await q.getRecentFeelChecks(db, 30);
		set({ feels });
	},

	async logStuck(text) {
		const db = getDbClient();
		await runCommand(c.logStuck, db, { text });
		const stucks = await q.getStucks(db);
		set({ stucks });
	},

	async resolveStuck(id) {
		const db = getDbClient();
		await runCommand(c.resolveStuck, db, { id });
		const stucks = await q.getStucks(db);
		set({ stucks });
	},

	async deleteStuck(id) {
		const db = getDbClient();
		await runCommand(c.deleteStuck, db, { id });
		set({ stucks: get().stucks.filter((s) => s.id !== id) });
	},

	async logAvoiding(text) {
		const db = getDbClient();
		await runCommand(c.logAvoiding, db, { text });
		const avoiding = await q.getAvoidingItems(db);
		set({ avoiding });
	},

	async resolveAvoiding(id) {
		const db = getDbClient();
		await runCommand(c.resolveAvoiding, db, { id });
		const avoiding = await q.getAvoidingItems(db);
		set({ avoiding });
	},

	async deleteAvoiding(id) {
		const db = getDbClient();
		await runCommand(c.deleteAvoiding, db, { id });
		set({ avoiding: get().avoiding.filter((a) => a.id !== id) });
	},

	async setOneWord(word) {
		const db = getDbClient();
		const result = await runCommand(c.setOneWord, db, { word });
		if (result) set({ oneWord: result });
	},

	async logDecision(params) {
		const db = getDbClient();
		await runCommand(c.logDecision, db, params);
		const decisions = await q.getDecisions(db);
		set({ decisions });
	},

	async setDecisionOutcome(id, outcome) {
		const db = getDbClient();
		await runCommand(c.setDecisionOutcome, db, { id, outcome });
		const decisions = await q.getDecisions(db);
		set({ decisions });
	},

	async deleteDecision(id) {
		const db = getDbClient();
		await runCommand(c.deleteDecision, db, { id });
		set({ decisions: get().decisions.filter((d) => d.id !== id) });
	},

	async logLearning(text, topic, source) {
		const db = getDbClient();
		await runCommand(c.logLearning, db, { text, topic: topic ?? null, source: source ?? null });
		const learning = await q.getLearning(db);
		set({ learning });
	},

	async deleteLearning(id) {
		const db = getDbClient();
		await runCommand(c.deleteLearning, db, { id });
		set({ learning: get().learning.filter((l) => l.id !== id) });
	},

	async openQuestion(text) {
		const db = getDbClient();
		await runCommand(c.openQuestion, db, { text });
		const questions = await q.getQuestions(db);
		set({ questions });
	},

	async answerQuestion(id, answer) {
		const db = getDbClient();
		await runCommand(c.answerQuestion, db, { id, answer });
		const questions = await q.getQuestions(db);
		set({ questions });
	},

	async deleteQuestion(id) {
		const db = getDbClient();
		await runCommand(c.deleteQuestion, db, { id });
		set({ questions: get().questions.filter((q_) => q_.id !== id) });
	},

	async logContactTouch(name, oneWord, channel) {
		const db = getDbClient();
		await runCommand(c.logContactTouch, db, { name, oneWord: oneWord ?? null, channel: channel ?? null });
		const contacts = await q.getContactTouches(db);
		set({ contacts });
	},

	async deleteContactTouch(id) {
		const db = getDbClient();
		await runCommand(c.deleteContactTouch, db, { id });
		set({ contacts: get().contacts.filter((c_) => c_.id !== id) });
	},

	async setMorningIntent(text) {
		const db = getDbClient();
		const result = await runCommand(c.setMorningIntent, db, { text });
		if (result) set({ morningIntent: result });
	},

	async setMorningIntentSatisfied(satisfied) {
		const db = getDbClient();
		await runCommand(c.setMorningIntentSatisfied, db, { satisfied });
		const morningIntent = await q.getMorningIntent(db);
		set({ morningIntent });
	},

	async setEveningClose(text, autoDraft) {
		const db = getDbClient();
		const result = await runCommand(c.setEveningClose, db, {
			text,
			autoDraft: autoDraft ?? false,
		});
		if (result) set({ eveningClose: result });
	},

	async pingWellness(kind) {
		const db = getDbClient();
		await runCommand(c.pingWellness, db, { kind });
		const wellness = await q.getWellnessCountsToday(db);
		set({ wellness });
	},

	async setWeekTurn(lastThree, nextThree) {
		const db = getDbClient();
		const result = await runCommand(c.setWeekTurn, db, { lastThree, nextThree });
		if (result) set({ weekTurn: result });
	},
}));
