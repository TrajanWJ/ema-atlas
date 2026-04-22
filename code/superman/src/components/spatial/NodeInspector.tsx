'use client';

import { useState, useCallback } from 'react';
import { useEditorStore, type IntentNode } from '@/store/editor-store';

const STATUS_DOT: Record<string, string> = {
  complete: 'bg-emerald-400',
  partial: 'bg-amber-400',
  planned: 'bg-red-400',
};

const TYPE_LABEL: Record<string, string> = {
  product: 'Product',
  flow: 'Flow',
  action: 'Action',
  system: 'System',
  feature: 'Feature',
  implementation: 'Implementation',
  code: 'Code',
};

interface Props {
  node: IntentNode;
  onClose: () => void;
}

export function NodeInspector({ node, onClose }: Props) {
  const updateIntentNode = useEditorStore((s) => s.updateIntentNode);
  const executeIntentNode = useEditorStore((s) => s.executeIntentNode);
  const addIntentNode = useEditorStore((s) => s.addIntentNode);
  const isChatLoading = useEditorStore((s) => s.isChatLoading);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(node.title);
  const [description, setDescription] = useState(node.description || '');
  const [status, setStatus] = useState<string>(node.status || 'planned');

  const [addingChild, setAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const [childType, setChildType] = useState('action');

  const handleSave = useCallback(async () => {
    await updateIntentNode(node.id, { title, description, status: status as IntentNode['status'] });
    setEditing(false);
  }, [node.id, title, description, status, updateIntentNode]);

  const handleExecute = useCallback(() => {
    executeIntentNode(node.id);
  }, [node.id, executeIntentNode]);

  const handleAddChild = useCallback(async () => {
    if (!childTitle.trim()) return;
    await addIntentNode(node.id, childTitle.trim(), childType);
    setChildTitle('');
    setAddingChild(false);
  }, [node.id, childTitle, childType, addIntentNode]);

  const statusColor = STATUS_DOT[node.status || 'planned'] || STATUS_DOT.planned;

  return (
    <div className="absolute top-4 right-4 w-80 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-white/40 font-medium uppercase tracking-wider">
            {TYPE_LABEL[node.type] || node.type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {editing ? (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
              placeholder="Description..."
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
            >
              <option value="planned">Planned</option>
              <option value="partial">Partial</option>
              <option value="complete">Complete</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg py-2 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 text-xs rounded-lg py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-sm font-medium text-white">{node.title}</h3>
            {node.description && (
              <p className="text-xs text-white/40 leading-relaxed">{node.description}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                Level {node.level}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30`}>
                {node.status || 'planned'}
              </span>
              {node.children.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                  {node.children.length} children
                </span>
              )}
              {node.linkedCode && node.linkedCode.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                  {node.linkedCode.length} code refs
                </span>
              )}
              {node.userVisible && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                  user-facing
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-lg py-2 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setAddingChild(!addingChild)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-lg py-2 transition-colors"
              >
                Add Child
              </button>
              {(node.type === 'flow' || node.type === 'action' || node.status === 'planned') && (
                <button
                  onClick={handleExecute}
                  disabled={isChatLoading}
                  className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium rounded-lg py-2 transition-colors disabled:opacity-40"
                >
                  {isChatLoading ? '...' : 'Execute'}
                </button>
              )}
            </div>

            {/* Add child form */}
            {addingChild && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <input
                  value={childTitle}
                  onChange={(e) => setChildTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChild()}
                  placeholder="Child node title..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
                  autoFocus
                />
                <div className="flex gap-2">
                  <select
                    value={childType}
                    onChange={(e) => setChildType(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/60"
                  >
                    <option value="flow">Flow</option>
                    <option value="action">Action</option>
                    <option value="system">System</option>
                    <option value="feature">Feature</option>
                  </select>
                  <button
                    onClick={handleAddChild}
                    disabled={!childTitle.trim()}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs rounded-lg transition-colors disabled:opacity-30"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
