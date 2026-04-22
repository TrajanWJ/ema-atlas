'use client';

import { useEffect, useCallback } from "react";
import { useDesktopIconsStore } from "@/src/stores/desktop-icons-store";
import { DesktopIcon } from "./DesktopIcon";

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function DesktopIconLayer() {
	const icons = useDesktopIconsStore((s) => s.icons);
	const selectIcon = useDesktopIconsStore((s) => s.selectIcon);
	const loadPositions = useDesktopIconsStore((s) => s.loadPositions);

	// Load persisted positions once on mount
	useEffect(() => {
		void loadPositions();
	}, [loadPositions]);

	// Deselect when clicking the background
	const handleBackgroundClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const target = e.target as HTMLElement;
			const isIcon = target.closest("[data-desktop-icon]") !== null;
			if (!isIcon) {
				selectIcon(null);
			}
		},
		[selectIcon],
	);

	return (
		<div
			aria-label="Desktop icons"
			style={{
				position: "absolute",
				inset: 0,
				// Positioned between background (z=0) and windows (z=10+)
				zIndex: 5,
				pointerEvents: "none",
			}}
			onClick={handleBackgroundClick}
		>
			{icons.map((icon) => (
				<div
					key={icon.id}
					style={{ pointerEvents: "auto" }}
				>
					<DesktopIcon icon={icon} />
				</div>
			))}
		</div>
	);
}
