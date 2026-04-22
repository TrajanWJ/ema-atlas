'use client';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getDbClient } from "@/src/db/client";
import { getBootLines, type BootLine } from "@/src/lib/boot-messages";
import { getUnprocessedCount } from "@/src/db/queries/inbox";
import { getSetting } from "@/src/db/queries/settings";
import { useTypewriter } from "@/src/hooks/use-typewriter";

interface BootSequenceProps {
	readonly onComplete: () => void;
}

const DB_VERSION = 1;

export function BootSequence({ onComplete }: BootSequenceProps) {
	const [allLines, setAllLines] = useState<readonly BootLine[]>([]);
	const [completedLines, setCompletedLines] = useState<readonly BootLine[]>([]);
	const [currentLineIndex, setCurrentLineIndex] = useState(0);
	const [dbReady, setDbReady] = useState(false);
	const [ready, setReady] = useState(false);

	const currentLine = allLines[currentLineIndex];
	const { displayedText, isComplete, cursorVisible } = useTypewriter(
		currentLine?.text || "",
		{ speed: 30 }
	);

	useEffect(() => {
		let cancelled = false;

		// Init DB and fetch entry count
		setTimeout(async () => {
			if (cancelled) return;
			try {
				const db = getDbClient();
				await db.init();
				if (cancelled) return;

				// Load and apply accent color
				const accentColor = await getSetting(db, 'accent-color');
				if (accentColor && !cancelled) {
					document.documentElement.style.setProperty('--accent-blue', accentColor);
				}
				if (cancelled) return;

				// Fetch unprocessed entry count
				const entryCount = await getUnprocessedCount(db);
				if (cancelled) return;

				const hour = new Date().getHours();
				const bootLines = getBootLines(hour, DB_VERSION, entryCount);

				if (!cancelled) {
					setAllLines(bootLines);
				}
			} catch {
				if (cancelled) return;

				const hour = new Date().getHours();
				const bootLines = getBootLines(hour, DB_VERSION);

				if (!cancelled) {
					setAllLines(bootLines);
				}
			}
		}, 0);

		return () => {
			cancelled = true;
		};
	}, []);

	// Progress to next line when current line is complete
	useEffect(() => {
		if (!isComplete || !currentLine) return;

		const timer = setTimeout(() => {
			if (currentLineIndex < allLines.length - 1) {
				setCompletedLines((prev) => [...prev, currentLine]);
				setCurrentLineIndex((prev) => prev + 1);
			} else {
				// All lines complete
				setCompletedLines((prev) => [...prev, currentLine]);
				setDbReady(true);
				setReady(true);
			}
		}, 200);

		return () => clearTimeout(timer);
	}, [isComplete, currentLineIndex, currentLine, allLines.length]);

	useEffect(() => {
		if (!ready) return;

		const handler = () => onComplete();
		window.addEventListener("keydown", handler);
		window.addEventListener("click", handler);
		return () => {
			window.removeEventListener("keydown", handler);
			window.removeEventListener("click", handler);
		};
	}, [ready, onComplete]);

	// Suppress unused variable lint warning — dbReady is used conceptually to
	// gate the ready state above but not rendered directly.
	void dbReady;

	const getColorForLine = (bootLine: BootLine): string => {
		switch (bootLine.color) {
			case "success":
				return "var(--accent-success)";
			case "accent":
				return "var(--accent-blue)";
			case "muted":
			default:
				return "var(--text-secondary)";
		}
	};

	return (
		<div
			className="flex h-full w-full flex-col items-start justify-center px-16"
			style={{ fontFamily: "monospace" }}
		>
			<div className="flex flex-col gap-1">
				<AnimatePresence>
					{completedLines.map((bootLine, i) => (
						<motion.div
							key={`${i}-${bootLine.text}`}
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.25 }}
							style={{
								color: getColorForLine(bootLine),
								fontSize: "0.875rem",
							}}
						>
							<span style={{ color: "var(--accent-blue)", marginRight: "0.5rem" }}>
								{">"}
							</span>
							{bootLine.text}
						</motion.div>
					))}
					{currentLine && (
						<motion.div
							key={`current-${currentLineIndex}`}
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.25 }}
							style={{
								color: getColorForLine(currentLine),
								fontSize: "0.875rem",
							}}
						>
							<span style={{ color: "var(--accent-blue)", marginRight: "0.5rem" }}>
								{">"}
							</span>
							{displayedText}
							{!isComplete && (
								<span
									style={{
										opacity: cursorVisible ? 1 : 0,
										transition: "opacity 0.1s",
									}}
								>
									_
								</span>
							)}
						</motion.div>
					)}
				</AnimatePresence>
				{ready && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4, duration: 0.5 }}
						style={{
							color: "var(--text-secondary)",
							fontSize: "0.75rem",
							marginTop: "1rem",
						}}
					>
						press any key to continue
					</motion.div>
				)}
			</div>
		</div>
	);
}
