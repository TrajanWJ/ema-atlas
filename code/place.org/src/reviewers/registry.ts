/**
 * Review registry.
 *
 * Reviewers run at cadence boundaries (daily, weekly, monthly) and return
 * text-shaped output. Today: rule-based (the Ledger, drift checks). Later:
 * AI-backed reviewers get registered here.
 */

import type { DbClient } from "@/src/db/client";

export type ReviewCadence = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface ReviewOutput {
	readonly title: string;
	readonly body: string;
	readonly metadata?: Record<string, unknown>;
}

export type Reviewer = (
	db: DbClient,
	cadence: ReviewCadence,
	date: string,
) => Promise<ReviewOutput | null>;

const registry = new Map<ReviewCadence, Reviewer[]>();

export function registerReviewer(cadence: ReviewCadence, reviewer: Reviewer): void {
	const list = registry.get(cadence) ?? [];
	list.push(reviewer);
	registry.set(cadence, list);
}

export async function runReviewers(
	db: DbClient,
	cadence: ReviewCadence,
	date: string,
): Promise<readonly ReviewOutput[]> {
	const list = registry.get(cadence) ?? [];
	const results = await Promise.all(
		list.map((r) =>
			r(db, cadence, date).catch((e) => {
				console.error(`[reviewers] ${cadence} failed:`, e);
				return null;
			}),
		),
	);
	return results.filter((r): r is ReviewOutput => r !== null);
}
