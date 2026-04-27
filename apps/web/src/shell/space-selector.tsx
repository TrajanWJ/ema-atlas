import { useProjection } from "../lib/ipc";
import { mockTopbar } from "../app/mock-projections";

const GENERIC_SPACE_NAMES = new Set(["Personal Workspace"]);

export function SpaceSelector() {
  const topbar = useProjection("topbar");
  const projectedCurrent = topbar?.current_space;
  const useSeedScope =
    !projectedCurrent || GENERIC_SPACE_NAMES.has(projectedCurrent.name);
  const spaces =
    !useSeedScope && topbar?.spaces?.length ? topbar.spaces : mockTopbar.spaces;
  const current =
    !useSeedScope &&
    projectedCurrent &&
    spaces.some((space: { id: string }) => space.id === projectedCurrent.id)
      ? projectedCurrent
      : mockTopbar.current_space;

  return (
    <select
      className="ema-selector ema-selector--space"
      value={current?.id ?? ""}
      onChange={(e) => {
        /* TODO(ema-0.0.5): dispatch a "select space" IPC command */
        void e;
      }}
      disabled={spaces.length === 0}
    >
      {spaces.length === 0 && <option value="">Space unavailable</option>}
      {spaces.map((s: { id: string; name: string }) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
