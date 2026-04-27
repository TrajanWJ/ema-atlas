import Link from "next/link";

import { docRegistry, globalVisions, parts, topLevelRoutes } from "@/lib/ema-atlas";

const formatCards = [
  {
    title: "Briefs",
    tag: "Printable narrative",
    copy:
      "Longform, readable, and close to the doctrine. Briefs are where EMA can argue for itself in a format that still feels serious on paper.",
    href: `/briefs/${parts[0].slug}`,
    accent: "#f0b37e"
  },
  {
    title: "Slides",
    tag: "Demo rhythm",
    copy:
      "Slides turn the same system into a paced presentation with beats, transitions, and the right amount of pressure in the room.",
    href: `/slides/${parts[0].slug}`,
    accent: "#8dd6d2"
  },
  {
    title: "Canvases",
    tag: "Thinking board",
    copy:
      "Canvas views keep the system messy enough to think in. They are for edges, threads, tensions, and the relationships between artifacts.",
    href: `/canvas/${parts[2].slug}`,
    accent: "#eb6b2c"
  },
  {
    title: "Graph Views",
    tag: "Relational map",
    copy:
      "The graph route makes EMA legible as a constellation of parts rather than a stack of pages. That is the right pressure for a system with doctrine.",
    href: "/graph",
    accent: "#c7b6ff"
  },
  {
    title: "Desktop Demos",
    tag: "Spatial surface",
    copy:
      "The desktop route keeps the place.org metaphor alive: windows, docks, and a sense that the product can be inhabited, not just used.",
    href: "/desktop",
    accent: "#f0d17e"
  },
  {
    title: "Mockups",
    tag: "Futures preview",
    copy:
      "Mockups are where EMA can try on interface futures before they become commitments. They are useful when the project is still deciding its own shape.",
    href: "/demo",
    accent: "#9fd08b"
  }
];

const implementationTracks = [
  {
    title: "Control Plane",
    summary: "Authority, lineage, approvals, and truth boundaries that should stay canonical even when the surfaces keep moving.",
    refs: ["authority", "execution", "surfaces"]
  },
  {
    title: "Shared Workspace",
    summary: "Plans, handoffs, docs, notes, exports, and context bundles that humans and agents can both address.",
    refs: ["workspace", "collab", "memory"]
  },
  {
    title: "Coordination Environment",
    summary: "Planner, swarm, schedules, queues, and checkups turned into a real product family rather than a background ritual.",
    refs: ["orchestration", "identity", "transport"]
  },
  {
    title: "Semantic Layer",
    summary: "Wiki, blueprint, graph, and reference objects that keep EMA's meaning visible while the system evolves.",
    refs: ["memory", "ux-metaphor", "workspace"]
  }
];

function metricValue(partsCount: number, formatsCount: number, docsCount: number) {
  return [
    { value: partsCount, label: "system parts" },
    { value: formatsCount, label: "deliverable modes" },
    { value: docsCount, label: "source docs" },
    { value: globalVisions.length, label: "future stances" }
  ];
}

export function ShowroomWall() {
  const metrics = metricValue(parts.length, formatCards.length, docRegistry.length);

  return (
    <div
      style={{
        display: "grid",
        gap: 22
      }}
    >
      <section
        className="panel"
        style={{
          display: "grid",
          gap: 18,
          background:
            "linear-gradient(135deg, rgba(26, 28, 35, 0.98), rgba(18, 19, 24, 0.84) 46%, rgba(235, 107, 44, 0.12))"
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            alignItems: "stretch"
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <p className="panel__tag">Showroom / Root Wall</p>
            <h2 className="panel__title">EMA deliverables, staged as a live showroom.</h2>
            <p className="panel__lede">
              This route turns the current EMA parts and doctrine into something you can walk through: briefs, slides,
              canvases, graph views, desktop demos, mockups, and the implementation tracks that tie them together.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              alignContent: "start",
              padding: 18,
              borderRadius: 24,
              border: "1px solid var(--line)",
              background: "rgba(255, 255, 255, 0.03)"
            }}
          >
            <span className="panel__label">Canonical rule</span>
            <p style={{ margin: 0, fontSize: "1.05rem", lineHeight: 1.55 }}>
              EMA owns truth. Hermes owns execution. Surfaces do not own state.
            </p>
          </div>
        </div>

        <div className="stat-ribbon">
          {metrics.map((metric) => (
            <div className="stat" key={metric.label}>
              <span className="stat__value">{metric.value}</span>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>

        <div className="route-links">
          {topLevelRoutes.map((route) => (
            <Link className="chip" href={route.href} key={route.href}>
              {route.label}
            </Link>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))"
        }}
      >
        {globalVisions.map((vision) => (
          <article
            className="panel"
            key={vision.id}
            style={{
              minHeight: 260,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), rgba(14, 15, 19, 0.88)"
            }}
          >
            <p className="panel__tag">{vision.title}</p>
            <p className="panel__lede">{vision.stance}</p>
            <div className="panel__stack">
              <div>
                <span className="panel__label">Bet</span>
                <p>{vision.bet}</p>
              </div>
              <div>
                <span className="panel__label">Tension</span>
                <p>{vision.tension}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="panel" style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <p className="panel__tag">Deliverable Wall</p>
          <h2 className="panel__title">Briefs, slides, canvases, graph views, desktop demos, and mockups.</h2>
          <p className="panel__lede">
            The route family is organized by output mode so the same EMA content can read as editorial, spatial,
            relational, or demo-ready depending on what the viewer needs.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))"
          }}
        >
          {formatCards.map((card) => (
            <article
              className="panel"
              key={card.title}
              style={{
                minHeight: 240,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), rgba(17, 18, 23, 0.92)",
                borderColor: "rgba(255, 255, 255, 0.12)"
              }}
            >
              <span className="panel__label" style={{ color: card.accent }}>
                {card.tag}
              </span>
              <h3 className="list__title" style={{ fontSize: "1.75rem", marginBottom: 10 }}>
                {card.title}
              </h3>
              <p className="list__copy">{card.copy}</p>
              <div className="panel__actions">
                <Link className="chip" href={card.href}>
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)"
        }}
      >
        <article className="panel" style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <p className="panel__tag">Part Cards</p>
            <h2 className="panel__title">The current EMA parts, rendered as a wall of live deliverables.</h2>
            <p className="panel__lede">
              Each part keeps its own branch lineage, hard questions, and artifact routes. The showroom uses those
              parts as the source material for the rest of the site.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
            }}
          >
            {parts.map((part) => (
              <article
                key={part.slug}
                style={{
                  display: "grid",
                  gap: 12,
                  padding: 18,
                  borderRadius: 22,
                  border: "1px solid var(--line)",
                  background: "rgba(255, 255, 255, 0.03)"
                }}
              >
                <p className="list__eyebrow">{part.strapline}</p>
                <h3 className="list__title" style={{ fontSize: "1.55rem" }}>
                  {part.title}
                </h3>
                <p className="list__copy">{part.summary}</p>
                <ul className="inline-list">
                  {part.deliverables.slice(0, 4).map((deliverable) => (
                    <li key={deliverable}>{deliverable}</li>
                  ))}
                </ul>
                <div className="route-links">
                  <Link className="chip" href={`/parts/${part.slug}`}>
                    Atlas
                  </Link>
                  <Link className="chip" href={`/briefs/${part.slug}`}>
                    Brief
                  </Link>
                  <Link className="chip" href={`/slides/${part.slug}`}>
                    Slides
                  </Link>
                  <Link className="chip" href={`/canvas/${part.slug}`}>
                    Canvas
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside style={{ display: "grid", gap: 18 }}>
          <article className="panel" style={{ display: "grid", gap: 14 }}>
            <p className="panel__tag">Source Pack</p>
            <h3 className="panel__title" style={{ fontSize: "2rem" }}>
              Local docs and route anchors
            </h3>
            <div style={{ display: "grid", gap: 12 }}>
              {docRegistry.map((doc) => (
                <div
                  key={doc.path}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 18,
                    border: "1px solid var(--line)",
                    background: "rgba(255, 255, 255, 0.03)"
                  }}
                >
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.12rem" }}>{doc.title}</p>
                  <p className="panel__lede" style={{ margin: "6px 0 0" }}>
                    {doc.note}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel" style={{ display: "grid", gap: 14 }}>
            <p className="panel__tag">Implementation Tracks</p>
            <h3 className="panel__title" style={{ fontSize: "2rem" }}>
              The work streams behind the showroom
            </h3>
            <div style={{ display: "grid", gap: 12 }}>
              {implementationTracks.map((track) => (
                <div
                  key={track.title}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 18,
                    border: "1px solid var(--line)",
                    background: "rgba(255, 255, 255, 0.03)"
                  }}
                >
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>{track.title}</p>
                  <p className="panel__lede" style={{ margin: "6px 0 0" }}>
                    {track.summary}
                  </p>
                  <div className="route-links" style={{ marginTop: 10 }}>
                    {track.refs.map((ref) => (
                      <span key={ref} className="chip" style={{ pointerEvents: "none" }}>
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
