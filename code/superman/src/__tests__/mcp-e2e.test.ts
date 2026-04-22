/**
 * End-to-end MCP tool chain test.
 *
 * Exercises the exact sequence a Claude session would use:
 *   1. check_status → clear response
 *   2. analyze_repo → project indexes
 *   3. get_gaps → returns ranked gaps
 *   4. get_status → shows session state
 *
 * Uses the actual Truks project at /Users/will/Desktop/Truks
 * (or skips if not available).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import * as fs from 'fs';

// Import session and tools directly
import {
  getSessionHealth,
  getLastKnownPath,
  getActiveSession,
  getSession,
  getOrRecoverSession,
  invalidateSession,
  resetForTesting,
} from '../../codevault-mcp/session.ts';
import { getStatus } from '../../codevault-mcp/tools/status.ts';
import { analyzeRepo } from '../../codevault-mcp/tools/analyze.ts';
import { getGaps } from '../../codevault-mcp/tools/gaps.ts';

const TRUKS_PATH = '/Users/will/Desktop/Truks';
const HAS_TRUKS = fs.existsSync(TRUKS_PATH);

// Skip the entire suite if Truks isn't available
const describeIfTruks = HAS_TRUKS ? describe : describe.skip;

describeIfTruks('MCP E2E tool chain on Truks', () => {
  beforeAll(() => {
    resetForTesting();
  });

  it('Step 1: check_status returns clear response when no session', () => {
    const health = getSessionHealth();
    expect(health.active).toBe(false);

    const status = getStatus();
    expect(status.active).toBe(false);
    expect(status.nextStep).toBeDefined();
    expect(typeof status.nextStep).toBe('string');
    expect(status.nextStep).toContain('analyze_repo');
  });

  it('Step 2: analyze_repo indexes Truks successfully', async () => {
    const result = await analyzeRepo(TRUKS_PATH);

    expect(result.files).toBeGreaterThan(0);
    expect(result.functions).toBeGreaterThan(0);
    expect(result.techStack).toBeDefined();

    // Session should now be active
    const session = getActiveSession();
    expect(session).not.toBeNull();
    expect(session!.repoPath).toBe(TRUKS_PATH);
    expect(session!.graph.nodes.size).toBeGreaterThan(0);
  }, 60000);

  it('Step 3: get_gaps returns real ranked gaps', async () => {
    const result = await getGaps();

    expect(result.totalGaps).toBeGreaterThanOrEqual(0);
    expect(typeof result.health).toBe('number');
    expect(Array.isArray(result.gaps)).toBe(true);

    for (const gap of result.gaps) {
      expect(gap.type).toBeDefined();
      expect(gap.severity).toBeDefined();
      expect(gap.description).toBeDefined();
      expect(gap.system).toBeDefined();
    }

    // Gaps are sorted by severity
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < result.gaps.length; i++) {
      expect(
        (severityOrder[result.gaps[i].severity] ?? 9)
      ).toBeGreaterThanOrEqual(
        (severityOrder[result.gaps[i - 1].severity] ?? 9)
      );
    }
  });

  it('Step 4: get_status shows active session with project data', () => {
    const status = getStatus();

    expect(status.active).toBe(true);
    expect(status.repoPath).toBe(TRUKS_PATH);
    expect(status.graph).toBeDefined();
    expect((status as any).graph.nodes).toBeGreaterThan(0);
    expect((status as any).graph.edges).toBeGreaterThan(0);
    expect(status.nextStep).toBeDefined();
  });
});

describe('MCP session recovery', () => {
  beforeEach(() => {
    resetForTesting();
  });

  it('getOrRecoverSession throws actionable error when no path known', async () => {
    try {
      await getOrRecoverSession('test_tool');
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).toContain('test_tool');
      expect(err.message).toContain('analyze_repo');
      expect(err.message).toContain('No active project session');
    }
  });

  it('getSessionHealth returns correct state when no session', () => {
    const health = getSessionHealth();
    expect(health.active).toBe(false);
    expect(health.stale).toBe(false);
    expect(health.repoPath).toBeNull();
    expect(health.initializing).toBe(false);
  });

  it('auto-recovery works after session drop', async () => {
    if (!HAS_TRUKS) return;

    // Index first
    await getSession(TRUKS_PATH);
    expect(getActiveSession()).not.toBeNull();

    // Simulate session drop
    invalidateSession();
    expect(getActiveSession()).toBeNull();

    // lastKnownPath should still be set
    expect(getLastKnownPath()).toBe(TRUKS_PATH);

    // Auto-recover
    const session = await getOrRecoverSession('test_recovery');
    expect(session).toBeDefined();
    expect(session.repoPath).toBe(TRUKS_PATH);
    expect(session.graph.nodes.size).toBeGreaterThan(0);
  }, 60000);

  it('status shows canAutoRecover after session drop', async () => {
    if (!HAS_TRUKS) return;

    await getSession(TRUKS_PATH);
    invalidateSession();

    const status = getStatus();
    expect(status.active).toBe(false);
    expect((status as any).lastKnownPath).toBe(TRUKS_PATH);
    expect((status as any).canAutoRecover).toBe(true);
  }, 60000);
});

describe('MCP error messages are actionable', () => {
  beforeEach(() => {
    resetForTesting();
  });

  it('error mentions the tool name', async () => {
    try {
      await getOrRecoverSession('get_gaps');
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).toContain('get_gaps');
    }
  });

  it('error provides the exact next step', async () => {
    try {
      await getOrRecoverSession('apply_task');
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).toContain('analyze_repo');
    }
  });

  it('error includes tool call order hint', async () => {
    try {
      await getOrRecoverSession('simulate_flow');
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).toContain('check_status');
      expect(err.message).toContain('analyze_repo');
      expect(err.message).toContain('simulate_flow');
    }
  });
});
