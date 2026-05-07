'use client';

import { isTouchDevice } from "@/src/lib/popout-launcher";

interface WindowTitleBarProps {
	readonly appName: string;
	readonly onMinimize: () => void;
	readonly onMaximize: () => void;
	readonly onClose: () => void;
	readonly onDetach?: () => void;
	readonly presence?: ReadonlyArray<{
		readonly actor_id: string;
		readonly display_name: string;
		readonly color: string;
	}>;
}

function DetachIcon() {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 10 10"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.25"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{/* Square */}
			<rect x="0.5" y="2.5" width="7" height="7" rx="1" />
			{/* Arrow pointing out */}
			<path d="M5.5 0.5h4v4" />
			<path d="M9.5 0.5 L5.5 4.5" />
		</svg>
	);
}

export function WindowTitleBar({
	appName,
	onMinimize,
	onMaximize,
	onClose,
	onDetach,
	presence = [],
}: WindowTitleBarProps) {
	const showDetach = onDetach && !isTouchDevice();

	return (
		<div
			className="drag-handle flex h-9 items-center justify-between px-3 select-none"
			style={{
				borderBottom: "1px solid var(--place-border-default)",
				cursor: "grab",
			}}
		>
			{/* Traffic lights */}
			<div className="flex items-center gap-1.5">
				<button
					type="button"
					onClick={onClose}
					onMouseDown={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
					aria-label="Close window"
					className="h-3 w-3 rounded-full transition-opacity hover:opacity-80"
					style={{ backgroundColor: "var(--place-error)" }}
				/>
				<button
					type="button"
					onClick={onMinimize}
					onMouseDown={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
					aria-label="Minimize window"
					className="h-3 w-3 rounded-full transition-opacity hover:opacity-80"
					style={{ backgroundColor: "var(--place-tertiary-400)" }}
				/>
				<button
					type="button"
					onClick={onMaximize}
					onMouseDown={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
					aria-label="Maximize window"
					className="h-3 w-3 rounded-full transition-opacity hover:opacity-80"
					style={{ backgroundColor: "var(--place-success)" }}
				/>
			</div>

			{/* App name */}
			<span
				style={{
					color: "var(--place-text-secondary)",
					fontSize: "0.75rem",
					fontWeight: 500,
					letterSpacing: "0.025em",
					position: "absolute",
					left: "50%",
					transform: "translateX(-50%)",
				}}
			>
				{appName}
			</span>

			{/* Right-side actions */}
			<div className="flex items-center gap-1.5">
				{presence.slice(0, 3).map((actor) => (
					<span
						key={actor.actor_id}
						title={actor.display_name}
						style={{
							border: `1px solid ${actor.color}`,
							borderRadius: 999,
							boxShadow: `0 0 12px ${actor.color}66`,
							color: "var(--place-text-primary)",
							fontSize: 10,
							fontWeight: 600,
							lineHeight: 1,
							maxWidth: 72,
							overflow: "hidden",
							padding: "3px 6px",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{actor.display_name}
					</span>
				))}
				{showDetach && (
					<button
						type="button"
						onClick={onDetach}
						onMouseDown={(e) => e.stopPropagation()}
						onPointerDown={(e) => e.stopPropagation()}
						aria-label="Detach to popout window"
						className="flex h-5 w-5 items-center justify-center rounded transition-opacity hover:opacity-80"
						style={{ color: "var(--place-text-secondary)" }}
					>
						<DetachIcon />
					</button>
				)}
			</div>
		</div>
	);
}
