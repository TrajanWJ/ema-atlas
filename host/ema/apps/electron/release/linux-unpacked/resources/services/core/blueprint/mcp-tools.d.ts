/**
 * MCP tool registrations for the Blueprint subservice.
 *
 * Per DEC-004 §6. No existing MCP tool registry lives in
 * `services/` yet, so this file exports:
 *
 *   1. A `BlueprintMcpTool` interface — the shape the registry will consume
 *      when it lands (mirrors Anthropic's MCP SDK tool definition).
 *   2. A `blueprintMcpTools` array of tool definitions with JSONSchema inputs
 *      and handler functions.
 *   3. A `registerBlueprintMcpTools` placeholder so the caller has a single
 *      import whether or not the host registry is wired up yet.
 *
 * When the MCP host lands, the placeholder is replaced by a real call into
 * whatever `Ema.MCP` registry interface is settled — consumers won't have to
 * change their imports.
 */
import { z } from "zod";
export interface BlueprintMcpTool {
    name: string;
    description: string;
    inputSchema: z.ZodTypeAny;
    handler: (input: unknown) => Promise<unknown> | unknown;
}
export declare const blueprintMcpTools: readonly BlueprintMcpTool[];
/**
 * Placeholder registration hook. When the host MCP registry lands, this
 * function will call into it. For now it returns the tool array so callers
 * can wire it up manually.
 */
export declare function registerBlueprintMcpTools(): readonly BlueprintMcpTool[];
//# sourceMappingURL=mcp-tools.d.ts.map