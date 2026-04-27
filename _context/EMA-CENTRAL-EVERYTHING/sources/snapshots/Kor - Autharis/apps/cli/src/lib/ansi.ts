// Minimal ANSI color helpers. Lane G2.
// No chalk dependency — hand-rolled SGR escape sequences.

const ESC = '\u001B[';
const RESET = `${ESC}0m`;

function wrap(code: number, s: string): string {
  return `${ESC}${code}m${s}${RESET}`;
}

const useColor =
  process.stdout && typeof process.stdout.isTTY === 'boolean'
    ? process.stdout.isTTY && process.env.NO_COLOR === undefined
    : false;

function c(code: number) {
  return (s: string): string => (useColor ? wrap(code, s) : s);
}

export const ansi = {
  bold: c(1),
  dim: c(2),
  red: c(31),
  green: c(32),
  yellow: c(33),
  blue: c(34),
  magenta: c(35),
  cyan: c(36),
  gray: c(90),
};

export function padRight(s: string, width: number): string {
  // strip SGR to measure
  const bare = s.replace(/\u001B\[[0-9;]*m/g, '');
  if (bare.length >= width) return s;
  return s + ' '.repeat(width - bare.length);
}

export function renderTable(
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<string>>,
): string {
  const widths: number[] = headers.map((h) => h.replace(/\u001B\[[0-9;]*m/g, '').length);
  for (const row of rows) {
    row.forEach((cell, i) => {
      const bare = cell.replace(/\u001B\[[0-9;]*m/g, '').length;
      if (bare > (widths[i] ?? 0)) widths[i] = bare;
    });
  }
  const line = (cells: ReadonlyArray<string>) =>
    cells.map((c2, i) => padRight(c2, widths[i] ?? 0)).join('  ');

  const head = line(headers.map((h) => ansi.bold(h)));
  const sep = widths.map((w) => ansi.dim('-'.repeat(w))).join('  ');
  const body = rows.map(line).join('\n');
  return `${head}\n${sep}\n${body}`;
}
