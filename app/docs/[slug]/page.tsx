import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { SiteShell } from "@/components/site-shell";
import { loadMarkdown } from "@/lib/markdown";
import { decorate, loadGlossaryTerms } from "@/lib/text-decorate";
import { loadTiers, relToSlug } from "../_tiers";

type DocPageProps = {
  params: Promise<{ slug: string }>;
};

function slugToRel(slug: string): string {
  // "howto--add-a-branch" -> "howto/add-a-branch.md"
  // "README" -> "README.md"
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

    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push({ kind: "code", lang, text: buf.join("\n") });
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push({ kind: "hr" });
      i++;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (h) {
      out.push({ kind: "heading", level: h[1].length, text: h[2] });
      i++;
      continue;
    }

    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push({ kind: "quote", text: buf.join(" ") });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      out.push({ kind: "ul", items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push({ kind: "ol", items });
      continue;
    }

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

function renderInline(input: string): ReactNode[] {
  const nodes: ReactNode[] = [];
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

export default async function DocsDocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const rel = slugToRel(slug);
  const isSwarmDoc = rel.startsWith("content/swarm/");
  const swarmPack = [
    "content/swarm/README.md",
    "content/swarm/orchestration-kernel.md",
    "content/swarm/active-wave-current.md",
    "content/swarm/fresh-orchestrator-read-order.md",
    "content/swarm/continuous-progress-protocol.md",
    "content/swarm/orchestrator-alignment.md",
    "content/swarm/object-model.md",
    "content/swarm/vision-guardrails.md",
    "content/swarm/no-drift-rules.md",
  ].filter((entry) => entry !== rel);

  // Defense: forbid traversal slugs.
  if (rel.includes("..") || rel.startsWith("/") || rel.startsWith("\\")) {
    notFound();
  }

  // Build the allowed-path set from the tier registry. Slug must map to a
  // file the docs index already knows about — anything else 404s.
  const tiers = await loadTiers();
  const allowed = new Map<string, { tierLabel: string; tierTitle: string; name: string }>();
  for (const tier of tiers) {
    for (const f of tier.files) {
      allowed.set(f.rel, {
        tierLabel: tier.label,
        tierTitle: tier.title,
        name: f.name,
      });
    }
  }

  const meta = allowed.get(rel);
  if (!meta) notFound();

  // Belt-and-braces: confirm the resolved path stays inside repo root.
  const repoRoot = path.resolve(process.cwd());
  const abs = path.resolve(repoRoot, rel);
  if (!abs.startsWith(repoRoot + path.sep) && abs !== repoRoot) {
    notFound();
  }

  let md: string;
  try {
    await fs.access(abs);
    md = await loadMarkdown(rel);
  } catch {
    notFound();
  }

  const blocks = parseBlocks(md!);
  const terms = await loadGlossaryTerms();

  return (
    <SiteShell
      eyebrow={`${meta!.tierLabel} - ${meta!.tierTitle}`}
      title={meta!.name}
      intro={rel}
    >
      <section className="panel">
        <div className="route-links">
          <Link className="chip" href="/docs">
            Back to /docs
          </Link>
          {isSwarmDoc ? (
            <>
              <Link className="chip" href={`/docs/${relToSlug("content/swarm/README.md")}`}>
                Swarm Pack
              </Link>
              <Link className="chip" href={`/docs/${relToSlug("content/swarm/active-wave-current.md")}`}>
                Live Wave
              </Link>
            </>
          ) : null}
          <span className="chip chip--ghost">{meta!.tierLabel}</span>
          <span className="chip chip--ghost">{meta!.tierTitle}</span>
        </div>
      </section>

      <section className="research-doc">{renderBlocks(blocks, terms)}</section>

      {isSwarmDoc ? (
        <section className="panel">
          <p className="panel__tag">Swarm Pack / Continue Reading</p>
          <h2 className="panel__title">Stay inside the live coordination path.</h2>
          <p className="panel__lede">
            This document is part of the active swarm pack. Move through the kernel,
            live wave, and support docs directly here instead of re-deriving the
            control model from the whole atlas.
          </p>
          <div className="route-links">
            {swarmPack.map((entry) => (
              <Link className="chip" key={entry} href={`/docs/${relToSlug(entry)}`}>
                {entry.replace("content/swarm/", "").replace(/\.md$/i, "")}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/docs">
            All Docs
          </Link>
          <Link className="chip" href="/research">
            Research
          </Link>
          <Link className="chip" href="/parts">
            Parts
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
