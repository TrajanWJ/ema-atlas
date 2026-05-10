"use client";

import { useState, useTransition } from "react";

import { publishAgentMessage } from "../data/projections";

interface ChatTurn {
	readonly role: "user" | "agent";
	readonly body: string;
	readonly actions?: readonly string[];
	readonly error?: boolean;
}

const STARTER_TURNS: readonly ChatTurn[] = [
	{
		role: "agent",
		body: "Cockpit reads live EMA workspace state for Proslync. Try `proslync swarm` or `queue: Title | why: ... | done: ...`.",
	},
];

export function AgentChat() {
	const [turns, setTurns] = useState<ChatTurn[]>([...STARTER_TURNS]);
	const [draft, setDraft] = useState("");
	const [pending, startTransition] = useTransition();

	function submit() {
		const message = draft.trim();
		if (!message || pending) return;
		setDraft("");
		setTurns((current) => [...current, { role: "user", body: message }]);
		startTransition(async () => {
			const result = await publishAgentMessage(message);
			setTurns((current) => [
				...current,
				{ role: "agent", body: result.reply, actions: result.actions, error: !result.ok },
			]);
		});
	}

	return (
		<section className="cockpit-agent">
			<header className="cockpit-agent__header">
				<div>
					<h2 className="cockpit-agent__title">Agent Chat</h2>
					<p className="cockpit-agent__sub">
						local command grammar - writes queue-backed
					</p>
				</div>
			</header>

			<div className="cockpit-agent__log">
				{turns.map((turn, index) => (
					<article
						key={`${turn.role}-${index}`}
						className={
							turn.role === "user"
								? "cockpit-agent__turn cockpit-agent__turn--user"
								: turn.error
									? "cockpit-agent__turn cockpit-agent__turn--agent cockpit-agent__turn--error"
									: "cockpit-agent__turn cockpit-agent__turn--agent"
						}
					>
						<p className="cockpit-agent__role">{turn.role}</p>
						<p className="cockpit-agent__body">{turn.body}</p>
						{turn.actions && turn.actions.length > 0 ? (
							<p className="cockpit-agent__actions">{turn.actions.join(" - ")}</p>
						) : null}
					</article>
				))}
				{pending ? <p className="cockpit-agent__pending">Working...</p> : null}
			</div>

			<div className="cockpit-agent__input">
				<input
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							submit();
						}
					}}
					placeholder="proslync swarm"
					className="cockpit-input"
				/>
				<button
					type="button"
					onClick={submit}
					disabled={pending || draft.trim().length === 0}
					className="cockpit-button cockpit-button--primary"
				>
					Send
				</button>
			</div>
		</section>
	);
}
