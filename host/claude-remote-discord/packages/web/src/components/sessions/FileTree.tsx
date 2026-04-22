"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

interface FileNode {
  name: string;
  type: "dir" | "file";
  children?: FileNode[];
}

interface FileViewerState {
  path: string;
  content: string;
}

export function FileTree({ sessionId }: { sessionId: string }) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [fileViewer, setFileViewer] = useState<FileViewerState | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const fetchTree = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .getFileTree(sessionId)
      .then(setTree)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load files"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const toggleDir = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const openFile = useCallback(
    async (filePath: string) => {
      setFileLoading(true);
      try {
        const result = await api.getFileContent(sessionId, filePath);
        setFileViewer({ path: result.path, content: result.content });
      } catch {
        setFileViewer({ path: filePath, content: "Failed to load file." });
      } finally {
        setFileLoading(false);
      }
    },
    [sessionId],
  );

  if (loading) {
    return (
      <div className="p-4 text-sm text-text-muted animate-pulse">
        Loading file tree...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-error mb-2">{error}</p>
        <button
          onClick={fetchTree}
          className="text-xs text-primary hover:text-primary-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        <div className="text-xs font-medium text-text-muted uppercase tracking-wider px-2 py-1 mb-1">
          Files
        </div>
        {tree.map((node) => (
          <TreeNode
            key={node.name}
            node={node}
            path={node.name}
            depth={0}
            expanded={expanded}
            onToggle={toggleDir}
            onOpenFile={openFile}
          />
        ))}
        {tree.length === 0 && (
          <div className="px-2 py-4 text-xs text-text-muted text-center">
            No files found
          </div>
        )}
      </div>

      {/* File viewer */}
      {fileViewer && (
        <div className="border-t border-border flex flex-col max-h-[50%] min-h-[200px]">
          <div className="flex items-center justify-between px-3 py-1.5 bg-surface-elevated border-b border-border shrink-0">
            <span className="text-xs font-mono text-text-secondary truncate">
              {fileViewer.path}
            </span>
            <button
              onClick={() => setFileViewer(null)}
              aria-label="Close file viewer"
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {fileLoading ? (
              <div className="text-xs text-text-muted animate-pulse">
                Loading...
              </div>
            ) : (
              <pre className="text-xs font-mono text-text-primary whitespace-pre-wrap break-words">
                {fileViewer.content}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TreeNode({
  node,
  path,
  depth,
  expanded,
  onToggle,
  onOpenFile,
}: {
  node: FileNode;
  path: string;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onOpenFile: (path: string) => void;
}) {
  const isDir = node.type === "dir";
  const isExpanded = expanded.has(path);

  return (
    <div>
      <button
        onClick={() => (isDir ? onToggle(path) : onOpenFile(path))}
        className="flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded hover:bg-primary/5 text-text-secondary hover:text-text-primary transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir ? (
          <>
            {isExpanded ? (
              <ChevronDown size={12} className="shrink-0" />
            ) : (
              <ChevronRight size={12} className="shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen size={14} className="shrink-0 text-accent-warm" />
            ) : (
              <Folder size={14} className="shrink-0 text-accent-warm" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <FileCode size={14} className="shrink-0 text-info" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {isDir && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              path={`${path}/${child.name}`}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onOpenFile={onOpenFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
