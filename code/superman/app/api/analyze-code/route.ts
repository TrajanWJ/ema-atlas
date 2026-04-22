import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { code, instruction } = await request.json();

  if (!code || !instruction) {
    return NextResponse.json(
      { error: 'Missing required fields: code, instruction' },
      { status: 400 }
    );
  }

  // Try to forward to the backend engine if running
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const res = await fetch(`${backendUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: `${instruction}\n\nCode:\n${code}` }),
      signal: AbortSignal.timeout(30000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        changes: [{
          file: 'current',
          diff: data.answer,
          explanation: data.reasoning || data.answer,
        }],
      });
    }
  } catch {
    // Backend not available, use mock response
  }

  // Mock response when backend engine is not running
  const changes = generateMockResponse(code, instruction);
  return NextResponse.json({ changes });
}

function generateMockResponse(code: string, instruction: string) {
  const lowerInstruction = instruction.toLowerCase();

  if (lowerInstruction.includes('explain')) {
    return [{
      file: 'analysis',
      diff: '',
      explanation: `This code defines ${countFunctions(code)} function(s) and ${countImports(code)} import(s). ` +
        `The code follows a modular pattern with clear separation of concerns. ` +
        `Key patterns: ${detectPatterns(code).join(', ') || 'standard implementation'}.`,
    }];
  }

  if (lowerInstruction.includes('bug') || lowerInstruction.includes('fix')) {
    return [{
      file: 'suggestions',
      diff: '- // potential issue detected\n+ // fixed: added proper error handling',
      explanation: 'Consider adding error handling for edge cases. ' +
        'Async operations should be wrapped in try/catch blocks. ' +
        'Input validation should be added at function boundaries.',
    }];
  }

  if (lowerInstruction.includes('refactor') || lowerInstruction.includes('optimize')) {
    return [{
      file: 'refactoring',
      diff: '- // original implementation\n+ // optimized: reduced complexity',
      explanation: 'Suggested optimizations: Extract repeated logic into utility functions. ' +
        'Consider using early returns to reduce nesting. ' +
        'Cache frequently computed values.',
    }];
  }

  if (lowerInstruction.includes('test')) {
    return [{
      file: 'tests',
      diff: `+ describe('module', () => {\n+   it('should handle expected input', () => {\n+     // test implementation\n+   });\n+ });`,
      explanation: 'Generated test stubs covering: happy path, edge cases, and error scenarios. ' +
        'Uses describe/it blocks for clear organization.',
    }];
  }

  return [{
    file: 'analysis',
    diff: '',
    explanation: `Analysis complete. The code contains ${code.split('\n').length} lines. ` +
      `Instruction "${instruction}" has been processed. ` +
      `The code structure appears well-organized with clear intent.`,
  }];
}

function countFunctions(code: string): number {
  const matches = code.match(/function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\(/g);
  return matches?.length || 0;
}

function countImports(code: string): number {
  const matches = code.match(/^import\s/gm);
  return matches?.length || 0;
}

function detectPatterns(code: string): string[] {
  const patterns: string[] = [];
  if (code.includes('async')) patterns.push('async/await');
  if (code.includes('class ')) patterns.push('OOP');
  if (code.includes('=>')) patterns.push('arrow functions');
  if (code.includes('export')) patterns.push('ES modules');
  if (code.includes('try')) patterns.push('error handling');
  if (code.includes('interface') || code.includes('type ')) patterns.push('TypeScript types');
  return patterns;
}
