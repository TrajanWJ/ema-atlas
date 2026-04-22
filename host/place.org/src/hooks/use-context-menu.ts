'use client';

import { useState, useEffect, useCallback } from "react";
import type { RefObject } from "react";

export interface ContextMenuPosition {
	readonly x: number;
	readonly y: number;
}

export interface UseContextMenuReturn {
	readonly isOpen: boolean;
	readonly position: ContextMenuPosition;
	readonly close: () => void;
}

export function useContextMenu(
	ref: RefObject<HTMLElement | null>,
): UseContextMenuReturn {
	const [isOpen, setIsOpen] = useState(false);
	const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });

	const close = useCallback(() => setIsOpen(false), []);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const handleContextMenu = (e: MouseEvent) => {
			e.preventDefault();
			setPosition({ x: e.clientX, y: e.clientY });
			setIsOpen(true);
		};

		el.addEventListener("contextmenu", handleContextMenu);
		return () => el.removeEventListener("contextmenu", handleContextMenu);
	}, [ref]);

	return { isOpen, position, close };
}
