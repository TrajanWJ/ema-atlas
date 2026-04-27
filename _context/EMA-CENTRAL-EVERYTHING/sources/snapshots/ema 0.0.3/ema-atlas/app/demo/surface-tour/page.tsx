import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

/**
 * /demo/surface-tour — Narrated tour through the surface routes.
 *
 * A single, ordered walk-through. The canonical rule lands first; every
 * stop after that is read in that light. EMA owns truth. Hermes owns
 * execution. Surfaces do not own state.
 */

type Stop = {
  n: number;
  title: string;
  framing: string;
  notOwn: string;
  look: string[];
  href: string;
  related: { href: string; label: string }[];
};

const stops: Stop[] = [
  {
    n: 1,
    title: "Launchpad — entry point, not dashboard",
    framing:
      "Launchpad is the front door into work, not a place to linger. It tiles the named surfaces from the vApp catalog and lets you jump into a brief or a shell. Think Win8 start screen for EMA: pick a surface, leave.",
    notOwn:
      "Launchpad does NOT own any state — every tile is a read over app/vapps/_data.ts.",
    look: [
      "Shells group vs. vApps group — two tiers of surface, one catalog.",
      "Each tile links into /vapps/<slug>, the brief, not a live app.",
      "The dock at the bottom foreshadows the Desktop metaphor.",
    ],
    href: "/launchpad",
    related: [
      { href: "/vapps", label: "Surface catalog" },
      { href: "/parts/shells-surfaces", label: "Shells / Surfaces brief" },
    ],
  },
  {
    n: 2,
    title: "Launchpad / Command — keyboard-first variant",
    framing:
      "Same door, different hinge. The command palette expresses Launchpad as typed verbs — Open, Start, Jump, Resume, Approve — mapping to the control plane. It is what power users reach for once the tiles are muscle memory.",
    notOwn:
      "The palette does NOT own actions either; it dispatches into Hermes, which runs them.",
    look: [
      "Verbs are a small, named set — not a free-text search.",
      "Shortcuts hint at muscle memory (W for Wiki, etc.).",
      "Every verb resolves to an existing surface or a Hermes dispatch.",
    ],
    href: "/launchpad/command",
    related: [
      { href: "/launchpad", label: "Tile variant" },
      { href: "/parts/control-plane", label: "Control plane brief" },
    ],
  },
  {
    n: 3,
    title: "vApps — surface catalog",
    framing:
      "The canonical index of named surfaces. Every shell and vApp the system knows about is listed here, with status and one-liner. This is the file the rest of the atlas reads from.",
    notOwn:
      "The catalog does NOT own any runtime — it is a typed list, not a registry of live instances.",
    look: [
      "Status chips (atlas, draft, slice) — surfaces ship on a gradient.",
      "Group split between shells and vApps.",
      "Each card links into a per-surface brief.",
    ],
    href: "/vapps",
    related: [
      { href: "/launchpad", label: "Tiled entry" },
      { href: "/graph", label: "Graph view" },
    ],
  },
  {
    n: 4,
    title: "Surfaces Map — canonical rule made visible",
    framing:
      "A diagram of the rule you will see echoed at every other stop: EMA owns truth, Hermes owns execution, surfaces project. Read this before the remaining stops — it is the lens.",
    notOwn:
      "The map itself does NOT own the rule; it visualizes a doctrine that lives in the parts.",
    look: [
      "Three lanes: truth, execution, projection.",
      "Arrows only run one way — surfaces never write back.",
      "Every other surface in the tour is a read off EMA, not a source of record.",
    ],
    href: "/surfaces-map",
    related: [
      { href: "/parts/ema", label: "EMA part" },
      { href: "/parts/hermes", label: "Hermes part" },
    ],
  },
  {
    n: 5,
    title: "HQ — aggregate read surface",
    framing:
      "HQ is the rolled-up read across the whole user: projects, signals, pending decisions. It is the first surface that feels like a product because it aggregates — but aggregation is still a read.",
    notOwn:
      "HQ does NOT own a single datapoint it shows; every number is derived from EMA.",
    look: [
      "Cards correspond to named projections, not modules.",
      "No edit affordances — HQ reads, it does not write.",
      "Links fan out to project- and personal-scoped HQ variants.",
    ],
    href: "/hq",
    related: [
      { href: "/vapps/hq", label: "HQ brief" },
      { href: "/parts/projections", label: "Projections part" },
    ],
  },
  {
    n: 6,
    title: "HQ / Personal — cross-project aggregate",
    framing:
      "The me-scoped slice of HQ. Cuts across every project the person touches and surfaces what is theirs to answer today.",
    notOwn:
      "Personal HQ does NOT own the identity model — it reads a person projection off EMA.",
    look: [
      "Cross-project cards vs. project-local ones.",
      "Queue-like framing — what is on your plate, not what exists.",
      "The scoping predicate is visible, not implicit.",
    ],
    href: "/hq/personal",
    related: [
      { href: "/hq", label: "HQ root" },
      { href: "/hq/project", label: "Project pulse" },
    ],
  },
  {
    n: 7,
    title: "HQ / Project — single-project pulse",
    framing:
      "Same engine, different scope. A single project, read as a pulse: what moved, what is stalled, what is waiting on a decision.",
    notOwn:
      "Project HQ does NOT own the project definition — the project is an entity in EMA, projected here.",
    look: [
      "Same card vocabulary as HQ root, filtered.",
      "Decisions appear here before they appear in /questions.",
      "Each card is a typed read, not a bespoke widget.",
    ],
    href: "/hq/project",
    related: [
      { href: "/hq", label: "HQ root" },
      { href: "/hq/personal", label: "Personal pulse" },
    ],
  },
  {
    n: 8,
    title: "Wiki — semantic / collab surface",
    framing:
      "The Wiki is the collaborative read over the semantic graph. It looks like notes because humans like notes, but every node is a typed entity in EMA.",
    notOwn:
      "The Wiki does NOT own the graph — it renders nodes and edges EMA already holds.",
    look: [
      "Node list reads off EMA's entity store.",
      "Edits are proposals into the graph, not free-form text.",
      "Navigation is edge-driven, not folder-driven.",
    ],
    href: "/wiki",
    related: [
      { href: "/wiki/node/example", label: "Node example" },
      { href: "/vapps/wiki", label: "Wiki brief" },
    ],
  },
  {
    n: 9,
    title: "Wiki / Node / Example — one node deep",
    framing:
      "A single node rendered with its edges, types, and references. This is what the rest of the Wiki navigates between.",
    notOwn:
      "The node page does NOT own the node's identity or edges — it reads them off EMA.",
    look: [
      "Typed fields vs. free-text body.",
      "Edges rendered as links to other nodes.",
      "Any open question on this node is visible, not hidden.",
    ],
    href: "/wiki/node/example",
    related: [
      { href: "/wiki", label: "Wiki root" },
      { href: "/graph", label: "Graph" },
    ],
  },
  {
    n: 10,
    title: "Chat — EMA-native chat (canonical rule proof)",
    framing:
      "Chat is where the canonical rule pays off. Messages are not a separate database; they are entities in EMA, with the same identity and references as everything else. Every other surface can read them.",
    notOwn:
      "Chat does NOT own the message store — it is a projection over EMA, like HQ or Wiki.",
    look: [
      "Messages carry typed references to projects, people, decisions.",
      "The same message can appear in HQ, Wiki, and Threads without duplication.",
      "Sending a message is a Hermes dispatch, not a local write.",
    ],
    href: "/chat",
    related: [
      { href: "/chat/tenanted", label: "Tenanted chat" },
      { href: "/vapps/chat", label: "Chat brief" },
    ],
  },
  {
    n: 11,
    title: "Chat / Tenanted — tenancy made explicit",
    framing:
      "The same chat surface, but with tenancy pulled to the foreground. Who can see what, which project scopes which thread, where the boundary lives.",
    notOwn:
      "Tenanted chat does NOT own the tenancy model — it visualizes a policy EMA enforces.",
    look: [
      "Tenant scope chips at the top of each thread.",
      "Visible boundary between personal, project, and org scopes.",
      "No magic — tenancy is a typed field, not a guess.",
    ],
    href: "/chat/tenanted",
    related: [
      { href: "/chat", label: "Chat root" },
      { href: "/parts/tenancy", label: "Tenancy part" },
    ],
  },
  {
    n: 12,
    title: "Threads — Discord-migration wedge",
    framing:
      "Threads is the surface that lets a Discord-shaped team move onto EMA without giving up their habits. It reads like Discord; it writes like EMA.",
    notOwn:
      "Threads does NOT own messages or channels — they are the same EMA entities Chat renders, grouped differently.",
    look: [
      "Channel/thread layout that will feel familiar on day one.",
      "Every message is still an EMA entity under the hood.",
      "The migration wedge is an explicit product claim, not a side effect.",
    ],
    href: "/threads",
    related: [
      { href: "/threads/bridge", label: "Discord bridge" },
      { href: "/vapps/threads-server", label: "Threads brief" },
    ],
  },
  {
    n: 13,
    title: "Threads / Bridge — Q6 decision pressure",
    framing:
      "The bridge is the live question: do we pull Discord history into EMA, mirror in both directions, or draw a hard line? Q6 names it; this surface exercises it.",
    notOwn:
      "The bridge does NOT own the answer — it renders the three futures so the decision can be made with eyes open.",
    look: [
      "Three branches shown side by side, not one recommended path.",
      "Open question is visible, not hidden behind defaults.",
      "Link to Q6 in the questions registry.",
    ],
    href: "/threads/bridge",
    related: [
      { href: "/questions", label: "Open Questions" },
      { href: "/threads", label: "Threads root" },
    ],
  },
  {
    n: 14,
    title: "Agent Environment — projection over dispatch log",
    framing:
      "Where agents live while they work. The environment is a read over Hermes's dispatch log: what was asked, what ran, what came back, what is pending.",
    notOwn:
      "The environment does NOT own the dispatch log — Hermes does. The surface is a projection.",
    look: [
      "Dispatch entries are typed, not stringly.",
      "Agent state is derived from the log, not stored separately.",
      "Replay is a first-class idea because the log is the source.",
    ],
    href: "/agent-environment",
    related: [
      { href: "/parts/hermes", label: "Hermes part" },
      { href: "/vapps/agent-virtual-environment", label: "AVE brief" },
    ],
  },
  {
    n: 15,
    title: "Blueprint — three futures as a typed subgraph",
    framing:
      "Blueprint is where product strategy lives as data. Each live question has three futures attached; each future is a typed subgraph of the system, not a paragraph.",
    notOwn:
      "Blueprint does NOT own the question set — it reads /questions and attaches futures to each.",
    look: [
      "Three-futures discipline: never one path, never ten.",
      "Subgraphs are typed, so they can be diffed.",
      "Open questions are foregrounded, not buried.",
    ],
    href: "/blueprint",
    related: [
      { href: "/questions", label: "Open Questions" },
      { href: "/vapps/blueprint", label: "Blueprint brief" },
    ],
  },
  {
    n: 16,
    title: "Desktop — place.org metaphor",
    framing:
      "The Desktop is the outermost shell — the place where a person arrives and where the other surfaces are hosted. Launchpad lives in its dock; Chat, Wiki, HQ, Threads are windows onto the same EMA.",
    notOwn:
      "The Desktop does NOT own any application — it is a host, not a database.",
    look: [
      "Surfaces as windows, not as tabs in one monolith.",
      "The dock mirrors the surfaces you have already met.",
      "place.org lineage — workspace as a place, not a page.",
    ],
    href: "/desktop",
    related: [
      { href: "/vapps/virtual-desktop", label: "Desktop brief" },
      { href: "/launchpad", label: "Launchpad" },
    ],
  },
];

export default function SurfaceTourPage() {
  return (
    <SiteShell
      eyebrow="Surface tour"
      title="A first pass through EMA"
      intro="A ~15-minute read that walks a first-time reader through the named surfaces in the right order. The canonical rule lands before the surfaces do, so every stop can be read in its light: EMA owns truth, Hermes owns execution, surfaces do not own state."
    >
      <section className="panel">
        <p className="panel__tag">How to read this tour</p>
        <h2 className="panel__title">Rule first, surfaces second.</h2>
        <p className="panel__lede">
          Sixteen stops, one paragraph each, in order. Stops 1–4 set the frame:
          where you enter, what the catalog contains, and the canonical rule
          that governs everything after. Stops 5–16 walk the named surfaces,
          each one read as a projection over EMA. At every stop, one line names
          what the surface does not own — that is the whole point.
        </p>
        <div className="route-links">
          <Link className="chip" href="/surfaces-map">
            Start with the rule
          </Link>
          <Link className="chip" href="/vapps">
            Surface catalog
          </Link>
          <Link className="chip" href="/questions">
            Open questions
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
          <p>
            <span className="panel__label">Does not own</span> {stop.notOwn}
          </p>
          <div>
            <p className="panel__label">What to look for</p>
            <ul>
              {stop.look.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="route-links">
            <Link className="chip" href={stop.href}>
              Open {stop.href}
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
        <h2 className="panel__title">What you should walk away with.</h2>
        <ul>
          <li>
            <strong>The canonical rule.</strong> EMA owns truth. Hermes owns
            execution. Surfaces project. Every stop on this tour is a read, not
            a source of record.
          </li>
          <li>
            <strong>Three-futures discipline.</strong> Where the system is
            undecided — Threads bridge, Blueprint, Q6 — you see three futures,
            not one recommendation and not ten options.
          </li>
          <li>
            <strong>Open questions are visible.</strong> Nothing on this tour
            hides an unresolved call behind a default. The questions registry
            is a first-class surface, not a backlog.
          </li>
        </ul>
        <div className="route-links">
          <Link className="chip" href="/vapps">
            Navigate — vApps
          </Link>
          <Link className="chip" href="/questions">
            Navigate — Questions
          </Link>
          <Link className="chip" href="/parts">
            Navigate — Parts
          </Link>
          <Link className="chip" href="/launchpad">
            Navigate — Launchpad
          </Link>
          <Link className="chip" href="/graph">
            Navigate — Graph
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
