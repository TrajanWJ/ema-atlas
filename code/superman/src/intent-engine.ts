import { callClaude, safeParseJSON, buildPrompt } from './ai/claude-client.js';
import { log, logError } from './logger.js';
import { KnowledgeGraph } from './graph/knowledge-graph.js';
import { getCallChain, getReverseDependencies } from './graph/traversal.js';
import type { ProjectModel, ProjectIntent, CodeNode } from './types.js';

/**
 * Infer what this project is, what it's trying to become,
 * and what capabilities are implied but missing.
 */
export async function inferIntent(
  model: ProjectModel,
  graph: KnowledgeGraph,
): Promise<ProjectIntent> {
  log('intent', 'Inferring project intent from world model');

  // 1. Structural analysis — what patterns exist?
  const structural = analyzeStructure(model, graph);

  // 2. LLM synthesis — interpret the structure into intent
  const intent = await synthesizeIntent(structural, model);

  log('intent', 'Intent inference complete', {
    appType: intent.appType,
    current: intent.currentCapabilities.length,
    intended: intent.intendedCapabilities.length,
    missing: intent.missingSystems.length,
  });

  return intent;
}

interface StructuralSignals {
  domains: string[];
  routePatterns: { method: string; path: string }[];
  entityNames: string[];
  systemNames: string[];
  hasAuth: boolean;
  hasDatabase: boolean;
  hasAPI: boolean;
  hasFrontend: boolean;
  hasTesting: boolean;
  hasMiddleware: boolean;
  hasValidation: boolean;
  hasErrorHandling: boolean;
  hasLogging: boolean;
  flowCount: number;
  orphanedFunctions: number;
  languages: string[];
}

function analyzeStructure(model: ProjectModel, graph: KnowledgeGraph): StructuralSignals {
  const stats = graph.getStats();
  const allNodes = Array.from(
    new Set(model.systems.flatMap((s) => s.nodeIds)),
  ).map((id) => graph.getNode(id)).filter(Boolean) as CodeNode[];

  // Extract domains from systems
  const domains = [...new Set(model.systems.map((s) => s.domain))];
  const systemNames = model.systems.map((s) => s.name);

  // Extract route patterns
  const routeNodes = graph.findByType('route');
  const routePatterns = routeNodes.map((n) => ({
    method: n.metadata.httpMethod || 'GET',
    path: n.metadata.routePath || n.name,
  }));

  // Entity analysis
  const entityNames = model.entities.map((e) => e.name);

  // Capability detection via content scanning
  const allContent = allNodes.map((n) => n.content).join('\n');
  const hasAuth = domains.includes('auth') || /jwt|token|auth|session|passport|bcrypt/i.test(allContent);
  const hasDatabase = domains.includes('database') || /prisma|sequelize|mongoose|typeorm|knex|pg\.|mysql|sqlite|\.query\(|\.find\(|\.create\(/i.test(allContent);
  const hasAPI = routePatterns.length > 0 || /express|fastify|koa|router\.|app\.(get|post|put|delete)/i.test(allContent);
  const hasFrontend = /react|vue|angular|svelte|next|nuxt|\.tsx|\.jsx|component|useState|useEffect/i.test(allContent);
  const hasTesting = /describe\(|it\(|test\(|expect\(|jest|mocha|vitest|pytest|assert/i.test(allContent);
  const hasMiddleware = /middleware|app\.use\(|router\.use\(/i.test(allContent);
  const hasValidation = /zod|yup|joi|validator|\.validate\(|\.parse\(|schema/i.test(allContent);
  const hasErrorHandling = /try\s*\{|\.catch\(|catch\s*\(|error.handler|errorHandler/i.test(allContent);
  const hasLogging = /logger|winston|pino|console\.log|log\.(info|error|warn|debug)/i.test(allContent);

  // Orphaned functions (no callers, not exported)
  const functions = graph.findByType('function');
  let orphanedFunctions = 0;
  for (const fn of functions) {
    if (fn.metadata.exported) continue;
    const deps = getReverseDependencies(graph, fn.id);
    if (deps.length === 0) orphanedFunctions++;
  }

  // Languages used
  const languages = [...new Set(allNodes.map((n) => n.language).filter((l) => l !== 'unknown'))];

  return {
    domains,
    routePatterns,
    entityNames,
    systemNames,
    hasAuth,
    hasDatabase,
    hasAPI,
    hasFrontend,
    hasTesting,
    hasMiddleware,
    hasValidation,
    hasErrorHandling,
    hasLogging,
    flowCount: model.flows.length,
    orphanedFunctions,
    languages,
  };
}

async function synthesizeIntent(
  signals: StructuralSignals,
  model: ProjectModel,
): Promise<ProjectIntent> {
  const systemSummary = model.systems
    .map((s) => `- ${s.name} (${s.domain}): ${s.nodeIds.length} nodes, ${Math.round(s.completeness * 100)}% complete. Issues: ${s.issues.join(', ') || 'none'}`)
    .join('\n');

  const flowSummary = model.flows
    .map((f) => `- ${f.name}: ${f.steps.length} steps, ${f.complete ? 'complete' : 'INCOMPLETE'}${f.gaps.length ? '. Gaps: ' + f.gaps.join(', ') : ''}`)
    .join('\n');

  const entitySummary = model.entities
    .map((e) => `- ${e.name}: ${e.fields.length} fields, used by ${e.usedBy.length} nodes`)
    .join('\n');

  const prompt = `Analyze this codebase and determine its intent.

## Structural Signals
- Languages: ${signals.languages.join(', ')}
- Domains detected: ${signals.domains.join(', ')}
- Routes: ${signals.routePatterns.length} endpoints (${signals.routePatterns.map((r) => `${r.method} ${r.path}`).join(', ')})
- Auth: ${signals.hasAuth}, Database: ${signals.hasDatabase}, API: ${signals.hasAPI}
- Frontend: ${signals.hasFrontend}, Testing: ${signals.hasTesting}
- Middleware: ${signals.hasMiddleware}, Validation: ${signals.hasValidation}
- Error handling: ${signals.hasErrorHandling}, Logging: ${signals.hasLogging}
- Flows: ${signals.flowCount}, Orphaned functions: ${signals.orphanedFunctions}

## Systems
${systemSummary || '(none detected)'}

## Flows
${flowSummary || '(none detected)'}

## Entities
${entitySummary || '(none detected)'}

Respond ONLY with valid JSON (no markdown fences):
{
  "appType": "short description of what this application is",
  "currentCapabilities": ["list of things the code can currently do"],
  "intendedCapabilities": ["list of things the code structure implies it SHOULD do but doesn't fully"],
  "missingSystems": ["list of systems/modules that are expected but absent or severely incomplete"]
}

Be specific. Infer intent from the structure — if there's auth but no rate limiting, that's an intended capability. If there are user routes but no email verification, that's missing. If there are models but no validation, that's a gap.`;

  try {
    const response = await callClaude(prompt, 'intent');
    const parsed = safeParseJSON<ProjectIntent>(response);
    if (parsed.ok) {
      return parsed.data;
    }
    logError('intent', 'Failed to parse intent response, using structural fallback', parsed.raw);
    return buildFallbackIntent(signals);
  } catch (error) {
    logError('intent', 'LLM intent synthesis failed, using structural fallback', error);
    return buildFallbackIntent(signals);
  }
}

function buildFallbackIntent(signals: StructuralSignals): ProjectIntent {
  const current: string[] = [];
  const intended: string[] = [];
  const missing: string[] = [];

  if (signals.hasAPI) current.push('HTTP API endpoints');
  if (signals.hasAuth) current.push('Authentication');
  if (signals.hasDatabase) current.push('Database access');
  if (signals.hasFrontend) current.push('Frontend UI');
  if (signals.hasMiddleware) current.push('Middleware pipeline');
  if (signals.hasLogging) current.push('Logging');

  // Infer intended from what exists
  if (signals.hasAPI && !signals.hasValidation) {
    intended.push('Input validation');
    missing.push('validation');
  }
  if (signals.hasAuth && !signals.hasMiddleware) {
    intended.push('Auth middleware');
    missing.push('auth-middleware');
  }
  if (signals.hasAPI && !signals.hasErrorHandling) {
    intended.push('Error handling');
    missing.push('error-handling');
  }
  if (signals.hasAPI && !signals.hasTesting) {
    intended.push('API tests');
    missing.push('testing');
  }
  if (signals.hasDatabase && !signals.hasAuth) {
    intended.push('Authentication layer');
    missing.push('auth');
  }

  let appType = 'Application';
  if (signals.hasAPI && signals.hasDatabase) appType = 'Backend API service';
  if (signals.hasFrontend && signals.hasAPI) appType = 'Full-stack web application';
  if (signals.hasFrontend && !signals.hasAPI) appType = 'Frontend application';

  return { appType, currentCapabilities: current, intendedCapabilities: intended, missingSystems: missing };
}
