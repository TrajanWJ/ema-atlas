import { useProjection } from "../lib/ipc";
import { mockTopbar } from "../app/mock-projections";

const GENERIC_ORG_NAMES = new Set(["Trajan's Organization"]);

export function OrgSelector() {
  const topbar = useProjection("topbar");
  const projectedCurrent = topbar?.current_org;
  const useSeedScope =
    !projectedCurrent || GENERIC_ORG_NAMES.has(projectedCurrent.name);
  const orgs =
    !useSeedScope && topbar?.orgs?.length ? topbar.orgs : mockTopbar.orgs;
  const current =
    !useSeedScope &&
    projectedCurrent &&
    orgs.some((org: { id: string }) => org.id === projectedCurrent.id)
      ? projectedCurrent
      : mockTopbar.current_org;

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
      {orgs.length === 0 && <option value="">Org unavailable</option>}
      {orgs.map((o: { id: string; name: string }) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
