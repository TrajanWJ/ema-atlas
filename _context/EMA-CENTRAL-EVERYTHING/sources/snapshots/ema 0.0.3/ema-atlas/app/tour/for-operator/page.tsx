import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * /tour/for-operator — The operator's tour.
 *
 * For the person running EMA in production. Pairs with /tour/for-skeptic
 * and /tour/for-engineer. Ordered around what to watch, what to rotate,
 * and what requires a human decision.
 */

type Stop = {
  n: number;
  title: string;
  framing: string;
  primary: { href: string; label: string };
  related: { href: string; label: string }[];
};

const stops: Stop[] = [
  {
    n: 1,
    title: "Chronicle is your ground truth",
    framing:
      "Read the chronicle before you read HQ. HQ is a projection; the chronicle is the append-only record HQ projects from. If HQ and the chronicle disagree, trust the chronicle and fix the projection.",
    primary: { href: "/chronicle", label: "Open /chronicle" },
    related: [
      { href: "/parts/ema", label: "EMA part" },
      { href: "/parts/projections", label: "Projections" },
    ],
  },
  {
    n: 2,
    title: "Incidents and the babysitter",
    framing:
      "The babysitter is the process that will wake you up. Know the invariants it watches before it pages you at 3am, so you can tell a real incident from a noisy one on the first glance.",
    primary: { href: "/incidents", label: "Open /incidents" },
    related: [
      { href: "/chronicle", label: "Chronicle" },
      { href: "/parts/control-plane", label: "Control plane" },
    ],
  },
  {
    n: 3,
    title: "Proposal flow — what needs a human decision",
    framing:
      "Some moves must not auto-advance. The proposal flow is the list of actions that require a human to say yes. Treat this as the ops contract: if something on this list ever ships without approval, that is a bug in the platform, not a feature.",
    primary: { href: "/proposal-flow", label: "Open /proposal-flow" },
    related: [
      { href: "/anti-patterns", label: "Anti-patterns" },
      { href: "/canonical-rule", label: "Canonical rule" },
    ],
  },
  {
    n: 4,
    title: "Secrets boundary",
    framing:
      "One rule, and it is the one that gets a system into the news when it breaks. Secrets live on the server side of the boundary; no surface caches them, no projection echoes them. Know the line and refuse to blur it.",
    primary: { href: "/secrets-boundary", label: "Open /secrets-boundary" },
    related: [
      { href: "/parts/tenancy", label: "Tenancy" },
      { href: "/anti-patterns", label: "Anti-patterns" },
    ],
  },
  {
    n: 5,
    title: "Driver matrix — what's in production",
    framing:
      "Today only hermes-native is live. Everything else on the matrix is a future risk you are inheriting on paper but not yet running. Check the matrix before you promise a customer a driver is supported.",
    primary: { href: "/driver-matrix", label: "Open /driver-matrix" },
    related: [
      { href: "/parts/hermes", label: "Hermes part" },
      { href: "/ship-order", label: "Ship order" },
    ],
  },
  {
    n: 6,
    title: "Mesh pressure — what you would regret shipping",
    framing:
      "The biggest operator trap is shipping replication before semantics. Mesh pressure is where that trap is drawn. If you let the mesh advance before the semantics are pinned, you will spend the next quarter rolling it back.",
    primary: { href: "/mesh", label: "Open /mesh" },
    related: [
      { href: "/open-questions-map", label: "Open questions" },
      { href: "/blueprint", label: "Three-futures view" },
    ],
  },
  {
    n: 7,
    title: "Where decisions are still open",
    framing:
      "Know which questions you are not allowed to silently close. The open-questions map is the set of decisions that must stay visible; if an operator closes one by habit, the platform has drifted and no one noticed.",
    primary: { href: "/open-questions-map", label: "Open /open-questions-map" },
    related: [
      { href: "/questions", label: "Questions registry" },
      { href: "/blueprint", label: "Blueprint" },
    ],
  },
];

export default function ForOperatorTourPage() {
  return (
    <SiteShell
      eyebrow="Tour"
      title="For the operator"
      intro="You run this thing. This is what to watch, what to rotate, what to defer. Seven stops, ordered around incidents, proposals, secrets, and the replication boundary — then a short daily checklist you can keep on one screen."
    >
      <section className="panel">
        <p className="panel__tag">How to read this tour</p>
        <h2 className="panel__title">Seven stops, then a daily checklist.</h2>
        <p className="panel__lede">
          EMA owns truth. Hermes owns execution. Surfaces do not own state. The
          operator's job is to keep those lines honest while the system is
          running — which means watching the chronicle, respecting the proposal
          flow, and refusing to ship replication before semantics.
        </p>
        <div className="route-links">
          <Link className="chip" href="/chronicle">
            Chronicle
          </Link>
          <Link className="chip" href="/incidents">
            Incidents
          </Link>
          <Link className="chip" href="/secrets-boundary">
            Secrets boundary
          </Link>
        </div>
      </section>

      {stops.map((stop) => (
        <section className="panel" key={stop.n}>
          <p className="panel__tag">Stop {stop.n}</p>
          <h2 className="panel__title">
            {stop.n}. {stop.title}
          </h2>
          <p className="panel__lede">{stop.framing}</p>
          <div className="route-links">
            <Link className="chip" href={stop.primary.href}>
              {stop.primary.label}
            </Link>
            {stop.related.map((r) => (
              <Link className="chip" key={r.href} href={r.href}>
                {r.label}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="panel">
        <p className="panel__tag">Checklist</p>
        <h2 className="panel__title">Operator daily checklist.</h2>
        <ul>
          <li>
            <strong>Watch the chronicle for <code>incident.*</code>.</strong>{" "}
            Scan the append-only log for incident events before you look at any
            dashboard. If the chronicle is clean, the dashboards are allowed to
            be clean.
          </li>
          <li>
            <strong>Review pending proposals in HQ.</strong> Every item in the
            proposal queue is a move that explicitly required a human. Clear it
            or reject it — do not let it sit long enough to become ambient.
          </li>
          <li>
            <strong>Confirm no surface cached a secret.</strong> Walk the
            secrets boundary once a day. A surface that quietly started holding
            a credential is the failure mode that ends up in the post-mortem.
          </li>
          <li>
            <strong>Audit driver health.</strong> Hermes-native is the only
            driver in production; if the matrix ever shows a second driver live
            without a ship-order entry, something advanced without approval.
          </li>
          <li>
            <strong>Note any open question you touched today.</strong> If your
            work implicitly answered an open question, write it down on the
            open-questions map. Silent closures are the slowest kind of drift.
          </li>
        </ul>
        <div className="route-links">
          <Link className="chip" href="/tour/for-skeptic">
            Navigate — Skeptic tour
          </Link>
          <Link className="chip" href="/tour/for-engineer">
            Navigate — Engineer tour
          </Link>
          <Link className="chip" href="/canonical-rule">
            Navigate — Canonical rule
          </Link>
          <Link className="chip" href="/questions">
            Navigate — Questions
          </Link>
          <Link className="chip" href="/anti-patterns">
            Navigate — Anti-patterns
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
