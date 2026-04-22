import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

import { vapps } from "../vapps/_data";

type PlaneKey = "control" | "runtime" | "collaboration" | "workspace";

type PlaneCard = {
  key: PlaneKey;
  name: string;
  owner: string;
  examples: string;
  rule: string;
  status: string;
};

const planes: PlaneCard[] = [
  {
    key: "control",
    name: "Control",
    owner: "EMA event_log",
    examples: "incidents, dispatches, approvals, audit entries",
    rule: "EMA owns truth. Mutations flow through control-plane actions.",
    status: "Canonical",
  },
  {
    key: "runtime",
    name: "Runtime",
    owner: "Hermes / drivers",
    examples: "live sessions, tool calls, streaming tokens, process state",
    rule: "Hermes owns execution. Runtime is observed, never persisted by surfaces.",
    status: "Canonical",
  },
  {
    key: "collaboration",
    name: "Collaboration",
    owner: "Subsystem TBD",
    examples: "threads, channels, comments, presence, co-edit locks",
    rule: "A surface may render collab, but cannot decide what collab is.",
    status: "Q2-open — contested, not decided",
  },
  {
    key: "workspace",
    name: "Workspace",
    owner: "workspace/shared/",
    examples: "repo files, briefs, content, artifacts on disk",
    rule: "Files on disk are truth for their own kind; surfaces read and write via the workspace contract.",
    status: "Canonical",
  },
];

type PlaneHit = "primary" | "secondary" | "q2" | "none";

type Mapping = {
  slug: string;
  note?: string;
  planes: Record<PlaneKey, PlaneHit>;
};

const mappings: Record<string, Mapping> = {
  wiki: {
    slug: "wiki",
    planes: {
      control: "none",
      runtime: "none",
      collaboration: "primary",
      workspace: "secondary",
    },
  },
  chat: {
    slug: "chat",
    planes: {
      control: "primary",
      runtime: "secondary",
      collaboration: "none",
      workspace: "none",
    },
  },
  "threads-server": {
    slug: "threads-server",
    note: "Primary plane depends on Q2-open collab subsystem.",
    planes: {
      control: "none",
      runtime: "none",
      collaboration: "q2",
      workspace: "secondary",
    },
  },
  "agent-virtual-environment": {
    slug: "agent-virtual-environment",
    planes: {
      control: "primary",
      runtime: "none",
      collaboration: "none",
      workspace: "secondary",
    },
  },
  blueprint: {
    slug: "blueprint",
    note: "Typed subgraph lives on the collab plane — Q2-open.",
    planes: {
      control: "none",
      runtime: "none",
      collaboration: "q2",
      workspace: "secondary",
    },
  },
  launchpad: {
    slug: "launchpad",
    note: "Hosts vApps. Renders no plane directly.",
    planes: {
      control: "none",
      runtime: "none",
      collaboration: "none",
      workspace: "none",
    },
  },
  hq: {
    slug: "hq",
    note: "Read-mostly projection across three planes.",
    planes: {
      control: "secondary",
      runtime: "secondary",
      collaboration: "none",
      workspace: "secondary",
    },
  },
  "virtual-desktop": {
    slug: "virtual-desktop",
    note: "Hosts all four planes via windowed vApps. Renders none directly.",
    planes: {
      control: "none",
      runtime: "none",
      collaboration: "none",
      workspace: "none",
    },
  },
};

function chipLabel(hit: PlaneHit): string {
  if (hit === "primary") return "Primary";
  if (hit === "secondary") return "Secondary";
  if (hit === "q2") return "Primary · Q2";
  return "—";
}

function chipClass(hit: PlaneHit): string {
  return hit === "none" || hit === "q2" ? "chip chip--ghost" : "chip";
}

export default function SurfacesMapPage() {
  return (
    <SiteShell
      eyebrow="Cross-cutting"
      title="Surface ↔ Plane map"
      intro="Canonical rule: surfaces render state planes, they do not own them. EMA owns truth, Hermes owns execution, workspace is on disk, collab is Q2-open. This page is the visible check that every named surface obeys that rule."
    >
      <section>
        <div className="panel">
          <p className="panel__tag">State planes</p>
          <h2 className="panel__title">Four planes, four owners</h2>
          <p className="panel__lede">
            Every surface below renders one or more of these. None of them own
            any. Collaboration is marked Q2-open because its owning subsystem
            has not been decided.
          </p>
        </div>
        <div className="card-grid">
          {planes.map((p) => (
            <article className="panel vapp-card" key={p.key}>
              <div className="vapp-card__head">
                <p className="list__eyebrow">Plane</p>
                <span className="chip">{p.status}</span>
              </div>
              <h3 className="list__title">{p.name}</h3>
              <p className="list__copy">{p.rule}</p>
              <div>
                <span className="panel__label">Owner</span>
                <p className="list__copy">{p.owner}</p>
              </div>
              <div>
                <span className="panel__label">Example objects</span>
                <p className="list__copy">{p.examples}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Mapping</p>
          <h2 className="panel__title">Eight surfaces, rendered against four planes</h2>
          <p className="panel__lede">
            Filled chip = surface renders that plane. Ghost chip = surface does
            not render it, or its primary dependency is Q2-open. Launchpad and
            Virtual Desktop are hosts — they render no plane directly.
          </p>
          <div className="stat-ribbon">
            <div className="stat">
              <span className="stat__value">8</span>
              <span>Named surfaces</span>
            </div>
            <div className="stat">
              <span className="stat__value">4</span>
              <span>State planes</span>
            </div>
            <div className="stat">
              <span className="stat__value">0</span>
              <span>Surfaces owning state</span>
            </div>
            <div className="stat">
              <span className="stat__value">1</span>
              <span>Plane unresolved (Q2)</span>
            </div>
          </div>
        </div>
        <div className="card-grid">
          {vapps.map((v) => {
            const m = mappings[v.slug];
            return (
              <article className="panel vapp-card" key={v.slug}>
                <div className="vapp-card__head">
                  <p className="list__eyebrow">{v.group === "vapp" ? "vApp" : "Shell"}</p>
                  <span className="chip chip--ghost">renders, owns none</span>
                </div>
                <h3 className="list__title">
                  <Link href={`/vapps/${v.slug}`}>{v.name}</Link>
                </h3>
                {m.note ? <p className="list__copy">{m.note}</p> : null}
                <div>
                  <span className="panel__label">Plane coverage</span>
                  <div className="route-links">
                    {planes.map((p) => (
                      <span key={p.key} className={chipClass(m.planes[p.key])}>
                        {p.name}: {chipLabel(m.planes[p.key])}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Forbidden</p>
          <h2 className="panel__title">What this mapping rules out</h2>
          <p className="panel__lede">
            If any of the following ever appears, the surface has crossed into
            owning state and the canonical rule is broken.
          </p>
          <ul className="inline-list">
            <li>
              A surface owning incident state — incidents live on the control
              plane, surfaces only render them.
            </li>
            <li>
              A surface storing feed credentials — credentials belong to the
              runtime plane (driver config), never to a rendering surface.
            </li>
            <li>
              A surface mutating event_log without a control-plane action —
              writes only land through EMA&apos;s control-plane API.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="panel">
          <p className="panel__tag">Navigate</p>
          <h2 className="panel__title">Related</h2>
          <div className="route-links">
            <Link className="chip" href="/vapps">
              Surfaces
            </Link>
            <Link className="chip" href="/launchpad">
              Launchpad
            </Link>
            <Link className="chip" href="/parts/authority-control-plane">
              Control plane
            </Link>
            <Link className="chip" href="/parts/shared-workspace">
              Shared workspace
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
