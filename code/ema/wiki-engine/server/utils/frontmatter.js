const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const VAULT_ROOT = '/home/trajan/vault';

/**
 * Read a markdown file and parse frontmatter
 */
function readMarkdownFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    return {
      frontmatter: parsed.data || {},
      content: parsed.content || '',
    };
  } catch (err) {
    return { frontmatter: {}, content: '' };
  }
}

/**
 * Write a wiki page back to the filesystem as markdown + frontmatter
 */
function writeMarkdownFile(filePath, { frontmatter, content }) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const raw = matter.stringify(content || '', frontmatter || {});
  fs.writeFileSync(filePath, raw, 'utf8');
}

/**
 * Get the vault file path for a wiki page path
 */
function wikiPathToFilePath(wikiPath) {
  return path.join(VAULT_ROOT, wikiPath + '.md');
}

/**
 * Infer page type from vault folder path
 */
function inferTypeFromPath(relativePath) {
  const parts = relativePath.split('/');
  const folder = parts[0] || '';
  
  const folderTypeMap = {
    'Projects': 'project',
    'Research': 'research',
    'Daily Notes': 'meeting',
    'Decisions': 'decision',
    'System': 'config',
    'Codebases': 'codebase',
    'Skills': 'knowledge',
    'Agent Knowledge': 'knowledge',
    'Agent-Learnings': 'knowledge',
    'Agents': 'knowledge',
    'Architecture': 'knowledge',
    'Operations': 'knowledge',
    'Ops': 'knowledge',
    'Reference': 'knowledge',
    'Resources': 'knowledge',
    'Reports': 'research',
    'Security': 'knowledge',
    'Tools': 'knowledge',
    'Templates': 'config',
    'Trajan': 'knowledge',
    'Courses': 'knowledge',
    'LCM Summaries': 'meeting',
    'Session Summaries': 'meeting',
    'Media': 'knowledge',
    'Learnings & Gotchas': 'knowledge',
    'Inbox': 'knowledge',
    '_hubs': 'knowledge',
    '_deprecated': 'knowledge',
    'ontology': 'config',
  };
  
  // Check filename patterns for sub-type inference
  const filename = parts[parts.length - 1] || '';
  if (/sprint/i.test(filename)) return 'sprint';
  if (/intent|\.superman/i.test(filename)) return 'intent';
  
  return folderTypeMap[folder] || 'knowledge';
}

/**
 * Infer project from path
 */
function inferProjectFromPath(relativePath) {
  const parts = relativePath.split('/');
  if (parts[0] === 'Projects' && parts.length >= 2) {
    return parts[1];
  }
  return null;
}

module.exports = {
  readMarkdownFile,
  writeMarkdownFile,
  wikiPathToFilePath,
  inferTypeFromPath,
  inferProjectFromPath,
  VAULT_ROOT,
};
