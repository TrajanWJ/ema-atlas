// @autharis/sdk — build script
// Runs tsc twice (ESM + CJS) and emits a small dist/index.cjs shim.
// Replaces tsup, which is unreachable in the sandbox (npm TLS fail).
// See _shared/decisions.md "G8 SDK build" entry.

import { execSync } from 'node:child_process';
import { rmSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const distDir = resolve(pkgRoot, 'dist');

function findTsc() {
  const candidates = [
    resolve(pkgRoot, 'node_modules/.bin/tsc'),
    resolve(pkgRoot, '../../autharis/node_modules/.bin/tsc'),
    resolve(pkgRoot, '../../node_modules/.bin/tsc'),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return 'tsc';
}

const tsc = findTsc();
rmSync(distDir, { recursive: true, force: true });

console.log(`[@autharis/sdk] tsc → dist (ESM + declarations)`);
execSync(`"${tsc}" -p tsconfig.json`, { cwd: pkgRoot, stdio: 'inherit' });

console.log(`[@autharis/sdk] tsc → dist/cjs (CommonJS)`);
execSync(`"${tsc}" -p tsconfig.cjs.json`, { cwd: pkgRoot, stdio: 'inherit' });

// Mark the CJS subtree as CommonJS so Node doesn't treat its .js files as ESM
// (the package.json at the SDK root sets "type": "module").
writeFileSync(resolve(distDir, 'cjs', 'package.json'), JSON.stringify({ type: 'commonjs' }, null, 2) + '\n');

const shim = `"use strict";
// @autharis/sdk — CJS entry (re-exports tsc CJS output)
module.exports = require("./cjs/index.js");
`;
writeFileSync(resolve(distDir, 'index.cjs'), shim);
console.log(`[@autharis/sdk] wrote dist/index.cjs shim`);
console.log(`[@autharis/sdk] build ok`);
