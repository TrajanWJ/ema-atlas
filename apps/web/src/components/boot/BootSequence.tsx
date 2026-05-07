"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getDbClient } from "@/src/db/client";
import { getUnprocessedCount } from "@/src/db/queries/inbox";
import { getSetting } from "@/src/db/queries/settings";
import { useTypewriter } from "@/src/hooks/use-typewriter";
import type { BootLine } from "@/src/lib/boot-messages";
import { getBootLines } from "@/src/lib/boot-messages";
import { useAuthStore } from "@/src/stores/auth-store";
import { AuthPanel } from "./AuthPanel";
import { EmaIdentityPanel } from "./EmaIdentityPanel";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface BootSequenceProps {
	readonly onComplete: () => void;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const DB_VERSION = 1;

// ----------------------------------------------------------------------------
// Boot Terminal (left side)
// ----------------------------------------------------------------------------

function getColorForLine(bootLine: BootLine): string {
	switch (bootLine.color) {
		case "success":
			return "var(--place-success)";
		case "accent":
			return "var(--place-secondary-400)";
		case "muted":
		default:
			return "var(--place-text-secondary)";
	}
}

function BootTerminal({
	allLines,
	completedLines,
	currentLine,
	currentLineIndex,
	displayedText,
	isComplete,
	cursorVisible,
	ready,
}: {
	readonly allLines: readonly BootLine[];
	readonly completedLines: readonly BootLine[];
	readonly currentLine: BootLine | undefined;
	readonly currentLineIndex: number;
	readonly displayedText: string;
	readonly isComplete: boolean;
	readonly cursorVisible: boolean;
	readonly ready: boolean;
}) {
	void allLines;

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
							initial={{ opacity: 0, y: 3 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.10 }}
							style={{
								color: getColorForLine(bootLine),
								fontSize: "0.875rem",
							}}
						>
							<span
								style={{
									color: "var(--place-secondary-400)",
									marginRight: "0.5rem",
								}}
							>
								{">"}
							</span>
							{bootLine.text}
						</motion.div>
					))}
					{currentLine && (
						<motion.div
							key={`current-${currentLineIndex}`}
							initial={{ opacity: 0, y: 3 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.10 }}
							style={{
								color: getColorForLine(currentLine),
								fontSize: "0.875rem",
							}}
						>
							<span
								style={{
									color: "var(--place-secondary-400)",
									marginRight: "0.5rem",
								}}
							>
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
						initial={{ opacity: 0, x: -4 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.05, duration: 0.18 }}
						style={{
							marginTop: "1rem",
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
							fontSize: "0.75rem",
							color: "var(--place-text-tertiary)",
							letterSpacing: "0.04em",
						}}
					>
						<span style={{ color: "var(--place-success)" }}>✓</span>
						<span>boot complete</span>
						<span style={{ color: "var(--place-text-muted)" }}>·</span>
						<span style={{ color: "var(--place-secondary-400)" }}>
							choose entry →
						</span>
					</motion.div>
				)}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Main BootSequence
// ----------------------------------------------------------------------------

export function BootSequence({ onComplete }: BootSequenceProps) {
	const [allLines, setAllLines] = useState<readonly BootLine[]>([]);
	const [completedLines, setCompletedLines] = useState<readonly BootLine[]>([]);
	const [currentLineIndex, setCurrentLineIndex] = useState(0);
	const [ready, setReady] = useState(false);

	const authPanelRef = useRef<HTMLDivElement>(null);

	const user = useAuthStore((s) => s.user);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const justSignedUp = useAuthStore((s) => s.justSignedUp);
	const loadSession = useAuthStore((s) => s.loadSession);
	const quickLogin = useAuthStore((s) => s.quickLogin);

	// EMA additions: ?autologin=1 (or ?test=1) skips the auth panel entirely
	// and lands on the desktop. Inside Tauri (the bundled .app) we also
	// auto-login by default — no URL params available there, and EMA's
	// identity model eventually replaces this anyway. The boot terminal
	// still types out so db.init() / accent-color / inbox-count side-effects
	// fire normally.
	//
	// We read window.location.search directly (instead of next/navigation's
	// useSearchParams) so this component still pre-renders cleanly under
	// Next.js static export — useSearchParams forces a Suspense boundary.
	const [autoLogin, setAutoLogin] = useState(false);
	const [isTauriRuntime, setIsTauriRuntime] = useState(false);
	useEffect(() => {
		if (typeof window === "undefined") return;
		const sp = new URLSearchParams(window.location.search);
		const isTauri = "__TAURI__" in window || "__TAURI_INTERNALS__" in window;
		setIsTauriRuntime(isTauri);
		// ALSO write data-runtime here as a belt-and-suspenders for the
		// useTauriRuntime hook — guarantees CSS scoping is set even if the
		// hook never mounts during boot.
		document.documentElement.dataset.runtime = isTauri ? "tauri" : "web";
		setAutoLogin(
			// In Tauri we autologin so the .app always reaches the desktop
			// even if the manual Identity Panel button has issues. The
			// terminal still types out for the polish (~3s). Browser users
			// see place.org's AuthPanel unless they pass ?autologin=1.
			isTauri ||
				sp.get("autologin") === "1" ||
				sp.get("test") === "1" ||
				sp.get("test") === "true",
		);
	}, []);

	const currentLine = allLines[currentLineIndex];
	const { displayedText, isComplete, cursorVisible } = useTypewriter(
		currentLine?.text || "",
		{ speed: 8 },
	);

	// Load auth session on mount
	useEffect(() => {
		loadSession();
	}, [loadSession]);

	useEffect(() => {
		if (autoLogin && !isAuthenticated) {
			quickLogin("dev-trajan");
		}
	}, [autoLogin, isAuthenticated, quickLogin]);

	useEffect(() => {
		if (autoLogin && ready && isAuthenticated) {
			onComplete();
		}
	}, [autoLogin, ready, isAuthenticated, onComplete]);

	// Init DB and build boot lines
	useEffect(() => {
		let cancelled = false;

		setTimeout(async () => {
			if (cancelled) return;
			try {
				const db = getDbClient();
				await db.init();
				if (cancelled) return;

				const accentColor = await getSetting(db, "accent-color");
				if (accentColor && !cancelled) {
					document.documentElement.style.setProperty(
						"--accent-blue",
						accentColor,
					);
				}
				if (cancelled) return;

				const entryCount = await getUnprocessedCount(db);
				if (cancelled) return;

				const hour = new Date().getHours();
				const session = loadStoredSessionDirect();
				const bootLines = getBootLines(
					hour,
					DB_VERSION,
					entryCount,
					session?.name,
				);

				if (!cancelled) setAllLines(bootLines);
			} catch {
				if (cancelled) return;

				const hour = new Date().getHours();
				const session = loadStoredSessionDirect();
				const bootLines = getBootLines(
					hour,
					DB_VERSION,
					undefined,
					session?.name,
				);

				if (!cancelled) setAllLines(bootLines);
			}
		}, 0);

		return () => {
			cancelled = true;
		};
	}, []);

	// Progress to next line when current is complete. With only 3 boot lines
	// (the trimmed set), 60ms keeps each one legible while letting the whole
	// terminal land in well under a second.
	useEffect(() => {
		if (!isComplete || !currentLine) return;

		const timer = setTimeout(() => {
			setCompletedLines((prev) => [...prev, currentLine]);

			if (currentLineIndex < allLines.length - 1) {
				setCurrentLineIndex((prev) => prev + 1);
			} else {
				setCurrentLineIndex(allLines.length);
				setReady(true);
			}
		}, 60);

		return () => clearTimeout(timer);
	}, [isComplete, currentLineIndex, currentLine, allLines.length]);

	// No auto-proceed on key/click — user must use the buttons or auth panel

	return (
		<div className="flex h-full w-full">
			{/* Left side — terminal boot messages */}
			<div className="flex w-[60%] shrink-0">
				<BootTerminal
					allLines={allLines}
					completedLines={completedLines}
					currentLine={currentLine}
					currentLineIndex={currentLineIndex}
					displayedText={displayedText}
					isComplete={isComplete}
					cursorVisible={cursorVisible}
					ready={ready}
				/>
			</div>

			{/* Right side — EMA identity panel (Tauri) or place.org auth panel (browser) */}
			<div
				ref={authPanelRef}
				className="flex w-[40%] items-center justify-center p-8"
			>
				{ready && isTauriRuntime ? (
					<EmaIdentityPanel onContinue={onComplete} />
				) : ready ? (
					<AuthPanel
						onContinue={onComplete}
						user={isAuthenticated ? user : null}
						justSignedUp={justSignedUp}
					/>
				) : null}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Direct localStorage read (avoids async timing issues with store)
// ----------------------------------------------------------------------------

function loadStoredSessionDirect(): { name: string } | null {
	try {
		const raw = localStorage.getItem("place-auth-session");
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { name?: string };
		return parsed.name ? { name: parsed.name } : null;
	} catch {
		return null;
	}
}
