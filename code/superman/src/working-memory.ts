import fs from 'fs/promises';
import path from 'path';
import { log, logError } from './logger.js';
import {
  loadExperiences,
  indexExperience,
  findSimilarExperiences,
  createExperience,
  adjustConfidence,
  buildExperienceContext,
} from './experience-store.js';
import type { WorkingState, Gap, PlanStep, Decision, ProjectModel, Experience, StructuredFlow } from './types.js';

const MEMORY_FILE = '.codevault-memory.json';

/**
 * Persistent working memory that survives across iterations and sessions.
 * Stored as JSON alongside the project root.
 */
export class WorkingMemory {
  private state: WorkingState;
  private projectRoot: string;
  private dirty = false;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.state = createEmptyState();
  }

  // ── Lifecycle ──

  async load(): Promise<boolean> {
    const filePath = this.filePath();
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw) as WorkingState;
      // Ensure experiences array exists (backward compat)
      if (!parsed.experiences) parsed.experiences = [];
      this.state = parsed;
      log('auto', `Working memory loaded (iteration ${parsed.iteration}, ${parsed.decisions.length} decisions, ${parsed.experiences.length} experiences)`);

      // Hydrate the experience search index
      if (parsed.experiences.length > 0) {
        await loadExperiences(parsed.experiences);
      }

      return true;
    } catch {
      log('auto', 'No prior working memory found — starting fresh');
      this.state = createEmptyState();
      return false;
    }
  }

  async save(): Promise<void> {
    const filePath = this.filePath();
    try {
      await fs.writeFile(filePath, JSON.stringify(this.state, null, 2), 'utf-8');
      this.dirty = false;
      log('auto', `Working memory saved (iteration ${this.state.iteration})`);
    } catch (err) {
      logError('auto', 'Failed to save working memory', err);
    }
  }

  private filePath(): string {
    return path.join(this.projectRoot, MEMORY_FILE);
  }

  // ── Accessors ──

  get iteration(): number {
    return this.state.iteration;
  }

  get gaps(): Gap[] {
    return this.state.gaps;
  }

  get plan(): PlanStep[] {
    return this.state.plan;
  }

  get decisions(): Decision[] {
    return this.state.decisions;
  }

  get health(): number {
    return this.state.health;
  }

  get intent(): ProjectModel {
    return this.state.intent;
  }

  get resolvedGapKeys(): string[] {
    return this.state.resolvedGapKeys;
  }

  get failedStepIds(): number[] {
    return this.state.failedStepIds;
  }

  get flows(): StructuredFlow[] {
    return this.state.flows;
  }

  get changedFiles(): string[] {
    return this.state.changedFiles;
  }

  updateFlows(flows: StructuredFlow[]): void {
    this.state.flows = flows;
    this.dirty = true;
  }

  addChangedFiles(files: string[]): void {
    for (const f of files) {
      if (!this.state.changedFiles.includes(f)) {
        this.state.changedFiles.push(f);
      }
    }
    // Cap at 500
    if (this.state.changedFiles.length > 500) {
      this.state.changedFiles = this.state.changedFiles.slice(-500);
    }
    this.dirty = true;
  }

  clearChangedFiles(): void {
    this.state.changedFiles = [];
    this.dirty = true;
  }

  // ── Incremental Updates ──

  /**
   * Advance to the next iteration. Does NOT clear state —
   * only increments the counter.
   */
  nextIteration(): void {
    this.state.iteration++;
    this.dirty = true;
  }

  /**
   * Update the intent model. Merges new data rather than replacing:
   * keeps existing systems that are still present, adds new ones,
   * preserves stats history.
   */
  updateIntent(newModel: ProjectModel): void {
    const prev = this.state.intent;

    // If first run, just assign
    if (prev.stats.files === 0) {
      this.state.intent = newModel;
      this.dirty = true;
      return;
    }

    // Merge systems: keep existing completeness trajectory
    const existingSystems = new Map(prev.systems.map((s) => [s.domain, s]));
    for (const system of newModel.systems) {
      const existing = existingSystems.get(system.domain);
      if (existing) {
        // Only update if completeness changed meaningfully
        if (Math.abs(existing.completeness - system.completeness) > 0.01) {
          existingSystems.set(system.domain, system);
        }
      } else {
        existingSystems.set(system.domain, system);
      }
    }

    this.state.intent = {
      ...newModel,
      systems: Array.from(existingSystems.values()),
    };
    this.dirty = true;
  }

  /**
   * Refine gaps incrementally:
   * - Remove gaps that were resolved (matched by key)
   * - Add new gaps not seen before
   * - Keep unresolved gaps from previous iterations
   */
  refineGaps(newGaps: Gap[], newHealth: number): Gap[] {
    const resolvedKeys = new Set(this.state.resolvedGapKeys);

    // Filter out already-resolved gaps from the new set
    const filteredNew = newGaps.filter((g) => !resolvedKeys.has(gapKey(g)));

    // Find gaps from previous iteration that are still unresolved
    // and not present in the new analysis (they may have been fixed)
    const newKeys = new Set(filteredNew.map(gapKey));
    const carried: Gap[] = [];
    for (const oldGap of this.state.gaps) {
      const key = gapKey(oldGap);
      if (!newKeys.has(key) && !resolvedKeys.has(key)) {
        // This old gap wasn't found by the new analysis —
        // it was likely resolved. Mark it.
        this.state.resolvedGapKeys.push(key);
      } else if (!newKeys.has(key)) {
        // Still unresolved and not in new scan — carry forward
        carried.push(oldGap);
      }
    }

    this.state.gaps = [...filteredNew, ...carried];
    this.state.health = newHealth;
    this.dirty = true;

    return this.state.gaps;
  }

  /**
   * Refine the plan incrementally:
   * - Remove steps for resolved gaps
   * - Keep steps that haven't been attempted
   * - Don't re-add steps for previously failed attempts
   *   (unless explicitly retrying)
   */
  refinePlan(newSteps: PlanStep[]): PlanStep[] {
    const resolvedKeys = new Set(this.state.resolvedGapKeys);
    const failedIds = new Set(this.state.failedStepIds);

    // Filter new steps: skip ones targeting resolved gaps
    const filtered = newSteps.filter((step) => {
      const relatedGap = this.state.gaps.find(
        (g) => g.system === step.system,
      );
      if (relatedGap && resolvedKeys.has(gapKey(relatedGap))) return false;
      return true;
    });

    // Carry forward unexecuted steps from prior iteration
    // that don't overlap with new steps
    const newSystems = new Set(filtered.map((s) => `${s.system}::${s.action}`));
    const carried = this.state.plan.filter((s) => {
      const key = `${s.system}::${s.action}`;
      if (newSystems.has(key)) return false; // replaced by new step
      if (failedIds.has(s.id)) return false; // don't retry failed steps
      return true;
    });

    this.state.plan = [...filtered, ...carried];
    this.dirty = true;

    return this.state.plan;
  }

  /**
   * Record a decision made during execution.
   */
  recordDecision(action: string, outcome: Decision['outcome'], reason: string): void {
    this.state.decisions.push({
      iteration: this.state.iteration,
      action,
      outcome,
      reason,
      timestamp: Date.now(),
    });

    // Cap decisions to last 100 to prevent unbounded growth
    if (this.state.decisions.length > 100) {
      this.state.decisions = this.state.decisions.slice(-100);
    }

    this.dirty = true;
  }

  /**
   * Mark a gap as resolved so it's never re-reported.
   */
  resolveGap(gap: Gap): void {
    const key = gapKey(gap);
    if (!this.state.resolvedGapKeys.includes(key)) {
      this.state.resolvedGapKeys.push(key);
    }
    this.state.gaps = this.state.gaps.filter((g) => gapKey(g) !== key);
    this.dirty = true;
  }

  /**
   * Record a step as failed so it's not retried blindly.
   */
  recordFailedStep(stepId: number): void {
    if (!this.state.failedStepIds.includes(stepId)) {
      this.state.failedStepIds.push(stepId);
    }
    this.dirty = true;
  }

  // ── Experience Learning ──

  get experiences(): Experience[] {
    return this.state.experiences;
  }

  /**
   * Record a completed experience and index it for future retrieval.
   */
  async recordExperience(
    query: string,
    detectedFlow: string,
    intent: Experience['intent'],
    plan: string[],
    actionsTaken: string[],
    result: Experience['result'],
    affectedFiles: string[],
    lesson: string,
  ): Promise<Experience> {
    const exp = createExperience(
      query, detectedFlow, intent, plan,
      actionsTaken, result, affectedFiles, lesson,
    );

    this.state.experiences.push(exp);

    // Cap at 200 experiences — drop lowest confidence first
    if (this.state.experiences.length > 200) {
      this.state.experiences.sort((a, b) => b.confidence - a.confidence);
      this.state.experiences = this.state.experiences.slice(0, 200);
    }

    // Index for retrieval
    await indexExperience(exp);
    this.dirty = true;

    log('auto', `Experience recorded: "${query}" → ${result} (confidence: ${exp.confidence})`);
    return exp;
  }

  /**
   * Find past experiences similar to the current situation.
   */
  async findRelevantExperiences(query: string, limit: number = 5): Promise<Experience[]> {
    return findSimilarExperiences(query, limit);
  }

  /**
   * Update confidence of a past experience based on new outcome.
   */
  adjustExperienceConfidence(experienceId: string, worked: boolean): void {
    adjustConfidence(this.state.experiences, experienceId, worked);
    this.dirty = true;
  }

  /**
   * Build context from past experiences for LLM prompts.
   */
  async buildExperienceContext(query: string): Promise<string> {
    const relevant = await this.findRelevantExperiences(query);
    if (relevant.length === 0) return '';
    return buildExperienceContext(relevant);
  }

  /**
   * Build a context summary of prior reasoning for LLM prompts.
   */
  buildReasoningContext(): string {
    const parts: string[] = [];

    // Decisions
    if (this.state.decisions.length > 0) {
      const recent = this.state.decisions.slice(-20);
      const lines = recent.map((d) =>
        `[iter ${d.iteration}] ${d.outcome.toUpperCase()}: ${d.action} — ${d.reason}`,
      );
      parts.push(`## Prior Decisions (last ${recent.length})\n${lines.join('\n')}`);
    }

    // Experience summary
    if (this.state.experiences.length > 0) {
      const successes = this.state.experiences.filter((e) => e.result === 'success').length;
      const failures = this.state.experiences.filter((e) => e.result === 'failure').length;
      const avgConf = this.state.experiences.reduce((s, e) => s + e.confidence, 0) / this.state.experiences.length;
      parts.push(`## Experience Summary: ${this.state.experiences.length} total (${successes} success, ${failures} failure, avg confidence: ${(avgConf * 100).toFixed(0)}%)`);
    }

    return parts.join('\n\n');
  }
}

// ── Helpers ──

function createEmptyState(): WorkingState {
  return {
    intent: { systems: [], flows: [], entities: [], stats: { files: 0, functions: 0, classes: 0, routes: 0 } },
    flows: [],
    gaps: [],
    plan: [],
    decisions: [],
    iteration: 0,
    health: 0,
    resolvedGapKeys: [],
    failedStepIds: [],
    experiences: [],
    changedFiles: [],
  };
}

function gapKey(gap: Gap): string {
  return `${gap.type}::${gap.system}::${gap.description.slice(0, 80)}`;
}
