/**
 * BM25-like search using MiniSearch.
 * Code-aware: boosts symbol names 5x over content, supports fuzzy matching.
 */
import MiniSearch from 'minisearch';
import { log } from '../logger.js';

export interface BM25Document {
  id: string;
  name: string;
  filePath: string;
  content: string;
}

export interface BM25Result {
  id: string;
  score: number;
}

export class BM25Index {
  private index: MiniSearch<BM25Document> | null = null;
  private docCount = 0;

  build(documents: BM25Document[]): void {
    this.index = new MiniSearch<BM25Document>({
      idField: 'id',
      fields: ['name', 'filePath', 'content'],
      storeFields: ['name', 'filePath'],
      searchOptions: {
        boost: { name: 5, filePath: 1.5, content: 1 },
        fuzzy: 0.2,
        prefix: true,
      },
      tokenize: (text: string) => {
        return text
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/[_.\-/\\]/g, ' ')
          .toLowerCase()
          .split(/\s+/)
          .filter((t) => t.length > 1);
      },
    });

    this.index.addAll(documents);
    this.docCount = documents.length;
    log('embed', `BM25 index built: ${documents.length} docs`);
  }

  search(query: string, limit: number = 30): BM25Result[] {
    if (!this.index) return [];

    const results = this.index.search(query, {
      boost: { name: 5, filePath: 1.5, content: 1 },
      fuzzy: 0.2,
      prefix: true,
      combineWith: 'OR',
    });

    return results.slice(0, limit).map((r) => ({
      id: String(r.id),
      score: r.score,
    }));
  }

  get size(): number {
    return this.docCount;
  }
}
