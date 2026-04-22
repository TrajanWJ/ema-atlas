/**
 * MCP tool registrations for the Pipes subservice.
 *
 * Mirrors the blueprint pattern: a placeholder array + factory until the
 * MCP host registry lands. Tool names use `pipes_<verb>` snake-case to
 * match `gac_<verb>`.
 */
import { z } from "zod";
export interface PipesMcpTool {
    name: string;
    description: string;
    inputSchema: z.ZodTypeAny;
    handler: (input: unknown) => Promise<unknown> | unknown;
}
export declare const pipesMcpTools: readonly PipesMcpTool[];
export declare function registerPipesMcpTools(): readonly PipesMcpTool[];
//# sourceMappingURL=mcp-tools.d.ts.map