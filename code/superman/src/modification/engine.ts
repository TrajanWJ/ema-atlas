import { parse, Lang } from '@ast-grep/napi';
import * as fs from 'fs/promises';
import { callClaude, safeParseJSON, buildPrompt } from '../ai/claude-client.js';
import { log, logError } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';
import type { CodeChange, CodeEdge, SurgicalEdit } from '../types.js';

/**
 * Map file extension to ast-grep Lang enum.
 */
function detectLanguage(filePath: string): Lang | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return Lang.TypeScript;
    case 'js':
    case 'jsx':
      return Lang.JavaScript;
    case 'py':
      return Lang.Python;
    case 'go':
      return Lang.Go;
    case 'rs':
      return Lang.Rust;
    case 'java':
      return Lang.Java;
    case 'c':
      return Lang.C;
    case 'cpp':
    case 'cc':
    case 'cxx':
      return Lang.Cpp;
    case 'css':
      return Lang.Css;
    case 'html':
      return Lang.Html;
    case 'json':
      return Lang.Json;
    default:
      return null;
  }
}

/**
 * Validate syntax by parsing with ast-grep and checking for errors.
 */
export function validateSyntax(code: string, filePath: string): boolean {
  const lang = detectLanguage(filePath);
  if (!lang) {
    // Cannot validate unknown language; assume valid
    return true;
  }

  try {
    const tree = parse(lang, code);
    const root = tree.root();
    // Check if root has any error nodes by searching for ERROR kind
    // ast-grep root().hasError() or walk the tree for error nodes
    const text = root.text();
    // If parsing succeeded and we got text back, syntax is likely valid
    // A more robust check: look for nodes of kind "ERROR"
    const errors = root.findAll({ rule: { kind: 'ERROR' } });
    return errors.length === 0;
  } catch {
    return false;
  }
}

/**
 * Generate a simple unified diff between original and modified text.
 */
export function simpleDiff(
  original: string,
  modified: string,
  filePath: string,
): string {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  const output: string[] = [];

  output.push(`--- a/${filePath}`);
  output.push(`+++ b/${filePath}`);

  // Simple LCS-based diff producing unified diff hunks
  const maxLen = Math.max(originalLines.length, modifiedLines.length);

  // Build a list of change operations using a simple line-by-line comparison
  interface DiffLine {
    type: 'keep' | 'add' | 'remove';
    text: string;
    oldLineNo: number;
    newLineNo: number;
  }

  const diffLines: DiffLine[] = [];

  // Use a basic DP approach for small files, or line-by-line for larger ones
  if (maxLen <= 1000) {
    // LCS-based diff
    const m = originalLines.length;
    const n = modifiedLines.length;

    // Build LCS table
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      new Array(n + 1).fill(0),
    );

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (originalLines[i - 1] === modifiedLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to produce diff
    const rawDiff: Array<{ type: 'keep' | 'add' | 'remove'; text: string }> = [];
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
        rawDiff.unshift({ type: 'keep', text: originalLines[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        rawDiff.unshift({ type: 'add', text: modifiedLines[j - 1] });
        j--;
      } else if (i > 0) {
        rawDiff.unshift({ type: 'remove', text: originalLines[i - 1] });
        i--;
      }
    }

    let oldLine = 1;
    let newLine = 1;
    for (const entry of rawDiff) {
      diffLines.push({
        type: entry.type,
        text: entry.text,
        oldLineNo: oldLine,
        newLineNo: newLine,
      });
      if (entry.type === 'keep') {
        oldLine++;
        newLine++;
      } else if (entry.type === 'remove') {
        oldLine++;
      } else {
        newLine++;
      }
    }
  } else {
    // For large files, use simple sequential comparison
    let oldIdx = 0;
    let newIdx = 0;
    let oldLine = 1;
    let newLine = 1;

    while (oldIdx < originalLines.length || newIdx < modifiedLines.length) {
      if (oldIdx < originalLines.length && newIdx < modifiedLines.length) {
        if (originalLines[oldIdx] === modifiedLines[newIdx]) {
          diffLines.push({
            type: 'keep',
            text: originalLines[oldIdx],
            oldLineNo: oldLine,
            newLineNo: newLine,
          });
          oldIdx++;
          newIdx++;
          oldLine++;
          newLine++;
        } else {
          diffLines.push({
            type: 'remove',
            text: originalLines[oldIdx],
            oldLineNo: oldLine,
            newLineNo: newLine,
          });
          oldIdx++;
          oldLine++;
          diffLines.push({
            type: 'add',
            text: modifiedLines[newIdx],
            oldLineNo: oldLine,
            newLineNo: newLine,
          });
          newIdx++;
          newLine++;
        }
      } else if (oldIdx < originalLines.length) {
        diffLines.push({
          type: 'remove',
          text: originalLines[oldIdx],
          oldLineNo: oldLine,
          newLineNo: newLine,
        });
        oldIdx++;
        oldLine++;
      } else {
        diffLines.push({
          type: 'add',
          text: modifiedLines[newIdx],
          oldLineNo: oldLine,
          newLineNo: newLine,
        });
        newIdx++;
        newLine++;
      }
    }
  }

  // Group diff lines into hunks (context of 3 lines)
  const contextSize = 3;
  const changedIndices: number[] = [];
  for (let i = 0; i < diffLines.length; i++) {
    if (diffLines[i].type !== 'keep') {
      changedIndices.push(i);
    }
  }

  if (changedIndices.length === 0) {
    return ''; // No changes
  }

  // Merge nearby changes into hunks
  const hunks: Array<{ start: number; end: number }> = [];
  let hunkStart = Math.max(0, changedIndices[0] - contextSize);
  let hunkEnd = Math.min(diffLines.length - 1, changedIndices[0] + contextSize);

  for (let i = 1; i < changedIndices.length; i++) {
    const nextStart = Math.max(0, changedIndices[i] - contextSize);
    const nextEnd = Math.min(diffLines.length - 1, changedIndices[i] + contextSize);

    if (nextStart <= hunkEnd + 1) {
      // Merge with current hunk
      hunkEnd = nextEnd;
    } else {
      hunks.push({ start: hunkStart, end: hunkEnd });
      hunkStart = nextStart;
      hunkEnd = nextEnd;
    }
  }
  hunks.push({ start: hunkStart, end: hunkEnd });

  // Output hunks
  for (const hunk of hunks) {
    let oldStart = 1;
    let newStart = 1;
    let oldCount = 0;
    let newCount = 0;

    // Calculate line numbers for hunk header
    for (let i = 0; i <= hunk.end; i++) {
      if (i === hunk.start) {
        // Record starting line numbers
        const line = diffLines[i];
        if (line.type === 'add') {
          // Find the closest old line number
          oldStart = line.oldLineNo;
          newStart = line.newLineNo;
        } else {
          oldStart = line.oldLineNo;
          newStart = line.newLineNo;
        }
      }
    }

    const hunkLines: string[] = [];
    for (let i = hunk.start; i <= hunk.end; i++) {
      const line = diffLines[i];
      if (line.type === 'keep') {
        hunkLines.push(` ${line.text}`);
        oldCount++;
        newCount++;
      } else if (line.type === 'remove') {
        hunkLines.push(`-${line.text}`);
        oldCount++;
      } else {
        hunkLines.push(`+${line.text}`);
        newCount++;
      }
    }

    output.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);
    output.push(...hunkLines);
  }

  return output.join('\n');
}

/**
 * Gather context about what other files import or use the target files.
 */
function gatherDependencyContext(
  targetFiles: string[],
  graph: KnowledgeGraph,
): string {
  const contextParts: string[] = [];

  for (const filePath of targetFiles) {
    // Find file nodes for this path
    const allFileNodes = graph.findByType('file');
    const fileNode = allFileNodes.find((n) => n.filePath === filePath);
    if (!fileNode) continue;

    // Get incoming edges to find what depends on this file
    const incomingEdges = graph.getEdgesFor(fileNode.id, 'reverse');
    const importers = incomingEdges
      .filter((e: CodeEdge) => e.type === 'imports')
      .map((e: CodeEdge) => {
        const sourceNode = graph.getNode(e.source);
        return sourceNode ? `${sourceNode.name} (${sourceNode.filePath})` : null;
      })
      .filter(Boolean);

    if (importers.length > 0) {
      contextParts.push(
        `File "${filePath}" is imported by:\n${importers.map((i) => `  - ${i}`).join('\n')}`,
      );
    }

    // Get nodes contained in this file
    const containedEdges = graph.getEdgesFor(fileNode.id, 'forward');
    const exportedNodes = containedEdges
      .filter((e: CodeEdge) => e.type === 'contains' || e.type === 'exports')
      .map((e: CodeEdge) => graph.getNode(e.target))
      .filter((n): n is NonNullable<typeof n> => n !== null && n !== undefined);

    if (exportedNodes.length > 0) {
      const exports = exportedNodes
        .map((n) => `  - ${n.type} ${n.name}${n.signature ? `: ${n.signature}` : ''}`)
        .join('\n');
      contextParts.push(`File "${filePath}" exports:\n${exports}`);
    }
  }

  return contextParts.join('\n\n');
}

/**
 * Parse Claude's response to extract modified code per file.
 * Expects code blocks wrapped in ```filepath:path``` markers.
 */
export function parseModifiedFiles(
  response: string,
  targetFiles?: string[],
): Map<string, { code: string; explanation: string }> {
  const results = new Map<string, { code: string; explanation: string }>();

  // Match code blocks with filepath markers: ```filepath:path or ```path
  const blockRegex = /```(?:filepath:)?([^\n`]+)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(response)) !== null) {
    const filePath = match[1].trim();
    const code = match[2];

    // Skip if this looks like a language marker rather than a file path
    if (!filePath.includes('.') && !filePath.includes('/')) {
      continue;
    }

    results.set(filePath, { code, explanation: '' });
  }

  // Second pass: find language-tagged blocks and associate with file paths from preceding text
  const langBlockRegex = /```(?:typescript|javascript|python|go|rust|java|jsx|tsx|css|html|json|sh|bash|yaml|yml|toml|sql)\n([\s\S]*?)```/g;
  const capturedPaths = new Set(results.keys());

  let langMatch: RegExpExecArray | null;
  while ((langMatch = langBlockRegex.exec(response)) !== null) {
    const code = langMatch[1];
    const blockStart = langMatch.index;

    // Look at the 300 characters before this block
    const precedingText = response.slice(Math.max(0, blockStart - 300), blockStart);

    // Try to find a file path in the preceding text
    const filePathPatterns = [
      /`([^`]+\.[a-z]{1,4})`/g,           // `path/to/file.ts`
      /\*\*([^*]+\.[a-z]{1,4})\*\*/g,      // **path/to/file.ts**
      /[Ff]ile:\s*([^\s,\n]+\.[a-z]{1,4})/g,  // File: path/to/file.ts
      /#{1,3}\s+([^\s,\n]+\.[a-z]{1,4})/g,    // ### path/to/file.ts (header)
      /(?:for|in|of|to)\s+([^\s,\n]+\/[^\s,\n]+\.[a-z]{1,4})/g, // for src/foo.ts
      /(?:^|\s)((?:src|lib|app|packages?)\/[^\s,\n]+\.[a-z]{1,4})/gm, // src/... path
    ];

    let foundPath: string | null = null;
    for (const pattern of filePathPatterns) {
      pattern.lastIndex = 0; // Reset
      const matches = [...precedingText.matchAll(pattern)];
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        const candidate = lastMatch[1].trim();
        if (!capturedPaths.has(candidate) && candidate.includes('.')) {
          foundPath = candidate;
          break;
        }
      }
    }

    if (foundPath && !results.has(foundPath)) {
      results.set(foundPath, { code, explanation: '' });
      capturedPaths.add(foundPath);
    }
  }

  // Single-file fallback: if response has code but no paths extracted, and exactly 1 target file
  if (results.size === 0 && targetFiles && targetFiles.length === 1) {
    const anyCodeBlock = /```(?:\w*)\n([\s\S]*?)```/;
    const codeMatch = anyCodeBlock.exec(response);
    if (codeMatch) {
      results.set(targetFiles[0], { code: codeMatch[1], explanation: '' });
      log('edit', `Fallback: mapped single code block to target file ${targetFiles[0]}`);
    }
  }

  // Extract explanations — text between code blocks
  const sections = response.split(/```(?:filepath:)?[^\n`]+\n[\s\S]*?```/);
  const paths = Array.from(results.keys());

  for (let i = 0; i < paths.length && i < sections.length; i++) {
    const explanation = sections[i].trim();
    if (explanation) {
      const existing = results.get(paths[i])!;
      existing.explanation = explanation;
    }
  }

  // If no per-file explanation, use remainder as general explanation
  if (paths.length > 0) {
    const lastSection = sections[sections.length - 1]?.trim();
    if (lastSection) {
      for (const path of paths) {
        const existing = results.get(path)!;
        if (!existing.explanation) {
          existing.explanation = lastSection;
        }
      }
    }
  }

  // Warning logging for failed parsing
  if (results.size === 0 && response.length > 100) {
    log('edit', 'Warning: Could not parse any file changes from LLM response', { responseLength: response.length, preview: response.slice(0, 500) });
    if (response.includes('```')) {
      throw new Error('LLM response contains code blocks but no file paths could be extracted. Response preview: ' + response.slice(0, 300));
    }
  }

  return results;
}

/**
 * Parse Claude's response for surgical edits in JSON format.
 * Expected: array of { file, startLine, endLine, newContent, explanation }
 */
export function parseSurgicalEdits(response: string): SurgicalEdit[] {
  // Try to extract JSON array from response
  const jsonMatch = response.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    const edits: SurgicalEdit[] = [];
    for (const item of parsed) {
      if (!item.file || typeof item.startLine !== 'number' || typeof item.newContent !== 'string') {
        continue;
      }
      edits.push({
        file: item.file,
        startLine: item.startLine,
        endLine: typeof item.endLine === 'number' ? item.endLine : item.startLine,
        newContent: item.newContent,
        explanation: item.explanation || '',
      });
    }
    return edits;
  } catch {
    return [];
  }
}

/**
 * Apply surgical edits to file content — splice specific line ranges.
 * Edits are applied bottom-to-top so line numbers stay valid.
 */
export function applySurgicalEditsToContent(
  original: string,
  edits: SurgicalEdit[],
): string {
  const lines = original.split('\n');

  // Sort edits by startLine descending so we apply bottom-up
  const sorted = [...edits].sort((a, b) => b.startLine - a.startLine);

  for (const edit of sorted) {
    const newLines = edit.newContent.split('\n');
    const start = Math.max(0, edit.startLine - 1); // convert to 0-based

    if (edit.endLine === 0) {
      // Pure insertion before startLine
      lines.splice(start, 0, ...newLines);
    } else {
      const end = Math.min(lines.length, edit.endLine); // 1-based inclusive
      const deleteCount = end - start;
      lines.splice(start, deleteCount, ...newLines);
    }
  }

  return lines.join('\n');
}

/**
 * Convert surgical edits into CodeChange objects by applying them to original files.
 */
async function surgicalEditsToChanges(
  edits: SurgicalEdit[],
  fileContents: Map<string, string>,
): Promise<CodeChange[]> {
  // Group edits by file
  const editsByFile = new Map<string, SurgicalEdit[]>();
  for (const edit of edits) {
    const existing = editsByFile.get(edit.file) || [];
    existing.push(edit);
    editsByFile.set(edit.file, existing);
  }

  const changes: CodeChange[] = [];

  for (const [filePath, fileEdits] of editsByFile) {
    const original = fileContents.get(filePath);
    if (original === undefined) {
      log('edit', `Skipping surgical edits for unknown file: ${filePath}`);
      continue;
    }

    const modified = applySurgicalEditsToContent(original, fileEdits);

    // Validate the result
    const isValid = validateSyntax(modified, filePath);
    if (!isValid) {
      log('edit', `Warning: Surgical edits for ${filePath} may produce syntax errors`);
    }

    const diff = simpleDiff(original, modified, filePath);
    const explanation = fileEdits.map(e => e.explanation).filter(Boolean).join('; ');

    changes.push({
      filePath,
      original,
      modified,
      diff,
      explanation: explanation || 'Surgical edit applied',
    });
  }

  return changes;
}

/**
 * Build context about exported function signatures that must stay compatible.
 */
function buildSignatureContext(
  targetFiles: string[],
  graph: KnowledgeGraph,
): string {
  const parts: string[] = [];

  for (const filePath of targetFiles) {
    const nodesInFile = graph.findByFile(filePath);
    const exported = nodesInFile.filter((n) => n.metadata.exported);
    if (exported.length === 0) continue;

    const sigs = exported.map((n) => {
      const params = n.metadata.parameters
        ?.map((p) => `${p.name}${p.type ? ': ' + p.type : ''}`)
        .join(', ') || '';
      const ret = n.metadata.returnType ? `: ${n.metadata.returnType}` : '';
      return `  - \`${n.name}(${params})${ret}\` (line ${n.range.start.line}) ${n.metadata.async ? '[async]' : ''}`;
    });

    parts.push(`**${filePath}** exported signatures (DO NOT change these):\n${sigs.join('\n')}`);
  }

  return parts.join('\n\n');
}

/**
 * Build the surgical edit prompt with few-shot examples.
 */
function buildSurgicalPrompt(
  fileDescriptions: string,
  dependencyContext: string,
  instruction: string,
  signatureContext: string = '',
): string {
  return buildPrompt(
    'You are a precise code modification engine that makes SURGICAL edits.',
    [
      'You receive source files with line numbers and an instruction.',
      'Return a JSON array of surgical edits — each edit targets a specific line range.',
      '',
      '## Output Format (REQUIRED)',
      'Return ONLY a JSON array. No markdown, no explanation outside the JSON.',
      '```json',
      '[',
      '  {',
      '    "file": "src/routes/health.ts",',
      '    "startLine": 5,',
      '    "endLine": 8,',
      '    "newContent": "export function healthCheck(req, res) {\\n  res.json({ status: \'ok\' });\\n}",',
      '    "explanation": "Replaced old health handler with new one"',
      '  }',
      ']',
      '```',
      '',
      '## Few-Shot Examples',
      '',
      '### Example 1: Add an import (insert before line 1)',
      'Input: "Add zod validation import"',
      'Output:',
      '```json',
      '[{"file": "src/routes/users.ts", "startLine": 1, "endLine": 0, "newContent": "import { z } from \'zod\';", "explanation": "Added zod import at top of file"}]',
      '```',
      '',
      '### Example 2: Replace a function body (lines 15-22)',
      'Input: "Add input validation to createUser"',
      'Output:',
      '```json',
      '[',
      '  {"file": "src/routes/users.ts", "startLine": 1, "endLine": 0, "newContent": "import { z } from \'zod\';", "explanation": "Added zod import"},',
      '  {"file": "src/routes/users.ts", "startLine": 15, "endLine": 22, "newContent": "export async function createUser(req, res) {\\n  const schema = z.object({ name: z.string(), email: z.string().email() });\\n  const result = schema.safeParse(req.body);\\n  if (!result.success) return res.status(400).json({ error: result.error });\\n  // ... rest of handler\\n}", "explanation": "Added zod validation to createUser"}',
      ']',
      '```',
      '',
      '### Example 3: Add a new export at end of file (line 50 is last line)',
      'Input: "Export a DEFAULT_TIMEOUT constant"',
      'Output:',
      '```json',
      '[{"file": "src/config.ts", "startLine": 51, "endLine": 0, "newContent": "\\nexport const DEFAULT_TIMEOUT = 30_000;", "explanation": "Added DEFAULT_TIMEOUT export at end of file"}]',
      '```',
      '',
      '## Rules',
      '- startLine/endLine are 1-based and inclusive',
      '- endLine=0 means INSERT before startLine (no lines deleted)',
      '- For replacements: lines from startLine to endLine are removed and replaced with newContent',
      '- newContent uses \\n for line breaks inside JSON strings',
      '- Make the MINIMUM changes needed — do not rewrite unchanged code',
      '- Return edits sorted by startLine ascending',
      '- If a change cannot be safely made, return an empty array []',
      '- PRESERVE all existing function signatures that other code depends on',
      '',
      signatureContext
        ? `## Exported Signatures (MUST stay compatible)\n${signatureContext}\n`
        : '',
      dependencyContext
        ? `## Dependencies (do not break these)\n${dependencyContext}\n`
        : '',
      `## Source Files (with line numbers)\n\n${fileDescriptions}\n`,
      `## Instruction\n${instruction}`,
    ].filter(Boolean).join('\n'),
  );
}

/**
 * Propose code changes based on a natural language instruction.
 * Uses surgical edits by default, falls back to full-file rewrite.
 */
export async function proposeChanges(
  instruction: string,
  targetFiles: string[],
  graph: KnowledgeGraph,
): Promise<CodeChange[]> {
  log('edit', `Proposing changes: "${instruction}"`, {
    targetFiles,
  });

  try {
    // 1. Validate and cap target files
    if (targetFiles.length > 15) {
      log('edit', `Warning: ${targetFiles.length} target files exceeds cap of 15, taking first 15`);
      targetFiles = targetFiles.slice(0, 15);
    }

    const fileContents = new Map<string, string>();
    for (const filePath of targetFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        fileContents.set(filePath, content);
      } catch (error) {
        log('edit', `Skipping unreadable file: ${filePath}`);
      }
    }

    if (fileContents.size === 0 && targetFiles.length > 0) {
      log('edit', 'Warning: none of the target files could be read');
    }

    // 2. Gather dependency context from the graph
    const dependencyContext = gatherDependencyContext(targetFiles, graph);

    // 3. Build file descriptions WITH line numbers for surgical edits
    const fileDescriptions = Array.from(fileContents.entries())
      .map(([path, content]) => {
        const numbered = content.split('\n')
          .map((line, i) => `${(i + 1).toString().padStart(4)}| ${line}`)
          .join('\n');
        return `--- File: ${path} ---\n${numbered}`;
      })
      .join('\n\n');

    // 4. Try surgical edits first
    log('edit', 'Attempting surgical edit mode');
    const signatureContext = buildSignatureContext(targetFiles, graph);
    const surgicalPrompt = buildSurgicalPrompt(fileDescriptions, dependencyContext, instruction, signatureContext);
    const surgicalResponse = await callClaude(surgicalPrompt, 'edit');
    const surgicalEdits = parseSurgicalEdits(surgicalResponse);

    if (surgicalEdits.length > 0) {
      log('edit', `Parsed ${surgicalEdits.length} surgical edit(s)`, {
        files: [...new Set(surgicalEdits.map(e => e.file))],
      });
      const changes = await surgicalEditsToChanges(surgicalEdits, fileContents);
      if (changes.length > 0) {
        log('edit', 'Surgical edits proposed', { fileCount: changes.length });
        return changes;
      }
      log('edit', 'Surgical edits produced no valid changes, falling back to full-file mode');
    } else {
      log('edit', 'No surgical edits parsed, falling back to full-file mode');
    }

    // 5. Fallback: full-file rewrite
    log('edit', 'Using full-file rewrite fallback');
    const fullFileDescriptions = Array.from(fileContents.entries())
      .map(([path, content]) => `--- File: ${path} ---\n${content}`)
      .join('\n\n');

    const fallbackPrompt = buildPrompt(
      'You are a precise code modification engine.',
      [
        'Apply the requested change to the provided source code files.',
        '',
        '## Output Format (REQUIRED)',
        'For each modified file, output EXACTLY this format:',
        '```filepath:EXACT/FILE/PATH.ts',
        '[COMPLETE FILE CONTENT - every line, not just changed parts]',
        '```',
        '',
        '## Example',
        'If asked to "add a health endpoint" to a file at src/routes/index.ts:',
        '```filepath:src/routes/index.ts',
        'import { Router } from "express";',
        'const router = Router();',
        'router.get("/health", (req, res) => { res.json({ status: "ok" }); });',
        'export { router };',
        '```',
        '',
        '## Rules',
        '- The filepath: prefix is REQUIRED — do NOT use ```typescript or ```js',
        '- Return the ENTIRE file content (not diffs, not snippets)',
        '- Only return files that actually changed',
        '- After ALL code blocks, add one paragraph explaining what changed',
        '',
        dependencyContext
          ? `## Dependencies (do not break these)\n${dependencyContext}\n`
          : '',
        `## Source Files\n\n${fullFileDescriptions}\n`,
        `## Instruction\n${instruction}`,
      ].filter(Boolean).join('\n'),
    );

    const fallbackResponse = await callClaude(fallbackPrompt, 'edit');
    const modifiedFiles = parseModifiedFiles(fallbackResponse, targetFiles);

    const changes: CodeChange[] = [];
    for (const [filePath, { code, explanation }] of Array.from(modifiedFiles.entries())) {
      const original = fileContents.get(filePath);
      if (original === undefined) {
        log('edit', `Skipping unknown file from LLM response: ${filePath}`);
        continue;
      }

      const isValid = validateSyntax(code, filePath);
      if (!isValid) {
        log('edit', `Warning: Modified code for ${filePath} may have syntax errors`);
      }

      const diff = simpleDiff(original, code, filePath);
      changes.push({
        filePath,
        original,
        modified: code,
        diff,
        explanation: explanation || 'Code modified as requested',
      });
    }

    log('edit', 'Changes proposed (full-file fallback)', { fileCount: changes.length });
    return changes;
  } catch (error) {
    logError('edit', 'Failed to propose changes', error);
    throw error;
  }
}

/**
 * Validate that proposed code is actually code and not LLM prose/explanation.
 * This is the #1 failure mode: the engine writes explanations as file content.
 */
export function validateNotProse(code: string, filePath: string): { valid: boolean; reason?: string } {
  const trimmed = code.trim();

  // Gate 1: Empty or near-empty content
  if (trimmed.length < 5) {
    return { valid: false, reason: `Content is empty or trivially short (${trimmed.length} chars)` };
  }

  // Gate 2: Starts with prose markers (**, *, #, "Here", "This", etc.)
  const proseStarters = /^(\*\(|\*\*|Here (?:are|is)|This (?:file|code|change|is)|I (?:have|will|would|can|made)|The (?:following|code|file)|Note:|Changes?:|Summary:|##|>\s|No files? found|After line|Diff|Applied|Updated|Modified|Restored)/i;
  if (proseStarters.test(trimmed)) {
    return { valid: false, reason: `Content starts with prose marker: "${trimmed.slice(0, 60)}"` };
  }

  // Gate 2b: Content is a shell error or diff instruction (not code)
  const shellPatterns = /^(No files? found|Error:|Warning:|fatal:|FAIL|PASS|npm ERR|node:|Cannot find|Module not found)/i;
  if (shellPatterns.test(trimmed)) {
    return { valid: false, reason: `Content looks like shell/error output: "${trimmed.slice(0, 60)}"` };
  }

  // Gate 2c: Content is mostly markdown/prose (more than 50% of lines start with non-code chars)
  const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 3) {
    const proseLines = lines.filter(l => {
      const t = l.trim();
      return t.startsWith('*') || t.startsWith('-') || t.startsWith('#') || t.startsWith('>') || t.startsWith('|');
    }).length;
    if (proseLines / lines.length > 0.5) {
      return { valid: false, reason: `Content is ${Math.round(proseLines / lines.length * 100)}% markdown/prose lines` };
    }
  }

  // Gate 3: For source code files, check that it contains code-like patterns
  const ext = filePath.split('.').pop()?.toLowerCase();
  const codeExtensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'css', 'html'];
  if (ext && codeExtensions.includes(ext)) {
    // Must contain at least one of: import/export/function/class/const/let/var/if/for/return/def/func/pub
    const codePatterns = /\b(import|export|function|class|const|let|var|if|for|return|def|func|pub|fn|type|interface|enum|struct|package|module|from|require)\b|[{};()=><]/;
    if (!codePatterns.test(trimmed)) {
      return { valid: false, reason: `Content for ${ext} file contains no code-like patterns` };
    }
  }

  // Gate 4: For JSON files, must parse as JSON
  if (ext === 'json') {
    try {
      JSON.parse(trimmed);
    } catch {
      return { valid: false, reason: 'Content for .json file is not valid JSON' };
    }
  }

  return { valid: true };
}

/**
 * Validate that the modified content is not catastrophically different from original.
 * Catches cases where the LLM replaces an entire file with something completely different.
 */
export function validateSizeRatio(original: string, modified: string, filePath: string): { valid: boolean; reason?: string } {
  const origLen = original.length;
  const modLen = modified.length;

  // Allow any change for very small files (< 50 chars)
  if (origLen < 50) return { valid: true };

  // Reject if modified is less than 10% of original size (catastrophic deletion)
  if (modLen < origLen * 0.1) {
    return {
      valid: false,
      reason: `Modified content is ${modLen} chars, only ${Math.round((modLen / origLen) * 100)}% of original ${origLen} chars — likely catastrophic deletion`,
    };
  }

  // Reject if modified is more than 5x the original (likely included extra prose)
  if (modLen > origLen * 5 && modLen > 5000) {
    return {
      valid: false,
      reason: `Modified content is ${modLen} chars, ${Math.round(modLen / origLen)}x the original ${origLen} chars — likely includes extra content`,
    };
  }

  return { valid: true };
}

/**
 * Apply code changes to disk with safety validation.
 * Rejects changes that look like prose, are catastrophically different in size,
 * or fail syntax validation.
 */
export async function applyChanges(changes: CodeChange[]): Promise<void> {
  const applied: CodeChange[] = [];
  const rejected: Array<{ filePath: string; reason: string }> = [];

  for (const change of changes) {
    // Safety Gate 1: Is this actually code?
    const proseCheck = validateNotProse(change.modified, change.filePath);
    if (!proseCheck.valid) {
      const reason = `REJECTED (not code): ${proseCheck.reason}`;
      log('edit', `⛔ ${change.filePath}: ${reason}`);
      rejected.push({ filePath: change.filePath, reason });
      continue;
    }

    // Safety Gate 2: Is the size change reasonable?
    const sizeCheck = validateSizeRatio(change.original, change.modified, change.filePath);
    if (!sizeCheck.valid) {
      const reason = `REJECTED (size): ${sizeCheck.reason}`;
      log('edit', `⛔ ${change.filePath}: ${reason}`);
      rejected.push({ filePath: change.filePath, reason });
      continue;
    }

    // Safety Gate 3: Does it have valid syntax?
    const syntaxValid = validateSyntax(change.modified, change.filePath);
    if (!syntaxValid) {
      // Syntax errors are a warning for now — reject only if original was valid
      const origValid = validateSyntax(change.original, change.filePath);
      if (origValid) {
        const reason = `REJECTED (syntax): Modified code has syntax errors but original was valid`;
        log('edit', `⛔ ${change.filePath}: ${reason}`);
        rejected.push({ filePath: change.filePath, reason });
        continue;
      }
      // If original also had syntax errors, allow the change (might be fixing them)
      log('edit', `Warning: ${change.filePath} has syntax errors but original did too, allowing`);
    }

    // All gates passed — write the file
    try {
      await fs.writeFile(change.filePath, change.modified, 'utf-8');
      log('edit', `Applied changes to ${change.filePath}`);
      applied.push(change);
    } catch (error) {
      logError('edit', `Failed to write changes to ${change.filePath}`, error);
      throw error;
    }
  }

  if (rejected.length > 0) {
    log('edit', `Safety gates rejected ${rejected.length}/${changes.length} changes`, {
      rejected: rejected.map(r => `${r.filePath}: ${r.reason}`),
    });
  }

  log('edit', `Changes applied: ${applied.length} written, ${rejected.length} rejected`, {
    fileCount: applied.length,
  });
}
