import { create } from "zustand";
import { createReview, saveReview } from "@/src/db/queries/reviews";
import { getDbClient } from "@/src/db/client";
import type { Review, ReviewType, ReviewPhase } from "@/src/types/review";

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface ReviewState {
	readonly currentReview: Review | null;
	readonly phase: ReviewPhase;
	readonly loading: boolean;
}

interface ReviewActions {
	startReview(type: ReviewType): Promise<void>;
	setPhase(phase: ReviewPhase): void;
	updateField(field: keyof Pick<Review, "wins" | "challenges" | "lessons" | "nextOneThing" | "content">, value: string): void;
	saveReview(): Promise<void>;
}

type ReviewStore = ReviewState & ReviewActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useReviewStore = create<ReviewStore>((set, get) => ({
	currentReview: null,
	phase: "collect",
	loading: false,

	async startReview(type) {
		set({ loading: true });
		try {
			const db = getDbClient();
			const today = new Date().toISOString().slice(0, 10);
			const review = await createReview(db, type, today);
			set({ currentReview: review, phase: "collect" });
		} finally {
			set({ loading: false });
		}
	},

	setPhase(phase) {
		set({ phase });
	},

	updateField(field, value) {
		const { currentReview } = get();
		if (!currentReview) return;
		set({ currentReview: { ...currentReview, [field]: value } });
	},

	async saveReview() {
		const { currentReview } = get();
		if (!currentReview) return;
		set({ loading: true });
		try {
			const db = getDbClient();
			const saved = await saveReview(db, currentReview);
			set({ currentReview: saved });
		} finally {
			set({ loading: false });
		}
	},
}));
