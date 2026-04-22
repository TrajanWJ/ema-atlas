import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Review } from "../../src/types/review";

// ----------------------------------------------------------------------------
// Mock DB queries and client
// ----------------------------------------------------------------------------

const mockCreateReview = vi.fn();
const mockSaveReview = vi.fn();

vi.mock("../../src/db/queries/reviews", () => ({
	createReview: (...args: unknown[]) => mockCreateReview(...args),
	saveReview: (...args: unknown[]) => mockSaveReview(...args),
}));

vi.mock("../../src/db/client", () => ({
	getDbClient: () => ({}),
}));

const { useReviewStore } = await import("../../src/stores/review-store");

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeReview(overrides?: Partial<Review>): Review {
	return {
		id: "review-1",
		type: "weekly",
		date: "2026-03-20",
		wins: null,
		challenges: null,
		lessons: null,
		nextOneThing: null,
		content: null,
		createdAt: "2026-03-20T12:00:00.000Z",
		updatedAt: "2026-03-20T12:00:00.000Z",
		...overrides,
	};
}

beforeEach(() => {
	useReviewStore.setState({ currentReview: null, phase: "collect", loading: false });
	vi.clearAllMocks();
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("startReview", () => {
	it("creates a review and sets phase to collect", async () => {
		const review = makeReview({ type: "weekly" });
		mockCreateReview.mockResolvedValueOnce(review);

		await useReviewStore.getState().startReview("weekly");

		expect(useReviewStore.getState().currentReview).toEqual(review);
		expect(useReviewStore.getState().phase).toBe("collect");
	});

	it("calls createReview with the correct type", async () => {
		mockCreateReview.mockResolvedValueOnce(makeReview({ type: "monthly" }));

		await useReviewStore.getState().startReview("monthly");

		const [, type] = mockCreateReview.mock.calls[0] as unknown as [unknown, string];
		expect(type).toBe("monthly");
	});
});

describe("setPhase", () => {
	it("transitions from collect to reflect", () => {
		useReviewStore.setState({ phase: "collect" });
		useReviewStore.getState().setPhase("reflect");
		expect(useReviewStore.getState().phase).toBe("reflect");
	});

	it("transitions from reflect to plan", () => {
		useReviewStore.setState({ phase: "reflect" });
		useReviewStore.getState().setPhase("plan");
		expect(useReviewStore.getState().phase).toBe("plan");
	});

	it("allows going back from reflect to collect", () => {
		useReviewStore.setState({ phase: "reflect" });
		useReviewStore.getState().setPhase("collect");
		expect(useReviewStore.getState().phase).toBe("collect");
	});

	it("allows all three phase values", () => {
		for (const phase of ["collect", "reflect", "plan"] as const) {
			useReviewStore.getState().setPhase(phase);
			expect(useReviewStore.getState().phase).toBe(phase);
		}
	});
});

describe("updateField", () => {
	it("updates wins on currentReview", () => {
		useReviewStore.setState({ currentReview: makeReview() });

		useReviewStore.getState().updateField("wins", "shipped v0.3");

		expect(useReviewStore.getState().currentReview?.wins).toBe("shipped v0.3");
	});

	it("updates challenges", () => {
		useReviewStore.setState({ currentReview: makeReview() });

		useReviewStore.getState().updateField("challenges", "scope creep");

		expect(useReviewStore.getState().currentReview?.challenges).toBe("scope creep");
	});

	it("does nothing when currentReview is null", () => {
		useReviewStore.setState({ currentReview: null });

		// Should not throw
		expect(() => useReviewStore.getState().updateField("wins", "test")).not.toThrow();
		expect(useReviewStore.getState().currentReview).toBeNull();
	});

	it("updates nextOneThing", () => {
		useReviewStore.setState({ currentReview: makeReview() });

		useReviewStore.getState().updateField("nextOneThing", "Ship review app");

		expect(useReviewStore.getState().currentReview?.nextOneThing).toBe("Ship review app");
	});
});

describe("saveReview", () => {
	it("persists the current review", async () => {
		const review = makeReview({ wins: "great week" });
		const saved = { ...review, updatedAt: "2026-03-21T00:00:00.000Z" };
		useReviewStore.setState({ currentReview: review });
		mockSaveReview.mockResolvedValueOnce(saved);

		await useReviewStore.getState().saveReview();

		expect(useReviewStore.getState().currentReview).toEqual(saved);
	});

	it("does nothing when currentReview is null", async () => {
		useReviewStore.setState({ currentReview: null });

		await useReviewStore.getState().saveReview();

		expect(mockSaveReview).not.toHaveBeenCalled();
	});
});
