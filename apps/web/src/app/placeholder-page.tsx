import {
  MOCK_PROJECTION_LABEL,
  doctrineCards,
  threadCards,
} from "./mock-projections";

type PlaceholderPageProps = {
  kind: "wiki" | "threads";
};

export function PlaceholderPage({ kind }: PlaceholderPageProps) {
  const isWiki = kind === "wiki";
  const title = isWiki ? "Wiki / Doctrine" : "Chat / Threads";
  const kicker = isWiki ? "doctrine scaffold" : "coordination scaffold";
  const cards = isWiki
    ? doctrineCards.map((card) => ({ ...card, meta: "doctrine" }))
    : threadCards;

  return (
    <section className="ema-vapp ema-vapp--placeholder">
      <header className="ema-vapp__header ema-vapp__header--split">
        <div>
          <p className="ema-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p className="ema-vapp__tagline">
            Placeholder surface for EMA 0.0.5. Content is local, visible,
            and intentionally not canonical.
          </p>
        </div>
        <span className="ema-pill ema-pill--hot">{MOCK_PROJECTION_LABEL}</span>
      </header>

      <div className="ema-placeholder-grid">
        {cards.map((card) => (
          <article key={card.title} className="ema-placeholder-card">
            <span>{card.meta}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            <button className="ema-control-button ema-control-button--compact">
              <span>{isWiki ? "Open note" : "Open thread"}</span>
              <strong>mock only</strong>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
