import * as fs from 'fs/promises';
import { log } from '../logger.js';
import { callClaude, buildPrompt } from '../ai/claude-client.js';
import { getReverseDependencies, getCallChain } from '../graph/traversal.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode, CodeEdge } from '../types.js';
import type { Suggestion } from './engine.js';

// ── Types ──

export interface BuildInstruction {
  instruction: string;
  targetFiles: string[];
  context: {
    patterns: PatternExample[];
    dependencies: string[];
    warnings: string[];
  };
  estimatedComplexity: 'small' | 'medium' | 'large';
}

export interface PatternExample {
  file: string;
  description: string;
  lineRange?: string;
}

// ── Pattern Discovery ──

/**
 * Find existing code patterns in the repo that are similar to what needs to be built.
 * For example, if we need to add error handling, find files that already have good error handling.
 */
function findRelevantPatterns(
  suggestion: Suggestion,
  graph: KnowledgeGraph,
): PatternExample[] {
  const patterns: PatternExample[] = [];
  const desc = suggestion.description.toLowerCase();

  // Pattern: error handling — find functions that already use try/catch
  if (desc.includes('error handling') || desc.includes('no error') || suggestion.suggestedFix.toLowerCase().includes('error')) {
    const allFunctions = graph.findByType('function') as CodeNode[];
    for (const fn of allFunctions) {
      if (/try\s*\{[\s\S]*catch/s.test(fn.content) && fn.content.length > 50) {
        // Skip functions in the same affected files (we want patterns from OTHER files)
        if (!suggestion.affectedFiles.includes(fn.filePath)) {
          patterns.push({
            file: fn.filePath,
            description: `${fn.name} has proper error handling with try/catch`,
            lineRange: `${fn.range?.start?.line || '?'}-${fn.range?.end?.line || '?'}`,
          });
          if (patterns.length >= 2) break;
        }
      }
    }
  }

  // Pattern: validation — find functions with input validation
  if (desc.includes('validation') || desc.includes('sanitization') || desc.includes('input')) {
    const allFunctions = graph.findByType('function') as CodeNode[];
    for (const fn of allFunctions) {
      if (/if\s*\(!.*\)\s*\{?\s*(return|throw|res\.status\(4)/s.test(fn.content)) {
        if (!suggestion.affectedFiles.includes(fn.filePath)) {
          patterns.push({
            file: fn.filePath,
            description: `${fn.name} validates inputs before processing`,
            lineRange: `${fn.range?.start?.line || '?'}-${fn.range?.end?.line || '?'}`,
          });
          if (patterns.length >= 2) break;
        }
      }
    }
  }

  // Pattern: route handlers — find existing route patterns
  if (desc.includes('route') || desc.includes('endpoint') || desc.includes('api')) {
    const routes = graph.findByType('route') as CodeNode[];
    if (routes.length > 0) {
      const example = routes[0];
      patterns.push({
        file: example.filePath,
        description: `Existing route pattern: ${example.metadata?.httpMethod || 'handler'} ${example.metadata?.routePath || example.name}`,
        lineRange: `${example.range?.start?.line || '?'}-${example.range?.end?.line || '?'}`,
      });
    }
  }

  // Pattern: for missing systems, find similar existing systems
  if (suggestion.gapType === 'missing_system') {
    const fileNodes = graph.findByType('file') as CodeNode[];
    // Find files in src/routes or src/modules that could serve as templates
    const routeFiles = fileNodes.filter(f =>
      f.filePath.includes('/routes/') || f.filePath.includes('/modules/') || f.filePath.includes('/services/')
    );
    if (routeFiles.length > 0) {
      const example = routeFiles[0];
      patterns.push({
        file: example.filePath,
        description: `Existing module structure to follow as template`,
      });
    }
  }

  return patterns.slice(0, 3); // Max 3 patterns
}

/**
 * Find what depends on the affected code — things that must NOT break.
 */
function findDependencies(
  suggestion: Suggestion,
  graph: KnowledgeGraph,
): string[] {
  const deps: string[] = [];

  for (const nodeId of suggestion.affectedNodes.slice(0, 5)) {
    const reverseDeps = getReverseDependencies(graph, nodeId);
    for (const dep of reverseDeps.slice(0, 3)) {
      deps.push(`${dep.name} (${dep.filePath}) depends on this`);
    }
  }

  return [...new Set(deps)].slice(0, 8);
}

/**
 * Generate warnings — things that could go wrong.
 */
function generateWarnings(
  suggestion: Suggestion,
  graph: KnowledgeGraph,
): string[] {
  const warnings: string[] = [];

  // Warn about high coupling
  for (const nodeId of suggestion.affectedNodes.slice(0, 3)) {
    const reverseDeps = getReverseDependencies(graph, nodeId);
    if (reverseDeps.length > 5) {
      const node = graph.getNode(nodeId);
      if (node) {
        warnings.push(`${(node as CodeNode).name} has ${reverseDeps.length} dependents — changes must preserve its interface`);
      }
    }
  }

  // Warn about test files
  const hasTests = suggestion.affectedFiles.some(f =>
    f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__')
  );
  if (hasTests) {
    warnings.push('Affected files include tests — update test expectations after changes');
  }

  // Warn about exported functions
  for (const nodeId of suggestion.affectedNodes.slice(0, 5)) {
    const node = graph.getNode(nodeId) as CodeNode | undefined;
    if (node?.metadata?.exported) {
      warnings.push(`${node.name} is exported — do not change its signature`);
      break;
    }
  }

  return warnings.slice(0, 5);
}

// ── Complexity Estimation ──

function estimateComplexity(suggestion: Suggestion): 'small' | 'medium' | 'large' {
  const fileCount = suggestion.affectedFiles.length;
  const nodeCount = suggestion.affectedNodes.length;

  if (fileCount <= 1 && nodeCount <= 3) return 'small';
  if (fileCount <= 3 && nodeCount <= 10) return 'medium';
  return 'large';
}

// ── Read File Snippets ──

async function readFileSnippets(files: string[], maxPerFile: number = 50): Promise<Map<string, string>> {
  const snippets = new Map<string, string>();
  for (const file of files.slice(0, 5)) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      snippets.set(file, lines.slice(0, maxPerFile).join('\n'));
    } catch {
      // File doesn't exist or unreadable — skip
    }
  }
  return snippets;
}

// ── Main: Generate Build Instruction ──

export async function generateBuildInstruction(
  suggestion: Suggestion,
  graph: KnowledgeGraph,
): Promise<BuildInstruction> {
  log('auto', `Generating build instruction for: ${suggestion.title}`);

  const patterns = findRelevantPatterns(suggestion, graph);
  const dependencies = findDependencies(suggestion, graph);
  const warnings = generateWarnings(suggestion, graph);
  const complexity = estimateComplexity(suggestion);

  // Read affected file snippets for context
  const fileSnippets = await readFileSnippets(suggestion.affectedFiles);

  // Build the instruction parts
  const parts: string[] = [];

  // What to do
  parts.push(`## Task\n${suggestion.suggestedFix}`);
  parts.push(`\n## Why\n${suggestion.description}`);

  // Target files
  if (suggestion.affectedFiles.length > 0) {
    parts.push(`\n## Files to modify\n${suggestion.affectedFiles.map(f => `- ${f}`).join('\n')}`);
  }

  // Patterns to follow
  if (patterns.length > 0) {
    parts.push(`\n## Patterns to follow`);
    for (const p of patterns) {
      parts.push(`- Look at \`${p.file}\`${p.lineRange ? ` lines ${p.lineRange}` : ''}: ${p.description}`);
    }
  }

  // Dependencies — what NOT to break
  if (dependencies.length > 0) {
    parts.push(`\n## Do NOT break these callers`);
    for (const dep of dependencies) {
      parts.push(`- ${dep}`);
    }
  }

  // Warnings
  if (warnings.length > 0) {
    parts.push(`\n## Warnings`);
    for (const w of warnings) {
      parts.push(`- ${w}`);
    }
  }

  // File context (first 50 lines of each affected file)
  if (fileSnippets.size > 0) {
    parts.push(`\n## Current file contents (first 50 lines each)`);
    for (const [file, snippet] of fileSnippets) {
      parts.push(`\n### ${file}\n\`\`\`\n${snippet}\n\`\`\``);
    }
  }

  const instruction = parts.join('\n');

  const result: BuildInstruction = {
    instruction,
    targetFiles: suggestion.affectedFiles,
    context: { patterns, dependencies, warnings },
    estimatedComplexity: complexity,
  };

  log('auto', `Build instruction generated (${instruction.length} chars, ${complexity} complexity)`);
  return result;
}
