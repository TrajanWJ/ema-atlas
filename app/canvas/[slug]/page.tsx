import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { getPart } from "@/lib/ema-atlas";

type CanvasPageProps = {
  params: Promise<{ slug: string }>;
};

const positions = [
  { left: "6%", top: "8%" },
  { left: "54%", top: "12%" },
  { left: "28%", top: "56%" }
];

export default async function CanvasPage({ params }: CanvasPageProps) {
  const { slug } = await params;
  const part = getPart(slug);

  if (!part) {
    notFound();
  }

  return (
    <SiteShell
      eyebrow="Canvas Board"
      title={`${part.title} / Canvas`}
      intro="This route behaves like a thinking surface: three futures pinned into one messy board so the tensions are visible at the same time."
    >
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
