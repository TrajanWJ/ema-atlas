import { z } from 'zod';

export const UIActionTypeSchema = z.enum([
    'OPEN_TAB',
    'SWITCH_MODE',
    'TERMINAL_UI_INTERACTION', // New: for interactive terminal blocks
    'PROPOSE_PAGE',
    'ACCEPT_PROPOSAL',
]);

export const UIActionEventSchema = z.object({
    type: UIActionTypeSchema,
    payload: z.record(z.unknown()),
    timestamp: z.number(),
});

export const DomainEventTypeSchema = z.enum([
    'AGENT_DELEGATED',
    'PROPOSAL_EMITTED',
    'STATE_SNAPSHOT_CREATED'
]);

export type UIActionEvent = z.infer<typeof UIActionEventSchema>;

// Example interaction
export const exampleInteraction: UIActionEvent = {
    type: 'TERMINAL_UI_INTERACTION',
    payload: {
        blockId: 'block-choice-1',
        value: 'Yes'
    },
    timestamp: Date.now()
};
