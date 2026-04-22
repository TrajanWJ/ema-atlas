import Link from "next/link";

import type { Part, Vision } from "@/lib/ema-atlas";

type VisionTriptychProps = {
  part: Part;
  visions?: Vision[];
};

export function VisionTriptych({ part, visions = part.visions }: VisionTriptychProps) {
  return (
    <section className="triptych">
      {visions.map((vision) => (
        <article className="panel panel--vision" key={vision.id}>
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
            <div>
              <span className="panel__label">Hard Question</span>
              <p>{vision.question}</p>
            </div>
          </div>
          <div className="panel__actions">
            <Link href={`/briefs/${part.slug}`} className="chip">
              Brief
            </Link>
            <Link href={`/slides/${part.slug}`} className="chip">
              Slides
            </Link>
            <Link href={`/canvas/${part.slug}`} className="chip">
              Canvas
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
