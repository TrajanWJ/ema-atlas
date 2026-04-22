import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { glob } from 'glob';
import { log, logError } from '../logger.js';
import { extractFromFile } from './extractor.js';
import type { ParseResult } from '../types.js';
import type { FileHashCache } from './incremental.js';

const SOURCE_PATTERNS = '**/*.{ts,tsx,js,jsx,py,go,rs,java}';

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/.git/**',
  '**/*.d.ts',
  '**/*.min.js',
  '**/vendor/**',
  '**/build/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/__pycache__/**',
  '**/target/**',
  '**/.venv/**',
  '**/venv/**',
  '**/.bundle/**',
  '**/packages/*/node_modules/**',
];

export async function parseRepository(
  repoPath: string,
  options?: { hashCache?: FileHashCache; forceReparse?: boolean },
): Promise<ParseResult[]> {
  log('parse', `Scanning repository at ${repoPath}`);

  const files = await glob(SOURCE_PATTERNS, {
    cwd: repoPath,
    ignore: IGNORE_PATTERNS,
    nodir: true,
    absolute: false,
  });

  log('parse', `Found ${files.length} source files`);

  const hashCache = options?.hashCache;
  const forceReparse = options?.forceReparse ?? false;

  const results: ParseResult[] = [];
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const relFile of files) {
    const absPath = join(repoPath, relFile);
    try {
      const source = await readFile(absPath, 'utf-8');

      // Skip unchanged files unless force-reparsing
      if (hashCache && !forceReparse && !hashCache.hasChanged(relFile, source)) {
        skipped++;
        continue;
      }

      const result = extractFromFile(relFile, source);

      if (result.nodes.length > 0) {
        results.push(result);
      }

      // Update hash after successful parse
      if (hashCache) {
        hashCache.updateHash(relFile, source);
      }

      processed++;
      if (processed % 50 === 0) {
        log('parse', `Progress: ${processed}/${files.length} files parsed`, {
          nodes: results.reduce((sum, r) => sum + r.nodes.length, 0),
          edges: results.reduce((sum, r) => sum + r.edges.length, 0),
        });
      }
    } catch (err) {
      errors++;
      logError('parse', `Failed to parse ${relFile}`, err);
    }
  }

  const totalNodes = results.reduce((sum, r) => sum + r.nodes.length, 0);
  const totalEdges = results.reduce((sum, r) => sum + r.edges.length, 0);

  if (hashCache && !forceReparse) {
    log('parse', `Skipped ${skipped} unchanged, re-parsed ${processed} files`);
  }

  log('parse', `Parsing complete`, {
    filesProcessed: processed,
    filesSkipped: skipped,
    filesWithErrors: errors,
    totalNodes,
    totalEdges,
    totalResults: results.length,
  });

  return results;
}
