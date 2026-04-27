import { OrgSelector } from "./org-selector";
import { SpaceSelector } from "./space-selector";
import { ProjectSelector } from "./project-selector";
import { ConnectorsIndicator } from "./connectors-indicator";
import { MOCK_PROJECTION_LABEL, mockTopbar } from "../app/mock-projections";
import { useTopbar } from "../place-reflection";

/**
 * Topbar — always renders three selectors (org / space / project),
 * plus the connectors indicator (lit when any connector is connected).
 *
 * Consumes the daemon's `topbar` projection via `useTopbar` (see
 * `place-reflection/projections/use-topbar.ts`). When the daemon has
 * not delivered a snapshot, falls back to `mockTopbar` and surfaces
 * a visible `staged projection` badge per honest-mocks doctrine.
 */
export function Topbar() {
  const topbar = useTopbar();
  const rawProjects = topbar.raw?.projects ?? [];
  const projects = rawProjects.length ? rawProjects : mockTopbar.projects;
  const projectedCurrent = topbar.scope.project;
  const current =
    projectedCurrent && projects.some((project) => project.id === projectedCurrent.id)
      ? projectedCurrent
      : mockTopbar.current_project;

  const offline = topbar.offline;

  return (
    <header className="ema-topbar" data-offline={offline ? "true" : "false"}>
      <div className="ema-topbar__brand" aria-label="EMA HQ">
        <span>EMA</span>
        <small>0.0.5</small>
      </div>

      <div className="ema-topbar__selectors">
        <OrgSelector />
        <span className="ema-topbar__sep">/</span>
        <SpaceSelector />
        <span className="ema-topbar__sep">/</span>
        <ProjectSelector />
      </div>

      <div className="ema-topbar__project-sense">
        <span>project</span>
        <strong>{current.name}</strong>
      </div>

      <div className="ema-topbar__right">
        <ConnectorsIndicator />
        {offline && (
          <span className="ema-topbar__badge">{MOCK_PROJECTION_LABEL}</span>
        )}
      </div>
    </header>
  );
}
