'use client';

import { motion } from "motion/react";

const RADIUS = 80;
const STROKE = 7;
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

function getGradientId(blockType: string, overrun: boolean): string {
	if (overrun) return "ring-grad-overrun";
	return blockType === "work" ? "ring-grad-work" : "ring-grad-break";
}

interface TimerRingProps {
	readonly elapsedMs: number;
	readonly targetMs: number;
	readonly blockType: string;
	readonly label?: string;
	readonly isPaused?: boolean;
}

export function TimerRing({
	elapsedMs,
	targetMs,
	blockType,
	label,
	isPaused = false,
}: TimerRingProps) {
	const progress = Math.min(elapsedMs / targetMs, 1);
	const overrun = elapsedMs > targetMs;
	const dashOffset = CIRCUMFERENCE * (1 - progress);
	const gradId = getGradientId(blockType, overrun);

	const glowColor = overrun
		? "rgba(232, 168, 76, 0.12)"
		: blockType === "work"
			? "rgba(91, 156, 245, 0.12)"
			: "rgba(56, 201, 122, 0.1)";

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{
				opacity: isPaused ? 0.7 : 1,
				scale: 1,
			}}
			transition={{ duration: 0.4, ease: [0.65, 0.05, 0, 1] }}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "0.4rem",
			}}
		>
			<div style={{ position: "relative", width: SIZE, height: SIZE }}>
				{/* Glow effect behind ring */}
				<div
					style={{
						position: "absolute",
						inset: "10%",
						borderRadius: "50%",
						background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
						filter: "blur(8px)",
						transition: "background 0.5s, opacity 0.3s",
						opacity: isPaused ? 0.4 : 1,
					}}
				/>

				<svg
					width={SIZE}
					height={SIZE}
					style={{ transform: "rotate(-90deg)" }}
				>
					<defs>
						<linearGradient
							id="ring-grad-work"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="100%"
						>
							<stop offset="0%" stopColor="#5b9cf5" />
							<stop offset="50%" stopColor="#7bb8ff" />
							<stop offset="100%" stopColor="#3d7ce0" />
						</linearGradient>
						<linearGradient
							id="ring-grad-break"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="100%"
						>
							<stop offset="0%" stopColor="#38c97a" />
							<stop offset="50%" stopColor="#5fe09e" />
							<stop offset="100%" stopColor="#2ba864" />
						</linearGradient>
						<linearGradient
							id="ring-grad-overrun"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="100%"
						>
							<stop offset="0%" stopColor="#e8a84c" />
							<stop offset="50%" stopColor="#f0c06a" />
							<stop offset="100%" stopColor="#d08a30" />
						</linearGradient>
						<filter id="ring-glow">
							<feGaussianBlur stdDeviation="3" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					{/* Background track */}
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={RADIUS}
						fill="none"
						stroke="var(--place-border-default)"
						strokeWidth={STROKE - 2}
						opacity={0.5}
					/>

					{/* Progress arc */}
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={RADIUS}
						fill="none"
						stroke={`url(#${gradId})`}
						strokeWidth={STROKE}
						strokeDasharray={CIRCUMFERENCE}
						strokeDashoffset={dashOffset}
						strokeLinecap="round"
						filter="url(#ring-glow)"
						style={{
							transition: "stroke-dashoffset 0.5s linear",
							opacity: isPaused ? 0.5 : 1,
						}}
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
						gap: "0.15rem",
					}}
				>
					<span
						style={{
							color: "var(--place-text-secondary)",
							fontSize: "0.55rem",
							textTransform: "uppercase",
							letterSpacing: "0.1em",
							fontWeight: 500,
						}}
					>
						{blockType.replace("_", " ")}
					</span>
					<motion.span
						key={overrun ? "overrun" : "normal"}
						initial={{ scale: 1.05 }}
						animate={{ scale: 1 }}
						style={{
							color: overrun
								? "var(--place-tertiary-400)"
								: "var(--place-text-primary)",
							fontSize: "1.6rem",
							fontFamily: "monospace",
							fontVariantNumeric: "tabular-nums",
							fontWeight: 600,
							letterSpacing: "0.02em",
						}}
					>
						{formatMs(elapsedMs)}
					</motion.span>
					<span
						style={{
							color: "var(--place-text-secondary)",
							fontSize: "0.6rem",
							fontFamily: "monospace",
							opacity: 0.7,
						}}
					>
						/ {formatMsShort(targetMs)}
					</span>
					{label && (
						<span
							style={{
								color: "var(--place-secondary-400)",
								fontSize: "0.55rem",
								marginTop: "0.15rem",
								maxWidth: "120px",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								opacity: 0.8,
							}}
						>
							{label}
						</span>
					)}
				</div>
			</div>

			{overrun && (
				<motion.span
					initial={{ opacity: 0, y: -4 }}
					animate={{ opacity: 1, y: 0 }}
					style={{
						color: "var(--place-tertiary-400)",
						fontSize: "0.65rem",
						fontWeight: 500,
					}}
				>
					+{formatMs(elapsedMs - targetMs)} overrun
				</motion.span>
			)}
		</motion.div>
	);
}
