"use client";

import { Suspense, useMemo } from "react";
import { GitBranch, Layers3 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useSessionStore } from "@/stores/session-store";
import { useSystemStore } from "@/stores/system-store";
import { SavedViewBar } from "@/components/ui/SavedViewBar";
import { ViewModeSwitcher } from "@/components/ui/ViewModeSwitcher";
import { useViewUrlState } from "@/hooks/useViewUrlState";
import { WorkstreamCard, type WorkstreamSeed } from "@/components/workstreams/WorkstreamCard";
import { WorkstreamDetail } from "@/components/workstreams/WorkstreamDetail";
import { StatusChip } from "@/components/ui/StatusChip";

const SAVED_VIEWS = ["All Workstreams", "Active", "Needs Review"];

function summarizeWorkstream(seed: WorkstreamSeed) {
  return `${seed.sessions.length} sessions, ${seed.tasks.length} tasks, ${seed.tasks.filter((task) => task.status === "review").length} review`;
}

function WorkstreamsPageInner() {
  const { projects, sessions } = useSessionStore();
  const { tasks } = useSystemStore();
  const { state, setFocus, setView } = useViewUrlState({ defaultView: "board" });

  const activeSavedView = useMemo(() => {
    const raw = state.focus?.startsWith("view:") ? state.focus.slice(5) : null;
    return SAVED_VIEWS.includes(raw ?? "") ? (raw as string) : "All Workstreams";
  }, [state.focus]);

  const workstreams = useMemo<WorkstreamSeed[]>(() => {
    return projects.map((project) => {
      const projectSessions = sessions.filter((session) => session.projectId === project.id);
      const projectTasks = tasks.filter((task) => task.projectName === project.name || projectSessions.some((session) => session.id === task.sessionId));
      return {
        id: project.id,
        title: project.name,
        summary: `Location-backed lane seeded from current sessions and tasks: ${summarizeWorkstream({ id: project.id, title: project.name, summary: "", project, sessions: projectSessions, tasks: projectTasks })}`,
        project,
        sessions: projectSessions,
        tasks: projectTasks,
      };
    });
  }, [projects, sessions, tasks]);

  const filteredWorkstreams = useMemo(() => {
    switch (activeSavedView) {
      case "Active":
        return workstreams.filter((stream) => stream.sessions.some((session) => session.status === "active"));
      case "Needs Review":
        return workstreams.filter((stream) => stream.tasks.some((task) => task.status === "review"));
      case "All Workstreams":
      default:
        return workstreams;
    }
  }, [activeSavedView, workstreams]);

  const selectedId = state.focus?.startsWith("workstream:") ? state.focus.slice("workstream:".length) : filteredWorkstreams[0]?.id ?? null;
  const selectedWorkstream = filteredWorkstreams.find((stream) => stream.id === selectedId) ?? filteredWorkstreams[0];
  const reviewCount = filteredWorkstreams.filter((stream) => stream.tasks.some((task) => task.status === "review")).length;
  const activeCount = filteredWorkstreams.filter((stream) => stream.sessions.some((session) => session.status === "active")).length;

  const handleSavedView = (view: string) => setFocus(`view:${view}`);
  const handleSelectWorkstream = (id: string) => setFocus(`workstream:${id}`);

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <GitBranch size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="text-lg font-semibold">Workstreams</h1>
            <StatusChip tone="info">Live workstream seed</StatusChip>
          </div>
          <p className="text-sm text-text-secondary mt-1 max-w-3xl">
            This page now groups the real app’s project locations, sessions, and tasks into authoritative lanes. It is still seeded data, but it’s the first concrete bridge toward EMA’s workstream model.
          </p>
        </div>

        <div className="px-6 py-4 border-b border-border bg-sidebar/30 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SavedViewBar views={SAVED_VIEWS} activeView={activeSavedView} onSelect={handleSavedView} />
            <ViewModeSwitcher value={state.view === "list" ? "list" : "board"} onChange={setView} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1"><Layers3 size={12} /> {filteredWorkstreams.length} visible workstreams</span>
            <StatusChip tone="success">{activeCount} active</StatusChip>
            <StatusChip tone="warning">{reviewCount} need review</StatusChip>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {state.view === "list" ? (
            <div className="h-full overflow-y-auto p-6 space-y-4">
              {filteredWorkstreams.map((stream) => (
                <WorkstreamCard
                  key={stream.id}
                  workstream={stream}
                  active={selectedWorkstream?.id === stream.id}
                  onSelect={() => handleSelectWorkstream(stream.id)}
                />
              ))}
              {filteredWorkstreams.length === 0 ? <div className="text-sm text-text-muted text-center py-12">No workstreams visible in this view.</div> : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] h-full overflow-hidden">
              <div className="border-r border-border overflow-y-auto p-6 space-y-4 bg-sidebar/20">
                {filteredWorkstreams.map((stream) => (
                  <WorkstreamCard
                    key={stream.id}
                    workstream={stream}
                    active={selectedWorkstream?.id === stream.id}
                    onSelect={() => handleSelectWorkstream(stream.id)}
                  />
                ))}
                {filteredWorkstreams.length === 0 ? <div className="text-sm text-text-muted text-center py-12">No workstreams visible in this view.</div> : null}
              </div>
              <div className="overflow-y-auto">
                <WorkstreamDetail workstream={selectedWorkstream} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function WorkstreamsPage() {
  return (
    <Suspense fallback={<Layout><div className="px-6 py-10 text-sm text-text-muted">Loading workstreams view…</div></Layout>}>
      <WorkstreamsPageInner />
    </Suspense>
  );
}
