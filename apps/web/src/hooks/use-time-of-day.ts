'use client';

import { useEffect } from "react";
import { useDesktopStore, getTimeOfDay } from "@/src/stores/desktop-store";

export function useTimeOfDay(): void {
	const setTimeOfDay = useDesktopStore((s) => s.setTimeOfDay);

	useEffect(() => {
		const update = () => setTimeOfDay(getTimeOfDay(new Date().getHours()));
		update();

		const id = setInterval(update, 60_000);
		return () => clearInterval(id);
	}, [setTimeOfDay]);
}
