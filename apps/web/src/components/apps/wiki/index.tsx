"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { EMA_SCOPE, MOCK_PROJECTION_LABEL, doctrineCards } from "@/src/app/mock-projections";

type DoctrineCard = {
	readonly title: string;
	readonly body: string;
	readonly tags?: readonly string[];
};

const FADE_DURATION = 0.2;
const FADE_EASE = "var(--place-ease-smooth)";

function cardId(card: DoctrineCard): string {
	return card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function WikiApp() {
	const cards = doctrineCards as readonly DoctrineCard[];
	const tabs = useMemo(
		() => cards.map((card) => ({ id: cardId(card), label: card.title, card })),
		[cards],
	);
	const [active, setActive] = useState<string>(tabs[0]?.id ?? "");
	const [query, setQuery] = useState("");

	const filteredTabs = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return tabs;
		return tabs.filter((tab) =>
			`${tab.card.title} ${tab.card.body}`.toLowerCase().includes(q),
		);
	}, [query, tabs]);

	const activeTab =
		tabs.find((tab) => tab.id === active) ?? filteredTabs[0] ?? tabs[0];

	return (
		<div data-app="wiki" className="wiki-root">
			<header className="wiki-header">
				<div className="wiki-header__meta">
					<p className="wiki-header__eyebrow">project doctrine</p>
					<span className="wiki-pill" data-state="staged">
						{MOCK_PROJECTION_LABEL}
					</span>
				</div>
				<h1 className="wiki-header__title">Wiki</h1>
				<p className="wiki-header__intent">
					Durable doctrine for {EMA_SCOPE.projectName}. Captures context;
					promotion to canon happens through Blueprint.
				</p>
			</header>

			<div className="wiki-body">
				<nav className="wiki-spine" aria-label="Doctrine entries">
					<label className="wiki-spine__search">
						<span className="wiki-spine__search-label">Search doctrine</span>
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="canon, daemon, hierarchy..."
							suppressHydrationWarning
						/>
					</label>
					{filteredTabs.map((tab) => {
						const isActive = tab.id === activeTab?.id;
						return (
							<button
								key={tab.id}
								type="button"
								className="wiki-spine__tab"
								aria-current={isActive ? "true" : undefined}
								onClick={() => setActive(tab.id)}
							>
								{tab.label}
							</button>
						);
					})}
				</nav>

				<AnimatePresence mode="wait" initial={false}>
					<motion.section
						key={activeTab?.id ?? "empty"}
						className="wiki-article"
						aria-label={activeTab?.label ?? "Doctrine"}
						tabIndex={0}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{
							duration: FADE_DURATION,
							ease: [0.65, 0.05, 0, 1],
						}}
						style={{ ["--wiki-fade-ease" as string]: FADE_EASE }}
					>
						{activeTab ? <DoctrineArticle card={activeTab.card} /> : <EmptyDoctrine />}
					</motion.section>
				</AnimatePresence>
			</div>

			<footer className="wiki-footer">
				{cards.length} doctrine entr{cards.length === 1 ? "y" : "ies"} · source:{" "}
				{MOCK_PROJECTION_LABEL}
			</footer>
		</div>
	);
}

function DoctrineArticle({ card }: { readonly card: DoctrineCard }) {
	const tags = card.tags ?? [];
	return (
		<>
			<header className="wiki-article__head">
				<p className="wiki-article__eyebrow">doctrine entry</p>
				<h2 className="wiki-article__title">{card.title}</h2>
			</header>
			<p className="wiki-article__body">{card.body}</p>
			{tags.length > 0 ? (
				<div className="wiki-article__tags" aria-label="Tags">
					{tags.map((tag) => (
						<span key={tag} className="wiki-pill" data-state="tag">
							{tag}
						</span>
					))}
				</div>
			) : null}
			<aside className="wiki-article__note">
				Wiki captures context. Canon-facing decisions live in Blueprint.
			</aside>
		</>
	);
}

function EmptyDoctrine() {
	return (
		<>
			<h2 className="wiki-article__title">No doctrine entries</h2>
			<p className="wiki-article__body">
				This project has not committed any doctrine yet.
			</p>
		</>
	);
}

export default WikiApp;
