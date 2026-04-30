'use client';

import { useEffect, useState } from "react";
import { runSuggesters } from "@/src/suggesters/registry";
import type { Suggestion } from "@/src/suggesters/registry";
import { getDbClient } from "@/src/db/client";

interface SuggestionSlotProps {
	readonly for: string;
	readonly className?: string;
}

/**
 * Renders AI-later / rule-based suggestions inline. Returns nothing when no
 * suggesters are registered or none returned a suggestion. Safe to sprinkle
 * anywhere.
 */
export function SuggestionSlot({ for: slot, className }: SuggestionSlotProps) {
	const [suggestions, setSuggestions] = useState<readonly Suggestion[]>([]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const db = getDbClient();
				const results = await runSuggesters(db, slot);
				if (!cancelled) setSuggestions(results);
			} catch {
				// silent
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [slot]);

	if (suggestions.length === 0) return null;

	return (
		<div className={className}>
			{suggestions.map((s, idx) => (
				<div
					key={idx}
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "6px 10px",
						background:
							s.tone === "warning"
								? "rgba(255, 100, 100, 0.08)"
								: s.tone === "nudge"
									? "rgba(255, 207, 115, 0.08)"
									: "rgba(138, 180, 255, 0.06)",
						border:
							s.tone === "warning"
								? "1px solid rgba(255, 100, 100, 0.2)"
								: s.tone === "nudge"
									? "1px solid rgba(255, 207, 115, 0.2)"
									: "1px solid rgba(138, 180, 255, 0.15)",
						borderRadius: "6px",
						fontSize: "0.75rem",
						color: "var(--place-text-secondary, rgba(255, 255, 255, 0.7))",
					}}
				>
					<span style={{ flex: 1 }}>{s.text}</span>
					{s.action && (
						<button
							type="button"
							onClick={() => void s.action!.handler()}
							style={{
								background: "transparent",
								border: "1px solid rgba(255, 255, 255, 0.12)",
								borderRadius: "4px",
								color: "inherit",
								fontSize: "0.7rem",
								padding: "2px 8px",
								cursor: "pointer",
							}}
						>
							{s.action.label}
						</button>
					)}
				</div>
			))}
		</div>
	);
}
