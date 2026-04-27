import type { RawScrape } from '../normalize';

// LinkedIn job post parser. Works on both /jobs/view/<id> full pages and the
// in-feed card when the user has a job post highlighted.
export function parseLinkedIn(doc: Document, selection: string): RawScrape {
  const title =
    text(doc, '.job-details-jobs-unified-top-card__job-title') ||
    text(doc, 'h1.top-card-layout__title') ||
    text(doc, 'h1') ||
    doc.title.replace(/\s*\|\s*LinkedIn.*$/, '');

  const company =
    text(doc, '.job-details-jobs-unified-top-card__company-name a') ||
    text(doc, '.job-details-jobs-unified-top-card__company-name') ||
    text(doc, 'a.topcard__org-name-link') ||
    text(doc, '.topcard__flavor--black-link');

  const description =
    selection ||
    text(doc, '.jobs-description__content') ||
    text(doc, '.description__text') ||
    text(doc, 'article');

  const compensation =
    text(doc, '.job-details-jobs-unified-top-card__job-insight') ||
    firstMatch(description, /\$[\d,.kKmM\s\-to]+(?:\/(?:hr|yr))?/) ||
    '';

  const skills: string[] = [];
  doc
    .querySelectorAll('.job-details-skill-match-status-list li, .job-details-how-you-match__skills-item-subtitle')
    .forEach((el) => {
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
