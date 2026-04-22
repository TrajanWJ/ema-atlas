'use client';

import { motion } from "motion/react";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { useSound } from "@/src/hooks/use-sound";

interface DockIconProps {
	readonly icon: string;
	readonly label: string;
	readonly isOpen: boolean;
	readonly isFocused: boolean;
	readonly badge?: number;
	readonly onClick: () => void;
	readonly shortcut?: string;
}

const KEYBOARD_SHORTCUTS: Record<string, string> = {
	"Brain Dump": "Ctrl+Shift+B",
	"Journal": "Ctrl+Shift+J",
	"Focus": "Ctrl+Shift+F",
	"Tasks": "Ctrl+Shift+T",
	"Dashboard": "Ctrl+Shift+D",
	"Terminal": "Ctrl+Shift+E",
};

export function DockIcon({
	icon,
	label,
	isOpen,
	isFocused,
	badge,
	onClick,
	shortcut,
}: DockIconProps) {
	const { playClick } = useSound();

	const handleClick = () => {
		playClick();
		onClick();
	};

	const getTooltipContent = () => {
		const keystroke = shortcut || KEYBOARD_SHORTCUTS[label];
		return keystroke ? `${label} (${keystroke})` : label;
	};

	return (
		<Tooltip content={getTooltipContent()}>
			<div className="relative flex flex-col items-center">
				<motion.button
					type="button"
					onClick={handleClick}
					aria-label={label}
					aria-pressed={isFocused}
					whileHover={{ scale: 1.15, y: -4 }}
					whileTap={{ scale: 0.95 }}
					transition={{ type: "spring", stiffness: 400, damping: 17 }}
					className="relative flex h-11 w-11 items-center justify-center rounded-xl text-2xl"
					style={{
						background: isFocused
							? "rgba(91,156,245,0.15)"
							: "rgba(255,255,255,0.04)",
						border: "1px solid var(--border)",
						cursor: "default",
					}}
				>
					{icon}
					{/* Badge */}
					{badge !== undefined && badge > 0 && (
						<span
							className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold"
							style={{
								background: "var(--accent-urgent)",
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
						style={{ background: "var(--accent-blue)" }}
					/>
				)}
			</div>
		</Tooltip>
	);
}
