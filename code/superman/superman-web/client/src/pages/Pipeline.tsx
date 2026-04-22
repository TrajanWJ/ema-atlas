import { useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { StatusBadge } from '../components/StatusBadge';
import { useStore } from '../store/useStore';
import { useEngine } from '../hooks/useEngine';
import { GitPullRequest, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function Pipeline() {
  const { projects, queue } = useStore();
  const { fetchProjects, fetchQueue, updateQueueItem, copyToClipboard } = useEngine();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects().then((projs: any[]) => {
      projs.forEach((p: any) => fetchQueue(p.id));
    });
  }, []);

  const allQueue = queue;
  const stats = {
    backlog: allQueue.filter(q => q.status === 'backlog').length,
    inProgress: allQueue.filter(q => q.status === 'in_progress').length,
    done: allQueue.filter(q => q.status === 'done').length,
  };

  const handleCopyPrompt = (item: any) => {
    const prompt = item.generated_prompt || `Fix: ${item.title}\n\nDescription: ${item.description}\n\nPriority: ${item.priority}\nComplexity: ${item.complexity}`;
    copyToClipboard(prompt);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <GitPullRequest size={24} className="text-cyan" />
          <h1 className="text-2xl font-bold">Pipeline</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Backlog', value: stats.backlog, color: 'text-muted' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-cyan' },
          { label: 'Done', value: stats.done, color: 'text-success' },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-4">
            <p className="text-xs text-muted mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-6">
        {(['backlog', 'in_progress', 'done'] as const).map(status => (
          <div key={status}>
            <h3 className="text-xs text-muted font-medium mb-3 uppercase tracking-wider">
              {status.replace('_', ' ')} ({allQueue.filter(q => q.status === status).length})
            </h3>
            <div className="space-y-2 min-h-[200px]">
              {allQueue.filter(q => q.status === status).map(item => {
                const project = projects.find(p => p.id === item.project_id);
                return (
                  <GlassCard key={item.id} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-medium flex-1">{item.title}</p>
                      <button onClick={() => handleCopyPrompt(item)} className="p-1 hover:bg-white/5 rounded shrink-0">
                        {copiedId === item.id ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-muted" />}
                      </button>
                    </div>
                    {project && <p className="text-[10px] text-muted/50 mb-2">{project.name}</p>}
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={item.priority === 'P0' ? 'critical' : item.priority === 'P1' ? 'high' : 'medium'} size="sm" />
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface rounded text-muted">{item.type}</span>
                      <span className="text-[10px] text-muted">{item.complexity}</span>
                    </div>
                    {status !== 'done' && (
                      <div className="flex gap-1 mt-2">
                        {status === 'backlog' && (
                          <button
                            onClick={() => updateQueueItem(item.project_id, item.id, { status: 'in_progress' })}
                            className="text-[10px] px-2 py-0.5 bg-cyan/10 text-cyan rounded hover:bg-cyan/20 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {status === 'in_progress' && (
                          <button
                            onClick={() => updateQueueItem(item.project_id, item.id, { status: 'done' })}
                            className="text-[10px] px-2 py-0.5 bg-success/10 text-success rounded hover:bg-success/20 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
