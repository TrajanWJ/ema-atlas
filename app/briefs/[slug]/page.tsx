import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { getPart } from "@/lib/ema-atlas";

type BriefPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BriefPage({ params }: BriefPageProps) {
  const { slug } = await params;
  const part = getPart(slug);

  if (!part) {
    notFound();
  }

  return (
    <SiteShell eyebrow="Print Brief" title={`${part.title} / Brief`} intro="This route is designed to be printable later as a PDF-style brief.">
      <article className="brief">
        <h2>{part.title}</h2>
        <p>{part.summary}</p>

        <h3>Current Hard Questions</h3>
        <ul>
          {part.hardQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>

        <h3>Three Future Takes</h3>
        {part.visions.map((vision) => (
          <section key={vision.id}>
            <h4>{vision.title}</h4>
            <p>{vision.stance}</p>
            <p>
              <strong>Bet:</strong> {vision.bet}
            </p>
            <p>
              <strong>Tension:</strong> {vision.tension}
            </p>
            <p>
              <strong>Question:</strong> {vision.question}
            </p>
          </section>
        ))}

        <h3>Lineage Inputs</h3>
        <ul>
          {part.branches.map((branch) => (
            <li key={branch}>{branch}</li>
          ))}
        </ul>
      </article>
    </SiteShell>
  );
}
