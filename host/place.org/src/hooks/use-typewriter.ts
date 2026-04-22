'use client';

import { useEffect, useRef, useState } from 'react';

interface UseTypewriterState {
	readonly displayedText: string;
	readonly isComplete: boolean;
	readonly cursorVisible: boolean;
}

interface UseTypewriterOptions {
	readonly speed?: number;
	readonly cursorBlinkSpeed?: number;
}

/**
 * Hook that types text character by character with optional blinking cursor.
 * @param text - The text to type
 * @param options - Configuration options (speed in ms, cursorBlinkSpeed in ms)
 * @returns State object with displayedText, isComplete, and cursorVisible
 */
export function useTypewriter(
	text: string,
	options: UseTypewriterOptions = {}
): UseTypewriterState {
	const { speed = 30, cursorBlinkSpeed = 500 } = options;
	const [displayedText, setDisplayedText] = useState('');
	const [isComplete, setIsComplete] = useState(false);
	const [cursorVisible, setCursorVisible] = useState(true);

	const typewriterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const characterIndexRef = useRef(0);

	// Typewriter effect
	useEffect(() => {
		characterIndexRef.current = 0;
		setDisplayedText('');
		setIsComplete(false);

		const type = () => {
			if (characterIndexRef.current < text.length) {
				setDisplayedText(text.slice(0, characterIndexRef.current + 1));
				characterIndexRef.current += 1;
				typewriterTimeoutRef.current = setTimeout(type, speed);
			} else {
				setIsComplete(true);
			}
		};

		if (text.length > 0) {
			typewriterTimeoutRef.current = setTimeout(type, 0);
		} else {
			setIsComplete(true);
		}

		return () => {
			if (typewriterTimeoutRef.current) {
				clearTimeout(typewriterTimeoutRef.current);
			}
		};
	}, [text, speed]);

	// Blinking cursor effect
	useEffect(() => {
		const blink = () => {
			setCursorVisible((prev) => !prev);
			cursorTimeoutRef.current = setTimeout(blink, cursorBlinkSpeed);
		};

		cursorTimeoutRef.current = setTimeout(blink, cursorBlinkSpeed);

		return () => {
			if (cursorTimeoutRef.current) {
				clearTimeout(cursorTimeoutRef.current);
			}
		};
	}, [cursorBlinkSpeed]);

	return {
		displayedText,
		isComplete,
		cursorVisible,
	};
}
