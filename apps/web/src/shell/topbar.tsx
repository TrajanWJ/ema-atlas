import { useProjection } from "../lib/ipc";
import { OrgSelector } from "./org-selector";
import { SpaceSelector } from "./space-selector";
import { ProjectSelector } from "./project-selector";
import { ConnectorsIndicator } from "./connectors-indicator";
import { MOCK_PROJECTION_LABEL, mockTopbar } from "../app/mock-projections";

/**
 * Topbar — always renders three selectors (org / space / project),
 * plus the connectors indicator (lit when any connector is connected).
 *
 * Selectors prefer daemon projections. When the daemon has not provided
 * data, the shell renders a visibly labeled mock local projection.
 */
export function Topbar() {
  const topbar = useProjection("topbar");
  const current = topbar?.current_project ?? mockTopbar.current_project;

  const offline = topbar == null;

  return (
    <header className="ema-topbar" data-offline={offline ? "true" : "false"}>
      <div className="ema-topbar__brand" aria-label="EMA home">
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
