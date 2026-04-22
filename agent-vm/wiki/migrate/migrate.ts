#!/usr/bin/env ts-node
// ============================================================
// Wiki Migration Tool
// Migrates /home/trajan/vault/ → /home/trajan/wiki/spaces/default/
// 
// Usage:
//   ts-node migrate/migrate.ts --dry-run   (preview, no writes)
//   ts-node migrate/migrate.ts --migrate   (run migration)
//   ts-node migrate/migrate.ts --verify    (spot-check 20 random pages)
// ============================================================

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';

const VAULT_ROOT = '/home/trajan/vault';
const WIKI_ROOT = path.join(__dirname, '..');
const SPACES_ROOT = path.join(WIKI_ROOT, 'spaces', 'default');
const REPORT_PATH = path.join(__dirname, 'report.json');

// Folders to skip entirely
const SKIP_FOLDERS = new Set([
  'LCM Summaries',
  'Claude-Code-Memory',
  '_deprecated',
  'Inbox',
]);

// ============================================================
// Type mapping: vault folder → wiki type
// ============================================================

function mapTypeFromPath(vaultRelPath: string, frontmatterType?: string): string {
  const parts = vaultRelPath.split(path.sep);
  const topFolder = parts[0];

  const folderTypeMap: Record<string, string> = {
    'Projects': 'project',
    'Research': 'research',
    'Daily Notes': 'daily-note',
    'Decisions': 'decision',
    'Agent Knowledge': 'agent-learning',
    'Agent-Learnings': 'agent-learning',
    'Codebases': 'codebase',
    'Operations': 'playbook',
    'Ops': 'playbook',
    'Architecture': 'knowledge',
    'Reference': 'knowledge',
    'Resources': 'knowledge',
    'Courses': 'knowledge',
    'Agents': 'agent-learning',
    'Skills': 'knowledge',
    'Templates': 'knowledge',
    'Security': 'playbook',
    'Tools': 'knowledge',
    '_hubs': 'knowledge',
    'Reports': 'knowledge',
    'Trajan': 'knowledge',
    'EMA': 'research',
    'Claude-Code-Sessions': 'session-summary',
    'Claude-Code-Bot': 'knowledge',
    'Session Summaries': 'session-summary',
    'Media': 'knowledge',
    'Learnings & Gotchas': 'agent-learning',
  };

  // Special case: System/ folder
  if (topFolder === 'System') {
    if (frontmatterType === 'config' || vaultRelPath.toLowerCase().includes('config')) {
      return 'config';
    }
    if (vaultRelPath.toLowerCase().includes('integration')) {
      return 'integration';
    }
    if (frontmatterType === 'synthesis') {
      return 'synthesis';
    }
    return 'knowledge';
  }

  return folderTypeMap[topFolder] || 'knowledge';
}

/**
 * Map vault folder to wiki target folder path (relative to spaces/default).
 */
function mapTargetFolder(vaultRelPath: string, type: string): string {
  const parts = vaultRelPath.split(path.sep);
  const topFolder = parts[0];
  const rest = parts.slice(1);

  const folderMap: Record<string, string> = {
    'Projects': 'projects',
    'Research': 'research',
    'Daily Notes': 'daily-notes',
    'Decisions': 'decisions',
    'Agent Knowledge': 'agents',
    'Agent-Learnings': 'agent-learnings',
    'Codebases': 'codebases',
    'Operations': 'operations',
    'Ops': 'operations',
    'Architecture': 'system/architecture',
    'Reference': 'reference',
    'Resources': 'reference/resources',
    'Courses': 'reference/courses',
    'Agents': 'agents',
    'Skills': 'skills',
    'Templates': 'templates',
    'Security': 'operations/security',
    'Tools': 'reference/tools',
    '_hubs': 'reference/hubs',
    'Reports': 'reports',
    'Trajan': 'system/user',
    'EMA': 'research/ema',
    'Session Summaries': 'sessions',
    'Claude-Code-Sessions': 'sessions/claude-code',
    'Claude-Code-Bot': 'agents/claude-code-bot',
    'System': 'system',
    'Media': 'reference/media',
    'Learnings & Gotchas': 'agent-learnings',
  };

  const baseFolder = folderMap[topFolder] || 'knowledge';
  
  if (rest.length > 1) {
    // Preserve subdirectory structure
    const subPath = rest.slice(0, -1).join('/');
    return `${baseFolder}/${subPath}`;
  }

  return baseFolder;
}

// ============================================================
// Filename normalization
// ============================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-topic-\d+)?\.md$/i;

interface RenameResult {
  newFilename: string;
  wasRenamed: boolean;
  renameReason?: string;
}

function normalizeFilename(
  filename: string,
  frontmatter: Record<string, unknown>,
  content: string
): RenameResult {
  if (!UUID_REGEX.test(filename)) {
    return { newFilename: filename, wasRenamed: false };
  }

  // UUID file — try to extract date + agent + topic from frontmatter
  const date = extractDate(frontmatter, content);
  const agent = extractAgent(frontmatter, content);
  const topic = extractTopic(frontmatter, content);

  const slug = `${date}-${agent}-${topic}.md`;
  return {
    newFilename: slug,
    wasRenamed: true,
    renameReason: `UUID → ${slug}`,
  };
}

function extractDate(fm: Record<string, unknown>, content: string): string {
  if (fm.created && typeof fm.created === 'string') {
    const m = fm.created.toString().match(/(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  if (fm.date && typeof fm.date === 'string') {
    const m = fm.date.toString().match(/(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  // Try to extract date from content headers
  const dateMatch = content.match(/# Session (\d{4}-\d{2}-\d{2})/);
  if (dateMatch) return dateMatch[1];
  
  const dateMatch2 = content.match(/\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (dateMatch2) return dateMatch2[1];

  return new Date().toISOString().split('T')[0];
}

function extractAgent(fm: Record<string, unknown>, content: string): string {
  if (fm.agent && typeof fm.agent === 'string') {
    return slugifyPart(fm.agent as string);
  }
  if (fm.source && typeof fm.source === 'string') {
    const source = fm.source as string;
    if (source.startsWith('agent:')) {
      return slugifyPart(source.replace('agent:', ''));
    }
  }
  // Try content
  const agentMatch = content.match(/agent[:\s]+([a-z-]+)/i);
  if (agentMatch) return slugifyPart(agentMatch[1]);
  
  return 'unknown';
}

function extractTopic(fm: Record<string, unknown>, content: string): string {
  if (fm.topic && typeof fm.topic === 'string') {
    return slugifyPart(fm.topic as string, 40);
  }
  if (fm.title && typeof fm.title === 'string') {
    return slugifyPart(fm.title as string, 40);
  }
  // Try first H2 in content
  const h2Match = content.match(/^## (.+)$/m);
  if (h2Match) return slugifyPart(h2Match[1], 40);
  // Try first heading
  const h1Match = content.match(/^# (.+)$/m);
  if (h1Match) return slugifyPart(h1Match[1], 40);
  
  return 'session';
}

function slugifyPart(s: string, maxLen = 50): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen);
}

// ============================================================
// Frontmatter transformation
// ============================================================

function transformFrontmatter(
  original: Record<string, unknown>,
  vaultRelPath: string,
  wikiRelPath: string,
  wikiType: string
): Record<string, unknown> {
  const now = new Date().toISOString();
  
  const fm: Record<string, unknown> = {
    ...original,
    // Override / normalize key fields
    type: wikiType,
    // Add import tracking
    wiki_id: pathToId(wikiRelPath),
    imported_from: `vault/${vaultRelPath}`,
    imported_at: now,
  };

  // Normalize dates
  if (fm.created) fm.created = normalizeDate(fm.created);
  if (fm.updated) fm.updated = normalizeDate(fm.updated);

  // Normalize tags
  if (!fm.tags) {
    fm.tags = [];
  } else if (typeof fm.tags === 'string') {
    fm.tags = (fm.tags as string).split(/[,\s]+/).filter(Boolean);
  }

  // Add empty summary if missing (agents will fill later)
  if (!fm.summary) {
    fm.summary = '';
  }

  // Remap legacy type-specific fields
  if (wikiType === 'daily-note' && !fm.date) {
    // Try to extract date from filename
    const dateMatch = path.basename(vaultRelPath).match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) fm.date = dateMatch[1];
  }

  return fm;
}

function normalizeDate(val: unknown): string | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.split('T')[0];
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch {}
  }
  return String(val);
}

function pathToId(relPath: string): string {
  return relPath
    .replace(/\.md$/, '')
    .replace(/[^a-zA-Z0-9_/-]/g, '_');
}

// ============================================================
// Walk vault directory
// ============================================================

interface VaultFile {
  absolutePath: string;
  vaultRelPath: string;      // relative to vault root
  filename: string;
}

function walkVault(): VaultFile[] {
  const results: VaultFile[] = [];

  function walk(dir: string, relBase: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP_FOLDERS.has(entry.name) && !entry.name.startsWith('.')) {
          walk(path.join(dir, entry.name), path.join(relBase, entry.name));
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push({
          absolutePath: path.join(dir, entry.name),
          vaultRelPath: path.join(relBase, entry.name),
          filename: entry.name,
        });
      }
    }
  }

  walk(VAULT_ROOT, '');
  return results;
}

// ============================================================
// Migration record types
// ============================================================

interface MigrationRecord {
  source: string;
  dest: string;
  type: string;
  status: 'migrated' | 'skipped' | 'error' | 'dry-run' | 'renamed';
  note?: string;
  renamed?: boolean;
  originalFilename?: string;
}

interface MigrationReport {
  run_at: string;
  mode: string;
  source: string;
  dest: string;
  total_source: number;
  migrated: number;
  skipped: number;
  renamed: number;
  errors: number;
  skipped_folders: string[];
  records: MigrationRecord[];
}

// ============================================================
// Main migration runner
// ============================================================

async function runMigration(mode: 'dry-run' | 'migrate' | 'verify'): Promise<void> {
  console.log(`\nWiki Migration Tool — mode: ${mode}`);
  console.log(`Source: ${VAULT_ROOT}`);
  console.log(`Dest:   ${SPACES_ROOT}`);
  console.log('');

  if (mode === 'verify') {
    await runVerify();
    return;
  }

  const files = walkVault();
  console.log(`Found ${files.length} markdown files in vault (excluding skipped folders)\n`);

  const report: MigrationReport = {
    run_at: new Date().toISOString(),
    mode,
    source: VAULT_ROOT,
    dest: SPACES_ROOT,
    total_source: files.length,
    migrated: 0,
    skipped: 0,
    renamed: 0,
    errors: 0,
    skipped_folders: Array.from(SKIP_FOLDERS),
    records: [],
  };

  // Track dest paths to handle conflicts (idempotency)
  const seenDest = new Set<string>();

  for (const file of files) {
    try {
      const raw = fs.readFileSync(file.absolutePath, 'utf-8');
      let parsed: matter.GrayMatterFile<string>;
      try {
        parsed = matter(raw);
      } catch (_yamlErr) {
        // Bad YAML frontmatter — strip it and treat file as content-only
        const bodyStart = raw.indexOf('\n---', 3);
        const body = bodyStart > 0 ? raw.slice(bodyStart + 4).trim() : raw;
        parsed = { data: {}, content: body, orig: raw, language: 'yaml', matter: '', stringify: () => raw } as unknown as matter.GrayMatterFile<string>;
      }
      const fm = parsed.data as Record<string, unknown>;
      const content = parsed.content;

      // Determine type
      const wikiType = mapTypeFromPath(file.vaultRelPath, fm.type as string | undefined);

      // Normalize filename (UUID → human readable)
      const { newFilename, wasRenamed, renameReason } = normalizeFilename(
        file.filename,
        fm,
        content
      );

      // Determine target folder
      const targetFolder = mapTargetFolder(file.vaultRelPath, wikiType);
      
      // Build dest relative path
      let destRelPath = path.join(targetFolder, newFilename);

      // Conflict resolution: if path already seen, append suffix
      let finalDestRelPath = destRelPath;
      let suffix = 1;
      while (seenDest.has(finalDestRelPath)) {
        const ext = path.extname(newFilename);
        const base = path.basename(newFilename, ext);
        finalDestRelPath = path.join(targetFolder, `${base}-${suffix}${ext}`);
        suffix++;
      }
      seenDest.add(finalDestRelPath);

      // Transform frontmatter
      const newFm = transformFrontmatter(fm, file.vaultRelPath, finalDestRelPath, wikiType);

      const record: MigrationRecord = {
        source: file.vaultRelPath,
        dest: finalDestRelPath,
        type: wikiType,
        status: mode === 'dry-run' ? 'dry-run' : 'migrated',
        renamed: wasRenamed,
        originalFilename: wasRenamed ? file.filename : undefined,
        note: renameReason,
      };

      if (mode === 'migrate') {
        const destAbsolute = path.join(SPACES_ROOT, finalDestRelPath);

        // Check idempotency: skip if dest exists and source hasn't changed
        if (fs.existsSync(destAbsolute)) {
          const existingRaw = fs.readFileSync(destAbsolute, 'utf-8');
          const existingParsed = matter(existingRaw);
          if (existingParsed.data.imported_from === `vault/${file.vaultRelPath}`) {
            // Already migrated — update if source is newer
            const sourceStat = fs.statSync(file.absolutePath);
            const destStat = fs.statSync(destAbsolute);
            if (sourceStat.mtime <= destStat.mtime) {
              record.status = 'skipped';
              record.note = 'Already migrated, source not newer';
              report.skipped++;
              report.records.push(record);
              continue;
            }
          }
        }

        // Write the file
        fs.mkdirSync(path.dirname(destAbsolute), { recursive: true });
        const newRaw = matter.stringify(content, newFm);
        fs.writeFileSync(destAbsolute, newRaw, 'utf-8');
        
        report.migrated++;
        if (wasRenamed) report.renamed++;
      } else {
        // dry-run
        report.migrated++;
        if (wasRenamed) report.renamed++;
      }

      report.records.push(record);

      // Progress indicator every 50 files
      if ((report.migrated + report.skipped + report.errors) % 50 === 0) {
        process.stdout.write(`.`);
      }

    } catch (err) {
      report.errors++;
      report.records.push({
        source: file.vaultRelPath,
        dest: '',
        type: 'unknown',
        status: 'error',
        note: String(err),
      });
    }
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('MIGRATION REPORT');
  console.log('='.repeat(60));
  console.log(`Mode:     ${mode}`);
  console.log(`Total:    ${report.total_source} source files`);
  console.log(`Migrated: ${report.migrated}`);
  console.log(`Skipped:  ${report.skipped}`);
  console.log(`Renamed:  ${report.renamed} (UUID → human-readable)`);
  console.log(`Errors:   ${report.errors}`);
  console.log('');
  console.log('Type breakdown:');
  const typeCounts: Record<string, number> = {};
  for (const r of report.records) {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type.padEnd(20)} ${count}`);
  }

  if (report.errors > 0) {
    console.log('\nErrors:');
    for (const r of report.records.filter(r => r.status === 'error')) {
      console.log(`  ${r.source}: ${r.note}`);
    }
  }

  // Write report
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nReport written to: ${REPORT_PATH}`);
}

// ============================================================
// Verify mode — spot-check 20 random migrated pages
// ============================================================

async function runVerify(): Promise<void> {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error('No report.json found. Run --migrate first.');
    process.exit(1);
  }

  const report: MigrationReport = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  const migrated = report.records.filter(r => r.status === 'migrated');

  if (migrated.length === 0) {
    console.log('No migrated pages found in report.');
    return;
  }

  // Pick 20 random
  const sample = shuffleArray(migrated).slice(0, 20);

  console.log(`Verifying ${sample.length} random migrated pages...\n`);

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const record of sample) {
    const destAbsolute = path.join(SPACES_ROOT, record.dest);
    const sourceAbsolute = path.join(VAULT_ROOT, record.source);

    process.stdout.write(`  Checking: ${record.dest} ... `);

    // Check 1: dest file exists
    if (!fs.existsSync(destAbsolute)) {
      console.log('FAIL: dest file missing');
      failures.push(`${record.dest}: dest file missing`);
      failed++;
      continue;
    }

    // Check 2: source file still exists
    if (!fs.existsSync(sourceAbsolute)) {
      console.log('WARN: source file gone (moved/deleted)');
      // not a failure
    }

    // Check 3: frontmatter is valid
    const raw = fs.readFileSync(destAbsolute, 'utf-8');
    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter(raw);
    } catch (err) {
      console.log(`FAIL: frontmatter parse error: ${err}`);
      failures.push(`${record.dest}: frontmatter parse error`);
      failed++;
      continue;
    }

    const fm = parsed.data;

    // Check 4: required fields
    const checks: Array<[boolean, string]> = [
      [!!fm.title, 'has title'],
      [!!fm.type, 'has type'],
      [!!fm.wiki_id, 'has wiki_id'],
      [fm.imported_from === `vault/${record.source}`, 'imported_from matches source'],
      [!!fm.imported_at, 'has imported_at'],
    ];

    const checkFails = checks.filter(([ok]) => !ok).map(([, label]) => label);
    if (checkFails.length > 0) {
      console.log(`FAIL: ${checkFails.join(', ')}`);
      failures.push(`${record.dest}: ${checkFails.join(', ')}`);
      failed++;
    } else {
      console.log(`OK (type: ${fm.type})`);
      passed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Verify results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  ${f}`));
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ============================================================
// CLI entry point
// ============================================================

const args = process.argv.slice(2);
const mode = args.find(a => ['--dry-run', '--migrate', '--verify'].includes(a));

if (!mode) {
  console.error('Usage: ts-node migrate/migrate.ts [--dry-run | --migrate | --verify]');
  process.exit(1);
}

const modeMap: Record<string, 'dry-run' | 'migrate' | 'verify'> = {
  '--dry-run': 'dry-run',
  '--migrate': 'migrate',
  '--verify': 'verify',
};

runMigration(modeMap[mode]).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
