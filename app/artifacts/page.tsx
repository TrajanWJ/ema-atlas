import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { parts } from "@/lib/ema-atlas";

const artifactModes = [
  {
    title: "Atlas Pages",
    copy: "Narrative route pages for every EMA part with three futures and hard questions.",
    href: "/parts"
  },
  {
    title: "Print / PDF Briefs",
    copy: "Printable longform briefs designed to export cleanly to PDF later.",
    href: `/briefs/${parts[0].slug}`
  },
  {
    title: "Slide Decks",
    copy: "Presentation routes with editorial slide rhythm for demos, pitches, and internal reviews.",
    href: `/slides/${parts[0].slug}`
  },
  {
    title: "Canvas Boards",
    copy: "Excalidraw/Miro-like thinking boards for each part with notes, links, and tension threads.",
    href: `/canvas/${parts[0].slug}`
  },
  {
    title: "Graph View",
    copy: "A route that visualizes how parts of EMA relate rather than listing them in one stack.",
    href: "/graph"
  },
  {
    title: "Project Demo",
    copy: "A staged walkthrough of how the atlas, planner, workspace, and desktop metaphor can present EMA as a product story.",
    href: "/demo"
  },
  {
    title: "Showroom Gallery",
    copy: "A gallery-like route for touring the current EMA phase as a field of deliverables, formats, doctrine, and implementation tracks.",
    href: "/showroom"
  },
  {
    title: "Program Map",
    copy: "A cross-part route that shows how deliverables, implementation pressure, and hard questions line up across the whole EMA effort.",
    href: "/program"
  },
  {
    title: "Desktop Surface",
    copy: "A place.org-inspired desktop route that treats EMA like a world of windows and live surfaces.",
    href: "/desktop"
  }
];

export default function ArtifactsPage() {
  return (
    <SiteShell
      eyebrow="Artifact Modes"
      title="Deliverables As Routes"
      intro="The website is the center, but it is not only a website. Each route format expresses EMA differently: editorial, spatial, printable, relational, and demo-like."
    >
      <section className="artifact-grid">
        {artifactModes.map((mode) => (
          <article className="panel list-card" key={mode.title}>
            <p className="panel__tag">Mode</p>
            <h2 className="list__title">{mode.title}</h2>
            <p className="list__copy">{mode.copy}</p>
            <Link className="chip" href={mode.href}>
              Open
            </Link>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
