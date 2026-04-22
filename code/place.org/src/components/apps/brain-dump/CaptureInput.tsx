'use client';

import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Web Speech API types (not in lib.dom by default)
// ---------------------------------------------------------------------------

interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
	readonly length: number;
	item(index: number): SpeechRecognitionResult;
	[index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
	readonly length: number;
	item(index: number): SpeechRecognitionAlternative;
	[index: number]: SpeechRecognitionAlternative;
	readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
	readonly transcript: string;
	readonly confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onend: (() => void) | null;
	onerror: ((event: Event) => void) | null;
	start(): void;
	stop(): void;
	abort(): void;
}

interface SpeechRecognitionConstructor {
	new (): SpeechRecognitionInstance;
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
	if (typeof window === 'undefined') return null;
	const w = window as unknown as Record<string, unknown>;
	return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
		SpeechRecognitionConstructor | null;
}

// ---------------------------------------------------------------------------
// CaptureInput
// ---------------------------------------------------------------------------

interface CaptureInputProps {
	readonly onCapture: (text: string) => void;
	readonly disabled?: boolean;
}

export function CaptureInput({ onCapture, disabled = false }: CaptureInputProps) {
	const [value, setValue] = useState("");
	const [isListening, setIsListening] = useState(false);
	const [speechSupported, setSpeechSupported] = useState(false);
	const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

	useEffect(() => {
		setSpeechSupported(getSpeechRecognitionCtor() !== null);
	}, []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = value.trim();
		if (!trimmed) return;
		onCapture(trimmed);
		setValue("");
	};

	const stopListening = useCallback(() => {
		recognitionRef.current?.stop();
		setIsListening(false);
	}, []);

	const startListening = useCallback(() => {
		const Ctor = getSpeechRecognitionCtor();
		if (!Ctor) return;

		const recognition = new Ctor();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = 'en-US';
		recognitionRef.current = recognition;

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			let transcript = '';
			for (let i = 0; i < event.results.length; i++) {
				const result = event.results[i];
				if (result?.[0]) {
					transcript += result[0].transcript;
				}
			}
			setValue(transcript);
		};

		recognition.onend = () => {
			setIsListening(false);
		};

		recognition.onerror = () => {
			setIsListening(false);
		};

		recognition.start();
		setIsListening(true);
	}, []);

	const toggleListening = useCallback(() => {
		if (isListening) {
			stopListening();
		} else {
			startListening();
		}
	}, [isListening, stopListening, startListening]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			recognitionRef.current?.abort();
		};
	}, []);

	return (
		<form onSubmit={handleSubmit} className="flex gap-2 p-3">
			<input
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder={isListening ? "listening..." : "capture a thought..."}
				disabled={disabled}
				className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
				style={{
					background: "rgba(255,255,255,0.04)",
					border: `1px solid ${isListening ? 'var(--place-error)' : 'var(--place-border-default)'}`,
					color: "var(--place-text-primary)",
					fontSize: "0.875rem",
					transition: "border-color 0.2s",
				}}
				onFocus={(e) => {
					if (!isListening) {
						e.currentTarget.style.borderColor = "var(--place-border-strong)";
					}
				}}
				onBlur={(e) => {
					if (!isListening) {
						e.currentTarget.style.borderColor = "var(--place-border-default)";
					}
				}}
			/>
			{speechSupported && (
				<MicButton
					isListening={isListening}
					disabled={disabled}
					onClick={toggleListening}
				/>
			)}
			<button
				type="submit"
				disabled={disabled || !value.trim()}
				className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
				style={{
					background: "var(--place-secondary-400)",
					color: "#fff",
					fontSize: "0.875rem",
				}}
			>
				Add
			</button>
		</form>
	);
}

// ---------------------------------------------------------------------------
// MicButton
// ---------------------------------------------------------------------------

function MicButton({
	isListening,
	disabled,
	onClick,
}: {
	readonly isListening: boolean;
	readonly disabled: boolean;
	readonly onClick: () => void;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			aria-label={isListening ? "Stop listening" : "Start voice capture"}
			className="rounded-lg px-3 py-2 transition-all disabled:opacity-40"
			style={{
				background: isListening ? 'var(--place-error)' : 'rgba(255,255,255,0.06)',
				border: `1px solid ${isListening ? 'var(--place-error)' : 'var(--place-border-default)'}`,
				color: isListening ? '#fff' : 'var(--place-text-secondary)',
				cursor: disabled ? 'default' : 'pointer',
				animation: isListening ? 'mic-pulse 1.5s ease-in-out infinite' : 'none',
			}}
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
				<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
				<line x1="12" y1="19" x2="12" y2="23" />
				<line x1="8" y1="23" x2="16" y2="23" />
			</svg>
		</button>
	);
}
