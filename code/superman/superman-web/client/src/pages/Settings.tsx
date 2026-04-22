import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Settings, Key, Cpu, Database, Server } from 'lucide-react';

export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [maxIterations, setMaxIterations] = useState(5);
  const [incrementalParsing, setIncrementalParsing] = useState(true);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={24} className="text-muted" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* API Keys */}
      <GlassCard className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Key size={16} className="text-cyan" />
          <h3 className="text-sm font-semibold">API Keys</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted mb-1.5 block">OpenAI API Key (for embeddings)</label>
            <input
              type="password"
              value={openaiKey}
              onChange={e => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2.5 bg-surface border border-white/[0.07] rounded-lg text-sm font-mono focus:outline-none focus:border-cyan/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Anthropic API Key (optional)</label>
            <input
              type="password"
              value={anthropicKey}
              onChange={e => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-3 py-2.5 bg-surface border border-white/[0.07] rounded-lg text-sm font-mono focus:outline-none focus:border-cyan/50"
            />
          </div>
        </div>
      </GlassCard>

      {/* Engine */}
      <GlassCard className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={16} className="text-violet" />
          <h3 className="text-sm font-semibold">Engine</h3>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-muted">Max Iterations</label>
              <span className="text-xs font-mono text-cyan">{maxIterations}</span>
            </div>
            <input
              type="range"
              min={1} max={10}
              value={maxIterations}
              onChange={e => setMaxIterations(Number(e.target.value))}
              className="w-full accent-cyan"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted">Incremental Parsing</label>
            <button
              onClick={() => setIncrementalParsing(!incrementalParsing)}
              className={`w-10 h-5 rounded-full transition-colors ${incrementalParsing ? 'bg-cyan' : 'bg-surface'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${incrementalParsing ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* MCP Server */}
      <GlassCard className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Server size={16} className="text-success" />
          <h3 className="text-sm font-semibold">MCP Server</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Status</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-success">Running</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Port</span>
            <span className="text-xs font-mono">3001</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Tools</span>
            <span className="text-xs font-mono">8 registered</span>
          </div>
        </div>
      </GlassCard>

      {/* Database */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-warning" />
          <h3 className="text-sm font-semibold">Database</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">SQLite Path</span>
            <span className="text-xs font-mono text-muted/60">superman-web/data/db.sqlite</span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs bg-surface border border-white/[0.07] rounded-lg text-muted hover:text-white transition-colors">
              Export Data
            </button>
            <button className="px-3 py-1.5 text-xs bg-danger/10 text-danger border border-danger/20 rounded-lg hover:bg-danger/20 transition-colors">
              Clear History
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
