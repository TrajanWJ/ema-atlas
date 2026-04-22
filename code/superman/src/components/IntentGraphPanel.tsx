'use client';

import { useEffect, useState, useCallback } from 'react';
import { useEditorStore, type IntentNode } from '@/store/editor-store';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function GraphIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-accent"
    >
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 5.5L7 10.5M10.5 5.5L9 10.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function statusColor(status?: string): string {
  switch (status) {
    case 'complete': return '#34d399';
    case 'partial': return '#fbbf24';
    case 'planned':
    default: return '#f87171';
  }
}

const ZOOM_LABELS = ['Product', 'System', 'Feature', 'Impl', 'Code'];
const NODE_TYPES = ['product', 'system', 'feature', 'implementation', 'code'];

// ---------------------------------------------------------------------------
// Tree Node component
// ---------------------------------------------------------------------------

function IntentTreeNode({
  node,
  allNodes,
  selectedId,
  onSelect,
}: {
  node: IntentNode;
  allNodes: IntentNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const isSelected = node.id === selectedId;
  const childNodes = node.children
    .map((cid) => allNodes.find((n) => n.id === cid))
    .filter(Boolean) as IntentNode[];

  return (
    <div>
      <button
        onClick={() => onSelect(node.id)}
        className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-left transition-colors cursor-pointer ${
          isSelected ? 'bg-bg-active' : 'hover:bg-bg-hover'
        }`}
        style={{ paddingLeft: `${8 + node.level * 16}px` }}
      >
        {/* Status dot */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: statusColor(node.status) }}
        />
        {/* Title */}
        <span className="text-sm text-text-primary truncate flex-1">{node.title}</span>
        {/* Type badge */}
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-hover text-text-secondary shrink-0">
          {node.type}
        </span>
      </button>
      {childNodes.length > 0 && (
        <div>
          {childNodes.map((child) => (
            <IntentTreeNode
              key={child.id}
              node={child}
              allNodes={allNodes}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export default function IntentGraphPanel() {
  const {
    intentNodes,
    intentZoom,
    projectPath,
    toggleAiPanel,
    loadIntentGraph,
    setIntentZoom,
    updateIntentNode,
    executeIntentNode,
    addIntentNode,
    isChatLoading,
  } = useEditorStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<string>('planned');

  // Add child form
  const [showAddChild, setShowAddChild] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const [childType, setChildType] = useState('feature');

  const selectedNode = intentNodes.find((n) => n.id === selectedId) ?? null;

  // Load intent graph on mount and when project changes
  useEffect(() => {
    if (projectPath) {
      setIsLoading(true);
      loadIntentGraph().finally(() => setIsLoading(false));
    }
  }, [projectPath, loadIntentGraph]);

  // Sync edit form when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setEditTitle(selectedNode.title);
      setEditDescription(selectedNode.description ?? '');
      setEditStatus(selectedNode.status ?? 'planned');
      setShowAddChild(false);
      setChildTitle('');
      setChildType('feature');
    }
  }, [selectedNode]);

  const handleZoomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      setIntentZoom(val);
      setIsLoading(true);
      loadIntentGraph(val).finally(() => setIsLoading(false));
    },
    [setIntentZoom, loadIntentGraph],
  );

  const handleSave = useCallback(async () => {
    if (!selectedId) return;
    await updateIntentNode(selectedId, {
      title: editTitle,
      description: editDescription || undefined,
      status: editStatus as IntentNode['status'],
    });
  }, [selectedId, editTitle, editDescription, editStatus, updateIntentNode]);

  const handleExecute = useCallback(async () => {
    if (!selectedId) return;
    setIsExecuting(true);
    await executeIntentNode(selectedId);
    setIsExecuting(false);
  }, [selectedId, executeIntentNode]);

  const handleAddChild = useCallback(async () => {
    if (!selectedId || !childTitle.trim()) return;
    await addIntentNode(selectedId, childTitle.trim(), childType);
    setChildTitle('');
    setShowAddChild(false);
  }, [selectedId, childTitle, childType, addIntentNode]);

  // Find root nodes (nodes with no parent)
  const rootNodes = intentNodes.filter((n) => !n.parent);

  return (
    <div className="h-full flex flex-col bg-secondary border-l border-bg-border">
      {/* Header */}
      <div className="h-[44px] min-h-[44px] flex items-center justify-between px-4 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <GraphIcon />
          <span className="font-medium text-sm text-text-primary">Intent Graph</span>
        </div>
        <button
          onClick={toggleAiPanel}
          className="flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          aria-label="Close panel"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Zoom Control */}
      <div className="px-4 py-3 border-b border-bg-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Zoom Level</span>
          <span className="text-[10px] text-text-secondary">{ZOOM_LABELS[intentZoom] ?? intentZoom}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted shrink-0">Product</span>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={intentZoom}
            onChange={handleZoomChange}
            className="flex-1 h-1 accent-[#6366f1] cursor-pointer"
          />
          <span className="text-[10px] text-text-muted shrink-0">Code</span>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!projectPath ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
            <p className="text-sm text-text-secondary text-center">
              Load a project to see its intent graph
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        ) : intentNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 px-4">
            <p className="text-sm text-text-secondary text-center">
              No intent nodes found at this zoom level
            </p>
          </div>
        ) : (
          <div className="py-2">
            {rootNodes.map((node) => (
              <IntentTreeNode
                key={node.id}
                node={node}
                allNodes={intentNodes}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="border-t border-bg-border px-4 py-3 space-y-3 overflow-y-auto max-h-[300px] scrollbar-thin">
          {/* Title */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-1.5 text-sm text-text-primary resize-none focus:outline-none focus:border-accent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="planned">Planned</option>
              <option value="partial">Partial</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="rounded-lg text-xs px-3 py-1.5 border border-bg-border text-text-secondary hover:border-accent hover:text-text-primary transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="rounded-lg text-xs px-3 py-1.5 bg-accent text-white hover:bg-accent-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isExecuting && (
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Execute
            </button>
            <button
              onClick={() => setShowAddChild(!showAddChild)}
              className="rounded-lg text-xs px-3 py-1.5 border border-bg-border text-text-secondary hover:border-accent hover:text-text-primary transition-colors"
            >
              Add Child
            </button>
          </div>

          {/* Add Child Form */}
          {showAddChild && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={childTitle}
                onChange={(e) => setChildTitle(e.target.value)}
                placeholder="Node title..."
                className="flex-1 bg-bg-primary border border-bg-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddChild();
                }}
              />
              <select
                value={childType}
                onChange={(e) => setChildType(e.target.value)}
                className="bg-bg-primary border border-bg-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                {NODE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={handleAddChild}
                disabled={!childTitle.trim()}
                className="rounded-lg text-xs px-2.5 py-1 bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
