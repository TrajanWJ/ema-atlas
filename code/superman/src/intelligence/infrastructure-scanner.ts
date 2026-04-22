import * as fs from 'fs/promises';
import * as path from 'path';
import * as net from 'net';
import { log } from '../logger.js';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface InfrastructureModel {
  database: DatabaseInfo | null;
  services: ServiceInfo[];
  envVars: EnvVarInfo[];
  runtime: RuntimeInfo;
  ports: PortInfo[];
}

export interface DatabaseInfo {
  provider: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'unknown';
  orm: string | null;
  connectionString?: string;
  models: SchemaModel[];
  isRunning: boolean;
}

export interface SchemaModel {
  name: string;
  fields: Array<{ name: string; type: string; isRelation: boolean }>;
  relations: Array<{ field: string; target: string; type: 'one-to-one' | 'one-to-many' | 'many-to-many' }>;
}

export interface ServiceInfo {
  name: string;
  detected: boolean;
  configuredEnvVars: string[];
  missingEnvVars: string[];
}

export interface EnvVarInfo {
  name: string;
  required: boolean;
  hasValue: boolean;
  source: '.env' | '.env.example' | 'code';
}

export interface RuntimeInfo {
  framework: string | null;
  nodeVersion: string | null;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  scripts: Record<string, string>;
}

export interface PortInfo {
  port: number;
  service: string;
  isListening: boolean;
}

// ── Known service → env var mappings ────────────────────────────────────────

const SERVICE_ENV_MAP: Record<string, { packages: string[]; envVars: string[] }> = {
  stripe: {
    packages: ['stripe'],
    envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
  },
  resend: {
    packages: ['resend'],
    envVars: ['RESEND_API_KEY'],
  },
  sendgrid: {
    packages: ['@sendgrid/mail', '@sendgrid/client'],
    envVars: ['SENDGRID_API_KEY'],
  },
  redis: {
    packages: ['redis', 'ioredis'],
    envVars: ['REDIS_URL'],
  },
  nextauth: {
    packages: ['next-auth', '@auth/core'],
    envVars: ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
  },
  passport: {
    packages: ['passport'],
    envVars: [],
  },
  aws: {
    packages: ['aws-sdk', '@aws-sdk/client-s3'],
    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
  },
  gcloud: {
    packages: ['@google-cloud/storage', '@google-cloud/firestore'],
    envVars: ['GOOGLE_CLOUD_PROJECT', 'GOOGLE_APPLICATION_CREDENTIALS'],
  },
  firebase: {
    packages: ['firebase', 'firebase-admin'],
    envVars: ['FIREBASE_API_KEY', 'FIREBASE_PROJECT_ID'],
  },
};

// ── DB provider → default port ──────────────────────────────────────────────

const DB_PORTS: Record<string, number> = {
  postgresql: 5432,
  mysql: 3306,
  mongodb: 27017,
  sqlite: 0, // no port
};

// ── Helpers ─────────────────────────────────────────────────────────────────

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFileOr(filePath: string, fallback: string = ''): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return fallback;
  }
}

function maskValue(value: string): string {
  if (value.length <= 4) return '****';
  return value.slice(0, 4) + '***';
}

export function parseEnvFile(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function checkPort(port: number, host: string = 'localhost', timeoutMs: number = 1000): Promise<boolean> {
  if (port <= 0) return Promise.resolve(false);
  return Promise.race<boolean>([
    new Promise<boolean>((resolve) => {
      const sock = net.createConnection({ port, host }, () => {
        sock.destroy();
        resolve(true);
      });
      sock.on('error', () => {
        sock.destroy();
        resolve(false);
      });
    }),
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeoutMs);
    }),
  ]);
}

// ── Prisma Schema Parser ────────────────────────────────────────────────────

function parsePrismaProvider(schema: string): DatabaseInfo['provider'] {
  const providerMatch = schema.match(/provider\s*=\s*"([\w-]+)"/);
  if (!providerMatch) return 'unknown';
  const raw = providerMatch[1].toLowerCase();
  if (raw === 'postgresql' || raw === 'postgres') return 'postgresql';
  if (raw === 'mysql') return 'mysql';
  if (raw === 'sqlite') return 'sqlite';
  if (raw === 'mongodb') return 'mongodb';
  return 'unknown';
}

export function parsePrismaSchema(schema: string): { provider: DatabaseInfo['provider']; models: SchemaModel[] } {
  return {
    provider: parsePrismaProvider(schema),
    models: parsePrismaModels(schema),
  };
}

function parsePrismaModels(schema: string): SchemaModel[] {
  const models: SchemaModel[] = [];
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(schema)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const fields: SchemaModel['fields'] = [];
    const relations: SchemaModel['relations'] = [];

    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;

      // Field pattern: fieldName Type modifiers
      const fieldMatch = trimmed.match(/^(\w+)\s+(\S+)/);
      if (!fieldMatch) continue;

      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];

      const isRelation = /@relation/.test(trimmed);
      // Detect if the type references another model (starts with uppercase and is not a scalar)
      const scalarTypes = new Set([
        'String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Bytes', 'Decimal', 'BigInt',
      ]);
      const baseType = fieldType.replace(/[\[\]?]/, '');
      const isModelRef = !scalarTypes.has(baseType) && /^[A-Z]/.test(baseType);

      fields.push({ name: fieldName, type: fieldType, isRelation: isRelation || isModelRef });

      if (isRelation || isModelRef) {
        const isArray = fieldType.includes('[]');
        // Try to parse @relation for specifics
        const relMatch = trimmed.match(/@relation\(([^)]*)\)/);
        let relType: 'one-to-one' | 'one-to-many' | 'many-to-many' = 'one-to-one';
        if (isArray) {
          relType = 'one-to-many';
        }
        // Many-to-many heuristic: array type with no fields/references in @relation
        if (isArray && relMatch) {
          const relArgs = relMatch[1];
          if (!relArgs.includes('fields:') && !relArgs.includes('references:')) {
            relType = 'many-to-many';
          }
        }

        relations.push({
          field: fieldName,
          target: baseType,
          type: relType,
        });
      }
    }

    models.push({ name: modelName, fields, relations });
  }

  return models;
}

// ── Database Detection ──────────────────────────────────────────────────────

async function detectDatabase(repoPath: string, deps: Record<string, string>, envVars: Record<string, string>): Promise<DatabaseInfo | null> {
  let provider: DatabaseInfo['provider'] = 'unknown';
  let orm: string | null = null;
  let connectionString: string | undefined;
  let models: SchemaModel[] = [];

  // Check Prisma
  const prismaPath = path.join(repoPath, 'prisma', 'schema.prisma');
  const prismaContent = await readFileOr(prismaPath);

  if (prismaContent) {
    orm = 'prisma';
    provider = parsePrismaProvider(prismaContent);
    models = parsePrismaModels(prismaContent);
    log('infra', 'Parsed Prisma schema', { provider, modelCount: models.length });
  }

  // Check other ORMs if prisma wasn't found
  if (!orm) {
    if (deps['typeorm']) orm = 'typeorm';
    else if (deps['knex']) orm = 'knex';
    else if (deps['drizzle-orm']) orm = 'drizzle';
  }

  // Detect provider from deps if still unknown
  if (provider === 'unknown') {
    if (deps['pg'] || deps['postgres'] || deps['@prisma/client']) provider = 'postgresql';
    else if (deps['mysql2'] || deps['mysql']) provider = 'mysql';
    else if (deps['better-sqlite3'] || deps['sqlite3']) provider = 'sqlite';
    else if (deps['mongodb'] || deps['mongoose']) provider = 'mongodb';
  }

  // No database clues at all
  if (provider === 'unknown' && !orm) return null;

  // Find connection string in env vars
  const connKeys = ['DATABASE_URL', 'DB_URL', 'MONGODB_URI', 'MONGO_URL', 'POSTGRES_URL', 'MYSQL_URL'];
  for (const key of connKeys) {
    if (envVars[key]) {
      connectionString = maskValue(envVars[key]);
      break;
    }
  }

  // Check if DB port is listening
  const port = DB_PORTS[provider] ?? 0;
  const isRunning = await checkPort(port);

  return { provider, orm, connectionString, models, isRunning };
}

// ── Service Detection ───────────────────────────────────────────────────────

export function detectServices(deps: Record<string, string>, envVars: Record<string, string>): ServiceInfo[] {
  const services: ServiceInfo[] = [];

  for (const [serviceName, config] of Object.entries(SERVICE_ENV_MAP)) {
    const detected = config.packages.some((pkg) => pkg in deps);
    if (!detected) continue;

    const configuredEnvVars: string[] = [];
    const missingEnvVars: string[] = [];

    for (const envKey of config.envVars) {
      if (envVars[envKey]) {
        configuredEnvVars.push(envKey);
      } else {
        missingEnvVars.push(envKey);
      }
    }

    services.push({ name: serviceName, detected, configuredEnvVars, missingEnvVars });
  }

  return services;
}

// ── Env Var Validation ──────────────────────────────────────────────────────

async function collectEnvVars(repoPath: string): Promise<{
  envVars: Record<string, string>;
  envInfos: EnvVarInfo[];
}> {
  const dotEnvPath = path.join(repoPath, '.env');
  const dotEnvExamplePath = path.join(repoPath, '.env.example');

  const dotEnvContent = await readFileOr(dotEnvPath);
  const dotEnvExampleContent = await readFileOr(dotEnvExamplePath);

  const envVars = parseEnvFile(dotEnvContent);
  const exampleVars = parseEnvFile(dotEnvExampleContent);

  // Scan source for process.env references
  const codeEnvVars = new Set<string>();
  const srcDir = path.join(repoPath, 'src');
  if (await fileExists(srcDir)) {
    await scanDirForEnvRefs(srcDir, codeEnvVars);
  }
  // Also check root-level config files
  for (const rootFile of ['next.config.js', 'next.config.mjs', 'next.config.ts', 'server.ts', 'server.js', 'index.ts', 'index.js']) {
    const rootPath = path.join(repoPath, rootFile);
    const content = await readFileOr(rootPath);
    if (content) {
      extractEnvRefs(content, codeEnvVars);
    }
  }

  // Build unified list
  const allKeys = new Set<string>([
    ...Object.keys(envVars),
    ...Object.keys(exampleVars),
    ...codeEnvVars,
  ]);

  const envInfos: EnvVarInfo[] = [];
  for (const key of allKeys) {
    const inEnv = key in envVars;
    const inExample = key in exampleVars;
    const inCode = codeEnvVars.has(key);

    let source: EnvVarInfo['source'];
    if (inExample) source = '.env.example';
    else if (inEnv) source = '.env';
    else source = 'code';

    envInfos.push({
      name: key,
      required: inExample || inCode,
      hasValue: inEnv && envVars[key].length > 0,
      source,
    });
  }

  return { envVars, envInfos };
}

async function scanDirForEnvRefs(dir: string, out: Set<string>): Promise<void> {
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return;
  }

  for (const name of names) {
    const fullPath = path.join(dir, name);
    let stat;
    try {
      stat = await fs.stat(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      // Skip node_modules, .git, dist, etc.
      if (['node_modules', '.git', 'dist', '.next', 'build', 'coverage'].includes(name)) continue;
      await scanDirForEnvRefs(fullPath, out);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) {
      const content = await readFileOr(fullPath);
      if (content) extractEnvRefs(content, out);
    }
  }
}

function extractEnvRefs(content: string, out: Set<string>): void {
  // Match process.env.VAR_NAME and process.env['VAR_NAME'] and process.env["VAR_NAME"]
  const dotAccess = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  const bracketAccess = /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g;

  let m: RegExpExecArray | null;
  while ((m = dotAccess.exec(content)) !== null) out.add(m[1]);
  while ((m = bracketAccess.exec(content)) !== null) out.add(m[1]);
}

// ── Env Var Comparison ───────────────────────────────────────────────────────

export function compareEnvVars(
  exampleVars: Record<string, string>,
  actualVars: Record<string, string>,
): { missing: string[]; extra: string[] } {
  const missing: string[] = [];
  const extra: string[] = [];

  for (const key of Object.keys(exampleVars)) {
    if (!(key in actualVars)) {
      missing.push(key);
    }
  }

  for (const key of Object.keys(actualVars)) {
    if (!(key in exampleVars)) {
      extra.push(key);
    }
  }

  return { missing, extra };
}

// ── Runtime Detection ───────────────────────────────────────────────────────

async function detectRuntime(repoPath: string, pkg: Record<string, unknown>): Promise<RuntimeInfo> {
  // Framework detection
  const deps = { ...(pkg.dependencies as Record<string, string> || {}), ...(pkg.devDependencies as Record<string, string> || {}) };
  let framework: string | null = null;
  if (deps['next']) framework = 'nextjs';
  else if (deps['express']) framework = 'express';
  else if (deps['fastify']) framework = 'fastify';
  else if (deps['koa']) framework = 'koa';
  else if (deps['hapi'] || deps['@hapi/hapi']) framework = 'hapi';
  else if (deps['nuxt'] || deps['nuxt3']) framework = 'nuxt';
  else if (deps['svelte'] || deps['@sveltejs/kit']) framework = 'sveltekit';
  else if (deps['remix'] || deps['@remix-run/node']) framework = 'remix';
  else if (deps['astro']) framework = 'astro';

  // Node version
  let nodeVersion: string | null = null;
  const nvmrc = await readFileOr(path.join(repoPath, '.nvmrc'));
  if (nvmrc.trim()) {
    nodeVersion = nvmrc.trim();
  } else {
    const nodeVersionFile = await readFileOr(path.join(repoPath, '.node-version'));
    if (nodeVersionFile.trim()) {
      nodeVersion = nodeVersionFile.trim();
    } else if (pkg.engines && typeof pkg.engines === 'object' && 'node' in (pkg.engines as Record<string, string>)) {
      nodeVersion = (pkg.engines as Record<string, string>).node;
    }
  }

  // Package manager
  let packageManager: RuntimeInfo['packageManager'] = 'unknown';
  if (await fileExists(path.join(repoPath, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
  else if (await fileExists(path.join(repoPath, 'yarn.lock'))) packageManager = 'yarn';
  else if (await fileExists(path.join(repoPath, 'package-lock.json'))) packageManager = 'npm';

  // Scripts
  const scripts = (pkg.scripts as Record<string, string>) || {};

  return { framework, nodeVersion, packageManager, scripts };
}

// ── Port Detection ──────────────────────────────────────────────────────────

async function detectPorts(database: DatabaseInfo | null, services: ServiceInfo[], runtime: RuntimeInfo): Promise<PortInfo[]> {
  const portChecks: Array<{ port: number; service: string }> = [];

  // Database ports
  if (database && database.provider !== 'sqlite') {
    const dbPort = DB_PORTS[database.provider];
    if (dbPort) portChecks.push({ port: dbPort, service: `${database.provider} database` });
  }

  // Redis
  if (services.some((s) => s.name === 'redis')) {
    portChecks.push({ port: 6379, service: 'redis' });
  }

  // Dev server ports
  const devScripts = ['dev', 'start', 'serve'];
  for (const scriptName of devScripts) {
    const script = runtime.scripts[scriptName];
    if (!script) continue;
    const portMatch = script.match(/(?:-p|--port)\s+(\d+)/);
    if (portMatch) {
      portChecks.push({ port: parseInt(portMatch[1], 10), service: `${scriptName} script` });
    }
  }

  // Common dev server ports
  if (runtime.framework === 'nextjs') portChecks.push({ port: 3000, service: 'nextjs dev server' });
  else if (runtime.framework === 'express') portChecks.push({ port: 3000, service: 'express server' });
  else if (runtime.framework === 'nuxt') portChecks.push({ port: 3000, service: 'nuxt dev server' });
  else if (runtime.framework === 'astro') portChecks.push({ port: 4321, service: 'astro dev server' });
  else if (runtime.framework === 'sveltekit') portChecks.push({ port: 5173, service: 'sveltekit dev server' });

  // Deduplicate by port
  const seen = new Set<number>();
  const unique: Array<{ port: number; service: string }> = [];
  for (const check of portChecks) {
    if (!seen.has(check.port)) {
      seen.add(check.port);
      unique.push(check);
    }
  }

  // Check all ports concurrently
  const results = await Promise.all(
    unique.map(async ({ port, service }) => {
      const isListening = await checkPort(port);
      return { port, service, isListening };
    }),
  );

  return results;
}

// ── Main Scanner ────────────────────────────────────────────────────────────

export async function scanInfrastructure(repoPath: string): Promise<InfrastructureModel> {
  log('infra', 'Starting infrastructure scan', { repoPath });

  // Read package.json
  const pkgPath = path.join(repoPath, 'package.json');
  let pkg: Record<string, unknown> = {};
  try {
    const pkgContent = await fs.readFile(pkgPath, 'utf-8');
    pkg = JSON.parse(pkgContent);
  } catch {
    log('infra', 'No package.json found or invalid JSON', { pkgPath });
  }

  const allDeps: Record<string, string> = {
    ...(pkg.dependencies as Record<string, string> || {}),
    ...(pkg.devDependencies as Record<string, string> || {}),
  };

  // Collect env vars first (needed by multiple detectors)
  const { envVars, envInfos } = await collectEnvVars(repoPath);
  log('infra', 'Collected env vars', { count: envInfos.length });

  // Run detections concurrently where possible
  const [database, runtime] = await Promise.all([
    detectDatabase(repoPath, allDeps, envVars),
    detectRuntime(repoPath, pkg),
  ]);

  const services = detectServices(allDeps, envVars);
  log('infra', 'Detected services', { services: services.map((s) => s.name) });

  const ports = await detectPorts(database, services, runtime);
  log('infra', 'Port scan complete', { ports: ports.map((p) => ({ port: p.port, listening: p.isListening })) });

  const model: InfrastructureModel = {
    database,
    services,
    envVars: envInfos,
    runtime,
    ports,
  };

  log('infra', 'Infrastructure scan complete', {
    hasDatabase: !!database,
    serviceCount: services.length,
    envVarCount: envInfos.length,
    framework: runtime.framework,
  });

  return model;
}
