import type { RawScrape } from '../normalize';

// Lever public job page parser. URL shape: jobs.lever.co/<company>/<id>
export function parseLever(doc: Document, selection: string): RawScrape {
  const title =
    text(doc, '.posting-headline h2, h2[data-qa="posting-name"]') ||
    text(doc, 'h2') ||
    doc.title;

  // Lever puts the company in the page header; fall back to hostname segment.
  const headerCompany = text(doc, '.main-header-logo img') || text(doc, '.main-header-text a');
  const hostSegment = location.pathname.split('/').filter(Boolean)[0] ?? '';
  const company = headerCompany || capitalize(hostSegment);

  const description =
    selection ||
    text(doc, '.section-wrapper .section[data-qa="job-description"]') ||
    text(doc, '.content .section.page-centered') ||
    text(doc, 'main');

  const compensation =
    text(doc, '.posting-categories .commitment, .posting-categories .location') ||
    firstMatch(description, /\$[\d,.kKmM\s\-to]+/) ||
    '';

  const skills: string[] = [];
  doc.querySelectorAll('.posting-categories .posting-category').forEach((el) => {
    const t = el.textContent?.trim();
    if (t) skills.push(t);
  });

  return {
    title: title.trim(),
    company: company.trim(),
    description: description.trim(),
    compensation,
    skills,
  };
}

function text(doc: Document, sel: string): string {
  const el = doc.querySelector(sel);
  return el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}
function firstMatch(s: string, re: RegExp): string {
  const m = re.exec(s);
  return m ? m[0] : '';
}
function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
