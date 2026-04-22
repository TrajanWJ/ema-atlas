/**
 * Query Engine — mode-based behavior.
 *
 * ANALYZE: explain system, detect gaps
 * SIMULATE: step through flows, validate transitions
 * EXECUTE: apply code changes, run build, fix errors
 */

import fs from 'fs';
import { callClaude, buildPrompt } from '../ai/claude-client.js';
import { log, logError } from '../logger.js';
import { proposeChanges, applyChanges } from '../modification/engine.js';
import { runCommand } from '../execution/runner.js';
import { projectManager } from '../project-manager.js';
import { retrieve } from '../retrieval/pipeline.js';
import { assembleContextFromPipeline } from '../context/assembler.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeNode, CodeEdge, QueryResult } from '../types.js';
import type { ScoredCandidate } from '../retrieval/types.js';

// ── Mode Detection ──

export type QueryMode = 'analyze' | 'simulate' | 'execute';

const ANALYZE_PATTERN = /what is|what are|explain|describe|tell me|how is.*structured|show me|list|overview|analyze|architecture|understand/i;
const SIMULATE_PATTERN = /how does.*flow|how does.*work|walk.*through|step.*by.*step|trace|simulate|what happens when|if.*user|when.*user|flow|journey|process/i;
const EXECUTE_PATTERN = /implement|fix|add|create|build|write|refactor|update|change|modify|delete|remove|generate|make.*work|apply/i;

export function detectMode(question: string): QueryMode {
  const hasExecute = EXECUTE_PATTERN.test(question);
  const hasSimulate = SIMULATE_PATTERN.test(question);
  const hasAnalyze = ANALYZE_PATTERN.test(question);

  // Execute takes priority when explicit
  if (hasExecute && !hasSimulate && !hasAnalyze) return 'execute';
  if (hasExecute && hasSimulate) return 'simulate'; // ambiguous → safer mode
  if (hasSimulate) return 'simulate';
  return 'analyze';
}

// ── Main Query ──

export async function query(
  question: string,
  graph: KnowledgeGraph,
): Promise<QueryResult> {
  const mode = detectMode(question);
  log('query', `Query [${mode.toUpperCase()}]: "${question}"`);

  switch (mode) {
    case 'analyze':
      return runAnalyze(question, graph);
    case 'simulate':
      return runSimulate(question, graph);
    case 'execute':
      return runExecute(question, graph);
  }
}

// ── ANALYZE MODE ──

async function runAnalyze(question: string, graph: KnowledgeGraph): Promise<QueryResult> {
  const bm25Index = projectManager.getBM25Index?.() ?? null;
  const pipelineResult = await retrieve(question, graph, bm25Index);
  const candidates = pipelineResult.candidates;

  if (candidates.length === 0) return graphSummaryFallback(question, graph);

  let repoPath: string;
  try { repoPath = projectManager.getProjectPath(); } catch { repoPath = '.'; }

  const tfidfIndex = projectManager.getTFIDFIndex?.() ?? null;
  const contextStr = await assembleContextFromPipeline({
    title: question,
    candidates,
    projectPath: repoPath,
    graph,
    tfidfIndex,
    flows: projectManager.getFlows?.() ?? [],
  });

  const prompt = buildPrompt(
    'a code intelligence engine in ANALYZE mode',
    `Explain this codebase clearly and specifically.

MODE: ANALYZE — explain, don't change anything.

Format:
## Overview
Brief summary of what this is and does.

## Architecture
Key systems and how they connect.

## Gaps
What is missing, incomplete, or broken.

## Recommendations
Concrete improvements, prioritized.

Question: ${question}`,
    contextStr.slice(0, 40000),
  );

  let answer: string;
  try {
    answer = await callClaude(prompt, 'query');
  } catch {
    answer = buildPipelineFallback(question, candidates, graph);
  }
  if (!answer || answer.length < 10) answer = buildPipelineFallback(question, candidates, graph);

  return {
    answer: `**[ANALYZE]**\n\n${answer}`,
    relevantNodes: candidates.filter((c) => c.node).map((c) => c.node!).slice(0, 20),
    reasoning: `Mode: analyze, ${candidates.length} candidates, ${pipelineResult.subQueries.length} sub-queries, ${pipelineResult.timing.total}ms`,
    graphPath: candidates.map((c) => c.id),
  };
}

// ── SIMULATE MODE ──

async function runSimulate(question: string, graph: KnowledgeGraph): Promise<QueryResult> {
  const bm25Index = projectManager.getBM25Index?.() ?? null;
  const pipelineResult = await retrieve(question, graph, bm25Index);
  const candidates = pipelineResult.candidates;

  // Build a flow-specific context: prioritize flows and actions
  const flows = candidates.filter((c) => c.type === 'flow');
  const systems = candidates.filter((c) => c.type === 'system');
  const code = candidates.filter((c) => c.type === 'code');

  const contextStr = [
    flows.length > 0 ? '## User Flows\n' + flows.map((f) => f.text).join('\n\n') : '',
    systems.length > 0 ? '## System Actions\n' + systems.map((s) => s.text).join('\n') : '',
    code.length > 0 ? '## Code\n' + code.slice(0, 5).map((c) => c.text).join('\n\n---\n\n') : '',
  ].filter(Boolean).join('\n\n');

  const prompt = buildPrompt(
    'a code intelligence engine in SIMULATE mode',
    `Simulate this user flow step by step.

MODE: SIMULATE — trace the flow, validate each transition, find broken paths.

Format:
## Flow: [name]

| Step | User Action | System Response | Status |
|------|-------------|-----------------|--------|
| 1 | ... | ... | ✅ Implemented / ⚠️ Partial / ❌ Missing |
| 2 | ... | ... | ... |

## Validation
- Which steps work end-to-end
- Which steps are broken or missing
- Invalid state transitions
- Missing error handling

## Missing Steps
Steps that should exist but don't.

Question: ${question}`,
    contextStr.slice(0, 40000),
  );

  let answer: string;
  try {
    answer = await callClaude(prompt, 'simulate');
  } catch {
    answer = buildSimulateFallbackFromCandidates(flows, systems);
  }
  if (!answer || answer.length < 10) answer = buildSimulateFallbackFromCandidates(flows, systems);

  return {
    answer: `**[SIMULATE]**\n\n${answer}`,
    relevantNodes: candidates.filter((c) => c.node).map((c) => c.node!).slice(0, 20),
    reasoning: `Mode: simulate, ${flows.length} flows, ${systems.length} actions, ${pipelineResult.timing.total}ms`,
    graphPath: candidates.map((c) => c.id),
  };
}

function buildSimulateFallbackFromCandidates(flows: ScoredCandidate[], systems: ScoredCandidate[]): string {
  const parts: string[] = ['## Flow Simulation (fallback)\n'];
  if (flows.length > 0) {
    for (const f of flows) {
      parts.push(`### ${f.text.split('\n')[0]}`);
    }
  }
  if (systems.length > 0) {
    parts.push('\n**Actions:**');
    for (const s of systems) parts.push(`- ${s.text.split('\n')[0]}`);
  }
  if (flows.length === 0 && systems.length === 0) {
    parts.push('No matching flows found for simulation.');
  }
  return parts.join('\n');
}

// ── EXECUTE MODE ──

async function runExecute(question: string, graph: KnowledgeGraph): Promise<QueryResult> {
  const bm25Index = projectManager.getBM25Index?.() ?? null;
  const pipelineResult = await retrieve(question, graph, bm25Index);
  const candidates = pipelineResult.candidates;

  // Find target files from context — validate they exist on disk
  const targetFiles = [...new Set(
    candidates
      .filter((c) => c.node)
      .map((c) => c.node!.filePath)
      .filter((fp) => fs.existsSync(fp))
      .slice(0, 5),
  )];

  if (targetFiles.length === 0) {
    return {
      answer: '**[EXECUTE]**\n\nCannot execute: no relevant files found. Try being more specific about which part of the codebase to modify.',
      relevantNodes: [],
      reasoning: 'Mode: execute, no target files found',
      graphPath: [],
    };
  }

  // Step 1: Propose changes
  let answer = `**[EXECUTE]**\n\n`;
  answer += `**Target files:** ${targetFiles.join(', ')}\n\n`;

  try {
    log('edit', `Proposing changes for: ${question}`);
    const changes = await proposeChanges(question, targetFiles, graph);

    if (changes.length === 0) {
      answer += 'No changes proposed. The instruction may be too vague or the files already match the request.';
      return { answer, relevantNodes: [], reasoning: 'Mode: execute, no changes proposed', graphPath: [] };
    }

    // Step 2: Apply changes
    answer += `**${changes.length} change(s) proposed:**\n\n`;
    for (const change of changes) {
      answer += `- \`${change.filePath}\`: ${change.explanation}\n`;
    }

    await applyChanges(changes);
    answer += `\n✅ Changes applied.\n`;

    // Step 3: Validate build
    let repoPath: string;
    try { repoPath = projectManager.getProjectPath(); } catch { repoPath = '.'; }

    const buildResult = runCommand('npm run build 2>&1 || true', repoPath);
    if (buildResult.exitCode === 0) {
      answer += `\n✅ Build passed.`;
    } else {
      answer += `\n⚠️ Build failed:\n\`\`\`\n${buildResult.stderr.slice(0, 500) || buildResult.stdout.slice(0, 500)}\n\`\`\``;

      // Step 4: Auto-fix attempt
      try {
        const fixes = await proposeChanges(
          `Fix these build errors:\n${(buildResult.stderr || buildResult.stdout).slice(0, 1500)}`,
          targetFiles,
          graph,
        );
        if (fixes.length > 0) {
          await applyChanges(fixes);
          const retry = runCommand('npm run build 2>&1 || true', repoPath);
          if (retry.exitCode === 0) {
            answer += `\n✅ Auto-fix succeeded. Build now passes.`;
          } else {
            answer += `\n❌ Auto-fix attempted but build still fails.`;
          }
        }
      } catch {}
    }
  } catch (err) {
    answer += `\n❌ Execution failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  return {
    answer,
    relevantNodes: candidates.filter((c) => c.node).map((c) => c.node!).slice(0, 10),
    reasoning: `Mode: execute, ${targetFiles.length} target files, ${pipelineResult.timing.total}ms`,
    graphPath: candidates.map((c) => c.id),
  };
}

// ── Fallbacks ──

function buildPipelineFallback(question: string, candidates: ScoredCandidate[], graph: KnowledgeGraph): string {
  const stats = graph.getStats();
  const parts = [`Analysis of: "${question}"\n`];
  const flows = candidates.filter((c) => c.type === 'flow');
  const code = candidates.filter((c) => c.type === 'code');
  if (flows.length > 0) { parts.push('## Flows'); flows.forEach((f) => parts.push(`- ${f.text.split('\n')[0]}`)); }
  if (code.length > 0) { parts.push('\n## Code'); code.slice(0, 5).forEach((c) => { if (c.node) parts.push(`- **${c.node.name}** in \`${c.node.filePath}\``); }); }
  parts.push(`\n${stats.fileCount} files, ${stats.nodeCount} nodes`);
  parts.push(`\nSources: ${[...new Set(candidates.flatMap((c) => c.sources))].join(', ')}`);
  return parts.join('\n');
}

function graphSummaryFallback(question: string, graph: KnowledgeGraph): QueryResult {
  const stats = graph.getStats();
  const routes = graph.findByType('route');
  const fns = graph.findByType('function');
  return {
    answer: `**[ANALYZE]**\n\n${stats.fileCount} files, ${fns.length} functions, ${routes.length} routes.\n\nRoutes: ${routes.slice(0, 10).map((r) => r.name).join(', ')}`,
    relevantNodes: [],
    reasoning: 'Graph summary fallback',
    graphPath: [],
  };
}

// ── Exports ──

export { detectMode as classifyIntent };

export function findRelevantContext(nodeIds: string[], graph: KnowledgeGraph, maxNodes: number = 30): CodeNode[] {
  const seen = new Set<string>();
  const result: CodeNode[] = [];
  for (const id of nodeIds) {
    if (result.length >= maxNodes) break;
    const node = graph.getNode(id);
    if (!node || seen.has(id)) continue;
    seen.add(id);
    result.push(node);
    for (const neighbor of graph.getNeighbors(id, 'both')) {
      if (result.length >= maxNodes || seen.has(neighbor.id)) continue;
      const edges = graph.getEdgesFor(id, 'both');
      if (edges.some((e: CodeEdge) => (e.type === 'calls' || e.type === 'imports' || e.type === 'contains') && (e.source === neighbor.id || e.target === neighbor.id))) {
        seen.add(neighbor.id);
        result.push(neighbor);
      }
    }
  }
  return result;
}
