import { getOrRecoverSession } from '../session.ts';
import { TestGenerator } from '../../src/intelligence/test-generator.ts';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

export async function generateTestsTool(input: {
  target: string;
  write?: boolean;
}) {
  const session = await getOrRecoverSession('generate_tests');

  const framework = await TestGenerator.detectFramework(session.repoPath);
  const generator = new TestGenerator(session.graph, framework);
  const tests = await generator.generateTests(input.target, session.repoPath);

  if (tests.length === 0) {
    return {
      framework,
      testsGenerated: 0,
      tests: [],
      hint: `No testable functions, methods, or routes found matching "${input.target}". Try a different name or "all".`,
    };
  }

  // Write files to disk if requested
  if (input.write) {
    for (const test of tests) {
      const dir = dirname(test.testFile);
      await mkdir(dir, { recursive: true });
      await writeFile(test.testFile, test.content, 'utf-8');
    }
  }

  return {
    framework,
    testsGenerated: tests.length,
    written: input.write ?? false,
    tests: tests.map(t => ({
      targetFile: t.targetFile,
      testFile: t.testFile,
      testCount: t.testCount,
      testNames: t.testNames,
      content: t.content,
    })),
  };
}
