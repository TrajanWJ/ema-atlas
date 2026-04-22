import { nanoid } from "nanoid";
import type { ProviderEvent, ToolCallKind } from "@claudeforge/shared";
import type { AgentProvider, StartSessionOptions } from "./types.js";

interface HermesSession {
  id: string;
  directory: string;
  systemPrompt?: string;
  providerSessionId?: string;
  abortController?: AbortController | null;
  alive: boolean;
}

type ParsedSseEvent = {
  event?: string;
  data: string[];
};

/**
 * Hermes backend provider.
 *
 * ClaudeForge stays in charge of Discord/web UX and local session IDs.
 * Hermes provides the backend runtime over its OpenAI-compatible API server.
 */
export class HermesProvider implements AgentProvider {
  readonly name = "hermes";
  private sessions = new Map<string, HermesSession>();
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    this.baseUrl = (process.env.HERMES_BASE_URL ?? "http://127.0.0.1:8642").replace(/\/+$/, "");
    this.apiKey = process.env.HERMES_API_KEY ?? "";
    this.defaultModel = process.env.HERMES_MODEL ?? "gpt-5.4";
  }

  async *startSession(options: StartSessionOptions): AsyncGenerator<ProviderEvent> {
    const localSessionId = options.localSessionId ?? nanoid(12);
    const providerSessionId = options.providerSessionId ?? options.sessionId;
    const session: HermesSession = {
      id: localSessionId,
      directory: options.directory,
      systemPrompt: options.systemPrompt,
      providerSessionId,
      abortController: null,
      alive: false,
    };

    this.sessions.set(localSessionId, session);

    if (providerSessionId) {
      yield { type: "session_init", providerSessionId };
    }

    // Hermes sessions only become real after the first request/response cycle.
    // We still mark the provider as ready so SessionManager can transition the
    // local session to idle and accept the first user message cleanly.
    yield { type: "done", sessionId: localSessionId };
  }

  async *sendMessage(sessionId: string, message: string): AsyncGenerator<ProviderEvent> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      yield { type: "error", message: `Session ${sessionId} not found` };
      return;
    }

    const abortController = new AbortController();
    session.abortController = abortController;
    session.alive = true;

    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    if (session.providerSessionId) {
      headers.set("X-Hermes-Session-Id", session.providerSessionId);
    }

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.defaultModel,
        stream: true,
        messages: [
          ...(session.systemPrompt
            ? [
                {
                  role: "system",
                  content: session.systemPrompt,
                },
              ]
            : []),
          {
            role: "user",
            content: message,
          },
        ],
      }),
      signal: abortController.signal,
    }).catch((err: unknown) => {
      throw new Error(err instanceof Error ? err.message : String(err));
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      session.alive = false;
      session.abortController = null;
      yield {
        type: "error",
        message: `Hermes API error ${response.status}: ${errorText || response.statusText}`,
      };
      return;
    }

    const providerSessionId = response.headers.get("X-Hermes-Session-Id")?.trim();
    if (providerSessionId && providerSessionId !== session.providerSessionId) {
      session.providerSessionId = providerSessionId;
      yield { type: "session_init", providerSessionId };
    }

    if (!response.body) {
      session.alive = false;
      session.abortController = null;
      yield { type: "error", message: "Hermes API returned no response body" };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
        buffer += decoder.decode(chunk, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const parsed = this.parseSseEvent(part);
          if (!parsed) continue;

          const eventName = parsed.event ?? "message";
          const data = parsed.data.join("\n").trim();
          if (!data) continue;
          if (data === "[DONE]") continue;

          if (eventName === "hermes.tool.progress") {
            const payload = JSON.parse(data) as { tool?: string; label?: string };
            const toolName = payload.tool ?? "unknown_tool";
            yield {
              type: "tool_use",
              tool: toolName,
              input: "",
              toolCall: {
                id: `hermes-${nanoid(8)}`,
                kind: this.classifyTool(toolName),
                tool: toolName,
                title: payload.label ?? toolName,
                input: "",
              },
            };
            continue;
          }

          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
          };
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            yield { type: "text", content };
          }
        }
      }

      yield { type: "done", sessionId };
    } catch (err) {
      const messageText = err instanceof Error ? err.message : String(err);
      if (abortController.signal.aborted) {
        yield { type: "error", message: `Hermes request aborted: ${messageText}` };
      } else {
        yield { type: "error", message: `Hermes streaming failed: ${messageText}` };
      }
    } finally {
      session.alive = false;
      session.abortController = null;
    }
  }

  abort(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    session?.abortController?.abort();
    if (session) {
      session.alive = false;
      session.abortController = null;
    }
  }

  kill(sessionId: string): void {
    this.abort(sessionId);
    this.sessions.delete(sessionId);
  }

  isAlive(sessionId: string): boolean {
    return this.sessions.get(sessionId)?.alive ?? false;
  }

  private parseSseEvent(raw: string): ParsedSseEvent | null {
    const lines = raw
      .split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean);

    if (lines.length === 0) return null;

    const parsed: ParsedSseEvent = { data: [] };
    for (const line of lines) {
      if (line.startsWith(":")) continue;
      if (line.startsWith("event:")) {
        parsed.event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        parsed.data.push(line.slice(5).trim());
      }
    }

    return parsed.data.length > 0 ? parsed : null;
  }

  private classifyTool(name: string): ToolCallKind {
    if (name.includes("read") || name.includes("view") || name.includes("snapshot")) return "read";
    if (name.includes("edit") || name.includes("patch")) return "edit";
    if (name.includes("write") || name.includes("create")) return "write";
    if (name.includes("search") || name.includes("grep")) return "search";
    if (name.includes("terminal") || name.includes("process") || name.includes("execute")) return "bash";
    return "generic";
  }
}
