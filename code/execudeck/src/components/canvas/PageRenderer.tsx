'use client';

import type { PageManifest } from '@contracts/manifests';

interface PageRendererProps {
  manifest: PageManifest | null;
}

export function PageRenderer({ manifest }: PageRendererProps) {
  if (!manifest) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Select a page from the tree to view its content.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {manifest.title}
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          v{manifest.version} / {manifest.layout}
        </span>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <RenderNode node={manifest.root} />
      </div>
    </div>
  );
}

function RenderNode({ node }: { node: { id: string; componentId: string; props: Record<string, unknown>; children?: unknown[] } }) {
  switch (node.componentId) {
    case 'text-element':
      return (
        <p className="text-sm text-foreground/80">
          {String(node.props.content ?? '')}
        </p>
      );

    case 'card':
      return (
        <div className="rounded border border-border bg-muted/20 p-3">
          <h3 className="text-sm font-medium mb-2">
            {String(node.props.title ?? 'Card')}
          </h3>
          {node.children?.map((child: unknown, i: number) => (
            <RenderNode key={i} node={child as typeof node} />
          ))}
        </div>
      );

    default:
      return (
        <div className="rounded border border-dashed border-border p-3 text-xs text-muted-foreground">
          Component: {node.componentId}
          <pre className="mt-1 text-[10px]">
            {JSON.stringify(node.props, null, 2)}
          </pre>
        </div>
      );
  }
}
