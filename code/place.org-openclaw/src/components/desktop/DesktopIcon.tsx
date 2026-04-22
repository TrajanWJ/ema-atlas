'use client';

import { useRef, useCallback } from "react";
import { useWindowStore } from "@/src/stores/window-store";
import { useDesktopIconsStore } from "@/src/stores/desktop-icons-store";
import type { DesktopIconData } from "@/src/stores/desktop-icons-store";
import type { AppId } from "@/src/types/window";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface DesktopIconProps {
	readonly icon: DesktopIconData;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const ICON_SIZE = 64;

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function DesktopIcon({ icon }: DesktopIconProps) {
	const { id, label, icon: emoji, action, x, y } = icon;

	const moveIcon = useDesktopIconsStore((s) => s.moveIcon);
	const selectIcon = useDesktopIconsStore((s) => s.selectIcon);
	const selectedId = useDesktopIconsStore((s) => s.selectedId);
	const openWindow = useWindowStore((s) => s.openWindow);

	const isSelected = selectedId === id;

	// Drag state via refs (no re-renders during drag)
	const isDragging = useRef(false);
	const hasMoved = useRef(false);
	const startPointer = useRef({ x: 0, y: 0 });
	const startIcon = useRef({ x: 0, y: 0 });
	const currentPos = useRef({ x, y });

	// Keep currentPos in sync with prop
	currentPos.current = { x, y };

	const handleAction = useCallback(() => {
		if (action.type === "app") {
			openWindow(action.appId as AppId);
		} else {
			window.open(action.url, "_self");
		}
	}, [action, openWindow]);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			// Only primary button
			if (e.button !== 0) return;

			e.preventDefault();
			e.stopPropagation();

			isDragging.current = true;
			hasMoved.current = false;
			startPointer.current = { x: e.clientX, y: e.clientY };
			startIcon.current = { x: currentPos.current.x, y: currentPos.current.y };

			selectIcon(id);

			(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
		},
		[id, selectIcon],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!isDragging.current) return;

			const dx = e.clientX - startPointer.current.x;
			const dy = e.clientY - startPointer.current.y;

			// Only start actual drag after moving >4px
			if (!hasMoved.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
			hasMoved.current = true;

			const rawX = startIcon.current.x + dx;
			const rawY = startIcon.current.y + dy;

			// Update visual position without snapping during drag
			const el = e.currentTarget as HTMLDivElement;
			el.style.left = `${rawX}px`;
			el.style.top = `${rawY}px`;
		},
		[],
	);

	const handlePointerUp = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!isDragging.current) return;
			isDragging.current = false;

			if (hasMoved.current) {
				const dx = e.clientX - startPointer.current.x;
				const dy = e.clientY - startPointer.current.y;
				const rawX = startIcon.current.x + dx;
				const rawY = startIcon.current.y + dy;
				// Snap on release
				moveIcon(id, rawX, rawY);
			}
		},
		[id, moveIcon],
	);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			handleAction();
		},
		[handleAction],
	);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (!hasMoved.current) {
				selectIcon(id);
			}
		},
		[id, selectIcon],
	);

	return (
		<div
			data-desktop-icon
			data-icon-id={id}
			role="button"
			tabIndex={0}
			aria-label={label}
			aria-pressed={isSelected}
			style={{
				position: "absolute",
				left: x,
				top: y,
				width: ICON_SIZE,
				cursor: "default",
				userSelect: "none",
				touchAction: "none",
			}}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") handleAction();
			}}
		>
			{/* Icon area */}
			<div
				style={{
					width: ICON_SIZE,
					height: ICON_SIZE,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: 28,
					borderRadius: 12,
					border: isSelected
						? "2px solid rgba(91,156,245,0.7)"
						: "2px solid transparent",
					boxShadow: isSelected
						? "0 0 0 2px rgba(91,156,245,0.3)"
						: "none",
					background: isSelected
						? "rgba(91,156,245,0.10)"
						: "transparent",
					transition: "border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease, background 0.12s ease",
				}}
				className="desktop-icon-box"
			>
				{emoji}
			</div>

			{/* Label */}
			<div
				style={{
					marginTop: 4,
					fontSize: 10,
					lineHeight: "1.3",
					textAlign: "center",
					color: "#fff",
					textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)",
					wordBreak: "break-word",
					overflow: "hidden",
					display: "-webkit-box",
					WebkitLineClamp: 2,
					WebkitBoxOrient: "vertical",
				}}
			>
				{label}
			</div>

			<style>{`
				[data-desktop-icon]:hover .desktop-icon-box {
					transform: scale(1.05);
				}
				[data-desktop-icon][data-dragging="true"] .desktop-icon-box {
					opacity: 0.7;
				}
			`}</style>
		</div>
	);
}
