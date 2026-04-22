'use client';

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { getTargetsForPayload, sendToApp } from "@/src/lib/send-to-registry";
import { useToast } from "@/src/hooks/use-toast";
import { APP_LABELS } from "@/src/lib/constants";
import type { SendPayload } from "@/src/types/send-to";

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface SendToMenuProps {
	readonly payload: SendPayload;
	readonly position: { readonly x: number; readonly y: number };
	readonly onClose: () => void;
	readonly onSent: () => void;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function SendToMenu({ payload, position, onClose, onSent }: SendToMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const { success } = useToast();

	const targets = getTargetsForPayload(payload.type, payload.sourceAppId);

	// Close on click outside
	const handleClickOutside = useCallback(
		(e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		},
		[onClose],
	);

	// Close on Escape
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		},
		[onClose],
	);

	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleClickOutside, handleKeyDown]);

	// Clamp position to viewport
	const clampedX = Math.min(position.x, window.innerWidth - 200);
	const clampedY = Math.min(position.y, window.innerHeight - 40 * targets.length - 48);

	const handleSend = (targetAppId: typeof targets[number]["appId"]) => {
		sendToApp(payload, targetAppId);
		const label = APP_LABELS[targetAppId];
		success(`Sent to ${label}`);
		onSent();
	};

	const menuEl = (
		<AnimatePresence>
			<motion.div
				ref={menuRef}
				className="fixed flex flex-col rounded-[10px] py-1"
				style={{
					top: `${clampedY}px`,
					left: `${clampedX}px`,
					zIndex: 99999,
					minWidth: "160px",
					background: "var(--place-surface-1)",
					border: "1px solid var(--place-border-default)",
					backdropFilter: "blur(20px)",
					WebkitBackdropFilter: "blur(20px)",
					boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
				}}
				initial={{ opacity: 0, scale: 0.95, y: -4 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: -4 }}
				transition={{ duration: 0.12 }}
			>
				{/* Header */}
				<div
					className="px-3 py-1.5"
					style={{
						color: "var(--place-text-tertiary)",
						fontSize: "0.65rem",
						fontWeight: 500,
						textTransform: "uppercase",
						letterSpacing: "0.06em",
					}}
				>
					Send to…
				</div>

				{targets.length === 0 && (
					<div
						className="px-3 py-2"
						style={{ color: "var(--place-text-secondary)", fontSize: "0.75rem" }}
					>
						No targets available
					</div>
				)}

				{targets.map((target) => (
					<button
						key={target.appId}
						type="button"
						onClick={() => handleSend(target.appId)}
						className="flex items-center gap-2 px-3 py-2 text-left transition-colors rounded-[6px]"
						style={{
							color: "var(--place-text-primary)",
							fontSize: "0.8rem",
							background: "transparent",
							border: "none",
							cursor: "pointer",
						}}
						onMouseEnter={(e) => {
							(e.currentTarget as HTMLButtonElement).style.background =
								"rgba(255,255,255,0.04)";
						}}
						onMouseLeave={(e) => {
							(e.currentTarget as HTMLButtonElement).style.background =
								"transparent";
						}}
					>
						<TargetIcon appId={target.appId} />
						<span>{target.label}</span>
					</button>
				))}
			</motion.div>
		</AnimatePresence>
	);

	if (typeof document === "undefined") return null;
	return createPortal(menuEl, document.body);
}

// ----------------------------------------------------------------------------
// Tiny icon per target — keeps file small, uses simple Unicode symbols
// ----------------------------------------------------------------------------

function TargetIcon({ appId }: { readonly appId: string }) {
	const icon = TARGET_ICONS[appId] ?? ">";

	return (
		<span
			style={{
				width: "16px",
				height: "16px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: "0.75rem",
				opacity: 0.7,
			}}
		>
			{icon}
		</span>
	);
}

const TARGET_ICONS: Record<string, string> = {
	"brain-dump": "\u{1F4AD}",
	tasks: "\u{2705}",
	journal: "\u{1F4D3}",
};
