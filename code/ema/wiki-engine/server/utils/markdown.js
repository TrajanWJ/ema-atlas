/**
 * Markdown + wikilink utilities
 */

// Extract [[wikilinks]] from markdown content
function extractWikilinks(content) {
  if (!content) return [];
  const regex = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  const links = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return [...new Set(links)];
}

// Convert wikilinks to markdown links in rendered output
function resolveWikilinks(content, pathResolver) {
  if (!content) return '';
  return content.replace(
    /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g,
    (match, pageName, anchor, displayText) => {
      const display = displayText || pageName;
      const path = pathResolver ? pathResolver(pageName) : `/p/${encodeURIComponent(pageName)}`;
      const hash = anchor ? `#${anchor}` : '';
      return `[${display}](${path}${hash})`;
    }
  );
}

// Slugify a string for use in paths
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate a wiki path from a file path
function vaultPathToWikiPath(filePath, vaultRoot) {
  const relative = filePath.startsWith(vaultRoot) 
    ? filePath.slice(vaultRoot.length) 
    : filePath;
  return relative
    .replace(/^\//, '')
    .replace(/\.md$/, '')
    .trim();
}

// Extract title from markdown content (first H1)
function extractH1(content) {
  if (!content) return null;
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// Generate excerpt (first 200 chars of content, stripped of markdown)
function generateExcerpt(content, maxLen = 200) {
  if (!content) return '';
  const stripped = content
    .replace(/^#{1,6}\s+.+$/gm, '')  // Remove headings
    .replace(/\[\[([^\]]+)\]\]/g, '$1')  // Unwrap wikilinks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Unwrap links
    .replace(/[*_`~]+/g, '')  // Remove formatting
    .replace(/\n+/g, ' ')  // Collapse newlines
    .trim();
  return stripped.length > maxLen ? stripped.slice(0, maxLen) + '…' : stripped;
}

module.exports = {
  extractWikilinks,
  resolveWikilinks,
  slugify,
  vaultPathToWikiPath,
  extractH1,
  generateExcerpt,
};
