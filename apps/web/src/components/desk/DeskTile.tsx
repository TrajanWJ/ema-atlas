'use client';

import type { CSSProperties, ReactNode } from "react";

interface DeskTileProps {
	readonly title?: string;
	readonly children: ReactNode;
	readonly action?: ReactNode;
	readonly style?: CSSProperties;
}

export function DeskTile({ title, children, action, style }: DeskTileProps) {
	return (
		<div
			style={{
				background: "rgba(255, 255, 255, 0.025)",
				border: "1px solid rgba(255, 255, 255, 0.06)",
				borderRadius: "10px",
				padding: "0.75rem 0.875rem",
				display: "flex",
				flexDirection: "column",
				minHeight: 0,
				overflow: "hidden",
				...style,
			}}
		>
			{title && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: "0.5rem",
						flexShrink: 0,
					}}
				>
					<span
						style={{
							fontSize: "0.65rem",
							textTransform: "uppercase",
							letterSpacing: "0.12em",
							color: "var(--place-text-secondary, rgba(255, 255, 255, 0.45))",
							fontWeight: 600,
						}}
					>
						{title}
					</span>
					{action && <div>{action}</div>}
				</div>
			)}
			<div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>{children}</div>
		</div>
	);
}
