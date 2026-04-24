import { useProjection } from "../lib/ipc";
import { mockTopbar } from "../app/mock-projections";

export function OrgSelector() {
  const topbar = useProjection("topbar");
  const orgs = topbar?.orgs ?? mockTopbar.orgs;
  const current = topbar?.current_org ?? mockTopbar.current_org;

  return (
    <select
      className="ema-selector ema-selector--org"
      value={current?.id ?? ""}
      onChange={(e) => {
        /* TODO(ema-0.0.5): dispatch a "select org" IPC command */
        void e;
      }}
      disabled={orgs.length === 0}
    >
      {orgs.length === 0 && <option value="">(no orgs)</option>}
      {orgs.map((o: { id: string; name: string }) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
