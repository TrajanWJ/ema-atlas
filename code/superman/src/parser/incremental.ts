import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { log, logError } from '../logger.js';
import type { KnowledgeGraph } from '../graph/knowledge-graph.js';

export class FileHashCache {
  private hashes: Map<string, string> = new Map();

  hasChanged(filePath: string, content: string): boolean {
    const newHash = createHash('sha256').update(content).digest('hex');
    const stored = this.hashes.get(filePath);
    return stored !== newHash;
  }

  updateHash(filePath: string, content: string): void {
    const hash = createHash('sha256').update(content).digest('hex');
    this.hashes.set(filePath, hash);
  }

  async getChangedFiles(allFiles: string[], repoPath: string): Promise<string[]> {
    const changed: string[] = [];
    for (const relFile of allFiles) {
      const absPath = join(repoPath, relFile);
      try {
        const content = await readFile(absPath, 'utf-8');
        if (this.hasChanged(relFile, content)) {
          changed.push(relFile);
        }
      } catch {
        // File unreadable — treat as changed so it gets re-parsed
        changed.push(relFile);
      }
    }
    return changed;
  }

  invalidateDependents(changedFile: string, graph: KnowledgeGraph): string[] {
    const invalidated: string[] = [];

    // Find all nodes in the changed file
    const nodesInFile = graph.findByFile(changedFile);

    for (const node of nodesInFile) {
      // Use reverse edges to find files that import/use this node
      const reverseMap = graph.reverse.get(node.id);
      if (reverseMap) {
        for (const sourceId of reverseMap.keys()) {
          const sourceNode = graph.getNode(sourceId);
          if (sourceNode && sourceNode.filePath !== changedFile) {
            // Invalidate by removing the stored hash so it will be re-parsed
            this.hashes.delete(sourceNode.filePath);
            if (!invalidated.includes(sourceNode.filePath)) {
              invalidated.push(sourceNode.filePath);
            }
          }
        }
      }
    }

    return invalidated;
  }

  clearCache(): void {
    this.hashes.clear();
  }

  async load(projectPath: string): Promise<void> {
    const cachePath = join(projectPath, '.superman', 'file-hashes.json');
    try {
      const data = await readFile(cachePath, 'utf-8');
      const parsed = JSON.parse(data) as Record<string, string>;
      this.hashes = new Map(Object.entries(parsed));
      log('cache', `Loaded file hash cache: ${this.hashes.size} entries`);
    } catch {
      // No cache file yet — start fresh
      this.hashes = new Map();
    }
  }

  async save(projectPath: string): Promise<void> {
    const cacheDir = join(projectPath, '.superman');
    const cachePath = join(cacheDir, 'file-hashes.json');
    try {
      await mkdir(cacheDir, { recursive: true });
      const obj: Record<string, string> = Object.fromEntries(this.hashes);
      await writeFile(cachePath, JSON.stringify(obj, null, 2), 'utf-8');
      log('cache', `Saved file hash cache: ${this.hashes.size} entries`);
    } catch (err) {
      logError('cache', 'Failed to save file hash cache', err);
    }
  }
}
