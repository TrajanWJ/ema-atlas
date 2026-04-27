/**
 * Seed the uptime SQLite DB with 90 days of synthetic pings and one past
 * incident so the dashboard has real data before the pinger runs for real.
 *
 * Usage:
 *   pnpm --filter @autharis/status seed
 *   # or
 *   tsx scripts/seed.ts
 */
import { SERVICES } from "../lib/services";
import { getDb, openIncident, closeIncident, recordPing } from "../lib/db";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function seed() {
  const db = getDb();
  db.exec("DELETE FROM pings; DELETE FROM incidents;");

  const now = Date.now();
  const todayStart = startOfDay(now);

  // 90-day synthetic history: 4 pings/day per service, mostly ok, rare blips.
  for (const svc of SERVICES) {
    for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
      const dayStart = todayStart - dayOffset * MS_PER_DAY;
      for (let i = 0; i < 4; i++) {
        const ts = dayStart + i * 6 * 60 * 60 * 1000;
        if (ts > now) continue;
        // Deterministic but varied: simulate a degradation 42 days ago for `matching`,
        // and a short blip 7 days ago for `events`.
        let ok = true;
        if (svc.id === "matching" && dayOffset === 42) {
          ok = i !== 1; // one failed ping
        }
        if (svc.id === "events" && dayOffset === 7 && i === 2) {
          ok = false;
        }
        const latency =
          60 + Math.floor(((ts / 1000) % 40)) + (ok ? 0 : 900);
        recordPing(svc.id, ts, ok, latency);
      }
    }
  }

  // One synthetic past incident (closed) + one older one (closed).
  const matchingOpened = todayStart - 42 * MS_PER_DAY + 6 * 60 * 60 * 1000;
  const matchingClosed = matchingOpened + 42 * 60 * 1000;
  const mid = openIncident(
    "matching",
    matchingOpened,
    "FastAPI worker stalled on cold taxonomy load; fixed by preloading synonyms at boot (F7).",
  );
  closeIncident(mid, matchingClosed);

  const eventsOpened = todayStart - 7 * MS_PER_DAY + 12 * 60 * 60 * 1000;
  const eventsClosed = eventsOpened + 9 * 60 * 1000;
  const eid = openIncident(
    "events",
    eventsOpened,
    "Bun WS gateway dropped subscribers after HMAC rotation; resubscribe path patched in F8.",
  );
  closeIncident(eid, eventsClosed);

  console.log(
    `seeded ${SERVICES.length} services x 90 days of pings + 2 closed incidents.`,
  );
}

seed();
