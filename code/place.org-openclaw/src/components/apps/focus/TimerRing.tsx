'use client';

const RADIUS = 80;
const STROKE = 6;
const SIZE = (RADIUS + STROKE) * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatMsShort(ms: number): string {
	const minutes = Math.floor(ms / 60000);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	const rem = minutes % 60;
	return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

interface TimerRingProps {
	readonly elapsedMs: number;
	readonly targetMs: number;
	readonly blockType: string;
}

export function TimerRing({ elapsedMs, targetMs, blockType }: TimerRingProps) {
	const progress = Math.min(elapsedMs / targetMs, 1);
	const overrun = elapsedMs > targetMs;

	const dashOffset = CIRCUMFERENCE * (1 - progress);
	const ringColor = overrun
		? "var(--accent-warm)"
		: blockType === "work"
			? "var(--accent-blue)"
			: "var(--accent-success)";

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "0.5rem",
			}}
		>
			<div style={{ position: "relative", width: SIZE, height: SIZE }}>
				<svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)" }}>
					{/* Background track */}
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={RADIUS}
						fill="none"
						stroke="var(--border)"
						strokeWidth={STROKE}
					/>
					{/* Progress arc */}
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={RADIUS}
						fill="none"
						stroke={ringColor}
						strokeWidth={STROKE}
						strokeDasharray={CIRCUMFERENCE}
						strokeDashoffset={dashOffset}
						strokeLinecap="round"
						style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.3s" }}
					/>
				</svg>

				{/* Center text */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "0.2rem",
					}}
				>
					<span
						style={{
							color: "var(--text-secondary)",
							fontSize: "0.6rem",
							textTransform: "uppercase",
							letterSpacing: "0.08em",
						}}
					>
						{blockType.replace("_", " ")}
					</span>
					<span
						style={{
							color: overrun ? "var(--accent-warm)" : "var(--text-primary)",
							fontSize: "1.4rem",
							fontFamily: "monospace",
							fontVariantNumeric: "tabular-nums",
							fontWeight: 600,
						}}
					>
						{formatMs(elapsedMs)}
					</span>
					<span
						style={{
							color: "var(--text-secondary)",
							fontSize: "0.65rem",
							fontFamily: "monospace",
						}}
					>
						/ {formatMsShort(targetMs)}
					</span>
				</div>
			</div>

			{overrun && (
				<span
					style={{
						color: "var(--accent-warm)",
						fontSize: "0.7rem",
						fontWeight: 500,
					}}
				>
					+{formatMs(elapsedMs - targetMs)} overrun
				</span>
			)}
		</div>
	);
}
