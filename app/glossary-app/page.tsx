import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

type Term = {
  slug: string;
  name: string;
  definition: string;
  related: { slug: string; label: string }[];
};

const identities: Term[] = [
  {
    slug: "org",
    name: "Org",
    definition:
      "Top-level tenant. Owns billing, membership, and the envelope every Project lives inside.",
    related: [
      { slug: "project", label: "Project" },
      { slug: "user", label: "User" },
    ],
  },
  {
    slug: "project",
    name: "Project",
    definition:
      "A durable unit of work inside an Org. Holds its own Spaces, members, and event_log scope.",
    related: [
      { slug: "org", label: "Org" },
      { slug: "space", label: "Space" },
    ],
  },
  {
    slug: "space",
    name: "Space",
    definition:
      "A working context inside a Project — a room where humans and agents share the same surfaces.",
    related: [
      { slug: "project", label: "Project" },
      { slug: "vapp", label: "vApp" },
    ],
  },
  {
    slug: "user",
    name: "User",
    definition:
      "A human identity. Belongs to one or more Orgs and acts inside Projects and Spaces.",
    related: [
      { slug: "org", label: "Org" },
      { slug: "personal-ai", label: "Personal AI" },
    ],
  },
  {
    slug: "agent",
    name: "Agent",
    definition:
      "A non-human actor that runs work. Addressed by identity, scoped to a Space, executed by Hermes.",
    related: [
      { slug: "hermes", label: "Hermes" },
      { slug: "agent-virtual-environment", label: "Agent Virtual Environment" },
    ],
  },
  {
    slug: "personal-ai",
    name: "Personal AI",
    definition:
      "A User's own agent. Follows the User across Orgs and Projects as a personal collaborator.",
    related: [
      { slug: "user", label: "User" },
      { slug: "agent", label: "Agent" },
    ],
  },
  {
    slug: "vapp",
    name: "vApp",
    definition:
      "A virtual app — a named surface inside a Space. Renders state from the planes; owns none of it.",
    related: [
      { slug: "space", label: "Space" },
      { slug: "ema", label: "EMA" },
    ],
  },
];

const planes: Term[] = [
  {
    slug: "event-log",
    name: "event_log",
    definition:
      "Append-only record of what happened. The control-plane ledger every surface reads and none rewrites.",
    related: [
      { slug: "ema", label: "EMA" },
      { slug: "executionid", label: "ExecutionId" },
    ],
  },
  {
    slug: "executionid",
    name: "ExecutionId",
    definition:
      "Identifier for a single Hermes run. Ties a dispatch, its steps, and its outcome together in the log.",
    related: [
      { slug: "dispatchid", label: "DispatchId" },
      { slug: "dispatch", label: "dispatch" },
    ],
  },
  {
    slug: "dispatchid",
    name: "DispatchId",
    definition:
      "Identifier for a dispatch request. One DispatchId can spawn one or more ExecutionIds.",
    related: [
      { slug: "executionid", label: "ExecutionId" },
      { slug: "dispatch", label: "dispatch" },
    ],
  },
  {
    slug: "incidentid",
    name: "IncidentId",
    definition:
      "Identifier for a tracked incident on the control plane. Groups the events, proposals, and handoffs about it.",
    related: [
      { slug: "event-log", label: "event_log" },
      { slug: "proposalid", label: "ProposalId" },
    ],
  },
  {
    slug: "proposalid",
    name: "ProposalId",
    definition:
      "Identifier for a proposed change awaiting decision. Proposals are authored on surfaces, resolved on the control plane.",
    related: [
      { slug: "incidentid", label: "IncidentId" },
      { slug: "handoff", label: "handoff" },
    ],
  },
  {
    slug: "handoff",
    name: "handoff",
    definition:
      "A transfer of responsibility between actors — human to agent, agent to human, or agent to agent — recorded on the log.",
    related: [
      { slug: "dispatch", label: "dispatch" },
      { slug: "event-log", label: "event_log" },
    ],
  },
  {
    slug: "dispatch",
    name: "dispatch",
    definition:
      "The act of asking Hermes to run something. Produces a DispatchId and, once accepted, ExecutionIds.",
    related: [
      { slug: "hermes", label: "Hermes" },
      { slug: "dispatchid", label: "DispatchId" },
    ],
  },
];

const surfaces: Term[] = [
  {
    slug: "ema",
    name: "EMA",
    definition:
      "The control plane. Owns truth: identity, event_log, decisions. Every surface reads from it.",
    related: [
      { slug: "hermes", label: "Hermes" },
      { slug: "event-log", label: "event_log" },
    ],
  },
  {
    slug: "hermes",
    name: "Hermes",
    definition:
      "The execution plane. Owns runs: dispatches, executions, agent invocations. Reports back to EMA.",
    related: [
      { slug: "ema", label: "EMA" },
      { slug: "dispatch", label: "dispatch" },
    ],
  },
  {
    slug: "launchpad",
    name: "Launchpad",
    definition:
      "The entry surface. Where a User picks an Org, a Project, and a Space to step into.",
    related: [
      { slug: "hq", label: "HQ" },
      { slug: "virtual-desktop", label: "Virtual Desktop" },
    ],
  },
  {
    slug: "hq",
    name: "HQ",
    definition:
      "The Project-level home surface. A dashboard view of what is running and what needs attention.",
    related: [
      { slug: "launchpad", label: "Launchpad" },
      { slug: "threads-server", label: "Threads/Server" },
    ],
  },
  {
    slug: "virtual-desktop",
    name: "Virtual Desktop",
    definition:
      "A Space rendered as a workspace of vApps. The surface a User actually works inside.",
    related: [
      { slug: "space", label: "Space" },
      { slug: "vapp", label: "vApp" },
    ],
  },
  {
    slug: "wiki",
    name: "Wiki",
    definition:
      "The durable-knowledge surface. Long-lived notes and references projected from the collaboration plane.",
    related: [
      { slug: "chat", label: "Chat" },
      { slug: "threads-server", label: "Threads/Server" },
    ],
  },
  {
    slug: "chat",
    name: "Chat",
    definition:
      "The conversational surface. Short-form messages between humans and agents inside a Space.",
    related: [
      { slug: "threads-server", label: "Threads/Server" },
      { slug: "wiki", label: "Wiki" },
    ],
  },
  {
    slug: "threads-server",
    name: "Threads/Server",
    definition:
      "Structured conversations around a topic or run. The Space-scoped thread view over the collaboration plane.",
    related: [
      { slug: "chat", label: "Chat" },
      { slug: "event-log", label: "event_log" },
    ],
  },
  {
    slug: "blueprint",
    name: "Blueprint",
    definition:
      "A reusable plan for a Space — the set of vApps, agents, and defaults a new Space starts with.",
    related: [
      { slug: "space", label: "Space" },
      { slug: "vapp", label: "vApp" },
    ],
  },
  {
    slug: "agent-virtual-environment",
    name: "Agent Virtual Environment",
    definition:
      "The sandboxed workspace an Agent runs inside. Hermes provisions it; EMA records what it does.",
    related: [
      { slug: "agent", label: "Agent" },
      { slug: "hermes", label: "Hermes" },
    ],
  },
];

function TermCard({ term }: { term: Term }) {
  return (
    <article className="panel vapp-card" id={`term-${term.slug}`}>
      <div className="vapp-card__head">
        <p className="list__eyebrow">Term</p>
      </div>
      <h3 className="list__title">{term.name}</h3>
      <p className="list__copy">{term.definition}</p>
      <div>
        <span className="panel__label">Related</span>
        <div className="route-links">
          {term.related.map((r) => (
            <Link key={r.slug} className="chip" href={`#term-${r.slug}`}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function GlossaryAppPage() {
  return (
    <SiteShell
      eyebrow="Glossary"
      title="Load-bearing terms"
      intro="GLOSSARY.md at the repo root is the source of truth for all 33 terms. This page is a curated in-app render of the ~20 most load-bearing ones so the atlas can link definitions inline. It is a read-only projection, not a second source."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Terms</p>
          <h2 className="panel__title">Identities & places</h2>
          <p className="panel__lede">
            Who and where. The tenants, members, and rooms the rest of the
            vocabulary sits inside.
          </p>
        </div>
        <div className="card-grid">
          {identities.map((t) => (
            <TermCard key={t.slug} term={t} />
          ))}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Terms</p>
          <h2 className="panel__title">Planes & objects</h2>
          <p className="panel__lede">
            The canonical objects that live on the control and runtime planes,
            and the identifiers that tie them together.
          </p>
        </div>
        <div className="card-grid">
          {planes.map((t) => (
            <TermCard key={t.slug} term={t} />
          ))}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Terms</p>
          <h2 className="panel__title">Surfaces</h2>
          <p className="panel__lede">
            The named surfaces a User sees. EMA and Hermes are the two planes
            they read from; the rest are shells and vApps rendered on top.
          </p>
        </div>
        <div className="card-grid">
          {surfaces.map((t) => (
            <TermCard key={t.slug} term={t} />
          ))}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Canonical rule</p>
          <h2 className="panel__title">EMA owns truth. Hermes owns execution. Surfaces do not own state.</h2>
          <p className="panel__lede">
            Every term above resolves through this rule. If a surface appears to
            hold state, it is rendering a projection from one of the four planes
            below — not keeping its own copy.
          </p>
          <div>
            <span className="panel__label">Four planes</span>
            <ul className="inline-list">
              <li>Control — EMA, event_log, decisions</li>
              <li>Runtime — Hermes, dispatches, executions</li>
              <li>Collaboration — threads, chat, wiki</li>
              <li>Workspace — Spaces, vApps, Virtual Desktop</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Scope</p>
          <h2 className="panel__title">What this page is NOT</h2>
          <ul className="inline-list">
            <li>Not the source — GLOSSARY.md at the repo root is.</li>
            <li>Not editable in-app — it is a read-only projection.</li>
            <li>Not complete — ~20 curated terms, not the full 33.</li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/canonical-rule">
              Canonical rule
            </Link>
            <Link className="chip" href="/state-planes">
              State planes
            </Link>
            <Link className="chip" href="/vapps">
              vApps
            </Link>
            <Link className="chip" href="/parts">
              Parts
            </Link>
            <Link className="chip" href="/questions">
              Open questions
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
