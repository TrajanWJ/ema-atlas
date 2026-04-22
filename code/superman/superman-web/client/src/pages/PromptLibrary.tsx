import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useStore, type Prompt } from '../store/useStore';
import { useEngine } from '../hooks/useEngine';
import { BookOpen, Search, Copy, Check, Star, Plus, X } from 'lucide-react';

const CATEGORIES = ['All', 'Analysis & Audit', 'Feature Building', 'Bug Fixes', 'Refactoring', 'Architecture', 'Testing', 'Custom'];

export default function PromptLibrary() {
  const { prompts } = useStore();
  const { fetchPrompts, copyToClipboard } = useEngine();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: '', category: 'Custom', description: '', content: '' });

  useEffect(() => { fetchPrompts(); }, []);

  const filtered = prompts.filter((p: Prompt) => {
    const matchCategory = category === 'All' || p.category === category;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleCopy = (prompt: Prompt) => {
    copyToClipboard(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = async () => {
    await fetch('http://localhost:3001/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPrompt),
    });
    fetchPrompts();
    setShowAdd(false);
    setNewPrompt({ title: '', category: 'Custom', description: '', content: '' });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen size={24} className="text-violet" />
          <h1 className="text-2xl font-bold">Prompt Library</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-violet/10 text-violet border border-violet/20 rounded-lg text-sm font-medium hover:bg-violet/20 transition-colors">
          <Plus size={16} />
          Add Prompt
        </button>
      </div>

      <div className="flex gap-6">
        {/* Category sidebar */}
        <div className="w-48 shrink-0">
          <div className="space-y-0.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  category === cat ? 'bg-violet/[0.04] text-violet border-l-[3px] border-l-violet -ml-[3px] pl-[15px]' : 'text-muted hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Prompts grid */}
        <div className="flex-1">
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="w-full pl-9 pr-3 py-2.5 bg-surface border border-white/[0.07] rounded-lg text-sm focus:outline-none focus:border-violet/50"
            />
          </div>

          <div className="space-y-2">
            {filtered.map(prompt => (
              <GlassCard key={prompt.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium">{prompt.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 bg-violet/10 text-violet rounded-full">{prompt.category}</span>
                    </div>
                    <p className="text-xs text-muted mb-2">{prompt.description}</p>
                    {prompt.tags && (
                      <div className="flex gap-1">
                        {JSON.parse(prompt.tags || '[]').map((tag: string, i: number) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-surface rounded text-muted">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleCopy(prompt)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-surface hover:bg-white/5 border border-white/[0.07] rounded-lg transition-colors">
                      {copiedId === prompt.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      {copiedId === prompt.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAdd(false)}>
          <div className="bg-card border border-white/[0.07] rounded-xl p-6 w-[540px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Prompt</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-white/5 rounded"><X size={18} className="text-muted" /></button>
            </div>
            <div className="space-y-3">
              <input value={newPrompt.title} onChange={e => setNewPrompt(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="w-full px-3 py-2.5 bg-surface border border-white/[0.07] rounded-lg text-sm" />
              <select value={newPrompt.category} onChange={e => setNewPrompt(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 bg-surface border border-white/[0.07] rounded-lg text-sm">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={newPrompt.description} onChange={e => setNewPrompt(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full px-3 py-2.5 bg-surface border border-white/[0.07] rounded-lg text-sm" />
              <textarea value={newPrompt.content} onChange={e => setNewPrompt(p => ({ ...p, content: e.target.value }))} placeholder="Prompt content..." rows={6} className="w-full px-3 py-2.5 bg-surface border border-white/[0.07] rounded-lg text-sm resize-none" />
              <button onClick={handleSave} disabled={!newPrompt.title || !newPrompt.content} className="w-full py-2.5 bg-violet/10 text-violet border border-violet/20 rounded-lg text-sm font-medium hover:bg-violet/20 disabled:opacity-50 transition-colors">
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
