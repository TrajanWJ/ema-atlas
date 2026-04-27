import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

type QCard = {
  number: string;
  title: string;
  text: string;
  status: string;
  surfaces: { href: string; label: string }[];
};

const questions: QCard[] = [
  {
    number: "Q1",
    title: "Agent identity first-class",
    text: "Are agent identities first-class members of Org/Space, or attached to a human?",
    status: "unresolved",
    surfaces: [
      { href: "/project-space", label: "/project-space" },
      { href: "/chat/tenanted", label: "/chat/tenanted" },
      { href: "/agent-environment", label: "/agent-environment" },
    ],
  },
  {
    number: "Q2",
    title: "Collab state owner",
    text: "Does collaboration state live in event_log, in an adjacent subsystem, or in workspace files?",
    status: "unresolved",
    surfaces: [
      { href: "/state-planes", label: "/state-planes" },
      { href: "/wiki", label: "/wiki" },
      { href: "/blueprint", label: "/blueprint" },
      { href: "/threads", label: "/threads" },
    ],
  },
  {
    number: "Q3",
    title: "Project ↔ Space cardinality",
    text: "Is a project one-to-one with a space, or can many projects share a space (and vice versa)?",
    status: "unresolved",
    surfaces: [
      { href: "/project-space", label: "/project-space" },
      { href: "/hq/project", label: "/hq/project" },
    ],
  },
  {
    number: "Q4",
    title: "Personal AI execution",
    text: "Where does the Personal AI actually execute — on-device, in Hermes, in a separate runtime?",
    status: "unresolved",
    surfaces: [
      { href: "/agent-environment", label: "/agent-environment" },
      { href: "/driver-matrix", label: "/driver-matrix" },
      { href: "/hq/personal", label: "/hq/personal" },
    ],
  },
  {
    number: "Q5",
    title: "Harness/driver contract",
    text: "What is the exact contract surface between the harness and drivers — RPC, stream, shared memory?",
    status: "unresolved",
    surfaces: [
      { href: "/driver-matrix", label: "/driver-matrix" },
      { href: "/chat", label: "/chat" },
    ],
  },
  {
    number: "Q6",
    title: "Discord bridge direction",
    text: "Is the Discord mirror read-only, bidirectional, or a first-class replacement?",
    status: "unresolved",
    surfaces: [
      { href: "/threads/bridge", label: "/threads/bridge" },
      { href: "/threads", label: "/threads" },
    ],
  },
  {
    number: "Q7",
    title: "Launchpad/HQ surface stack",
    text: "What tech stack hosts Launchpad and HQ — the atlas Next.js choice points to a direction.",
    status: "partly answered",
    surfaces: [
      { href: "/launchpad", label: "/launchpad" },
      { href: "/hq", label: "/hq" },
      { href: "/desktop", label: "/desktop" },
    ],
  },
  {
    number: "Q8",
    title: "Sync model",
    text: "How do docs, wiki, and canvas sync — CRDT, OT, snapshot, event-sourced?",
    status: "unresolved",
    surfaces: [
      { href: "/state-planes", label: "/state-planes" },
      { href: "/wiki", label: "/wiki" },
    ],
  },
  {
    number: "Q9",
    title: "Replication boundary",
    text: "Is replication peer-to-peer, central with cache, or federated per-space?",
    status: "unresolved",
    surfaces: [
      { href: "/mesh", label: "/mesh" },
      { href: "/state-planes", label: "/state-planes" },
    ],
  },
  {
    number: "Q10",
    title: "Org/space permissions → runtime",
    text: "How do org/space permissions map onto runtime and tool permissions at execution time?",
    status: "unresolved",
    surfaces: [
      { href: "/project-space", label: "/project-space" },
      { href: "/proposal-flow", label: "/proposal-flow" },
    ],
  },
];

type SurfaceRow = {
  name: string;
  href: string;
  blocks: string[];
  shapes: string[];
};

const surfaces: SurfaceRow[] = [
  {
    name: "Wiki",
    href: "/wiki",
    blocks: ["Q2", "Q8"],
    shapes: ["Q9"],
  },
  {
    name: "Chat",
    href: "/chat",
    blocks: ["Q5"],
    shapes: ["Q1", "Q10"],
  },
  {
    name: "Threads",
    href: "/threads",
    blocks: ["Q2", "Q6"],
    shapes: ["Q8", "Q9"],
  },
  {
    name: "HQ",
    href: "/hq",
    blocks: ["Q3", "Q7"],
    shapes: ["Q1", "Q10"],
  },
  {
    name: "Launchpad",
    href: "/launchpad",
    blocks: ["Q7"],
    shapes: ["Q1", "Q3"],
  },
  {
    name: "Virtual Desktop",
    href: "/desktop",
    blocks: ["Q7"],
    shapes: ["Q4", "Q9"],
  },
  {
    name: "Agent-Env",
    href: "/agent-environment",
    blocks: ["Q1", "Q4"],
    shapes: ["Q5", "Q10"],
  },
  {
    name: "Blueprint",
    href: "/blueprint",
    blocks: ["Q2", "Q8"],
    shapes: [],
  },
  {
    name: "Workspace/Handoff",
    href: "/handoff",
    blocks: ["Q2"],
    shapes: ["Q8", "Q9"],
  },
  {
    name: "Proposal",
    href: "/proposal-flow",
    blocks: ["Q10"],
    shapes: ["Q1", "Q3"],
  },
  {
    name: "Incidents",
    href: "/incidents",
    blocks: [],
    shapes: ["Q5", "Q10"],
  },
  {
    name: "Driver matrix",
    href: "/driver-matrix",
    blocks: ["Q5"],
    shapes: ["Q4", "Q10"],
  },
];

export default function OpenQuestionsMapPage() {
  return (
    <SiteShell
      eyebrow="Cross-cutting"
      title="Open questions × surfaces"
      intro="Every open question has a blast radius — a set of surfaces whose design it blocks or shapes. This route keeps that radius visible so no Q goes quietly smoothed. Ten questions, twelve surfaces, one cross-index."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">Questions</p>
          <h2 className="panel__title">Ten open questions, each with its affected surfaces</h2>
          <p className="panel__lede">
            One card per Q. Status stays unresolved until a control-plane
            decision is recorded — Q7 is the one exception, partly answered by
            the atlas Next.js choice. Chips link to surfaces in this atlas.
          </p>
        </div>
        <div className="card-grid">
          {questions.map((q) => (
            <article className="panel vapp-card" key={q.number}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">{q.number}</p>
                <span
                  className={
                    q.status === "partly answered"
                      ? "chip"
                      : "chip chip--ghost"
                  }
                >
                  status: {q.status}
                </span>
              </div>
              <h3 className="list__title">{q.title}</h3>
              <p className="list__copy">{q.text}</p>
              <div>
                <span className="panel__label">Surfaces most affected</span>
                <div className="route-links">
                  {q.surfaces.map((s) => (
                    <Link key={s.href} className="chip" href={s.href}>
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Reverse index</p>
          <h2 className="panel__title">Surfaces × Qs</h2>
          <p className="panel__lede">
            Same map read the other way. Filled chip = the Q blocks this
            surface (cannot be designed without answering it). Ghost chip =
            the Q shapes this surface (influences but does not block).
          </p>
        </div>
        <div className="card-grid">
          {surfaces.map((s) => (
            <article className="panel vapp-card" key={s.name}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">Surface</p>
                <span className="chip chip--ghost">
                  {s.blocks.length} blocking · {s.shapes.length} shaping
                </span>
              </div>
              <h3 className="list__title">
                <Link href={s.href}>{s.name}</Link>
              </h3>
              <div>
                <span className="panel__label">Blocks design</span>
                <div className="route-links">
                  {s.blocks.length > 0 ? (
                    s.blocks.map((q) => (
                      <span key={q} className="chip">
                        {q}
                      </span>
                    ))
                  ) : (
                    <span className="chip chip--ghost">none</span>
                  )}
                </div>
              </div>
              <div>
                <span className="panel__label">Shapes design</span>
                <div className="route-links">
                  {s.shapes.length > 0 ? (
                    s.shapes.map((q) => (
                      <span key={q} className="chip chip--ghost">
                        {q}
                      </span>
                    ))
                  ) : (
                    <span className="chip chip--ghost">none</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Doctrine reminder</p>
          <h2 className="panel__title">Resolving a Q is a control-plane move</h2>
          <p className="panel__lede">
            A question leaves this map only via a <code>decision.recorded</code>{" "}
            event on the control plane. Not a silent edit to docs. Not a quiet
            rename on a surface. EMA owns truth; questions close through
            truth&apos;s own channel.
          </p>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/questions">
              Open questions
            </Link>
            <Link className="chip" href="/canonical-rule">
              Canonical rule
            </Link>
            <Link className="chip" href="/state-planes">
              State planes
            </Link>
            <Link className="chip" href="/mesh">
              Mesh
            </Link>
            <Link className="chip" href="/threads/bridge">
              Threads bridge
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
