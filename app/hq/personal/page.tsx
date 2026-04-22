import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * HQ — Personal (cross-project) variant.
 *
 * Aggregates across every Project/Org the user belongs to, grouped by Org.
 * Read-mostly by design: each panel is a typed projection from a control-plane
 * feed adapter. EMA owns truth. Hermes owns execution. This shell never holds
 * runtime state and never stores feed credentials.
 */

export default function PersonalHQPage() {
  return (
    <SiteShell
      eyebrow="HQ variant"
      title="Personal HQ"
      intro="One user, every Project and Org they belong to, grouped by Org. Personal HQ projects cross-project state — running Hermes sessions and GitHub PR status — into a single read model. Code never holds incident state; Hermes emits, EMA stores, this shell subscribes."
    >
      <section className="panel panel--hero">
        <p className="panel__tag">Cross-project ribbon</p>
        <h2 className="panel__title">One user across every Org they touch.</h2>
        <p className="panel__lede">
          Aggregates two feeds — running Hermes sessions and GitHub PR status —
          across all Projects, grouped by Org. Typed projections only; no
          credentials live here.
        </p>
        <div className="stat-ribbon">
          <div className="stat">
            <span className="stat__value">2</span>
            <span>Orgs</span>
          </div>
          <div className="stat">
            <span className="stat__value">4</span>
            <span>Projects</span>
          </div>
          <div className="stat">
            <span className="stat__value">3</span>
            <span>Running sessions</span>
          </div>
          <div className="stat">
            <span className="stat__value">5</span>
            <span>Open PRs</span>
          </div>
          <div className="stat">
            <span className="stat__value">1</span>
            <span>Pending proposal</span>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Running Hermes sessions (across projects)</p>
          <h2 className="panel__title">Three sessions, three projects, one user</h2>
          <p className="panel__lede">
            Projection over execution events; code never holds runtime state.
            The session registry is canonical on the control plane.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <p className="list__eyebrow">sess_01H8Z9K4M2QJV3N7RXAT</p>
            <h3 className="list__title">ema-0.0.3</h3>
            <p className="list__copy">
              Driver <code>hermes-native</code>. Started 12m ago. Atlas swarm
              dispatch on the personal Org.
            </p>
            <span className="panel__label">Feed — control-plane session registry</span>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">sess_01H8ZB1P7YTK4W2D6FQH</p>
            <h3 className="list__title">autharis</h3>
            <p className="list__copy">
              Driver <code>hermes-native</code>. Started 3m ago. Auth-policy
              replay on the acme-labs Org.
            </p>
            <span className="panel__label">Feed — control-plane session registry</span>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">sess_01H8ZC5V9RMXE0B4JHPS</p>
            <h3 className="list__title">proslync</h3>
            <p className="list__copy">
              Driver <code>hermes-native</code>. Started 41m ago. NIL queue
              reconciliation on the acme-labs Org.
            </p>
            <span className="panel__label">Feed — control-plane session registry</span>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Orgs</p>
          <h2 className="panel__title">Grouped by Org, drill into a Project</h2>
          <p className="panel__lede">
            Two Orgs, four Projects. Each Project links through to its own
            project-scoped HQ variant.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <p className="list__eyebrow">Org — personal</p>
            <h3 className="list__title">Your solo Projects</h3>
            <ul className="inline-list">
              <li>
                <span className="list__eyebrow">ema-0.0.3</span>{" "}
                <span className="list__copy">1 running · 0 blocked · 0 idle</span>
              </li>
              <li>
                <span className="list__eyebrow">atlas-notes</span>{" "}
                <span className="list__copy">0 running · 0 blocked · 1 idle</span>
              </li>
            </ul>
            <div className="panel__actions">
              <Link className="chip" href="/hq/project">
                Open project HQ
              </Link>
            </div>
          </article>
          <article className="panel vapp-card">
            <p className="list__eyebrow">Org — acme-labs</p>
            <h3 className="list__title">Shared Projects</h3>
            <ul className="inline-list">
              <li>
                <span className="list__eyebrow">autharis</span>{" "}
                <span className="list__copy">1 running · 0 blocked · 0 idle</span>
              </li>
              <li>
                <span className="list__eyebrow">proslync</span>{" "}
                <span className="list__copy">1 running · 1 blocked · 0 idle</span>
              </li>
            </ul>
            <div className="panel__actions">
              <Link className="chip" href="/hq/project">
                Open project HQ
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">GitHub PRs across projects</p>
          <h2 className="panel__title">Five PRs, flat list, project-prefixed</h2>
          <p className="panel__lede">
            One feed, every Project the user touches. Typed <code>PrSummary</code>{" "}
            projection behind the <code>github.pulls</code> adapter — no tokens
            live on the surface.
          </p>
        </div>
        <ul className="inline-list">
          <li>
            <span className="list__eyebrow">ema-0.0.3</span>{" "}
            <span className="list__copy">PR #142 — atlas swarm router · open</span>
          </li>
          <li>
            <span className="list__eyebrow">autharis</span>{" "}
            <span className="list__copy">PR #88 — policy replay harness · draft</span>
          </li>
          <li>
            <span className="list__eyebrow">proslync</span>{" "}
            <span className="list__copy">PR #401 — NIL queue retry loop · open</span>
          </li>
          <li>
            <span className="list__eyebrow">proslync</span>{" "}
            <span className="list__copy">PR #403 — payout audit columns · open</span>
          </li>
          <li>
            <span className="list__eyebrow">atlas-notes</span>{" "}
            <span className="list__copy">PR #17 — chronicle projection shim · merged</span>
          </li>
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/hq">
            HQ
          </Link>
          <Link className="chip" href="/hq/project">
            Project HQ
          </Link>
          <Link className="chip" href="/vapps/hq">
            HQ brief
          </Link>
          <Link className="chip" href="/parts/identity-project-space">
            Identity / Project / Space
          </Link>
          <Link className="chip" href="/launchpad">
            Launchpad
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
