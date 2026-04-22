import type { ProviderName } from "@claudeforge/shared";
import type { AgentProvider } from "./types.js";
export type { AgentProvider, StartSessionOptions, McpServer } from "./types.js";
export declare class ProviderRegistry {
    private providers;
    constructor();
    register(provider: AgentProvider): void;
    get(name: ProviderName): AgentProvider;
    list(): string[];
}
//# sourceMappingURL=index.d.ts.map