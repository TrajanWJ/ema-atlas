# EMA Proposal Comparison Feature

Build side-by-side proposal comparison. Follow these steps exactly.

## STEP 1: Backend — daemon/lib/ema/proposals/proposals.ex

Add these two functions after `list_proposals`:

```elixir
def get_proposals_for_project(project_id) do
  Proposal
  |> where([p], p.project_id == ^project_id)
  |> order_by(desc: :inserted_at)
  |> Repo.all()
end

def compare_proposals(proposal_ids) when is_list(proposal_ids) do
  Proposal
  |> where([p], p.id in ^proposal_ids)
  |> preload([:tags])
  |> Repo.all()
end
```

## STEP 2: Backend — daemon/lib/ema_web/controllers/proposal_controller.ex

Add this action BEFORE the `# ── Private helpers` section:

```elixir
@doc """
GET /api/proposals/compare?ids[]=id1&ids[]=id2
Compare multiple proposals by IDs.
"""
def compare(conn, %{"ids" => ids}) when is_list(ids) do
  proposals = Proposals.compare_proposals(ids) |> Enum.map(&serialize_proposal/1)
  json(conn, %{proposals: proposals})
end

def compare(conn, _params) do
  conn |> put_status(:bad_request) |> json(%{error: "ids parameter required"})
end
```

## STEP 3: Backend — daemon/lib/ema_web/router.ex

Add this line BEFORE `get "/proposals/:id", ProposalController, :show`:

```
get "/proposals/compare", ProposalController, :compare
```

## STEP 4: Frontend — app/src/stores/proposals-store.ts

In the `ProposalsState` interface, add:
```typescript
selectedForComparison: string[];
toggleComparisonSelection: (id: string) => void;
clearComparisonSelection: () => void;
compareProposals: (ids: string[]) => Promise<Proposal[]>;
```

In the `create<ProposalsState>((set) => ({` body, add these alongside the existing state/actions:

```typescript
selectedForComparison: [],

toggleComparisonSelection(id) {
  set((state) => {
    const selected = state.selectedForComparison;
    if (selected.includes(id)) {
      return { selectedForComparison: selected.filter((s) => s !== id) };
    }
    if (selected.length >= 3) return state; // max 3
    return { selectedForComparison: [...selected, id] };
  });
},

clearComparisonSelection() {
  set({ selectedForComparison: [] });
},

async compareProposals(ids) {
  const params = ids.map((id) => `ids[]=${id}`).join('&');
  const data = await api.get<{ proposals: Proposal[] }>(`/proposals/compare?${params}`);
  return data.proposals;
},
```

## STEP 5: Frontend — Create app/src/components/proposals/ProposalComparison.tsx

```tsx
import { useState } from 'react';
import type { Proposal } from '@/types/proposals';
import { useProposalsStore } from '@/stores/proposals-store';

interface ProposalComparisonProps {
  proposals: Proposal[];
  onBack: () => void;
}

function scoreColor(score: number | null): string {
  if (score === null) return 'var(--pn-text-muted)';
  if (score >= 7) return '#22c55e';
  if (score >= 4) return '#f59e0b';
  return '#ef4444';
}

function wordDiff(text: string, otherText: string): React.ReactNode[] {
  const words = text.split(/(\s+)/);
  const otherWords = new Set(otherText.toLowerCase().split(/\s+/));
  return words.map((word, i) => {
    const isWhitespace = /^\s+$/.test(word);
    if (isWhitespace) return word;
    const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isUnique = clean.length > 2 && !otherWords.has(clean);
    return isUnique ? (
      <mark key={i} style={{ background: 'rgba(251,191,36,0.2)', color: 'inherit', borderRadius: '2px' }}>
        {word}
      </mark>
    ) : word;
  });
}

export function ProposalComparison({ proposals, onBack }: ProposalComparisonProps) {
  const approve = useProposalsStore((s) => s.approve);
  const [dispatching, setDispatching] = useState<string | null>(null);

  async function handleDispatch(id: string) {
    setDispatching(id);
    try {
      await approve(id);
      onBack();
    } finally {
      setDispatching(null);
    }
  }

  const colWidth = proposals.length === 2 ? '50%' : '33.333%';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="text-[0.7rem] px-2 py-1 rounded transition-opacity hover:opacity-80"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--pn-border-default)',
            color: 'var(--pn-text-secondary)',
          }}
        >
          ← Back
        </button>
        <h2
          className="text-[0.9rem] font-semibold"
          style={{ color: 'var(--pn-text-primary)' }}
        >
          Compare Proposals
        </h2>
        <span className="text-[0.65rem]" style={{ color: 'var(--pn-text-muted)' }}>
          {proposals.length} proposals
        </span>
      </div>

      {/* Columns */}
      <div className="flex flex-1 min-h-0 gap-3 overflow-hidden">
        {proposals.map((proposal, idx) => {
          const otherProposals = proposals.filter((_, i) => i !== idx);
          const otherText = otherProposals.map((p) => `${p.title} ${p.summary} ${p.body}`).join(' ');
          const combinedScore = proposal.idea_score !== null && proposal.prompt_quality_score !== null
            ? ((proposal.idea_score ?? 0) + (proposal.prompt_quality_score ?? 0)) / 2
            : proposal.idea_score ?? proposal.quality_score ?? null;

          return (
            <div
              key={proposal.id}
              className="glass-surface flex flex-col rounded-xl overflow-hidden"
              style={{ width: colWidth, flexShrink: 0, flexGrow: 1 }}
            >
              {/* Column header */}
              <div
                className="px-4 py-3"
                style={{ borderBottom: '1px solid var(--pn-border-subtle)' }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3
                    className="text-[0.8rem] font-semibold leading-snug"
                    style={{ color: 'var(--pn-text-primary)' }}
                  >
                    {proposal.title}
                  </h3>
                  {combinedScore !== null && (
                    <span
                      className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        color: scoreColor(combinedScore),
                        background: `${scoreColor(combinedScore)}22`,
                      }}
                    >
                      {combinedScore.toFixed(1)}
                    </span>
                  )}
                </div>
                <span className="text-[0.6rem]" style={{ color: 'var(--pn-text-muted)' }}>
                  {new Date(proposal.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {proposal.summary && (
                  <div>
                    <div className="text-[0.6rem] uppercase tracking-wider mb-1" style={{ color: 'var(--pn-text-muted)' }}>
                      Summary
                    </div>
                    <p className="text-[0.72rem] leading-relaxed" style={{ color: 'var(--pn-text-secondary)' }}>
                      {proposals.length > 1 ? wordDiff(proposal.summary, otherText) : proposal.summary}
                    </p>
                  </div>
                )}

                {proposal.body && (
                  <div>
                    <div className="text-[0.6rem] uppercase tracking-wider mb-1" style={{ color: 'var(--pn-text-muted)' }}>
                      Full Proposal
                    </div>
                    <div
                      className="text-[0.7rem] leading-relaxed whitespace-pre-wrap"
                      style={{ color: 'var(--pn-text-secondary)' }}
                    >
                      {proposals.length > 1 ? wordDiff(proposal.body, otherText) : proposal.body}
                    </div>
                  </div>
                )}

                {proposal.score_breakdown && Object.keys(proposal.score_breakdown).length > 0 && (
                  <div>
                    <div className="text-[0.6rem] uppercase tracking-wider mb-1" style={{ color: 'var(--pn-text-muted)' }}>
                      Scores
                    </div>
                    <div className="flex flex-col gap-1">
                      {Object.entries(proposal.score_breakdown).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-[0.62rem]" style={{ color: 'var(--pn-text-muted)' }}>
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[0.65rem] font-medium" style={{ color: scoreColor(typeof val === 'number' ? val : null) }}>
                            {typeof val === 'number' ? val.toFixed(1) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dispatch button */}
              <div className="px-4 py-3" style={{ borderTop: '1px solid var(--pn-border-subtle)' }}>
                <button
                  onClick={() => handleDispatch(proposal.id)}
                  disabled={dispatching === proposal.id}
                  className="w-full text-[0.7rem] font-medium py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{
                    background: 'rgba(34,197,94,0.14)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    color: '#22c55e',
                  }}
                >
                  {dispatching === proposal.id ? 'Dispatching...' : 'Dispatch This One'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## STEP 6: Frontend — Replace app/src/components/proposals/ProposalQueue.tsx

Replace the entire file with:

```tsx
import { useMemo, useState } from 'react';
import { useProposalsStore } from '@/stores/proposals-store';
import { ProposalCard } from './ProposalCard';
import { ProposalComparison } from './ProposalComparison';
import { GlassSelect } from '@/components/ui/GlassSelect';
import type { Proposal, ProposalSortKey } from '@/types/proposals';

function combinedRank(p: Proposal): number {
  const idea = p.idea_score ?? 0;
  const prompt = p.prompt_quality_score ?? 0;
  return (idea + prompt) / 2;
}

function getSortValue(p: Proposal, key: ProposalSortKey): number {
  switch (key) {
    case 'idea_score': return p.idea_score ?? 0;
    case 'prompt_quality_score': return p.prompt_quality_score ?? 0;
    case 'combined_rank': return combinedRank(p);
    case 'confidence': return p.confidence ?? 0;
    case 'created_at': return new Date(p.created_at).getTime();
  }
}

const SORT_OPTIONS: readonly { readonly value: ProposalSortKey; readonly label: string }[] = [
  { value: 'combined_rank', label: 'Rank' },
  { value: 'idea_score', label: 'Idea Score' },
  { value: 'prompt_quality_score', label: 'Prompt Quality' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'created_at', label: 'Date' },
];

export function ProposalQueue() {
  const proposals = useProposalsStore((s) => s.proposals);
  const sortKey = useProposalsStore((s) => s.sortKey);
  const sortDir = useProposalsStore((s) => s.sortDir);
  const filterMinScore = useProposalsStore((s) => s.filterMinScore);
  const setSortKey = useProposalsStore((s) => s.setSortKey);
  const setSortDir = useProposalsStore((s) => s.setSortDir);
  const setFilterMinScore = useProposalsStore((s) => s.setFilterMinScore);
  const selectedForComparison = useProposalsStore((s) => s.selectedForComparison);
  const toggleComparisonSelection = useProposalsStore((s) => s.toggleComparisonSelection);
  const clearComparisonSelection = useProposalsStore((s) => s.clearComparisonSelection);
  const compareProposals = useProposalsStore((s) => s.compareProposals);

  const [comparing, setComparing] = useState(false);
  const [comparisonProposals, setComparisonProposals] = useState<Proposal[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const sorted = useMemo(() => {
    const queued = proposals.filter(
      (p) => p.status === 'queued' || p.status === 'reviewing'
    );
    const filtered = filterMinScore > 0
      ? queued.filter((p) => combinedRank(p) >= filterMinScore)
      : queued;
    return [...filtered].sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [proposals, sortKey, sortDir, filterMinScore]);

  async function handleCompare() {
    if (selectedForComparison.length < 2) return;
    setLoadingCompare(true);
    try {
      const fetched = await compareProposals(selectedForComparison);
      setComparisonProposals(fetched);
      setComparing(true);
    } finally {
      setLoadingCompare(false);
    }
  }

  function handleBack() {
    setComparing(false);
    setComparisonProposals([]);
    clearComparisonSelection();
  }

  if (comparing) {
    return <ProposalComparison proposals={comparisonProposals} onBack={handleBack} />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-3 px-1 py-2 flex-wrap"
        style={{ borderBottom: '1px solid var(--pn-border-subtle)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[0.6rem] uppercase tracking-wider" style={{ color: 'var(--pn-text-muted)' }}>
            Sort
          </span>
          <GlassSelect
            value={sortKey}
            onChange={(val) => setSortKey(val as ProposalSortKey)}
            options={SORT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            size="sm"
          />
          <button
            onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
            className="text-[0.7rem] px-1.5 py-0.5 rounded transition-opacity hover:opacity-80"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--pn-border-default)',
              color: 'var(--pn-text-secondary)',
            }}
            title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
          >
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[0.6rem] uppercase tracking-wider" style={{ color: 'var(--pn-text-muted)' }}>
            Min Score
          </span>
          <input
            type="range" min={0} max={10} step={0.5}
            value={filterMinScore}
            onChange={(e) => setFilterMinScore(Number(e.target.value))}
            className="w-16 h-1 accent-purple-400"
          />
          <span className="text-[0.6rem] w-4 text-right" style={{ color: 'var(--pn-text-secondary)' }}>
            {filterMinScore > 0 ? filterMinScore.toFixed(1) : '—'}
          </span>
        </div>

        {selectedForComparison.length > 0 ? (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[0.6rem]" style={{ color: 'var(--pn-text-muted)' }}>
              {selectedForComparison.length} selected
            </span>
            <button
              onClick={handleCompare}
              disabled={selectedForComparison.length < 2 || loadingCompare}
              className="text-[0.65rem] font-medium px-2 py-1 rounded transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8',
              }}
            >
              {loadingCompare ? 'Loading...' : 'Compare Selected'}
            </button>
            <button
              onClick={clearComparisonSelection}
              className="text-[0.6rem] px-1.5 py-0.5 rounded transition-opacity hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--pn-border-subtle)',
                color: 'var(--pn-text-muted)',
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="text-[0.6rem] ml-auto" style={{ color: 'var(--pn-text-muted)' }}>
            {sorted.length} proposal{sorted.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-[0.75rem]" style={{ color: 'var(--pn-text-muted)' }}>
            {filterMinScore > 0 ? 'No proposals above minimum score' : 'No proposals in queue'}
          </span>
        </div>
      ) : (
        sorted.map((proposal) => (
          <div key={proposal.id} className="flex items-start gap-2">
            <label className="flex items-center pt-3 pl-1 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedForComparison.includes(proposal.id)}
                onChange={() => toggleComparisonSelection(proposal.id)}
                disabled={!selectedForComparison.includes(proposal.id) && selectedForComparison.length >= 3}
                className="w-3 h-3 accent-indigo-400 cursor-pointer"
                title="Select for comparison"
              />
            </label>
            <div className="flex-1 min-w-0">
              <ProposalCard proposal={proposal} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

## STEP 7: Verify & Commit

Run:
```bash
cd ~/Projects/ema/daemon && mix compile 2>&1 | tail -20
cd ~/Projects/ema/app && npm run build 2>&1 | tail -20
```

Fix any compile errors. Then commit:
```bash
cd ~/Projects/ema && git add -A && git commit -m "feat: Proposal Comparison — side-by-side multi-proposal viewer"
```
