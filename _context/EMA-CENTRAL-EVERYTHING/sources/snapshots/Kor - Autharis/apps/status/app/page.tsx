import { SERVICES } from "../lib/services";
import { rollup90Days, uptimePct, overallHealth, type DayBucket } from "../lib/uptime";
import { UptimeGrid } from "../components/UptimeGrid";

export const dynamic = "force-dynamic";

const OVERALL_LABEL: Record<
  "ok" | "partial" | "outage" | "nodata",
  { title: string; sub: string }
> = {
  ok: {
    title: "All systems operational",
    sub: "Every monitored service responded ok on the latest sweep.",
  },
  partial: {
    title: "Partial degradation",
    sub: "One or more services reported failures today.",
  },
  outage: {
    title: "Active outage",
    sub: "At least one service is fully down right now.",
  },
  nodata: {
    title: "No recent data",
    sub: "The pinger has not run yet — seed the DB or hit /api/ping.",
  },
};

export default function StatusOverviewPage() {
  const now = Date.now();
  const byService: Record<string, DayBucket[]> = {};
  for (const svc of SERVICES) {
    byService[svc.id] = rollup90Days(svc.id, now);
  }
  const overall = overallHealth(byService);
  const banner = OVERALL_LABEL[overall];

  return (
    <main>
      <header style={{ marginBottom: 32 }}>
        <div className="eyebrow">Autharis status</div>
        <h1 className="display">Service health</h1>
        <p style={{ color: "var(--ink-3)", margin: "4px 0 0", maxWidth: 640 }}>
          Rolling 90-day uptime across the Autharis monorepo. Each square is one
          day; green is fully operational, amber is partial, red is an outage,
          gray is no data.
        </p>
      </header>

      <section className={`banner ${overall}`}>
        <div>
          <span className={`dot ${overall}`} />
          <strong>{banner.title}</strong>
          <div
            style={{
              color: "var(--ink-3)",
              marginTop: 4,
              fontSize: "var(--fs-sm)",
            }}
          >
            {banner.sub}
          </div>
        </div>
        <div className="mono" style={{ color: "var(--ink-3)" }}>
          {new Date(now).toISOString().replace("T", " ").slice(0, 16)}Z
        </div>
      </section>

      <section className="services">
        {SERVICES.map((svc) => {
          const buckets = byService[svc.id];
          const pct = uptimePct(buckets);
          const last = buckets[buckets.length - 1];
          return (
            <article key={svc.id} className="service-card">
              <div className="service-head">
                <div>
                  <h2>
                    <span className={`dot ${last?.bucket ?? "nodata"}`} />
                    {svc.name}
                  </h2>
                  <div className="meta">
                    Lane {svc.lane} · <span className="mono">{svc.healthz}</span>
                  </div>
                </div>
                <div className="uptime-pct">{pct.toFixed(1)}% · 90d</div>
              </div>
              <UptimeGrid buckets={buckets} />
              <div className="legend">
                <span>
                  <span className="dot ok" /> ok
                </span>
                <span>
                  <span className="dot partial" /> partial
                </span>
                <span>
                  <span className="dot outage" /> outage
                </span>
                <span>
                  <span className="dot nodata" /> no data
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
