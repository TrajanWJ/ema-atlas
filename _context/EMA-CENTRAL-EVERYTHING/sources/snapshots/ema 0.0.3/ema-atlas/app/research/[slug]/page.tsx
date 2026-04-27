import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { SiteShell } from "@/components/site-shell";
import { loadMarkdown } from "@/lib/markdown";
import { decorate, loadGlossaryTerms } from "@/lib/text-decorate";

type ResearchDocPageProps = {
  params: Promise<{ slug: string }>;
};

function slugToRel(slug: string): string {
  // "parts--authority-control-plane" -> "parts/authority-control-plane.md"
  // "GLEAM_BEAM_FIT" -> "GLEAM_BEAM_FIT.md"
  const flat = slug.split("--").join("/");
  return `${flat}.md`;
}

/**
 * Tiny markdown -> JSX renderer. Handles:
 *   - ATX headings (#..######)
 *   - fenced code blocks (```lang ... ```)
 *   - block quotes (>)
 *   - unordered/ordered lists (-, *, 1.)
 *   - paragraphs with inline `code`, **bold**, *italic*, [text](href)
 * Anything more exotic falls through as a plain paragraph.
 *
 * No npm deps added; this lives only on this route.
 */

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "code"; lang: string; text: string }
  | { kind: "quote"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "p"; text: string }
  | { kind: "hr" };

function parseBlocks(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // fenced code
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push({ kind: "code", lang, text: buf.join("\n") });
      continue;
    }

    // blank
    if (!line.trim()) {
      i++;
      continue;
    }

    // hr
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push({ kind: "hr" });
      i++;
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (h) {
      out.push({ kind: "heading", level: h[1].length, text: h[2] });
      i++;
      continue;
    }

    // blockquote (collect consecutive)
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push({ kind: "quote", text: buf.join(" ") });
      continue;
    }

    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      out.push({ kind: "ul", items });
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push({ kind: "ol", items });
      continue;
    }

    // paragraph (collect until blank or block-starter)
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !lines[i].startsWith(">") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    out.push({ kind: "p", text: buf.join(" ") });
  }
  return out;
}

/**
 * Inline renderer: turns a string with `code`, **bold**, *italic*, [text](href)
 * into an array of React nodes. Tokenizes left-to-right; nesting is shallow.
 */
function renderInline(input: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Use a single regex with alternation; capture groups identify which form matched.
  const re =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) nodes.push(input.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      nodes.push(<code key={key++}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith("**")) {
      nodes.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("*")) {
      nodes.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith("[")) {
      const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        nodes.push(
          <a key={key++} href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>
        );
      } else {
        nodes.push(tok);
      }
    }
    last = m.index + tok.length;
  }
  if (last < input.length) nodes.push(input.slice(last));
  return nodes;
}

function renderBlocks(blocks: Block[], terms: string[]): ReactNode[] {
  // Auto-link glossary + Q-refs only inside paragraph and list-item text.
  // Headings, code blocks, and existing markdown links pass through
  // untouched (existing links/code become non-string ReactNodes from
  // renderInline and `decorate` only touches string fragments).
  const deco = (text: string) => decorate(renderInline(text), terms);
  return blocks.map((b, idx) => {
    switch (b.kind) {
      case "heading": {
        const level = Math.min(6, Math.max(1, b.level));
        const Tag = (`h${level}` as unknown) as keyof React.JSX.IntrinsicElements;
        return <Tag key={idx}>{renderInline(b.text)}</Tag>;
      }
      case "code":
        return (
          <pre key={idx}>
            <code className={b.lang ? `lang-${b.lang}` : undefined}>{b.text}</code>
          </pre>
        );
      case "quote":
        return <blockquote key={idx}>{deco(b.text)}</blockquote>;
      case "ul":
        return (
          <ul key={idx}>
            {b.items.map((it, i) => (
              <li key={i}>{deco(it)}</li>
            ))}
          </ul>
        );
      case "ol":
        return (
          <ol key={idx}>
            {b.items.map((it, i) => (
              <li key={i}>{deco(it)}</li>
            ))}
          </ol>
        );
      case "p":
        return <p key={idx}>{deco(b.text)}</p>;
      case "hr":
        return <hr key={idx} />;
    }
  });
}

export default async function ResearchDocPage({ params }: ResearchDocPageProps) {
  const { slug } = await params;
  const rel = slugToRel(slug);

  // Defense: forbid traversal slugs that escape the research/ root.
  if (rel.includes("..") || rel.startsWith("/")) {
    notFound();
  }

  const abs = path.join(process.cwd(), "research", rel);
  let md: string;
  try {
    await fs.access(abs);
    md = await loadMarkdown(path.join("research", rel));
  } catch {
    notFound();
  }

  const blocks = parseBlocks(md!);
  const terms = await loadGlossaryTerms();
  const name = path.basename(rel).replace(/\.md$/i, "");

  return (
    <SiteShell
      eyebrow="Research Document"
      title={name}
      intro={`research/${rel}`}
    >
      <section className="research-doc">{renderBlocks(blocks, terms)}</section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/research">
            All Research
          </Link>
          <Link className="chip" href="/parts">
            Parts
          </Link>
          <Link className="chip" href="/questions">
            Open Questions
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
