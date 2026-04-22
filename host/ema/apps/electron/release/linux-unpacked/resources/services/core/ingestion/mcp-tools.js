import { z } from "zod";
import { discoverAgentConfigs, discoverSessionCandidates, generateBackfeed, getIngestionStatus, importDiscoveredSessions, parseSessionTimeline, } from "./service.js";
const agentInput = z.object({
    agent: z.string().optional(),
});
export const ingestionMcpTools = [
    {
        name: "ingestion_scan",
        description: "Discover local agent configuration directories and summarise session coverage.",
        inputSchema: z.object({}),
        handler: () => ({ configs: discoverAgentConfigs(process.cwd()) }),
    },
    {
        name: "ingestion_sessions",
        description: "Parse recent agent session histories into a unified timeline.",
        inputSchema: agentInput,
        handler: (raw) => {
            const input = agentInput.parse(raw ?? {});
            return {
                timeline: parseSessionTimeline({
                    ...(input.agent !== undefined ? { agent: input.agent } : {}),
                    repoRoot: process.cwd(),
                }),
            };
        },
    },
    {
        name: "ingestion_discover",
        description: "List local session files that can be imported into Chronicle.",
        inputSchema: agentInput,
        handler: (raw) => {
            const input = agentInput.parse(raw ?? {});
            return {
                sessions: discoverSessionCandidates({
                    ...(input.agent !== undefined ? { agent: input.agent } : {}),
                    repoRoot: process.cwd(),
                }),
            };
        },
    },
    {
        name: "ingestion_backfeed",
        description: "Generate draft backfeed proposals from discovered session openings.",
        inputSchema: agentInput,
        handler: (raw) => {
            const input = agentInput.parse(raw ?? {});
            return generateBackfeed({
                ...(input.agent !== undefined ? { agent: input.agent } : {}),
                repoRoot: process.cwd(),
            });
        },
    },
    {
        name: "ingestion_import_discovered",
        description: "Import discovered local agent session files into Chronicle.",
        inputSchema: agentInput.extend({
            limit: z.number().int().min(1).max(500).optional(),
        }),
        handler: (raw) => {
            const input = agentInput.extend({
                limit: z.number().int().min(1).max(500).optional(),
            }).parse(raw ?? {});
            return importDiscoveredSessions({
                ...(input.agent !== undefined ? { agent: input.agent } : {}),
                ...(input.limit !== undefined ? { limit: input.limit } : {}),
                repoRoot: process.cwd(),
            });
        },
    },
    {
        name: "ingestion_status",
        description: "Read ingestion coverage status and most recent imported session.",
        inputSchema: z.object({}),
        handler: () => getIngestionStatus(process.cwd()),
    },
];
export function registerIngestionMcpTools() {
    return ingestionMcpTools;
}
//# sourceMappingURL=mcp-tools.js.map