import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { getPart } from "@/lib/ema-atlas";

type SlidesPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SlidesPage({ params }: SlidesPageProps) {
  const { slug } = await params;
  const part = getPart(slug);

  if (!part) {
    notFound();
  }

  return (
    <SiteShell
      eyebrow="Slide Route"
      title={`${part.title} / Slides`}
      intro="An editorial slide deck route for reviews, demos, and future framing. It preserves the three competing takes instead of pretending there is only one answer."
    >
      <section className="slides">
        <article className="slide">
          <span className="slide__number">Slide 01 / Part</span>
          <h2 className="slide__title">{part.title}</h2>
          <p className="slide__copy">{part.summary}</p>
        </article>
        {part.visions.map((vision, index) => (
          <article className="slide" key={vision.id}>
            <span className="slide__number">Slide 0{index + 2} / {vision.title}</span>
            <h2 className="slide__title">{vision.title}</h2>
            <p className="slide__copy">{vision.stance}</p>
            <p className="slide__copy">
              <strong>Bet:</strong> {vision.bet}
            </p>
            <p className="slide__copy">
              <strong>Tension:</strong> {vision.tension}
            </p>
            <p className="slide__copy">
              <strong>Question:</strong> {vision.question}
            </p>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
