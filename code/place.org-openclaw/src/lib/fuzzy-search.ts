// ----------------------------------------------------------------------------
// Fuzzy search
// ----------------------------------------------------------------------------

export interface FuzzyResult {
	readonly match: boolean;
	readonly score: number;
}

/**
 * Matches characters of `query` in order within `target` (not necessarily
 * contiguous). Score rewards consecutive matches and early position.
 */
export function fuzzyMatch(query: string, target: string): FuzzyResult {
	if (query.length === 0) {
		return { match: true, score: 0 };
	}

	const q = query.toLowerCase();
	const t = target.toLowerCase();

	let score = 0;
	let qi = 0;
	let consecutive = 0;

	for (let ti = 0; ti < t.length && qi < q.length; ti++) {
		if (t[ti] === q[qi]) {
			// Reward early matches and consecutive runs
			score += 1 + consecutive * 2 + (t.length - ti) * 0.01;
			consecutive++;
			qi++;
		} else {
			consecutive = 0;
		}
	}

	if (qi < q.length) {
		return { match: false, score: 0 };
	}

	return { match: true, score };
}
