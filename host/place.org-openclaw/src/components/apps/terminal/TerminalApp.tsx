'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { useInboxStore } from "@/src/stores/inbox-store";
import { useFocusStore, WORK_MS } from "@/src/stores/focus-store";
import { useWindowStore } from "@/src/stores/window-store";
import { COMMANDS } from "./commands";

const PROMPT = "place.org > ";
const MAX_HISTORY = 200;

interface OutputLine {
	readonly id: string;
	readonly text: string;
	readonly type: "input" | "output" | "error";
}

function lineId(): string {
	return crypto.randomUUID();
}

export function TerminalApp() {
	const [output, setOutput] = useState<readonly OutputLine[]>([
		{ id: lineId(), text: "place.org terminal v0.2 — type 'help' for commands", type: "output" },
	]);
	const [input, setInput] = useState("");
	const [historyIndex, setHistoryIndex] = useState(-1);
	const commandHistoryRef = useRef<string[]>([]);
	const outputRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const inboxAdd = useInboxStore((s) => s.add);
	const focusStart = useFocusStore((s) => s.start);
	const openWindow = useWindowStore((s) => s.openWindow);

	// Auto-scroll on new output
	useEffect(() => {
		if (outputRef.current) {
			outputRef.current.scrollTop = outputRef.current.scrollHeight;
		}
	}, [output]);

	const appendLines = useCallback((lines: readonly string[], type: OutputLine["type"] = "output") => {
		setOutput((prev) => {
			const newLines: OutputLine[] = lines.map((text) => ({
				id: lineId(),
				text,
				type,
			}));
			const combined = [...prev, ...newLines];
			return combined.slice(-MAX_HISTORY);
		});
	}, []);

	const runCommand = useCallback(
		async (raw: string) => {
			const trimmed = raw.trim();
			if (!trimmed) return;

			// Echo the input
			setOutput((prev) => [
				...prev,
				{ id: lineId(), text: `${PROMPT}${trimmed}`, type: "input" },
			]);

			const [cmd, ...args] = trimmed.split(/\s+/);
			const cmdLower = cmd?.toLowerCase() ?? "";

			// Built-in special commands
			if (cmdLower === "clear") {
				setOutput([]);
				return;
			}

			if (cmdLower === "/dump") {
				const text = args.join(" ");
				if (!text) {
					appendLines(["Usage: /dump <text>"], "error");
					return;
				}
				try {
					await inboxAdd(text);
					appendLines([`Added to inbox: "${text}"`]);
				} catch {
					appendLines(["Failed to add to inbox"], "error");
				}
				return;
			}

			if (cmdLower === "/focus") {
				const minutes = args[0] ? parseInt(args[0], 10) : 25;
				const targetMs = (Number.isFinite(minutes) ? minutes : 25) * 60 * 1000;
				try {
					await focusStart(targetMs);
					openWindow("focus");
					appendLines([`Focus session started: ${minutes}m`]);
				} catch {
					appendLines(["Failed to start focus session"], "error");
				}
				return;
			}

			if (cmdLower === "/journal") {
				openWindow("journal");
				appendLines(["Opening journal…"]);
				return;
			}

			// Sync commands from registry
			const handler = COMMANDS[cmdLower];
			if (!handler) {
				appendLines([`Command not found: ${cmdLower}. Type 'help' for list.`], "error");
				return;
			}

			const result = handler(args);
			const lines = Array.isArray(result) ? result : [result];
			appendLines(lines);
		},
		[inboxAdd, focusStart, openWindow, appendLines],
	);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			const value = input;
			if (value.trim()) {
				commandHistoryRef.current = [value, ...commandHistoryRef.current].slice(0, 50);
			}
			setHistoryIndex(-1);
			setInput("");
			runCommand(value).catch(() => {});
			return;
		}

		if (e.key === "ArrowUp") {
			e.preventDefault();
			const nextIndex = Math.min(historyIndex + 1, commandHistoryRef.current.length - 1);
			setHistoryIndex(nextIndex);
			setInput(commandHistoryRef.current[nextIndex] ?? "");
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			const nextIndex = Math.max(historyIndex - 1, -1);
			setHistoryIndex(nextIndex);
			setInput(nextIndex === -1 ? "" : (commandHistoryRef.current[nextIndex] ?? ""));
		}
	};

	return (
		<div
			className="flex h-full flex-col"
			style={{
				fontFamily: "monospace",
				fontSize: "0.8rem",
				background: "transparent",
			}}
			onClick={() => inputRef.current?.focus()}
		>
			{/* Scrollable output area */}
			<div
				ref={outputRef}
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "0.75rem",
					display: "flex",
					flexDirection: "column",
					gap: "0.1rem",
				}}
			>
				{output.map((line) => (
					<div
						key={line.id}
						style={{
							color:
								line.type === "input"
									? "var(--accent-blue)"
									: line.type === "error"
										? "var(--accent-urgent)"
										: "var(--text-primary)",
							lineHeight: 1.5,
							whiteSpace: "pre-wrap",
							wordBreak: "break-all",
						}}
					>
						{line.text}
					</div>
				))}
			</div>

			{/* Fixed input line */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					padding: "0.5rem 0.75rem",
					borderTop: "1px solid var(--border)",
					gap: "0",
				}}
			>
				<span style={{ color: "var(--accent-success)", flexShrink: 0 }}>{PROMPT}</span>
				<input
					ref={inputRef}
					autoFocus
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					style={{
						flex: 1,
						background: "transparent",
						border: "none",
						outline: "none",
						color: "var(--text-primary)",
						fontFamily: "monospace",
						fontSize: "0.8rem",
						caretColor: "var(--accent-blue)",
					}}
					aria-label="Terminal input"
				/>
			</div>
		</div>
	);
}
