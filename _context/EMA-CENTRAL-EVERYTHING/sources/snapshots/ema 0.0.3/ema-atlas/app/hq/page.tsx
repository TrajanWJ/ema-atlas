import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

import { statusLabel, vapps } from "../vapps/_data";

/**
 * HQ — personal, read-mostly top-level shell.
 *
 * Aggregates projections across the Projects/Orgs the user belongs to.
 * EMA owns truth. Hermes owns execution. HQ renders — it owns nothing.
 * Every card below is a typed projection produced by a control-plane feed
 * adapter; the shell subscribes and paints. The mock values are placeholders
 * for the smallest provable slice named in app/vapps/_data.ts for HQ.
 */

const hqEntry = vapps.find((v) => v.slug === "hq");

export default function HQPage() {
  return (
    <SiteShell
      eyebrow="Top-level shell"
      title="HQ"
      intro="Personal HQ across every Project and Org you belong to. Read-mostly by design: each panel subscribes to a typed projection from the control-plane feed adapters. HQ never writes canonical state — Hermes does, EMA stores it."
    >
      <section className="panel panel--hero">
        <p className="panel__tag">Framing</p>
        <h2 className="panel__title">A shell over projections, not a dashboard that owns data.</h2>
        <p className="panel__lede">
          Smallest provable slice, per <code>app/vapps/_data.ts</code>:{" "}
          {hqEntry?.smallestSlice ?? "running Hermes sessions + GitHub PR status — two feeds, one user."}
        </p>
        <div className="stat-ribbon">
          <div className="stat">
            <span className="stat__value">2</span>
            <span>Running Hermes sessions</span>
          </div>
          <div className="stat">
            <span className="stat__value">1</span>
            <span>Open incidents</span>
          </div>
          <div className="stat">
            <span className="stat__value">7</span>
            <span>Queue depth</span>
          </div>
          <div className="stat">
            <span className="stat__value">4m</span>
            <span>Since last dispatch</span>
          </div>
        </div>
        <div className="panel__actions">
          <span className={`vapp-card__status vapp-card__status--${hqEntry?.status ?? "planned"}`}>
            {statusLabel(hqEntry?.status ?? "planned")}
          </span>
          <Link className="chip" href="/vapps/hq">
            HQ brief
          </Link>
          <Link className="chip" href="/parts/shells-surfaces">
            Shells / Surfaces
          </Link>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Project pulse</p>
          <h2 className="panel__title">Cross-project state, projected</h2>
          <p className="panel__lede">
            Four tiles, one user, every Project/Org they touch. HQ renders the
            projection; the control plane owns the source event log.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <p className="list__eyebrow">Hermes</p>
            <h3 className="list__title">Running sessions: 2</h3>
            <p className="list__copy">atlas-swarm, proslync-dispatch. Projection; the session registry is canonical.</p>
            <span className="panel__label">Feed — control-plane session registry</span>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">Incidents</p>
            <h3 className="list__title">Open: 1</h3>
            <p className="list__copy">Queue adapter retry loop on proslync. HQ only reads the incident projection.</p>
            <span className="panel__label">Feed — incident adapter</span>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">Queue</p>
            <h3 className="list__title">Depth: 7</h3>
            <p className="list__copy">Three dispatch, four review. Projection over the dispatch event log — not the log.</p>
            <span className="panel__label">Feed — dispatch event log</span>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">Activity</p>
            <h3 className="list__title">Last dispatch: 4m ago</h3>
            <p className="list__copy">HQ samples the chronicle; Hermes owns the emission. Shell does not write.</p>
            <span className="panel__label">Feed — chronicle projection</span>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Feeds</p>
          <h2 className="panel__title">Typed projections from control-plane adapters</h2>
          <p className="panel__lede">
            Every external system reaches HQ as a typed projection behind a
            control-plane feed adapter. No adapter, no tile.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <p className="list__eyebrow">GitHub</p>
            <h3 className="list__title">PRs awaiting review: 3</h3>
            <p className="list__copy">ema-atlas #142, hermes #88, proslync #401. Typed <code>PrSummary</code> projection.</p>
            <span className="panel__label">Adapter — github.pulls</span>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">Uptime</p>
            <h3 className="list__title">All green — 99.98%</h3>
            <p className="list__copy">Synthetic probes across four surfaces. Typed <code>UptimeSnapshot</code> projection.</p>
            <span className="panel__label">Adapter — uptime.synthetic</span>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">Client portal</p>
            <h3 className="list__title">2 open threads</h3>
            <p className="list__copy">One pending reply, one awaiting NIL compliance review. Typed <code>PortalThread</code> projection.</p>
            <span className="panel__label">Adapter — portal.threads</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Open questions snapshot</p>
        <h2 className="panel__title">What the briefs are still arguing about</h2>
        <p className="panel__lede">
          Pulled by slug from <code>content/briefs/</code>. HQ names the
          open questions — it does not answer them.
        </p>
        <ul className="inline-list">
          <li>
            <span className="list__eyebrow">Q2</span>{" "}
            <span className="list__copy">Collab-plane shape — how real-time edits land as typed events, not CRDT sludge.</span>
          </li>
          <li>
            <span className="list__eyebrow">Q3</span>{" "}
            <span className="list__copy">Project ↔ Space cardinality — one-to-one, many-to-one, or user-chosen per Org.</span>
          </li>
          <li>
            <span className="list__eyebrow">Q8</span>{" "}
            <span className="list__copy">Doc sync — whether Wiki mirrors briefs or adopts them as the live authoring surface.</span>
          </li>
        </ul>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Workstream cards</p>
          <h2 className="panel__title">Two slices in flight</h2>
          <p className="panel__lede">
            ETA and blocker copy come from Hermes task metadata. HQ reads; it does not set ETAs.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Slice</p>
              <span className="vapp-card__status vapp-card__status--partial">Partial</span>
            </div>
            <h3 className="list__title">HQ v0 — two-feed personal shell</h3>
            <p className="list__copy">ETA Friday. Blocker: feed adapter contract for <code>PrSummary</code> not yet typed.</p>
            <span className="panel__label">Source — hermes task log</span>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Slice</p>
              <span className="vapp-card__status vapp-card__status--sketched">Sketched</span>
            </div>
            <h3 className="list__title">Chronicle projection for HQ</h3>
            <p className="list__copy">ETA next week. Blocker: event log retention policy pending on Q2 collab-plane decision.</p>
            <span className="panel__label">Source — hermes task log</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/vapps/hq">
            HQ brief
          </Link>
          <Link className="chip" href="/launchpad">
            Launchpad
          </Link>
          <Link className="chip" href="/parts/shells-surfaces">
            Shells / Surfaces
          </Link>
          <Link className="chip" href="/parts/identity-project-space">
            Identity / Project / Space
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
