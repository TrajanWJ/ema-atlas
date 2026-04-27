import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

import { statusLabel, vapps } from "../vapps/_data";

/**
 * Agent Virtual Environment — read-only daily projection over the dispatch
 * event log. The vApp does not own calendar state; every row here is a view
 * onto an event that already exists in the control plane.
 *
 * Doctrine: EMA owns truth, Hermes owns execution, surfaces do not own state.
 * Scope for this mockup: one agent ("claude-a1"), today, rendered from the
 * event_log — dispatches, tool runs, queue pops, checkups.
 */

const timelineBlocks: {
  time: string;
  kind: string;
  eventId: string;
  note: string;
}[] = [
  {
    time: "09:00",
    kind: "handoff.read",
    eventId: "handoff_evt_02",
    note: "prior shift notes ingested — no new block-kind.",
  },
  {
    time: "10:00",
    kind: "dispatch.claim",
    eventId: "disp_04H7KQ",
    note: "agent-environment lane claimed off the atlas swarm.",
  },
  {
    time: "11:30",
    kind: "tool.run",
    eventId: "tool_exec_17",
    note: "fs.write against app/agent-environment/page.tsx.",
  },
  {
    time: "12:45",
    kind: "dispatch.progress",
    eventId: "disp_04H7KQ",
    note: "heartbeat — still on the same dispatch, no new claim.",
  },
  {
    time: "14:00",
    kind: "checkup.fire",
    eventId: "cadence_daily_08",
    note: "daily cadence scans open dispatches, emits no new state.",
  },
  {
    time: "15:00",
    kind: "queue.pop",
    eventId: "queue_item_24",
    note: "wiki:review item pulled — responsibility-backed, not ad-hoc.",
  },
  {
    time: "16:30",
    kind: "tool.run",
    eventId: "tool_exec_18",
    note: "git.commit against ema-atlas; event log is the receipt.",
  },
  {
    time: "17:45",
    kind: "handoff.write",
    eventId: "handoff_evt_03",
    note: "end-of-shift note appended — next agent reads this at 09:00.",
  },
];

const weeklyPhases: { day: string; phase: string }[] = [
  { day: "mon", phase: "Context" },
  { day: "tue", phase: "Build" },
  { day: "wed", phase: "Build" },
  { day: "thu", phase: "Review" },
  { day: "fri", phase: "Handoff" },
];

const activeQueue: { id: string; note: string }[] = [
  { id: "queue_item_24", note: "wiki:review — brief drift on /parts." },
  { id: "queue_item_25", note: "incidents:triage — stale disp_03Y2PP." },
  { id: "queue_item_26", note: "handoff:promote — elevate evt_02 to brief." },
];

const responsibilities: { id: string; note: string }[] = [
  { id: "wiki:review", note: "listens for doc.edit events on content/**." },
  { id: "incidents:triage", note: "listens for dispatch.stall past SLA." },
  { id: "handoff:promote", note: "listens for handoff.write at shift end." },
];

const checkups: { time: string; kind: string; listensFor: string }[] = [
  {
    time: "09:00",
    kind: "cadence:daily",
    listensFor: "dispatch.claim + dispatch.stall in the last 24h.",
  },
  {
    time: "fri 17:00",
    kind: "cadence:weekly",
    listensFor: "handoff.write count + queue.pop backlog per responsibility.",
  },
];

export default function AgentEnvironmentPage() {
  const entry = vapps.find((v) => v.slug === "agent-virtual-environment");
  const status = entry ? statusLabel(entry.status) : "Planned";

  return (
    <SiteShell
      eyebrow="vApp"
      title="Agent Virtual Environment"
      intro="The agent's day as a place, rendered as a read-only projection over the dispatch event log. Calendar, phases, queues, responsibilities, and checkups are views — not planner objects. EMA owns truth; this surface only names it."
    >
      <section className="panel">
        <div className="vapp-card__head">
          <p className="panel__tag">Day timeline — claude-a1 / today</p>
          <span className="vapp-card__status vapp-card__status--planned">
            {status}
          </span>
        </div>
        <h2 className="panel__title">Eight blocks, zero new state</h2>
        <p className="panel__lede">
          Each row names the event kind and the source event id. The block is a
          render, not a record; deleting it would not change what the control
          plane knows about the agent&apos;s day.
        </p>
        <ul className="inline-list">
          {timelineBlocks.map((b) => (
            <li key={b.eventId + b.time}>
              <span className="list__eyebrow">{b.time}</span>
              <span className="list__title">{b.kind}</span>
              <span className="panel__label">{b.eventId}</span>
              <span className="list__copy">{b.note}</span>
            </li>
          ))}
        </ul>
        <p className="panel__label">
          rendered from event_log — dispatch events, not calendar state.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Weekly phase strip</p>
        <h2 className="panel__title">Phases are a tag, not a planner</h2>
        <div className="route-links">
          {weeklyPhases.map((p) => (
            <span className="chip" key={p.day}>
              {p.day} — {p.phase}
            </span>
          ))}
        </div>
        <p className="panel__lede">
          Each chip reflects a <code>phase</code> tag attached to the
          dispatch.claim events for that day. There is no separate weekly-plan
          object; drop the tag and the strip empties.
        </p>
        <div className="stat-ribbon">
          <div className="stat">
            <span className="stat__value">5</span>
            <span>Tagged days</span>
          </div>
          <div className="stat">
            <span className="stat__value">1</span>
            <span>Source kind — dispatch.claim</span>
          </div>
          <div className="stat">
            <span className="stat__value">0</span>
            <span>New state objects</span>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Queue & responsibilities</p>
          <h2 className="panel__title">Read-only today</h2>
          <p className="panel__lede">
            The queue is a filter over <code>queue.pop</code>-eligible events;
            responsibilities are the subscriptions that put items there in the
            first place. Both columns point back at the same log.
          </p>
        </div>
        <div className="card-grid">
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Active queue</p>
              <span className="vapp-card__status vapp-card__status--partial">
                Live
              </span>
            </div>
            <h3 className="list__title">Three items pending pop</h3>
            <ul className="inline-list">
              {activeQueue.map((q) => (
                <li key={q.id}>
                  <span className="panel__label">{q.id}</span>
                  <span className="list__copy">{q.note}</span>
                </li>
              ))}
            </ul>
            <p className="panel__label">
              source — queue.enqueue events, not a separate queue table.
            </p>
          </article>
          <article className="panel vapp-card">
            <div className="vapp-card__head">
              <p className="list__eyebrow">Responsibilities</p>
              <span className="vapp-card__status vapp-card__status--planned">
                Subscribed
              </span>
            </div>
            <h3 className="list__title">Three standing subscriptions</h3>
            <ul className="inline-list">
              {responsibilities.map((r) => (
                <li key={r.id}>
                  <span className="panel__label">{r.id}</span>
                  <span className="list__copy">{r.note}</span>
                </li>
              ))}
            </ul>
            <p className="panel__label">
              source — responsibility.bind events on the agent record.
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <p className="panel__tag">Checkups</p>
        <h2 className="panel__title">Cadence listeners, not cron</h2>
        <p className="panel__lede">
          Checkups fire on cadence and then read the event log. Each row names
          the event kind the checkup listens for; the checkup itself emits a{" "}
          <code>checkup.fire</code> event and nothing more.
        </p>
        <ul className="inline-list">
          {checkups.map((c) => (
            <li key={c.kind + c.time}>
              <span className="list__eyebrow">{c.time}</span>
              <span className="list__title">{c.kind}</span>
              <span className="list__copy">listens for {c.listensFor}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/vapps/agent-virtual-environment">
            vApp brief
          </Link>
          <Link className="chip" href="/parts/coordination-environment">
            Coordination / Agent Environment
          </Link>
          <Link className="chip" href="/parts/shared-workspace">
            Shared Workspace
          </Link>
          <Link className="chip" href="/launchpad">
            Launchpad
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
