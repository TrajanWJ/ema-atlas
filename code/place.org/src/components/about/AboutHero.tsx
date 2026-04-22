import type { CSSProperties } from "react";

const gradientKeyframes = `
@keyframes gradient-shift {
	0%, 100% { background-position: 0% 50%; }
	50% { background-position: 100% 50%; }
}
`;

const nameStyle: CSSProperties = {
	fontSize: "clamp(4rem, 14vw, 11rem)",
	fontWeight: 900,
	lineHeight: 1,
	letterSpacing: "-0.03em",
	backgroundImage:
		"linear-gradient(135deg, #5b9cf5 0%, #a78bfa 35%, #38c97a 65%, #5b9cf5 100%)",
	backgroundSize: "300% 300%",
	WebkitBackgroundClip: "text",
	WebkitTextFillColor: "transparent",
	backgroundClip: "text",
	animation: "gradient-shift 8s ease infinite",
};

const subtitleStyle: CSSProperties = {
	fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
	color: "var(--place-text-secondary)",
	letterSpacing: "0.15em",
	textTransform: "uppercase",
	fontWeight: 400,
	marginTop: "1rem",
};

const focusStyle: CSSProperties = {
	fontSize: "clamp(0.875rem, 1.5vw, 1.125rem)",
	color: "var(--place-text-secondary)",
	maxWidth: "520px",
	lineHeight: 1.7,
	marginTop: "2.5rem",
	padding: "1.25rem 1.5rem",
	background: "var(--place-surface-1)",
	backdropFilter: "blur(var(--glass-blur))",
	WebkitBackdropFilter: "blur(var(--glass-blur))",
	border: "1px solid var(--place-border-default)",
	borderRadius: "0.75rem",
};

const accentDot: CSSProperties = {
	display: "inline-block",
	width: "0.5rem",
	height: "0.5rem",
	borderRadius: "50%",
	background: "var(--place-success)",
	marginRight: "0.625rem",
	verticalAlign: "middle",
	boxShadow: "0 0 8px var(--place-success)",
};

export function AboutHero() {
	return (
		<>
			<style>{gradientKeyframes}</style>
			<section
				style={{
					minHeight: "100dvh",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					padding: "clamp(2rem, 6vw, 6rem) clamp(1.5rem, 8vw, 8rem)",
					position: "relative",
				}}
			>
				{/* Subtle background radial glow */}
				<div
					aria-hidden="true"
					style={{
						position: "absolute",
						top: "30%",
						left: "10%",
						width: "50vw",
						height: "50vw",
						maxWidth: "700px",
						maxHeight: "700px",
						borderRadius: "50%",
						background:
							"radial-gradient(circle, rgba(91,156,245,0.07) 0%, transparent 70%)",
						pointerEvents: "none",
					}}
				/>
				<div style={{ position: "relative", zIndex: 1 }}>
					<h1 style={nameStyle}>Trajan</h1>
					<p style={subtitleStyle}>Builder.&nbsp; System thinker.&nbsp; Executor.</p>
					<div style={focusStyle}>
						<p style={{ margin: 0, color: "var(--place-text-secondary)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.625rem" }}>
							Current focus
						</p>
						<p style={{ margin: 0, color: "var(--place-text-primary)" }}>
							<span style={accentDot} />
							Building place.org — a personal operating system that runs in the
							browser. AI-augmented workflows, local-first data, self-hosted
							everything.
						</p>
					</div>
				</div>
			</section>
		</>
	);
}
