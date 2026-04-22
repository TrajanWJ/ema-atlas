import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkingMemory } from '../working-memory.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('WorkingMemory', () => {
  let tmpDir: string;
  let memory: WorkingMemory;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wm-test-'));
    memory = new WorkingMemory(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('starts with empty state', () => {
    expect(memory.iteration).toBe(0);
    expect(memory.gaps).toEqual([]);
    expect(memory.plan).toEqual([]);
    expect(memory.health).toBe(0);
  });

  it('increments iteration', () => {
    memory.nextIteration();
    expect(memory.iteration).toBe(1);
    memory.nextIteration();
    expect(memory.iteration).toBe(2);
  });

  it('saves and loads state', async () => {
    memory.nextIteration();
    memory.recordDecision('test action', 'success', 'test reason');
    await memory.save();

    const loaded = new WorkingMemory(tmpDir);
    const found = await loaded.load();
    expect(found).toBe(true);
    expect(loaded.iteration).toBe(1);
    expect(loaded.decisions).toHaveLength(1);
  });

  it('tracks changed files without duplicates', () => {
    memory.addChangedFiles(['a.ts', 'b.ts']);
    memory.addChangedFiles(['b.ts', 'c.ts']);
    expect(memory.changedFiles).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });

  it('clears changed files', () => {
    memory.addChangedFiles(['a.ts']);
    memory.clearChangedFiles();
    expect(memory.changedFiles).toEqual([]);
  });

  it('records decisions', () => {
    memory.recordDecision('deploy', 'success', 'looked good');
    memory.recordDecision('rollback', 'failure', 'broke things');
    expect(memory.decisions).toHaveLength(2);
  });
});
