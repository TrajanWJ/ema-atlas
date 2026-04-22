import { describe, it, expect } from 'vitest';
import { PageManifestSchema } from '../manifests';
import { SessionMessageSchema, exampleDelegationMessage } from '../messages';
import { TabSchema } from '../tabs';

describe('ExecuDeck Contracts', () => {
    it('should validate an example session message', () => {
        const result = SessionMessageSchema.safeParse(exampleDelegationMessage);
        expect(result.success).toBe(true);
    });

    it('should validate a page manifest', () => {
        const manifest = {
            id: 'page-1',
            version: 1,
            title: 'Test Page',
            layout: 'single-column',
            root: {
                id: 'root',
                componentId: 'text-element',
                props: { content: 'Hello' },
            },
        };
        const result = PageManifestSchema.safeParse(manifest);
        expect(result.success).toBe(true);
    });

    it('should validate a tab', () => {
        const tab = {
            id: 'tab-1',
            kind: 'session',
            title: 'Test Tab',
            revision: 0,
        };
        const result = TabSchema.safeParse(tab);
        expect(result.success).toBe(true);
    });
});
