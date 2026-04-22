/**
 * Client-side API call scanner for contract validation.
 *
 * Scans frontend files (.ts, .tsx, .js, .jsx) for:
 * - fetch('/api/...') and fetch(`/api/...`) calls
 * - axios.get/post/put/delete patterns
 * - Custom API wrapper calls (e.g., apiClient.get())
 * - API_BASE + path concatenation
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, posix, sep } from 'path';
import { log } from '../logger.js';
import type { ClientCall } from '../types.js';

// ── Helpers ──

async function walkFiles(dir: string, match: RegExp): Promise<string[]> {
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
      if (
        entry.isDirectory() &&
        entry.name !== 'node_modules' &&
        entry.name !== '.git' &&
        entry.name !== 'dist' &&
        entry.name !== 'build' &&
        entry.name !== '.next'
      ) {
        await walk(full);
      } else if (entry.isFile() && match.test(entry.name)) {
        results.push(full);
      }
    }
  }

  await walk(dir);
  return results;
}

function normalizePath(p: string): string {
  return p.split(sep).join(posix.sep);
}

/**
 * Check if a file looks like a client/frontend file (not a server route file).
 */
function isClientFile(filePath: string): boolean {
  const norm = normalizePath(filePath);

  // Exclude server-side route files
  const serverPatterns = [
    /\/app\/api\/.+\/route\.(ts|js)$/,
    /\/pages\/api\//,
    /\/routes\//,
    /\/controllers\//,
    /\/server\//,
  ];

  for (const p of serverPatterns) {
    if (p.test(norm)) return false;
  }

  return true;
}

// ── Fetch pattern detection ──

const FETCH_PATTERNS: RegExp[] = [
  // fetch('/api/...')  or  fetch("/api/...")
  /fetch\s*\(\s*['"]([^'"]+)['"]/g,
  // fetch(`/api/...`)  — template literal (static part only)
  /fetch\s*\(\s*`([^`]*?(?:\$\{[^}]*\}[^`]*?)*)`/g,
];

const AXIOS_PATTERNS: RegExp[] = [
  // axios.get('/api/...') etc.
  /axios\s*\.\s*(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi,
  // axios.get(`/api/...`)
  /axios\s*\.\s*(get|post|put|delete|patch)\s*\(\s*`([^`]*?(?:\$\{[^}]*\}[^`]*?)*)`/gi,
  // axios({ method: 'get', url: '/api/...' })
  /axios\s*\(\s*\{[^}]*url\s*:\s*['"]([^'"]+)['"][^}]*method\s*:\s*['"](\w+)['"]/gis,
  /axios\s*\(\s*\{[^}]*method\s*:\s*['"](\w+)['"][^}]*url\s*:\s*['"]([^'"]+)['"]/gis,
];

const API_CLIENT_PATTERNS: RegExp[] = [
  // apiClient.get('/api/...'), api.post('/users')
  /(?:apiClient|api|client|httpClient|http)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi,
  // Same but with template literals
  /(?:apiClient|api|client|httpClient|http)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*`([^`]*?(?:\$\{[^}]*\}[^`]*?)*)`/gi,
];

/**
 * Resolve template literal URLs to a normalized form.
 * `/api/users/${userId}` -> `/api/users/:param`
 * `/api/users/${id}/posts` -> `/api/users/:param/posts`
 */
function resolveTemplateUrl(template: string): string {
  return template.replace(/\$\{[^}]+\}/g, ':param');
}

/**
 * Detect API_BASE concatenation patterns and resolve the URL.
 * e.g., API_BASE + '/users' or `${API_BASE}/users`
 */
function resolveBaseUrl(content: string, url: string): string {
  // If the URL already starts with / or http, return as-is
  if (url.startsWith('/') || url.startsWith('http')) return url;

  // Look for a constant definition like: const API_BASE = '/api'
  const baseMatch = content.match(
    /(?:const|let|var)\s+(?:API_BASE|API_URL|BASE_URL|apiBase|baseUrl|baseURL)\s*=\s*['"]([^'"]+)['"]/,
  );

  if (baseMatch) {
    const base = baseMatch[1].replace(/\/$/, '');
    const path = url.startsWith('/') ? url : '/' + url;
    return base + path;
  }

  return url;
}

/**
 * Determine HTTP method from a fetch() call by looking at the current statement.
 * Scopes the search to the matching parentheses of the fetch() call to avoid
 * picking up method options from a different fetch call.
 */
function detectFetchMethod(content: string, matchIndex: number): string {
  // Find the opening paren of fetch(
  const parenStart = content.indexOf('(', matchIndex);
  if (parenStart === -1) return 'GET';

  // Walk forward to find matching closing paren, counting nesting
  let depth = 1;
  let i = parenStart + 1;
  while (i < content.length && depth > 0) {
    if (content[i] === '(') depth++;
    else if (content[i] === ')') depth--;
    i++;
  }

  // Extract just the content inside the fetch(...) call
  const fetchBody = content.slice(parenStart, i);

  // Check for method option in fetch options object
  const methodMatch = fetchBody.match(/method\s*:\s*['"](\w+)['"]/i);
  if (methodMatch) {
    return methodMatch[1].toUpperCase();
  }

  return 'GET'; // fetch defaults to GET
}

/**
 * Scan all frontend files in a project and return ClientCall[].
 */
export async function scanClientCalls(projectPath: string): Promise<ClientCall[]> {
  log('sync', 'Scanning client API calls', { projectPath });

  const files = await walkFiles(projectPath, /\.(ts|tsx|js|jsx)$/);
  const clientFiles = files.filter(isClientFile);
  const calls: ClientCall[] = [];

  for (const filePath of clientFiles) {
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch {
      continue;
    }

    // Skip files that don't contain API-related patterns
    if (
      !content.includes('fetch') &&
      !content.includes('axios') &&
      !content.includes('apiClient') &&
      !content.includes('api.') &&
      !content.includes('httpClient') &&
      !content.includes('http.')
    ) {
      continue;
    }

    const lines = content.split('\n');

    // Scan fetch() calls
    for (const pattern of FETCH_PATTERNS) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(content)) !== null) {
        let url = m[1];
        if (url.includes('${')) {
          url = resolveTemplateUrl(url);
        }
        url = resolveBaseUrl(content, url);

        // Skip non-API calls (e.g., fetching external resources)
        if (!url.startsWith('/') && !url.includes('/api')) continue;

        const line = content.slice(0, m.index).split('\n').length;
        const method = detectFetchMethod(content, m.index);

        calls.push({
          url,
          method,
          file: filePath,
          line,
        });
      }
    }

    // Scan axios calls
    for (const pattern of AXIOS_PATTERNS) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(content)) !== null) {
        let method: string;
        let url: string;

        if (m.length === 3) {
          // axios.get('/url') or axios({ method: ..., url: ... })
          // Determine which capture group has method vs url
          const first = m[1];
          const second = m[2];
          if (/^(get|post|put|delete|patch)$/i.test(first)) {
            method = first.toUpperCase();
            url = second;
          } else {
            url = first;
            method = second.toUpperCase();
          }
        } else {
          continue;
        }

        if (url.includes('${')) {
          url = resolveTemplateUrl(url);
        }
        url = resolveBaseUrl(content, url);

        if (!url.startsWith('/') && !url.includes('/api')) continue;

        const line = content.slice(0, m.index).split('\n').length;

        calls.push({
          url,
          method,
          file: filePath,
          line,
        });
      }
    }

    // Scan API client wrapper calls
    for (const pattern of API_CLIENT_PATTERNS) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(content)) !== null) {
        const method = m[1].toUpperCase();
        let url = m[2];

        if (url.includes('${')) {
          url = resolveTemplateUrl(url);
        }
        url = resolveBaseUrl(content, url);

        if (!url.startsWith('/') && !url.includes('/api')) continue;

        const line = content.slice(0, m.index).split('\n').length;

        calls.push({
          url,
          method,
          file: filePath,
          line,
        });
      }
    }
  }

  // Deduplicate by url + method + file + line
  const seen = new Set<string>();
  const deduped = calls.filter((c) => {
    const key = `${c.method}:${c.url}:${c.file}:${c.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  log('sync', `Client call scan complete`, { total: deduped.length });
  return deduped;
}
