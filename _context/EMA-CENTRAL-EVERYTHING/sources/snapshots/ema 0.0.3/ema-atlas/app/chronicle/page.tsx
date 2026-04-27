import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function ChroniclePage() {
  return (
    <SiteShell
      eyebrow="Control plane"
      title="Chronicle — the raw event log"
      intro="Chronicle is the direct read over event_log, unaggregated and unsummarized. Every other surface — HQ, Agent-Env, Incidents, Proposal flow — projects over this stream. If a fact is not here, it is not canonical; if it is here, it is the evidence."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Filters</p>
          <h2 className="panel__title">Filter strip (read-only)</h2>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value"><code>project:ema-0.0.3</code></span>
              <span>Scope</span>
            </div>
            <div className="stat">
              <span className="stat__value">any</span>
              <span>Actor</span>
            </div>
            <div className="stat">
              <span className="stat__value">any</span>
              <span>Kind</span>
            </div>
            <div className="stat">
              <span className="stat__value">last 2h</span>
              <span>Window</span>
            </div>
          </div>
          <p className="list__copy">
            Filters are query params over <code>event_log</code>; no state held
            here. The surface re-reads on every mutation of those params.
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Stream</p>
          <h2 className="panel__title">Event stream</h2>
          <p className="list__copy">
            Append-only, newest last. One line per row: timestamp, event id,
            kind, subject, actor.
          </p>
          <ol className="inline-list">
            <li>
              <code>14:02:11</code> · <code>evt_02133</code> ·{" "}
              <code>dispatch.created</code> · <code>dsp_7714</code> ·{" "}
              <code>actor:planner</code>
            </li>
            <li>
              <code>14:02:14</code> · <code>evt_02134</code> ·{" "}
              <code>dispatch.claimed</code> · <code>dsp_7714</code> ·{" "}
              <code>actor:worker-03</code>
            </li>
            <li>
              <code>14:02:15</code> · <code>evt_02135</code> ·{" "}
              <code>execution.started</code> · <code>exec_9a21</code> ·{" "}
              <code>actor:worker-03</code>
            </li>
            <li>
              <code>14:02:19</code> · <code>evt_02136</code> ·{" "}
              <code>tool.called</code> · <code>exec_9a21/fs.read</code> ·{" "}
              <code>actor:worker-03</code>
            </li>
            <li>
              <code>14:02:20</code> · <code>evt_02137</code> ·{" "}
              <code>tool.result</code> · <code>exec_9a21/fs.read</code> ·{" "}
              <code>actor:hermes</code>
            </li>
            <li>
              <code>14:02:41</code> · <code>evt_02138</code> ·{" "}
              <code>execution.finished</code> · <code>exec_9a21</code> ·{" "}
              <code>actor:worker-03</code>
            </li>
            <li>
              <code>14:03:02</code> · <code>evt_02139</code> ·{" "}
              <code>handoff.created</code> · <code>hof_0412</code> ·{" "}
              <code>actor:worker-03</code>
            </li>
            <li>
              <code>14:03:18</code> · <code>evt_02140</code> ·{" "}
              <code>handoff.accepted</code> · <code>hof_0412</code> ·{" "}
              <code>actor:worker-07</code>
            </li>
            <li>
              <code>14:04:05</code> · <code>evt_02141</code> ·{" "}
              <code>proposal.pending</code> · <code>prp_0331</code> ·{" "}
              <code>actor:worker-07</code>
            </li>
            <li>
              <code>14:06:44</code> · <code>evt_02142</code> ·{" "}
              <code>proposal.decided</code> · <code>prp_0331</code> ·{" "}
              <code>actor:human:taw</code>
            </li>
            <li>
              <code>14:07:09</code> · <code>evt_02143</code> ·{" "}
              <code>incident.detected</code> · <code>inc_0088</code> ·{" "}
              <code>actor:hermes</code>
            </li>
            <li>
              <code>14:07:31</code> · <code>evt_02144</code> ·{" "}
              <code>incident.acked</code> · <code>inc_0088</code> ·{" "}
              <code>actor:human:taw</code>
            </li>
            <li>
              <code>14:09:02</code> · <code>evt_02145</code> ·{" "}
              <code>wiki.node.edited</code> · <code>node:canonical-rule</code> ·{" "}
              <code>actor:human:taw</code>
            </li>
            <li>
              <code>14:10:14</code> · <code>evt_02146</code> ·{" "}
              <code>collab.thread.resolved</code> · <code>thr_2201</code> ·{" "}
              <code>actor:human:taw</code> <span className="chip chip--ghost">Q2-open</span>
            </li>
          </ol>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Legend</p>
          <h2 className="panel__title">Event kinds</h2>
          <p className="list__copy">
            Six canonical families plus one Q2-open family. No invented kinds —
            everything listed is already defined against <code>event_log</code>.
          </p>
          <div className="card-grid">
            <article className="panel vapp-card">
              <div className="vapp-card__head">
                <p className="list__eyebrow">Family</p>
                <span className="chip">Canonical</span>
              </div>
              <h3 className="list__title">dispatch</h3>
              <ul className="inline-list">
                <li><code>dispatch.created</code></li>
                <li><code>dispatch.claimed</code></li>
              </ul>
            </article>
            <article className="panel vapp-card">
              <div className="vapp-card__head">
                <p className="list__eyebrow">Family</p>
                <span className="chip">Canonical</span>
              </div>
              <h3 className="list__title">execution</h3>
              <ul className="inline-list">
                <li><code>execution.started</code></li>
                <li><code>execution.finished</code></li>
              </ul>
            </article>
            <article className="panel vapp-card">
              <div className="vapp-card__head">
                <p className="list__eyebrow">Family</p>
                <span className="chip">Canonical</span>
              </div>
              <h3 className="list__title">tool</h3>
              <ul className="inline-list">
                <li><code>tool.called</code></li>
                <li><code>tool.result</code></li>
              </ul>
            </article>
            <article className="panel vapp-card">
              <div className="vapp-card__head">
                <p className="list__eyebrow">Family</p>
                <span className="chip">Canonical</span>
              </div>
              <h3 className="list__title">handoff</h3>
              <ul className="inline-list">
                <li><code>handoff.created</code></li>
                <li><code>handoff.accepted</code></li>
              </ul>
            </article>
            <article className="panel vapp-card">
              <div className="vapp-card__head">
                <p className="list__eyebrow">Family</p>
                <span className="chip">Canonical</span>
              </div>
              <h3 className="list__title">proposal</h3>
              <ul className="inline-list">
                <li><code>proposal.pending</code></li>
                <li><code>proposal.decided</code></li>
              </ul>
            </article>
            <article className="panel vapp-card">
              <div className="vapp-card__head">
                <p className="list__eyebrow">Family</p>
                <span className="chip">Canonical</span>
              </div>
              <h3 className="list__title">incident</h3>
              <ul className="inline-list">
                <li><code>incident.detected</code></li>
                <li><code>incident.acked</code></li>
              </ul>
            </article>
            <article className="panel vapp-card">
              <div className="vapp-card__head">
                <p className="list__eyebrow">Note</p>
                <span className="chip chip--ghost">Q2-open</span>
              </div>
              <h3 className="list__title">collab.*</h3>
              <p className="list__copy">
                <code>wiki.node.edited</code> and{" "}
                <code>collab.thread.resolved</code> land here today, but the
                collaboration plane owner is not yet decided. Treat these kinds
                as provisional until Q2 resolves.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Scope</p>
          <h2 className="panel__title">What chronicle is NOT</h2>
          <ul className="inline-list">
            <li>
              <strong>Not a projection.</strong> No rollups, no summaries, no
              status derivations — that is HQ&apos;s job.
            </li>
            <li>
              <strong>Not filterable by feel.</strong> Filters are query params
              over <code>event_log</code>; there is no natural-language search
              layer here.
            </li>
            <li>
              <strong>Not editable.</strong> Chronicle is append-only. A row,
              once landed, is never rewritten from this surface.
            </li>
            <li>
              <strong>Not the place to make decisions</strong> — that is HQ /
              proposal flow. Chronicle is evidence, not a control panel.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/state-planes">
              State planes
            </Link>
            <Link className="chip" href="/canonical-rule">
              Canonical rule
            </Link>
            <Link className="chip" href="/hq/project">
              HQ — project
            </Link>
            <Link className="chip" href="/incidents">
              Incidents
            </Link>
            <Link className="chip" href="/proposal-flow">
              Proposal flow
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
