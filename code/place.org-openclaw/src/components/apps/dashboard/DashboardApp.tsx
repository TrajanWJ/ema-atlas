'use client';

import { useEffect } from "react";
import { useDashboardStore } from "@/src/stores/dashboard-store";
import { OneThingWidget } from "./OneThingWidget";
import { MetricsPanel } from "./MetricsPanel";
import { GoalCascade } from "./GoalCascade";

export function DashboardApp() {
	const loadToday = useDashboardStore((s) => s.loadToday);

	useEffect(() => {
		loadToday().catch(() => {});
	}, [loadToday]);

	return (
		<div className="flex h-full flex-col" style={{ overflowY: "auto" }}>
			<OneThingWidget />
			<MetricsPanel />
			<GoalCascade />
		</div>
	);
}
