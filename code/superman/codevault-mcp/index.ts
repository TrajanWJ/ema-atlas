#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { analyzeRepo } from './tools/analyze.ts';
import { applyTask } from './tools/apply.ts';
import { askCodebase } from './tools/ask.ts';
import { getGaps } from './tools/gaps.ts';
import { simulateFlowByName } from './tools/simulate.ts';
import { getStatus } from './tools/status.ts';
import { generateTestsTool } from './tools/generate-tests.ts';
import { validateContractsTool } from './tools/validate-contracts.ts';
import { rollbackSnapshot, getSessionHealth, getLastKnownPath } from './session.ts';

const server = new McpServer({
  name: 'codevault',
  version: '1.1.0',
});

/**
 * Format errors with actionable next steps for Claude.
 */
function formatError(err: any, toolName: string): string {
  const msg = err?.message || String(err);

  // Already has actionable info
  if (msg.includes('analyze_repo') || msg.includes('Call ')) {
    return msg;
  }

  // Generic error — add context
  return `[${toolName}] ${msg}\n\nTo recover: call check_status to see session state, then analyze_repo if needed.`;
}

// ── Tool: check_status ──
server.tool(
  'check_status',
  'Health check for the codevault MCP server. Call this FIRST in any session to verify the server is running, check if a project is indexed, and get instructions for what to do next. Returns session state, project info, and actionable next steps.',
  {},
  async () => {
    try {
      const health = getSessionHealth();
      const lastPath = getLastKnownPath();

      const result = {
        serverRunning: true,
        sessionActive: health.active,
        sessionStale: health.stale,
        sessionInitializing: health.initializing,
        repoPath: health.repoPath,
        lastKnownPath: lastPath,
        canAutoRecover: !health.active && lastPath !== null,
        nextStep: health.active
          ? (health.stale
              ? 'Session is stale — next tool call will auto-refresh. You can proceed normally.'
              : 'Session is active. Call get_gaps, apply_task, ask_codebase, or simulate_flow.')
          : (lastPath
              ? `No active session. Call analyze_repo with path "${lastPath}" to restore.`
              : 'No active session. Call analyze_repo with the absolute path to your project.'),
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            serverRunning: true,
            sessionActive: false,
            error: err.message,
            nextStep: 'Call analyze_repo with the absolute path to your project directory.',
          }, null, 2),
        }],
      };
    }
  },
);

// ── Tool: analyze_repo ──
server.tool(
  'analyze_repo',
  'Index a codebase and return its full project model: file count, functions, classes, API routes with auth info, database schema with models and relations, external services, missing env vars, and tech stack. Call this first before using other tools. Results are cached — subsequent calls are instant.',
  { path: z.string().describe('Absolute path to the project root directory') },
  async ({ path }) => {
    try {
      const result = await analyzeRepo(path);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return {
        content: [{
          type: 'text' as const,
          text: formatError(err, 'analyze_repo'),
        }],
        isError: true,
      };
    }
  },
);

// ── Tool: apply_task ──
server.tool(
  'apply_task',
  'Apply code changes to the project deterministically. Accepts surgical line-range edits or full file writes. Validates syntax, checks for prose, runs build with baseline diffing (pre-existing errors ignored), and reports ripple effects. Returns diffs, build status, and rollback availability. Does NOT generate code — you provide the edits, this tool applies them safely.',
  {
    surgical_edits: z.array(z.object({
      file: z.string().describe('Absolute file path'),
      startLine: z.number().describe('1-based start line (inclusive)'),
      endLine: z.number().describe('1-based end line (inclusive). 0 = insert before startLine'),
      newContent: z.string().describe('Replacement content. Use \\n for line breaks'),
      explanation: z.string().optional().describe('What this edit does'),
    })).optional().describe('Surgical edits: replace specific line ranges'),
    file_writes: z.array(z.object({
      file: z.string().describe('Absolute file path'),
      content: z.string().describe('Complete file content to write'),
    })).optional().describe('Full file writes: overwrite entire files'),
  },
  async (input) => {
    try {
      const result = await applyTask(input);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return {
        content: [{
          type: 'text' as const,
          text: formatError(err, 'apply_task'),
        }],
        isError: true,
      };
    }
  },
);

// ── Tool: ask_codebase ──
server.tool(
  'ask_codebase',
  'Return structured project context relevant to a question — database schema, API routes with auth, infrastructure status, relevant files, and system health. Does NOT answer the question directly — returns the evidence for you to reason over. Use for questions like "can a non-admin delete users?" or "what database does this use?"',
  { question: z.string().describe('Question about the codebase') },
  async ({ question }) => {
    try {
      const result = await askCodebase(question);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return {
        content: [{
          type: 'text' as const,
          text: formatError(err, 'ask_codebase'),
        }],
        isError: true,
      };
    }
  },
);

// ── Tool: get_gaps ──
server.tool(
  'get_gaps',
  'Return ranked list of gaps in the codebase — incomplete systems, missing validation, broken flows, security issues. Each gap includes severity, description, and affected system. Use after analyze_repo to understand what needs fixing.',
  {},
  async () => {
    try {
      const result = await getGaps();
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return {
        content: [{
          type: 'text' as const,
          text: formatError(err, 'get_gaps'),
        }],
        isError: true,
      };
    }
  },
);

// ── Tool: simulate_flow ──
server.tool(
  'simulate_flow',
  'Simulate a user flow step by step through the codebase. Each step shows whether a handler was found, if state transitions are valid, and what issues exist. Use to verify a feature works end-to-end before shipping.',
  { flow_name: z.string().describe('Name or partial name of the flow to simulate (e.g. "login", "checkout", "onboarding")') },
  async ({ flow_name }) => {
    try {
      const result = await simulateFlowByName(flow_name);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return {
        content: [{
          type: 'text' as const,
          text: formatError(err, 'simulate_flow'),
        }],
        isError: true,
      };
    }
  },
);

// ── Tool: get_status ──
server.tool(
  'get_status',
  'Return current session status: whether a project is loaded, graph size, health score, infrastructure status, route counts, and whether rollback is available.',
  {},
  async () => {
    try {
      const result = getStatus();
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return {
        content: [{
          type: 'text' as const,
          text: formatError(err, 'get_status'),
        }],
        isError: true,
      };
    }
  },
);

// ── Tool: rollback_last ──
server.tool(
  'rollback_last',
  'Undo all file changes from the last apply_task call. Restores every modified file to its exact state before the task ran. Only one level of undo is available.',
  {},
  async () => {
    try {
      const rolledBack = await rollbackSnapshot();
      if (rolledBack.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No snapshot available to rollback.' }] };
      }
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ rolledBack, count: rolledBack.length }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        content: [{
          type: 'text' as const,
          text: formatError(err, 'rollback_last'),
        }],
        isError: true,
      };
    }
  },
);

// ── Tool: generate_tests ──
server.tool(
  'generate_tests',
  'Generate test files for functions, routes, or components. Analyzes function signatures, dependencies, and patterns to create idiomatic test cases. Does NOT use LLM — generates deterministically from code analysis.',
  {
    target: z.string().describe('Function name, file path, or "all" to generate tests for'),
    write: z.boolean().optional().describe('If true, write test files to disk. Default: false (preview only)'),
  },
  async ({ target, write }) => {
    try {
      const result = await generateTestsTool({ target, write });
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return { content: [{ type: 'text' as const, text: formatError(err, 'generate_tests') }], isError: true };
    }
  },
);

// ── Tool: validate_contracts ──
server.tool(
  'validate_contracts',
  'Validate API contracts between client and server code. Finds mismatches between frontend fetch/axios calls and backend route definitions. Returns missing endpoints, method mismatches, unused routes, and untyped responses.',
  { projectPath: z.string().describe('Absolute path to the project root directory') },
  async ({ projectPath }) => {
    try {
      const result = await validateContractsTool(projectPath);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return { content: [{ type: 'text' as const, text: formatError(err, 'validate_contracts') }], isError: true };
    }
  },
);

// ── Dual-format transport ──
// MCP SDK v1.28.0 uses newline-delimited JSON, but Claude Code may send
// Content-Length framed messages (older MCP spec). This transport handles both.

import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

class DualFormatTransport {
  private _started = false;
  private _buffer = Buffer.alloc(0);
  private _clientFormat: 'ndjson' | 'content-length' = 'ndjson';

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  async start(): Promise<void> {
    if (this._started) throw new Error('Already started');
    this._started = true;
    process.stdin.on('data', (chunk: Buffer) => {
      this._buffer = Buffer.concat([this._buffer, chunk]);
      this._processBuffer();
    });
    process.stdin.on('error', (err: Error) => this.onerror?.(err));
  }

  private _processBuffer(): void {
    while (this._buffer.length > 0) {
      const str = this._buffer.toString('utf8');

      // Try Content-Length framed format first
      const clMatch = str.match(/^Content-Length:\s*(\d+)\r?\n\r?\n/);
      if (clMatch) {
        this._clientFormat = 'content-length';
        const headerLen = clMatch[0].length;
        const bodyLen = parseInt(clMatch[1], 10);
        if (this._buffer.length < headerLen + bodyLen) break; // incomplete
        const body = this._buffer.toString('utf8', headerLen, headerLen + bodyLen);
        this._buffer = this._buffer.subarray(headerLen + bodyLen);
        try {
          this.onmessage?.(JSON.parse(body));
        } catch (err) {
          this.onerror?.(err instanceof Error ? err : new Error(String(err)));
        }
        continue;
      }

      // Try newline-delimited JSON
      const nlIndex = this._buffer.indexOf(0x0a); // \n
      if (nlIndex === -1) break; // no complete line yet
      const line = this._buffer.toString('utf8', 0, nlIndex).replace(/\r$/, '');
      this._buffer = this._buffer.subarray(nlIndex + 1);
      if (line.length === 0) continue; // skip empty lines
      try {
        this._clientFormat = 'ndjson';
        this.onmessage?.(JSON.parse(line));
      } catch (err) {
        this.onerror?.(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve) => {
      const body = JSON.stringify(message);

      if (this._clientFormat === 'content-length') {
        // Respond with Content-Length framing (matches client format)
        const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
        if (process.stdout.write(frame)) resolve();
        else process.stdout.once('drain', resolve);
      } else {
        // Respond with newline-delimited JSON (matches client format)
        if (process.stdout.write(body + '\n')) resolve();
        else process.stdout.once('drain', resolve);
      }
    });
  }

  async close(): Promise<void> {
    process.stdin.removeAllListeners('data');
    process.stdin.removeAllListeners('error');
    process.stdin.pause();
    this.onclose?.();
  }

  get sessionId(): string | undefined {
    return undefined;
  }
}

// ── Start ──
async function main() {
  const transport = new DualFormatTransport();
  await server.connect(transport);
}

main().catch((err) => process.stderr.write(`[codevault] Fatal: ${err.message}\n`));
