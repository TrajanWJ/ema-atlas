import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * /agent-day — a narrated day in the life of a single Hermes-native agent
 * ("claude-a1") working in project ema-0.0.3, space core. The narrative is
 * stitched together from concrete event_log entries; every stop below is
 * defensible as something an outside observer could verify by reading the
 * log. Surfaces do not own state — they project these events.
 */

type Stop = {
  time: string;
  title: string;
  eventKind: string;
  eventId: string;
  objects: string[];
  narration: string;
  renders: { href: string; label: string }[];
};

const stops: Stop[] = [
  {
    time: "09:02",
    title: "claim a dispatch",
    eventKind: "dispatch.claimed",
    eventId: "evt_02133",
    objects: ["DispatchId disp_04H7K9", "ExecutionId ex_01H9TQ2M"],
    narration:
      "claude-a1 emits a dispatch.claimed event against an open dispatch in project ema-0.0.3. The claim binds the dispatch to an execution id, moving the row from unclaimed to in-flight on the agent's today-view. No other state is written.",
    renders: [
      { href: "/agent-environment", label: "/agent-environment" },
      { href: "/hq/project", label: "/hq/project" },
    ],
  },
  {
    time: "09:15",
    title: "open chat with driver hermes-native",
    eventKind: "session.started",
    eventId: "evt_02147",
    objects: ["SessionId sess_01H9TQ4R", "ExecutionId ex_01H9TQ2M"],
    narration:
      "A session.started event is written as claude-a1 opens a chat tied to the claimed execution. The session is tenanted to project ema-0.0.3, space core, and references the driver hermes-native binding so downstream tool calls inherit the same tenancy.",
    renders: [
      { href: "/chat", label: "/chat" },
      { href: "/chat/tenanted", label: "/chat/tenanted" },
    ],
  },
  {
    time: "10:04",
    title: "tool call: edit wiki node",
    eventKind: "tool.called · wiki.node.edited",
    eventId: "evt_02201 · evt_02202",
    objects: [
      "ToolCallId tc_01H9TQ7V",
      "WikiNodeId wn_example",
      "RevisionId rev_00041",
    ],
    narration:
      "claude-a1 invokes the wiki.edit tool; Hermes records a tool.called event and, on success, a wiki.node.edited event with a new revision id. The node's rendered body on /wiki/node/example updates because the surface re-reads the latest revision from the log, not because the surface held any prior state.",
    renders: [
      { href: "/wiki", label: "/wiki" },
      { href: "/wiki/node/example", label: "/wiki/node/example" },
    ],
  },
  {
    time: "11:20",
    title: "inline prompt thread resolved",
    eventKind: "collab.thread.resolved",
    eventId: "evt_02268",
    objects: [
      "ThreadId thr_01H9TQA3",
      "WikiNodeId wn_example",
      "QuestionId Q2-open",
    ],
    narration:
      "An inline prompt thread anchored to wn_example is marked resolved by claude-a1; the event carries a back-reference to Q2-open, which stays flagged as a live question on the node. The thread chip collapses on /wiki while Q2's open-question badge persists.",
    renders: [{ href: "/wiki", label: "/wiki" }],
  },
  {
    time: "12:40",
    title: "lunch / checkpoint",
    eventKind: "cadence:checkpoint",
    eventId: "evt_02304",
    objects: ["CadenceId cad_daily_08", "ExecutionId ex_01H9TQ2M"],
    narration:
      "The daily cadence listener fires a checkpoint event against claude-a1's open execution. It writes no progress of its own — it only scans for dispatches past their heartbeat window and surfaces a quiet block on the agent's day timeline.",
    renders: [{ href: "/agent-environment", label: "/agent-environment" }],
  },
  {
    time: "13:30",
    title: "handoff authored",
    eventKind: "handoff.created",
    eventId: "evt_02352",
    objects: [
      "HandoffId ho_01H9TQC8",
      "DispatchId disp_04H7K9",
      "ThreadId thr_01H9TQC9",
    ],
    narration:
      "claude-a1 writes a handoff addressed to the next agent on the lane. The handoff.created event links to the original dispatch and opens a thread on /threads; /hq/project picks up the handoff as a new row under the project's in-flight work.",
    renders: [
      { href: "/threads", label: "/threads" },
      { href: "/hq/project", label: "/hq/project" },
    ],
  },
  {
    time: "15:00",
    title: "incident acked",
    eventKind: "incident.acked",
    eventId: "evt_02418",
    objects: ["IncidentId inc_01H9TQE1", "ExecutionId ex_01H9TQ2M"],
    narration:
      "An incident opened elsewhere in project ema-0.0.3 is acknowledged by claude-a1. The incident.acked event attaches the agent to the incident's responder list; the incident row on /hq moves from unacked to acked and the project surface reflects the new responder.",
    renders: [
      { href: "/hq", label: "/hq" },
      { href: "/hq/project", label: "/hq/project" },
    ],
  },
  {
    time: "16:45",
    title: "end-of-day handoff queued",
    eventKind: "queue.item.created",
    eventId: "evt_02477",
    objects: [
      "QueueItemId qi_01H9TQG7",
      "HandoffId ho_01H9TQC8",
      "phase=Handoff",
    ],
    narration:
      "claude-a1 closes the day by emitting a queue.item.created event tagged phase=Handoff. The item points at the morning handoff and lands on the personal HQ queue for the next shift; the agent-environment timeline shows the day ending on a queued item rather than a new claim.",
    renders: [
      { href: "/agent-environment", label: "/agent-environment" },
      { href: "/hq/personal", label: "/hq/personal" },
    ],
  },
];

export default function AgentDayPage() {
  return (
    <SiteShell
      eyebrow="Narrative"
      title="A day in the life of claude-a1"
      intro="This route narrates a single working day as a sequence of control-plane events projected into the surfaces. claude-a1 is a Hermes-native agent in project ema-0.0.3, space core. Nothing below is inferred from internal state — every stop corresponds to a concrete event_log entry and the surfaces that render it."
    >
      {stops.map((s) => (
        <section className="panel" key={s.eventId}>
          <p className="panel__tag">
            {s.time} — {s.title}
          </p>
          <h2 className="panel__title">
            <code>{s.eventKind}</code>
          </h2>
          <p className="panel__label">
            <code>{s.eventId}</code> · {s.objects.join(" · ")}
          </p>
          <p className="panel__lede">{s.narration}</p>
          <div className="route-links">
            {s.renders.map((r) => (
              <Link className="chip" href={r.href} key={r.href}>
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="panel">
        <p className="panel__tag">Takeaways</p>
        <h2 className="panel__title">The day is legible from the log</h2>
        <ul>
          <li>
            Every move claude-a1 made left a trace — eight stops, eight event
            ids, no gaps narrated from internal monologue.
          </li>
          <li>
            Each surface above projected from the same event_log; /chat,
            /wiki, /hq, /threads, and /agent-environment are all rendering
            different facets of one stream.
          </li>
          <li>
            Q2 stayed visibly open where it was touched; by doctrine Q6 and
            Q10 also stay open wherever their anchors were crossed today —
            resolving a thread does not close a question.
          </li>
        </ul>
        <div className="route-links">
          <Link className="chip" href="/agent-environment">
            /agent-environment
          </Link>
          <Link className="chip" href="/demo/surface-tour">
            /demo/surface-tour
          </Link>
          <Link className="chip" href="/canonical-rule">
            /canonical-rule
          </Link>
          <Link className="chip" href="/questions">
            /questions
          </Link>
          <Link className="chip" href="/launchpad">
            /launchpad
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
