'use client';

import { AnimatePresence, motion } from "motion/react";
import { useIdleDetection } from "@/src/hooks/use-idle-detection";

const BLOBS = [
	{
		color: "var(--place-secondary-400)",
		size: 380,
		animationName: "aurora-drift-1",
		duration: "45s",
		top: "20%",
		left: "15%",
	},
	{
		color: "var(--place-success)",
		size: 300,
		animationName: "aurora-drift-2",
		duration: "55s",
		top: "55%",
		left: "65%",
	},
	{
		color: "var(--place-tertiary-400)",
		size: 250,
		animationName: "aurora-drift-3",
		duration: "70s",
		top: "70%",
		left: "25%",
	},
	{
		color: "var(--place-error)",
		size: 200,
		animationName: "aurora-drift-4",
		duration: "60s",
		top: "30%",
		left: "75%",
	},
] as const;

export function Screensaver() {
	const { isIdle } = useIdleDetection();

	return (
		<>
			<style>{`
				@keyframes aurora-drift-1 {
					0%   { transform: translate(0, 0) scale(1); }
					33%  { transform: translate(30vw, -20vh) scale(1.2); }
					66%  { transform: translate(-20vw, 30vh) scale(0.8); }
					100% { transform: translate(0, 0) scale(1); }
				}
				@keyframes aurora-drift-2 {
					0%   { transform: translate(0, 0) scale(1); }
					33%  { transform: translate(-25vw, 15vh) scale(0.9); }
					66%  { transform: translate(20vw, -25vh) scale(1.3); }
					100% { transform: translate(0, 0) scale(1); }
				}
				@keyframes aurora-drift-3 {
					0%   { transform: translate(0, 0) scale(1); }
					33%  { transform: translate(15vw, -30vh) scale(1.1); }
					66%  { transform: translate(-30vw, 10vh) scale(0.85); }
					100% { transform: translate(0, 0) scale(1); }
				}
				@keyframes aurora-drift-4 {
					0%   { transform: translate(0, 0) scale(1); }
					33%  { transform: translate(-10vw, 25vh) scale(1.15); }
					66%  { transform: translate(25vw, -15vh) scale(0.9); }
					100% { transform: translate(0, 0) scale(1); }
				}
				.screensaver-blob {
					position: absolute;
					border-radius: 50%;
					filter: blur(80px) hue-rotate(0deg);
					animation-timing-function: ease-in-out;
					animation-iteration-count: infinite;
					animation-direction: alternate;
				}
			`}</style>
			<AnimatePresence>
				{isIdle && (
					<motion.div
						key="screensaver"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 2, ease: "easeInOut" }}
						style={{
							position: "fixed",
							inset: 0,
							zIndex: 9999,
							overflow: "hidden",
							background: "rgba(6, 6, 16, 0.85)",
							pointerEvents: "all",
						}}
					>
						{BLOBS.map((blob) => (
							<div
								key={blob.animationName}
								className="screensaver-blob"
								style={{
									width: blob.size,
									height: blob.size,
									backgroundColor: blob.color,
									opacity: 0.05,
									top: blob.top,
									left: blob.left,
									animationName: blob.animationName,
									animationDuration: blob.duration,
								}}
							/>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
