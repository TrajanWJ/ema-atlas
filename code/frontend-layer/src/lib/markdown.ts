import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import python from "highlight.js/lib/languages/python";
import markdown from "highlight.js/lib/languages/markdown";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);

/** Parse YAML frontmatter from markdown content */
export function parseFrontmatter(text: string): { frontmatter: Record<string, string> | null; content: string } {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { frontmatter: null, content: text };

  const yamlBlock = match[1];
  const content = match[2];
  const frontmatter: Record<string, string> = {};

  for (const line of yamlBlock.split("\n")) {
    const kv = line.match(/^(\w[\w\s-]*):\s*(.+)$/);
    if (kv) {
      frontmatter[kv[1].trim()] = kv[2].trim();
    }
  }

  return { frontmatter: Object.keys(frontmatter).length > 0 ? frontmatter : null, content };
}

/** Status key color map */
const STATUS_COLORS: Record<string, string> = {
  active: "#22C55E",
  draft: "#EAB308",
  archived: "#888888",
  deprecated: "#EF4444",
  review: "#3B82F6",
  done: "#22C55E",
  shipped: "#22C55E",
  blocked: "#EF4444",
  idea: "#A855F7",
};

/** Render frontmatter as HTML metadata bar with individual pills */
export function renderFrontmatterHtml(fm: Record<string, string>): string {
  const pills = Object.entries(fm).map(([k, v]) => {
    const key = k.toLowerCase();
    const cleanVal = v.replace(/^["']|["']$/g, "");

    // Status gets a colored dot
    if (key === "status") {
      const color = STATUS_COLORS[cleanVal.toLowerCase()] || "#888888";
      return `<span class="fm-pill fm-status"><span class="fm-dot" style="background:${color};box-shadow:0 0 4px ${color}"></span><span class="fm-key">${escapeHtml(k)}</span><span class="fm-value">${escapeHtml(cleanVal)}</span></span>`;
    }

    // Tags get split into sub-pills
    if (key === "tags") {
      const tags = cleanVal.replace(/^\[|\]$/g, "").split(",").map(t => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      const tagHtml = tags.map(t => `<span class="fm-tag">${escapeHtml(t)}</span>`).join("");
      return `<span class="fm-pill fm-tags-pill"><span class="fm-key">${escapeHtml(k)}</span>${tagHtml}</span>`;
    }

    return `<span class="fm-pill"><span class="fm-key">${escapeHtml(k)}</span><span class="fm-value">${escapeHtml(cleanVal)}</span></span>`;
  }).join("");

  return `<div class="frontmatter-bar">${pills}</div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Minimal markdown to HTML renderer — no dependencies */
export function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const trimmed = code.trim();
    let highlighted: string;
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(trimmed, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(trimmed).value;
    }
    const langLabel = lang ? `<span class="code-lang-label">${escapeHtml(lang)}</span>` : "";
    return `<pre>${langLabel}<code class="hljs language-${lang || "auto"}">${highlighted}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Wiki-links [[Something]] → clickable vault links
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<a class="wiki-link" data-wiki="$1" href="#">$1</a>');

  // Paragraphs - wrap loose lines
  html = html.replace(/^(?!<[a-z])((?!<).+)$/gm, "<p>$1</p>");

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
}

/** Render markdown with frontmatter handling */
export function renderMarkdownWithFrontmatter(text: string): string {
  const { frontmatter, content } = parseFrontmatter(text);
  const fmHtml = frontmatter ? renderFrontmatterHtml(frontmatter) : "";
  return fmHtml + renderMarkdown(content);
}
