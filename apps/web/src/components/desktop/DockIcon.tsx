'use client';

import { type ReactNode, useRef } from "react";
import { motion } from "motion/react";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { useSound } from "@/src/hooks/use-sound";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { SPRINGS, getTransition } from "@/src/lib/springs";

const MAGNIFICATION_RANGE = 80;
const MAGNIFICATION_SCALE = 0.4;

interface DockIconProps {
	readonly icon: ReactNode;
	readonly label: string;
	readonly description?: string;
	readonly isOpen: boolean;
	readonly isFocused: boolean;
	readonly badge?: number;
	readonly mouseX: number | null;
	readonly onClick: () => void;
	readonly onContextMenu?: (e: React.MouseEvent) => void;
	readonly shortcut?: string;
	readonly size?: number;
}

function getMagnificationScale(
	mouseX: number | null,
	iconRef: React.RefObject<HTMLDivElement | null>,
): number {
	if (mouseX === null || !iconRef.current) return 1;
	const rect = iconRef.current.getBoundingClientRect();
	const parentRect = iconRef.current.offsetParent?.getBoundingClientRect();
	if (!parentRect) return 1;
	const iconCenter = rect.left - parentRect.left + rect.width / 2;
	const distance = Math.abs(mouseX - iconCenter);
	return 1 + MAGNIFICATION_SCALE * Math.max(0, 1 - distance / MAGNIFICATION_RANGE);
}

const KEYBOARD_SHORTCUTS: Record<string, string> = {
	"Brain Dump": "Ctrl+Shift+B",
	"Journal": "Ctrl+Shift+J",
	"Focus": "Ctrl+Shift+F",
	"Tasks": "Ctrl+Shift+T",
	"Terminal": "Ctrl+Shift+E",
};

function DockTooltipContent({
	label,
	description,
	shortcut,
}: {
	readonly label: string;
	readonly description?: string;
	readonly shortcut?: string;
}) {
	return (
		<div className="flex flex-col gap-0.5" style={{ minWidth: "140px", maxWidth: "220px" }}>
			<div className="flex items-center justify-between gap-3">
				<span className="font-semibold whitespace-nowrap" style={{ color: "var(--place-text-primary)" }}>
					{label}
				</span>
				{shortcut && (
					<span
						className="shrink-0 whitespace-nowrap rounded px-1"
						style={{
							fontSize: "0.6rem",
							color: "var(--place-text-secondary)",
							background: "rgba(255,255,255,0.06)",
							border: "1px solid var(--place-border-default)",
						}}
					>
						{shortcut}
					</span>
				)}
			</div>
			{description && (
				<span style={{ color: "var(--place-text-secondary)", fontSize: "0.65rem", lineHeight: 1.3 }}>
					{description}
				</span>
			)}
		</div>
	);
}

export function DockIcon({
	icon,
	label,
	description,
	isOpen,
	isFocused,
	badge,
	mouseX,
	onClick,
	onContextMenu,
	shortcut,
	size = 44,
}: DockIconProps) {
	const { playClick } = useSound();
	const reducedMotion = useReducedMotion();
	const iconContainerRef = useRef<HTMLDivElement>(null);

	const hoverTransition = getTransition(SPRINGS.bouncy, reducedMotion);
	const scale = reducedMotion ? 1 : getMagnificationScale(mouseX, iconContainerRef);
	const translateY = scale > 1 ? -(scale - 1) * 20 : 0;

	const handleClick = () => {
		playClick();
		onClick();
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onContextMenu?.(e);
	};

	const keystroke = shortcut || KEYBOARD_SHORTCUTS[label];

	return (
		<Tooltip
			content={
				<DockTooltipContent label={label} description={description} shortcut={keystroke} />
			}
			delay={300}
		>
			<div ref={iconContainerRef} className="relative flex flex-col items-center">
				<motion.button
					type="button"
					onClick={handleClick}
					onContextMenu={handleContextMenu}
					aria-label={label}
					aria-pressed={isFocused}
					whileTap={reducedMotion ? undefined : { scale: 0.95 }}
					transition={hoverTransition}
					className="dock-icon-btn relative flex items-center justify-center rounded-xl"
					style={{
						width: size,
						height: size,
						background: isFocused
							? "rgba(91,156,245,0.15)"
							: "rgba(255,255,255,0.04)",
						border: "1px solid var(--place-border-default)",
						cursor: "default",
						color: isFocused
							? "var(--place-secondary-400)"
							: "var(--place-text-secondary)",
						transform: `scale(${scale}) translateY(${translateY}px)`,
						transition: "color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease-out",
					}}
				>
					<span className="dock-icon-inner flex items-center justify-center">
						{icon}
					</span>
					{/* Badge */}
					{badge !== undefined && badge > 0 && (
						<span
							className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold"
							style={{
								background: "var(--place-error)",
								color: "#fff",
								fontSize: "0.6rem",
							}}
						>
							{badge > 99 ? "99+" : badge}
						</span>
					)}
				</motion.button>

				{/* Open indicator dot */}
				{isOpen && (
					<span
						className="absolute -bottom-1.5 h-1 w-1 rounded-full"
						style={{ background: "var(--place-secondary-400)" }}
					/>
				)}
			</div>
		</Tooltip>
	);
}
