'use client';

interface WindowTitleBarProps {
	readonly appName: string;
	readonly onMinimize: () => void;
	readonly onMaximize: () => void;
	readonly onClose: () => void;
}

export function WindowTitleBar({
	appName,
	onMinimize,
	onMaximize,
	onClose,
}: WindowTitleBarProps) {
	return (
		<div
			className="drag-handle flex h-9 items-center justify-between px-3 select-none"
			style={{
				borderBottom: "1px solid var(--border)",
				cursor: "grab",
			}}
		>
			{/* Traffic lights */}
			<div className="flex items-center gap-1.5">
				<button
					type="button"
					onClick={onClose}
					aria-label="Close window"
					className="h-3 w-3 rounded-full transition-opacity hover:opacity-80"
					style={{ backgroundColor: "var(--accent-urgent)" }}
				/>
				<button
					type="button"
					onClick={onMinimize}
					aria-label="Minimize window"
					className="h-3 w-3 rounded-full transition-opacity hover:opacity-80"
					style={{ backgroundColor: "var(--accent-warm)" }}
				/>
				<button
					type="button"
					onClick={onMaximize}
					aria-label="Maximize window"
					className="h-3 w-3 rounded-full transition-opacity hover:opacity-80"
					style={{ backgroundColor: "var(--accent-success)" }}
				/>
			</div>

			{/* App name */}
			<span
				style={{
					color: "var(--text-secondary)",
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

			{/* Spacer to balance layout */}
			<div className="w-12" />
		</div>
	);
}
