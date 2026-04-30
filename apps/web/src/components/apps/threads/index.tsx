"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { MOCK_PROJECTION_LABEL, threadCards } from "@/src/app/mock-projections";
// TODO: wire useChannel for real-time once `@/src/lib/ipc` exposes it from
// the surface-core ipc client (see `@/src/lib/ipc/use-channel.ts`).

type ThreadCard = {
	readonly title: string;
	readonly meta: string;
	readonly body: string;
};

type ThreadView = {
	readonly id: string;
	readonly title: string;
	readonly meta: string;
	readonly excerpt: string;
	readonly participants: readonly string[];
	readonly timestamp: string;
};

const FADE_EASE: [number, number, number, number] = [0.65, 0.05, 0, 1];

function threadId(card: ThreadCard): string {
	return card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function deriveParticipants(card: ThreadCard): readonly string[] {
	const seed = `${card.title} ${card.meta}`;
	const tokens = seed.split(/\s+/).filter(Boolean);
	const initials = tokens.slice(0, 3).map((token) => token[0]?.toUpperCase() ?? "?");
	return initials.length > 0 ? initials : ["?"];
}

function deriveTimestamp(index: number): string {
	const minutes = (index + 1) * 7;
	return `${minutes}m ago`;
}

export function ThreadsApp() {
	const cards = threadCards as readonly ThreadCard[];
	const threads = useMemo<readonly ThreadView[]>(
		() =>
			cards.map((card, index) => ({
				id: threadId(card),
				title: card.title,
				meta: card.meta,
				excerpt: card.body,
				participants: deriveParticipants(card),
				timestamp: deriveTimestamp(index),
			})),
		[cards],
	);
	const [openId, setOpenId] = useState<string | null>(null);

	const openThread = openId ? threads.find((thread) => thread.id === openId) : undefined;

	return (
		<div data-app="threads" className="threads-root">
			<header className="threads-header">
				<div className="threads-header__meta">
					<p className="threads-header__eyebrow">project chat</p>
					<span className="threads-pill" data-state="staged">
						{MOCK_PROJECTION_LABEL}
					</span>
				</div>
				<h1 className="threads-header__title">Threads</h1>
				<p className="threads-header__intent">
					Coordination stream. Click a thread to read; sending wires in once
					the daemon channel lands.
				</p>
			</header>

			<AnimatePresence mode="wait" initial={false}>
				{openThread ? (
					<motion.section
						key={`detail-${openThread.id}`}
						className="threads-detail glass-elevated"
						aria-label={openThread.title}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2, ease: FADE_EASE }}
					>
						<button
							type="button"
							className="threads-detail__back"
							onClick={() => setOpenId(null)}
						>
							Back to threads
						</button>
						<header className="threads-detail__head">
							<h2 className="threads-detail__title">{openThread.title}</h2>
							<span className="threads-pill" data-state="staged">
								{openThread.meta}
							</span>
						</header>
						<p className="threads-detail__excerpt">{openThread.excerpt}</p>
						<p className="threads-detail__placeholder">
							Thread history wires in once the daemon owns this channel.
						</p>
					</motion.section>
				) : (
					<motion.section
						key="list"
						className="threads-list"
						aria-label="Thread previews"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2, ease: FADE_EASE }}
					>
						{threads.map((thread) => (
							<button
								key={thread.id}
								type="button"
								className="threads-preview glass-elevated"
								onClick={() => setOpenId(thread.id)}
							>
								<div className="threads-preview__head">
									<strong className="threads-preview__title">{thread.title}</strong>
									<span className="threads-preview__time">{thread.timestamp}</span>
								</div>
								<p className="threads-preview__excerpt">{thread.excerpt}</p>
								<div className="threads-preview__foot">
									<div className="threads-avatars" aria-label="Participants">
										{thread.participants.map((initial, index) => (
											<span
												key={`${thread.id}-${index}-${initial}`}
												className="threads-avatar"
												aria-hidden
											>
												{initial}
											</span>
										))}
									</div>
									<span className="threads-pill" data-state="staged">
										{thread.meta}
									</span>
								</div>
							</button>
						))}
					</motion.section>
				)}
			</AnimatePresence>
		</div>
	);
}

export default ThreadsApp;
