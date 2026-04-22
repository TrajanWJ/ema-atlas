import { getActiveSession, getSessionHealth, getLastKnownPath } from '../session.ts';

export function getStatus() {
  const health = getSessionHealth();
  const session = getActiveSession();

  if (!session) {
    const lastPath = getLastKnownPath();
    return {
      active: false,
      lastKnownPath: lastPath,
      canAutoRecover: lastPath !== null,
      nextStep: lastPath
        ? `Call analyze_repo with path "${lastPath}" to restore the session.`
        : 'Call analyze_repo with the absolute path to your project directory.',
      hint: 'The MCP server is running but no project is indexed yet.',
    };
  }

  const memory = session.memory;

  return {
    active: true,
    repoPath: session.repoPath,
    indexedAt: new Date(session.indexedAt).toISOString(),
    sessionAge: `${Math.round((Date.now() - session.indexedAt) / 1000)}s`,
    stale: health.stale,
    graph: {
      nodes: session.graph.nodes.size,
      edges: session.graph.edges.length,
    },
    health: memory.health,
    iteration: memory.iteration,
    decisions: memory.decisions.length,
    experiences: memory.experiences?.length ?? 0,
    changedFiles: memory.changedFiles?.length ?? 0,
    failedSteps: Array.isArray(memory.failedStepIds) ? memory.failedStepIds.length : (memory.failedStepIds as any)?.size ?? 0,
    infrastructure: session.infrastructure ? {
      database: session.infrastructure.database?.provider ?? 'none',
      dbRunning: session.infrastructure.database?.isRunning ?? false,
      services: session.infrastructure.services.length,
      missingEnvVars: session.infrastructure.envVars.filter(v => v.required && !v.hasValue).length,
    } : null,
    routes: session.routes ? {
      total: session.routes.totalRoutes,
      protected: session.routes.protectedRoutes,
      unprotected: session.routes.unprotectedRoutes,
    } : null,
    snapshotAvailable: session.snapshot.size > 0,
    nextStep: health.stale
      ? `Session is stale (${Math.round((Date.now() - session.indexedAt) / 1000)}s old). Next tool call will auto-refresh.`
      : 'Session is active. You can call get_gaps, apply_task, ask_codebase, or simulate_flow.',
  };
}
