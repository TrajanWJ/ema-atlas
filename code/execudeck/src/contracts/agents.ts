import { z } from 'zod';

export const AgentIdentitySchema = z.object({
    id: z.string(),
    name: z.string(),
    role: z.enum(['governor', 'architect', 'specialist']),
    scope: z.string(),
});

// Tool Definitions
export const QueryContextSchema = z.object({
    targetId: z.string(),
    scope: z.enum(['tab', 'page']),
    query: z.string().optional(),
});

export const ForkMissionSchema = z.object({
    agentIds: z.array(z.string()),
    taskDescription: z.string(),
});

export type QueryContext = z.infer<typeof QueryContextSchema>;

// Example
export const exampleQuery: QueryContext = {
    targetId: 'A1',
    scope: 'page',
    query: 'What is the current stock level of raw materials?'
};
