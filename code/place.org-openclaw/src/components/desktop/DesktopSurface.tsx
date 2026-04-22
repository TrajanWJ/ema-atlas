'use client';

import { useRef } from "react";
import { useDesktopStore } from "@/src/stores/desktop-store";
import { useTimeOfDay } from "@/src/hooks/use-time-of-day";
import { useContextMenu } from "@/src/hooks/use-context-menu";
import { CursorLight } from "./CursorLight";
import { ContextMenu } from "./ContextMenu";

const GRADIENT_MAP = {
	night: "from-[#060610] via-[#080818] to-[#060610]",
	dawn: "from-[#0a0820] via-[#150d2e] to-[#0a0820]",
	morning: "from-[#0a1020] via-[#0d1530] to-[#0a1020]",
	midday: "from-[#060b18] via-[#0a1228] to-[#060b18]",
	afternoon: "from-[#080a18] via-[#0c1020] to-[#080a18]",
	sunset: "from-[#100810] via-[#1a0d18] to-[#100810]",
	evening: "from-[#080610] via-[#0e0c18] to-[#080610]",
} as const;

export function DesktopSurface() {
	useTimeOfDay();

	const surfaceRef = useRef<HTMLDivElement>(null);
	const timeOfDay = useDesktopStore((s) => s.timeOfDay);
	const gradient = GRADIENT_MAP[timeOfDay];

	const { isOpen, position, close } = useContextMenu(surfaceRef);

	return (
		<>
			<div
				ref={surfaceRef}
				className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
				style={{ transition: "background 60000ms linear" }}
			>
				<CursorLight />
			</div>
			<ContextMenu isOpen={isOpen} position={position} onClose={close} />
		</>
	);
}
