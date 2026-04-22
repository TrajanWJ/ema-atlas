import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, sep, posix } from 'path';
import { log } from '../logger.js';

// ── Public interfaces ──────────────────────────────────────────────

export interface AuthInfo {
  required: boolean;
  type: 'none' | 'session' | 'jwt' | 'api-key' | 'oauth' | 'unknown';
  roles?: string[];
}

export interface RouteInfo {
  path: string;
  method: string;
  filePath: string;
  auth: AuthInfo;
  parameters: string[];
  middleware: string[];
  description: string;
}

export interface RouteMap {
  routes: RouteInfo[];
  framework: 'nextjs-app' | 'nextjs-pages' | 'express' | 'fastify' | 'unknown';
  totalRoutes: number;
  protectedRoutes: number;
  unprotectedRoutes: number;
}

// ── Constants ──────────────────────────────────────────────────────

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

const AUTH_PATTERNS: { pattern: RegExp; type: AuthInfo['type'] }[] = [
  { pattern: /getServerSession/,                  type: 'session' },
  { pattern: /\bauth\s*\(\s*\)/,                  type: 'session' },
  { pattern: /useSession/,                        type: 'session' },
  { pattern: /getSession/,                        type: 'session' },
  { pattern: /jwt\.verify/,                       type: 'jwt' },
  { pattern: /getToken\s*\(/,                     type: 'jwt' },
  { pattern: /jwtVerify/,                         type: 'jwt' },
  { pattern: /verify\s*\(\s*token/i,              type: 'jwt' },
  { pattern: /req\.headers\s*\[\s*['"]authorization['"]\s*\]/, type: 'api-key' },
  { pattern: /req\.headers\.authorization/,       type: 'api-key' },
  { pattern: /Bearer\s/,                          type: 'jwt' },
  { pattern: /x-api-key/i,                        type: 'api-key' },
  { pattern: /apiKey/,                            type: 'api-key' },
  { pattern: /oauth/i,                            type: 'oauth' },
  { pattern: /passport\./,                        type: 'oauth' },
  { pattern: /cookies\s*\(\s*\)/,                 type: 'session' },
  { pattern: /withAuth/,                          type: 'unknown' },
  { pattern: /requireAuth/,                       type: 'unknown' },
  { pattern: /isAuthenticated/,                   type: 'unknown' },
  { pattern: /authMiddleware/,                    type: 'unknown' },
  { pattern: /protectedRoute/,                    type: 'unknown' },
];

const ROLE_PATTERNS: RegExp[] = [
  /session\.user\.role\s*===?\s*['"](\w+)['"]/g,
  /role\s*===?\s*['"](\w+)['"]/g,
  /['"]role['"]\s*:\s*['"](\w+)['"]/g,
  /isAdmin/g,
  /isTeacher/g,
  /isStudent/g,
  /hasRole\s*\(\s*['"](\w+)['"]\s*\)/g,
  /requireRole\s*\(\s*['"](\w+)['"]\s*\)/g,
  /roles?\s*\.includes\s*\(\s*['"](\w+)['"]\s*\)/g,
];

const MIDDLEWARE_PATTERNS: RegExp[] = [
  /(?:app|router)\.\w+\s*\(\s*['"][^'"]*['"]\s*,\s*([\w.]+)\s*,/g,
  /import\s+\{?\s*([\w,\s]+)\s*\}?\s+from\s+['"].*(?:middleware|auth|guard|protect)['"]/gi,
  /(?:const|let)\s+(\w+)\s*=\s*require\s*\(\s*['"].*(?:middleware|auth|guard|protect)['"]\s*\)/gi,
];

// ── Helpers ────────────────────────────────────────────────────────

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function globFiles(dir: string, match: RegExp): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        await walk(full);
      } else if (entry.isFile() && match.test(entry.name)) {
        results.push(full);
      }
    }
  }

  await walk(dir);
  return results;
}

async function safeRead(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function normalizePathSeparators(p: string): string {
  return p.split(sep).join(posix.sep);
}

/**
 * Convert a Next.js file-system path segment to a URL path segment.
 * `[id]` → `:id`, `[...slug]` → `:slug*`, `[[...slug]]` → `:slug*`
 */
function nextSegmentToParam(segment: string): string {
  // catch-all: [[...slug]] or [...slug]
  const catchAll = segment.match(/^\[{1,2}\.\.\.(\w+)\]{1,2}$/);
  if (catchAll) return `:${catchAll[1]}*`;

  // dynamic: [id]
  const dynamic = segment.match(/^\[(\w+)\]$/);
  if (dynamic) return `:${dynamic[1]}`;

  return segment;
}

function filePathToUrlPath(filePath: string, rootDir: string, prefix: string): string {
  const rel = normalizePathSeparators(relative(rootDir, filePath));
  const parts = rel.split('/');

  // remove the filename (route.ts, route.js, or the file itself for pages api)
  parts.pop();

  const urlParts = parts.map(nextSegmentToParam);
  const url = '/' + urlParts.join('/');
  return url || prefix;
}

function pagesFilePathToUrlPath(filePath: string, pagesApiDir: string): string {
  const rel = normalizePathSeparators(relative(pagesApiDir, filePath));
  // remove extension
  const withoutExt = rel.replace(/\.(ts|tsx|js|jsx)$/, '');
  const parts = withoutExt.split('/');

  // remove trailing "index"
  if (parts[parts.length - 1] === 'index') {
    parts.pop();
  }

  const urlParts = parts.map(nextSegmentToParam);
  return '/api/' + urlParts.join('/') || '/api';
}

function extractParameters(routePath: string): string[] {
  const params: string[] = [];
  const paramRegex = /:(\w+)\*?/g;
  let m: RegExpExecArray | null;
  while ((m = paramRegex.exec(routePath)) !== null) {
    params.push(m[1]);
  }
  return params;
}

function detectAuth(content: string): AuthInfo {
  let detectedType: AuthInfo['type'] = 'none';
  let required = false;

  for (const { pattern, type } of AUTH_PATTERNS) {
    if (pattern.test(content)) {
      required = true;
      // prefer more specific types over 'unknown'
      if (detectedType === 'none' || detectedType === 'unknown') {
        detectedType = type;
      }
      break;
    }
  }

  const roles = extractRoles(content);
  if (roles.length > 0) {
    required = true;
    if (detectedType === 'none') {
      detectedType = 'unknown';
    }
  }

  return {
    required,
    type: detectedType,
    ...(roles.length > 0 ? { roles } : {}),
  };
}

function extractRoles(content: string): string[] {
  const roles = new Set<string>();

  for (const pattern of ROLE_PATTERNS) {
    // reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(content)) !== null) {
      if (m[1]) {
        roles.add(m[1].toUpperCase());
      } else {
        // patterns like /isAdmin/ without capture group
        const source = pattern.source;
        if (source.includes('isAdmin')) roles.add('ADMIN');
        if (source.includes('isTeacher')) roles.add('TEACHER');
        if (source.includes('isStudent')) roles.add('STUDENT');
      }
    }
  }

  return Array.from(roles);
}

function detectMiddleware(content: string): string[] {
  const middleware = new Set<string>();

  for (const pattern of MIDDLEWARE_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(content)) !== null) {
      if (m[1]) {
        // may be comma-separated imports
        const names = m[1].split(',').map(n => n.trim()).filter(Boolean);
        for (const name of names) {
          middleware.add(name);
        }
      }
    }
  }

  // also detect common inline middleware references
  const inlineMiddleware = [
    /\bcors\b/,
    /\brateLimit\b/,
    /\bhelmet\b/,
    /\bbodyParser\b/,
    /\bmulter\b/,
    /\bcsrf\b/,
    /\bvalidate\b/i,
  ];

  for (const pattern of inlineMiddleware) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      if (match) middleware.add(match[0]);
    }
  }

  return Array.from(middleware);
}

function generateDescription(method: string, routePath: string): string {
  const segments = routePath.split('/').filter(Boolean);
  const resource = segments
    .filter(s => !s.startsWith(':'))
    .pop() || 'resource';

  const hasParam = routePath.includes(':');

  const verbs: Record<string, string> = {
    GET: hasParam ? `Get a specific ${resource}` : `List ${resource}`,
    POST: `Create a new ${resource}`,
    PUT: `Update ${resource}`,
    DELETE: `Delete ${resource}`,
    PATCH: `Partially update ${resource}`,
  };

  return verbs[method] || `${method} ${routePath}`;
}

// ── Framework detection ────────────────────────────────────────────

type Framework = RouteMap['framework'];

async function detectFramework(repoPath: string): Promise<Framework> {
  // Check for Next.js App Router
  const appDirCandidates = [
    join(repoPath, 'src', 'app'),
    join(repoPath, 'app'),
  ];
  for (const dir of appDirCandidates) {
    if (await exists(dir)) {
      const routeFiles = await globFiles(dir, /^route\.(ts|js)$/);
      if (routeFiles.length > 0) {
        log('index', `Detected Next.js App Router (${routeFiles.length} route files)`);
        return 'nextjs-app';
      }
    }
  }

  // Check for Next.js Pages API
  const pagesDirCandidates = [
    join(repoPath, 'src', 'pages', 'api'),
    join(repoPath, 'pages', 'api'),
  ];
  for (const dir of pagesDirCandidates) {
    if (await exists(dir)) {
      log('index', 'Detected Next.js Pages Router');
      return 'nextjs-pages';
    }
  }

  // Check package.json for express / fastify
  const pkgPath = join(repoPath, 'package.json');
  if (await exists(pkgPath)) {
    const pkgContent = await safeRead(pkgPath);
    try {
      const pkg = JSON.parse(pkgContent);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      if (allDeps.fastify) {
        log('index', 'Detected Fastify framework');
        return 'fastify';
      }
      if (allDeps.express) {
        log('index', 'Detected Express framework');
        return 'express';
      }
    } catch {
      // ignore parse errors
    }
  }

  log('index', 'Could not detect framework, falling back to unknown');
  return 'unknown';
}

// ── Next.js App Router scanning ────────────────────────────────────

async function scanNextjsAppRouter(repoPath: string): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  const appDirCandidates = [
    join(repoPath, 'src', 'app'),
    join(repoPath, 'app'),
  ];

  for (const appDir of appDirCandidates) {
    if (!(await exists(appDir))) continue;

    const routeFiles = await globFiles(appDir, /^route\.(ts|tsx|js|jsx)$/);

    for (const filePath of routeFiles) {
      const urlPath = filePathToUrlPath(filePath, appDir, '/');
      const content = await safeRead(filePath);
      if (!content) continue;

      const methods = detectExportedMethods(content);
      const auth = detectAuth(content);
      const middleware = detectMiddleware(content);
      const parameters = extractParameters(urlPath);

      for (const method of methods) {
        routes.push({
          path: urlPath,
          method,
          filePath,
          auth,
          parameters,
          middleware,
          description: generateDescription(method, urlPath),
        });
      }
    }
  }

  return routes;
}

function detectExportedMethods(content: string): string[] {
  const methods: string[] = [];

  for (const method of HTTP_METHODS) {
    // Match: export async function GET, export function GET, export const GET
    const exportPattern = new RegExp(
      `export\\s+(?:async\\s+)?(?:function|const|let|var)\\s+${method}\\b`
    );
    if (exportPattern.test(content)) {
      methods.push(method);
    }
  }

  return methods;
}

// ── Next.js Pages API scanning ─────────────────────────────────────

async function scanNextjsPages(repoPath: string): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  const pagesDirCandidates = [
    join(repoPath, 'src', 'pages', 'api'),
    join(repoPath, 'pages', 'api'),
  ];

  for (const pagesApiDir of pagesDirCandidates) {
    if (!(await exists(pagesApiDir))) continue;

    const apiFiles = await globFiles(pagesApiDir, /\.(ts|tsx|js|jsx)$/);

    for (const filePath of apiFiles) {
      const urlPath = pagesFilePathToUrlPath(filePath, pagesApiDir);
      const content = await safeRead(filePath);
      if (!content) continue;

      const methods = detectPagesApiMethods(content);
      const auth = detectAuth(content);
      const middleware = detectMiddleware(content);
      const parameters = extractParameters(urlPath);

      for (const method of methods) {
        routes.push({
          path: urlPath,
          method,
          filePath,
          auth,
          parameters,
          middleware,
          description: generateDescription(method, urlPath),
        });
      }
    }
  }

  return routes;
}

function detectPagesApiMethods(content: string): string[] {
  const methods = new Set<string>();

  for (const method of HTTP_METHODS) {
    // req.method === 'GET'  or  req.method === "GET"
    const methodCheck = new RegExp(
      `req\\.method\\s*===?\\s*['"]${method}['"]`
    );
    if (methodCheck.test(content)) {
      methods.add(method);
    }

    // switch(req.method) { case 'GET':
    const switchCase = new RegExp(
      `case\\s+['"]${method}['"]`
    );
    if (switchCase.test(content)) {
      methods.add(method);
    }
  }

  // If no method checks found, it handles all methods (default handler)
  if (methods.size === 0) {
    // Check if it's a default export handler — assume GET + POST
    const hasDefaultExport = /export\s+default/.test(content);
    if (hasDefaultExport) {
      methods.add('GET');
      methods.add('POST');
    }
  }

  return Array.from(methods);
}

// ── Express scanning ───────────────────────────────────────────────

async function scanExpress(repoPath: string): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  // Find all JS/TS source files (skip node_modules, .git, dist, build)
  const sourceFiles = await globFiles(repoPath, /\.(ts|tsx|js|jsx)$/);
  const filtered = sourceFiles.filter(f => {
    const norm = normalizePathSeparators(f);
    return !norm.includes('node_modules') &&
           !norm.includes('.git') &&
           !norm.includes('/dist/') &&
           !norm.includes('/build/');
  });

  // Patterns for express route definitions
  const routePattern = /(?:app|router|route)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;

  for (const filePath of filtered) {
    const content = await safeRead(filePath);
    if (!content) continue;

    routePattern.lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = routePattern.exec(content)) !== null) {
      const method = m[1].toUpperCase();
      let routePath = m[2];

      // Normalize Express params — they already use :param format
      // but ensure leading slash
      if (!routePath.startsWith('/')) {
        routePath = '/' + routePath;
      }

      const auth = detectAuth(content);
      const middleware = detectExpressRouteMiddleware(content, m.index, m[0]);
      const parameters = extractParameters(routePath);

      routes.push({
        path: routePath,
        method,
        filePath,
        auth,
        parameters,
        middleware,
        description: generateDescription(method, routePath),
      });
    }

    // Also detect app.use() with a path that might be a router mount
    const usePattern = /(?:app)\s*\.\s*use\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(\w+)/g;
    let um: RegExpExecArray | null;
    while ((um = usePattern.exec(content)) !== null) {
      // This is a router mount, note it as middleware
      const mountPath = um[1];
      const routerName = um[2];
      log('index', `Detected Express router mount: ${mountPath} → ${routerName}`);
    }
  }

  return routes;
}

function detectExpressRouteMiddleware(
  content: string,
  matchIndex: number,
  matchStr: string,
): string[] {
  const middleware: string[] = [];

  // Look at the line containing the route definition and extract
  // middleware arguments between the path and the handler
  // e.g. app.get('/path', authMiddleware, rateLimiter, (req, res) => {})
  const lineEnd = content.indexOf('\n', matchIndex);
  const lineContent = content.slice(matchIndex, lineEnd === -1 ? undefined : lineEnd);

  // Match arguments after the path string and before the handler
  const argsMatch = lineContent.match(
    /['"`][^'"`]+['"`]\s*,\s*((?:[\w.]+\s*,\s*)*)((?:\(|async\s*\(|function))/
  );

  if (argsMatch && argsMatch[1]) {
    const middlewareStr = argsMatch[1];
    const names = middlewareStr
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0 && /^[\w.]+$/.test(n));
    middleware.push(...names);
  }

  return middleware;
}

// ── Fastify scanning ───────────────────────────────────────────────

async function scanFastify(repoPath: string): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  const sourceFiles = await globFiles(repoPath, /\.(ts|tsx|js|jsx)$/);
  const filtered = sourceFiles.filter(f => {
    const norm = normalizePathSeparators(f);
    return !norm.includes('node_modules') &&
           !norm.includes('.git') &&
           !norm.includes('/dist/') &&
           !norm.includes('/build/');
  });

  // fastify.get('/path', opts, handler) or fastify.route({ method: 'GET', url: '/path' })
  const shorthandPattern = /(?:fastify|server|app|instance)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  const routeObjPattern = /\.route\s*\(\s*\{[^}]*method\s*:\s*['"`](\w+)['"`][^}]*url\s*:\s*['"`]([^'"`]+)['"`]/gi;

  for (const filePath of filtered) {
    const content = await safeRead(filePath);
    if (!content) continue;

    shorthandPattern.lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = shorthandPattern.exec(content)) !== null) {
      const method = m[1].toUpperCase();
      let routePath = m[2];
      if (!routePath.startsWith('/')) routePath = '/' + routePath;

      const auth = detectAuth(content);
      const parameters = extractParameters(routePath);
      const middleware = detectMiddleware(content);

      routes.push({
        path: routePath,
        method,
        filePath,
        auth,
        parameters,
        middleware,
        description: generateDescription(method, routePath),
      });
    }

    routeObjPattern.lastIndex = 0;
    while ((m = routeObjPattern.exec(content)) !== null) {
      const method = m[1].toUpperCase();
      let routePath = m[2];
      if (!routePath.startsWith('/')) routePath = '/' + routePath;

      const auth = detectAuth(content);
      const parameters = extractParameters(routePath);
      const middleware = detectMiddleware(content);

      routes.push({
        path: routePath,
        method,
        filePath,
        auth,
        parameters,
        middleware,
        description: generateDescription(method, routePath),
      });
    }
  }

  return routes;
}

// ── Main entry point ───────────────────────────────────────────────

export async function scanRoutes(repoPath: string): Promise<RouteMap> {
  log('index', `Scanning routes in ${repoPath}`);

  const framework = await detectFramework(repoPath);
  let routes: RouteInfo[] = [];

  switch (framework) {
    case 'nextjs-app':
      routes = await scanNextjsAppRouter(repoPath);
      break;
    case 'nextjs-pages':
      routes = await scanNextjsPages(repoPath);
      break;
    case 'express':
      routes = await scanExpress(repoPath);
      break;
    case 'fastify':
      routes = await scanFastify(repoPath);
      break;
    case 'unknown': {
      // Try all scanners and merge results
      const [appRoutes, pagesRoutes, expressRoutes, fastifyRoutes] = await Promise.all([
        scanNextjsAppRouter(repoPath),
        scanNextjsPages(repoPath),
        scanExpress(repoPath),
        scanFastify(repoPath),
      ]);
      routes = [...appRoutes, ...pagesRoutes, ...expressRoutes, ...fastifyRoutes];
      break;
    }
  }

  // Deduplicate routes by path + method + filePath
  const seen = new Set<string>();
  routes = routes.filter(r => {
    const key = `${r.method}:${r.path}:${r.filePath}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by path then method
  routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  const protectedRoutes = routes.filter(r => r.auth.required).length;
  const unprotectedRoutes = routes.length - protectedRoutes;

  log('index', `Route scan complete`, {
    framework,
    total: routes.length,
    protected: protectedRoutes,
    unprotected: unprotectedRoutes,
  });

  return {
    routes,
    framework,
    totalRoutes: routes.length,
    protectedRoutes,
    unprotectedRoutes,
  };
}
