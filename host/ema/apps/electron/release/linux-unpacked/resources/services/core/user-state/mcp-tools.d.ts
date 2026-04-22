/**
 * MCP tool registrations for the UserState subservice.
 *
 * Mirrors `services/core/blueprint/mcp-tools.ts`: exports a tool array and a
 * placeholder `register*McpTools` hook. When the host MCP registry lands, the
 * placeholder is swapped for a real registration call and consumers don't
 * have to change imports.
 *
 * Tools:
 *   - user_state_current  — read the singleton snapshot
 *   - user_state_update   — self/agent mutation
 *   - user_state_signal   — submit a heuristic signal
 *   - user_state_history  — ring-buffer read
 */
import { z } from "zod";
export interface UserStateMcpTool {
    name: string;
    description: string;
    inputSchema: z.ZodTypeAny;
    handler: (input: unknown) => Promise<unknown> | unknown;
}
export declare const userStateMcpTools: readonly UserStateMcpTool[];
/**
 * Placeholder registration hook. When the host MCP registry lands, this
 * function will call into it. For now it returns the tool array so callers
 * can wire it up manually.
 */
export declare function registerUserStateMcpTools(): readonly UserStateMcpTool[];
//# sourceMappingURL=mcp-tools.d.ts.map