import { execSync } from "node:child_process";
import type { ProviderName, ProviderHealthStatus } from "@claudeforge/shared";
import type { AgentProvider } from "./types.js";
import { ClaudeProvider } from "./claude-provider.js";
import { CodexProvider } from "./codex-provider.js";

export type { AgentProvider, StartSessionOptions, McpServer } from "./types.js";

export class ProviderRegistry {
  private providers = new Map<string, AgentProvider>();
  private healthCache = new Map<string, ProviderHealthStatus>();
  private healthCheckInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.register(new ClaudeProvider());
    this.register(new CodexProvider());
  }

  register(provider: AgentProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: ProviderName | string): AgentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Unknown provider: ${name}. Available: ${[...this.providers.keys()].join(", ")}`);
    }
    return provider;
  }

  list(): string[] {
    return [...this.providers.keys()];
  }

  /** Check if a provider's CLI is installed on the host */
  isAvailable(name: string): boolean {
    try {
      execSync(`which ${name}`, { encoding: "utf-8", stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  /** List all providers with availability status */
  listWithStatus(): Array<{ name: string; available: boolean }> {
    return this.list().map((name) => ({
      name,
      available: this.isAvailable(name),
    }));
  }

  /** Check health of all providers */
  async checkAllHealth(): Promise<ProviderHealthStatus[]> {
    const results: ProviderHealthStatus[] = [];
    for (const [name, provider] of this.providers) {
      const available = this.isAvailable(name);
      const { healthy, error } = await provider.isHealthy();
      const status: ProviderHealthStatus = {
        name,
        available,
        healthy,
        lastChecked: Date.now(),
        error: error ?? null,
      };
      this.healthCache.set(name, status);
      results.push(status);
    }
    return results;
  }

  /** Get cached health status */
  getHealthStatus(): ProviderHealthStatus[] {
    return [...this.healthCache.values()];
  }

  /** Start periodic health checks */
  startHealthChecks(intervalMs: number, onChange?: (statuses: ProviderHealthStatus[]) => void): void {
    // Initial check
    this.checkAllHealth().then((statuses) => onChange?.(statuses));

    this.healthCheckInterval = setInterval(async () => {
      const previous = new Map(this.healthCache);
      const statuses = await this.checkAllHealth();

      // Check if anything changed
      const changed = statuses.some((s) => {
        const prev = previous.get(s.name);
        return !prev || prev.healthy !== s.healthy || prev.available !== s.available;
      });

      if (changed) {
        onChange?.(statuses);
      }
    }, intervalMs);
  }

  /** Stop periodic health checks */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }
}
