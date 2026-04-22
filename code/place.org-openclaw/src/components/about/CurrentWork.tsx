import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

interface Project {
	readonly name: string;
	readonly description: string;
	readonly status: "active" | "building" | "shipped";
	readonly statusLabel: string;
}

const STATUS_COLORS = {
	active: "#38c97a",
	building: "#e8a84c",
	shipped: "#5b9cf5",
} as const;

const PROJECTS: readonly Project[] = [
	{
		name: "place.org",
		description:
			"A personal operating system in the browser. Window manager, focus timer, journal, brain dump — all local-first with SQLite via WASM.",
		status: "active",
		statusLabel: "Live — you're using it",
	},
	{
		name: "ExecuDeck",
		description:
			"Dual-surface command environment. Stream Deck physical controls mapped to MCP-powered Claude Code workflows.",
		status: "building",
		statusLabel: "In progress",
	},
	{
		name: "Obsidian AI Knowledge",
		description:
			"Personal vault of 168+ notes with semantic search via QMD MCP. AI tool research, architecture decisions, session logs.",
		status: "active",
		statusLabel: "Active",
	},
];

interface StatusBadgeProps {
	readonly status: Project["status"];
	readonly label: string;
}

function StatusBadge({ status, label }: StatusBadgeProps) {
	const color = STATUS_COLORS[status];
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: "0.375rem",
				fontSize: "0.75rem",
				color,
				fontWeight: 500,
				letterSpacing: "0.05em",
			}}
		>
			<span
				aria-hidden="true"
				style={{
					display: "inline-block",
					width: "0.4375rem",
					height: "0.4375rem",
					borderRadius: "50%",
					background: color,
					boxShadow: `0 0 6px ${color}`,
				}}
			/>
			{label}
		</span>
	);
}

export function CurrentWork() {
	return (
		<section
			style={{
				padding: "clamp(4rem, 8vw, 8rem) clamp(1.5rem, 8vw, 8rem)",
			}}
		>
			<ScrollReveal direction="up">
				<h2
					style={{
						fontSize: "clamp(0.75rem, 1.2vw, 0.875rem)",
						textTransform: "uppercase",
						letterSpacing: "0.2em",
						color: "var(--accent-blue)",
						fontWeight: 500,
						marginBottom: "3rem",
					}}
				>
					What I'm building right now
				</h2>
			</ScrollReveal>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
					gap: "1.5rem",
					maxWidth: "1000px",
				}}
			>
				{PROJECTS.map((project, i) => (
					<ScrollReveal key={project.name} direction="up" delay={i * 0.1}>
						<article
							style={{
								padding: "1.75rem",
								background: "var(--bg-glass)",
								backdropFilter: "blur(var(--glass-blur))",
								WebkitBackdropFilter: "blur(var(--glass-blur))",
								border: "1px solid var(--border)",
								borderRadius: "0.75rem",
								height: "100%",
								display: "flex",
								flexDirection: "column",
								gap: "0.75rem",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "flex-start",
									gap: "1rem",
								}}
							>
								<h3
									style={{
										margin: 0,
										fontSize: "1.125rem",
										fontWeight: 600,
										color: "var(--text-primary)",
									}}
								>
									{project.name}
								</h3>
								<StatusBadge status={project.status} label={project.statusLabel} />
							</div>
							<p
								style={{
									margin: 0,
									fontSize: "0.9375rem",
									color: "var(--text-secondary)",
									lineHeight: 1.65,
									flexGrow: 1,
								}}
							>
								{project.description}
							</p>
						</article>
					</ScrollReveal>
				))}
			</div>

			<ScrollReveal direction="up" delay={0.3}>
				<div style={{ marginTop: "2.5rem" }}>
					<Link
						href="/portfolio"
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: "0.5rem",
							padding: "0.75rem 1.5rem",
							background: "var(--bg-glass)",
							backdropFilter: "blur(var(--glass-blur))",
							WebkitBackdropFilter: "blur(var(--glass-blur))",
							border: "1px solid var(--border-hover)",
							borderRadius: "0.5rem",
							color: "var(--accent-blue)",
							fontSize: "0.9375rem",
							fontWeight: 500,
							textDecoration: "none",
						}}
					>
						See all projects
						<span aria-hidden="true">→</span>
					</Link>
				</div>
			</ScrollReveal>
		</section>
	);
}
