import type { RawScrape } from '../normalize';

// Upwork job detail parser. Layouts shift frequently so we rely on the text
// selection as a strong fallback.
export function parseUpwork(doc: Document, selection: string): RawScrape {
  const title =
    text(doc, 'h1.job-details-title, h1[data-test="job-title"], h1') ||
    doc.title.replace(/\s*-\s*Upwork.*$/, '');

  const company =
    text(doc, '[data-test="CompanyName"], [data-test="about-client-name"]') ||
    'Upwork Client';

  const description =
    selection ||
    text(doc, '[data-test="Description"], [data-test="job-description"], section.description') ||
    text(doc, 'article');

  const compensation =
    text(doc, '[data-test="BudgetAmount"], [data-test="fixed-price"], [data-test="hourly-rate"]') ||
    firstMatch(description, /\$[\d,.kKmM\s\-]+(?:\/\s*hr)?/) ||
    '';

  const skills: string[] = [];
  doc
    .querySelectorAll('[data-test="Skill"] span, [data-test="JobAttributes"] span')
    .forEach((el) => {
      const t = el.textContent?.trim();
      if (t && t.length < 40) skills.push(t);
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
