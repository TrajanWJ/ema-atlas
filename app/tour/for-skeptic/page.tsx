import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * /tour/for-skeptic — A 10-minute skeptic's tour.
 *
 * Ordered to answer the hardest objections early. The canonical rule and
 * the open questions come before any mockup. Pairs with /tour/for-engineer.
 */

type Stop = {
  n: number;
  title: string;
  objection: string;
  framing: string;
  primary: { href: string; label: string };
  related: { href: string; label: string }[];
};

const stops: Stop[] = [
  {
    n: 1,
    title: "Start with the rule, not the demo",
    objection:
      "Surfaces like this always drift into being the state container.",
    framing:
      "Fair concern — most dashboards do drift, because nothing in the codebase forbids it. The canonical rule is written down precisely so the drift has something to hit. Read the rule before any screen, and judge every later stop against it.",
    primary: { href: "/canonical-rule", label: "Open /canonical-rule" },
    related: [
      { href: "/parts/ema", label: "EMA part" },
      { href: "/parts/hermes", label: "Hermes part" },
    ],
  },
  {
    n: 2,
    title: "Four planes, four owners",
    objection: "So which box holds which thing, really?",
    framing:
      "The rule only helps if the ownership lines are concrete. State planes names the four — truth, execution, projection, tenancy — and pins each to a single owner. If a reader cannot point at the owner of a given datum, the rule is aspirational; if they can, it is enforceable.",
    primary: { href: "/state-planes", label: "Open /state-planes" },
    related: [
      { href: "/parts/projections", label: "Projections part" },
      { href: "/parts/tenancy", label: "Tenancy part" },
    ],
  },
  {
    n: 3,
    title: "Show me what this forbids",
    objection: "Talk is cheap; what behavior is disallowed?",
    framing:
      "A doctrine that forbids nothing is decoration. The anti-patterns page is the list of moves the system rules out: surfaces writing their own store, agents bypassing Hermes, tenancy as a guess. Each entry is a concrete 'no' with a reason attached.",
    primary: { href: "/anti-patterns", label: "Open /anti-patterns" },
    related: [
      { href: "/canonical-rule", label: "Back to the rule" },
      { href: "/parts/control-plane", label: "Control plane" },
    ],
  },
  {
    n: 4,
    title: "Open questions, on purpose",
    objection: "Every atlas hides its unknowns.",
    framing:
      "The skeptic is right that polished docs tend to paper over the undecided parts. The open-questions map exists to refuse that. The live questions are enumerated, scoped, and linked from the surfaces whose behavior they would change.",
    primary: { href: "/open-questions-map", label: "Open /open-questions-map" },
    related: [
      { href: "/questions", label: "Questions registry" },
      { href: "/blueprint", label: "Three-futures view" },
    ],
  },
  {
    n: 5,
    title: "Ship order proves it",
    objection: "You'd ship the flashy thing first if this were vaporware.",
    framing:
      "Order of construction is a tell. Ship order lays out what is built before what, and why — the rule and the state planes land before any named surface. If the order were inverted, the skeptic would be right; it is not, and the page shows the sequence.",
    primary: { href: "/ship-order", label: "Open /ship-order" },
    related: [
      { href: "/vapps", label: "Surface catalog" },
      { href: "/parts", label: "Parts index" },
    ],
  },
  {
    n: 6,
    title: "Now look at one concrete surface",
    objection: "Fine, show me Chat without making it the truth layer.",
    framing:
      "Only after the first five stops is it safe to look at a surface. Chat is the sharp test: messaging systems almost always own their own store. Here, messages are EMA entities, and the tenanted view pulls the scope boundary to the foreground so the claim is inspectable, not asserted.",
    primary: { href: "/chat", label: "Open /chat" },
    related: [
      { href: "/chat/tenanted", label: "Tenanted chat" },
      { href: "/vapps/chat", label: "Chat brief" },
    ],
  },
];

export default function ForSkepticTourPage() {
  return (
    <SiteShell
      eyebrow="Tour"
      title="For the skeptic"
      intro="If you walked in thinking this is just an agent control panel, this is the path that tries to convince you otherwise in about 10 minutes. It leads with the canonical rule and the open questions, then works outward to one concrete surface. Objections come first; mockups come last."
    >
      <section className="panel">
        <p className="panel__tag">How to read this tour</p>
        <h2 className="panel__title">Hardest objections, answered first.</h2>
        <p className="panel__lede">
          Six stops, ordered so the rule and the unknowns land before any
          surface does. At each stop, the skeptic's likely objection is stated
          plainly, then the stop tries to earn the click. If a stop does not
          answer its objection, that is a finding worth writing down.
        </p>
        <div className="route-links">
          <Link className="chip" href="/canonical-rule">
            Start with the rule
          </Link>
          <Link className="chip" href="/open-questions-map">
            Open questions map
          </Link>
          <Link className="chip" href="/anti-patterns">
            Anti-patterns
          </Link>
        </div>
      </section>

      {stops.map((stop) => (
        <section className="panel" key={stop.n}>
          <p className="panel__tag">Stop {stop.n}</p>
          <h2 className="panel__title">
            {stop.n}. {stop.title}
          </h2>
          <p>
            <span className="panel__label">Anticipated objection</span>{" "}
            {stop.objection}
          </p>
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
        <p className="panel__tag">Takeaways</p>
        <h2 className="panel__title">Rebuttal patterns to reuse.</h2>
        <ul>
          <li>
            <strong>Point at the owner.</strong> When a claim about state feels
            fuzzy, ask which of the four planes owns it. If no one can answer,
            the drift has already started — the rule names the owner so the
            question has a short answer.
          </li>
          <li>
            <strong>Name what is forbidden.</strong> A doctrine is only real if
            it rules moves out. When something looks too convenient, check it
            against the anti-patterns list; if it is not forbidden there, it is
            not actually constrained.
          </li>
          <li>
            <strong>Check the unknowns are on the page.</strong> Any atlas that
            cannot show you its open questions is hiding them. The
            open-questions map and the three-futures view exist so the
            undecided parts stay visible instead of collapsing into a default.
          </li>
        </ul>
        <div className="route-links">
          <Link className="chip" href="/demo/surface-tour">
            Navigate — Surface tour
          </Link>
          <Link className="chip" href="/tour/for-engineer">
            Navigate — Engineer tour
          </Link>
          <Link className="chip" href="/vapps">
            Navigate — vApps
          </Link>
          <Link className="chip" href="/questions">
            Navigate — Questions
          </Link>
          <Link className="chip" href="/parts">
            Navigate — Parts
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
