'use client';

import dynamic from "next/dynamic";
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

const NotesApp = dynamic(
	() =>
		import("@/src/components/apps/notes/NotesApp").then(
			(m) => m.NotesApp,
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

const AboutPlaceApp = dynamic(
	() =>
		import("@/src/components/apps/about-place/AboutPlaceApp").then(
			(m) => m.AboutPlaceApp,
		),
	{ ssr: false },
);

const AboutTrajanApp = dynamic(
	() =>
		import("@/src/components/apps/about-trajan/AboutTrajanApp").then(
			(m) => m.AboutTrajanApp,
		),
	{ ssr: false },
);

const SystemMonitorApp = dynamic(
	() =>
		import("@/src/components/apps/system-monitor/SystemMonitorApp").then(
			(m) => m.SystemMonitorApp,
		),
	{ ssr: false },
);

const FinderApp = dynamic(
	() =>
		import("@/src/components/apps/finder/FinderApp").then(
			(m) => m.FinderApp,
		),
	{ ssr: false },
);

const PhotosApp = dynamic(
	() =>
		import("@/src/components/apps/photos/PhotosApp").then(
			(m) => m.PhotosApp,
		),
	{ ssr: false },
);

const PipesApp = dynamic(
	() =>
		import("@/src/components/apps/pipes/PipesApp").then(
			(m) => m.PipesApp,
		),
	{ ssr: false },
);

const DocumentViewer = dynamic(
	() =>
		import("@/src/components/apps/documents/DocumentViewer").then(
			(m) => m.DocumentViewer,
		),
	{ ssr: false },
);

const CanvasApp = dynamic(
	() =>
		import("@/src/components/apps/canvas/CanvasApp").then(
			(m) => m.CanvasApp,
		),
	{ ssr: false },
);

const RssApp = dynamic(
	() =>
		import("@/src/components/apps/rss/RssApp").then(
			(m) => m.RssApp,
		),
	{ ssr: false },
);

const ProjectsApp = dynamic(
	() =>
		import("@/src/components/apps/projects/ProjectsApp").then(
			(m) => m.ProjectsApp,
		),
	{ ssr: false },
);

const ResponsibilitiesApp = dynamic(
	() =>
		import("@/src/components/apps/responsibilities/ResponsibilitiesApp").then(
			(m) => m.ResponsibilitiesApp,
		),
	{ ssr: false },
);

const IdeasApp = dynamic(
	() =>
		import("@/src/components/apps/ideas/IdeasApp").then((m) => m.IdeasApp),
	{ ssr: false },
);

const LoopsApp = dynamic(
	() => import("@/src/components/apps/loops/LoopsApp").then((m) => m.LoopsApp),
	{ ssr: false },
);

const StuckApp = dynamic(
	() => import("@/src/components/apps/stuck/StuckApp").then((m) => m.StuckApp),
	{ ssr: false },
);

const AvoidingApp = dynamic(
	() => import("@/src/components/apps/avoiding/AvoidingApp").then((m) => m.AvoidingApp),
	{ ssr: false },
);

const DecisionsApp = dynamic(
	() => import("@/src/components/apps/decisions/DecisionsApp").then((m) => m.DecisionsApp),
	{ ssr: false },
);

const LearningApp = dynamic(
	() => import("@/src/components/apps/learning/LearningApp").then((m) => m.LearningApp),
	{ ssr: false },
);

const QuestionsApp = dynamic(
	() => import("@/src/components/apps/questions/QuestionsApp").then((m) => m.QuestionsApp),
	{ ssr: false },
);

const ContactsApp = dynamic(
	() => import("@/src/components/apps/contacts/ContactsApp").then((m) => m.ContactsApp),
	{ ssr: false },
);

const PlateApp = dynamic(
	() => import("@/src/components/apps/plate/PlateApp").then((m) => m.PlateApp),
	{ ssr: false },
);

const RewindApp = dynamic(
	() => import("@/src/components/apps/rewind/RewindApp").then((m) => m.RewindApp),
	{ ssr: false },
);

function ComingSoon({ appId }: { readonly appId: AppId }) {
	return (
		<div
			className="flex h-full items-center justify-center"
			style={{ color: "var(--place-text-secondary)", fontSize: "0.875rem" }}
		>
			{appId} — Coming soon
		</div>
	);
}

export function AppContent({ appId }: { readonly appId: AppId }): ReactNode {
	if (appId === "brain-dump") return <BrainDumpApp />;
	if (appId === "journal") return <JournalApp />;
	if (appId === "focus") return <FocusApp />;
	if (appId === "terminal") return <TerminalApp />;
	if (appId === "clock") return <ClockApp />;
	if (appId === "settings") return <SettingsApp />;
	if (appId === "tasks") return <TasksApp />;
	if (appId === "habits") return <HabitsApp />;
	if (appId === "notes") return <NotesApp />;
	if (appId === "music") return <MusicApp />;
	if (appId === "calculator") return <CalculatorApp />;
	if (appId === "about-place") return <AboutPlaceApp />;
	if (appId === "about-trajan") return <AboutTrajanApp />;
	if (appId === "system-monitor") return <SystemMonitorApp />;
	if (appId === "finder") return <FinderApp />;
	if (appId === "photos") return <PhotosApp />;
	if (appId === "pipes") return <PipesApp />;
	if (appId === "documents") return <DocumentViewer />;
	if (appId === "canvas") return <CanvasApp />;
	if (appId === "rss") return <RssApp />;
	if (appId === "projects") return <ProjectsApp />;
	if (appId === "responsibilities") return <ResponsibilitiesApp />;
	if (appId === "ideas") return <IdeasApp />;
	if (appId === "loops") return <LoopsApp />;
	if (appId === "stuck") return <StuckApp />;
	if (appId === "avoiding") return <AvoidingApp />;
	if (appId === "decisions") return <DecisionsApp />;
	if (appId === "learning") return <LearningApp />;
	if (appId === "questions") return <QuestionsApp />;
	if (appId === "contacts") return <ContactsApp />;
	if (appId === "plate") return <PlateApp />;
	if (appId === "rewind") return <RewindApp />;
	return <ComingSoon appId={appId} />;
}
