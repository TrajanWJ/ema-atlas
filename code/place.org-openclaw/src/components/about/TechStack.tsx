import { ScrollReveal } from "./ScrollReveal";

interface TechCategory {
	readonly label: string;
	readonly accentColor: string;
	readonly items: readonly string[];
}

const CATEGORIES: readonly TechCategory[] = [
	{
		label: "Frontend",
		accentColor: "#5b9cf5",
		items: ["Next.js", "React", "TypeScript", "Tailwind", "Zustand", "Motion"],
	},
	{
		label: "Backend",
		accentColor: "#38c97a",
		items: ["Node.js", "Express", "FastAPI", "Prisma", "PostgreSQL"],
	},
	{
		label: "AI / ML",
		accentColor: "#a78bfa",
		items: ["Claude", "Pinecone", "Obsidian + MCP", "Agent orchestration"],
	},
	{
		label: "Infrastructure",
		accentColor: "#e8a84c",
		items: ["Docker", "KVM / QEMU", "Debian", "Self-hosted"],
	},
	{
		label: "Tools",
		accentColor: "#ef6b6b",
		items: ["Claude Code", "Obsidian", "Biome", "Vitest", "pnpm"],
	},
];

interface PillProps {
	readonly text: string;
	readonly accentColor: string;
}

function Pill({ text, accentColor }: PillProps) {
	return (
		<span
			style={{
				display: "inline-block",
				padding: "0.375rem 0.875rem",
				background: `${accentColor}12`,
				border: `1px solid ${accentColor}30`,
				borderRadius: "2rem",
				fontSize: "0.875rem",
				color: "var(--text-primary)",
				backdropFilter: "blur(8px)",
				WebkitBackdropFilter: "blur(8px)",
				lineHeight: 1.4,
			}}
		>
			{text}
		</span>
	);
}

export function TechStack() {
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
					Tech stack
				</h2>
			</ScrollReveal>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
					gap: "1.5rem",
					maxWidth: "1000px",
				}}
			>
				{CATEGORIES.map((category, i) => (
					<ScrollReveal key={category.label} direction="up" delay={i * 0.07}>
						<div
							style={{
								padding: "1.5rem",
								background: "var(--bg-glass)",
								backdropFilter: "blur(var(--glass-blur))",
								WebkitBackdropFilter: "blur(var(--glass-blur))",
								border: "1px solid var(--border)",
								borderRadius: "0.75rem",
								height: "100%",
							}}
						>
							<p
								style={{
									margin: "0 0 1rem",
									fontSize: "0.75rem",
									textTransform: "uppercase",
									letterSpacing: "0.15em",
									color: category.accentColor,
									fontWeight: 600,
								}}
							>
								{category.label}
							</p>
							<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
								{category.items.map((item) => (
									<Pill key={item} text={item} accentColor={category.accentColor} />
								))}
							</div>
						</div>
					</ScrollReveal>
				))}
			</div>
		</section>
	);
}
