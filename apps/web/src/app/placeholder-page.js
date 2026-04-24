import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MOCK_PROJECTION_LABEL, doctrineCards, threadCards, } from "./mock-projections";
export function PlaceholderPage({ kind }) {
    const isWiki = kind === "wiki";
    const title = isWiki ? "Wiki / Doctrine" : "Chat / Threads";
    const kicker = isWiki ? "doctrine scaffold" : "coordination scaffold";
    const cards = isWiki
        ? doctrineCards.map((card) => ({ ...card, meta: "doctrine" }))
        : threadCards;
    return (_jsxs("section", { className: "ema-vapp ema-vapp--placeholder", children: [_jsxs("header", { className: "ema-vapp__header ema-vapp__header--split", children: [_jsxs("div", { children: [_jsx("p", { className: "ema-kicker", children: kicker }), _jsx("h1", { children: title }), _jsx("p", { className: "ema-vapp__tagline", children: "Placeholder surface for EMA 0.0.5. Content is local, visible, and intentionally not canonical." })] }), _jsx("span", { className: "ema-pill ema-pill--hot", children: MOCK_PROJECTION_LABEL })] }), _jsx("div", { className: "ema-placeholder-grid", children: cards.map((card) => (_jsxs("article", { className: "ema-placeholder-card", children: [_jsx("span", { children: card.meta }), _jsx("h2", { children: card.title }), _jsx("p", { children: card.body }), _jsxs("button", { className: "ema-control-button ema-control-button--compact", children: [_jsx("span", { children: isWiki ? "Open note" : "Open thread" }), _jsx("strong", { children: "mock only" })] })] }, card.title))) })] }));
}
