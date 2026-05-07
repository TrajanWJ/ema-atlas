"use client";

import { useCallback, useEffect, useState } from "react";
import type { AtlasLiveState } from "@/src/lib/atlas-live";

type LoadState = {
	readonly data: AtlasLiveState | null;
	readonly loading: boolean;
	readonly error: string | null;
};

export function useAtlasLiveState(intervalMs = 15_000): LoadState {
	const [state, setState] = useState<LoadState>({
		data: null,
		loading: true,
		error: null,
	});

	const load = useCallback(async () => {
		try {
			const response = await fetch("/api/atlas-live", { cache: "no-store" });
			if (!response.ok) throw new Error(`Atlas live read failed: ${response.status}`);
			const data = (await response.json()) as AtlasLiveState;
			setState({ data, loading: false, error: null });
		} catch (error) {
			setState((current) => ({
				data: current.data,
				loading: false,
				error: error instanceof Error ? error.message : String(error),
			}));
		}
	}, []);

	useEffect(() => {
		void load();
		const timer = window.setInterval(() => void load(), intervalMs);
		const handleVisibility = () => {
			if (document.visibilityState === "visible") void load();
		};
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [intervalMs, load]);

	return state;
}

export function formatAtlasTime(value: string): string {
	if (!value) return "unknown";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}
