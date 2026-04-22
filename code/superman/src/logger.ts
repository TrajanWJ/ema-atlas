import type { LogStage } from './types.js';

const colors: Record<LogStage, string> = {
  parse: '\x1b[36m',    // cyan
  embed: '\x1b[35m',    // magenta
  graph: '\x1b[33m',    // yellow
  query: '\x1b[32m',    // green
  simulate: '\x1b[34m', // blue
  edit: '\x1b[31m',     // red
  execute: '\x1b[91m',  // bright red
  sync: '\x1b[96m',     // bright cyan
  intent: '\x1b[95m',   // bright magenta
  gap: '\x1b[93m',      // bright yellow
  plan: '\x1b[92m',     // bright green
  auto: '\x1b[97m',     // bright white
  server: '\x1b[94m',   // bright blue
  index: '\x1b[36m',    // cyan (same as parse)
  apply: '\x1b[31m',    // red (same as edit)
  infra: '\x1b[33m',    // yellow (same as graph)
  mcp: '\x1b[97m',      // bright white (same as auto)
  cache: '\x1b[96m',    // bright cyan (same as sync)
};

const reset = '\x1b[0m';

export function log(stage: LogStage, message: string, data?: Record<string, unknown>) {
  const color = colors[stage];
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = `${color}[${timestamp}][${stage.toUpperCase().padEnd(8)}]${reset}`;
  // MUST use stderr — stdout is reserved for MCP stdio transport JSON-RPC
  process.stderr.write(`${prefix} ${message}\n`);
  if (data) {
    process.stderr.write(`${prefix}    ${JSON.stringify(data, null, 2)}\n`);
  }
}

export function logError(stage: LogStage, message: string, error: unknown) {
  const errMsg = error instanceof Error ? error.message : String(error);
  log(stage, `ERROR: ${message} — ${errMsg}`);
}
