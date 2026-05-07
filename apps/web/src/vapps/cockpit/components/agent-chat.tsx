"use client";

import { useState, useTransition } from "react";

import { publishAgentMessage } from "../data/projections";

interface ChatTurn {
	readonly role: "user" | "agent";
	readonly body: string;
	readonly actions?: readonly string[];
}

const STARTER_TURNS: readonly ChatTurn[] = [
	{
		role: "agent",
		body: "Cockpit agent is stubbed in Slice 4. Try `first day` or `queue: Title | why: ... | done: ...`. Real daemon publish wires in Slice 5.",
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
				{ role: "agent", body: result.reply, actions: result.actions },
			]);
		});
	}

	return (
		<section className="cockpit-agent">
			<header className="cockpit-agent__header">
				<div>
					<h2 className="cockpit-agent__title">Agent Chat</h2>
					<p className="cockpit-agent__sub">
						local command agent - stubbed in Slice 4
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
					placeholder="first day"
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
