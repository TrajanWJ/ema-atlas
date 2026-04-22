import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function IncidentResponseScenarioPage() {
  return (
    <SiteShell
      eyebrow="Scenario"
      title="Incident: a stalled execution, end to end"
      intro="One incident, observed from multiple surfaces, resolved without any surface owning state. Every transition below is a row on event_log; every surface named is a projection of that log. The scenario is concrete so the design can be tested against it."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">14:02:04</p>
          <h2 className="panel__title">Babysitter loses heartbeat</h2>
          <p className="panel__lede">
            <span className="chip"><code>execution.stalled</code></span>{" "}
            <span className="chip"><code>incident_17</code></span>{" "}
            <span className="chip"><code>ExecutionId ex_01H9TQ2M</code></span>
          </p>
          <p className="list__copy">
            The babysitter's scan of <code>ex_01H9TQ2M</code> evaluates{" "}
            <code>execution.heartbeat</code> and finds 94s since the last tick
            against a 60s threshold. The invariant break is appended to{" "}
            <code>event_log</code> as an <code>execution.stalled</code>{" "}
            detection. The babysitter writes and moves on; it does not touch the
            execution.
          </p>
          <div className="route-links">
            <Link className="chip" href="/incidents">/incidents</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">14:02:05</p>
          <h2 className="panel__title">Incident emitted</h2>
          <p className="panel__lede">
            <span className="chip"><code>incident.detected</code></span>{" "}
            <span className="chip"><code>incident_17</code></span>
          </p>
          <p className="list__copy">
            One second later, an <code>incident.detected</code> row lands on the
            log carrying <code>IncidentId incident_17</code>, kind{" "}
            <code>execution.stalled</code>, and subject{" "}
            <code>ex_01H9TQ2M</code>. The Chronicle feed picks the row up as it
            is written. No surface has decided anything yet.
          </p>
          <div className="route-links">
            <Link className="chip" href="/chronicle">/chronicle</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">14:02:08</p>
          <h2 className="panel__title">HQ renders the red card</h2>
          <p className="panel__lede">
            <span className="chip">render-only</span>{" "}
            <span className="chip"><code>incident_17</code></span>
          </p>
          <p className="list__copy">
            HQ's project view projects the open incident as a red card against{" "}
            <code>ex_01H9TQ2M</code>. The card is a derived view of{" "}
            <code>event_log</code>, not a stored row on HQ. If the log were
            replayed, HQ would recompute the same card.
          </p>
          <div className="route-links">
            <Link className="chip" href="/hq/project">/hq/project</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">14:02:40</p>
          <h2 className="panel__title">@tawj acks in HQ</h2>
          <p className="panel__lede">
            <span className="chip"><code>incident.acked</code></span>{" "}
            <span className="chip"><code>incident_17</code></span>
          </p>
          <p className="list__copy">
            A human click at HQ appends an <code>incident.acked</code> row for{" "}
            <code>incident_17</code> with actor <code>@tawj</code>. The red card
            flips to the acknowledged projection because the log changed, not
            because HQ mutated a field.
          </p>
          <div className="route-links">
            <Link className="chip" href="/hq/project">/hq/project</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">14:03:15</p>
          <h2 className="panel__title">Triage in Chat with claude-a1</h2>
          <p className="panel__lede">
            <span className="chip"><code>session.started</code></span>{" "}
            <span className="chip"><code>tool.called</code></span>{" "}
            <span className="chip"><code>incident_17</code></span>
          </p>
          <p className="list__copy">
            A chat session opens scoped to <code>incident_17</code>; the{" "}
            <code>session.started</code> row names <code>claude-a1</code> as
            agent. Inspection tool calls against the stalled execution are
            appended as <code>tool.called</code> rows. Every observable step of
            triage is on the log.
          </p>
          <div className="route-links">
            <Link className="chip" href="/chat">/chat</Link>
            <Link className="chip" href="/chat/tenanted">/chat/tenanted</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">14:06:50</p>
          <h2 className="panel__title">Mitigation applied via proposal</h2>
          <p className="panel__lede">
            <span className="chip"><code>proposal.submitted</code></span>{" "}
            <span className="chip"><code>proposal.decided</code></span>{" "}
            <span className="chip"><code>driver.restarted</code></span>{" "}
            <span className="chip"><code>hermes-native</code></span>
          </p>
          <p className="list__copy">
            A restart of driver <code>hermes-native</code> is expressed as a
            control-plane proposal: <code>proposal.submitted</code> then{" "}
            <code>proposal.decided</code> with an approve decision. Only then
            does Hermes dispatch the restart, appending{" "}
            <code>driver.restarted</code>. Nothing pokes the driver directly.
          </p>
          <div className="route-links">
            <Link className="chip" href="/proposal-flow">/proposal-flow</Link>
            <Link className="chip" href="/driver-matrix">/driver-matrix</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">14:08:30</p>
          <h2 className="panel__title">Resolved, execution replaced</h2>
          <p className="panel__lede">
            <span className="chip"><code>incident.resolved</code></span>{" "}
            <span className="chip"><code>ex_01H9TQ2M</code> → <code>ex_01H9V0K2</code></span>
          </p>
          <p className="list__copy">
            Heartbeats return on a fresh <code>ExecutionId ex_01H9V0K2</code>,
            and <code>incident.resolved</code> is appended against{" "}
            <code>incident_17</code> carrying the replacement pointer. HQ and
            the agent-environment both recompute to a green state from the same
            row.
          </p>
          <div className="route-links">
            <Link className="chip" href="/hq/project">/hq/project</Link>
            <Link className="chip" href="/agent-environment">/agent-environment</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">14:20:00</p>
          <h2 className="panel__title">Archived, handoff created</h2>
          <p className="panel__lede">
            <span className="chip"><code>incident.archived</code></span>{" "}
            <span className="chip"><code>handoff.created</code></span>
          </p>
          <p className="list__copy">
            Twelve minutes after resolution, <code>incident.archived</code>{" "}
            closes <code>incident_17</code> out of active views. A paired{" "}
            <code>handoff.created</code> row points at the archived incident for
            postmortem. The thread survives on the log; the active surfaces are
            clean.
          </p>
          <div className="route-links">
            <Link className="chip" href="/handoff">/handoff</Link>
            <Link className="chip" href="/threads">/threads</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Observations</p>
          <h2 className="panel__title">What the scenario proves</h2>
          <ul className="inline-list">
            <li>
              Every step left a chronicle row — detection, ack, triage,
              proposal, decision, restart, resolution, archival, handoff are all
              on <code>event_log</code>.
            </li>
            <li>
              HQ never owned the incident state. The red card, the acked card,
              and the green card are all projections of the same log.
            </li>
            <li>
              The mitigation required a control-plane proposal — not a direct
              driver poke. The restart only happened after{" "}
              <code>proposal.decided</code> landed.
            </li>
          </ul>
          <div className="route-links">
            <Link className="chip" href="/incidents">/incidents</Link>
            <Link className="chip" href="/chronicle">/chronicle</Link>
            <Link className="chip" href="/proposal-flow">/proposal-flow</Link>
            <Link className="chip" href="/driver-matrix">/driver-matrix</Link>
            <Link className="chip" href="/questions">/questions</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
