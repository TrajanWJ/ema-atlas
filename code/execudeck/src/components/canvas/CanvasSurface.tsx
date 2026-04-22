'use client';

import { useManifestStore } from '@/src/state/manifest-store';
import { PageTree } from './PageTree';
import { PageRenderer } from './PageRenderer';
import { Inspector } from './Inspector';

export function CanvasSurface() {
  const { manifests, selectedPageId } = useManifestStore();

  const selectedManifest = selectedPageId
    ? manifests.find(
        (m) =>
          m.id === selectedPageId ||
          m.id === `page-${selectedPageId.replace('nav-', '')}`
      ) ?? null
    : null;

  return (
    <div className="flex h-full">
      <div className="w-48 shrink-0 border-r border-border overflow-hidden flex flex-col">
        <PageTree />
        <Inspector />
      </div>
      <div className="flex-1 overflow-auto bg-background">
        <PageRenderer manifest={selectedManifest} />
      </div>
    </div>
  );
}
