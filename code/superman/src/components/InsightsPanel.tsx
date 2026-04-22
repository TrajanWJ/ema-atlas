'use client';

import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { api } from '@/lib/api';

type Tab = 'completion' | 'features' | 'bugs';

interface PanelData {
  features: Array<{ title: string; description: string; affectedFlow: string; impactScore: number }>;
  bugs: Array<{ issue: string; severity: 'low' | 'medium' | 'high'; affectedFlow: string; confidence: number }>;
  completion: Array<{ task: string; flow: string; completeness: number; canExecute: boolean; blockers: string[] }>;
  loadingPhase: string;
  overallCompleteness: number;
}

const PHASE_LABELS: Record<string, string> = {
  idle: 'Not loaded',
  structure_ready: 'Scanning files...',
  flows_ready: 'Analyzing flows...',
  fully_indexed: 'Ready',
};

const PHASE_COLORS: Record<string, string> = {
  idle: 'bg-[#5c6078]',
  structure_ready: 'bg-amber-400',
  flows_ready: 'bg-blue-400',
  fully_indexed: 'bg-emerald-400',
};

export default function InsightsPanel() {
  const projectPath = useEditorStore((s) => s.projectPath);
  const selfEvolve = useEditorStore((s) => s.selfEvolve);
  const simulateFlows = useEditorStore((s) => s.simulateFlows);
  const isEvolving = useEditorStore((s) => s.isEvolving);
  const isSimulating = useEditorStore((s) => s.isSimulating);
  const simulationResults = useEditorStore((s) => s.simulationResults);
  const [tab, setTab] = useState<Tab>('completion');
  const [data, setData] = useState<PanelData | null>(null);

  const fetchPanels = useCallback(async () => {
    if (!projectPath) return;
    try { setData(await api<PanelData>('/project/panels')); } catch {}
  }, [projectPath]);

  useEffect(() => {
    if (!projectPath) return;
    fetchPanels();
    const interval = setInterval(fetchPanels, 3000);
    return () => clearInterval(interval);
  }, [projectPath, fetchPanels]);

  if (!projectPath) return null;

  const phase = data?.loadingPhase || 'idle';

  return (
    <div className="h-full flex flex-col bg-[#161922] select-none">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-[#2a2d3e]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5c6078]">Insights</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${PHASE_COLORS[phase] || 'bg-[#5c6078]'} ${phase !== 'fully_indexed' ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] text-[#5c6078]">{PHASE_LABELS[phase] || phase}</span>
          </span>
        </div>

        {data && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-[#5c6078] mb-1">
              <span>Completeness</span>
              <span>{data.overallCompleteness}%</span>
            </div>
            <div className="h-1.5 bg-[#1c1f2e] rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${data.overallCompleteness}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-1">
          {(['completion', 'features', 'bugs'] as Tab[]).map((t) => {
            const count = t === 'completion' ? data?.completion.length : t === 'features' ? data?.features.length : data?.bugs.length;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${tab === t ? 'bg-[#2a2e42] text-[#e1e4ed]' : 'text-[#5c6078] hover:bg-[#232738]'}`}
              >
                {t === 'completion' ? 'Tasks' : t === 'features' ? 'Features' : 'Issues'}
                {count ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Build All button */}
      {data && tab === 'completion' && data.completion.some((t) => t.completeness < 1) && (
        <div className="shrink-0 px-3 py-2 border-b border-[#2a2d3e]">
          <ContinuousBuildButton onRefresh={fetchPanels} />
        </div>
      )}

      {/* Self-Improve & Simulate buttons */}
      <div className="shrink-0 px-3 py-2 border-b border-[#2a2d3e] flex gap-2">
        <button
          onClick={selfEvolve}
          disabled={isEvolving}
          className="flex-1 bg-[#6366f1]/10 hover:bg-[#6366f1]/20 text-[#818cf8] text-[11px] font-medium rounded-lg py-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {isEvolving ? (
            <>
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Evolving...
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              Self-Improve
            </>
          )}
        </button>
        <button
          onClick={simulateFlows}
          disabled={isSimulating}
          className="flex-1 bg-[#0f766e]/10 hover:bg-[#0f766e]/20 text-[#2dd4bf] text-[11px] font-medium rounded-lg py-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {isSimulating ? (
            <>
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Simulating...
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 4-8 4V2z" fill="currentColor" /></svg>
              Simulate
            </>
          )}
        </button>
      </div>

      {/* Simulation Results */}
      {simulationResults && simulationResults.length > 0 && (
        <div className="shrink-0 px-3 py-2 border-b border-[#2a2d3e] space-y-1.5 max-h-48 overflow-y-auto">
          <div className="text-[10px] text-[#5c6078] font-medium uppercase tracking-wider">Simulation Results</div>
          {simulationResults.map((r, i) => (
            <div key={i} className="bg-[#1c1f2e] rounded-md px-2.5 py-2 border border-[#2a2d3e]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#e1e4ed] truncate">{r.flowName}</span>
                <span className={`text-[10px] font-medium shrink-0 ml-2 ${r.validity >= 0.7 ? 'text-emerald-400' : r.validity >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                  {Math.round(r.validity * 100)}%
                </span>
              </div>
              {r.issues.length > 0 && (
                <div className="space-y-0.5">
                  {r.issues.slice(0, 3).map((issue, j) => (
                    <div key={j} className="text-[10px] text-[#5c6078] truncate">• {issue}</div>
                  ))}
                  {r.issues.length > 3 && <div className="text-[10px] text-[#5c6078]">+{r.issues.length - 3} more</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {!data && <div className="text-center text-[12px] text-[#5c6078] py-8">Analyzing project...</div>}

        {data && tab === 'completion' && data.completion.map((item, i) => <CompletionCard key={i} item={item} onRefresh={fetchPanels} />)}
        {data && tab === 'features' && data.features.map((item, i) => <FeatureCard key={i} item={item} />)}
        {data && tab === 'bugs' && data.bugs.map((item, i) => <BugCard key={i} item={item} onRefresh={fetchPanels} />)}

        {data && ((tab === 'completion' && data.completion.length === 0) || (tab === 'features' && data.features.length === 0) || (tab === 'bugs' && data.bugs.length === 0)) && (
          <div className="text-center text-[12px] text-[#5c6078] py-8">{phase === 'fully_indexed' ? 'None found' : 'Still analyzing...'}</div>
        )}
      </div>
    </div>
  );
}

// ── Continuous Build Button ──

function ContinuousBuildButton({ onRefresh }: { onRefresh: () => void }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleContinuous = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await api<{ tasks: number; results: Array<{ taskName: string; stepsCompleted: number; buildPassed: boolean }> }>(
        '/project/build-continuous',
        { method: 'POST', body: { maxTasks: 3 } },
      );
      const summary = res.results.map((r) => `${r.taskName}: ${r.stepsCompleted} steps ${r.buildPassed ? '✅' : '❌'}`).join('\n');
      setResult(`Built ${res.tasks} task(s):\n${summary}`);
      onRefresh();
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
    setRunning(false);
  };

  return (
    <div>
      <button
        onClick={handleContinuous}
        disabled={running}
        className="w-full bg-[#6366f1]/20 hover:bg-[#6366f1]/30 text-[#818cf8] text-[11px] font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {running ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Building continuously...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2l8 5-8 5V2z" fill="currentColor" /></svg>
            Build All (auto-plan + execute)
          </>
        )}
      </button>
      {result && (
        <div className={`mt-1.5 text-[10px] p-2 rounded-md whitespace-pre-line ${result.startsWith('Error') ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
          {result}
        </div>
      )}
    </div>
  );
}

// ── Task Card (expandable with plan) ──

function CompletionCard({ item, onRefresh }: { item: PanelData['completion'][0]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [building, setBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<any>(null);
  const pct = Math.round(item.completeness * 100);

  const handleBuild = async () => {
    setBuilding(true);
    setBuildResult(null);
    try {
      const res = await api<any>('/project/build', {
        method: 'POST',
        body: { task: item.task, blockers: item.blockers },
      });
      setBuildResult(res);
      onRefresh();
    } catch (err: any) {
      setBuildResult({ error: err.message });
    }
    setBuilding(false);
  };

  return (
    <div
      className={`bg-[#1c1f2e] rounded-lg border transition-all cursor-pointer ${expanded ? 'border-[#6366f1]/30' : 'border-[#2a2d3e] hover:border-[#3a3d4e]'}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-medium text-[#e1e4ed] truncate">{item.task}</span>
          <span className="text-[10px] text-[#5c6078] shrink-0 ml-2">{pct}%</span>
        </div>
        <div className="h-1 bg-[#0f1117] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-[#2a2d3e] pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="text-[11px] text-[#8b8fa7] leading-relaxed">
            <span className="text-[#e1e4ed] font-medium">{item.task}</span>
            {pct === 0 ? ' — not started.' : pct < 50 ? ` — ${pct}% done, most steps missing.` : pct < 100 ? ` — ${pct}% done, needs finishing.` : ' — complete.'}
          </div>

          {item.blockers.length > 0 && (
            <div>
              <div className="text-[10px] text-[#5c6078] mb-1 font-medium">What needs to be built:</div>
              {item.blockers.map((b, i) => (
                <div key={i} className="text-[10px] text-[#8b8fa7] py-0.5 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5 shrink-0">{i + 1}.</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}

          {/* Build with plan */}
          {item.canExecute && !buildResult && (
            <button
              onClick={handleBuild}
              disabled={building}
              className="w-full mt-1 bg-[#6366f1]/15 hover:bg-[#6366f1]/25 text-[#818cf8] text-[11px] font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {building ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Planning &amp; building...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 1l6 5-6 5V1z" fill="currentColor" /></svg>
                  Plan &amp; Build
                </>
              )}
            </button>
          )}

          {/* Build result with plan details */}
          {buildResult && !buildResult.error && (
            <div className="space-y-2">
              {/* Vision */}
              {buildResult.vision && (
                <div className="bg-[#0f1117] rounded-md p-2">
                  <div className="text-[9px] text-[#5c6078] uppercase tracking-wider mb-0.5">Product Vision</div>
                  <div className="text-[10px] text-[#8b8fa7]">{buildResult.vision.purpose}</div>
                  <div className="text-[9px] text-[#5c6078] mt-0.5">Next: {buildResult.vision.nextMilestone}</div>
                </div>
              )}

              {/* Plan steps */}
              {buildResult.plan?.steps && (
                <div>
                  <div className="text-[10px] text-[#5c6078] font-medium mb-1">
                    Plan ({buildResult.plan.approach?.slice(0, 80)}):
                  </div>
                  {buildResult.plan.steps.map((step: any, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 py-0.5">
                      <span className={`text-[9px] mt-0.5 shrink-0 ${i < buildResult.stepsCompleted ? 'text-emerald-400' : 'text-[#5c6078]'}`}>
                        {i < buildResult.stepsCompleted ? '✓' : `${step.order}.`}
                      </span>
                      <div>
                        <div className="text-[10px] text-[#8b8fa7]">{step.action}</div>
                        {step.userImpact && <div className="text-[9px] text-[#5c6078]">→ {step.userImpact}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Result */}
              <div className={`text-[10px] p-2 rounded-md ${buildResult.buildPassed ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                {buildResult.stepsCompleted}/{buildResult.totalSteps} steps · Build {buildResult.buildPassed ? 'passed ✅' : 'needs attention ⚠️'}
                {buildResult.nextTask && <div className="mt-0.5 text-[#5c6078]">Suggested next: {buildResult.nextTask}</div>}
              </div>
            </div>
          )}

          {buildResult?.error && (
            <div className="text-[10px] p-2 rounded-md bg-red-500/10 text-red-300">{buildResult.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Feature Card (expandable) ──

function FeatureCard({ item }: { item: PanelData['features'][0] }) {
  const [expanded, setExpanded] = useState(false);
  const sendQuery = useEditorStore((s) => s.sendQuery);

  return (
    <div
      className={`bg-[#1c1f2e] rounded-lg border transition-all cursor-pointer ${expanded ? 'border-[#6366f1]/30' : 'border-[#2a2d3e] hover:border-[#3a3d4e]'}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-medium text-[#e1e4ed] truncate">{item.title}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${item.impactScore >= 70 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[#232738] text-[#5c6078]'}`}>{item.impactScore}</span>
        </div>
        <div className="text-[10px] text-[#5c6078] truncate">{item.description}</div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-[#2a2d3e] pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="text-[11px] text-[#8b8fa7] leading-relaxed">
            <span className="text-[#e1e4ed] font-medium">{item.title}</span> — {item.description}
          </div>
          <div className="text-[10px] text-[#5c6078]">
            Affects the <span className="text-[#8b8fa7]">{item.affectedFlow}</span> flow.
            Impact score: <span className="text-[#8b8fa7]">{item.impactScore}/100</span> — {item.impactScore >= 70 ? 'high priority' : item.impactScore >= 40 ? 'medium priority' : 'low priority'}.
          </div>
          <button
            onClick={() => sendQuery(`explain in detail what "${item.title}" means and what needs to be built for it`)}
            className="w-full mt-1 bg-[#232738] hover:bg-[#2a2e42] text-[#8b8fa7] text-[11px] rounded-lg py-2 transition-colors"
          >
            Ask AI to explain this
          </button>
        </div>
      )}
    </div>
  );
}

// ── Bug/Issue Card (expandable with build) ──

function BugCard({ item, onRefresh }: { item: PanelData['bugs'][0]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);

  const sevColors: Record<string, string> = {
    high: 'text-red-400 bg-red-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    low: 'text-[#5c6078] bg-[#232738]',
  };

  const handleFix = async () => {
    setFixing(true);
    setFixResult(null);
    try {
      const result = await api<{ success: boolean; error?: string }>('/apply-changes', {
        method: 'POST',
        body: {
          instruction: `Fix this bug: ${item.issue}. Severity: ${item.severity}. Affected flow: ${item.affectedFlow}.`,
          files: [],
        },
      });
      setFixResult(result.success ? 'Fix applied successfully.' : `Fix failed: ${result.error || 'Unknown error'}`);
      onRefresh();
    } catch (err: any) {
      setFixResult(`Error: ${err.message}`);
    }
    setFixing(false);
  };

  return (
    <div
      className={`bg-[#1c1f2e] rounded-lg border transition-all cursor-pointer ${expanded ? 'border-red-500/20' : 'border-[#2a2d3e] hover:border-[#3a3d4e]'}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${sevColors[item.severity] || sevColors.low} uppercase font-medium shrink-0`}>{item.severity}</span>
          <span className="text-[12px] text-[#e1e4ed] truncate">{item.issue.slice(0, 60)}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-[#2a2d3e] pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
          {/* Plain language explanation */}
          <div className="text-[11px] text-[#8b8fa7] leading-relaxed">
            <span className="text-[#e1e4ed] font-medium">The issue:</span> {item.issue}
          </div>
          <div className="text-[11px] text-[#8b8fa7] leading-relaxed">
            <span className="text-[#e1e4ed] font-medium">What fixing it does:</span>{' '}
            {item.severity === 'high' && 'This is critical — it could cause the app to break or behave incorrectly for users.'}
            {item.severity === 'medium' && 'This is a moderate issue — it affects quality but the app still works.'}
            {item.severity === 'low' && 'This is a minor issue — fixing it improves code quality.'}
          </div>
          <div className="text-[10px] text-[#5c6078]">
            Flow: <span className="text-[#8b8fa7]">{item.affectedFlow}</span> · Confidence: {Math.round(item.confidence * 100)}%
          </div>

          {/* Fix button */}
          <button
            onClick={handleFix}
            disabled={fixing}
            className={`w-full mt-1 text-[11px] font-medium rounded-lg py-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
              item.severity === 'high'
                ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300'
            }`}
          >
            {fixing ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Fixing...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 1L4 11M3 4L1 6l2 2M9 4l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Auto-Fix This
              </>
            )}
          </button>

          {fixResult && (
            <div className={`text-[10px] p-2 rounded-md ${fixResult.startsWith('Error') ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
              {fixResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
