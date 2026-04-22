import { z } from 'zod';

export const ProposalKindSchema = z.enum([
    'manifest-update',
    'tab-create',
    'nav-change',
    'terminal-ui-template'
]);

export const ProposalEnvelopeSchema = z.object({
    id: z.string(),
    originAgentId: z.string(),
    timestamp: z.number(),
    kind: ProposalKindSchema,
    status: z.enum(['pending', 'accepted', 'rejected']),
    reasoning: z.string(),
    payload: z.unknown(),
    lineage: z.array(z.string()),
});

export type ProposalEnvelope = z.infer<typeof ProposalEnvelopeSchema>;

// Example
export const exampleTerminalTemplate: ProposalEnvelope = {
    id: 'prop-template-1',
    originAgentId: 'agent-md',
    timestamp: Date.now(),
    kind: 'terminal-ui-template',
    status: 'pending',
    reasoning: 'Standardizing the inventory status card.',
    payload: {
        templateId: 'Inventory.StatusCard',
        manifest: { componentId: 'Terminal.Card', props: {} }
    },
    lineage: []
};
