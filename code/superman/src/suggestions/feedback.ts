import * as fs from 'fs/promises';
import * as path from 'path';
import { log } from '../logger.js';

// ── Types ──

export interface FeedbackEntry {
  suggestionId: string;
  category: 'fix' | 'feature' | 'insight';
  system: string;
  action: 'built' | 'dismissed' | 'deferred';
  outcome?: 'success' | 'failure' | 'partial';
  buildIterations?: number;
  timestamp: number;
  errorSummary?: string;
}

export interface FeedbackStats {
  totalBuilt: number;
  totalSucceeded: number;
  totalFailed: number;
  successRate: number;
  avgIterations: number;
  byCategory: Record<string, { built: number; succeeded: number }>;
  bySystem: Record<string, { built: number; succeeded: number }>;
  recentFailurePatterns: string[];
}

// ── Feedback Store ──

export class FeedbackStore {
  private entries: FeedbackEntry[] = [];
  private filePath: string;

  constructor(projectPath: string) {
    this.filePath = path.join(projectPath, '.codevault-feedback.json');
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      this.entries = JSON.parse(data);
      log('auto', `Loaded ${this.entries.length} feedback entries`);
    } catch {
      this.entries = [];
    }
  }

  async save(): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.entries, null, 2), 'utf-8');
    } catch (err) {
      log('auto', `Failed to save feedback: ${err}`);
    }
  }

  record(entry: FeedbackEntry): void {
    this.entries.push(entry);
    log('auto', `Feedback recorded: ${entry.suggestionId} → ${entry.action}${entry.outcome ? ' (' + entry.outcome + ')' : ''}`);
    // Auto-save with error handling
    this.save().catch((err) => {
      log('auto', `Warning: feedback save failed: ${err}`);
    });
  }

  /**
   * Get success rate for a specific system — used to adjust suggestion scores.
   * If a system has a low success rate, boost its suggestions (needs more attention).
   * If a system has a high success rate, lower priority (it's well-handled).
   */
  getSystemSuccessRate(system: string): number | null {
    const systemEntries = this.entries.filter(
      (e) => e.system === system && e.action === 'built' && e.outcome
    );
    if (systemEntries.length < 2) return null; // Not enough data

    const succeeded = systemEntries.filter((e) => e.outcome === 'success').length;
    return succeeded / systemEntries.length;
  }

  /**
   * Get patterns that tend to fail — used to add warnings to instructions.
   */
  getFailurePatterns(): string[] {
    const recent = this.entries
      .filter((e) => e.outcome === 'failure' && e.errorSummary)
      .slice(-10);
    return recent.map((e) => e.errorSummary!);
  }

  /**
   * Score adjustment based on feedback history.
   * Returns a multiplier: > 1 means boost, < 1 means lower.
   */
  getScoreAdjustment(system: string, category: string): number {
    const rate = this.getSystemSuccessRate(system);
    if (rate === null) return 1; // No data, no adjustment

    // Low success rate → boost priority (needs fixing)
    if (rate < 0.3) return 1.3;
    if (rate < 0.5) return 1.15;
    // High success rate → slight decrease (well-handled)
    if (rate > 0.8) return 0.9;
    return 1;
  }

  /**
   * Check if a similar suggestion was recently dismissed.
   */
  wasRecentlyDismissed(system: string, description: string): boolean {
    const oneDay = 24 * 60 * 60 * 1000;
    const recent = this.entries.filter(
      (e) => e.action === 'dismissed' &&
             e.system === system &&
             Date.now() - e.timestamp < oneDay
    );
    return recent.length > 0;
  }

  getStats(): FeedbackStats {
    const built = this.entries.filter((e) => e.action === 'built');
    const succeeded = built.filter((e) => e.outcome === 'success');
    const failed = built.filter((e) => e.outcome === 'failure');

    const byCategory: Record<string, { built: number; succeeded: number }> = {};
    const bySystem: Record<string, { built: number; succeeded: number }> = {};

    for (const entry of built) {
      // By category
      if (!byCategory[entry.category]) byCategory[entry.category] = { built: 0, succeeded: 0 };
      byCategory[entry.category].built++;
      if (entry.outcome === 'success') byCategory[entry.category].succeeded++;

      // By system
      if (!bySystem[entry.system]) bySystem[entry.system] = { built: 0, succeeded: 0 };
      bySystem[entry.system].built++;
      if (entry.outcome === 'success') bySystem[entry.system].succeeded++;
    }

    const totalIterations = built
      .filter((e) => e.buildIterations !== undefined)
      .reduce((sum, e) => sum + (e.buildIterations || 0), 0);
    const iterationCount = built.filter((e) => e.buildIterations !== undefined).length;

    return {
      totalBuilt: built.length,
      totalSucceeded: succeeded.length,
      totalFailed: failed.length,
      successRate: built.length > 0 ? succeeded.length / built.length : 0,
      avgIterations: iterationCount > 0 ? totalIterations / iterationCount : 0,
      byCategory,
      bySystem,
      recentFailurePatterns: this.getFailurePatterns(),
    };
  }
}
