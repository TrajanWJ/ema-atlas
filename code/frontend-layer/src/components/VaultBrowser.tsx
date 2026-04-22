"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { VaultFile } from "@/lib/types";
import { renderMarkdownWithFrontmatter } from "@/lib/markdown";

function FileIcon({ type, name }: { type: string; name: string }) {
  if (type === "directory") return <span className="text-xs">📁</span>;
  if (name.endsWith(".md")) return <span className="text-xs">📝</span>;
  if (name.endsWith(".json") || name.endsWith(".yaml") || name.endsWith(".yml")) return <span className="text-xs">🔧</span>;
  if (name.endsWith(".sh")) return <span className="text-xs">⚙️</span>;
  return <span className="text-xs">📄</span>;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

function TreeNode({ node, depth, selectedPath, onSelect }: {
  node: VaultFile;
  depth: number;
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.type === "directory";
  const isSelected = node.path === selectedPath;

  return (
    <div>
      <button
        onClick={() => {
          if (isDir) setExpanded(!expanded);
          else onSelect(node.path);
        }}
        className="w-full text-left flex items-center gap-1.5 py-1 px-2 rounded text-xs transition-all duration-200 cursor-pointer hover:bg-[var(--color-surface-elevated)]"
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          background: isSelected ? "var(--color-surface-elevated)" : "transparent",
          color: isSelected ? "var(--color-accent)" : "var(--color-text-secondary)",
        }}
      >
        {isDir && (
          <span className="text-[10px] w-3 text-center" style={{ color: "var(--color-text-secondary)" }}>
            {expanded ? "▼" : "▶"}
          </span>
        )}
        {!isDir && <span className="w-3" />}
        <FileIcon type={node.type} name={node.name} />
        <span className="truncate flex-1" title={node.name}>{node.name}</span>
        {!isDir && node.size !== undefined && (
          <span className="text-[10px] shrink-0" style={{ color: "var(--color-text-secondary)" }}>{formatSize(node.size)}</span>
        )}
      </button>
      {isDir && expanded && node.children?.map((child) => (
        <TreeNode key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
      ))}
    </div>
  );
}

// Exposed props for command palette integration
export interface VaultBrowserHandle {
  search: (query: string) => void;
  openFile: (path: string) => void;
}

interface VaultBrowserProps {
  externalAction?: { type: "search"; query: string } | { type: "open"; path: string } | null;
  onTreeLoaded?: (tree: VaultFile[]) => void;
}

export default function VaultBrowser({ externalAction, onTreeLoaded }: VaultBrowserProps) {
  const [tree, setTree] = useState<VaultFile[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileMetadata, setFileMetadata] = useState<{ modified?: string; size?: number }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ path: string; line: string; lineNumber: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [treeKey, setTreeKey] = useState(0);
  const [mobileView, setMobileView] = useState<"tree" | "preview">("tree");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTree() {
      try {
        const res = await fetch("/api/vault/tree");
        if (res.ok) {
          const data = await res.json();
          const loadedTree = data.tree || [];
          setTree(loadedTree);
          onTreeLoaded?.(loadedTree);
        }
      } catch {
        // silent
      } finally {
        setLoadingTree(false);
      }
    }
    fetchTree();
  }, [onTreeLoaded]);

  const selectFile = useCallback(async (path: string) => {
    setSelectedPath(path);
    setLoadingFile(true);
    setSearchResults([]);
    setMobileView("preview");
    try {
      const res = await fetch(`/api/vault/file?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content || "");
        setFileMetadata({ modified: data.modified, size: data.size });
      }
    } catch {
      setFileContent("Failed to load file.");
    } finally {
      setLoadingFile(false);
    }
  }, []);

  const handleSearch = useCallback(async (q?: string) => {
    const query = q || searchQuery;
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setFileContent("");
    setSelectedPath("");
    try {
      const res = await fetch(`/api/vault/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Handle external actions from command palette
  useEffect(() => {
    if (!externalAction) return;
    if (externalAction.type === "search") {
      setSearchQuery(externalAction.query);
      handleSearch(externalAction.query);
    } else if (externalAction.type === "open") {
      selectFile(externalAction.path);
    }
  }, [externalAction, handleSearch, selectFile]);

  // Focus search input when requested
  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  // Expose focusSearch via a data attribute on root
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (rootRef.current) {
      (rootRef.current as HTMLDivElement & { focusSearch?: () => void }).focusSearch = focusSearch;
    }
  }, [focusSearch]);

  const hasContent = fileContent || searchResults.length > 0;

  return (
    <div ref={rootRef} className="flex-1 flex flex-col min-h-0 tab-content" id="vault-browser">
      {/* Search bar */}
      <div className="p-2 md:p-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex gap-2">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search vault... ( / )"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none transition-colors"
            style={{
              background: "var(--color-surface-elevated)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          />
          <button
            onClick={() => handleSearch()}
            disabled={searching}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
          >
            {searching ? "..." : "Search"}
          </button>
          <button
            onClick={() => setTreeKey((k) => k + 1)}
            className="hidden md:block px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
            style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
            title="Collapse All"
          >
            ↕
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* File tree — hidden on mobile when viewing file */}
        <div className={`${mobileView === "preview" && hasContent ? "hidden md:block" : ""} w-full md:w-64 shrink-0 overflow-y-auto border-r py-2`} style={{ borderColor: "var(--color-border)" }}>
          {loadingTree ? (
            <p className="text-xs px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>Loading vault...</p>
          ) : tree.length === 0 ? (
            <p className="text-xs px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>No files found</p>
          ) : (
            tree.map((node) => (
              <TreeNode key={`${treeKey}-${node.path}`} node={node} depth={0} selectedPath={selectedPath} onSelect={selectFile} />
            ))
          )}
        </div>

        {/* Content panel — full-width on mobile */}
        <div className={`${mobileView === "tree" && !hasContent ? "hidden md:block" : ""} flex-1 overflow-y-auto p-3 md:p-4`}>
          {/* Mobile back button */}
          {mobileView === "preview" && hasContent && (
            <button
              onClick={() => { setMobileView("tree"); setFileContent(""); setSearchResults([]); setSelectedPath(""); }}
              className="md:hidden flex items-center gap-1 mb-3 text-xs cursor-pointer transition-colors"
              style={{ color: "var(--color-accent)" }}
            >
              ← Back to files
            </button>
          )}

          {searchResults.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-secondary)" }}>
                Search Results ({searchResults.length})
              </h3>
              <div className="space-y-1">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => selectFile(result.path)}
                    className="w-full text-left p-2 rounded-lg transition-all duration-200 cursor-pointer glass-card"
                  >
                    <div className="text-xs font-mono truncate" style={{ color: "var(--color-accent)" }}>{result.path}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-secondary)" }}>
                      <span className="font-mono">:{result.lineNumber}</span> {result.line}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : loadingFile ? (
            <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
          ) : fileContent ? (
            <div>
              {/* Breadcrumb path */}
              <div className="flex items-center gap-1 mb-2 flex-wrap">
                {selectedPath.split("/").map((segment, i, arr) => (
                  <span key={i} className="text-xs" style={{ color: i === arr.length - 1 ? "var(--color-accent)" : "var(--color-text-secondary)" }}>
                    {i > 0 && <span className="mx-1" style={{ color: "var(--color-border)" }}>/</span>}
                    {segment}
                  </span>
                ))}
              </div>
              {/* File metadata bar */}
              <div className="flex items-center gap-3 mb-3 pb-2 border-t pt-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex-1" />
                {fileMetadata.size !== undefined && (
                  <span className="text-[10px]" style={{ color: "var(--color-text-secondary)", opacity: 0.7 }}>{formatSize(fileMetadata.size)}</span>
                )}
                {fileMetadata.modified && (
                  <span className="text-[10px]" style={{ color: "var(--color-text-secondary)", opacity: 0.7 }}>
                    {new Date(fileMetadata.modified).toLocaleDateString()}
                  </span>
                )}
              </div>
              {/* Render markdown or raw text */}
              {selectedPath.endsWith(".md") ? (
                <div
                  className="markdown-content text-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownWithFrontmatter(fileContent) }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.classList.contains("wiki-link")) {
                      e.preventDefault();
                      const wikiTarget = target.getAttribute("data-wiki");
                      if (wikiTarget) {
                        const findPath = (nodes: VaultFile[], name: string): string | null => {
                          for (const n of nodes) {
                            if (n.type === "file" && n.name.replace(/\.md$/, "").toLowerCase() === name.toLowerCase()) return n.path;
                            if (n.children) { const found = findPath(n.children, name); if (found) return found; }
                          }
                          return null;
                        };
                        const found = findPath(tree, wikiTarget);
                        if (found) selectFile(found);
                      }
                    }
                  }}
                />
              ) : (
                <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: "var(--color-text-primary)" }}>{fileContent}</pre>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-3">📚</div>
                <p style={{ color: "var(--color-text-secondary)" }}>Select a file or search the vault</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
