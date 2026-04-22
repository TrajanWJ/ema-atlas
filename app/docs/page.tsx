import { SiteShell } from "@/components/site-shell";
import { docRegistry } from "@/lib/ema-atlas";

export default function DocsPage() {
  return (
    <SiteShell
      eyebrow="Local Knowledge Pack"
      title="EMA Docs"
      intro="The site sits at the center, but the markdown knowledge pack still matters. This route keeps the current working documents visible as first-class references."
    >
      <section className="doc-grid">
        {docRegistry.map((doc) => (
          <article className="panel list-card" key={doc.path}>
            <p className="panel__tag">{doc.kind}</p>
            <h2 className="list__title">{doc.title}</h2>
            <p className="list__copy">{doc.note}</p>
            <ul className="inline-list">
              <li>{doc.status}</li>
              {doc.feeds.map((feed) => (
                <li key={feed}>feeds {feed}</li>
              ))}
            </ul>
            <p className="list__copy">{doc.path}</p>
          </article>
        ))}
      </section>
    </SiteShell>
  );
}
