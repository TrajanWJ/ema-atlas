import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * /human-day — a narrated day in the life of the human user @tawj working
 * across EMA surfaces in project ema-0.0.3, space core. Mirror of
 * /agent-day, scoped to the moves only a human makes: approvals, prose,
 * triage, project switching, handoffs. Every stop is defensible from the
 * event_log; surfaces project these events, they do not own state.
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
    time: "08:40",
    title: "open Launchpad, switch project",
    eventKind: "launchpad.project.switched",
    eventId: "evt_03011",
    objects: ["ProjectId ema-0.0.3", "SpaceId core", "ActorId user_tawj"],
    narration:
      "@tawj opens Launchpad and selects project ema-0.0.3 in space core. A launchpad.project.switched event binds the session's active tenancy to that project; subsequent reads on every surface inherit the new scope. No project state is mutated.",
    renders: [
      { href: "/launchpad", label: "/launchpad" },
      { href: "/launchpad/command", label: "/launchpad/command" },
    ],
  },
  {
    time: "09:05",
    title: "read chronicle, catch up",
    eventKind: "chronicle.read",
    eventId: "evt_03044",
    objects: ["Scope project:ema-0.0.3", "ActorId user_tawj"],
    narration:
      "@tawj opens the project HQ and scrolls the chronicle. A chronicle.read event records the cursor position against the project scope. The surface renders the same event_log slice any agent would see; the read event only marks where @tawj has caught up to.",
    renders: [{ href: "/hq/project", label: "/hq/project" }],
  },
  {
    time: "09:40",
    title: "approve pending proposal",
    eventKind: "proposal.decided",
    eventId: "evt_03088",
    objects: [
      "ProposalId proposal_44",
      "Decision approved",
      "ActorId user_tawj",
    ],
    narration:
      "A proposal pending human sign-off is approved. The proposal.decided event flips proposal_44 from open to approved and attaches @tawj as the deciding actor. Downstream dispatches waiting on this decision become claimable on /hq/project.",
    renders: [{ href: "/hq/project", label: "/hq/project" }],
  },
  {
    time: "10:30",
    title: "open wiki node, author prose",
    eventKind: "wiki.node.edited",
    eventId: "evt_03142",
    objects: [
      "WikiNodeId node_wiki_shared_workspace",
      "RevisionId rev_00072",
      "ActorId user_tawj",
    ],
    narration:
      "@tawj opens the shared-workspace wiki node and writes prose by hand. A wiki.node.edited event lands with a new revision id authored by user_tawj. The node body on /wiki/node/example re-renders from the new revision; no surface cache is involved.",
    renders: [
      { href: "/wiki", label: "/wiki" },
      { href: "/wiki/node/example", label: "/wiki/node/example" },
    ],
  },
  {
    time: "11:45",
    title: "resolve inline-prompt thread",
    eventKind: "collab.thread.resolved",
    eventId: "evt_03197",
    objects: [
      "ThreadId thr_02H9VA6",
      "WikiNodeId node_wiki_shared_workspace",
      "QuestionId Q2-open",
    ],
    narration:
      "@tawj marks an inline prompt thread on the node as resolved. The collab.thread.resolved event carries a back-reference to Q2-open, which stays flagged on the node. The thread chip collapses on /wiki; Q2's open-question badge remains.",
    renders: [{ href: "/wiki", label: "/wiki" }],
  },
  {
    time: "13:15",
    title: "triage incident",
    eventKind: "incident.acked",
    eventId: "evt_03251",
    objects: ["IncidentId incident_17", "ActorId user_tawj"],
    narration:
      "An incident opened against project ema-0.0.3 is acknowledged by @tawj. The incident.acked event attaches the human as a responder; the incident row on /hq/project moves from unacked to acked and the responder list updates on the project surface.",
    renders: [{ href: "/hq/project", label: "/hq/project" }],
  },
  {
    time: "14:30",
    title: "cross-project check",
    eventKind: "hq.personal.opened",
    eventId: "evt_03309",
    objects: ["ActorId user_tawj", "Scope personal"],
    narration:
      "@tawj opens the personal HQ to scan work across projects. A hq.personal.opened event records the surface view against user_tawj. The page renders queue items and handoffs addressed to @tawj, pulled from the same event_log under a personal scope.",
    renders: [{ href: "/hq/personal", label: "/hq/personal" }],
  },
  {
    time: "16:30",
    title: "end-of-day handoff",
    eventKind: "handoff.created",
    eventId: "evt_03376",
    objects: [
      "HandoffId handoff_01H9V...",
      "ThreadId thr_02H9VE1",
      "ActorId user_tawj",
    ],
    narration:
      "@tawj closes the day by authoring a handoff to the next agent on the lane. The handoff.created event opens a thread on /threads and lands a row on /handoff; /agent-environment picks up the handoff as an inbound item for the next claimant.",
    renders: [
      { href: "/handoff", label: "/handoff" },
      { href: "/threads", label: "/threads" },
      { href: "/agent-environment", label: "/agent-environment" },
    ],
  },
];

export default function HumanDayPage() {
  return (
    <SiteShell
      eyebrow="Narrative"
      title="A day in the life of @tawj"
      intro="This route mirrors /agent-day but narrates the moves only a human makes across EMA: approving proposals, triaging incidents, writing wiki prose, switching projects, handing off. Each stop below is a concrete control-plane event projected into a surface. Nothing is inferred from intent — every sentence is defensible from event_log."
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
        <h2 className="panel__title">The human day has the same shape as the agent day</h2>
        <ul>
          <li>
            Human moves are the same shape as agent moves — both @tawj and
            claude-a1 project through event_log, and every surface above
            rendered from the same stream.
          </li>
          <li>
            Approvals and prose are where humans remain load-bearing:
            proposal.decided and wiki.node.edited authored by user_tawj gate
            work that agents cannot unblock on their own.
          </li>
          <li>
            Q1 and Q2 stayed open across the day — neither the approval nor
            the thread resolution closed their anchor questions; resolving a
            thread does not resolve a question.
          </li>
        </ul>
        <div className="route-links">
          <Link className="chip" href="/agent-day">
            /agent-day
          </Link>
          <Link className="chip" href="/canonical-rule">
            /canonical-rule
          </Link>
          <Link className="chip" href="/hq">
            /hq
          </Link>
          <Link className="chip" href="/wiki">
            /wiki
          </Link>
          <Link className="chip" href="/launchpad">
            /launchpad
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
