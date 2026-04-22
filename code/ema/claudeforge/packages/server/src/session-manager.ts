import { nanoid } from "nanoid";
import { EventEmitter } from "node:events";
import type {
  ChatMessage,
  CreateSessionRequest,
  ProviderName,
  SessionRecord,
  SessionStatus,
  ProviderEvent,
} from "@claudeforge/shared";
import { SESSION_PREFIX, DEFAULT_SESSION_NAME } from "@claudeforge/shared";
import { Persistence } from "./persistence.js";
import { ProviderRegistry } from "./providers/index.js";

export class SessionManager extends EventEmitter {
  private providers: ProviderRegistry;
  private activeGenerators = new Map<string, AsyncGenerator<ProviderEvent>>();

  constructor(
    private db: Persistence,
    providers?: ProviderRegistry
  ) {
    super();
    this.providers = providers ?? new ProviderRegistry();
  }

  /** Create a new session in a project directory */
  async createSession(req: CreateSessionRequest): Promise<SessionRecord> {
    const id = nanoid(12);
    const tmuxName = `${SESSION_PREFIX}${req.name}-${id.slice(0, 6)}`;
    const now = Date.now();
    const project = this.db.getProject(req.projectId);
    const systemPrompt = project?.personality ?? null;

    const session: SessionRecord = {
      id,
      name: req.name,
      projectId: req.projectId,
      projectName: req.projectName,
      directory: req.directory,
      channelId: req.channelId ?? null,
      provider: req.provider ?? "claude",
      providerSessionId: null,
      tmuxName,
      model: req.model ?? null,
      mode: req.mode ?? "auto",
      agentPersona: systemPrompt,
      status: "active",
      verbose: false,
      createdAt: now,
      lastActivity: now,
      messageCount: 0,
      totalTokens: 0,
      totalCost: 0,
    };

    this.db.upsertSession(session);
    this.db.insertEvent("session.created", "session-manager", { sessionId: id, name: req.name });

    // Start the provider session
    const provider = this.providers.get(session.provider);
    const gen = provider.startSession({
      localSessionId: session.id,
      directory: session.directory,
      systemPrompt: systemPrompt ?? undefined,
      model: session.model ?? undefined,
      mode: session.mode,
    });
    this.activeGenerators.set(id, gen);

    // Consume the generator in background, emitting events
    this.consumeProviderStream(id, gen);

    this.emit("session.created", session);
    return session;
  }

  /** Send a user message to a session */
  async sendMessage(sessionId: string, content: string): Promise<void> {
    const session = this.db.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    // Store the user message
    const message: ChatMessage = {
      id: nanoid(12),
      sessionId,
      role: "user",
      content,
      createdAt: Date.now(),
    };
    this.db.insertMessage(message);
    this.emit("message.created", message);

    // Send to provider
    const provider = this.providers.get(session.provider);
    const gen = provider.sendMessage(sessionId, content);
    this.consumeProviderStream(sessionId, gen);
  }

  /** Stop a session */
  stopSession(sessionId: string): void {
    const session = this.db.getSession(sessionId);
    if (!session) return;

    const provider = this.providers.get(session.provider);
    provider.kill(sessionId);

    this.db.updateSessionStatus(sessionId, "stopped");
    this.emit("session.status", sessionId, "stopped");
    this.emit("session.closed", sessionId);
    this.activeGenerators.delete(sessionId);
  }

  /** Resume a stopped session */
  async resumeSession(sessionId: string): Promise<void> {
    const session = this.db.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const provider = this.providers.get(session.provider);
    const gen = provider.startSession({
      localSessionId: sessionId,
      directory: session.directory,
      systemPrompt: session.agentPersona ?? undefined,
      providerSessionId: session.providerSessionId ?? undefined,
      model: session.model ?? undefined,
      mode: session.mode,
    });
    this.activeGenerators.set(sessionId, gen);
    this.consumeProviderStream(sessionId, gen);

    this.db.updateSessionStatus(sessionId, "active");
    this.emit("session.status", sessionId, "active");
  }

  /** Abort current generation */
  abortSession(sessionId: string): void {
    const session = this.db.getSession(sessionId);
    if (!session) return;

    const provider = this.providers.get(session.provider);
    provider.abort(sessionId);
  }

  /** Bind a Discord channel to a session */
  bindChannel(sessionId: string, channelId: string): void {
    const session = this.db.getSession(sessionId);
    if (!session) return;
    session.channelId = channelId;
    this.db.upsertSession(session);
  }

  /** Get session by channel */
  getByChannel(channelId: string): SessionRecord | undefined {
    return this.db.getSessionByChannelId(channelId);
  }

  /** List sessions */
  list(projectId?: string): SessionRecord[] {
    return this.db.getSessions(projectId);
  }

  /** Get a single session */
  get(sessionId: string): SessionRecord | undefined {
    return this.db.getSession(sessionId);
  }

  /** Get active sessions */
  getActive(): SessionRecord[] {
    return this.db.getActiveSessions();
  }

  /** Background consumer for provider event streams */
  private async consumeProviderStream(sessionId: string, gen: AsyncGenerator<ProviderEvent>): Promise<void> {
    try {
      let textBuffer = "";
      for await (const event of gen) {
        // Emit raw event for real-time subscribers (Discord bot, WebSocket)
        this.emit("session.output", sessionId, event);

        // Handle specific events
        switch (event.type) {
          case "session_init":
            const sess = this.db.getSession(sessionId);
            if (sess) {
              sess.providerSessionId = event.providerSessionId;
              this.db.upsertSession(sess);
            }
            break;

          case "text":
            textBuffer += event.content;
            break;

          case "tool_use":
          case "tool_result": {
            // Flush text buffer as a message first
            if (textBuffer.trim()) {
              const textMsg: ChatMessage = {
                id: nanoid(12),
                sessionId,
                role: "assistant",
                content: textBuffer.trim(),
                createdAt: Date.now(),
              };
              this.db.insertMessage(textMsg);
              this.emit("message.created", textMsg);
              textBuffer = "";
            }
            // Store tool call as a message
            const toolMsg: ChatMessage = {
              id: nanoid(12),
              sessionId,
              role: "assistant",
              content: event.type === "tool_use" ? `Using tool: ${event.tool}` : `Tool result: ${event.tool}`,
              createdAt: Date.now(),
              toolCall: event.toolCall,
            };
            this.db.insertMessage(toolMsg);
            this.emit("message.created", toolMsg);
            break;
          }

          case "done": {
            // Flush remaining text
            if (textBuffer.trim()) {
              const finalMsg: ChatMessage = {
                id: nanoid(12),
                sessionId,
                role: "assistant",
                content: textBuffer.trim(),
                createdAt: Date.now(),
              };
              this.db.insertMessage(finalMsg);
              this.emit("message.created", finalMsg);
              textBuffer = "";
            }
            if (event.cost) {
              const s = this.db.getSession(sessionId);
              if (s) {
                s.totalCost += event.cost;
                this.db.upsertSession(s);
              }
            }
            this.db.updateSessionStatus(sessionId, "idle");
            this.emit("session.status", sessionId, "idle" as SessionStatus);
            break;
          }

          case "error":
            this.db.updateSessionStatus(sessionId, "error");
            this.emit("session.status", sessionId, "error" as SessionStatus);
            break;
        }
      }
    } catch (err) {
      console.error(`[session-manager] Stream error for ${sessionId}:`, err);
      this.db.updateSessionStatus(sessionId, "error");
      this.emit("session.status", sessionId, "error" as SessionStatus);
    }
  }
}
