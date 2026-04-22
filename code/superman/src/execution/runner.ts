import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { log, logError } from '../logger.js';
import { proposeChanges, applyChanges } from '../modification/engine.js';
import { findRippleTargets, detectBrokenInterfaces } from './ripple-fixer.js';
import { findCoordinatedUpdates } from './api-sync.js';
import type { ExecutionResult, ApplyResult, CodeChange } from '../types.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';

export interface StructuredError {
  file?: string;
  line?: number;
  column?: number;
  code?: string;
  message: string;
  raw: string;
}

export function runCommand(command: string, cwd: string): ExecutionResult {
  const start = Date.now();
  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  try {
    const output = execSync(command, {
      cwd,
      timeout: 60_000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    stdout = output ?? '';
  } catch (err: any) {
    exitCode = err.status ?? 1;
    stdout = err.stdout ?? '';
    stderr = err.stderr ?? '';
  }

  const duration = Date.now() - start;

  log('execute', `Command finished: ${command}`, { exitCode, duration });

  return { command, exitCode, stdout, stderr, duration };
}

function detectBuildCommand(cwd: string): string | null {
  if (fs.existsSync(path.join(cwd, 'package.json'))) return 'npm run build';
  if (fs.existsSync(path.join(cwd, 'Makefile'))) return 'make';
  if (fs.existsSync(path.join(cwd, 'go.mod'))) return 'go build ./...';
  return null;
}

function detectTestCommand(cwd: string): string | null {
  if (fs.existsSync(path.join(cwd, 'package.json'))) return 'npm test';
  if (fs.existsSync(path.join(cwd, 'go.mod'))) return 'go test ./...';
  if (
    fs.existsSync(path.join(cwd, 'pytest.ini')) ||
    fs.existsSync(path.join(cwd, 'setup.py')) ||
    fs.existsSync(path.join(cwd, 'pyproject.toml'))
  ) {
    return 'pytest';
  }
  return null;
}

export function parseStructuredErrors(stderr: string): StructuredError[] {
  if (!stderr || !stderr.trim()) return [];

  const errors: StructuredError[] = [];
  const lines = stderr.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 1: TypeScript compiler - src/file.ts(10,5): error TS2345: message
    const tsMatch = trimmed.match(/^(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)$/);
    if (tsMatch) {
      errors.push({
        file: tsMatch[1],
        line: parseInt(tsMatch[2], 10),
        column: parseInt(tsMatch[3], 10),
        code: tsMatch[4],
        message: tsMatch[5],
        raw: trimmed,
      });
      continue;
    }

    // Pattern 2: Colon-separated - src/file.ts:10:5: error message
    const colonMatch = trimmed.match(/^(.+?\.[a-z]{1,4}):(\d+):(\d+):\s*(?:error\s+)?(.+)$/);
    if (colonMatch) {
      errors.push({
        file: colonMatch[1],
        line: parseInt(colonMatch[2], 10),
        column: parseInt(colonMatch[3], 10),
        message: colonMatch[4],
        raw: trimmed,
      });
      continue;
    }

    // Pattern 3: File:line only - src/file.ts:10: error message
    const fileLineMatch = trimmed.match(/^(.+?\.[a-z]{1,4}):(\d+):\s*(?:error\s+)?(.+)$/);
    if (fileLineMatch) {
      errors.push({
        file: fileLineMatch[1],
        line: parseInt(fileLineMatch[2], 10),
        message: fileLineMatch[3],
        raw: trimmed,
      });
      continue;
    }

    // Pattern 4: "Error in file.ts:" style
    const errorInMatch = trimmed.match(/[Ee]rror\s+in\s+(.+?\.[a-z]{1,4})\s*:\s*(.+)$/);
    if (errorInMatch) {
      errors.push({
        file: errorInMatch[1],
        line: undefined,
        message: errorInMatch[2],
        raw: trimmed,
      });
      continue;
    }

    // Pattern 5: Lines containing "error" (case-insensitive) — capture as unstructured
    if (/error|Error|ERROR|cannot find|unexpected token|failed to/i.test(trimmed)) {
      // Try to extract a file path from the line
      const pathMatch = trimmed.match(/((?:src|lib|app|packages?)\/[^\s:,]+\.[a-z]{1,4})/);
      errors.push({
        file: pathMatch ? pathMatch[1] : undefined,
        message: trimmed,
        raw: trimmed,
      });
    }
  }

  // If no structured errors found but stderr is non-empty, add the whole thing as one error
  if (errors.length === 0 && stderr.trim().length > 0) {
    errors.push({
      message: stderr.trim().slice(0, 500),
      raw: stderr.trim(),
    });
  }

  return errors;
}

export function formatErrorsForPrompt(errors: StructuredError[]): string {
  if (errors.length === 0) return 'No errors detected.';

  return errors.map((err, i) => {
    const parts: string[] = [`Error ${i + 1}:`];
    if (err.file) {
      parts.push(`  File: ${err.file}${err.line ? ` line ${err.line}` : ''}${err.column ? `:${err.column}` : ''}`);
    }
    if (err.code) {
      parts.push(`  Code: ${err.code}`);
    }
    parts.push(`  ${err.message}`);
    return parts.join('\n');
  }).join('\n\n');
}

export function extractErrorFiles(errors: StructuredError[]): string[] {
  const files = new Set<string>();
  for (const err of errors) {
    if (err.file) files.add(err.file);
  }
  return [...files];
}

/**
 * Fingerprint an error for deduplication.
 * Two errors match if they have the same file + line + code, or same raw text.
 */
function errorFingerprint(err: StructuredError): string {
  if (err.file && err.line && err.code) {
    return `${err.file}:${err.line}:${err.code}`;
  }
  if (err.file && err.line) {
    return `${err.file}:${err.line}:${err.message.slice(0, 80)}`;
  }
  return err.raw.slice(0, 120);
}

/**
 * Classify errors as environment issues vs code errors.
 * Environment issues should be skipped — they're not caused by code changes.
 */
export function classifyEnvironmentErrors(errors: StructuredError[]): {
  envErrors: StructuredError[];
  codeErrors: StructuredError[];
} {
  const envPatterns = [
    // Prisma client not generated
    /Cannot find module ['"]@prisma\/client['"]/i,
    /Module '"@prisma\/client"' has no exported member/i,
    /has no exported member 'Prisma'/i,
    /PrismaClientInitializationError/i,
    /PrismaClientKnownRequestError/i,
    /prisma generate/i,
    /@prisma\/client\/default/i,
    // Database not connected
    /Can't reach database server/i,
    /ECONNREFUSED.*5432/i,
    /ECONNREFUSED.*3306/i,
    /ECONNREFUSED.*27017/i,
    /connection.*refused/i,
    /database.*not.*exist/i,
    /role.*does not exist/i,
    /authentication failed for user/i,
    // Missing environment variables
    /Missing.*environment variable/i,
    /env.*not.*set/i,
    /NEXT_PUBLIC_.*undefined/i,
    /process\.env\.\w+.*undefined/i,
    // Node/npm issues
    /Cannot find module ['"][^@]/i, // non-scoped missing module = not installed
    /MODULE_NOT_FOUND/i,
    /ENOENT.*node_modules/i,
    // Type generation issues
    /\.prisma\/client/i,
    /\.generated/i,
  ];

  const envErrors: StructuredError[] = [];
  const codeErrors: StructuredError[] = [];

  for (const err of errors) {
    const text = `${err.message} ${err.raw}`;
    const isEnv = envPatterns.some(p => p.test(text));
    if (isEnv) {
      envErrors.push(err);
    } else {
      codeErrors.push(err);
    }
  }

  return { envErrors, codeErrors };
}

/**
 * Capture baseline errors by running build BEFORE any changes.
 * Returns a Set of error fingerprints that already exist.
 */
export function captureBaseline(buildResult: ExecutionResult): Set<string> {
  const raw = buildResult.stderr || buildResult.stdout;
  const errors = parseStructuredErrors(raw);
  const fingerprints = new Set<string>();
  for (const err of errors) {
    fingerprints.add(errorFingerprint(err));
  }
  return fingerprints;
}

/**
 * Diff current errors against baseline.
 * Returns only errors that are NEW (not in baseline).
 */
export function diffErrors(
  currentErrors: StructuredError[],
  baseline: Set<string>,
): StructuredError[] {
  return currentErrors.filter(err => !baseline.has(errorFingerprint(err)));
}

export async function rollbackChanges(changes: CodeChange[]): Promise<void> {
  for (const change of changes) {
    try {
      await fs.promises.writeFile(change.filePath, change.original, 'utf-8');
      log('execute', `Rolled back ${change.filePath}`);
    } catch (error) {
      logError('execute', `Failed to rollback ${change.filePath}`, error);
    }
  }
  log('execute', `Rollback complete`, { fileCount: changes.length });
}

export async function executionLoop(
  changes: CodeChange[],
  cwd: string,
  graph: KnowledgeGraph,
): Promise<ApplyResult> {
  let currentChanges = changes;
  let iterations = 0;
  let buildResult: ExecutionResult | undefined;
  let testResult: ExecutionResult | undefined;

  log('execute', 'Starting execution loop', { fileCount: changes.length });

  const buildCommand = detectBuildCommand(cwd);

  // ── Step 1: Capture baseline errors BEFORE applying changes ──
  let baselineFingerprints = new Set<string>();
  let baselineEnvErrorCount = 0;

  if (buildCommand) {
    log('execute', 'Capturing baseline build errors (before changes)');
    const baselineBuild = runCommand(buildCommand, cwd);

    if (baselineBuild.exitCode !== 0) {
      const baselineRaw = baselineBuild.stderr || baselineBuild.stdout;
      const baselineErrors = parseStructuredErrors(baselineRaw);
      const { envErrors, codeErrors } = classifyEnvironmentErrors(baselineErrors);
      baselineFingerprints = captureBaseline(baselineBuild);
      baselineEnvErrorCount = envErrors.length;

      log('execute', `Baseline: ${baselineErrors.length} total errors (${envErrors.length} environment, ${codeErrors.length} code)`, {
        envExamples: envErrors.slice(0, 3).map(e => e.message.slice(0, 80)),
      });
    } else {
      log('execute', 'Baseline: clean build (0 errors)');
    }
  }

  // ── Step 2: Apply the initial changes ──
  await applyChanges(currentChanges);
  iterations++;

  // ── Step 2b: Ripple effect detection ──
  // After applying changes and before build validation, walk the import graph
  // to find dependent files that may be broken by interface changes.
  const changedFilePaths = currentChanges.map((c) => c.filePath);
  const rippleTargets = findRippleTargets(changedFilePaths, graph);

  if (rippleTargets.length > 0) {
    log('execute', `Ripple effect: ${rippleTargets.length} dependent files may need updates`, {
      files: rippleTargets.map((t) => t.filePath),
    });

    // Check for broken interfaces (removed exports, changed signatures)
    for (const change of currentChanges) {
      if (change.original && change.modified) {
        const broken = detectBrokenInterfaces(change.filePath, change.original, change.modified, graph);
        if (broken.length > 0) {
          log('execute', 'Broken interfaces detected — dependent files may need fixes', {
            breakages: broken.map((b) => b.detail),
            affectedFiles: [...new Set(broken.flatMap((b) => b.affectedFiles))],
          });
        }
      }
    }
  }

  // ── Step 2c: Frontend/backend coordination ──
  const coordinated = findCoordinatedUpdates(changedFilePaths, graph);
  if (coordinated.length > 0) {
    for (const { backendFile, frontendFiles } of coordinated) {
      log('execute', `Backend change in ${backendFile} affects ${frontendFiles.length} frontend files`, {
        frontendFiles,
      });
    }
  }

  // ── Step 3: Run build and check for NEW errors only ──
  if (buildCommand) {
    buildResult = runCommand(buildCommand, cwd);

    if (buildResult.exitCode !== 0) {
      const rawError = buildResult.stderr || buildResult.stdout;
      const allErrors = parseStructuredErrors(rawError);
      const { envErrors, codeErrors } = classifyEnvironmentErrors(allErrors);
      const newErrors = diffErrors(codeErrors, baselineFingerprints);

      log('execute', `Post-change build: ${allErrors.length} total, ${envErrors.length} env, ${newErrors.length} NEW code errors`, {
        newErrors: newErrors.slice(0, 5).map(e => e.raw.slice(0, 100)),
      });

      // If ALL errors are either environment or pre-existing, treat as success
      if (newErrors.length === 0) {
        log('execute', 'Build has errors but NONE are new — treating as success (pre-existing/env errors only)');
        // Synthesize a "passing" result for downstream consumers
        buildResult = { ...buildResult, exitCode: 0 };
      } else {
        // Only fix NEW errors introduced by our changes
        let retries = 0;
        while (newErrors.length > 0 && retries < config.maxRetries) {
          retries++;
          iterations++;
          log('execute', `${newErrors.length} new error(s), attempting auto-fix (retry ${retries}/${config.maxRetries})`);

          const targetFiles = currentChanges.map(c => c.filePath);
          const errorFiles = extractErrorFiles(newErrors);
          const fixTargets = errorFiles.length > 0
            ? [...new Set([...errorFiles, ...targetFiles])].slice(0, 10)
            : targetFiles.slice(0, 10);
          const formattedErrors = formatErrorsForPrompt(newErrors);
          const instruction = `Fix these build errors (ONLY these — ignore any other errors in the project):\n${formattedErrors.slice(0, 3000)}`;

          try {
            const fixes = await proposeChanges(instruction, fixTargets, graph);
            await applyChanges(fixes);
            currentChanges = [...currentChanges, ...fixes];
          } catch (err) {
            logError('execute', 'Auto-fix proposal failed', err);
            break;
          }

          buildResult = runCommand(buildCommand, cwd);
          if (buildResult.exitCode === 0) break;

          // Re-diff to see if we fixed the new errors
          const retryRaw = buildResult.stderr || buildResult.stdout;
          const retryAll = parseStructuredErrors(retryRaw);
          const retryClassified = classifyEnvironmentErrors(retryAll);
          const retryNew = diffErrors(retryClassified.codeErrors, baselineFingerprints);

          if (retryNew.length === 0) {
            log('execute', 'All new errors fixed — remaining errors are pre-existing/env only');
            buildResult = { ...buildResult, exitCode: 0 };
            break;
          }

          // Update for next iteration
          newErrors.length = 0;
          newErrors.push(...retryNew);
        }

        // If still have new errors after retries, rollback
        if (newErrors.length > 0 && buildResult.exitCode !== 0) {
          // Final check — maybe all remaining are pre-existing
          const finalRaw = buildResult.stderr || buildResult.stdout;
          const finalAll = parseStructuredErrors(finalRaw);
          const finalClassified = classifyEnvironmentErrors(finalAll);
          const finalNew = diffErrors(finalClassified.codeErrors, baselineFingerprints);

          if (finalNew.length === 0) {
            log('execute', 'After retries, no new errors remain — success');
            buildResult = { ...buildResult, exitCode: 0 };
          } else {
            log('execute', `${finalNew.length} new error(s) remain after all retries — rolling back`);
            await rollbackChanges(changes);
            return {
              changes: currentChanges,
              buildResult,
              iterations,
              success: false,
            };
          }
        }
      }
    }
  }

  // ── Step 4: Run tests ──
  const testCommand = detectTestCommand(cwd);
  if (testCommand) {
    testResult = runCommand(testCommand, cwd);
    log('execute', 'Tests completed', { exitCode: testResult.exitCode });
  }

  const success = (buildResult ? buildResult.exitCode === 0 : true) &&
    (testResult ? testResult.exitCode === 0 : true);

  log('execute', 'Execution loop finished', { iterations, success });

  return {
    changes: currentChanges,
    buildResult,
    testResult,
    iterations,
    success,
  };
}
