import { z } from 'zod';

export const TabKindSchema = z.enum(['session', 'page', 'hybrid']);

export const TabSchema = z.object({
  id: z.string(),
  kind: TabKindSchema,
  title: z.string(),
  artifactId: z.string().optional(), // ID of the PageManifest or MessageStream
  linkedAgentId: z.string().optional(),
  revision: z.number().default(0),
});

export type Tab = z.infer<typeof TabSchema>;

// Example: Tab as a window into a page
export const examplePageTab: Tab = {
  id: 'tab-123',
  kind: 'page',
  title: 'Inventory Dashboard',
  artifactId: 'artifact-A1',
  revision: 0,
};
