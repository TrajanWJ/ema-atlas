import type { ProviderName } from "@claudeforge/shared";
import type { AgentProvider } from "./types.js";
import { ClaudeProvider } from "./claude-provider.js";
import { CodexProvider } from "./codex-provider.js";
import { HermesProvider } from "./hermes-provider.js";

export type { AgentProvider, StartSessionOptions, McpServer } from "./types.js";

export class ProviderRegistry {
  private providers = new Map<string, AgentProvider>();

  constructor() {
    this.register(new ClaudeProvider());
    this.register(new CodexProvider());
    this.register(new HermesProvider());
  }

  register(provider: AgentProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: ProviderName): AgentProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`Provider "${name}" not registered`);
    return provider;
  }

  list(): string[] {
    return [...this.providers.keys()];
  }
}
