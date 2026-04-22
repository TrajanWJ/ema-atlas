import { GlassCard } from './GlassCard';
import { StatusBadge } from './StatusBadge';
import { Copy, Zap, Check } from 'lucide-react';
import { useState } from 'react';
import type { Gap } from '../store/useStore';

interface GapCardProps {
  gap: Gap;
  onGeneratePrompt: (gap: Gap) => void;
  onApply: (gap: Gap) => void;
}

export function GapCard({ gap, onGeneratePrompt, onApply }: GapCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const prompt = `Fix this issue in the codebase:\n\n${gap.description}\n\nSuggested fix: ${gap.suggestedFix}\n\nAffected system: ${gap.system}`;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <StatusBadge status={gap.severity} size="sm" />
            <span className="text-xs text-muted">{gap.type.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-sm font-medium text-white mb-1">{gap.description}</p>
          <p className="text-xs text-muted">{gap.suggestedFix}</p>
          {gap.affectedNodes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {gap.affectedNodes.slice(0, 3).map((node, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-surface rounded text-muted font-mono truncate max-w-[200px]">
                  {node.split('::')[0]}
                </span>
              ))}
              {gap.affectedNodes.length > 3 && (
                <span className="text-[10px] text-muted">+{gap.affectedNodes.length - 3} more</span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-surface hover:bg-white/5 border border-white/[0.07] rounded-lg transition-colors"
          >
            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Prompt'}
          </button>
          <button
            onClick={() => onApply(gap)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/20 rounded-lg transition-colors"
          >
            <Zap size={12} />
            Apply
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
