'use client';

import { useDashboardStore } from "@/src/stores/dashboard-store";
import { useDesktopStore } from "@/src/stores/desktop-store";

export function OneThingWidget() {
	const oneThing = useDashboardStore((s) => s.oneThing);
	const setOneThing = useDashboardStore((s) => s.setOneThing);
	const setDesktopOneThing = useDesktopStore((s) => s.setOneThing);

	const handleChange = (value: string) => {
		setOneThing(value);
		setDesktopOneThing(value);
	};

	return (
		<div
			style={{
				padding: "1.5rem",
				borderBottom: "1px solid var(--border)",
			}}
		>
			<div
				style={{
					color: "var(--text-secondary)",
					fontSize: "0.65rem",
					textTransform: "uppercase",
					letterSpacing: "0.1em",
					marginBottom: "0.75rem",
				}}
			>
				What&apos;s the ONE thing?
			</div>
			<textarea
				aria-label="One thing"
				value={oneThing}
				onChange={(e) => handleChange(e.target.value)}
				placeholder="The single most important thing today…"
				rows={2}
				style={{
					width: "100%",
					background: "transparent",
					border: "none",
					outline: "none",
					resize: "none",
					color: "var(--text-primary)",
					fontSize: "1.1rem",
					fontWeight: 600,
					lineHeight: 1.5,
					letterSpacing: "0.01em",
				}}
			/>
		</div>
	);
}
