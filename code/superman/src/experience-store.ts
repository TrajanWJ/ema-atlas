/**
 * Experience Store — learns from past decisions and outcomes.
 *
 * Stores what was tried, what worked, what failed, and WHY.
 * Before any new action, searches for similar past experiences
 * and provides them as context for better decisions.
 *
 * This is NOT a log. It's a learning system:
 * - Successful patterns get higher confidence
 * - Failed patterns get lower confidence
 * - Similar problems reuse proven solutions
 */

import { generateEmbedding } from './semantic/embeddings.js';
import { log } from './logger.js';
import type { Experience } from './types.js';

// ── In-memory experience index ──

interface IndexedExperience {
  experience: Experience;
  embedding: number[];
}

class ExperienceIndex {
  private entries: IndexedExperience[] = [];

  clear(): void {
    this.entries = [];
  }

  add(exp: Experience, embedding: number[]): void {
    this.entries.push({ experience: exp, embedding });
  }

  /**
   * Find similar past experiences for a given query/situation.
   */
  search(queryEmbedding: number[], limit: number): Array<{ experience: Experience; score: number }> {
    if (this.entries.length === 0) return [];

    const scored = this.entries.map((entry) => ({
      experience: entry.experience,
      score: cosine(queryEmbedding, entry.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Keyword search fallback.
   */
  searchByKeywords(keywords: string[], limit: number): Experience[] {
    if (this.entries.length === 0) return [];

    const kw = keywords.map((k) => k.toLowerCase());
    const scored = this.entries.map((entry) => {
      const text = experienceToText(entry.experience).toLowerCase();
      const hits = kw.filter((k) => text.includes(k)).length;
      return { experience: entry.experience, hits };
    });

    return scored
      .filter((s) => s.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit)
      .map((s) => s.experience);
  }

  get size(): number {
    return this.entries.length;
  }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, ma = 0, mb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  const d = Math.sqrt(ma) * Math.sqrt(mb);
  return d === 0 ? 0 : dot / d;
}

// ── Singleton ──

const experienceIndex = new ExperienceIndex();

// ── Public API ──

/**
 * Load experiences from working memory state into the search index.
 */
export async function loadExperiences(experiences: Experience[]): Promise<void> {
  experienceIndex.clear();

  for (const exp of experiences) {
    const text = experienceToText(exp);
    const embedding = await generateEmbedding(text);
    experienceIndex.add(exp, embedding);
  }

  log('auto', `Experience index loaded: ${experienceIndex.size} entries`);
}

/**
 * Record a new experience after an action completes.
 */
export function createExperience(
  query: string,
  detectedFlow: string,
  intent: Experience['intent'],
  plan: string[],
  actionsTaken: string[],
  result: Experience['result'],
  affectedFiles: string[],
  lesson: string,
): Experience {
  return {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    query,
    detectedFlow,
    intent,
    plan,
    actionsTaken,
    result,
    affectedFiles,
    lesson,
    confidence: result === 'success' ? 0.8 : result === 'partial' ? 0.5 : 0.2,
  };
}

/**
 * Index a newly created experience for future retrieval.
 */
export async function indexExperience(exp: Experience): Promise<void> {
  const text = experienceToText(exp);
  const embedding = await generateEmbedding(text);
  experienceIndex.add(exp, embedding);
}

/**
 * Find similar past experiences for a new situation.
 * Returns experiences with confidence > 0.3 that match the query.
 */
export async function findSimilarExperiences(
  query: string,
  limit: number = 5,
): Promise<Experience[]> {
  if (experienceIndex.size === 0) return [];

  // Try embedding search
  const embedding = await generateEmbedding(query);
  const results = experienceIndex.search(embedding, limit * 2);

  // Also try keyword search and merge
  const keywords = query.split(/\s+/).filter((w) => w.length > 2);
  const keywordResults = experienceIndex.searchByKeywords(keywords, limit);

  // Merge and deduplicate, prioritizing confident experiences
  const seen = new Set<string>();
  const merged: Experience[] = [];

  // Embedding results first (semantic match)
  for (const r of results) {
    if (r.experience.confidence < 0.3) continue;
    if (seen.has(r.experience.id)) continue;
    seen.add(r.experience.id);
    merged.push(r.experience);
  }

  // Then keyword results
  for (const exp of keywordResults) {
    if (exp.confidence < 0.3) continue;
    if (seen.has(exp.id)) continue;
    seen.add(exp.id);
    merged.push(exp);
  }

  // Sort by confidence (highest first)
  merged.sort((a, b) => b.confidence - a.confidence);

  return merged.slice(0, limit);
}

/**
 * Update confidence of an experience based on whether
 * a similar approach worked again.
 */
export function adjustConfidence(
  experiences: Experience[],
  experienceId: string,
  worked: boolean,
): void {
  const exp = experiences.find((e) => e.id === experienceId);
  if (!exp) return;

  if (worked) {
    // Boost confidence, cap at 1.0
    exp.confidence = Math.min(1.0, exp.confidence + 0.1);
  } else {
    // Reduce confidence, floor at 0.0
    exp.confidence = Math.max(0.0, exp.confidence - 0.15);
  }
}

/**
 * Build a context string from past experiences for LLM prompts.
 * Only includes high-confidence, relevant experiences.
 */
export function buildExperienceContext(experiences: Experience[]): string {
  if (experiences.length === 0) return '';

  const lines: string[] = ['## Lessons from Past Experience'];

  for (const exp of experiences) {
    const icon = exp.result === 'success' ? 'OK' : exp.result === 'partial' ? '~' : 'FAIL';
    lines.push(`\n[${icon}] "${exp.query}" (confidence: ${(exp.confidence * 100).toFixed(0)}%)`);
    lines.push(`  Flow: ${exp.detectedFlow}`);
    lines.push(`  Actions: ${exp.actionsTaken.join(', ')}`);
    lines.push(`  Lesson: ${exp.lesson}`);
    if (exp.result === 'failure') {
      lines.push(`  ⚠ This approach FAILED — avoid repeating it`);
    }
  }

  return lines.join('\n');
}

/**
 * Get the count of consecutive failures for a given flow/query pattern.
 * Used to determine when to escalate to NEEDS_HUMAN_REVIEW.
 */
export function getConsecutiveFailures(
  experiences: Experience[],
  queryPattern: string,
): number {
  const pattern = queryPattern.toLowerCase();
  const matching = experiences
    .filter(e => e.query.toLowerCase().includes(pattern) || e.detectedFlow.toLowerCase().includes(pattern))
    .sort((a, b) => b.timestamp - a.timestamp);

  let count = 0;
  for (const exp of matching) {
    if (exp.result === 'failure') {
      count++;
    } else {
      break; // Stop at first non-failure
    }
  }
  return count;
}

/**
 * Build experience-informed planning context.
 * Includes: successful patterns to reuse, failed approaches to avoid,
 * and escalation flag if too many consecutive failures.
 */
export function buildPlanningContext(
  experiences: Experience[],
  currentQuery: string,
): {
  context: string;
  needsHumanReview: boolean;
  successfulApproaches: Experience[];
  failedApproaches: Experience[];
} {
  if (experiences.length === 0) {
    return {
      context: '',
      needsHumanReview: false,
      successfulApproaches: [],
      failedApproaches: [],
    };
  }

  const successful = experiences.filter(e => e.result === 'success' && e.confidence >= 0.5);
  const failed = experiences.filter(e => e.result === 'failure');
  const consecutiveFailures = getConsecutiveFailures(experiences, currentQuery);
  const needsHumanReview = consecutiveFailures >= 3;

  const parts: string[] = [];

  if (successful.length > 0) {
    parts.push('## Proven Approaches (reuse these patterns)');
    for (const exp of successful.slice(0, 3)) {
      parts.push(`\n[SUCCESS] "${exp.query}" (confidence: ${Math.round(exp.confidence * 100)}%)`);
      parts.push(`  Plan: ${exp.plan.join(' -> ')}`);
      parts.push(`  Lesson: ${exp.lesson}`);
      parts.push(`  Files: ${exp.affectedFiles.slice(0, 5).join(', ')}`);
    }
  }

  if (failed.length > 0) {
    parts.push('\n## Failed Approaches (DO NOT repeat these)');
    for (const exp of failed.slice(0, 3)) {
      parts.push(`\n[FAILED] "${exp.query}"`);
      parts.push(`  Attempted: ${exp.actionsTaken.join(', ')}`);
      parts.push(`  Why it failed: ${exp.lesson}`);
    }
  }

  if (needsHumanReview) {
    parts.push(`\n## WARNING: ${consecutiveFailures} consecutive failures detected`);
    parts.push('This pattern has failed repeatedly. NEEDS HUMAN REVIEW before proceeding.');
    parts.push('Suggest a completely different approach or ask the user for guidance.');
  }

  return {
    context: parts.join('\n'),
    needsHumanReview,
    successfulApproaches: successful,
    failedApproaches: failed,
  };
}

// ── Helpers ──

function experienceToText(exp: Experience): string {
  return [
    `Query: ${exp.query}`,
    `Flow: ${exp.detectedFlow}`,
    `Intent: ${exp.intent}`,
    `Plan: ${exp.plan.join(', ')}`,
    `Actions: ${exp.actionsTaken.join(', ')}`,
    `Result: ${exp.result}`,
    `Files: ${exp.affectedFiles.join(', ')}`,
    `Lesson: ${exp.lesson}`,
  ].join('\n');
}
