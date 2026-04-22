'use client';

import { useState } from 'react';
import { ChevronRight, FileText, Folder, Settings } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useManifestStore } from '@/src/state/manifest-store';
import type { NavNode } from '@contracts/manifests';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  system: <Settings className="h-3.5 w-3.5 text-muted-foreground" />,
  'page-group': <Folder className="h-3.5 w-3.5 text-muted-foreground" />,
  page: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
};

interface TreeNodeProps {
  node: NavNode;
  depth: number;
}

function TreeNode({ node, depth }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const { selectedPageId, selectPage } = useManifestStore();
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedPageId === node.id;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          selectPage(node.id);
        }}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-xs transition-colors',
          isSelected
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn(
              'h-3 w-3 shrink-0 transition-transform',
              expanded && 'rotate-90'
            )}
          />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {TYPE_ICONS[node.type]}
        <span className="truncate">{node.label}</span>
        {node.referenceId && (
          <span className="ml-auto text-[10px] text-terminal-accent font-mono">
            {node.referenceId}
          </span>
        )}
      </button>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child: NavNode) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PageTree() {
  const navTree = useManifestStore((s) => s.navTree);

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Pages
      </div>
      <div className="flex-1 overflow-y-auto px-1 pb-2">
        {navTree.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}
