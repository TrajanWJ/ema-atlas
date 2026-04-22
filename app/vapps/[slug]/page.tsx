import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { SiteShell } from "@/components/site-shell";
import { loadMarkdown } from "@/lib/markdown";

import { partSlugByName, statusLabel, vapps } from "../_data";

type VAppDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Tiny markdown -> JSX renderer. Mirrors the pattern used by
 * app/research/[slug]/page.tsx so we don't add a new dep just to render
 * the briefs under content/vapps/.
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

function renderBlocks(blocks: Block[]): ReactNode[] {
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
        return <blockquote key={idx}>{renderInline(b.text)}</blockquote>;
      case "ul":
        return (
          <ul key={idx}>
            {b.items.map((it, i) => (
              <li key={i}>{renderInline(it)}</li>
            ))}
          </ul>
        );
      case "ol":
        return (
          <ol key={idx}>
            {b.items.map((it, i) => (
              <li key={i}>{renderInline(it)}</li>
            ))}
          </ol>
        );
      case "p":
        return <p key={idx}>{renderInline(b.text)}</p>;
      case "hr":
        return <hr key={idx} />;
    }
  });
}

export function generateStaticParams() {
  return vapps.map((v) => ({ slug: v.slug }));
}

export default async function VAppDetailPage({ params }: VAppDetailPageProps) {
  const { slug } = await params;

  const vapp = vapps.find((v) => v.slug === slug);
  if (!vapp) notFound();

  // Defense: forbid traversal slugs that escape the content/vapps/ root.
  if (slug.includes("..") || slug.includes("/") || slug.startsWith(".")) {
    notFound();
  }

  const rel = path.join("content", "vapps", `${slug}.md`);
  const abs = path.join(process.cwd(), rel);
  let md: string;
  try {
    await fs.access(abs);
    md = await loadMarkdown(rel);
  } catch {
    notFound();
  }

  const blocks = parseBlocks(md!);
  const kindLabel = vapp.group === "vapp" ? "vApp" : "Shell";

  return (
    <SiteShell
      eyebrow={`${kindLabel} brief`}
      title={vapp.name}
      intro={`content/vapps/${slug}.md`}
    >
      <section className="vapp-detail">
        <header className="vapp-detail__header">
          <div className="vapp-detail__header-row">
            <p className="list__eyebrow">{kindLabel}</p>
            <span className={`vapp-card__status vapp-card__status--${vapp.status}`}>
              {statusLabel(vapp.status)}
            </span>
          </div>
          <p className="vapp-detail__oneliner">{vapp.oneLiner}</p>
          <div className="vapp-detail__parts">
            <span className="panel__label">Expresses Part(s)</span>
            <div className="vapp-detail__chips">
              {vapp.parts.map((p) => {
                const partSlug = partSlugByName[p];
                return partSlug ? (
                  <Link className="chip" href={`/parts/${partSlug}`} key={p}>
                    {p}
                  </Link>
                ) : (
                  <span className="chip" key={p}>
                    {p}
                  </span>
                );
              })}
            </div>
          </div>
        </header>

        <article className="vapp-detail__body research-doc">
          {renderBlocks(blocks)}
        </article>
      </section>

      <section className="panel">
        <p className="panel__tag">Navigate</p>
        <div className="route-links">
          <Link className="chip" href="/vapps">
            All vApps
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
