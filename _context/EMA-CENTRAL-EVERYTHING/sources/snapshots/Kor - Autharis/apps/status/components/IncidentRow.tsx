import type { IncidentRow as IncidentRowData } from "../lib/db";
import { serviceById } from "../lib/services";

interface Props {
  incident: IncidentRowData;
}

function fmt(ts: number | null): string {
  if (ts == null) return "ongoing";
  return new Date(ts).toISOString().replace("T", " ").slice(0, 16) + "Z";
}

function durationLabel(opened: number, closed: number | null): string {
  const end = closed ?? Date.now();
  const minutes = Math.max(1, Math.round((end - opened) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 24) return `${hours}h ${rem}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function IncidentRow({ incident }: Props) {
  const svc = serviceById(incident.service);
  return (
    <div className="incident-row">
      <div className="mono" style={{ color: "var(--ink-3)" }}>
        {fmt(incident.opened_at)}
      </div>
      <div>
        <strong>{svc?.name ?? incident.service}</strong>
        <div style={{ color: "var(--ink-3)", fontSize: "var(--fs-sm)" }}>
          {incident.note}
        </div>
      </div>
      <div
        className="mono"
        style={{
          textAlign: "right",
          color: incident.closed_at == null ? "var(--neg)" : "var(--ink-3)",
        }}
      >
        {incident.closed_at == null
          ? `open · ${durationLabel(incident.opened_at, null)}`
          : `${durationLabel(incident.opened_at, incident.closed_at)}`}
      </div>
    </div>
  );
}
