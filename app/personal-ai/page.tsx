import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * Q4 — Where does the Personal AI execute?
 *
 * Doctrine: EMA owns truth. Hermes owns execution. Surfaces do not own
 * state. Personal AI is an identity + execution tuple, not a persona. Its
 * attribution must reach event_log like any other agent.
 *
 * This page stages Q4 against five candidate execution locations, shows
 * the overlap with Q1 (identity) and Q5 (driver contract), and names the
 * smallest provable slice. Q4 itself stays unpicked.
 */

type CandidateStatus = "speculative" | "planned";

const candidates: {
  name: string;
  status: CandidateStatus;
  cost: string;
  identityAssumption: string;
  attributionForces: string;
  breaksIfWrong: string;
}[] = [
  {
    name: "In-daemon (same BEAM)",
    status: "planned",
    cost: "cheapest to wire; shares scheduler, memory, and event_log writer with everything else.",
    identityAssumption:
      "assumes Personal AI is a named agent inside the daemon's own identity space — same namespace as internal agents.",
    attributionForces:
      "forces actor = user-bound agent id, session id minted by the daemon, authority scope inherited from the daemon process.",
    breaksIfWrong:
      "if the user expected isolation, a BEAM crash or hot reload now takes the Personal AI with it; blast radius is daemon-wide.",
  },
  {
    name: "Adjacent Hermes session (own subprocess)",
    status: "planned",
    cost: "one extra subprocess per user; control plane already knows how to dispatch into a Hermes session.",
    identityAssumption:
      "assumes Personal AI is a first-class identity the control plane can bind to its own Hermes execution context.",
    attributionForces:
      "forces actor = personal-ai agent id, session id from the Hermes driver, authority scope carried across the dispatch boundary.",
    breaksIfWrong:
      "if the subprocess drifts out of sync with event_log, attribution gaps appear and the canonical rule silently breaks.",
  },
  {
    name: "External CLI (user's machine, not our daemon)",
    status: "planned",
    cost: "no daemon cost; full cost is on the user's machine and on the wire protocol back into event_log.",
    identityAssumption:
      "assumes Personal AI identity is portable — the same identity can speak from outside the daemon and still be trusted.",
    attributionForces:
      "forces actor = remote-authenticated personal-ai, session id minted on the CLI side, authority scope negotiated on connect.",
    breaksIfWrong:
      "if the CLI can write to event_log without a verified identity bridge, truth ownership leaks out of EMA.",
  },
  {
    name: "Remote peer (someone else's daemon)",
    status: "planned",
    cost: "assumes peer-remote driver exists; adds a trust boundary to every single tool call.",
    identityAssumption:
      "assumes Personal AI identity survives a peer hop — the remote daemon is executing under our user's identity, not its own.",
    attributionForces:
      "forces actor = peer-relayed personal-ai, session id paired to the peer dispatch, authority scope that the remote must honor.",
    breaksIfWrong:
      "if the peer rewrites actor or scope before logging, the log on our side records a lie and Q1 collapses with it.",
  },
  {
    name: "Not first-class yet (speculative)",
    status: "speculative",
    cost: "zero today; Personal AI is just a label on top of existing agents until Q1 is answered.",
    identityAssumption:
      "assumes Personal AI is not a distinct identity at all — it is whatever agent the user is currently driving.",
    attributionForces:
      "forces actor = whichever agent ran, session id from that agent's driver, authority scope inherited from the current surface.",
    breaksIfWrong:
      "if product starts promising Personal AI behavior before Q1 resolves, every downstream surface inherits an unowned identity.",
  },
];

const identityBridge: {
  field: string;
  howItLands: string;
  unresolved: string;
}[] = [
  {
    field: "actor",
    howItLands:
      "the actor field on every event_log row must name the Personal AI as a stable agent identity, not the surface it spoke through.",
    unresolved:
      "unresolved — Q1: is Personal AI one identity per user, one per device, or one per authority scope?",
  },
  {
    field: "agent id",
    howItLands:
      "agent id is the identifier the control plane uses to authorize and bind dispatches; Personal AI needs one that is not a persona string.",
    unresolved:
      "unresolved — Q1: does the agent id live in the user record, the daemon, or an external identity provider?",
  },
  {
    field: "session id",
    howItLands:
      "session id is minted by the driver that runs the execution; whichever candidate Q4 picks determines who mints it.",
    unresolved:
      "unresolved — Q5: the driver contract surface has not named who owns session id for non-hermes-native drivers.",
  },
  {
    field: "authority scope",
    howItLands:
      "the grant attached to the dispatch travels into event_log so every tool.run can be audited against what the user actually authorized.",
    unresolved:
      "unresolved — Q10: how control-plane permission scope maps onto each driver is still open, and Personal AI is the first hard case.",
  },
];

function statusText(s: CandidateStatus): string {
  return s === "speculative" ? "Speculative" : "Planned";
}

function statusClass(s: CandidateStatus): string {
  return s === "speculative"
    ? "vapp-card__status vapp-card__status--planned"
    : "vapp-card__status vapp-card__status--planned";
}

export default function PersonalAIPage() {
  return (
    <SiteShell
      eyebrow="Q4"
      title="Personal AI — execution location"
      intro="Q4 asks where the Personal AI actually runs — in-daemon, adjacent Hermes session, external CLI, remote peer, or not first-class yet. The question overlaps Q1 (what identity is the Personal AI) and Q5 (what contract a driver must satisfy), and cannot be closed before either. This page stages the candidates without picking one."
    >
      <section className="panel">
        <p className="panel__tag">Definition</p>
        <h2 className="panel__title">What Personal AI is and is not</h2>
        <p className="panel__lede">
          Personal AI is an identity + execution tuple. It is a named agent
          identity bound to a user, paired with a location where its work
          actually runs. Attribution has to reach <code>event_log</code> the
          same way any other agent's does — through actor, agent id, session
          id, and authority scope.
        </p>
        <ul className="inline-list">
          <li>
            <span className="list__eyebrow">is</span>
            <span className="list__copy">
              a first-class agent identity the control plane can authorize
              and dispatch into an execution location.
            </span>
          </li>
          <li>
            <span className="list__eyebrow">is not</span>
            <span className="list__copy">
              a persona, a system-prompt preset, a voice, or a mascot.
            </span>
          </li>
          <li>
            <span className="list__eyebrow">is not</span>
            <span className="list__copy">
              a surface; surfaces do not own state, and Personal AI is not
              "the sidebar chat" or "the desktop app."
            </span>
          </li>
          <li>
            <span className="list__eyebrow">is not</span>
            <span className="list__copy">
              a driver; drivers are how execution happens, Personal AI is
              whose execution it is.
            </span>
          </li>
        </ul>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Candidates</p>
          <h2 className="panel__title">Five execution candidates</h2>
          <p className="panel__lede">
            Each candidate carries a cost, an identity assumption, an
            attribution consequence, and a failure mode if it is picked
            without Q1 and Q5 settled. None of them are picked here.
          </p>
        </div>
        <div className="card-grid">
          {candidates.map((c) => (
            <article className="panel vapp-card" key={c.name}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">{c.name}</p>
                <span className={statusClass(c.status)}>
                  {statusText(c.status)}
                </span>
              </div>
              <h3 className="list__title">cost</h3>
              <p className="list__copy">{c.cost}</p>
              <p className="panel__label">identity assumption</p>
              <p className="list__copy">{c.identityAssumption}</p>
              <p className="panel__label">attribution forces</p>
              <p className="list__copy">{c.attributionForces}</p>
              <p className="panel__label">breaks if chosen wrongly</p>
              <p className="list__copy">{c.breaksIfWrong}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="vapp-card__head">
          <p className="panel__tag">Identity bridge (touches Q1)</p>
          <span className="vapp-card__status vapp-card__status--planned">
            Q1 open
          </span>
        </div>
        <h2 className="panel__title">
          How Personal AI attribution reaches event_log
        </h2>
        <p className="panel__lede">
          Four fields have to line up on every row the Personal AI produces.
          Each one ends in an unresolved question that Q4 alone cannot
          answer.
        </p>
        <ul className="inline-list">
          {identityBridge.map((b) => (
            <li key={b.field}>
              <span className="list__eyebrow">{b.field}</span>
              <span className="list__copy">{b.howItLands}</span>
              <span className="panel__label">{b.unresolved}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <p className="panel__tag">Smallest provable slice</p>
        <h2 className="panel__title">
          Adjacent Hermes session, one user identity — but only after Q1
        </h2>
        <p className="panel__lede">
          Personal AI as an adjacent Hermes session bound to a single user
          identity is the cheapest slice that still respects the canonical
          rule: EMA owns truth, Hermes owns execution, the surface owns
          nothing. It reuses the driver path already in flight and keeps
          attribution inside the control plane.
        </p>
        <p className="panel__label">
          this only holds if Q1 has already picked what "a single user
          identity" means. Without Q1, the slice collapses to: Personal AI
          is a named agent identity in the control plane and nothing else
          yet — no execution location claimed, no driver bound, no session
          minted.
        </p>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/driver-matrix">
            Driver matrix
          </Link>
          <Link className="chip" href="/project-space">
            Project space
          </Link>
          <Link className="chip" href="/chat/tenanted">
            Tenanted chat
          </Link>
          <Link className="chip" href="/open-questions-map">
            Open questions map
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
