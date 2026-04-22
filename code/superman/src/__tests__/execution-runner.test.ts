import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseStructuredErrors, formatErrorsForPrompt, extractErrorFiles, runCommand, rollbackChanges, classifyEnvironmentErrors, captureBaseline, diffErrors } from '../execution/runner.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('parseStructuredErrors', () => {
  it('parses TypeScript compiler errors', () => {
    const stderr = `src/index.ts(10,5): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
src/utils.ts(25,12): error TS2304: Cannot find name 'foo'.`;
    const errors = parseStructuredErrors(stderr);
    expect(errors).toHaveLength(2);
    expect(errors[0].file).toBe('src/index.ts');
    expect(errors[0].line).toBe(10);
    expect(errors[0].column).toBe(5);
    expect(errors[0].code).toBe('TS2345');
    expect(errors[0].message).toContain('Argument of type');
  });

  it('parses colon-separated error format (ESLint style)', () => {
    const stderr = `src/app.ts:15:3: error  Expected indentation of 2 spaces`;
    const errors = parseStructuredErrors(stderr);
    expect(errors).toHaveLength(1);
    expect(errors[0].file).toBe('src/app.ts');
    expect(errors[0].line).toBe(15);
  });

  it('parses generic errors with file paths', () => {
    const stderr = `Error in src/routes/auth.ts: Cannot resolve module './missing'`;
    const errors = parseStructuredErrors(stderr);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0].file).toBe('src/routes/auth.ts');
  });

  it('returns raw error for unstructured messages', () => {
    const stderr = `Something went wrong during compilation`;
    const errors = parseStructuredErrors(stderr);
    expect(errors).toHaveLength(1);
    expect(errors[0].file).toBeUndefined();
    expect(errors[0].message).toContain('Something went wrong');
  });

  it('handles empty input', () => {
    const errors = parseStructuredErrors('');
    expect(errors).toHaveLength(0);
  });

  it('handles mixed structured and unstructured lines', () => {
    const stderr = `> tsc --noEmit
src/index.ts(5,1): error TS1005: ';' expected.
Found 1 error.`;
    const errors = parseStructuredErrors(stderr);
    // Should extract at least the structured error
    const fileErrors = errors.filter(e => e.file);
    expect(fileErrors.length).toBeGreaterThanOrEqual(1);
    expect(fileErrors[0].file).toBe('src/index.ts');
  });
});

describe('formatErrorsForPrompt', () => {
  it('formats structured errors cleanly', () => {
    const errors = [
      { file: 'src/foo.ts', line: 10, column: 5, code: 'TS2345', message: 'Type mismatch', raw: 'raw line' },
      { file: 'src/bar.ts', line: 20, message: 'Missing import', raw: 'raw line 2' },
    ];
    const formatted = formatErrorsForPrompt(errors);
    expect(formatted).toContain('src/foo.ts');
    expect(formatted).toContain('line 10');
    expect(formatted).toContain('TS2345');
    expect(formatted).toContain('src/bar.ts');
  });

  it('handles errors with no file info', () => {
    const errors = [{ message: 'Generic error', raw: 'Generic error' }];
    const formatted = formatErrorsForPrompt(errors);
    expect(formatted).toContain('Generic error');
  });
});

describe('extractErrorFiles', () => {
  it('returns unique file paths from errors', () => {
    const errors = [
      { file: 'src/a.ts', line: 1, message: 'err1', raw: '' },
      { file: 'src/b.ts', line: 2, message: 'err2', raw: '' },
      { file: 'src/a.ts', line: 5, message: 'err3', raw: '' },
    ];
    const files = extractErrorFiles(errors);
    expect(files).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('skips errors without file info', () => {
    const errors = [
      { message: 'no file', raw: '' },
      { file: 'src/x.ts', line: 1, message: 'has file', raw: '' },
    ];
    const files = extractErrorFiles(errors);
    expect(files).toEqual(['src/x.ts']);
  });
});

describe('runCommand', () => {
  it('captures stdout from successful command', () => {
    const result = runCommand('echo hello', os.tmpdir());
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello');
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.command).toBe('echo hello');
  });

  it('captures stderr and exitCode from failed command', () => {
    const result = runCommand('node -e "process.exit(1)"', os.tmpdir());
    expect(result.exitCode).toBe(1);
  });

  it('handles command not found gracefully', () => {
    const result = runCommand('nonexistent_command_xyz_123', os.tmpdir());
    expect(result.exitCode).not.toBe(0);
  });
});

describe('rollbackChanges', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('restores original file content', async () => {
    const filePath = path.join(tmpDir, 'test.ts');
    const original = 'const x = 1;';
    const modified = 'const x = 999;';

    // Write the "modified" version to disk
    fs.writeFileSync(filePath, modified);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(modified);

    // Rollback should restore original
    await rollbackChanges([{
      filePath,
      original,
      modified,
      diff: '',
      explanation: 'test',
    }]);

    expect(fs.readFileSync(filePath, 'utf-8')).toBe(original);
  });

  it('handles rollback of multiple files', async () => {
    const file1 = path.join(tmpDir, 'a.ts');
    const file2 = path.join(tmpDir, 'b.ts');

    fs.writeFileSync(file1, 'modified a');
    fs.writeFileSync(file2, 'modified b');

    await rollbackChanges([
      { filePath: file1, original: 'original a', modified: 'modified a', diff: '', explanation: '' },
      { filePath: file2, original: 'original b', modified: 'modified b', diff: '', explanation: '' },
    ]);

    expect(fs.readFileSync(file1, 'utf-8')).toBe('original a');
    expect(fs.readFileSync(file2, 'utf-8')).toBe('original b');
  });
});

describe('classifyEnvironmentErrors', () => {
  it('classifies Prisma client errors as environment', () => {
    const errors = [
      { message: "Module '\"@prisma/client\"' has no exported member 'UserRole'.", raw: 'src/routes/auth.ts(6,10): error TS2305: ...', file: 'src/routes/auth.ts', line: 6, code: 'TS2305' },
      { message: "Property 'PrismaClientInitializationError' does not exist", raw: 'src/middleware/error.ts(52,29): ...', file: 'src/middleware/error.ts', line: 52 },
    ];
    const { envErrors, codeErrors } = classifyEnvironmentErrors(errors);
    expect(envErrors).toHaveLength(2);
    expect(codeErrors).toHaveLength(0);
  });

  it('classifies real code errors as code', () => {
    const errors = [
      { message: "Property 'foo' does not exist on type 'Bar'", raw: 'src/app.ts(10,5): error TS2339: ...', file: 'src/app.ts', line: 10, code: 'TS2339' },
      { message: "Expected 2 arguments, but got 1", raw: 'src/utils.ts(5,1): error TS2554: ...', file: 'src/utils.ts', line: 5, code: 'TS2554' },
    ];
    const { envErrors, codeErrors } = classifyEnvironmentErrors(errors);
    expect(envErrors).toHaveLength(0);
    expect(codeErrors).toHaveLength(2);
  });

  it('separates mixed env and code errors', () => {
    const errors = [
      { message: "Cannot find module '@prisma/client'", raw: '...', file: 'src/lib/prisma.ts' },
      { message: "Type 'string' not assignable to 'number'", raw: '...', file: 'src/app.ts', line: 15, code: 'TS2322' },
      { message: "ECONNREFUSED 127.0.0.1:5432", raw: '...' },
    ];
    const { envErrors, codeErrors } = classifyEnvironmentErrors(errors);
    expect(envErrors).toHaveLength(2);
    expect(codeErrors).toHaveLength(1);
    expect(codeErrors[0].file).toBe('src/app.ts');
  });

  it('classifies database connection errors as environment', () => {
    const errors = [
      { message: "Can't reach database server at localhost:5432", raw: '...' },
      { message: "role \"postgres\" does not exist", raw: '...' },
    ];
    const { envErrors } = classifyEnvironmentErrors(errors);
    expect(envErrors).toHaveLength(2);
  });
});

describe('captureBaseline + diffErrors', () => {
  it('captures baseline and filters pre-existing errors', () => {
    const baselineResult = {
      command: 'npm run build',
      exitCode: 1,
      stdout: '',
      stderr: [
        'src/old.ts(10,5): error TS2345: Existing type error.',
        'src/old.ts(20,1): error TS2304: Cannot find name \'x\'.',
      ].join('\n'),
      duration: 100,
    };

    const baseline = captureBaseline(baselineResult);
    expect(baseline.size).toBe(2);

    // After our changes: same 2 errors + 1 new one
    const currentErrors = parseStructuredErrors([
      'src/old.ts(10,5): error TS2345: Existing type error.',
      'src/old.ts(20,1): error TS2304: Cannot find name \'x\'.',
      'src/new.ts(5,3): error TS2551: New error from our change.',
    ].join('\n'));

    const newErrors = diffErrors(currentErrors, baseline);
    expect(newErrors).toHaveLength(1);
    expect(newErrors[0].file).toBe('src/new.ts');
    expect(newErrors[0].code).toBe('TS2551');
  });

  it('returns all errors when baseline is clean', () => {
    const baseline = new Set<string>();
    const errors = parseStructuredErrors('src/foo.ts(1,1): error TS1005: Missing semicolon.');
    const newErrors = diffErrors(errors, baseline);
    expect(newErrors).toHaveLength(1);
  });

  it('returns empty when all errors are pre-existing', () => {
    const baselineResult = {
      command: 'build',
      exitCode: 1,
      stdout: '',
      stderr: 'src/a.ts(1,1): error TS2345: Type mismatch.',
      duration: 50,
    };
    const baseline = captureBaseline(baselineResult);
    const current = parseStructuredErrors('src/a.ts(1,1): error TS2345: Type mismatch.');
    const newErrors = diffErrors(current, baseline);
    expect(newErrors).toHaveLength(0);
  });
});
