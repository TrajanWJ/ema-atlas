import { describe, it, expect } from 'vitest';
import { parseModifiedFiles, validateSyntax, validateNotProse, validateSizeRatio, parseSurgicalEdits, applySurgicalEditsToContent } from '../modification/engine.js';

describe('parseModifiedFiles', () => {
  it('extracts files from filepath: prefixed code blocks', () => {
    const response = '```filepath:src/foo.ts\nconsole.log("hello");\n```';
    const result = parseModifiedFiles(response);
    expect(result.size).toBe(1);
    expect(result.has('src/foo.ts')).toBe(true);
    expect(result.get('src/foo.ts')!.code).toBe('console.log("hello");\n');
  });

  it('extracts files from path-only code blocks (no filepath: prefix)', () => {
    const response = '```src/bar.ts\nconst x = 1;\n```';
    const result = parseModifiedFiles(response);
    expect(result.size).toBe(1);
    expect(result.has('src/bar.ts')).toBe(true);
  });

  it('throws when language-tagged block has no file context (long response)', () => {
    // Response must be >100 chars to trigger the warning/throw path
    const response = [
      'I have made the following changes to improve the code quality and ensure proper functionality:',
      '',
      '```typescript',
      'console.log("hello world");',
      'export function doSomething() { return true; }',
      '```',
    ].join('\n');
    // Should throw because code blocks exist but no file paths could be extracted
    expect(() => parseModifiedFiles(response)).toThrow();
  });

  it('handles multiple files in one response', () => {
    const response = [
      'Here are the changes:',
      '```filepath:src/a.ts',
      'const a = 1;',
      '```',
      'And also:',
      '```filepath:src/b.ts',
      'const b = 2;',
      '```',
    ].join('\n');
    const result = parseModifiedFiles(response);
    expect(result.size).toBe(2);
    expect(result.has('src/a.ts')).toBe(true);
    expect(result.has('src/b.ts')).toBe(true);
  });

  it('returns empty map for response with no code blocks', () => {
    const response = 'I made some changes to the file.';
    const result = parseModifiedFiles(response);
    expect(result.size).toBe(0);
  });

  it('extracts explanation text between code blocks', () => {
    const response = [
      'First change:',
      '```filepath:src/foo.ts',
      'const x = 1;',
      '```',
      'This adds a variable x.',
    ].join('\n');
    const result = parseModifiedFiles(response);
    expect(result.get('src/foo.ts')!.explanation).toBeTruthy();
  });

  // Tests for NEW functionality (Task 2 will make these pass)
  it('extracts file from language-tagged block when preceded by file mention', () => {
    const response = [
      'Here are the changes for `src/foo.ts`:',
      '',
      '```typescript',
      'const x = 1;',
      '```',
    ].join('\n');
    const result = parseModifiedFiles(response);
    expect(result.size).toBe(1);
    expect(result.has('src/foo.ts')).toBe(true);
  });

  it('single code block maps to single target file when provided', () => {
    const response = [
      'Here is the updated code:',
      '',
      '```typescript',
      'export function hello() { return "world"; }',
      '```',
    ].join('\n');
    const result = parseModifiedFiles(response, ['src/hello.ts']);
    expect(result.size).toBe(1);
    expect(result.has('src/hello.ts')).toBe(true);
  });
});

describe('validateSyntax', () => {
  it('returns true for valid TypeScript', () => {
    const code = 'export function hello(): string { return "world"; }';
    expect(validateSyntax(code, 'test.ts')).toBe(true);
  });

  it('returns false for invalid TypeScript', () => {
    const code = 'export function { broken syntax here +++';
    expect(validateSyntax(code, 'test.ts')).toBe(false);
  });

  it('returns true for unknown file extensions', () => {
    const code = 'whatever content';
    expect(validateSyntax(code, 'file.xyz')).toBe(true);
  });

  it('returns true for valid JavaScript', () => {
    const code = 'function foo() { return 42; }';
    expect(validateSyntax(code, 'test.js')).toBe(true);
  });
});

describe('validateNotProse', () => {
  it('rejects empty content', () => {
    expect(validateNotProse('', 'test.ts').valid).toBe(false);
    expect(validateNotProse('   ', 'test.ts').valid).toBe(false);
  });

  it('rejects LLM explanation text', () => {
    const prose1 = '*(full file restored from HEAD with one addition)*\n\n**Change:** Added export type.';
    expect(validateNotProse(prose1, 'test.ts').valid).toBe(false);

    const prose2 = 'Here are the changes I made to improve the code quality and ensure proper functionality.';
    expect(validateNotProse(prose2, 'test.ts').valid).toBe(false);

    const prose3 = 'This file contains the main configuration for the project.';
    expect(validateNotProse(prose3, 'test.ts').valid).toBe(false);

    const prose4 = 'I have updated the function to handle edge cases better.';
    expect(validateNotProse(prose4, 'test.ts').valid).toBe(false);
  });

  it('rejects shell errors and diff instructions', () => {
    expect(validateNotProse('No files found matching src/flows/**', 'test.ts').valid).toBe(false);
    expect(validateNotProse('Error: Cannot find module "./foo"', 'test.ts').valid).toBe(false);
    expect(validateNotProse('After line 6 (imports), add:\nexport const FOO = true;', 'test.ts').valid).toBe(false);
    expect(validateNotProse('**Change:** Added export type GapKey', 'test.ts').valid).toBe(false);
  });

  it('rejects mostly-markdown content', () => {
    const markdown = '# Changes\n- Added function\n- Fixed bug\n- Updated types\n- Cleaned imports';
    expect(validateNotProse(markdown, 'test.ts').valid).toBe(false);
  });

  it('accepts real TypeScript code', () => {
    const code1 = 'import { log } from "./logger.js";\nexport function hello() { return "world"; }';
    expect(validateNotProse(code1, 'test.ts').valid).toBe(true);

    const code2 = 'const x = 42;\nif (x > 10) { console.log(x); }';
    expect(validateNotProse(code2, 'test.ts').valid).toBe(true);

    const code3 = 'export interface Config { port: number; host: string; }';
    expect(validateNotProse(code3, 'test.ts').valid).toBe(true);
  });

  it('accepts JSON content for .json files', () => {
    expect(validateNotProse('{"key": "value"}', 'config.json').valid).toBe(true);
  });

  it('rejects invalid JSON for .json files', () => {
    expect(validateNotProse('This is not JSON at all', 'config.json').valid).toBe(false);
  });

  it('accepts non-code files without code patterns', () => {
    // Markdown, yaml, etc. don't need code patterns
    expect(validateNotProse('# Heading\nSome text', 'README.md').valid).toBe(true);
  });
});

describe('validateSizeRatio', () => {
  it('allows normal size changes', () => {
    const original = 'const x = 1;\nconst y = 2;\nconst z = 3;\nexport { x, y, z };\n'.repeat(5);
    const modified = original + '\nexport const w = 4;\n';
    expect(validateSizeRatio(original, modified, 'test.ts').valid).toBe(true);
  });

  it('rejects catastrophic deletion (file replaced with near-empty content)', () => {
    const original = 'import { log } from "./logger";\n'.repeat(20) + 'export function main() { log("hello"); }\n';
    const modified = 'export {};';
    expect(validateSizeRatio(original, modified, 'test.ts').valid).toBe(false);
  });

  it('allows changes on small files', () => {
    const original = 'const x = 1;';
    const modified = '';
    // Small files (< 50 chars) are allowed to change freely
    expect(validateSizeRatio(original, modified, 'test.ts').valid).toBe(true);
  });

  it('rejects bloated content (5x+ original)', () => {
    const original = 'const x = 1;\n'.repeat(100); // ~1300 chars
    const modified = original.repeat(6); // ~7800 chars, 6x
    expect(validateSizeRatio(original, modified, 'test.ts').valid).toBe(false);
  });
});

describe('parseSurgicalEdits', () => {
  it('parses valid JSON array of edits', () => {
    const response = `Here are the edits:
[
  {"file": "src/foo.ts", "startLine": 5, "endLine": 8, "newContent": "const x = 1;\\nconst y = 2;", "explanation": "Replaced variables"}
]`;
    const edits = parseSurgicalEdits(response);
    expect(edits).toHaveLength(1);
    expect(edits[0].file).toBe('src/foo.ts');
    expect(edits[0].startLine).toBe(5);
    expect(edits[0].endLine).toBe(8);
    expect(edits[0].newContent).toBe('const x = 1;\nconst y = 2;');
  });

  it('parses multiple edits across files', () => {
    const response = `[
  {"file": "src/a.ts", "startLine": 1, "endLine": 0, "newContent": "import { z } from 'zod';", "explanation": "Add import"},
  {"file": "src/a.ts", "startLine": 10, "endLine": 15, "newContent": "function validate() {}", "explanation": "Add validator"},
  {"file": "src/b.ts", "startLine": 3, "endLine": 3, "newContent": "export const FOO = 'bar';", "explanation": "Change export"}
]`;
    const edits = parseSurgicalEdits(response);
    expect(edits).toHaveLength(3);
    expect(edits[0].endLine).toBe(0); // insertion
    expect(edits[2].file).toBe('src/b.ts');
  });

  it('returns empty for non-JSON response', () => {
    const response = 'Here are the changes I made to improve the code.';
    expect(parseSurgicalEdits(response)).toHaveLength(0);
  });

  it('skips invalid edit objects', () => {
    const response = '[{"file": "a.ts", "startLine": 5, "newContent": "ok"}, {"bad": true}]';
    const edits = parseSurgicalEdits(response);
    expect(edits).toHaveLength(1);
    expect(edits[0].file).toBe('a.ts');
  });
});

describe('applySurgicalEditsToContent', () => {
  const original = [
    'import { a } from "./a";',
    'import { b } from "./b";',
    '',
    'export function hello() {',
    '  return "world";',
    '}',
    '',
    'export function goodbye() {',
    '  return "bye";',
    '}',
  ].join('\n');

  it('replaces a line range', () => {
    const edits = [{
      file: 'test.ts',
      startLine: 4,
      endLine: 6,
      newContent: 'export function hello() {\n  return "universe";\n}',
      explanation: 'Changed return value',
    }];
    const result = applySurgicalEditsToContent(original, edits);
    expect(result).toContain('return "universe"');
    expect(result).not.toContain('return "world"');
    // Unchanged parts should still be there
    expect(result).toContain('import { a }');
    expect(result).toContain('export function goodbye()');
  });

  it('inserts before a line (endLine=0)', () => {
    const edits = [{
      file: 'test.ts',
      startLine: 1,
      endLine: 0,
      newContent: 'import { z } from "zod";',
      explanation: 'Add import',
    }];
    const result = applySurgicalEditsToContent(original, edits);
    const lines = result.split('\n');
    expect(lines[0]).toBe('import { z } from "zod";');
    expect(lines[1]).toBe('import { a } from "./a";');
  });

  it('applies multiple edits bottom-up correctly', () => {
    const edits = [
      { file: 'test.ts', startLine: 1, endLine: 0, newContent: '// header', explanation: '' },
      { file: 'test.ts', startLine: 5, endLine: 5, newContent: '  return "NEW";', explanation: '' },
    ];
    const result = applySurgicalEditsToContent(original, edits);
    expect(result).toContain('// header');
    expect(result).toContain('return "NEW"');
    expect(result).not.toContain('return "world"');
  });

  it('handles append at end of file', () => {
    const lines = original.split('\n');
    const edits = [{
      file: 'test.ts',
      startLine: lines.length + 1,
      endLine: 0,
      newContent: '\nexport const VERSION = "1.0";',
      explanation: 'Append export',
    }];
    const result = applySurgicalEditsToContent(original, edits);
    expect(result).toContain('export const VERSION = "1.0"');
  });
});
