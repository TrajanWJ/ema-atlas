import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Search, Sparkles, Play, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { GapCard } from '../components/GapCard';
import { StatusBadge } from '../components/StatusBadge';
import { HealthGauge } from '../components/HealthGauge';
import { useStore, type Gap, type HistoryEntry } from '../store/useStore';
import { useEngine } from '../hooks/useEngine';

interface FlowStep {
  id: string;
  userAction: string;
  systemResponse: string;
  status: 'implemented' | 'partial' | 'missing';
}

interface FlowData {
  id: string;
  name: string;
  description: string;
  stepCount: number;
  completeness: number;
  confidence: number;
  entryFile: string | null;
  relatedFiles: string[];
  steps: FlowStep[];
}

interface CompleteFlowData {
  name: string;
  entryPoint: string;
  chain: Array<{ nodeId: string; name: string; type: string; filePath: string; order: number; edgeType: string }>;
  brokenSteps: Array<{ nodeId: string; name: string; reason: string; severity: string }>;
  externalServices: string[];
  isComplete: boolean;
}

interface ExpandedQueryData {
  original: string;
  concepts: string[];
  actions: string[];
  components: string[];
  fileTypes: string[];
}

const TABS = ['overview', 'gaps', 'flows', 'queue', 'insights', 'history'] as const;

export default function Project() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, gaps, queue, activeTab, setActiveTab, engineStatus, analysisProgress, history, addHistoryEntry } = useStore();
  const { fetchGaps, askCodebase, fetchQueue, addToQueue, copyToClipboard, reanalyzeProject, fetchProjects } = useEngine();
  const [reanalyzing, setReanalyzing] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<any>(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [flows, setFlows] = useState<FlowData[]>([]);
  const [completeFlows, setCompleteFlows] = useState<CompleteFlowData[]>([]);
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<any>(null);
  const [expandedQuery, setExpandedQuery] = useState<ExpandedQueryData | null>(null);

  const project = projects.find(p => p.id === id);

  useEffect(() => {
    if (id) {
      fetchGaps(id);
      fetchQueue(id);
      fetch(`http://localhost:3001/api/flows/${id}`)
        .then(r => r.ok ? r.json() : [])
        .then(setFlows)
        .catch(() => setFlows([]));
    }
  }, [id]);

  const handleSimulate = async (flowName: string) => {
    setSimulating(flowName);
    setSimResult(null);
    try {
      const res = await fetch('http://localhost:3001/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, flowName }),
      });
      const data = await res.json();
      setSimResult({ flowName, ...data });
    } catch {
      setSimResult({ flowName, error: 'Simulation failed' });
    }
    setSimulating(null);
  };

  if (!project) {
    return (
      <div className="p-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted hover:text-white mb-4">
          <ArrowLeft size={16} /> Back
        </button>
        {projects.length === 0 ? (
          <div className="flex items-center gap-2 text-muted">
            <RefreshCw size={14} className="animate-spin" />
            <span>Loading project...</span>
          </div>
        ) : (
          <p className="text-muted">Project not found. Analyze a project from the dashboard first.</p>
        )}
      </div>
    );
  }

  const handleReanalyze = async () => {
    if (!project || reanalyzing) return;
    setReanalyzing(true);
    await reanalyzeProject(project.id, project.path, project.name);
    await fetchProjects();
    if (id) {
      fetchGaps(id);
      fetch(`http://localhost:3001/api/flows/${id}`)
        .then(r => r.ok ? r.json() : [])
        .then(setFlows)
        .catch(() => setFlows([]));
    }
    setReanalyzing(false);
  };

  const handleAsk = async () => {
    if (!question || !id) return;
    addHistoryEntry({
      id: `ask-${Date.now()}`,
      action: 'Ask Codebase',
      detail: question,
      timestamp: Date.now(),
      status: 'pending',
    });
    const result = await askCodebase(id, question);
    setAnswer(result);
    if (result?.expandedQuery) {
      setExpandedQuery(result.expandedQuery);
    }
    addHistoryEntry({
      id: `answer-${Date.now()}`,
      action: 'Answer Received',
      detail: result?.answer?.slice(0, 100) || 'No answer',
      timestamp: Date.now(),
      status: result?.confidence === 'high' ? 'success' : 'pending',
    });
  };

  const handleGeneratePrompt = (gap: Gap) => {
    const prompt = `Fix this issue:\n\n**${gap.severity.toUpperCase()}**: ${gap.description}\n\n**Suggested fix**: ${gap.suggestedFix}\n\n**System**: ${gap.system}`;
    copyToClipboard(prompt);
  };

  const filteredGaps = severityFilter === 'all' ? gaps : gaps.filter(g => g.severity === severityFilter);
  const severityCounts = {
    all: gaps.length,
    critical: gaps.filter(g => g.severity === 'critical').length,
    high: gaps.filter(g => g.severity === 'high').length,
    medium: gaps.filter(g => g.severity === 'medium').length,
    low: gaps.filter(g => g.severity === 'low').length,
  };

  return (
    <div className="p-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-muted" />
          </button>
          <h1 className="text-xl font-bold">{project.name}</h1>
          <StatusBadge status={project.health_score >= 80 ? 'complete' : project.health_score >= 50 ? 'partial' : 'broken'} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-cyan/10 text-cyan border border-cyan/20 rounded-lg hover:bg-cyan/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={reanalyzing ? 'animate-spin' : ''} />
            {reanalyzing ? 'Analyzing...' : 'Re-analyze'}
          </button>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="Ask anything..."
              className="pl-9 pr-3 py-2 w-64 bg-surface border border-white/[0.07] rounded-lg text-xs focus:outline-none focus:border-cyan/50"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.07]">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm capitalize transition-colors relative ${
              activeTab === tab ? 'text-cyan' : 'text-muted hover:text-white'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan" />
            )}
          </button>
        ))}
      </div>

      {/* Analysis Progress Bar */}
      {analysisProgress && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4"
        >
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RefreshCw size={13} className="text-cyan animate-spin" />
                <span className="text-xs font-medium text-cyan">{analysisProgress.phase}</span>
              </div>
              <span className="text-xs font-mono text-muted">{analysisProgress.percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan to-violet rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${analysisProgress.percent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3 space-y-4">
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold mb-3">Project Info</h3>
                <p className="text-xs text-muted mb-3 font-mono">{project.path}</p>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Files', value: project.file_count },
                    { label: 'Functions', value: project.function_count },
                    { label: 'Flows', value: project.flow_count },
                    { label: 'Gaps', value: project.gap_count },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <p className="text-xl font-bold font-mono">{s.value || 0}</p>
                      <p className="text-[10px] text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {gaps.filter(g => g.severity === 'critical' || g.severity === 'high').length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Top Issues</h3>
                  <div className="space-y-2">
                    {gaps.filter(g => g.severity === 'critical' || g.severity === 'high').slice(0, 3).map((gap, i) => (
                      <GapCard key={i} gap={gap} onGeneratePrompt={handleGeneratePrompt} onApply={() => {}} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-2">
              <GlassCard className="p-5 flex flex-col items-center">
                <h3 className="text-sm font-semibold mb-4">Health Score</h3>
                <HealthGauge score={project.health_score || 0} size={160} />
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === 'gaps' && (
          <div>
            <div className="flex gap-2 mb-4">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    severityFilter === sev
                      ? 'bg-cyan/10 text-cyan border-cyan/20'
                      : 'bg-surface text-muted border-white/[0.07] hover:text-white'
                  }`}
                >
                  {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)} ({severityCounts[sev]})
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredGaps.map((gap, i) => (
                <GapCard key={i} gap={gap} onGeneratePrompt={handleGeneratePrompt} onApply={() => {}} />
              ))}
              {filteredGaps.length === 0 && (
                <GlassCard className="p-8 text-center">
                  <p className="text-muted">No gaps found for this filter</p>
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {activeTab === 'flows' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">{flows.length} Flows Detected</h3>
            </div>

            {flows.length === 0 && (
              <GlassCard className="p-8 text-center">
                <p className="text-muted text-sm">No flows detected. Analyze the project first.</p>
              </GlassCard>
            )}

            <div className="space-y-2">
              {flows.map(flow => {
                const isExpanded = expandedFlow === flow.id;
                const implemented = flow.steps.filter(s => s.status === 'implemented').length;
                const partial = flow.steps.filter(s => s.status === 'partial').length;
                const missing = flow.steps.filter(s => s.status === 'missing').length;
                const completePct = flow.stepCount > 0 ? Math.round(flow.completeness * 100) : 0;
                const statusLabel = completePct >= 80 ? 'complete' : completePct >= 40 ? 'partial' : 'broken';

                return (
                  <GlassCard key={flow.id} className="overflow-hidden">
                    {/* Flow header */}
                    <button
                      onClick={() => setExpandedFlow(isExpanded ? null : flow.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
                        <div>
                          <p className="text-sm font-medium">{flow.name}</p>
                          {flow.description && <p className="text-[11px] text-muted mt-0.5">{flow.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {implemented > 0 && <span className="flex items-center gap-0.5 text-success"><CheckCircle2 size={11} />{implemented}</span>}
                          {partial > 0 && <span className="flex items-center gap-0.5 text-warning"><AlertTriangle size={11} />{partial}</span>}
                          {missing > 0 && <span className="flex items-center gap-0.5 text-danger"><XCircle size={11} />{missing}</span>}
                        </div>
                        <div className="w-20 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${completePct >= 80 ? 'bg-success' : completePct >= 40 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${completePct}%` }} />
                        </div>
                        <span className="text-[11px] text-muted w-8 text-right">{completePct}%</span>
                        <StatusBadge status={statusLabel as any} size="sm" />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSimulate(flow.name); }}
                          disabled={simulating === flow.name}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-cyan/10 text-cyan border border-cyan/20 rounded-md hover:bg-cyan/20 transition-colors disabled:opacity-50"
                        >
                          <Play size={10} />
                          {simulating === flow.name ? 'Running...' : 'Simulate'}
                        </button>
                      </div>
                    </button>

                    {/* Expanded steps */}
                    {isExpanded && (
                      <div className="border-t border-white/[0.05] px-4 py-3 bg-white/[0.01]">
                        {flow.entryFile && (
                          <p className="text-[10px] text-muted font-mono mb-3">Entry: {flow.entryFile}</p>
                        )}
                        <div className="space-y-1">
                          {flow.steps.map((step, i) => (
                            <div key={step.id || i} className="flex items-start gap-3 py-1.5">
                              <div className="flex flex-col items-center mt-0.5">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                  step.status === 'implemented' ? 'bg-success' : step.status === 'partial' ? 'bg-warning' : 'bg-danger'
                                }`} />
                                {i < flow.steps.length - 1 && <div className="w-px h-6 bg-white/[0.07] mt-1" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">{step.userAction}</p>
                                <p className="text-[11px] text-muted mt-0.5">{step.systemResponse}</p>
                              </div>
                              <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded ${
                                step.status === 'implemented' ? 'bg-success/10 text-success' : step.status === 'partial' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                              }`}>{step.status}</span>
                            </div>
                          ))}
                        </div>

                        {flow.relatedFiles.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/[0.05]">
                            <p className="text-[10px] text-muted mb-1.5">Related files:</p>
                            <div className="flex flex-wrap gap-1">
                              {flow.relatedFiles.slice(0, 8).map((f, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 bg-surface rounded font-mono text-cyan/70">{f.split('/').pop()}</span>
                              ))}
                              {flow.relatedFiles.length > 8 && (
                                <span className="text-[10px] px-2 py-0.5 text-muted">+{flow.relatedFiles.length - 8} more</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Simulation result */}
                        {simResult && simResult.flowName === flow.name && (
                          <div className="mt-3 pt-3 border-t border-white/[0.05]">
                            <p className="text-[10px] font-semibold text-cyan mb-2">Simulation Result</p>
                            {simResult.error ? (
                              <p className="text-xs text-danger">{simResult.error}</p>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex gap-3 text-[11px]">
                                  <span className="text-muted">Validity: <span className={`font-mono ${(simResult.overallValidity || 0) >= 0.7 ? 'text-success' : 'text-warning'}`}>{Math.round((simResult.overallValidity || 0) * 100)}%</span></span>
                                  <span className="text-muted">Issues: <span className="font-mono text-white">{simResult.issues?.length || 0}</span></span>
                                </div>
                                {simResult.issues?.map((issue: any, i: number) => (
                                  <div key={i} className={`text-[11px] flex items-start gap-2 py-1 px-2 rounded ${
                                    issue.severity === 'high' ? 'bg-danger/5' : issue.severity === 'medium' ? 'bg-warning/5' : 'bg-white/[0.02]'
                                  }`}>
                                    <span className={`shrink-0 ${issue.severity === 'high' ? 'text-danger' : issue.severity === 'medium' ? 'text-warning' : 'text-muted'}`}>
                                      {issue.severity === 'high' ? '!!' : issue.severity === 'medium' ? '!' : '-'}
                                    </span>
                                    <span className="text-muted">{issue.description}</span>
                                  </div>
                                ))}
                                {simResult.improvements?.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-[10px] text-muted mb-1">Suggestions:</p>
                                    {simResult.improvements.map((imp: string, i: number) => (
                                      <p key={i} className="text-[11px] text-muted/80 pl-3">- {imp}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Build Queue</h3>
              <button
                onClick={() => {
                  gaps.filter(g => g.severity === 'critical' || g.severity === 'high').slice(0, 5).forEach(gap => {
                    addToQueue(project.id, {
                      title: gap.description.slice(0, 80),
                      type: gap.type === 'broken_integration' ? 'bug' : 'feature',
                      priority: gap.severity === 'critical' ? 'P0' : 'P1',
                      complexity: 'M',
                      description: gap.suggestedFix,
                    });
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet/10 text-violet border border-violet/20 rounded-lg hover:bg-violet/20 transition-colors"
              >
                <Sparkles size={12} />
                AI Suggest
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {['backlog', 'in_progress', 'done'].map(status => (
                <div key={status}>
                  <h4 className="text-xs text-muted font-medium mb-3 uppercase tracking-wider">
                    {status.replace('_', ' ')} ({queue.filter(q => q.status === status).length})
                  </h4>
                  <div className="space-y-2">
                    {queue.filter(q => q.status === status).map(item => (
                      <GlassCard key={item.id} className="p-3">
                        <p className="text-xs font-medium mb-1">{item.title}</p>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={item.priority === 'P0' ? 'critical' : item.priority === 'P1' ? 'high' : 'medium'} size="sm" />
                          <span className="text-[10px] text-muted">{item.complexity}</span>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div>
            <GlassCard className="p-5 mb-4">
              <h3 className="text-sm font-semibold mb-3">Ask Codebase</h3>
              <div className="flex gap-2 mb-3">
                {['What are the security risks?', 'What should I build next?', 'How does auth work?'].map(q => (
                  <button
                    key={q}
                    onClick={() => { setQuestion(q); }}
                    className="px-3 py-1.5 text-[11px] bg-surface border border-white/[0.07] rounded-full text-muted hover:text-white transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAsk()}
                  placeholder="Ask a question about this codebase..."
                  className="flex-1 px-3 py-2.5 bg-surface border border-white/[0.07] rounded-lg text-sm focus:outline-none focus:border-cyan/50"
                />
                <button onClick={handleAsk} className="px-4 py-2.5 bg-cyan/10 text-cyan border border-cyan/20 rounded-lg text-sm hover:bg-cyan/20 transition-colors">
                  Ask
                </button>
              </div>
            </GlassCard>

            {/* Expanded Query Chips */}
            {expandedQuery && expandedQuery.concepts.length > 0 && (
              <GlassCard className="p-4 mb-4">
                <p className="text-[10px] text-muted mb-2 uppercase tracking-wider">Query Expansion</p>
                <div className="flex flex-wrap gap-2">
                  {expandedQuery.concepts.map((c: string, i: number) => (
                    <span key={`concept-${i}`} className="px-2 py-1 text-[11px] bg-cyan/10 text-cyan border border-cyan/20 rounded-full">
                      {c}
                    </span>
                  ))}
                  {expandedQuery.actions.map((a: string, i: number) => (
                    <span key={`action-${i}`} className="px-2 py-1 text-[11px] bg-violet/10 text-violet border border-violet/20 rounded-full">
                      {a}
                    </span>
                  ))}
                  {expandedQuery.components.map((c: string, i: number) => (
                    <span key={`comp-${i}`} className="px-2 py-1 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}

            {answer && (
              <GlassCard className="p-5">
                <h4 className="text-xs text-muted mb-3">Results</h4>
                {/* Answer text */}
                {answer.answer && (
                  <div className="mb-4">
                    <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{answer.answer}</p>
                    {answer.confidence && (
                      <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] rounded ${
                        answer.confidence === 'high' ? 'bg-success/10 text-success' :
                        answer.confidence === 'medium' ? 'bg-warning/10 text-warning' :
                        'bg-danger/10 text-danger'
                      }`}>
                        Confidence: {answer.confidence}
                      </span>
                    )}
                  </div>
                )}

                {answer.relevantFiles && answer.relevantFiles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted mb-1">Relevant files:</p>
                    <div className="flex flex-wrap gap-1">
                      {answer.relevantFiles.map((f: string, i: number) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-surface rounded font-mono text-cyan">{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {answer.evidence && answer.evidence.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted mb-1">Evidence:</p>
                    {answer.evidence.map((e: any, i: number) => (
                      <div key={i} className="text-[11px] py-1 pl-3 border-l-2 border-cyan/20 mb-1">
                        <span className="text-cyan">{e.source}</span>: <span className="text-muted">{e.detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {answer.matchingNodes && (
                  <div className="mb-3">
                    <p className="text-xs text-muted mb-1">Matching nodes:</p>
                    {answer.matchingNodes.map((n: any, i: number) => (
                      <div key={i} className="text-xs font-mono py-1 border-b border-white/[0.03]">
                        <span className="text-cyan">{n.type}</span> <span className="text-white">{n.name}</span>
                        <span className="text-muted/50 ml-2">{n.file}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up Question Chips */}
                {answer.followUpQuestions && answer.followUpQuestions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.05]">
                    <p className="text-[10px] text-muted mb-2 uppercase tracking-wider">Follow-up questions</p>
                    <div className="flex flex-wrap gap-2">
                      {answer.followUpQuestions.map((q: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => { setQuestion(q); setExpandedQuery(null); }}
                          className="px-3 py-1.5 text-[11px] bg-surface border border-white/[0.07] rounded-full text-muted hover:text-white hover:border-cyan/30 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {answer.suggestions && answer.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.05]">
                    <p className="text-[10px] text-muted mb-2 uppercase tracking-wider">Suggestions</p>
                    {answer.suggestions.map((s: string, i: number) => (
                      <p key={i} className="text-[11px] text-muted/80 pl-3 mb-1">- {s}</p>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Engine Activity Timeline</h3>
              <button
                onClick={() => useStore.getState().clearHistory()}
                className="text-[11px] text-muted hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
            {history.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <p className="text-muted text-sm">No activity yet. Analyze a project or ask a question to see events here.</p>
              </GlassCard>
            ) : (
              <div className="space-y-1">
                {[...history].reverse().map((entry) => (
                  <GlassCard key={entry.id} className="p-3 flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      entry.status === 'success' ? 'bg-success' :
                      entry.status === 'error' ? 'bg-danger' : 'bg-warning'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{entry.action}</span>
                        <span className="text-[10px] text-muted font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted truncate">{entry.detail}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
