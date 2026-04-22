import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { parts } from "@/lib/ema-atlas";

const beats = [
  {
    number: "Beat 01",
    title: "Enter the atlas, not a dead spec dump",
    copy:
      "The landing route treats EMA as an evolving product field. It frames the parts, futures, and tensions before anyone pretends the project is already settled."
  },
  {
    number: "Beat 02",
    title: "Move from parts to pressure",
    copy:
      "Each part carries three futures on purpose. The demo is not only showing polish; it is showing the unresolved choices the product still has to metabolize."
  },
  {
    number: "Beat 03",
    title: "Cross into the shared coordination workspace",
    copy:
      "The swarm/planner/calendar family appears as a first-class environment, not only invisible process. This makes the user ask what work objects deserve to exist canonically."
  },
  {
    number: "Beat 04",
    title: "Jump into graph, canvas, slides, and brief modes",
    copy:
      "The same system can be read as a graph, a board, an editorial deck, or a printable brief. The artifact forms themselves become design pressure on EMA."
  },
  {
    number: "Beat 05",
    title: "Land in the desktop surface",
    copy:
      "The place.org metaphor returns as a deliverable surface. It forces the question of whether EMA is fundamentally a dashboard, a workspace, or a world."
  }
];

export default function DemoPage() {
  return (
    <SiteShell
      eyebrow="Project Demo"
      title="EMA Demo Route"
      intro="A staged walkthrough of the current deliverables phase. This route is for showing progress, but also for provoking the right questions about what EMA is becoming."
    >
      <section className="slides">
        {beats.map((beat, index) => (
          <article className="slide" key={beat.number}>
            <span className="slide__number">{beat.number}</span>
            <h2 className="slide__title">{beat.title}</h2>
            <p className="slide__copy">{beat.copy}</p>
            {index === 1 ? (
              <div className="route-links">
                {parts.slice(0, 4).map((part) => (
                  <Link className="chip" href={`/parts/${part.slug}`} key={part.slug}>
                    {part.title}
                  </Link>
                ))}
              </div>
            ) : null}
            {index === 3 ? (
              <div className="route-links">
                <Link className="chip" href="/graph">
                  Graph
                </Link>
                <Link className="chip" href={`/canvas/${parts[2].slug}`}>
                  Canvas
                </Link>
                <Link className="chip" href={`/slides/${parts[4].slug}`}>
                  Slides
                </Link>
                <Link className="chip" href={`/briefs/${parts[0].slug}`}>
                  Brief
                </Link>
              </div>
            ) : null}
            {index === 4 ? (
              <div className="route-links">
                <Link className="chip" href="/desktop">
                  Open Desktop
                </Link>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
