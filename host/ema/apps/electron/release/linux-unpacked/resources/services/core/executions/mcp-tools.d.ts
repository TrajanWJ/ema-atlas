/**
 * MCP tool registrations for the Executions subservice.
 *
 * Mirrors the placeholder pattern in `services/core/blueprint/mcp-tools.ts` —
 * exports a typed tool array that the host MCP registry will consume once
 * it lands. Until then `registerExecutionsMcpTools` returns the tool list
 * so callers can wire it up manually.
 *
 * Tools:
 *   - executions_list              — filterable list
 *   - executions_show              — single record + phase log + steps
 *   - executions_create            — create a new execution
 *   - executions_transition_phase  — append-only phase log entry
 *   - executions_append_step       — append a step-journal checkpoint
 *   - executions_reflexion         — get last N executions for an intent
 */
import { z } from "zod";
export interface ExecutionsMcpTool {
    name: string;
    description: string;
    inputSchema: z.ZodTypeAny;
    handler: (input: unknown) => Promise<unknown> | unknown;
}
export declare const executionsMcpTools: readonly ExecutionsMcpTool[];
export declare function registerExecutionsMcpTools(): readonly ExecutionsMcpTool[];
//# sourceMappingURL=mcp-tools.d.ts.map