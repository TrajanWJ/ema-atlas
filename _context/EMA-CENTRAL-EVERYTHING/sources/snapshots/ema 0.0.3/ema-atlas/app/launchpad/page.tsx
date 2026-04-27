import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

import { statusLabel, vapps } from "../vapps/_data";

/**
 * Launchpad — Win8 / Start-screen style top-level shell.
 *
 * Expresses the PRD rule that Launchpad is the entry point into work, not
 * another dashboard. Reads surfaces from app/vapps/_data.ts (single source
 * of truth) and tiles them; each tile links into its brief at /vapps/<slug>.
 * The shell owns no state; this is strictly a render over the vApp catalog.
 */

const tileSpan: Record<string, { col: number; row: number }> = {
  "virtual-desktop": { col: 2, row: 2 },
  hq: { col: 2, row: 1 },
  launchpad: { col: 1, row: 1 },
  wiki: { col: 2, row: 1 },
  chat: { col: 1, row: 2 },
  "threads-server": { col: 1, row: 1 },
  "agent-virtual-environment": { col: 2, row: 1 },
  blueprint: { col: 1, row: 1 },
};

export default function LaunchpadPage() {
  const shells = vapps.filter((v) => v.group === "shell");
  const apps = vapps.filter((v) => v.group === "vapp");

  return (
    <SiteShell
      eyebrow="Top-level shell"
      title="Launchpad"
      intro="Win8-style start screen over the named EMA surfaces. Not a dashboard: an entry point. Every tile reads from the vApp catalog and links into the brief — the shell owns no state."
    >
      <section className="launchpad">
        <div className="launchpad__meta">
          <div className="launchpad__clock">
            <span className="launchpad__time">—:—</span>
            <span className="launchpad__date">Project / Personal</span>
          </div>
          <div className="launchpad__hint">
            <span className="panel__label">Hosted by</span>
            <p>
              Virtual Desktop. Launchpad is reachable from the dock, from{" "}
              <code>⌘ Space</code> in later slices, and as a direct route
              during atlas.
            </p>
          </div>
        </div>

        <div className="launchpad__group">
          <p className="panel__tag">Shells</p>
          <div className="launchpad__grid launchpad__grid--shells">
            {shells.map((v) => {
              const span = tileSpan[v.slug] ?? { col: 1, row: 1 };
              return (
                <Link
                  key={v.slug}
                  href={`/vapps/${v.slug}`}
                  className={`tile tile--shell tile--col-${span.col} tile--row-${span.row}`}
                >
                  <div className="tile__head">
                    <span className="tile__kind">Shell</span>
                    <span
                      className={`vapp-card__status vapp-card__status--${v.status}`}
                    >
                      {statusLabel(v.status)}
                    </span>
                  </div>
                  <h3 className="tile__title">{v.name}</h3>
                  <p className="tile__copy">{v.oneLiner}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="launchpad__group">
          <p className="panel__tag">vApps</p>
          <div className="launchpad__grid">
            {apps.map((v) => {
              const span = tileSpan[v.slug] ?? { col: 1, row: 1 };
              return (
                <Link
                  key={v.slug}
                  href={`/vapps/${v.slug}`}
                  className={`tile tile--col-${span.col} tile--row-${span.row}`}
                >
                  <div className="tile__head">
                    <span className="tile__kind">vApp</span>
                    <span
                      className={`vapp-card__status vapp-card__status--${v.status}`}
                    >
                      {statusLabel(v.status)}
                    </span>
                  </div>
                  <h3 className="tile__title">{v.name}</h3>
                  <p className="tile__copy">{v.oneLiner}</p>
                  <span className="tile__foot">
                    Slice — {v.smallestSlice.split(".")[0]}.
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <footer className="launchpad__dock">
          {["Launchpad", "HQ", "Chat", "Wiki", "Threads", "Desktop"].map(
            (label) => (
              <div className="dock__item" key={label}>
                <span className="dock__glyph" />
                <span className="dock__label">{label}</span>
              </div>
            )
          )}
        </footer>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/vapps">
            Surface catalog
          </Link>
          <Link className="chip" href="/desktop">
            Virtual Desktop
          </Link>
          <Link className="chip" href="/parts/shells-surfaces">
            Shells / Surfaces brief
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
