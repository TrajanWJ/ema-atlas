import { useMemo } from "react";
import type { ChronicleActivityProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../lib/ipc";

export type ChronicleActivityView = {
	data: ChronicleActivityProjection;
	offline: boolean;
};

const EMPTY_CHRONICLE: ChronicleActivityProjection = {
	source: "daemon_events",
	host_id: "local",
	events: [],
	sessions: [],
	sources: [],
};

export function useChronicleActivity(): ChronicleActivityView {
	const data = useProjection<ChronicleActivityProjection>("chronicle.activity");
	return useMemo(
		() => ({ data: data ?? EMPTY_CHRONICLE, offline: data === null }),
		[data],
	);
}
