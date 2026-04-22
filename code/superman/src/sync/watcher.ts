import * as chokidar from 'chokidar';
import fs from 'fs/promises';
import { log, logError } from '../logger.js';
import { extractFromFile } from '../parser/extractor.js';
import type { ParseResult } from '../types.js';
import type { FileHashCache } from '../parser/incremental.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';

export class FileWatcher {
  private repoPath: string;
  private onUpdate: (results: ParseResult[]) => Promise<void>;
  private watcher: ReturnType<typeof chokidar.watch> | null = null;
  private pendingChanges: Set<string> = new Set();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private onDeleteCallback: ((filePath: string) => Promise<void>) | null = null;
  private fileHashCache: FileHashCache | null = null;
  private graphRef: KnowledgeGraph | null = null;

  constructor(
    repoPath: string,
    onUpdate: (results: ParseResult[]) => Promise<void>,
    options?: { fileHashCache?: FileHashCache; graph?: KnowledgeGraph },
  ) {
    this.repoPath = repoPath;
    this.onUpdate = onUpdate;
    this.fileHashCache = options?.fileHashCache ?? null;
    this.graphRef = options?.graph ?? null;
  }

  setOnDelete(callback: (filePath: string) => Promise<void>): void {
    this.onDeleteCallback = callback;
  }

  start(): void {
    log('sync', 'Starting file watcher', { repoPath: this.repoPath });

    this.watcher = chokidar.watch('**/*.{ts,tsx,js,jsx,py,go,rs,java}', {
      cwd: this.repoPath,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.git/**'],
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('add', (relativePath) => {
      log('sync', 'File added', { path: relativePath });
      this.scheduleUpdate(relativePath);
    });

    this.watcher.on('change', (relativePath) => {
      log('sync', 'File changed', { path: relativePath });
      this.scheduleUpdate(relativePath);
    });

    this.watcher.on('unlink', (relativePath) => {
      log('sync', 'File deleted', { path: relativePath });
      const fullPath = `${this.repoPath}/${relativePath}`;
      if (this.onDeleteCallback) {
        this.onDeleteCallback(fullPath).catch((err) => {
          logError('sync', 'Error handling file deletion', err);
        });
      }
    });

    this.watcher.on('error', (err) => {
      logError('sync', 'Watcher error', err);
    });

    log('sync', 'File watcher started');
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.pendingChanges.clear();
    log('sync', 'File watcher stopped');
  }

  private scheduleUpdate(relativePath: string): void {
    this.pendingChanges.add(relativePath);

    // Invalidate hash cache for this file and its dependents
    if (this.fileHashCache) {
      this.fileHashCache.updateHash(relativePath, ''); // Force stale by clearing hash
      if (this.graphRef) {
        const dependents = this.fileHashCache.invalidateDependents(relativePath, this.graphRef);
        if (dependents.length > 0) {
          log('sync', `Invalidated ${dependents.length} dependent file(s)`, { dependents });
        }
      }
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processBatch();
    }, 500);
  }

  private async processBatch(): Promise<void> {
    const paths = Array.from(this.pendingChanges);
    this.pendingChanges.clear();
    this.debounceTimer = null;

    if (paths.length === 0) return;

    log('sync', `Processing batch of ${paths.length} file(s)`, { files: paths });

    const results: ParseResult[] = [];

    for (const relativePath of paths) {
      const fullPath = `${this.repoPath}/${relativePath}`;

      try {
        const source = await fs.readFile(fullPath, 'utf-8');
        const parseResult = extractFromFile(fullPath, source);
        results.push(parseResult);
      } catch (err) {
        logError('sync', `Failed to parse file: ${relativePath}`, err);
      }
    }

    if (results.length > 0) {
      try {
        await this.onUpdate(results);
        log('sync', `Batch update completed: ${results.length} file(s) processed`);
      } catch (err) {
        logError('sync', 'Error in onUpdate callback', err);
      }
    }
  }
}
