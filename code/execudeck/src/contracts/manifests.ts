import { z } from 'zod';

export const ComponentNodeSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        id: z.string(),
        componentId: z.string(),
        props: z.record(z.unknown()),
        children: z.array(ComponentNodeSchema).optional(),
    })
);

export const NavNodeSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(['system', 'page-group', 'page']),
        referenceId: z.string().optional(), // e.g., A1, B2
        children: z.array(NavNodeSchema).optional(),
    })
);

export const PageManifestSchema = z.object({
    id: z.string(),
    version: z.number(),
    title: z.string(),
    layout: z.enum(['single-column', 'grid', 'tabs']),
    root: ComponentNodeSchema,
});

export type PageManifest = z.infer<typeof PageManifestSchema>;
export type NavNode = z.infer<typeof NavNodeSchema>;

// Example: Initial System Tree
export const initialNavTree: NavNode[] = [
    {
        id: 'nav-system',
        label: 'System',
        type: 'system',
        children: [
            { id: 'nav-overview', label: 'Overview', type: 'page' },
            {
                id: 'nav-agents', label: 'Agents', type: 'page-group', children: [
                    { id: 'nav-em', label: 'Executive Management', type: 'page' },
                    { id: 'nav-md', label: 'Meta-Development', type: 'page' }
                ]
            },
            { id: 'nav-history', label: 'History', type: 'page' }
        ]
    },
    {
        id: 'nav-pages',
        label: 'Pages',
        type: 'page-group',
        children: [
            { id: 'nav-blank-a', label: 'Blank Page A', type: 'page', referenceId: 'A1' }
        ]
    }
];
