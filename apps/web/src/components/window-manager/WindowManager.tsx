'use client';

import { useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { useWindowStore } from "@/src/stores/window-store";
import { useVirtualDesktopStore } from "@/src/stores/virtual-desktop-store";
import { Window } from "./Window";
import { AppContent } from "./AppContent";

export function WindowManager() {
	const windows = useWindowStore((s) => s.windows);
	const activeDesktopId = useVirtualDesktopStore((s) => s.activeDesktopId);
	const desktops = useVirtualDesktopStore((s) => s.desktops);

	const visibleWindows = useMemo(() => {
		const activeDesktop = desktops.find((d) => d.id === activeDesktopId);
		const activeIds = activeDesktop?.windowIds;
		return [...windows.values()].filter(
			(w) => activeIds?.includes(w.id) ?? true,
		);
	}, [windows, desktops, activeDesktopId]);

	return (
		<div className="pointer-events-none absolute inset-0 top-10 bottom-12" style={{ zIndex: 6 }}>
			<AnimatePresence>
				{visibleWindows.map((win) => (
					<div key={win.id} className="pointer-events-auto">
						<Window win={win}>
							<AppContent appId={win.appId} />
						</Window>
					</div>
				))}
			</AnimatePresence>
		</div>
	);
}
