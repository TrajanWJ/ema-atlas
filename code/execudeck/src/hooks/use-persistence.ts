'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWorkspaceStore } from '@/src/state/workspace-store';
import { useMessageStore } from '@/src/state/message-store';
import { useManifestStore } from '@/src/state/manifest-store';
import { saveSnapshot, loadSnapshot } from '@/src/lib/persistence';
import {
  INITIAL_TABS,
  INITIAL_MANIFESTS,
  INITIAL_NAV_TREE,
  INITIAL_ACTIVE_TAB_ID,
  WELCOME_MESSAGE,
} from '@/src/lib/initial-state';
import type { LocalStateSnapshot } from '@contracts/persistence';

const DEBOUNCE_MS = 1000;

export function usePersistence() {
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const workspace = useWorkspaceStore();
  const messageStore = useMessageStore();
  const manifestStore = useManifestStore();

  // Load from IndexedDB on mount
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    loadSnapshot().then((snapshot) => {
      if (snapshot && snapshot.tabs.length > 0) {
        workspace.setTabs(snapshot.tabs);
        workspace.setActiveTabId(snapshot.activeTabId ?? null);
        workspace.setMode(snapshot.currentMode);
        if (snapshot.nextTabNumber != null) {
          workspace.setNextTabNumber(snapshot.nextTabNumber);
        }
        messageStore.setMessages(snapshot.messageHistory);
        manifestStore.setManifests(snapshot.manifests);
        manifestStore.setNavTree(INITIAL_NAV_TREE);
      } else {
        // First load — bootstrap
        workspace.setTabs(INITIAL_TABS);
        workspace.setActiveTabId(INITIAL_ACTIVE_TAB_ID);
        workspace.setMode('split');
        manifestStore.setManifests(INITIAL_MANIFESTS);
        manifestStore.setNavTree(INITIAL_NAV_TREE);
        messageStore.setMessages({});
        messageStore.addMessage('tab-em', WELCOME_MESSAGE);
      }
    });
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-save
  const debouncedSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const snapshot: LocalStateSnapshot = {
        version: 1,
        timestamp: Date.now(),
        tabs: useWorkspaceStore.getState().tabs,
        messageHistory: useMessageStore.getState().messages,
        manifests: useManifestStore.getState().manifests,
        activeTabId: useWorkspaceStore.getState().activeTabId ?? undefined,
        currentMode: useWorkspaceStore.getState().mode,
        nextTabNumber: useWorkspaceStore.getState().nextTabNumber,
      };
      saveSnapshot(snapshot);
    }, DEBOUNCE_MS);
  }, []);

  // Subscribe to store changes for auto-save
  useEffect(() => {
    const unsubs = [
      useWorkspaceStore.subscribe(debouncedSave),
      useMessageStore.subscribe(debouncedSave),
      useManifestStore.subscribe(debouncedSave),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [debouncedSave]);
}
