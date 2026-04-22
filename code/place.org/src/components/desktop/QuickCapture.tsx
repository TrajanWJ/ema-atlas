'use client';

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDesktopStore } from "@/src/stores/desktop-store";
import { useInboxStore } from "@/src/stores/inbox-store";

export function QuickCapture() {
	const quickCaptureOpen = useDesktopStore((s) => s.quickCaptureOpen);
	const closeQuickCapture = useDesktopStore((s) => s.closeQuickCapture);
	const addInboxItem = useInboxStore((s) => s.add);
	const [text, setText] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input when opened
	useEffect(() => {
		if (quickCaptureOpen) {
			setText("");
			inputRef.current?.focus();
		}
	}, [quickCaptureOpen]);

	const handleCapture = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = text.trim();
		if (!trimmed) return;

		try {
			await addInboxItem(trimmed, "text");
			setText("");
			closeQuickCapture();
		} catch (error) {
			console.error("Failed to capture thought:", error);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault();
			closeQuickCapture();
		}
	};

	return (
		<AnimatePresence>
			{quickCaptureOpen && (
				<motion.div
					key="quick-capture-overlay"
					role="dialog"
					aria-modal="true"
					aria-label="Quick capture"
					className="fixed inset-0 flex items-center justify-center"
					style={{ zIndex: 9100, backgroundColor: "rgba(6,6,16,0.4)" }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
					onClick={(e) => {
						if (e.target === e.currentTarget) closeQuickCapture();
					}}
				>
					<motion.form
						onSubmit={handleCapture}
						className="glass w-full max-w-md rounded-2xl overflow-hidden"
						style={{
							boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px var(--place-border-default)",
						}}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.2, ease: [0.65, 0.05, 0, 1] }}
					>
						<div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--place-border-default)" }}>
							<span className="text-lg shrink-0" style={{ color: "var(--place-text-secondary)" }} aria-hidden="true">
								💡
							</span>
							<input
								ref={inputRef}
								type="text"
								className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
								style={{ color: "var(--place-text-primary)" }}
								placeholder="Capture a thought…"
								value={text}
								onChange={(e) => setText(e.target.value)}
								onKeyDown={handleKeyDown}
								autoComplete="off"
							/>
							<kbd
								className="text-xs px-1.5 py-0.5 rounded"
								style={{
									color: "var(--place-text-secondary)",
									backgroundColor: "rgba(255,255,255,0.05)",
									border: "1px solid var(--place-border-default)",
								}}
							>
								Esc
							</kbd>
						</div>
					</motion.form>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
