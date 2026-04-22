from pathlib import Path

path = Path('/tmp/HQApp.tsx')
text = path.read_text()

text = text.replace('''type IntentNode = {
  readonly intent: {
    readonly id: string;
    readonly title: string;
    readonly status: string;
    readonly phase?: string | null;
    readonly project_id?: string | null;
    readonly description?: string | null;
  };
  readonly children: readonly IntentNode[];
};
''', '''type IntentNode = {
  readonly intent: {
    readonly id: string;
    readonly title: string;
    readonly status: string;
    readonly phase?: string | null;
    readonly project_id?: string | null;
    readonly description?: string | null;
  };
  readonly children: readonly IntentNode[];
};

type OperatorAction = {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly tone: string;
  readonly disabled?: boolean;
  readonly onRun: () => Promise<void>;
};
''')

text = text.replace('''  const [chronicleSessions, setChronicleSessions] = useState<ChronicleSessionRecord[]>([]);
  const [intentTree, setIntentTree] = useState<IntentNode[]>([]);
''', '''  const [chronicleSessions, setChronicleSessions] = useState<ChronicleSessionRecord[]>([]);
  const [intentTree, setIntentTree] = useState<IntentNode[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [runningActionId, setRunningActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
''')

text = text.replace('''  const blockedExecutions = executions.filter((execution) => ["awaiting_approval", "failed"].includes(execution.status));
  const activeIntents = intents.filter((intent) => intent.status === "active" || intent.status === "implementing");
''', '''  const blockedExecutions = executions.filter((execution) => ["awaiting_approval", "failed"].includes(execution.status));
  const activeIntents = intents.filter((intent) => intent.status === "active" || intent.status === "implementing");

  useEffect(() => {
    if (selectedProjectId && activeProjects.some((project) => project.id === selectedProjectId)) return;
    setSelectedProjectId(activeProjects[0]?.id ?? null);
  }, [activeProjects, selectedProjectId]);

  const selectedProject = activeProjects.find((project) => project.id === selectedProjectId) ?? null;
  const scopedGoals = selectedProject
    ? activeGoals.filter((goal) => goal.project_id === selectedProject.id)
    : activeGoals;
  const scopedIntents = selectedProject
    ? activeIntents.filter((intent) => intent.project_id === selectedProject.id)
    : activeIntents;
  const scopeHealthLabel = selectedProject
    ? `${scopedIntents.length} intents · ${scopedGoals.length} active goals`
    : `${activeIntents.length} intents · ${activeGoals.length} active goals`;
''')

text = text.replace('''  const operatorNarrative = useMemo(() => {
    const scopeLabel = activeProjects[0]?.name || activeSpaces[0]?.name || "the current working space";
    const ingressCount = chronicleSessions.length;
    const attentionCount = attentionLedger.length;
    return `Use HQ as the operator shell for ${scopeLabel}: confirm scope, inspect live intent load, convert fresh chronicle ingress into durable work, then clear proposals and executions before backlog turns into drift. ${ingressCount} recent chronicle sessions and ${attentionCount} active attention items are visible right now.`;
  }, [activeProjects, activeSpaces, chronicleSessions.length, attentionLedger.length]);
''', '''  const operatorNarrative = useMemo(() => {
    const scopeLabel = selectedProject?.name || activeProjects[0]?.name || activeSpaces[0]?.name || "the current working space";
    const ingressCount = chronicleSessions.length;
    const attentionCount = attentionLedger.length;
    return `Use HQ as the operator shell for ${scopeLabel}: confirm scope, inspect live intent load, convert fresh chronicle ingress into durable work, then clear proposals and executions before backlog turns into drift. ${ingressCount} recent chronicle sessions and ${attentionCount} active attention items are visible right now.`;
  }, [selectedProject, activeProjects, activeSpaces, chronicleSessions.length, attentionLedger.length]);

  async function runOperatorAction(action: OperatorAction) {
    setRunningActionId(action.id);
    setActionError(null);
    try {
      await action.onRun();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "operator_action_failed");
    } finally {
      setRunningActionId(null);
    }
  }

  const operatorActions = useMemo<OperatorAction[]>(() => {
    const firstApproval = blockedExecutions.find((execution) => execution.status === "awaiting_approval") ?? null;
    const firstProposal = queuedProposals[0] ?? null;
    const firstScopeGap = scopedGoals.find((goal) => !goal.intent_slug) ?? null;
    const actions: OperatorAction[] = [];

    if (firstApproval) {
      actions.push({
        id: `approve-execution-${firstApproval.id}`,
        title: "Approve waiting execution",
        detail: `${firstApproval.title || firstApproval.intent_slug || "Untitled execution"} · ${firstApproval.mode}`,
        tone: "#38bdf8",
        onRun: async () => {
          await api.post(`/executions/${firstApproval.id}/approve`, {});
          setExecutions((current) => current.map((execution) => (
            execution.id === firstApproval.id
              ? { ...execution, status: "approved", updated_at: new Date().toISOString() }
              : execution
          )));
        },
      });
    }

    if (firstProposal) {
      actions.push({
        id: `approve-proposal-${firstProposal.id}`,
        title: "Approve top proposal",
        detail: `${firstProposal.title} · ${firstProposal.status}`,
        tone: "#a78bfa",
        onRun: async () => {
          const data = await api.post<{ proposal: ProposalRecord }>(`/proposals/${firstProposal.id}/approve`, {
            actor_id: "actor_human_owner",
          });
          setProposals((current) => current.map((proposal) => (
            proposal.id === firstProposal.id ? data.proposal : proposal
          )));
        },
      });

      actions.push({
        id: `reject-proposal-${firstProposal.id}`,
        title: "Reject for tighter scope",
        detail: `${firstProposal.title} goes back for revision instead of drifting in queue.`,
        tone: "#f59e0b",
        onRun: async () => {
          const data = await api.post<{ proposal: ProposalRecord }>(`/proposals/${firstProposal.id}/reject`, {
            actor_id: "actor_human_owner",
            reason: "Tighten scope and revise execution plan",
          });
          setProposals((current) => current.map((proposal) => (
            proposal.id === firstProposal.id ? data.proposal : proposal
          )));
        },
      });
    }

    if (firstScopeGap) {
      actions.push({
        id: `focus-goal-gap-${firstScopeGap.id}`,
        title: "Inspect scope gap",
        detail: `${firstScopeGap.title} is active but still lacks a linked intent slug.`,
        tone: "#34d399",
        onRun: async () => {
          await openApp("goals");
        },
      });
    }

    if (actions.length > 0) return actions;

    return [{
      id: "open-governance-default",
      title: "Open governance surfaces",
      detail: "No immediate approve/reject actions detected, so inspect proposals and executions directly.",
      tone: "#94a3b8",
      onRun: async () => {
        await openApp("governance");
      },
    }];
  }, [blockedExecutions, queuedProposals, scopedGoals]);
''')

text = text.replace('''        {error ? (
          <div style={{ borderRadius: 14, padding: "10px 12px", background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.95fr", gap: 16, minHeight: 0 }}>
''', '''        {error ? (
          <div style={{ borderRadius: 14, padding: "10px 12px", background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        ) : null}

        {actionError ? (
          <div style={{ borderRadius: 14, padding: "10px 12px", background: "rgba(245,158,11,0.1)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.22)" }}>
            {actionError}
          </div>
        ) : null}

        <Panel eyebrow="Scope Thread" title="Thread the shell through one selected project before reviewing downstream work" actionLabel="Open Projects" onAction={() => void openApp("projects")}>
          {loading ? <EmptyState label="Loading project thread..." /> : (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {activeProjects.slice(0, 6).map((project) => {
                  const selected = project.id === selectedProjectId;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedProjectId(project.id)}
                      style={{
                        borderRadius: 999,
                        padding: "8px 12px",
                        border: selected ? "1px solid rgba(45,212,168,0.45)" : "1px solid rgba(255,255,255,0.08)",
                        background: selected ? "rgba(45,212,168,0.12)" : "rgba(255,255,255,0.04)",
                        color: selected ? "#6ee7b7" : "var(--pn-text-secondary)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: selected ? 700 : 500,
                      }}
                    >
                      {project.name}
                    </button>
                  );
                })}
                {activeProjects.length === 0 ? <EmptyState label="No active projects available for focus selection." /> : null}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 12 }}>
                <div style={{ borderRadius: 18, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,8,14,0.34)" }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--pn-text-muted)", fontWeight: 700 }}>Focused scope</div>
                  <div style={{ marginTop: 8, color: "rgba(255,255,255,0.94)", fontSize: 18, fontWeight: 650 }}>
                    {selectedProject?.name || "All active work"}
                  </div>
                  <div style={{ marginTop: 6, color: "var(--pn-text-secondary)", fontSize: 12, lineHeight: 1.6 }}>
                    {selectedProject?.description || "No project-specific scope selected yet, so HQ is showing the whole active surface."}
                  </div>
                  <div style={{ marginTop: 10, color: "var(--pn-text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    {scopeHealthLabel}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <MetricCard label="Scoped intents" value={String(scopedIntents.length)} detail="Direction attached to this project" tone="#c084fc" compact />
                  <MetricCard label="Scoped goals" value={String(scopedGoals.length)} detail="Active goals visible in thread" tone="#34d399" compact />
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel eyebrow="Operator Action Strip" title="Real actions wired to the live backend, not aspirational controls" actionLabel="Open Governance" onAction={() => void openApp("governance")}>
          {loading ? <EmptyState label="Loading operator actions..." /> : (
            <div style={{ display: "grid", gap: 10 }}>
              {operatorActions.map((action) => {
                const busy = runningActionId === action.id;
                return (
                  <button
                    key={action.id}
                    type="button"
                    disabled={busy || action.disabled}
                    onClick={() => void runOperatorAction(action)}
                    style={{
                      textAlign: "left",
                      borderRadius: 16,
                      padding: "12px 14px",
                      border: `1px solid ${action.tone}30`,
                      background: busy ? "rgba(255,255,255,0.08)" : "rgba(9,11,18,0.45)",
                      cursor: busy ? "progress" : "pointer",
                      opacity: action.disabled ? 0.55 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "rgba(255,255,255,0.92)", fontSize: 13, fontWeight: 600 }}>{action.title}</div>
                        <div style={{ marginTop: 4, color: "var(--pn-text-secondary)", fontSize: 12, lineHeight: 1.55 }}>{action.detail}</div>
                      </div>
                      <span style={{ color: action.tone, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", whiteSpace: "nowrap" }}>
                        {busy ? "Running" : "Run"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.95fr", gap: 16, minHeight: 0 }}>
''')

text = text.replace('''                  {activeProjects.slice(0, 4).map((project) => (
                    <ListRow key={project.id} title={project.name} subtitle={project.description || project.status} meta={project.status} />
                  ))}
''', '''                  {activeProjects.slice(0, 4).map((project) => (
                    <ListRow key={project.id} title={project.name} subtitle={project.description || project.status} meta={project.status} highlighted={project.id === selectedProjectId} />
                  ))}
''')

text = text.replace('''              {loading ? <EmptyState label="Loading intents..." /> : activeIntents.length === 0 ? <EmptyState label="No active intents indexed." /> : (
                <div style={{ display: "grid", gap: 10 }}>
                  {activeIntents.slice(0, 6).map((intent) => (
''', '''              {loading ? <EmptyState label="Loading intents..." /> : scopedIntents.length === 0 ? <EmptyState label="No active intents indexed for the selected scope." /> : (
                <div style={{ display: "grid", gap: 10 }}>
                  {scopedIntents.slice(0, 6).map((intent) => (
''')

text = text.replace('''function ListRow({ title, subtitle, meta }: { readonly title: string; readonly subtitle: string; readonly meta: string; }) {
  return (
    <div style={{ borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,8,14,0.34)" }}>
''', '''function ListRow({ title, subtitle, meta, highlighted = false }: { readonly title: string; readonly subtitle: string; readonly meta: string; readonly highlighted?: boolean; }) {
  return (
    <div style={{ borderRadius: 16, padding: "12px 14px", border: highlighted ? "1px solid rgba(45,212,168,0.28)" : "1px solid rgba(255,255,255,0.06)", background: highlighted ? "rgba(16,185,129,0.08)" : "rgba(6,8,14,0.34)" }}>
''')

path.write_text(text)
