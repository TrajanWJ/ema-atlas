'use client';

import type { ReactNode } from "react";

interface GlassPanelProps {
	readonly children: ReactNode;
	readonly className?: string;
}

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
	return (
		<div
			className={`glass ${className}`}
			style={{ contain: "layout paint style" }}
		>
			{children}
		</div>
	);
}
