import { useProjection } from "../lib/ipc";
import { mockTopbar } from "../app/mock-projections";

export function ProjectSelector() {
  const topbar = useProjection("topbar");
  const projects = topbar?.projects?.length ? topbar.projects : mockTopbar.projects;
  const projectedCurrent = topbar?.current_project;
  const current = projectedCurrent && projects.some((project: { id: string }) => project.id === projectedCurrent.id)
    ? projectedCurrent
    : mockTopbar.current_project;

  return (
    <select
      className="ema-selector ema-selector--project"
      value={current?.id ?? ""}
      onChange={(e) => {
        /* TODO(ema-0.0.5): dispatch a "select project" IPC command */
        void e;
      }}
      disabled={projects.length === 0}
    >
      {projects.length === 0 && <option value="">Project unavailable</option>}
      {projects.map((p: { id: string; name: string }) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
