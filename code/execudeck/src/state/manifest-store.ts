'use client';

import { create } from 'zustand';
import type { PageManifest, NavNode } from '@contracts/manifests';

interface ManifestState {
  manifests: PageManifest[];
  navTree: NavNode[];
  selectedPageId: string | null;

  addManifest: (manifest: PageManifest) => void;
  updateManifest: (id: string, updates: Partial<PageManifest>) => void;
  getManifest: (id: string) => PageManifest | undefined;
  setManifests: (manifests: PageManifest[]) => void;
  setNavTree: (tree: NavNode[]) => void;
  selectPage: (pageId: string | null) => void;
}

export const useManifestStore = create<ManifestState>((set, get) => ({
  manifests: [],
  navTree: [],
  selectedPageId: null,

  addManifest: (manifest) =>
    set((state) => ({
      manifests: [...state.manifests, manifest],
    })),

  updateManifest: (id, updates) =>
    set((state) => ({
      manifests: state.manifests.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  getManifest: (id) => get().manifests.find((m) => m.id === id),

  setManifests: (manifests) => set({ manifests }),

  setNavTree: (tree) => set({ navTree: tree }),

  selectPage: (pageId) => set({ selectedPageId: pageId }),
}));
