import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function IncidentsPage() {
  return (
    <SiteShell
      eyebrow="Control plane"
      title="Incidents & the babysitter"
      intro="Incidents are first-class control-plane records, addressable by IncidentId and appended to the event_log like any other canonical object. The babysitter is the observer pattern EMA absorbed from OpenClaw: it watches active executions, emits incident events when invariants break, and never mutates the executions it is watching. Surfaces render incidents; they never hold them."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Taxonomy</p>
          <h2 className="panel__title">Incident kinds</h2>
          <p className="panel__lede">
            Five typed kinds cover the failure modes the babysitter and the
            drivers are wired to detect. Each one lands in{" "}
            <code>event_log</code> as a typed record with a subject id.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Kind</p>
              <span className="chip"><code>execution.stalled</code></span>
            </div>
            <p className="list__copy">
              An execution stopped making progress without terminating. Detected
              by missing heartbeats past threshold. Emitted by the babysitter
              against an <code>ExecutionId</code>, rendered in HQ.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Kind</p>
              <span className="chip"><code>tool.failed</code></span>
            </div>
            <p className="list__copy">
              A tool call returned an error or exceeded its timeout. Detected by
              the Hermes tool-call result channel. Emitted by the dispatching
              driver, rendered in Threads and HQ.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Kind</p>
              <span className="chip"><code>driver.crashed</code></span>
            </div>
            <p className="list__copy">
              A Hermes driver process died or stopped reporting liveness.
              Detected by the driver-liveness probe. Emitted by the Hermes
              supervisor, rendered in HQ and the driver matrix.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Kind</p>
              <span className="chip"><code>provider.degraded</code></span>
            </div>
            <p className="list__copy">
              An upstream model or API provider is returning elevated errors or
              latency. Detected by rolling-window provider metrics. Emitted by
              the provider driver, rendered on HQ and the agent-environment.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Kind</p>
              <span className="chip"><code>workspace.drift</code></span>
            </div>
            <p className="list__copy">
              Workspace files diverged from the typed contract (unexpected
              shape, missing handoff, stale status). Detected by workspace
              contract check. Emitted by the workspace driver, rendered on HQ
              project views.
            </p>
          </article>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Lifecycle</p>
          <h2 className="panel__title">Seven states</h2>
          <p className="panel__lede">
            Every incident moves through the same sequence. Each transition is
            its own typed event appended to <code>event_log</code>; the state is
            a projection, never a writeable field.
          </p>
          <ol className="inline-list">
            <li>
              <strong>detected</strong> — the babysitter or a driver notices an
              invariant break. Transition event: <code>incident.detected</code>.
            </li>
            <li>
              <strong>emitted</strong> — the incident record is appended to{" "}
              <code>event_log</code> with an <code>IncidentId</code>. Transition
              event: <code>incident.detected</code> (the emit is the detect
              event landing on the log).
            </li>
            <li>
              <strong>acknowledged</strong> — a human at HQ takes ownership.
              Transition event: <code>incident.acked</code>.
            </li>
            <li>
              <strong>triaged</strong> — kind confirmed, scope bounded, next
              action named. Transition event: <code>incident.triaged</code>.
            </li>
            <li>
              <strong>mitigated</strong> — the active harm is stopped; root
              cause may still be open. Transition event:{" "}
              <code>incident.mitigated</code>.
            </li>
            <li>
              <strong>resolved</strong> — cause addressed, invariants hold
              again. Transition event: <code>incident.resolved</code>.
            </li>
            <li>
              <strong>archived</strong> — incident is closed out of active
              views, kept on the log. Transition event:{" "}
              <code>incident.archived</code>.
            </li>
          </ol>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Shape</p>
          <h2 className="panel__title">Mock incident</h2>
          <p className="panel__lede">
            One record as it would land on <code>event_log</code>, plus the
            projections a surface would render.
          </p>
          <div>
            <span className="panel__label">IncidentId</span>
            <p className="list__copy"><code>incident_17</code></p>
          </div>
          <div>
            <span className="panel__label">Kind</span>
            <p className="list__copy"><code>execution.stalled</code></p>
          </div>
          <div>
            <span className="panel__label">Subject</span>
            <p className="list__copy">
              <code>ExecutionId ex_01H9TQ2M</code>
            </p>
          </div>
          <div>
            <span className="panel__label">Detected at</span>
            <p className="list__copy">
              <code>2026-04-22T14:07:41Z</code> — 94s since last heartbeat,
              threshold 60s.
            </p>
          </div>
          <div>
            <span className="panel__label">Babysitter probe</span>
            <p className="list__copy">
              <code>execution.heartbeat</code> — last tick{" "}
              <code>2026-04-22T14:06:07Z</code>, expected every 30s, missed
              three windows.
            </p>
          </div>
          <div>
            <span className="panel__label">Chronicle pointers</span>
            <div className="route-links">
              <span className="chip"><code>event_log#ev_4811</code></span>
              <span className="chip"><code>event_log#ev_4812</code></span>
            </div>
          </div>
          <p className="list__copy">
            <em>
              Caption: this is one <code>event_log</code> row plus the
              projections HQ derives from it. The record is the truth; the
              status chip, the timeline, the badge on the execution row are all
              computed views.
            </em>
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Observer</p>
          <h2 className="panel__title">The babysitter pattern</h2>
          <p className="panel__lede">
            The babysitter is the piece EMA lifted from the OpenClaw lineage. It
            loops over active executions, checks a short list of invariants, and
            emits <code>incident.*</code> events when any of them break. It
            never mutates execution state, never cancels a run, never talks to a
            driver — it only writes to the log and hands control back to the
            human at HQ.
          </p>
          <div>
            <span className="panel__label">Loop shape</span>
            <p className="list__copy">
              Scan active <code>ExecutionId</code>s on a fixed cadence. For
              each, evaluate every invariant. On break, append an{" "}
              <code>incident.detected</code> event with the right kind and
              subject. Then continue.
            </p>
          </div>
          <div>
            <span className="panel__label">Invariants watched</span>
            <ul className="inline-list">
              <li>
                <code>execution.heartbeat</code> — an active execution ticks
                within its expected window.
              </li>
              <li>
                <code>tool.timeout</code> — no in-flight tool call exceeds its
                declared timeout.
              </li>
              <li>
                <code>driver.liveness</code> — every driver attached to an
                active execution is reporting alive.
              </li>
            </ul>
          </div>
          <div>
            <span className="panel__label">What it never does</span>
            <p className="list__copy">
              Mutate execution state. Kill a session. Retry a tool call. Decide
              severity on its own. All of that is a human action taken at HQ, or
              a separate Hermes operation, each of which lands its own event on
              the log.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Render</p>
          <h2 className="panel__title">Which surfaces render incidents</h2>
          <p className="panel__lede">
            Incidents show up in multiple places because multiple roles need to
            see them. None of these surfaces hold incident state; they each
            project the same control-plane record.
          </p>
          <div className="route-links">
            <Link className="chip" href="/hq">/hq</Link>
            <Link className="chip" href="/hq/project">/hq/project</Link>
            <Link className="chip" href="/threads">/threads</Link>
            <Link className="chip" href="/chat">/chat</Link>
            <Link className="chip" href="/agent-environment">/agent-environment</Link>
          </div>
          <p className="list__copy">
            <em>Caption: all render, none hold.</em>
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/canonical-rule">Canonical rule</Link>
            <Link className="chip" href="/state-planes">State planes</Link>
            <Link className="chip" href="/parts/authority-control-plane">Authority / control plane</Link>
            <Link className="chip" href="/parts/harness-execution">Harness / execution</Link>
            <Link className="chip" href="/questions">Open questions</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
