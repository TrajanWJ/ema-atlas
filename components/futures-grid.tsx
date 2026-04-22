import Link from "next/link";

import type { Part, Vision } from "@/lib/ema-atlas";

export type FuturesGridItem = {
  vision: Vision;
  part: Part;
  stanceKey: "operator-cathedral" | "living-workspace" | "mesh-commonwealth";
  stanceLabel: string;
};

type FuturesGridProps = {
  visions: FuturesGridItem[];
  groupBy?: "stance" | "part" | "none";
};

const STANCE_ORDER: FuturesGridItem["stanceKey"][] = [
  "operator-cathedral",
  "living-workspace",
  "mesh-commonwealth"
];

const STANCE_LABELS: Record<FuturesGridItem["stanceKey"], string> = {
  "operator-cathedral": "Operator Cathedral",
  "living-workspace": "Living Workspace",
  "mesh-commonwealth": "Mesh Commonwealth"
};

function FuturesCard({ item }: { item: FuturesGridItem }) {
  const { vision, part, stanceLabel } = item;
  return (
    <article className="panel futures-card" key={vision.id}>
      <p className="panel__tag">{stanceLabel}</p>
      <p className="list__eyebrow">{part.title}</p>
      <h3 className="list__title">{vision.title}</h3>
      <div className="panel__stack">
        <div>
          <span className="panel__label">Hard Question</span>
          <p>{vision.question}</p>
        </div>
      </div>
      <div className="panel__actions">
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
  );
}

export function FuturesGrid({ visions, groupBy = "none" }: FuturesGridProps) {
  if (groupBy === "none") {
    return (
      <div className="futures-grid">
        {visions.map((item) => (
          <FuturesCard key={item.vision.id} item={item} />
        ))}
      </div>
    );
  }

  if (groupBy === "stance") {
    return (
      <div className="futures-grid__groups">
        {STANCE_ORDER.map((stance) => {
          const items = visions.filter((v) => v.stanceKey === stance);
          if (items.length === 0) return null;
          return (
            <section key={stance}>
              <div className="panel">
                <p className="panel__tag">Stance</p>
                <h2 className="panel__title">{STANCE_LABELS[stance]}</h2>
                <p className="panel__lede">
                  {items.length} parts viewed through this stance.
                </p>
              </div>
              <div className="futures-grid">
                {items.map((item) => (
                  <FuturesCard key={item.vision.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // groupBy === "part"
  const partMap = new Map<string, { part: Part; items: FuturesGridItem[] }>();
  for (const item of visions) {
    const existing = partMap.get(item.part.slug);
    if (existing) existing.items.push(item);
    else partMap.set(item.part.slug, { part: item.part, items: [item] });
  }
  return (
    <div className="futures-grid__groups">
      {Array.from(partMap.values()).map(({ part, items }) => (
        <section key={part.slug}>
          <div className="panel">
            <p className="panel__tag">{part.strapline}</p>
            <h2 className="panel__title">{part.title}</h2>
          </div>
          <div className="futures-grid">
            {items.map((item) => (
              <FuturesCard key={item.vision.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
