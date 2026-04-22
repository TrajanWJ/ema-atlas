/**
 * apply_task — Deterministic code modification tool.
 *
 * Does NOT call Claude internally. Accepts structured edits and applies them.
 * Two modes:
 * 1. Surgical edits: array of { file, startLine, endLine, newContent }
 * 2. Full file writes: array of { file, content }
 *
 * After applying, runs build check with baseline diffing.
 */

import * as fs from 'fs/promises';
import { getOrRecoverSession, saveSnapshot } from '../session.ts';
import { validateSyntax, validateNotProse, validateSizeRatio } from '../../src/modification/engine.ts';
import { applySurgicalEditsToContent } from '../../src/modification/engine.ts';
import { simpleDiff } from '../../src/modification/engine.ts';
import { runCommand, captureBaseline, parseStructuredErrors, classifyEnvironmentErrors, diffErrors } from '../../src/execution/runner.ts';
import { findDependentFiles } from '../../src/intelligence/ripple-detector.ts';
import { log } from '../../src/logger.ts';
import type { SurgicalEdit } from '../../src/types.ts';

interface FullFileWrite {
  file: string;
  content: string;
}

interface SurgicalEditInput {
  file: string;
  startLine: number;
  endLine: number;
  newContent: string;
  explanation?: string;
}

interface ApplyInput {
  surgical_edits?: SurgicalEditInput[];
  file_writes?: FullFileWrite[];
}

export async function applyTask(input: ApplyInput) {
  const session = await getOrRecoverSession('apply_task');

  const cwd = session.repoPath;
  const edits = input.surgical_edits ?? [];
  const writes = input.file_writes ?? [];

  if (edits.length === 0 && writes.length === 0) {
    return {
      success: false,
      error: 'No edits or writes provided. Supply surgical_edits (array of {file, startLine, endLine, newContent}) or file_writes (array of {file, content}).',
    };
  }

  // Collect all affected files
  const affectedFiles = new Set<string>();
  for (const edit of edits) affectedFiles.add(edit.file);
  for (const write of writes) affectedFiles.add(write.file);

  // Save snapshot for rollback
  await saveSnapshot([...affectedFiles]);

  // Capture baseline build errors BEFORE changes
  let baselineFingerprints = new Set<string>();
  const buildCommand = detectBuildCommand(cwd);
  if (buildCommand) {
    const baselineBuild = runCommand(buildCommand, cwd);
    if (baselineBuild.exitCode !== 0) {
      baselineFingerprints = captureBaseline(baselineBuild);
      log('mcp', `Baseline: ${baselineFingerprints.size} pre-existing errors captured`);
    }
  }

  const applied: Array<{ file: string; diff: string }> = [];
  const rejected: Array<{ file: string; reason: string }> = [];

  // Apply surgical edits
  if (edits.length > 0) {
    // Group by file
    const editsByFile = new Map<string, SurgicalEditInput[]>();
    for (const edit of edits) {
      const existing = editsByFile.get(edit.file) || [];
      existing.push(edit);
      editsByFile.set(edit.file, existing);
    }

    for (const [filePath, fileEdits] of editsByFile) {
      try {
        const original = await fs.readFile(filePath, 'utf-8');
        // Convert to SurgicalEdit (add default explanation)
        const typedEdits: SurgicalEdit[] = fileEdits.map(e => ({
          ...e,
          explanation: e.explanation ?? '',
        }));
        const modified = applySurgicalEditsToContent(original, typedEdits);

        // Validate
        const proseCheck = validateNotProse(modified, filePath);
        if (!proseCheck.valid) {
          rejected.push({ file: filePath, reason: `Not code: ${proseCheck.reason}` });
          continue;
        }
        const sizeCheck = validateSizeRatio(original, modified, filePath);
        if (!sizeCheck.valid) {
          rejected.push({ file: filePath, reason: `Size issue: ${sizeCheck.reason}` });
          continue;
        }
        const syntaxValid = validateSyntax(modified, filePath);
        if (!syntaxValid && validateSyntax(original, filePath)) {
          rejected.push({ file: filePath, reason: 'Introduces syntax errors' });
          continue;
        }

        await fs.writeFile(filePath, modified, 'utf-8');
        const diff = simpleDiff(original, modified, filePath);
        applied.push({ file: filePath, diff });
      } catch (err: any) {
        rejected.push({ file: filePath, reason: err.message });
      }
    }
  }

  // Apply full file writes
  for (const write of writes) {
    try {
      let original = '';
      try {
        original = await fs.readFile(write.file, 'utf-8');
      } catch {
        // New file
      }

      const proseCheck = validateNotProse(write.content, write.file);
      if (!proseCheck.valid) {
        rejected.push({ file: write.file, reason: `Not code: ${proseCheck.reason}` });
        continue;
      }
      if (original) {
        const sizeCheck = validateSizeRatio(original, write.content, write.file);
        if (!sizeCheck.valid) {
          rejected.push({ file: write.file, reason: `Size issue: ${sizeCheck.reason}` });
          continue;
        }
      }

      await fs.writeFile(write.file, write.content, 'utf-8');
      const diff = original ? simpleDiff(original, write.content, write.file) : `+++ new file: ${write.file}`;
      applied.push({ file: write.file, diff });
    } catch (err: any) {
      rejected.push({ file: write.file, reason: err.message });
    }
  }

  // Build check with baseline diffing
  let buildStatus: 'pass' | 'fail_new' | 'fail_preexisting' | 'no_build' = 'no_build';
  let newErrors: string[] = [];

  if (buildCommand && applied.length > 0) {
    const buildResult = runCommand(buildCommand, cwd);
    if (buildResult.exitCode === 0) {
      buildStatus = 'pass';
    } else {
      const raw = buildResult.stderr || buildResult.stdout;
      const allErrors = parseStructuredErrors(raw);
      const { codeErrors } = classifyEnvironmentErrors(allErrors);
      const onlyNew = diffErrors(codeErrors, baselineFingerprints);

      if (onlyNew.length === 0) {
        buildStatus = 'fail_preexisting';
      } else {
        buildStatus = 'fail_new';
        newErrors = onlyNew.map(e => e.raw.slice(0, 200));
      }
    }
  }

  // Ripple effects
  const dependents = findDependentFiles(applied.map(a => a.file), session.graph);

  return {
    success: buildStatus !== 'fail_new',
    applied: applied.length,
    rejected: rejected.length,
    buildStatus,
    diffs: applied,
    rejections: rejected,
    newBuildErrors: newErrors,
    rippleEffects: dependents.length > 0 ? dependents : undefined,
    rollbackAvailable: true,
  };
}

function detectBuildCommand(cwd: string): string | null {
  const fss = require('fs');
  const path = require('path');
  if (fss.existsSync(path.join(cwd, 'package.json'))) return 'npm run build 2>&1 || true';
  if (fss.existsSync(path.join(cwd, 'Makefile'))) return 'make 2>&1 || true';
  if (fss.existsSync(path.join(cwd, 'go.mod'))) return 'go build ./... 2>&1 || true';
  return null;
}
