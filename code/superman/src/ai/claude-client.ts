import { spawn } from 'child_process';
import { log, logError } from '../logger.js';
import type { LogStage } from '../types.js';

const TIMEOUT_MS = 300_000; // 5 minutes — code generation needs more time
const MAX_PROMPT_LENGTH = 30_000; // truncate to prevent OOM
const MAX_RETRIES = 2;

/**
 * Call Claude CLI via stdin (not argv — avoids OS arg length limits).
 * Retries on failure. Always returns a string (never throws to caller
 * unless all retries exhausted).
 */
export async function callClaude(prompt: string, stage: LogStage = 'query'): Promise<string> {
  // Truncate excessively long prompts
  const truncated = prompt.length > MAX_PROMPT_LENGTH
    ? prompt.slice(0, MAX_PROMPT_LENGTH) + '\n\n[context truncated for length]'
    : prompt;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callClaudeOnce(truncated, stage);
      if (result.length > 0) return result;
      log(stage, `Claude returned empty (attempt ${attempt}/${MAX_RETRIES})`);
    } catch (err) {
      logError(stage, `Claude CLI failed (attempt ${attempt}/${MAX_RETRIES})`, err);
      if (attempt === MAX_RETRIES) throw err;
    }
  }

  return '(No response from Claude CLI)';
}

async function callClaudeOnce(prompt: string, stage: LogStage): Promise<string> {
  log(stage, `Calling Claude CLI (${prompt.length} chars)`);

  return new Promise((resolve, reject) => {
    // Use stdin pipe — NOT argv — to avoid arg length limits
    // Resolve claude CLI path — 'claude' alone may not be in PATH when run as a server
    const claudePath = process.env.CLAUDE_CLI_PATH || 'claude';
    const proc = spawn(claudePath, ['--print', '--output-format', 'text', '-'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      timeout: TIMEOUT_MS,
      shell: true, // Use shell to resolve PATH on Windows
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      reject(new Error(`Claude CLI spawn failed: ${err.message}`));
    });

    proc.on('close', (code) => {
      const result = stdout.trim();
      if (code !== 0) {
        const msg = stderr.trim() || `exit code ${code}`;
        reject(new Error(msg));
        return;
      }
      log(stage, `Claude responded (${result.length} chars)`);
      resolve(result);
    });

    // Write prompt to stdin and close
    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

/**
 * Parse JSON from Claude's response.
 */
export function safeParseJSON<T = unknown>(text: string): { ok: true; data: T } | { ok: false; raw: string } {
  try { return { ok: true, data: JSON.parse(text) as T }; } catch {}

  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    try { return { ok: true, data: JSON.parse(fenceMatch[1]) as T }; } catch {}
  }

  const jsonStart = text.search(/[\[{]/);
  if (jsonStart >= 0) {
    const opener = text[jsonStart];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    for (let i = jsonStart; i < text.length; i++) {
      if (text[i] === opener) depth++;
      else if (text[i] === closer) depth--;
      if (depth === 0) {
        try { return { ok: true, data: JSON.parse(text.slice(jsonStart, i + 1)) as T }; } catch { break; }
      }
    }
  }

  return { ok: false, raw: text };
}

/**
 * Build a prompt with role, task, context.
 */
export function buildPrompt(
  role: string,
  task: string,
  context?: string,
  jsonSchema?: string,
): string {
  let prompt = `You are ${role}.\n\n${task}`;
  if (context) prompt += `\n\n## Context\n${context}`;
  if (jsonSchema) prompt += `\n\n## Output Format\nRespond ONLY with valid JSON. No markdown fences.\n${jsonSchema}`;
  return prompt;
}
