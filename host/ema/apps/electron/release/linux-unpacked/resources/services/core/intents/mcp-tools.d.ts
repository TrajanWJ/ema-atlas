/**
 * MCP tool registrations for the Intents subservice.
 *
 * Mirrors the pattern established by Blueprint: the host MCP registry does
 * not yet live in `services/`, so this file exports a tool-definition array
 * plus a placeholder `registerIntentsMcpTools` hook. When the host registry
 * lands, consumers swap the implementation without changing their imports.
 */
import { z } from "zod";
export interface IntentsMcpTool {
    name: string;
    description: string;
    inputSchema: z.ZodTypeAny;
    handler: (input: unknown) => Promise<unknown> | unknown;
}
export declare const intentsMcpTools: readonly IntentsMcpTool[];
/**
 * Placeholder registration hook. When the host MCP registry lands, this
 * function will call into it. For now it returns the tool array so callers
 * can wire it up manually.
 */
export declare function registerIntentsMcpTools(): readonly IntentsMcpTool[];
//# sourceMappingURL=mcp-tools.d.ts.map