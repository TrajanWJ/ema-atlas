"use client";

import { motion } from "motion/react";

// ----------------------------------------------------------------------------
// Entry chooser — the "where do you want to land?" step.
//
// The boot terminal handles "what happened" (db ready, identity, etc.).
// The right side handles "what's next" — and the answer is: pick a surface.
//
// Surfaces:
//   • vDesktop — the virtual desktop with windows, dock, scope strip
//   • Holodeck — the sidebar/launchpad workspace (single-pane focus)
//   • Portfolio — the public web (browser only; hidden under Tauri)
//
// The chooser is shared between AuthPanel (web) and EmaIdentityPanel (Tauri)
// so the visual language for "land here" is the same in both runtimes.
// ----------------------------------------------------------------------------

export type EntryTarget = "vdesktop" | "holodeck" | "portfolio";

interface EntryChooserProps {
	readonly onSelect: (target: EntryTarget) => void;
	readonly showPortfolio?: boolean;
	readonly compact?: boolean;
}

export function EntryChooser({
	onSelect,
	showPortfolio = true,
	compact = false,
}: EntryChooserProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.22, ease: [0.65, 0.05, 0, 1] }}
			style={{
				display: "flex",
				flexDirection: "column",
				gap: compact ? 8 : 10,
			}}
		>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 8,
				}}
			>
				<EntryTile
					title="vDesktop"
					subtitle="windows · dock · scope"
					accent="primary"
					onClick={() => onSelect("vdesktop")}
				/>
				<EntryTile
					title="Holodeck"
					subtitle="sidebar workspace"
					accent="secondary"
					onClick={() => onSelect("holodeck")}
				/>
			</div>
			{showPortfolio && (
				<button
					type="button"
					onClick={() => onSelect("portfolio")}
					className="cursor-pointer transition-colors"
					style={{
						padding: "0.5rem 0.75rem",
						fontSize: "0.72rem",
						fontWeight: 500,
						letterSpacing: "0.02em",
						borderRadius: 8,
						border: "1px solid var(--place-border-default)",
						background: "transparent",
						color: "var(--place-text-secondary)",
						textAlign: "left",
					}}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLButtonElement).style.background =
							"rgba(255,255,255,0.04)";
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLButtonElement).style.background =
							"transparent";
					}}
				>
					→ View Portfolio
					<span
						style={{
							marginLeft: 6,
							color: "var(--place-text-muted)",
							fontSize: "0.65rem",
						}}
					>
						(public web)
					</span>
				</button>
			)}
		</motion.div>
	);
}

// ----------------------------------------------------------------------------
// Entry tile — a primary CTA that says "land me here"
// ----------------------------------------------------------------------------

function EntryTile({
	title,
	subtitle,
	accent,
	onClick,
}: {
	readonly title: string;
	readonly subtitle: string;
	readonly accent: "primary" | "secondary";
	readonly onClick: () => void;
}) {
	const accentColor =
		accent === "primary"
			? "var(--place-primary-400, #2DD4A8)"
			: "var(--place-secondary-400, #5B9CF5)";
	const accentSubtle =
		accent === "primary"
			? "var(--place-primary-subtle, rgba(13,147,115,0.10))"
			: "rgba(91,156,245,0.10)";
	const accentGlow =
		accent === "primary"
			? "var(--place-primary-glow, rgba(13,147,115,0.25))"
			: "rgba(91,156,245,0.22)";

	return (
		<button
			type="button"
			onClick={onClick}
			className="cursor-pointer transition-all"
			style={{
				padding: "0.7rem 0.8rem",
				borderRadius: 10,
				border: `1px solid ${accentColor}`,
				background: accentSubtle,
				color: accentColor,
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				gap: 2,
				textAlign: "left",
			}}
			onMouseEnter={(e) => {
				const el = e.currentTarget as HTMLButtonElement;
				el.style.background = accentGlow;
				el.style.transform = "translateY(-1px)";
			}}
			onMouseLeave={(e) => {
				const el = e.currentTarget as HTMLButtonElement;
				el.style.background = accentSubtle;
				el.style.transform = "translateY(0)";
			}}
		>
			<span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{title}</span>
			<span
				style={{
					fontSize: "0.65rem",
					letterSpacing: "0.04em",
					color: "var(--place-text-tertiary)",
					textTransform: "lowercase",
				}}
			>
				{subtitle}
			</span>
		</button>
	);
}
