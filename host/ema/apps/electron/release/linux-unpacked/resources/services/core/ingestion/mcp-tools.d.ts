import { z } from "zod";
export interface IngestionMcpTool {
    name: string;
    description: string;
    inputSchema: z.ZodTypeAny;
    handler: (input: unknown) => Promise<unknown> | unknown;
}
export declare const ingestionMcpTools: readonly IngestionMcpTool[];
export declare function registerIngestionMcpTools(): readonly IngestionMcpTool[];
//# sourceMappingURL=mcp-tools.d.ts.map