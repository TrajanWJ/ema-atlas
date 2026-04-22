'use client';

// ----------------------------------------------------------------------------
// Bottom bar: Save button + pipe count
// ----------------------------------------------------------------------------

interface BottomBarProps {
	readonly pipeCount: number;
	readonly canSave: boolean;
	readonly onSave: () => void;
	readonly onClear: () => void;
}

export function BottomBar({
	pipeCount,
	canSave,
	onSave,
	onClear,
}: BottomBarProps) {
	return (
		<div
			className="flex items-center justify-between px-3 py-2"
			style={{
				borderTop: "1px solid var(--place-border-default)",
				background: "transparent",
				fontSize: "0.65rem",
			}}
		>
			<span style={{ color: "var(--place-text-secondary)" }}>
				{pipeCount} pipe{pipeCount !== 1 ? "s" : ""}
			</span>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={onClear}
					style={{
						background: "transparent",
						color: "var(--place-text-secondary)",
						border: "1px solid var(--place-border-default)",
						borderRadius: "6px",
						padding: "0.25rem 0.5rem",
						cursor: "pointer",
						fontSize: "0.65rem",
					}}
				>
					Clear Canvas
				</button>
				<button
					type="button"
					onClick={onSave}
					disabled={!canSave}
					style={{
						background: canSave
							? "var(--place-primary-subtle)"
							: "rgba(255,255,255,0.03)",
						color: canSave
							? "var(--place-primary-400)"
							: "var(--place-text-secondary)",
						border: canSave
							? "1px solid var(--place-primary-border)"
							: "1px solid var(--place-border-default)",
						borderRadius: "6px",
						padding: "0.25rem 0.5rem",
						cursor: canSave ? "pointer" : "not-allowed",
						fontSize: "0.65rem",
						opacity: canSave ? 1 : 0.5,
					}}
				>
					Save Pipe
				</button>
			</div>
		</div>
	);
}
