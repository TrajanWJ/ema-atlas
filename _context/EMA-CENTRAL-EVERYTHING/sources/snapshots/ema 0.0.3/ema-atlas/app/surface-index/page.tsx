import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

type RouteEntry = {
  href: string;
  title: string;
  blurb: string;
};

type RouteGroup = {
  heading: string;
  routes: RouteEntry[];
};

const groups: RouteGroup[] = [
  {
    heading: "Named surfaces (vApps + shells)",
    routes: [
      {
        href: "/launchpad",
        title: "/launchpad",
        blurb: "Win8 tile start screen for the 8 named surfaces.",
      },
      {
        href: "/launchpad/command",
        title: "/launchpad/command",
        blurb: "Keyboard-first command-bar variant of the launchpad.",
      },
      {
        href: "/hq",
        title: "/hq",
        blurb: "Base HQ read surface over the control plane.",
      },
      {
        href: "/hq/personal",
        title: "/hq/personal",
        blurb: "Cross-project personal HQ for one user.",
      },
      {
        href: "/hq/project",
        title: "/hq/project",
        blurb: "Single-project HQ scoped to one workspace.",
      },
      {
        href: "/wiki",
        title: "/wiki",
        blurb: "Semantic-layer vApp mockup over typed nodes.",
      },
      {
        href: "/wiki/node/example",
        title: "/wiki/node/example",
        blurb: "Single wiki node deep view with edges and provenance.",
      },
      {
        href: "/chat",
        title: "/chat",
        blurb: "EMA-native chat mockup bound to the control plane.",
      },
      {
        href: "/chat/tenanted",
        title: "/chat/tenanted",
        blurb: "Multi-tenant chat variant with scope switching.",
      },
      {
        href: "/threads",
        title: "/threads",
        blurb: "Discord-migration wedge vApp for threaded discussion.",
      },
      {
        href: "/threads/bridge",
        title: "/threads/bridge",
        blurb: "Q6 bridge-direction decision surface for Discord sync.",
      },
      {
        href: "/agent-environment",
        title: "/agent-environment",
        blurb: "Agent virtual environment for tool and capability access.",
      },
      {
        href: "/blueprint",
        title: "/blueprint",
        blurb: "Three-futures typed canvas for Part-level sketches.",
      },
      {
        href: "/desktop",
        title: "/desktop",
        blurb: "Virtual Desktop mockup, pre-existing before this wave.",
      },
      {
        href: "/vapps",
        title: "/vapps",
        blurb: "Eight-surface catalog, pre-existing before this wave.",
      },
      {
        href: "/vapps",
        title: "/vapps/[slug]",
        blurb: "Existing per-surface detail routes, reached via the vApps catalog.",
      },
    ],
  },
  {
    heading: "Doctrine & rules",
    routes: [
      {
        href: "/canonical-rule",
        title: "/canonical-rule",
        blurb: "The canonical rule, made concrete with examples.",
      },
      {
        href: "/state-planes",
        title: "/state-planes",
        blurb: "Four state planes deep dive: truth, control, collab, surface.",
      },
      {
        href: "/surfaces-map",
        title: "/surfaces-map",
        blurb: "Surface by plane mapping grid across the atlas.",
      },
      {
        href: "/anti-patterns",
        title: "/anti-patterns",
        blurb: "Consolidated forbidden-patterns catalog with rationale.",
      },
      {
        href: "/evidence-tiers",
        title: "/evidence-tiers",
        blurb: "Confirmed, Inferred, Speculative discipline across claims.",
      },
      {
        href: "/secrets-boundary",
        title: "/secrets-boundary",
        blurb: "Secrets handling rules and boundary enforcement.",
      },
    ],
  },
  {
    heading: "Control-plane objects & flows",
    routes: [
      {
        href: "/chronicle",
        title: "/chronicle",
        blurb: "Raw event_log reader mockup over append-only truth.",
      },
      {
        href: "/event-kinds",
        title: "/event-kinds",
        blurb: "Canonical event-kinds catalog with shapes and emitters.",
      },
      {
        href: "/incidents",
        title: "/incidents",
        blurb: "Incident lifecycle and babysitter watch surface.",
      },
      {
        href: "/proposal-flow",
        title: "/proposal-flow",
        blurb: "Proposal to decision lifecycle as typed events.",
      },
      {
        href: "/handoff",
        title: "/handoff",
        blurb: "Handoff typed workspace artifact between agents.",
      },
      {
        href: "/inbox",
        title: "/inbox",
        blurb: "Shared workspace inbox across agents and humans.",
      },
      {
        href: "/weekly-cadence",
        title: "/weekly-cadence",
        blurb: "Phases and cadence listeners across the week.",
      },
      {
        href: "/workspace-contract",
        title: "/workspace-contract",
        blurb: "Typed workspace contract binding agents to a project.",
      },
    ],
  },
  {
    heading: "Harness / execution",
    routes: [
      {
        href: "/driver-matrix",
        title: "/driver-matrix",
        blurb: "Five drivers crossed with six capabilities as a matrix.",
      },
      {
        href: "/hermes-contract",
        title: "/hermes-contract",
        blurb: "Hermes to EMA contract surface for execution handoffs.",
      },
    ],
  },
  {
    heading: "Identity & scope",
    routes: [
      {
        href: "/project-space",
        title: "/project-space",
        blurb: "Org, Project, Space, Agent, User identity model.",
      },
      {
        href: "/personal-ai",
        title: "/personal-ai",
        blurb: "Q4 Personal AI execution location pressure.",
      },
      {
        href: "/mesh",
        title: "/mesh",
        blurb: "Q9 replication-boundary pressure on the mesh.",
      },
    ],
  },
  {
    heading: "Open questions & decisions",
    routes: [
      {
        href: "/open-questions-map",
        title: "/open-questions-map",
        blurb: "Q1 through Q10 crossed with surfaces as a cross-index.",
      },
      {
        href: "/collab-plane-options",
        title: "/collab-plane-options",
        blurb: "Q2 and Q8 transport candidates for the collab plane.",
      },
      {
        href: "/ship-order",
        title: "/ship-order",
        blurb: "Which surface ships first and why, as a sequence.",
      },
      {
        href: "/discord-migration",
        title: "/discord-migration",
        blurb: "Full Discord to EMA threads migration sequence.",
      },
    ],
  },
  {
    heading: "Scenarios & narratives",
    routes: [
      {
        href: "/agent-day",
        title: "/agent-day",
        blurb: "Agent day-in-the-life narrative across surfaces.",
      },
      {
        href: "/human-day",
        title: "/human-day",
        blurb: "Human day-in-the-life narrative across surfaces.",
      },
      {
        href: "/scenarios/incident-response",
        title: "/scenarios/incident-response",
        blurb: "Stalled-execution incident response walkthrough.",
      },
      {
        href: "/scenarios/onboarding",
        title: "/scenarios/onboarding",
        blurb: "New-user onboarding walkthrough across surfaces.",
      },
    ],
  },
  {
    heading: "Tours & gallery",
    routes: [
      {
        href: "/demo/surface-tour",
        title: "/demo/surface-tour",
        blurb: "Sixteen-stop generalist tour across the atlas.",
      },
      {
        href: "/tour/for-skeptic",
        title: "/tour/for-skeptic",
        blurb: "Skeptic's tour, framed around doubts and proof.",
      },
      {
        href: "/tour/for-engineer",
        title: "/tour/for-engineer",
        blurb: "Engineer's tour, framed around contracts and planes.",
      },
      {
        href: "/tour/for-operator",
        title: "/tour/for-operator",
        blurb: "Operator's tour, framed around incidents and cadence.",
      },
      {
        href: "/three-futures-gallery",
        title: "/three-futures-gallery",
        blurb: "Every Part crossed with three futures on one page.",
      },
      {
        href: "/glossary-app",
        title: "/glossary-app",
        blurb: "In-app typed glossary of EMA vocabulary.",
      },
    ],
  },
];

export default function SurfaceIndexPage() {
  return (
    <SiteShell
      eyebrow="Atlas hub"
      title="Surface index — every route"
      intro="A static convenience directory of every route shipped into the atlas this session. It holds no state and owns no truth; it only renders a grouped map so the full surface area is one click away. Use it to jump; read the surfaces themselves for meaning."
    >
      {groups.map((group) => (
        <section key={group.heading} className="panel">
          <h2 className="list__title">{group.heading}</h2>
          <div className="card-grid">
            {group.routes.map((route, idx) => (
              <article key={`${group.heading}-${route.title}-${idx}`} className="vapp-card">
                {route.title === "/vapps/[slug]" ? (
                  <p className="list__title">{route.title}</p>
                ) : (
                  <Link className="list__title" href={route.href}>
                    {route.title}
                  </Link>
                )}
                <p>{route.blurb}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="panel">
        <h2 className="list__title">Navigate</h2>
        <div className="card-grid">
          <Link className="vapp-card" href="/">
            <span className="list__title">/</span>
            <span>Atlas home and top-level masthead.</span>
          </Link>
          <Link className="vapp-card" href="/vapps">
            <span className="list__title">/vapps</span>
            <span>Eight-surface catalog of named vApps.</span>
          </Link>
          <Link className="vapp-card" href="/parts">
            <span className="list__title">/parts</span>
            <span>The Parts map across the atlas.</span>
          </Link>
          <Link className="vapp-card" href="/questions">
            <span className="list__title">/questions</span>
            <span>Open questions driving the next decisions.</span>
          </Link>
          <Link className="vapp-card" href="/canonical-rule">
            <span className="list__title">/canonical-rule</span>
            <span>The canonical rule, made concrete.</span>
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
