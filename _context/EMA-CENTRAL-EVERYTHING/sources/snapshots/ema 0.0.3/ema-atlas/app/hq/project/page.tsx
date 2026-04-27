import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * Project HQ — project-scoped variant.
 *
 * One project's live pulse: ema 0.0.3. Not a personal aggregate —
 * see /hq for that. EMA owns truth, Hermes owns execution, this
 * surface renders typed projections from control-plane feed adapters
 * and owns no canonical state.
 */

export default function ProjectHQPage() {
  return (
    <SiteShell
      eyebrow="HQ variant"
      title="Project HQ — ema 0.0.3"
      intro="One project's live pulse, scoped to ema 0.0.3. Every panel is a typed projection from a control-plane feed adapter — HQ paints, EMA stores, Hermes acts. The personal cross-project aggregate lives at /hq."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Project pulse</p>
          <h2 className="panel__title">ema 0.0.3 — live state</h2>
          <p className="panel__lede">
            Scoped to a single project. Counts below are projections over the
            ema 0.0.3 control plane, not a personal roll-up.
          </p>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">3</span>
              <span>Running Hermes sessions (project)</span>
            </div>
            <div className="stat">
              <span className="stat__value">2</span>
              <span>Open incidents (project)</span>
            </div>
            <div className="stat">
              <span className="stat__value">5</span>
              <span>Queue depth</span>
            </div>
            <div className="stat">
              <span className="stat__value">90s</span>
              <span>Since last dispatch</span>
            </div>
          </div>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Workstream</p>
              <span className="vapp-card__status vapp-card__status--partial">In flight</span>
            </div>
            <h3 className="list__title">Current workstream — atlas surfaces</h3>
            <p className="list__copy">
              Shells, briefs, and swarm deliverables for ema 0.0.3. Hermes dispatches the lanes; HQ reads the projection.
            </p>
            <span className="panel__label">Source — hermes task log (project: ema 0.0.3)</span>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Workstream</p>
              <span className="vapp-card__status vapp-card__status--sketched">Blocked</span>
            </div>
            <h3 className="list__title">Blocked workstream — collab-plane decision (Q2)</h3>
            <p className="list__copy">
              Typed event shape for real-time edits still unresolved. Unblocks chronicle retention and the wiki adoption path.
            </p>
            <span className="panel__label">Source — open questions projection</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Chronicle — last 24h</p>
        <h2 className="panel__title">What Hermes did in ema 0.0.3 yesterday</h2>
        <p className="panel__lede">
          HQ projects the chronicle. The <code>event_log</code> stores — this surface only reads typed event rows.
        </p>
        <ol className="inline-list">
          <li>
            <span className="list__eyebrow">dispatch.created</span>{" "}
            <span className="list__copy">Swarm lane <code>/hq/project</code> dispatched to a worker — 2m ago.</span>
          </li>
          <li>
            <span className="list__eyebrow">execution.finished</span>{" "}
            <span className="list__copy">Atlas build passed for brief surface refresh — 38m ago.</span>
          </li>
          <li>
            <span className="list__eyebrow">proposal.pending</span>{" "}
            <span className="list__copy">Feed adapter <code>github.pulls</code> requested enable — 3h ago.</span>
          </li>
          <li>
            <span className="list__eyebrow">incident.acked</span>{" "}
            <span className="list__copy">Queue adapter retry loop acknowledged by on-call — 9h ago.</span>
          </li>
          <li>
            <span className="list__eyebrow">handoff.created</span>{" "}
            <span className="list__copy">Collab-plane brief handed from research to design lane — 22h ago.</span>
          </li>
        </ol>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Pending approvals</p>
          <h2 className="panel__title">Proposals awaiting a human call</h2>
          <p className="panel__lede">
            Scoped to ema 0.0.3. Chips are presentational — the approval write lands through Hermes, not this shell.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Proposal prop_8a21</p>
              <span className="vapp-card__status vapp-card__status--planned">Pending</span>
            </div>
            <h3 className="list__title">driver.enable — github.pulls</h3>
            <p className="list__copy">Requested by <code>hermes.swarm.router</code>. Would project PR status into the ema 0.0.3 HQ.</p>
            <div className="route-links">
              <span className="chip">Approve</span>
              <span className="chip">Reject</span>
            </div>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Proposal prop_8a22</p>
              <span className="vapp-card__status vapp-card__status--planned">Pending</span>
            </div>
            <h3 className="list__title">feed.register — uptime.synthetic</h3>
            <p className="list__copy">Requested by <code>operator.taw</code>. Adds a typed probe projection for project surfaces.</p>
            <div className="route-links">
              <span className="chip">Approve</span>
              <span className="chip">Reject</span>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">External feeds</p>
          <h2 className="panel__title">Typed projections via feed adapters</h2>
          <p className="panel__lede">
            Every external system reaches ema 0.0.3 HQ as a typed projection behind a control-plane feed adapter. No adapter, no tile.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <p className="list__eyebrow">GitHub</p>
            <h3 className="list__title">PRs open on ema 0.0.3: 3</h3>
            <p className="list__copy">#142 brief refresh, #145 swarm docs, #148 chronicle shape.</p>
            <span className="panel__label">Typed projection via feed adapter — github.pulls</span>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">Uptime</p>
            <h3 className="list__title">1 probe green — atlas.ema</h3>
            <p className="list__copy">Single synthetic probe for the project shell. 99.99% over 24h.</p>
            <span className="panel__label">Typed projection via feed adapter — uptime.synthetic</span>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">Client portal</p>
            <h3 className="list__title">Project portal — ema 0.0.3</h3>
            <p className="list__copy">
              <Link className="chip" href="/vapps/hq">Open portal link</Link>
            </p>
            <span className="panel__label">Typed projection via feed adapter — portal.project</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/hq">
            HQ
          </Link>
          <Link className="chip" href="/hq/personal">
            HQ personal
          </Link>
          <Link className="chip" href="/vapps/hq">
            HQ brief
          </Link>
          <Link className="chip" href="/parts/shells-surfaces">
            Shells / Surfaces
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
