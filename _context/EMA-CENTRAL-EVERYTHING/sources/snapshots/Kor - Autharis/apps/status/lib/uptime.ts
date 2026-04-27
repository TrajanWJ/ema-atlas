import { pingsSince, type PingRow } from "./db";

export type Bucket = "ok" | "partial" | "outage" | "nodata";

export interface DayBucket {
  /** Day index, 0 = 89 days ago, 89 = today. */
  index: number;
  /** Start of day (local) in unix ms. */
  dayStart: number;
  bucket: Bucket;
  total: number;
  ok: number;
  avgLatencyMs: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Roll up the last 90 days of pings into daily buckets.
 * - ok: all pings succeeded
 * - partial: some succeeded, some failed
 * - outage: all failed
 * - nodata: no pings that day
 */
export function rollup90Days(service: string, now: number = Date.now()): DayBucket[] {
  const todayStart = startOfDay(now);
  const windowStart = todayStart - 89 * MS_PER_DAY;
  const rows = pingsSince(service, windowStart);
  return bucketPings(rows, todayStart);
}

export function bucketPings(rows: PingRow[], todayStart: number): DayBucket[] {
  const buckets: DayBucket[] = [];
  for (let i = 0; i < 90; i++) {
    const dayStart = todayStart - (89 - i) * MS_PER_DAY;
    buckets.push({
      index: i,
      dayStart,
      bucket: "nodata",
      total: 0,
      ok: 0,
      avgLatencyMs: null,
    });
  }
  const latencyTotals: number[] = new Array(90).fill(0);
  const latencyCounts: number[] = new Array(90).fill(0);
  for (const row of rows) {
    const idx = Math.floor((startOfDay(row.ts) - buckets[0].dayStart) / MS_PER_DAY);
    if (idx < 0 || idx >= 90) continue;
    const b = buckets[idx];
    b.total += 1;
    if (row.ok) b.ok += 1;
    if (row.latency_ms != null) {
      latencyTotals[idx] += row.latency_ms;
      latencyCounts[idx] += 1;
    }
  }
  for (let i = 0; i < 90; i++) {
    const b = buckets[i];
    if (b.total === 0) {
      b.bucket = "nodata";
    } else if (b.ok === b.total) {
      b.bucket = "ok";
    } else if (b.ok === 0) {
      b.bucket = "outage";
    } else {
      b.bucket = "partial";
    }
    if (latencyCounts[i] > 0) {
      b.avgLatencyMs = Math.round(latencyTotals[i] / latencyCounts[i]);
    }
  }
  return buckets;
}

export function uptimePct(buckets: DayBucket[]): number {
  let ok = 0;
  let total = 0;
  for (const b of buckets) {
    ok += b.ok;
    total += b.total;
  }
  if (total === 0) return 100;
  return Math.round((ok / total) * 1000) / 10;
}

export function overallHealth(
  allBuckets: Record<string, DayBucket[]>,
): "ok" | "partial" | "outage" | "nodata" {
  const today = Object.values(allBuckets).map((bs) => bs[bs.length - 1]?.bucket);
  if (today.length === 0) return "nodata";
  if (today.every((b) => b === "ok")) return "ok";
  if (today.every((b) => b === "nodata")) return "nodata";
  if (today.some((b) => b === "outage")) return "outage";
  return "partial";
}
