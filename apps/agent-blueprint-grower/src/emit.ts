// Thin WS command dispatcher for the auto-grow agent.
// Mirrors apps/cli/src/ws-client.ts protocol shape — connect, hello, command.

import WebSocket from "ws";

const ACTOR = "actor:agent:blueprint-grower";

interface CommandResult {
	ok: boolean;
	in_reply_to: string;
	type: string;
	events?: string[];
	resource?: string;
	error?: { class: string; message: string };
}

export interface GrowerConfig {
	readonly orgId: string;
	readonly daemonUrl: string;
	readonly blueprintDocId?: string;
}

export class GrowerClient {
	private socket: WebSocket | null = null;
	private opSeq = 0;
	private pending = new Map<string, (result: CommandResult) => void>();
	private connectedResolver: ((value: void) => void) | null = null;
	private connectedPromise: Promise<void> | null = null;

	constructor(private readonly config: GrowerConfig) {}

	async connect(): Promise<void> {
		if (this.socket) return;
		this.connectedPromise = new Promise<void>((resolve) => {
			this.connectedResolver = resolve;
		});
		const ws = new WebSocket(this.config.daemonUrl);
		this.socket = ws;
		ws.on("open", () => {
			ws.send(
				JSON.stringify({
					v: 0,
					id: this.nextId("hello"),
					type: "hello",
					surface: "agent",
				}),
			);
		});
		ws.on("message", (data) => this.onMessage(data.toString()));
		ws.on("close", () => {
			this.socket = null;
		});
		ws.on("error", (err) => {
			console.error("[grower] ws error:", err.message);
		});
		await this.connectedPromise;
	}

	close(): void {
		this.socket?.close();
		this.socket = null;
	}

	private onMessage(raw: string): void {
		try {
			const msg = JSON.parse(raw) as { type?: string };
			if (msg.type === "hello") {
				this.connectedResolver?.();
				this.connectedResolver = null;
				return;
			}
			if (msg.type === "command_result") {
				const result = msg as unknown as CommandResult;
				const cb = this.pending.get(result.in_reply_to);
				if (cb) {
					this.pending.delete(result.in_reply_to);
					cb(result);
				}
			}
		} catch {
			// ignore non-json frames
		}
	}

	private nextId(prefix: string): string {
		this.opSeq += 1;
		return `${prefix}-${this.opSeq}-${Date.now()}`;
	}

	private async command(op: string, args: Record<string, unknown>): Promise<CommandResult> {
		await this.connect();
		const id = this.nextId(op);
		return new Promise<CommandResult>((resolve) => {
			this.pending.set(id, resolve);
			this.socket?.send(JSON.stringify({ v: 0, id, type: "command", op, args }));
		});
	}

	async emitAspiration(line: string): Promise<CommandResult> {
		const title = line.length > 80 ? `${line.slice(0, 77)}...` : line;
		return this.command("blueprint.aspiration.capture", {
			org_id: this.config.orgId,
			actor_id: ACTOR,
			title,
			description: line,
			timeframe: "long_term",
			source_type: "auto_detected",
			origin_app: "agent-blueprint-grower",
			origin_text: line,
		});
	}

	async emitDecision(title: string, body: string): Promise<CommandResult> {
		return this.command("blueprint.decision.lock", {
			org_id: this.config.orgId,
			actor_id: ACTOR,
			title: title.length > 80 ? `${title.slice(0, 77)}...` : title,
			body: body || title,
		});
	}

	async emitGac(question: string): Promise<CommandResult | null> {
		if (!this.config.blueprintDocId) {
			console.warn("[grower] gac skipped: EMA_BLUEPRINT_DOC_ID not set");
			return null;
		}
		return this.command("blueprint.gac.create", {
			org_id: this.config.orgId,
			actor_id: ACTOR,
			document_id: this.config.blueprintDocId,
			category: "gap",
			priority: "medium",
			question,
		});
	}

	async emitBlocker(title: string): Promise<CommandResult> {
		return this.command("blueprint.blocker.open", {
			org_id: this.config.orgId,
			actor_id: ACTOR,
			category: "tricky_question",
			priority: "medium",
			title: title.length > 80 ? `${title.slice(0, 77)}...` : title,
			description: title,
		});
	}
}
