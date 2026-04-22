import { z } from 'zod';

export const ComponentRegistryEntrySchema = z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(['gui', 'terminal']),
    propsSchema: z.string(),
    capabilities: z.array(z.enum(['pure-view', 'interactive', 'data-fetching'])),
});

export const RegistryIndexSchema = z.object({
    components: z.array(ComponentRegistryEntrySchema),
    version: z.string(),
});

export type ComponentRegistryEntry = z.infer<typeof ComponentRegistryEntrySchema>;

// Example
export const exampleRegistryEntry: ComponentRegistryEntry = {
    id: 'Terminal.ChoiceList',
    title: 'Choice List',
    type: 'terminal',
    propsSchema: '{ "options": "string[]" }',
    capabilities: ['interactive']
};
