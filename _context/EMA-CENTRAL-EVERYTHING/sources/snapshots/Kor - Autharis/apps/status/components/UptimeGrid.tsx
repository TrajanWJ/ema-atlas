import type { DayBucket } from "../lib/uptime";

interface Props {
  buckets: DayBucket[];
}

export function UptimeGrid({ buckets }: Props) {
  return (
    <div className="grid-row" role="img" aria-label="90-day uptime grid">
      {buckets.map((b) => {
        const date = new Date(b.dayStart).toISOString().slice(0, 10);
        const label =
          b.bucket === "nodata"
            ? `${date} — no data`
            : `${date} — ${b.ok}/${b.total} pings ok` +
              (b.avgLatencyMs != null ? ` (${b.avgLatencyMs} ms avg)` : "");
        return (
          <span
            key={b.index}
            className={`grid-cell ${b.bucket}`}
            title={label}
            aria-label={label}
          />
        );
      })}
    </div>
  );
}
