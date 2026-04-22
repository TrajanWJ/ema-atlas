import { ScrollReveal } from "./ScrollReveal";

interface Value {
	readonly text: string;
	readonly description: string;
}

const VALUES: readonly Value[] = [
	{
		text: "Execution over aspiration",
		description: "Ideas without shipped code are just conversation. The proof is in production.",
	},
	{
		text: "The site IS the pitch",
		description: "Every piece of public work is a live demo of how you think and build.",
	},
	{
		text: "Progress over perfection",
		description: "A working v0.1 beats a perfect v1 that never ships. Iterate in the open.",
	},
	{
		text: "Systems thinking",
		description: "Understand the leverage points. Build the thing that builds the things.",
	},
	{
		text: "Local-first, self-hosted",
		description:
			"Your data, your infrastructure, your rules. No subscriptions, no lock-in, no single points of failure.",
	},
];

export function ValuesList() {
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
					Philosophy
				</h2>
			</ScrollReveal>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "1.5rem",
					maxWidth: "800px",
				}}
			>
				{VALUES.map((value, i) => (
					<ScrollReveal key={value.text} direction="left" delay={i * 0.08}>
						<blockquote
							style={{
								margin: 0,
								padding: "1.5rem 1.75rem",
								borderLeft: "3px solid var(--accent-blue)",
								background: "var(--bg-glass)",
								backdropFilter: "blur(var(--glass-blur))",
								WebkitBackdropFilter: "blur(var(--glass-blur))",
								border: "1px solid var(--border)",
								borderLeftWidth: "3px",
								borderLeftColor: "var(--accent-blue)",
								borderRadius: "0 0.75rem 0.75rem 0",
							}}
						>
							<p
								style={{
									margin: 0,
									fontSize: "clamp(1.125rem, 2.5vw, 1.5rem)",
									fontWeight: 600,
									color: "var(--text-primary)",
									lineHeight: 1.3,
								}}
							>
								{value.text}
							</p>
							<p
								style={{
									margin: "0.5rem 0 0",
									fontSize: "0.9375rem",
									color: "var(--text-secondary)",
									lineHeight: 1.6,
								}}
							>
								{value.description}
							</p>
						</blockquote>
					</ScrollReveal>
				))}
			</div>
		</section>
	);
}
