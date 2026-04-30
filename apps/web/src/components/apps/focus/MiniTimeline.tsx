'use client';

import { motion } from "motion/react";
import { useFocusStore } from "@/src/stores/focus-store";

function formatMs(ms: number): string {
	const minutes = Math.floor(ms / 60000);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	const rem = minutes % 60;
	return rem > 0 ? `${hours}h${rem}m` : `${hours}h`;
}

export function MiniTimeline() {
	const todayBlocks = useFocusStore((s) => s.todayBlocks);
	const workBlocks = todayBlocks.filter((b) => b.type === "work" && b.actualMs !== null);

	if (workBlocks.length === 0) return null;

	const maxMs = Math.max(...workBlocks.map((b) => b.actualMs ?? 0), 1);

	return (
		<div style={{ width: "100%", maxWidth: "300px" }}>
			<div
				style={{
					fontSize: "0.55rem",
					color: "var(--place-text-secondary)",
					textTransform: "uppercase",
					letterSpacing: "0.08em",
					marginBottom: "0.35rem",
					fontWeight: 500,
				}}
			>
				Today's blocks
			</div>
			<div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "24px" }}>
				{workBlocks.map((block, i) => {
					const height = Math.max(((block.actualMs ?? 0) / maxMs) * 100, 15);
					return (
						<motion.div
							key={block.id}
							initial={{ scaleY: 0 }}
							animate={{ scaleY: 1 }}
							transition={{ delay: i * 0.05, duration: 0.3 }}
							title={`${block.label ?? "Focus"}: ${formatMs(block.actualMs ?? 0)}`}
							style={{
								flex: 1,
								maxWidth: "16px",
								height: `${height}%`,
								background: "var(--place-secondary-400)",
								borderRadius: "2px 2px 0 0",
								opacity: 0.7,
								transformOrigin: "bottom",
							}}
						/>
					);
				})}
			</div>
		</div>
	);
}
