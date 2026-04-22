/**
 * ask_codebase — Returns structured project context for Claude to reason over.
 *
 * Does NOT call Claude internally. Assembles all available context
 * (infrastructure, routes, schema, graph) and returns it so the MCP
 * client (Claude Code, Cursor, etc.) can answer the question itself.
 */

import { getOrRecoverSession } from '../session.ts';
import { buildProjectContext, classifyQuestion } from '../../src/intelligence/project-qa.ts';
import type { QAContext } from '../../src/intelligence/project-qa.ts';

export async function askCodebase(question: string) {
  const session = await getOrRecoverSession('ask_codebase');

  const category = classifyQuestion(question);

  const context: QAContext = {
    infrastructure: session.infrastructure,
    routes: session.routes,
    graph: session.graph,
    model: session.model,
  };

  const contextStr = buildProjectContext(context);

  // Find files relevant to the question
  const words = question.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const relevantFiles: string[] = [];
  for (const node of session.graph.nodes.values()) {
    const text = `${node.name} ${node.filePath} ${(node.content || '').slice(0, 200)}`.toLowerCase();
    if (words.some(w => text.includes(w))) {
      if (!relevantFiles.includes(node.filePath)) {
        relevantFiles.push(node.filePath);
      }
      if (relevantFiles.length >= 10) break;
    }
  }

  return {
    category,
    context: contextStr,
    relevantFiles,
    infrastructure: session.infrastructure ? {
      database: session.infrastructure.database?.provider ?? 'none',
      dbRunning: session.infrastructure.database?.isRunning ?? false,
      models: session.infrastructure.database?.models.map(m => ({
        name: m.name,
        fieldCount: m.fields.length,
        relations: m.relations.length,
      })) ?? [],
      services: session.infrastructure.services.map(s => ({
        name: s.name,
        configured: s.missingEnvVars.length === 0,
        missing: s.missingEnvVars,
      })),
    } : null,
    routes: session.routes ? {
      total: session.routes.totalRoutes,
      protected: session.routes.protectedRoutes,
      unprotected: session.routes.unprotectedRoutes,
      list: session.routes.routes.slice(0, 20).map(r => ({
        method: r.method,
        path: r.path,
        auth: r.auth.required ? r.auth.type : 'none',
        roles: r.auth.roles,
        file: r.filePath,
      })),
    } : null,
  };
}
