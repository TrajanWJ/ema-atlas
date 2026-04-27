import { promises as fs } from "node:fs";
import path from "node:path";
import React, { Fragment, ReactNode } from "react";
import Link from "next/link";

/**
 * Auto-link helpers for the atlas markdown renderers.
 *
 * Implements ATLAS_NOTES.md "Render rules" #4 and #5:
 *   - glossary terms in body prose -> /docs/GLOSSARY#<term-slug>
 *   - "Q<n>" references            -> /questions#Q<n>
 *
 * The functions are pure and operate on plain text fragments only. The
 * markdown renderers are responsible for *not* feeding code blocks,
 * existing markdown links, or headings into them.
 */

// ---------- term-slug ----------

/**
 * Slugify a glossary term for use as a fragment id under /docs/GLOSSARY.
 * Mirrors the kind of slug the docs page would emit for a heading.
 *
 *   "EMA daemon"            -> "ema-daemon"
 *   "place.org / placeOS"   -> "place-org-placeos"
 *   "Space (typed taxonomy)"-> "space-typed-taxonomy"
 */
export function termSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------- regex utilities ----------

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isWordChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return /[A-Za-z0-9]/.test(ch);
}

// ---------- glossary decoration ----------

/**
 * Split `text` on case-insensitive whole-word matches of any of `terms`.
 * Each match becomes a <Link> to /docs/GLOSSARY#<slug>; the original
 * casing in `text` is preserved.
 *
 * Terms shorter than 3 characters are skipped to avoid noise.
 * Longest terms are matched first so "EMA daemon" wins over "EMA".
 */
export function decorateGlossaryTerms(
  text: string,
  terms: string[],
  keyPrefix = "g"
): ReactNode[] {
  if (!text) return [text];
  const usable = terms
    .filter((t) => t && t.length >= 3)
    .slice()
    .sort((a, b) => b.length - a.length);
  if (usable.length === 0) return [text];

  const pattern = usable.map(escapeRegex).join("|");
  const re = new RegExp(`(?:${pattern})`, "gi");

  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    // Whole-word guard: the chars on either side must not be word chars.
    const before = start > 0 ? text[start - 1] : undefined;
    const after = end < text.length ? text[end] : undefined;
    if (isWordChar(before) || isWordChar(after)) {
      // Advance one character to avoid infinite loop on zero-width edge cases.
      if (re.lastIndex === start) re.lastIndex = start + 1;
      continue;
    }
    if (start > last) out.push(text.slice(last, start));
    const surface = text.slice(start, end);
    // Resolve to the canonical term casing by case-insensitive compare —
    // the slug is built from the canonical form so the fragment is stable.
    const canonical =
      usable.find((t) => t.toLowerCase() === surface.toLowerCase()) ?? surface;
    out.push(
      React.createElement(
        Link,
        {
          key: `${keyPrefix}-${key++}`,
          href: `/docs/GLOSSARY#${termSlug(canonical)}`,
          className: "auto-link auto-link--glossary",
        },
        surface
      )
    );
    last = end;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length > 0 ? out : [text];
}

// ---------- question decoration ----------

/**
 * Wrap "Q<n>" references in <Link> to /questions#Q<n>. Only matches when
 * the reference is a stand-alone token (not part of a larger word).
 */
export function decorateQuestionRefs(
  nodes: ReactNode[],
  keyPrefix = "q"
): ReactNode[] {
  const re = /Q(\d+)\b/g;
  const out: ReactNode[] = [];
  let key = 0;
  for (const node of nodes) {
    if (typeof node !== "string") {
      out.push(node);
      continue;
    }
    const text = node;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      const before = start > 0 ? text[start - 1] : undefined;
      if (isWordChar(before)) continue;
      if (start > last) out.push(text.slice(last, start));
      const n = m[1];
      out.push(
        React.createElement(
          Link,
          {
            key: `${keyPrefix}-${key++}`,
            href: `/questions#Q${n}`,
            className: "auto-link auto-link--question",
          },
          `Q${n}`
        )
      );
      last = end;
    }
    if (last < text.length) out.push(text.slice(last));
    // reset the regex state for the next string node
    re.lastIndex = 0;
  }
  return out;
}

// ---------- combined ----------

/**
 * Combined decoration pass. Accepts either a plain string OR a node list
 * already produced by an inline-markdown renderer. Glossary + question
 * decoration is applied to string fragments only — existing link/code/
 * strong/em React nodes are passed through untouched, which is how we
 * avoid double-linking inside an existing markdown link or `<code>`.
 */
export function decorate(
  input: string | ReactNode[],
  terms: string[]
): ReactNode[] {
  const nodes: ReactNode[] = Array.isArray(input) ? input : [input];
  const afterGlossary: ReactNode[] = [];
  let gKey = 0;
  for (const node of nodes) {
    if (typeof node === "string") {
      const decorated = decorateGlossaryTerms(node, terms, `g${gKey++}`);
      for (const d of decorated) afterGlossary.push(d);
    } else {
      afterGlossary.push(node);
    }
  }
  return decorateQuestionRefs(afterGlossary);
}

// ---------- glossary loader ----------

/**
 * Parse GLOSSARY.md and return every term name from both the canonical
 * table and the vault-candidate table. Terms appear as the first cell of
 * each table row, wrapped in `**bold**`.
 *
 * Pure file read — safe to call from build-time (RSC) code paths.
 */
export async function loadGlossaryTerms(): Promise<string[]> {
  const abs = path.join(process.cwd(), "GLOSSARY.md");
  const md = await fs.readFile(abs, "utf8");
  const terms: string[] = [];
  const seen = new Set<string>();
  // Match table rows whose first cell is **Term**.
  const rowRe = /^\|\s*\*\*([^*|]+)\*\*\s*\|/gm;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(md)) !== null) {
    const term = m[1].trim();
    if (!term) continue;
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    terms.push(term);
  }
  return terms;
}

// Re-export Fragment for callers that want a plain wrapper.
export { Fragment };
