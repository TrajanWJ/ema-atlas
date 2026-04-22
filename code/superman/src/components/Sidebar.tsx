'use client';

import { useEditorStore } from '@/store/editor-store';
import { useRef, useEffect, useState, useCallback } from 'react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  language?: string;
}

// ---------------------------------------------------------------------------
// Icon helpers (inline SVGs, no external deps)
// ---------------------------------------------------------------------------

function ChevronIcon({ expanded, className = '' }: { expanded: boolean; className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`transition-transform duration-150 ${expanded ? 'rotate-90' : 'rotate-0'} ${className}`}
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <path
          d="M1.5 3.5A1 1 0 012.5 2.5h3.29a1 1 0 01.7.29L7.71 4H13.5a1 1 0 011 1v1H3.5L2 12.5h10.5l1.5-6H3.5"
          stroke="#e8a64a"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="rgba(232,166,74,0.12)"
        />
        <path
          d="M2 12.5V3.5a1 1 0 011-1h2.79a1 1 0 01.7.29L7.71 4H13.5a1 1 0 011 1v1"
          stroke="#e8a64a"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path
        d="M2 13V3.5a1 1 0 011-1h2.79a1 1 0 01.7.29L7.71 4H13a1 1 0 011 1v7a1 1 0 01-1 1H2z"
        stroke="#e8a64a"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(232,166,74,0.08)"
      />
    </svg>
  );
}

function getFileIconColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return '#3b82f6';
    case 'js':
    case 'jsx':
      return '#eab308';
    case 'json':
      return '#22c55e';
    case 'md':
      return '#5c6078';
    default:
      return '#5c6078';
  }
}

function getFileIconShape(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  const color = getFileIconColor(name);

  // TypeScript files: TS badge style
  if (ext === 'ts' || ext === 'tsx') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <rect x="1" y="2" width="14" height="12" rx="2" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="0.8" />
        <text x="8" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill={color} fontFamily="sans-serif">
          TS
        </text>
      </svg>
    );
  }

  // JavaScript files: JS badge style
  if (ext === 'js' || ext === 'jsx') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <rect x="1" y="2" width="14" height="12" rx="2" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="0.8" />
        <text x="8" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill={color} fontFamily="sans-serif">
          JS
        </text>
      </svg>
    );
  }

  // JSON files: curly braces icon
  if (ext === 'json') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <rect x="1" y="2" width="14" height="12" rx="2" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="0.8" />
        <text x="8" y="11.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill={color} fontFamily="monospace">
          {'{}'}
        </text>
      </svg>
    );
  }

  // Markdown files
  if (ext === 'md') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <rect x="1" y="2" width="14" height="12" rx="2" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="0.8" />
        <text x="8" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill={color} fontFamily="sans-serif">
          M
        </text>
      </svg>
    );
  }

  // Default: generic file icon
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path
        d="M4 2h5.5L13 5.5V13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"
        stroke={color}
        strokeWidth="1"
        fill={color}
        fillOpacity="0.06"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.5 2v3.5H13" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Recursive FileTreeItem
// ---------------------------------------------------------------------------

function FileTreeItem({ node, depth }: { node: FileNode; depth: number }) {
  const { expandedDirs, toggleDir, activeFilePath, openFile } = useEditorStore();
  const isDirectory = node.type === 'directory';
  const isExpanded = expandedDirs.has(node.path);
  const isActive = !isDirectory && activeFilePath === node.path;
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation on mount
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClick = useCallback(() => {
    if (isDirectory) {
      toggleDir(node.path);
    } else {
      openFile(node.path, node.name, node.language ?? 'plaintext');
    }
  }, [isDirectory, node.path, node.name, node.language, toggleDir, openFile]);

  const paddingLeft = 12 + depth * 16;

  const sortedChildren = isDirectory && node.children
    ? [...node.children].sort((a, b) => {
        // Directories first, then files; alphabetical within each group
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
    : [];

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: mounted ? 1 : 0 }}
    >
      {/* Row */}
      <button
        onClick={handleClick}
        className={`
          group flex w-full items-center gap-1.5 py-[3px] pr-3 text-left
          text-[13px] font-mono transition-all duration-150 cursor-pointer
          ${isActive
            ? 'bg-[#2a2e42] border-l-2 border-l-[#6366f1] text-[#e1e4ed]'
            : 'border-l-2 border-l-transparent text-[#e1e4ed] hover:bg-[#232738]'
          }
        `}
        style={{ paddingLeft: `${paddingLeft}px` }}
        title={node.path}
      >
        {/* Chevron for directories, spacer for files */}
        {isDirectory ? (
          <span className="flex shrink-0 items-center justify-center w-4 h-4 text-[#5c6078]">
            <ChevronIcon expanded={isExpanded} />
          </span>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Icon */}
        <span className="flex shrink-0 items-center justify-center">
          {isDirectory ? <FolderIcon open={isExpanded} /> : getFileIconShape(node.name)}
        </span>

        {/* Name */}
        <span className="truncate select-none">
          {node.name}
        </span>
      </button>

      {/* Children (animated expand/collapse via CSS grid trick) */}
      {isDirectory && (
        <div
          ref={contentRef}
          className="grid transition-[grid-template-rows] duration-200 ease-in-out"
          style={{
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
          }}
        >
          <div className="overflow-hidden">
            {sortedChildren.map((child) => (
              <FileTreeItem key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Count all file nodes recursively
// ---------------------------------------------------------------------------

function countFiles(nodes: FileNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'file') {
      count++;
    }
    if (node.children) {
      count += countFiles(node.children);
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export default function Sidebar() {
  const { files, sidebarOpen, toggleSidebar, projectPath } = useEditorStore();

  if (!sidebarOpen) return null;

  const fileCount = countFiles(files);

  // Sort root nodes: directories first, then alphabetical
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex h-full flex-col bg-[#161922] border-r border-[#2a2d3e] select-none">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5c6078]">
          Explorer
        </span>
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center rounded p-1 text-[#5c6078] transition-colors duration-150 hover:bg-[#232738] hover:text-[#8b8fa7] cursor-pointer"
          aria-label="Collapse sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin pb-2">
        {sortedFiles.map((node) => (
          <FileTreeItem key={node.path} node={node} depth={0} />
        ))}

        {sortedFiles.length === 0 && (
          <div className="px-4 py-8 text-center text-[12px] text-[#5c6078]">
            {projectPath === null
              ? 'No project loaded'
              : 'Indexing...'}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="shrink-0 border-t border-[#2a2d3e] px-4 py-2">
        <span className="text-[11px] text-[#5c6078]">
          {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </span>
      </div>
    </div>
  );
}
