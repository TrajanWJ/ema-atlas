/**
 * MCP tool registrations for the Spaces subservice.
 *
 * Mirrors `blueprint/mcp-tools.ts`: exports a `SpacesMcpTool` interface, a
 * `spacesMcpTools` array, and a `registerSpacesMcpTools` placeholder so the
 * caller has a single import whether or not the host registry is wired yet.
 *
 * Tools:
 *   - spaces_list
 *   - spaces_show
 *   - spaces_create
 *   - spaces_archive
 *   - spaces_add_member
 *   - spaces_remove_member
 */
import { z } from "zod";
export interface SpacesMcpTool {
    name: string;
    description: string;
    inputSchema: z.ZodTypeAny;
    handler: (input: unknown) => Promise<unknown> | unknown;
}
export declare const spacesMcpTools: readonly SpacesMcpTool[];
export declare function registerSpacesMcpTools(): readonly SpacesMcpTool[];
//# sourceMappingURL=mcp-tools.d.ts.map