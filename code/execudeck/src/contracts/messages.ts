import { z } from 'zod';

// Grammar Prefixes: '>', '@', '#', '!'
export const MessageTokenSchema = z.enum(['>', '@', '#', '!']);

export const OutputBlockSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('narrative'),
        content: z.string(), // Prefix: >
    }),
    z.object({
        type: z.literal('delegation'),
        targetAgentId: z.string(),
        targetAgentName: z.string(),
        label: z.string(), // Prefix: @
    }),
    z.object({
        type: z.literal('status'),
        content: z.string(), // Prefix: #
    }),
    z.object({
        type: z.literal('hint'),
        content: z.string(), // Prefix: !
    }),
    z.object({
        type: z.literal('structured'), // Generative UI block
        manifest: z.record(z.unknown()),
    }),
    z.object({
        type: z.literal('reference'), // Clickable ID (e.g. A1, B2)
        id: z.string(),
        kind: z.enum(['tab', 'page', 'agent']),
        label: z.string(),
    })
]);

export const SessionMessageSchema = z.object({
    id: z.string(),
    timestamp: z.number(),
    sender: z.string(), // e.g., "Executive Management"
    token: MessageTokenSchema.optional(),
    blocks: z.array(OutputBlockSchema),
});

export type SessionMessage = z.infer<typeof SessionMessageSchema>;

// Example: Delegation Case
export const exampleDelegationMessage: SessionMessage = {
    id: 'msg-501',
    timestamp: Date.now(),
    sender: 'Executive Management',
    token: '>',
    blocks: [
        { type: 'narrative', content: 'I’m delegating this to Meta-Development.' },
        { type: 'delegation', targetAgentId: 'agent-md', targetAgentName: 'Meta-Development', label: 'Open Tab' }
    ]
};
