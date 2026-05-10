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
		body: "Cockpit reads live EMA workspace state for Proslync. Try `/help` for vetted commands, `/lane list`, `/queue list`, `/cockpit workpack`, or capture syntax `queue: Title | why: ... | done: ...`.",
	},
];

const SLASH_HELP_LINES = [
	"Supported commands:",
	"  /lane list [--status <s>]",
	"  /queue list [--status <s>]",
	"  /cockpit projection",
	"  /cockpit workpack",
	"  /help",
];

type ChatApiResponse = {
	readonly ok?: boolean;
	readonly status?: string;
	readonly error?: string;
	readonly hint?: string;
	readonly reply?: string;
	readonly command_id?: string;
	readonly command?: readonly string[];
	readonly result?: unknown;
	readonly supported?: readonly string[];
};

function summarizeChatResult(payload: ChatApiResponse): string {
	if (payload.command_id === "help" && typeof payload.reply === "string") return payload.reply;
	const result = payload.result;
	if (!result || typeof result !== "object") return JSON.stringify(result ?? null, null, 2);
	const record = result as Record<string, unknown>;
	if (payload.command_id === "lane.list" && Array.isArray(record.lanes)) {
		return `${record.lanes.length} lane(s)`;
	}
	if (payload.command_id === "queue.list" && Array.isArray(record.queue_items)) {
		return `${record.queue_items.length} queue item(s)`;
	}
	if (payload.command_id === "queue.list" && Array.isArray(record.items)) {
		return `${record.items.length} queue item(s)`;
	}
	if (payload.command_id === "cockpit.projection") {
		const lanes = Array.isArray(record.lanes) ? record.lanes.length : "?";
		const queue = Array.isArray(record.queue) ? record.queue.length : "?";
		return `cockpit projection — ${lanes} lanes, ${queue} queue`;
	}
	if (payload.command_id === "cockpit.workpack") {
		const health = (record.health as Record<string, unknown> | undefined)?.daemon ?? "unknown";
		return `workpack — daemon ${String(health)}`;
	}
	return JSON.stringify(result, null, 2);
}

async function runSlashCommand(message: string): Promise<{
	readonly reply: string;
	readonly actions: readonly string[];
	readonly error: boolean;
}> {
	if (typeof window === "undefined") {
		return {
			reply: "Slash commands require a browser surface.",
			actions: [],
			error: true,
		};
	}
	try {
		const response = await fetch("/api/cockpit/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ command: message }),
		});
		const payload = (await response.json()) as ChatApiResponse;
		if (!response.ok || !payload.ok) {
			const reply = payload.error
				? `${payload.error}${payload.hint ? `\n${payload.hint}` : ""}`
				: `chat command failed (${payload.status ?? `http_${response.status}`})`;
			return { reply, actions: payload.command ? [payload.command.join(" ")] : [], error: true };
		}
		return {
			reply: summarizeChatResult(payload),
			actions: payload.command ? [payload.command.join(" ")] : [],
			error: false,
		};
	} catch (error) {
		return {
			reply: error instanceof Error ? error.message : String(error),
			actions: [],
			error: true,
		};
	}
}

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
			if (message.startsWith("/")) {
				if (message === "/help") {
					setTurns((current) => [
						...current,
						{ role: "agent", body: SLASH_HELP_LINES.join("\n") },
					]);
					return;
				}
				const slash = await runSlashCommand(message);
				setTurns((current) => [
					...current,
					{ role: "agent", body: slash.reply, actions: slash.actions, error: slash.error },
				]);
				return;
			}
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
						vetted slash commands - or queue capture grammar
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
					placeholder="/help, /lane list, /queue list, or queue: title | why: ... | done: ..."
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
