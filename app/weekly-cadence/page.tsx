import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * Weekly cadence — rollup view over five days of dispatch events for one
 * human/agent pair. Phases are a tag attached to dispatch.claim events, not a
 * planner object. Cadence checkups are event-listeners that fire on schedule
 * and read the log; they are not cron jobs and they do not own state.
 */

const weekStrip: {
  day: string;
  phase: string;
  purpose: string;
  kinds: string[];
  checkup: string;
}[] = [
  {
    day: "Mon",
    phase: "Context",
    purpose: "Load prior week, re-read briefs, ingest chronicle.",
    kinds: ["context.read", "chronicle.read", "dispatch.claim#phase=context"],
    checkup: "cadence:daily — stale-context scan over last 7d of doc.edit.",
  },
  {
    day: "Tue",
    phase: "Build",
    purpose: "First build day — primary writes land against claimed lanes.",
    kinds: ["dispatch.claim#phase=build", "tool.run", "fs.write"],
    checkup: "cadence:daily — dispatch.stall sweep over open claims.",
  },
  {
    day: "Wed",
    phase: "Build",
    purpose: "Second build day — midweek heartbeat on the same lanes.",
    kinds: ["dispatch.progress", "tool.run", "queue.pop"],
    checkup: "cadence:phase-boundary — build→review readiness probe.",
  },
  {
    day: "Thu",
    phase: "Review",
    purpose: "Read what landed, file incidents, edit the wiki.",
    kinds: ["wiki.edit", "incident.ack", "dispatch.claim#phase=review"],
    checkup: "cadence:daily — incident-ack SLA over open incidents.",
  },
  {
    day: "Fri",
    phase: "Handoff",
    purpose: "Close the week — write handoff, promote queue items.",
    kinds: ["handoff.created", "queue.item.created", "dispatch.close"],
    checkup: "cadence:weekly — handoff + invariant sweep for the pair.",
  },
];

const cadenceKinds: {
  kind: string;
  listens: string;
  triggers: string;
  fails: string;
}[] = [
  {
    kind: "cadence:daily",
    listens: "dispatch.claim, dispatch.stall, incident.ack over last 24h.",
    triggers: "emits checkup.fire with a per-agent summary row.",
    fails: "emits incident.created when a stall crosses SLA.",
  },
  {
    kind: "cadence:weekly",
    listens: "handoff.created, queue.item.created, wiki.edit over last 7d.",
    triggers: "emits checkup.fire with the rollup used by this surface.",
    fails: "emits incident.created when invariants (e.g. no handoff) break.",
  },
  {
    kind: "cadence:phase-boundary",
    listens: "dispatch.claim tag transitions — context→build, build→review.",
    triggers: "emits checkup.fire scoped to the lane that just crossed.",
    fails: "emits incident.created when a lane skips a phase tag.",
  },
  {
    kind: "cadence:adhoc",
    listens: "a human or agent emitting cadence.request against the log.",
    triggers: "emits checkup.fire against the requested window.",
    fails: "emits incident.created when the requested window is empty.",
  },
];

const rollup: { phase: string; dispatches: number; handoffs: number; incidents: number; wiki: number }[] = [
  { phase: "Mon — Context", dispatches: 3, handoffs: 0, incidents: 1, wiki: 2 },
  { phase: "Tue — Build", dispatches: 6, handoffs: 0, incidents: 0, wiki: 1 },
  { phase: "Wed — Build", dispatches: 5, handoffs: 0, incidents: 2, wiki: 0 },
  { phase: "Thu — Review", dispatches: 4, handoffs: 0, incidents: 3, wiki: 4 },
  { phase: "Fri — Handoff", dispatches: 2, handoffs: 1, incidents: 0, wiki: 1 },
];

const notOwned: string[] = [
  "Not a calendar backend — the week is a projection over dispatch events, not rows in a planner table.",
  "Phases are not planner objects — they are a tag on dispatch.claim. Drop the tag and the strip empties.",
  "Cadence checkups are not cron — they are event-listeners that emit checkup.fire and, on invariant breaks, incident.created.",
];

export default function WeeklyCadencePage() {
  return (
    <SiteShell
      eyebrow="Coordination"
      title="Weekly cadence"
      intro="Five days of dispatch, rolled up for one human/agent pair. Phases are a tag attached to dispatch.claim events — not a planner object. Cadence checkups are event-listeners that fire on schedule and read the log; they are not cron and they do not own state."
    >
      <section className="panel">
        <p className="panel__tag">Week strip — @tawj + claude-a1</p>
        <h2 className="panel__title">Five phases, tagged on dispatch</h2>
        <p className="panel__lede">
          Each card names the phase, what the pair is doing, the event kinds
          that carry the <code>phase</code> tag that day, and the one cadence
          checkup that reads the log on that day.
        </p>
        <div className="card-grid">
          {weekStrip.map((d) => (
            <article className="panel vapp-card" key={d.day}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">{d.day}</p>
                <span className="vapp-card__status vapp-card__status--planned">
                  {d.phase}
                </span>
              </div>
              <h3 className="list__title">{d.purpose}</h3>
              <ul className="inline-list">
                {d.kinds.map((k) => (
                  <li key={k}>
                    <span className="panel__label">{k}</span>
                  </li>
                ))}
              </ul>
              <p className="panel__label">{d.checkup}</p>
            </article>
          ))}
        </div>
        <p className="panel__label">
          source — dispatch.claim events carrying a phase tag, not a week table.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Cadence kinds</p>
        <h2 className="panel__title">Listeners, not cron</h2>
        <p className="panel__lede">
          Four cadence kinds cover the week. Each one names the event kinds it
          listens for, the event it emits on fire, and the failure shape —
          always <code>incident.created</code> when an invariant breaks.
        </p>
        <div className="card-grid">
          {cadenceKinds.map((c) => (
            <article className="panel vapp-card" key={c.kind}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">{c.kind}</p>
                <span className="vapp-card__status vapp-card__status--partial">
                  Listener
                </span>
              </div>
              <h3 className="list__title">listens for</h3>
              <p className="list__copy">{c.listens}</p>
              <p className="panel__label">triggers — {c.triggers}</p>
              <p className="panel__label">fails — {c.fails}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="vapp-card__head">
          <p className="panel__tag">Rollup view — mock week for @tawj + claude-a1</p>
          <span className="vapp-card__status vapp-card__status--partial">
            cadence:weekly
          </span>
        </div>
        <h2 className="panel__title">Counts per phase, from the log</h2>
        <p className="panel__lede">
          Every number below is a filter over <code>event_log</code> for the
          week. The view is a render; deleting the panel would not change what
          the control plane knows about the week.
        </p>
        <ul className="inline-list">
          {rollup.map((r) => (
            <li key={r.phase}>
              <span className="list__eyebrow">{r.phase}</span>
              <span className="panel__label">dispatches {r.dispatches}</span>
              <span className="panel__label">handoffs {r.handoffs}</span>
              <span className="panel__label">incidents acked {r.incidents}</span>
              <span className="panel__label">wiki edits {r.wiki}</span>
            </li>
          ))}
        </ul>
        <div className="stat-ribbon">
          <div className="stat">
            <span className="stat__value">stuck</span>
            <span>
              Wed build lane <code>disp_04H7KQ</code> claimed a{" "}
              <code>phase=build</code> tag but emitted no{" "}
              <code>dispatch.progress</code> for 36h — cadence:weekly caught the
              broken invariant and emitted <code>incident.created</code>.
            </span>
          </div>
        </div>
        <p className="panel__label">
          source — cadence:weekly checkup.fire reading event_log, not a rollup table.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">What this surface does NOT own</p>
        <h2 className="panel__title">Render, not record</h2>
        <ul className="inline-list">
          {notOwned.map((n) => (
            <li key={n}>
              <span className="list__copy">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/agent-environment">
            Agent environment
          </Link>
          <Link className="chip" href="/agent-day">
            Agent day
          </Link>
          <Link className="chip" href="/handoff">
            Handoff
          </Link>
          <Link className="chip" href="/incidents">
            Incidents
          </Link>
          <Link className="chip" href="/questions">
            Open questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
