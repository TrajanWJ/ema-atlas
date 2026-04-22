import type { ProviderEvent } from "@claudeforge/shared";

export interface McpServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface StartSessionOptions {
  directory: string;
  systemPrompt?: string;
  model?: string;
  sessionId?: string; // for resume
  mcpServers?: McpServer[];
  mode?: "auto" | "plan" | "normal";
}

export interface AgentProvider {
  readonly name: string;

  /** Start a new session and yield streaming events */
  startSession(options: StartSessionOptions): AsyncGenerator<ProviderEvent>;

  /** Send a message to an existing session */
  sendMessage(sessionId: string, message: string, dbRecord?: any, context?: string): AsyncGenerator<ProviderEvent>;

  /** Abort current generation */
  abort(sessionId: string): void;

  /** Kill session entirely */
  kill(sessionId: string): void;

  /** Check if a session exists and is alive */
  isAlive(sessionId: string): boolean;

  /** Check if the provider CLI is installed and responsive */
  isHealthy(): Promise<{ healthy: boolean; error?: string }>;
}
