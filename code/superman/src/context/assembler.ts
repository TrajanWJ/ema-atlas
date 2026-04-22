/**
 * Rich context assembler for LLM prompts.
 *
 * Builds a structured context string from up to 7 sections, respecting a
 * 50 000-character budget. HIGH-priority sections are never truncated;
 * LOW sections are dropped first, then MEDIUM sections are trimmed.
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { log } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { TFIDFIndex } from '../semantic/tfidf.js';
import type { StructuredFlow } from '../types.js';
import type { ScoredCandidate } from '../retrieval/types.js';

// ── Constants ──

const MAX_CHARS = 50_000;
const MAX_FILE_LINES = 300;
const MAX_TEST_LINES = 100;

// ── Types ──

export interface ContextOptions {
  title: string;
  targetFiles: string[];
  projectPath: string;
  graph?: KnowledgeGraph;
  tfidfIndex?: TFIDFIndex | null;
  flows?: StructuredFlow[];
  pastExperiences?: string;
}

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

interface Section {
  heading: string;
  content: string;
  priority: Priority;
}

// ── Main entry point ──

/**
 * Assemble a rich context string for an LLM prompt.
 * Returns a single string with ## headings for each section.
 */
export async function assembleContext(opts: ContextOptions): Promise<string> {
  const sections: Section[] = [];

  // 1. Flow Context (HIGH)
  const flowSection = buildFlowContext(opts.title, opts.targetFiles, opts.flows);
  if (flowSection) {
    sections.push({ heading: 'Flow Context', content: flowSection, priority: 'HIGH' });
  }

  // 2. Target Files (HIGH)
  const targetFilesContent = await buildTargetFilesSection(opts.targetFiles, opts.projectPath);
  if (targetFilesContent) {
    sections.push({ heading: 'Target Files', content: targetFilesContent, priority: 'HIGH' });
  }

  // 3. Related Tests (MEDIUM)
  const testsContent = await buildRelatedTestsSection(opts.targetFiles, opts.projectPath);
  if (testsContent) {
    sections.push({ heading: 'Related Tests', content: testsContent, priority: 'MEDIUM' });
  }

  // 4. Git History (MEDIUM)
  const gitContent = buildGitHistorySection(opts.targetFiles, opts.projectPath);
  if (gitContent) {
    sections.push({ heading: 'Git History', content: gitContent, priority: 'MEDIUM' });
  }

  // 5. Module Dependencies (MEDIUM)
  const depsContent = buildDependenciesSection(opts.targetFiles, opts.graph);
  if (depsContent) {
    sections.push({ heading: 'Module Dependencies', content: depsContent, priority: 'MEDIUM' });
  }

  // 6. Similar Patterns (LOW)
  const similarContent = buildSimilarPatternsSection(opts.title, opts.tfidfIndex);
  if (similarContent) {
    sections.push({ heading: 'Similar Patterns', content: similarContent, priority: 'LOW' });
  }

  // 7. Past Experiences (LOW)
  if (opts.pastExperiences) {
    sections.push({ heading: 'Past Experiences', content: opts.pastExperiences, priority: 'LOW' });
  }

  // Apply budget
  const trimmed = applyBudget(sections);

  const output = trimmed
    .map((s) => `## ${s.heading}\n\n${s.content}`)
    .join('\n\n');

  log('query', 'Context assembled', {
    sections: trimmed.length,
    chars: output.length,
    budget: MAX_CHARS,
  });

  return output;
}

// ── Pipeline-aware assembly ──

export interface PipelineContextOptions {
  title: string;
  candidates: ScoredCandidate[];
  projectPath: string;
  graph?: KnowledgeGraph;
  tfidfIndex?: TFIDFIndex | null;
  flows?: StructuredFlow[];
  pastExperiences?: string;
}

/**
 * Assemble context from pipeline retrieval results.
 * Uses smart chunking: reads only relevant node content instead of whole files.
 * Groups nodes from the same file to avoid redundant reads.
 */
export async function assembleContextFromPipeline(opts: PipelineContextOptions): Promise<string> {
  const sections: Section[] = [];

  // 1. Flow Context (HIGH) — from flow-type candidates
  const flowCandidates = opts.candidates.filter((c) => c.type === 'flow');
  if (flowCandidates.length > 0) {
    const flowContent = flowCandidates
      .map((c) => `**${c.id}** (score: ${c.score.toFixed(3)}, sources: ${c.sources.join(', ')})\n${c.text}`)
      .join('\n\n');
    sections.push({ heading: 'Flow Context', content: flowContent, priority: 'HIGH' });
  } else {
    // Fall back to keyword-based flow matching
    const flowSection = buildFlowContext(opts.title, extractTargetFiles(opts.candidates), opts.flows);
    if (flowSection) {
      sections.push({ heading: 'Flow Context', content: flowSection, priority: 'HIGH' });
    }
  }

  // 2. Code Context (HIGH) — smart chunking from candidates
  const codeCandidates = opts.candidates.filter((c) => c.type === 'code' || c.type === 'system');
  if (codeCandidates.length > 0) {
    const codeContent = await buildSmartCodeSection(codeCandidates, opts.projectPath);
    if (codeContent) {
      sections.push({ heading: 'Relevant Code', content: codeContent, priority: 'HIGH' });
    }
  }

  // 3. Related Tests (MEDIUM)
  const targetFiles = extractTargetFiles(opts.candidates);
  const testsContent = await buildRelatedTestsSection(targetFiles, opts.projectPath);
  if (testsContent) {
    sections.push({ heading: 'Related Tests', content: testsContent, priority: 'MEDIUM' });
  }

  // 4. Git History (MEDIUM)
  const gitContent = buildGitHistorySection(targetFiles, opts.projectPath);
  if (gitContent) {
    sections.push({ heading: 'Git History', content: gitContent, priority: 'MEDIUM' });
  }

  // 5. Module Dependencies (MEDIUM)
  const depsContent = buildDependenciesSection(targetFiles, opts.graph);
  if (depsContent) {
    sections.push({ heading: 'Module Dependencies', content: depsContent, priority: 'MEDIUM' });
  }

  // 6. Similar Patterns (LOW)
  const similarContent = buildSimilarPatternsSection(opts.title, opts.tfidfIndex);
  if (similarContent) {
    sections.push({ heading: 'Similar Patterns', content: similarContent, priority: 'LOW' });
  }

  // 7. Past Experiences (LOW)
  if (opts.pastExperiences) {
    sections.push({ heading: 'Past Experiences', content: opts.pastExperiences, priority: 'LOW' });
  }

  const trimmed = applyBudget(sections);

  const output = trimmed
    .map((s) => `## ${s.heading}\n\n${s.content}`)
    .join('\n\n');

  log('query', 'Pipeline context assembled', {
    sections: trimmed.length,
    chars: output.length,
    budget: MAX_CHARS,
    candidates: opts.candidates.length,
  });

  return output;
}

/**
 * Smart code section: groups candidates by file, reads only relevant portions.
 * For specific nodes (functions/classes), shows node content + 10 lines context.
 * For file-level nodes, reads first MAX_FILE_LINES lines.
 */
async function buildSmartCodeSection(
  candidates: ScoredCandidate[],
  projectPath: string,
): Promise<string | null> {
  // Group by file
  const fileGroups = new Map<string, ScoredCandidate[]>();
  for (const c of candidates) {
    const filePath = c.node?.filePath;
    if (!filePath) {
      // No file — just include the text directly
      fileGroups.set(c.id, [c]);
      continue;
    }
    const group = fileGroups.get(filePath) ?? [];
    group.push(c);
    fileGroups.set(filePath, group);
  }

  const parts: string[] = [];

  for (const [fileKey, group] of fileGroups) {
    // Check if these are specific nodes or text-only entries
    const hasNodes = group.some((c) => c.node);

    if (!hasNodes) {
      // Text-only entries (e.g., flow descriptions)
      for (const c of group) {
        parts.push(`**${c.id}** (score: ${c.score.toFixed(3)})\n${c.text}`);
      }
      continue;
    }

    const filePath = group[0].node!.filePath;
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(projectPath, filePath);

    // If all candidates are file-level nodes, read whole file (truncated)
    const allFileLevel = group.every((c) => c.node?.type === 'file');
    if (allFileLevel) {
      try {
        const raw = await fs.readFile(fullPath, 'utf-8');
        const lines = raw.split('\n');
        const truncated = lines.slice(0, MAX_FILE_LINES);
        const suffix = lines.length > MAX_FILE_LINES
          ? `\n... (${lines.length - MAX_FILE_LINES} more lines)`
          : '';
        parts.push(`### ${filePath}\n\`\`\`\n${truncated.join('\n')}${suffix}\n\`\`\``);
      } catch {
        parts.push(`### ${filePath}\n*(file not found)*`);
      }
      continue;
    }

    // Specific nodes: show each node's content with surrounding context
    try {
      const raw = await fs.readFile(fullPath, 'utf-8');
      const fileLines = raw.split('\n');
      const CONTEXT_LINES = 10;

      // Collect line ranges for all nodes in this file, merge overlapping ranges
      const ranges: Array<{ start: number; end: number; name: string; score: number }> = [];

      for (const c of group) {
        if (!c.node || !c.node.range?.start?.line) {
          // No line info — include node content directly
          parts.push(`**${c.node?.name ?? c.id}** in \`${filePath}\` (score: ${c.score.toFixed(3)})\n\`\`\`\n${c.node?.content?.slice(0, 800) ?? c.text}\n\`\`\``);
          continue;
        }

        const start = Math.max(0, c.node.range.start.line - 1 - CONTEXT_LINES);
        const end = Math.min(fileLines.length, (c.node.range.end?.line ?? c.node.range.start.line) + CONTEXT_LINES);
        ranges.push({ start, end, name: c.node.name, score: c.score });
      }

      if (ranges.length === 0) continue;

      // Merge overlapping ranges
      ranges.sort((a, b) => a.start - b.start);
      const merged: typeof ranges = [ranges[0]];
      for (let i = 1; i < ranges.length; i++) {
        const last = merged[merged.length - 1];
        if (ranges[i].start <= last.end) {
          last.end = Math.max(last.end, ranges[i].end);
          last.name += `, ${ranges[i].name}`;
        } else {
          merged.push(ranges[i]);
        }
      }

      // Build output for this file
      const fileHeader = `### ${filePath}`;
      const snippets = merged.map((r) => {
        const snippet = fileLines.slice(r.start, r.end).join('\n');
        return `**${r.name}** (lines ${r.start + 1}-${r.end})\n\`\`\`\n${snippet}\n\`\`\``;
      });

      parts.push(`${fileHeader}\n${snippets.join('\n\n')}`);
    } catch {
      // File not readable — fall back to node content
      for (const c of group) {
        parts.push(`**${c.node?.name ?? c.id}** in \`${filePath}\`\n\`\`\`\n${c.node?.content?.slice(0, 800) ?? c.text}\n\`\`\``);
      }
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

/**
 * Extract unique file paths from candidates.
 */
function extractTargetFiles(candidates: ScoredCandidate[]): string[] {
  const files = new Set<string>();
  for (const c of candidates) {
    if (c.node?.filePath) {
      files.add(c.node.filePath);
    }
  }
  return [...files];
}

// ── Section builders ──

function buildFlowContext(
  title: string,
  targetFiles: string[],
  flows?: StructuredFlow[],
): string | null {
  if (!flows || flows.length === 0) return null;

  const titleLower = title.toLowerCase();
  const targetSet = new Set(targetFiles);

  const matching = flows.filter((flow) => {
    // Match by title keywords
    const nameLower = flow.name.toLowerCase();
    const descLower = flow.description.toLowerCase();
    if (titleLower.split(/\s+/).some((word) => word.length > 2 && (nameLower.includes(word) || descLower.includes(word)))) {
      return true;
    }
    // Match by related files overlap
    if (flow.relatedFiles.some((f) => targetSet.has(f))) {
      return true;
    }
    return false;
  });

  if (matching.length === 0) return null;

  const lines: string[] = [];
  for (const flow of matching) {
    lines.push(`**${flow.name}** (completeness: ${Math.round(flow.completeness * 100)}%)`);
    if (flow.description) {
      lines.push(flow.description);
    }
    lines.push('');
    lines.push('Steps:');
    for (const step of flow.steps) {
      const icon = step.status === 'implemented' ? '[x]' : step.status === 'partial' ? '[~]' : '[ ]';
      lines.push(`- ${icon} ${step.userAction} -> ${step.systemResponse}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

async function buildTargetFilesSection(
  targetFiles: string[],
  projectPath: string,
): Promise<string | null> {
  if (targetFiles.length === 0) return null;

  const parts: string[] = [];

  for (const file of targetFiles) {
    const fullPath = path.isAbsolute(file) ? file : path.join(projectPath, file);
    try {
      const raw = await fs.readFile(fullPath, 'utf-8');
      const lines = raw.split('\n');
      const truncated = lines.slice(0, MAX_FILE_LINES);
      const suffix = lines.length > MAX_FILE_LINES
        ? `\n... (${lines.length - MAX_FILE_LINES} more lines)`
        : '';

      parts.push(`### ${file}\n\`\`\`\n${truncated.join('\n')}${suffix}\n\`\`\``);
    } catch {
      parts.push(`### ${file}\n*(file not found or unreadable — may be a new file)*`);
    }
  }

  return parts.join('\n\n');
}

async function buildRelatedTestsSection(
  targetFiles: string[],
  projectPath: string,
): Promise<string | null> {
  const parts: string[] = [];

  for (const file of targetFiles) {
    const parsed = path.parse(file);
    const dir = parsed.dir;
    const base = parsed.name;
    const ext = parsed.ext;

    // Candidate test file paths
    const candidates = [
      path.join(dir, `${base}.test${ext}`),
      path.join(dir, `${base}.spec${ext}`),
      path.join(dir, '__tests__', `${base}${ext}`),
      path.join('test', dir, `${base}.test${ext}`),
    ];

    for (const candidate of candidates) {
      const fullPath = path.isAbsolute(candidate) ? candidate : path.join(projectPath, candidate);
      try {
        const raw = await fs.readFile(fullPath, 'utf-8');
        const lines = raw.split('\n').slice(0, MAX_TEST_LINES);
        const suffix = raw.split('\n').length > MAX_TEST_LINES
          ? `\n... (truncated)`
          : '';
        parts.push(`### ${candidate}\n\`\`\`\n${lines.join('\n')}${suffix}\n\`\`\``);
      } catch {
        // Test file does not exist — skip silently
      }
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

function buildGitHistorySection(
  targetFiles: string[],
  projectPath: string,
): string | null {
  const parts: string[] = [];

  for (const file of targetFiles) {
    try {
      const output = execSync(`git log --oneline -5 -- "${file}"`, {
        cwd: projectPath,
        encoding: 'utf-8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();

      if (output) {
        parts.push(`**${file}**\n${output}`);
      }
    } catch {
      // Not a git repo or file has no history — skip
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

function buildDependenciesSection(
  targetFiles: string[],
  graph?: KnowledgeGraph,
): string | null {
  if (!graph) return null;

  const parts: string[] = [];

  for (const file of targetFiles) {
    const nodes = graph.findByFile(file);
    if (nodes.length === 0) continue;

    const imports = new Set<string>();
    const importedBy = new Set<string>();

    for (const node of nodes) {
      const edges = graph.getEdgesFor(node.id, 'both');
      for (const edge of edges) {
        if (edge.type === 'imports' || edge.type === 'uses') {
          if (edge.source === node.id) {
            // This node imports/uses something
            const target = graph.getNode(edge.target);
            if (target && target.filePath !== file) {
              imports.add(target.filePath);
            }
          } else {
            // Something imports/uses this node
            const source = graph.getNode(edge.source);
            if (source && source.filePath !== file) {
              importedBy.add(source.filePath);
            }
          }
        }
      }
    }

    const lines: string[] = [`**${file}**`];
    if (imports.size > 0) {
      lines.push(`Imports: ${[...imports].join(', ')}`);
    }
    if (importedBy.size > 0) {
      lines.push(`Imported by: ${[...importedBy].join(', ')}`);
    }

    if (imports.size > 0 || importedBy.size > 0) {
      parts.push(lines.join('\n'));
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

function buildSimilarPatternsSection(
  title: string,
  tfidfIndex?: TFIDFIndex | null,
): string | null {
  if (!tfidfIndex) return null;

  const results = tfidfIndex.querySimilar(title, 3);
  if (results.length === 0) return null;

  const lines = results.map(
    (r) => `- **${r.id}** (similarity: ${r.score.toFixed(3)})`,
  );

  return lines.join('\n');
}

// ── Budget management ──

function applyBudget(sections: Section[]): Section[] {
  const totalChars = () => sections.reduce(
    (sum, s) => sum + sectionSize(s),
    0,
  );

  // If within budget, return as-is
  if (totalChars() <= MAX_CHARS) return [...sections];

  const result = [...sections];

  // Phase 1: Remove LOW priority sections (from last to first)
  const lowIndices = result
    .map((s, i) => (s.priority === 'LOW' ? i : -1))
    .filter((i) => i >= 0)
    .reverse();

  for (const idx of lowIndices) {
    if (currentTotal(result) <= MAX_CHARS) break;
    result.splice(idx, 1);
  }

  if (currentTotal(result) <= MAX_CHARS) return result;

  // Phase 2: Truncate MEDIUM priority sections
  for (let i = result.length - 1; i >= 0; i--) {
    if (currentTotal(result) <= MAX_CHARS) break;
    if (result[i].priority !== 'MEDIUM') continue;

    const overshoot = currentTotal(result) - MAX_CHARS;
    const section = result[i];
    const contentLen = section.content.length;

    if (contentLen <= overshoot) {
      // Remove entire section
      result.splice(i, 1);
    } else {
      // Truncate content
      const allowedLen = contentLen - overshoot;
      section.content = section.content.slice(0, allowedLen) + '\n... (truncated)';
    }
  }

  return result;
}

function sectionSize(s: Section): number {
  // Account for "## Heading\n\n" + content + "\n\n" separator
  return `## ${s.heading}\n\n${s.content}\n\n`.length;
}

function currentTotal(sections: Section[]): number {
  return sections.reduce((sum, s) => sum + sectionSize(s), 0);
}
