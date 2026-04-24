import { useProjection } from "../lib/ipc";
import { mockTopbar } from "../app/mock-projections";

export function ProjectSelector() {
  const topbar = useProjection("topbar");
  const projects = topbar?.projects ?? mockTopbar.projects;
  const current = topbar?.current_project ?? mockTopbar.current_project;

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
      {projects.length === 0 && <option value="">(no projects)</option>}
      {projects.map((p: { id: string; name: string }) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
