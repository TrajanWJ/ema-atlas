// Pure pattern detectors for the auto-grow Blueprint agent.
//
// Each detector returns an array of {pattern, line, match} for every match
// found in the input text. No I/O, no state — call from main.ts on each
// observed prose event.

export interface Detection {
	readonly pattern: string;
	readonly line: string;
	readonly match: string;
}

const ASPIRATION_RE =
	/^(?:.*?)(eventually ema should|it would be amazing if|long-term i want|the dream is)(.+)$/gim;
const DECISION_RE = /^(?:DECIDED:|Decision:|## Decision\b)\s*(.*)$/gm;
const GAC_RE = /^(?:GAP:|GAC:|Question:)\s*(.+\?)\s*$/gm;
const BLOCKER_RE = /^(?:BLOCKED:|Blocker:)\s*(.+)$/gm;

function collect(text: string, re: RegExp, label: string): Detection[] {
	const out: Detection[] = [];
	for (const m of text.matchAll(re)) {
		const line = m[0]?.trim() ?? "";
		const match = (m[1] ?? m[2] ?? line).trim();
		if (line.length > 0) {
			out.push({ pattern: label, line, match });
		}
	}
	return out;
}

export function detectAspirations(text: string): Detection[] {
	return collect(text, ASPIRATION_RE, "aspiration");
}

export function detectDecisions(text: string): Detection[] {
	return collect(text, DECISION_RE, "decision");
}

export function detectGacs(text: string): Detection[] {
	return collect(text, GAC_RE, "gac");
}

export function detectBlockers(text: string): Detection[] {
	return collect(text, BLOCKER_RE, "blocker");
}

export function detectAll(text: string): Detection[] {
	return [
		...detectAspirations(text),
		...detectDecisions(text),
		...detectGacs(text),
		...detectBlockers(text),
	];
}
