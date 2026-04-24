import { useProjection } from "../lib/ipc";
import { mockTopbar } from "../app/mock-projections";

export function SpaceSelector() {
  const topbar = useProjection("topbar");
  const spaces = topbar?.spaces ?? mockTopbar.spaces;
  const current = topbar?.current_space ?? mockTopbar.current_space;

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
      {spaces.length === 0 && <option value="">(no spaces)</option>}
      {spaces.map((s: { id: string; name: string }) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
