'use client';

import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import { useWindowStore } from "@/src/stores/window-store";
import { Window } from "./Window";
import type { AppId } from "@/src/types/window";
import type { ReactNode } from "react";

const BrainDumpApp = dynamic(
	() =>
		import("@/src/components/apps/brain-dump/BrainDumpApp").then(
			(m) => m.BrainDumpApp,
		),
	{ ssr: false },
);

const JournalApp = dynamic(
	() =>
		import("@/src/components/apps/journal/JournalApp").then(
			(m) => m.JournalApp,
		),
	{ ssr: false },
);

const FocusApp = dynamic(
	() =>
		import("@/src/components/apps/focus/FocusApp").then(
			(m) => m.FocusApp,
		),
	{ ssr: false },
);

const TerminalApp = dynamic(
	() =>
		import("@/src/components/apps/terminal/TerminalApp").then(
			(m) => m.TerminalApp,
		),
	{ ssr: false },
);

const DashboardApp = dynamic(
	() =>
		import("@/src/components/apps/dashboard/DashboardApp").then(
			(m) => m.DashboardApp,
		),
	{ ssr: false },
);

const ClockApp = dynamic(
	() =>
		import("@/src/components/apps/clock/ClockApp").then(
			(m) => m.ClockApp,
		),
	{ ssr: false },
);

const SettingsApp = dynamic(
	() =>
		import("@/src/components/apps/settings/SettingsApp").then(
			(m) => m.SettingsApp,
		),
	{ ssr: false },
);

const TasksApp = dynamic(
	() =>
		import("@/src/components/apps/tasks/TasksApp").then(
			(m) => m.TasksApp,
		),
	{ ssr: false },
);

const HabitsApp = dynamic(
	() =>
		import("@/src/components/apps/habits/HabitsApp").then(
			(m) => m.HabitsApp,
		),
	{ ssr: false },
);

const ReviewApp = dynamic(
	() =>
		import("@/src/components/apps/review/ReviewApp").then(
			(m) => m.ReviewApp,
		),
	{ ssr: false },
);

const MusicApp = dynamic(
	() =>
		import("@/src/components/apps/music/MusicApp").then(
			(m) => m.MusicApp,
		),
	{ ssr: false },
);

const CalculatorApp = dynamic(
	() =>
		import("@/src/components/apps/calculator/CalculatorApp").then(
			(m) => m.CalculatorApp,
		),
	{ ssr: false },
);

function ComingSoon({ appId }: { readonly appId: AppId }) {
	return (
		<div
			className="flex h-full items-center justify-center"
			style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
		>
			{appId} — Coming soon
		</div>
	);
}

function AppContent({ appId }: { readonly appId: AppId }): ReactNode {
	if (appId === "brain-dump") return <BrainDumpApp />;
	if (appId === "journal") return <JournalApp />;
	if (appId === "focus") return <FocusApp />;
	if (appId === "terminal") return <TerminalApp />;
	if (appId === "dashboard") return <DashboardApp />;
	if (appId === "clock") return <ClockApp />;
	if (appId === "settings") return <SettingsApp />;
	if (appId === "tasks") return <TasksApp />;
	if (appId === "habits") return <HabitsApp />;
	if (appId === "review") return <ReviewApp />;
	if (appId === "music") return <MusicApp />;
	if (appId === "calculator") return <CalculatorApp />;
	return <ComingSoon appId={appId} />;
}

export function WindowManager() {
	const windows = useWindowStore((s) => s.windows);

	return (
		<div className="pointer-events-none absolute inset-0 top-10 bottom-12">
			<AnimatePresence>
				{[...windows.values()].map((win) => (
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
