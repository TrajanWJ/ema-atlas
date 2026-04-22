import { callClaude, buildPrompt, safeParseJSON } from '../ai/claude-client.js';
import { log } from '../logger.js';
import type { InfrastructureModel, SchemaModel } from './infrastructure-scanner.js';
import type { RouteMap, RouteInfo } from './route-scanner.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { ProjectModel, GapAnalysis } from '../types.js';

export interface QAContext {
  infrastructure: InfrastructureModel | null;
  routes: RouteMap | null;
  graph: KnowledgeGraph | null;
  model: ProjectModel | null;
  gapAnalysis?: GapAnalysis | null;
}

export interface QAAnswer {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: Array<{ source: string; detail: string }>;
  relatedFiles: string[];
  suggestions?: string[];
  followUpQuestions?: string[];
}

type QuestionCategory = 'security' | 'data' | 'architecture' | 'health' | 'general';

// ── Answer Cache (5min TTL) ──

interface CachedAnswer {
  answer: QAAnswer;
  timestamp: number;
}

const answerCache = new Map<string, CachedAnswer>();
const ANSWER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_ANSWER_CACHE = 30;

function normalizeQuestion(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, ' ');
}

function getCachedAnswer(question: string): QAAnswer | null {
  const key = normalizeQuestion(question);
  const entry = answerCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ANSWER_CACHE_TTL) {
    answerCache.delete(key);
    return null;
  }
  log('infra', 'Answer cache hit', { question: key.slice(0, 60) });
  return entry.answer;
}

function setCachedAnswer(question: string, answer: QAAnswer): void {
  const key = normalizeQuestion(question);
  if (answerCache.size >= MAX_ANSWER_CACHE) {
    const firstKey = answerCache.keys().next().value;
    if (firstKey !== undefined) answerCache.delete(firstKey);
  }
  answerCache.set(key, { answer, timestamp: Date.now() });
}

/**
 * Invalidate the answer cache (e.g., after re-analysis).
 */
export function invalidateAnswerCache(): void {
  const size = answerCache.size;
  answerCache.clear();
  if (size > 0) {
    log('infra', 'Answer cache invalidated', { evicted: size });
  }
}

/**
 * Classify a question to determine what context matters most.
 */
export function classifyQuestion(question: string): QuestionCategory {
  const q = question.toLowerCase();

  const securityPatterns = /\b(auth|login|admin|role|permission|access|protect|secure|session|token|jwt|password|can .* without|who can|unprotected|public)\b/;
  if (securityPatterns.test(q)) return 'security';

  const dataPatterns = /\b(table|model|schema|database|field|column|relation|foreign key|prisma|migration|seed|data|entity|record)\b/;
  if (dataPatterns.test(q)) return 'data';

  const archPatterns = /\b(how does|what calls|depends on|architecture|import|flow|trace|middleware|endpoint|route|api|component|service)\b/;
  if (archPatterns.test(q)) return 'architecture';

  const healthPatterns = /\b(broken|missing|error|bug|gap|health|issue|problem|fix|wrong|failing|vulnerability)\b/;
  if (healthPatterns.test(q)) return 'health';

  return 'general';
}

/**
 * Build a readable context string from available project data.
 */
export function buildProjectContext(context: QAContext): string {
  const parts: string[] = [];

  if (context.infrastructure) {
    const infra = context.infrastructure;

    // Database
    if (infra.database) {
      const db = infra.database;
      parts.push(`## Database`);
      parts.push(`Provider: ${db.provider} (ORM: ${db.orm || 'none'})`);
      parts.push(`Running: ${db.isRunning ? 'YES' : 'NO'}`);
      if (db.models.length > 0) {
        parts.push(`Models (${db.models.length}):`);
        for (const model of db.models) {
          const fields = model.fields.map(f => `${f.name}: ${f.type}${f.isRelation ? ' (relation)' : ''}`).join(', ');
          const relations = model.relations.map(r => `${r.field} → ${r.target} (${r.type})`).join(', ');
          parts.push(`  ${model.name}: { ${fields} }`);
          if (relations) parts.push(`    Relations: ${relations}`);
        }
      }
    }

    // Services
    if (infra.services.length > 0) {
      parts.push(`\n## External Services`);
      for (const svc of infra.services) {
        const status = svc.missingEnvVars.length > 0
          ? `MISSING: ${svc.missingEnvVars.join(', ')}`
          : 'configured';
        parts.push(`  ${svc.name}: ${status}`);
      }
    }

    // Missing env vars
    const missing = infra.envVars.filter(v => v.required && !v.hasValue);
    if (missing.length > 0) {
      parts.push(`\n## Missing Environment Variables`);
      for (const v of missing) {
        parts.push(`  ${v.name} (required by ${v.source})`);
      }
    }

    // Runtime
    if (infra.runtime.framework) {
      parts.push(`\n## Runtime`);
      parts.push(`Framework: ${infra.runtime.framework}`);
      parts.push(`Package manager: ${infra.runtime.packageManager}`);
      if (infra.runtime.nodeVersion) parts.push(`Node: ${infra.runtime.nodeVersion}`);
    }

    // Ports
    const downPorts = infra.ports.filter(p => !p.isListening);
    if (downPorts.length > 0) {
      parts.push(`\n## Services NOT running`);
      for (const p of downPorts) {
        parts.push(`  ${p.service} (port ${p.port}): NOT listening`);
      }
    }
  }

  if (context.routes) {
    const rm = context.routes;
    parts.push(`\n## API Routes (${rm.totalRoutes} total, ${rm.unprotectedRoutes} unprotected)`);
    parts.push(`Framework: ${rm.framework}`);
    for (const route of rm.routes.slice(0, 30)) {
      const authStr = route.auth.required
        ? `🔒 ${route.auth.type}${route.auth.roles ? ` [${route.auth.roles.join(',')}]` : ''}`
        : '🔓 OPEN';
      parts.push(`  ${route.method.padEnd(7)} ${route.path} — ${authStr} — ${route.filePath}`);
    }
    if (rm.routes.length > 30) {
      parts.push(`  ... and ${rm.routes.length - 30} more routes`);
    }
  }

  if (context.model) {
    const m = context.model;
    parts.push(`\n## Project Systems`);
    for (const sys of m.systems) {
      parts.push(`  ${sys.name}: health ${Math.round(sys.completeness * 100)}%`);
    }
    if (m.flows.length > 0) {
      parts.push(`\n## User Flows (${m.flows.length})`);
      for (const flow of m.flows.slice(0, 10)) {
        const gapStr = flow.gaps.length > 0 ? ` — ${flow.gaps.length} gap(s)` : '';
        parts.push(`  ${flow.name}${gapStr}`);
      }
    }
  }

  // Gaps section
  if (context.gapAnalysis && context.gapAnalysis.gaps.length > 0) {
    const ga = context.gapAnalysis;
    parts.push(`\n## Known Gaps (${ga.gaps.length} total, ${ga.criticalIssues} critical, health: ${ga.overallHealth}/100)`);
    const topGaps = ga.gaps
      .sort((a, b) => {
        const sev: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
      })
      .slice(0, 10);
    for (const gap of topGaps) {
      parts.push(`  [${gap.severity.toUpperCase()}] ${gap.description}`);
    }
  }

  return parts.join('\n');
}

/**
 * Search the knowledge graph for nodes relevant to a question.
 */
function findRelevantNodes(graph: KnowledgeGraph, question: string): string[] {
  const words = question.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);

  const relevantFiles = new Set<string>();
  const allNodes = [...graph.nodes.values()];

  for (const node of allNodes) {
    const name = node.name.toLowerCase();
    const content = (node.content || '').toLowerCase();
    for (const word of words) {
      if (name.includes(word) || content.includes(word)) {
        relevantFiles.add(node.filePath);
        break;
      }
    }
  }

  return [...relevantFiles].slice(0, 10);
}

/**
 * Answer a natural language question about the project using full context.
 */
export async function answerQuestion(question: string, context: QAContext): Promise<QAAnswer> {
  log('infra', `Q&A: "${question}"`);

  // Check answer cache
  const cached = getCachedAnswer(question);
  if (cached) return cached;

  const category = classifyQuestion(question);
  log('infra', `Question category: ${category}`);

  // Build hierarchical context string
  let contextStr = buildProjectContext(context);

  // Add relevant code snippets from graph
  if (context.graph) {
    const relevantFiles = findRelevantNodes(context.graph, question);
    if (relevantFiles.length > 0) {
      contextStr += `\n\n## Relevant Files\n${relevantFiles.map(f => `  - ${f}`).join('\n')}`;
    }
  }

  // Cap context
  if (contextStr.length > 12000) {
    contextStr = contextStr.slice(0, 12000) + '\n\n[context truncated]';
  }

  const prompt = buildPrompt(
    'You are a project intelligence engine with deep, evidence-based knowledge of this codebase. ' +
    'You have access to the full project model including database schema with relations, API routes with auth info, ' +
    'external services, user flows, known gaps, and code structure. ' +
    'Answer questions precisely based on the evidence available. ' +
    'Always cite specific files, functions, or routes as evidence. ' +
    'If you are not confident, say so clearly.',
    [
      '## Project Context (Hierarchical)\n',
      contextStr,
      '\n\n## Question\n',
      question,
      '\n\n## Instructions\n',
      '1. Answer based ONLY on evidence from the context above\n',
      '2. Reference specific files and function names when possible\n',
      '3. If gaps are relevant, mention them\n',
      '4. Suggest 2-3 natural follow-up questions the user might want to ask next\n',
      '\n## Response Format\n',
      'Respond with valid JSON:\n',
      '{\n',
      '  "answer": "clear, specific answer with file/function references",\n',
      '  "confidence": "high|medium|low",\n',
      '  "evidence": [{"source": "specific file or system", "detail": "what you found there"}],\n',
      '  "relatedFiles": ["file paths relevant to the answer"],\n',
      '  "suggestions": ["actionable suggestions if applicable"],\n',
      '  "followUpQuestions": ["2-3 natural follow-up questions"]\n',
      '}\n',
    ].join(''),
  );

  try {
    const responseText = await callClaude(prompt, 'query');
    const parseResult = safeParseJSON(responseText);

    if (parseResult.ok) {
      const parsed = parseResult.data as any;
      if (parsed && parsed.answer) {
        const answer: QAAnswer = {
          answer: parsed.answer,
          confidence: parsed.confidence || 'medium',
          evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
          relatedFiles: Array.isArray(parsed.relatedFiles) ? parsed.relatedFiles : [],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : undefined,
          followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : undefined,
        };
        setCachedAnswer(question, answer);
        return answer;
      }
    }

    // Fallback: treat raw response as answer
    const fallback: QAAnswer = {
      answer: responseText.slice(0, 2000),
      confidence: 'low',
      evidence: [{ source: 'claude', detail: 'Raw response — JSON parsing failed' }],
      relatedFiles: [],
    };
    return fallback;
  } catch (error) {
    log('infra', `Q&A failed: ${error}`);
    return {
      answer: `Unable to answer: ${error instanceof Error ? error.message : String(error)}`,
      confidence: 'low',
      evidence: [],
      relatedFiles: [],
    };
  }
}
