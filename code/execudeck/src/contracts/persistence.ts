import { z } from 'zod';
import { TabSchema } from './tabs';
import { SessionMessageSchema } from './messages';
import { PageManifestSchema } from './manifests';

export const LocalStateSnapshotSchema = z.object({
    version: z.number(),
    timestamp: z.number(),
    tabs: z.array(TabSchema),
    messageHistory: z.record(z.array(SessionMessageSchema)), // tabId -> messages
    manifests: z.array(PageManifestSchema),
    activeTabId: z.string().optional(),
    currentMode: z.enum(['terminal', 'gui', 'split']),
    nextTabNumber: z.number().optional(),
});

export type LocalStateSnapshot = z.infer<typeof LocalStateSnapshotSchema>;

// Example
export const exampleSnapshot: LocalStateSnapshot = {
    version: 1,
    timestamp: Date.now(),
    tabs: [],
    messageHistory: {},
    manifests: [],
    currentMode: 'terminal'
};
