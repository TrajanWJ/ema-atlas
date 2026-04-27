import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { getPart } from "@/lib/ema-atlas";
import { DIAGRAM_CAPTIONS, loadDiagrams } from "@/lib/diagrams";

type CanvasPageProps = {
  params: Promise<{ slug: string }>;
};

const positions = [
  { left: "6%", top: "8%" },
  { left: "54%", top: "12%" },
  { left: "28%", top: "56%" }
];

const DIAGRAM_PANELS: Array<{
  key: "now" | "threeFutures" | "decisions";
  captionKey: "now" | "three-futures" | "decisions";
  label: string;
}> = [
  { key: "now", captionKey: "now", label: "Now" },
  { key: "threeFutures", captionKey: "three-futures", label: "Three Futures" },
  { key: "decisions", captionKey: "decisions", label: "Decisions" }
];

export default async function CanvasPage({ params }: CanvasPageProps) {
  const { slug } = await params;
  const part = getPart(slug);

  if (!part) {
    notFound();
  }

  const diagrams = await loadDiagrams(slug);
  const captions = DIAGRAM_CAPTIONS[slug];
  const hasAnyDiagram = Boolean(diagrams.now || diagrams.threeFutures || diagrams.decisions);

  return (
    <SiteShell
      eyebrow="Canvas Board"
      title={`${part.title} / Canvas`}
      intro="This route behaves like a thinking surface: three futures pinned into one messy board so the tensions are visible at the same time."
    >
      {hasAnyDiagram && (
        <section className="panel">
          <p className="panel__tag">Diagrams</p>
          <h2 className="panel__title">Now, three futures, and decisions at a glance.</h2>
          <div className="canvas-diagrams">
            {DIAGRAM_PANELS.map((panel) => {
              const svg = diagrams[panel.key];
              const caption = captions?.[panel.captionKey];
              return (
                <figure className="canvas-diagrams__svg" key={panel.key}>
                  <figcaption className="canvas-diagrams__label">{panel.label}</figcaption>
                  {svg ? (
                    <div
                      className="canvas-diagrams__frame"
                      aria-label={`${part.title} ${panel.label} diagram`}
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                  ) : (
                    <div
                      className="canvas-diagrams__frame"
                      aria-label={`${part.title} ${panel.label} diagram`}
                    >
                      <span className="canvas-diagrams__missing">Diagram pending</span>
                    </div>
                  )}
                  {caption && <p className="canvas-diagrams__caption">{caption}</p>}
                </figure>
              );
            })}
          </div>
        </section>
      )}

      <section className="canvas">
        <span className="canvas__thread" style={{ left: "30%", top: "26%", width: "28%", rotate: "6deg" }} />
        <span className="canvas__thread" style={{ left: "38%", top: "42%", width: "18%", rotate: "90deg" }} />
        <span className="canvas__thread" style={{ left: "18%", top: "60%", width: "40%", rotate: "-10deg" }} />
        {part.visions.map((vision, index) => (
          <article
            className="canvas__card"
            key={vision.id}
            style={positions[index]}
          >
            <p className="panel__tag">{vision.title}</p>
            <h2 className="list__title">{part.title}</h2>
            <p className="list__copy">{vision.stance}</p>
            <p>
              <strong>Bet:</strong> {vision.bet}
            </p>
            <p>
              <strong>Tension:</strong> {vision.tension}
            </p>
            <p>
              <strong>Question:</strong> {vision.question}
            </p>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
