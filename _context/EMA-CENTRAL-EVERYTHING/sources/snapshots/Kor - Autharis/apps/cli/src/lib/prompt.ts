// Tiny readline-based prompt helper. Lane G2.
// No inquirer dependency.
import * as readline from 'node:readline';

export async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const suffix = defaultValue !== undefined ? ` (${defaultValue})` : '';
  return new Promise<string>((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      resolve(trimmed.length > 0 ? trimmed : (defaultValue ?? ''));
    });
  });
}

export async function promptNumber(question: string, defaultValue?: number): Promise<number> {
  while (true) {
    const raw = await prompt(question, defaultValue !== undefined ? String(defaultValue) : undefined);
    const n = Number(raw);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
    process.stdout.write('  not a number, try again\n');
  }
}
